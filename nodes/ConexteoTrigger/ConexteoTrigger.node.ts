/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHmac, timingSafeEqual } from 'crypto';
import {
	IDataObject,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
} from 'n8n-workflow';

// Webhooks signés Conexteo :
//   X-Conexteo-Signature  : v1=<HMAC-SHA256 hexadécimal>
//   X-Conexteo-Timestamp  : heure Unix en secondes
//   X-Conexteo-Webhook-Id : identique entre les tentatives d'un même événement
//   Chaîne signée         : timestamp + "." + corps brut
//   Clé                   : le secret whsec_… tel quel, préfixe compris
const SIGNATURE_PREFIX = 'v1=';
const TOLERANCE_SECONDS = 300;

function headerValue(headers: IDataObject, name: string): string {
	const value = headers[name];
	return String(Array.isArray(value) ? (value[0] ?? '') : (value ?? '')).trim();
}

/** Renvoie la raison du refus, ou une chaîne vide si la signature est valide. */
function checkSignature(rawBody: Buffer, headers: IDataObject, secret: string): string {
	const provided = headerValue(headers, 'x-conexteo-signature');
	const timestamp = headerValue(headers, 'x-conexteo-timestamp');
	if (!provided) {
		return 'Missing X-Conexteo-Signature header (is signed mode enabled in Conexteo?)';
	}
	if (!/^\d{1,11}$/.test(timestamp)) {
		return 'Missing or invalid X-Conexteo-Timestamp header';
	}
	if (Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > TOLERANCE_SECONDS) {
		return 'Webhook timestamp out of tolerance';
	}
	if (!provided.startsWith(SIGNATURE_PREFIX)) {
		return 'Unsupported signature version';
	}
	const expected = Buffer.from(
		createHmac('sha256', secret).update(`${timestamp}.`).update(rawBody).digest('hex'),
		'utf8',
	);
	const received = Buffer.from(provided.slice(SIGNATURE_PREFIX.length).toLowerCase(), 'utf8');
	if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
		return 'Signature mismatch';
	}
	return '';
}

function isObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class ConexteoTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Conexteo Trigger',
		name: 'conexteoTrigger',
		icon: 'file:conexteo.svg',
		group: ['trigger'],
		version: 1,
		usableAsTool: true,
		subtitle: '={{$parameter["eventType"]}}',
		description:
			'Démarre le workflow à la réception d\'une réponse SMS/RCS, d\'un accusé de réception SMS ou d\'un statut RCS',
		defaults: {
			name: 'Conexteo Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'conexteoApi',
				required: false,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName:
					'ℹ️ Copiez l\'URL de Test ou de Production générée par n8n et collez-la dans votre espace Conexteo (Développeurs > Webhooks), dans le champ correspondant au type d\'événement choisi ci-dessous. Activez le mode signé, puis collez le secret whsec_… affiché dans le champ « Secret de signature des webhooks » de l\'identifiant Conexteo API rattaché à ce nœud : les webhooks signés sont réessayés en cas d\'échec, authentifiés, et plus détaillés (clics sur les boutons RCS, statuts RCS).',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Type D\'événement',
				name: 'eventType',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Accusé De Réception SMS',
						value: 'ack_sms',
						description: 'SMS remis ou en échec',
					},
					{
						name: 'Réponse SMS/RCS',
						value: 'reply',
						description: 'Réponse d\'un client, clic sur un bouton RCS compris',
					},
					{
						name: 'Statut RCS',
						value: 'ack_rcs',
						description: 'RCS remis, lu, en échec ou basculé en SMS (mode signé uniquement)',
					},
					{
						name: 'Tous',
						value: 'all',
						description: 'Si la même URL est collée dans plusieurs champs de Conexteo',
					},
				],
				default: 'reply',
			},
			{
				displayName: 'Filtre De Mots-Clés',
				name: 'keywords',
				type: 'string',
				displayOptions: { show: { eventType: ['reply', 'all'] } },
				default: '',
				description:
					'Déclenche le workflow uniquement si la réponse (texte, libellé du bouton ou valeur postback) contient un de ces mots. Séparez par des virgules (ex: OUI, STOP, INFO). Laissez vide pour tout recevoir.',
			},
			{
				displayName: 'Ignorer Les Statuts Intermédiaires',
				name: 'skipIntermediate',
				type: 'boolean',
				displayOptions: { show: { eventType: ['ack_sms', 'all'] } },
				default: true,
				description:
					'Whether to ignore the intermediate operator statuses of an SMS (neither delivered nor failed)',
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData() as any;
		const headers = this.getHeaderData() as unknown as IDataObject;
		const eventType = this.getNodeParameter('eventType', 'reply') as string;
		const keywordsString = this.getNodeParameter('keywords', '') as string;

		// --- Signature (uniquement si un secret est renseigné) ---
		let secret = '';
		try {
			const credentials = await this.getCredentials('conexteoApi');
			secret = String(credentials?.signingSecret ?? '').trim();
		} catch {
			// Aucun identifiant rattaché : webhook non signé accepté.
		}

		let verified = false;
		if (secret) {
			const req = this.getRequestObject() as any;
			const rawBody: Buffer = Buffer.isBuffer(req.rawBody)
				? req.rawBody
				: Buffer.from(JSON.stringify(bodyData ?? {}), 'utf8');
			const refusal = checkSignature(rawBody, headers, secret);
			if (refusal) {
				this.getResponseObject().status(401).json({ error: refusal });
				return { noWebhookResponse: true };
			}
			verified = true;
		}

		// Si le serveur Conexteo nous envoie une requête vide, on l'ignore
		if (!bodyData || (isObject(bodyData) && Object.keys(bodyData).length === 0)) {
			return {};
		}

		// --- Normalisation ---
		// Format signé : { id, type, event, created_at, data: { ... } }
		// Ancien format (non signé) : réponses dans un tableau "data", ou objet à plat.
		const isEnvelope = isObject(bodyData.data) && typeof bodyData.event === 'string';
		let items: IDataObject[];
		let webhookType = '';

		if (isEnvelope) {
			webhookType = String(bodyData.type ?? '');
			items = [
				{
					...(bodyData.data as IDataObject),
					event: bodyData.event,
					webhook_type: webhookType,
					webhook_id: bodyData.id ?? headerValue(headers, 'x-conexteo-webhook-id'),
					created_at: bodyData.created_at ?? null,
					signature_verified: verified,
				},
			];
		} else {
			webhookType = typeof bodyData.type === 'string' ? bodyData.type : '';
			items = (Array.isArray(bodyData.data) ? bodyData.data : [bodyData]).filter(isObject);
		}

		// --- Filtre par type ---
		if (eventType !== 'all' && webhookType && webhookType !== eventType) {
			return {};
		}

		// --- Statuts opérateur intermédiaires d'un SMS (ni remis, ni en échec) ---
		if (webhookType === 'ack_sms' && this.getNodeParameter('skipIntermediate', true)) {
			items = items.filter(
				(item) => item.event === 'sms.submit_ko' || Number(item.deliver) === 1 || Number(item.deliver) === 2,
			);
		}

		// --- Filtre de mots-clés (réponses uniquement) ---
		const isReply = webhookType ? webhookType === 'reply' : eventType !== 'ack_sms' && eventType !== 'ack_rcs';
		if (keywordsString && isReply) {
			const keywords = keywordsString
				.split(',')
				.map((k: string) => k.trim().toLowerCase())
				.filter((k: string) => k !== '');
			if (keywords.length > 0) {
				items = items.filter((item) => {
					// Un clic sur un bouton RCS porte parfois son libellé dans choice_label seulement.
					const text = [item.content, item.choice_label, item.postback_data]
						.filter((v) => typeof v === 'string')
						.join('\n')
						.toLowerCase();
					return text !== '' && keywords.some((keyword: string) => text.includes(keyword));
				});
			}
		}

		if (items.length === 0) {
			return {};
		}

		// On lance le workflow !
		return {
			workflowData: [this.helpers.returnJsonArray(items)],
		};
	}
}
