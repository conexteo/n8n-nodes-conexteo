import {
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	IDataObject,
} from 'n8n-workflow';

export class ConexteoTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Conexteo Trigger',
		name: 'conexteoTrigger',
		icon: 'file:conexteo.svg',
		group: ['trigger'],
		version: 1,
		usableAsTool: true,
		description: 'Démarre le workflow à la réception d\'une réponse SMS/RCS',
		defaults: {
			name: 'Conexteo Trigger',
		},
		inputs: [],
		outputs: ['main'],
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
				displayName: 'ℹ️ Copiez l\'URL de Test ou de Production générée par n8n et collez-la dans la section "Webhook > Réponses > POST" de votre espace Conexteo.',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Filtre De Mots-Clés',
				name: 'keywords',
				type: 'string',
				default: '',
				description: 'Déclenche le workflow uniquement si la réponse contient un de ces mots. Séparez par des virgules (ex: OUI, STOP, INFO). Laissez vide pour tout recevoir.',
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		// Utilisation de la méthode standard n8n pour récupérer le JSON
		const bodyData = this.getBodyData() as IDataObject;
		const keywordsString = this.getNodeParameter('keywords', '') as string;

		// Si le serveur Conexteo nous envoie une requête vide, on l'ignore
		if (!bodyData) {
			return {};
		}

		// Logique de filtrage (uniquement si l'utilisateur a tapé des mots clés)
		if (keywordsString) {
			const keywords = keywordsString.split(',').map((k: string) => k.trim().toLowerCase());
			
			// On cherche le texte du message dans le "colis" Conexteo
			let messageContent = '';
			if (bodyData.data && bodyData.data.length > 0 && bodyData.data[0].content) {
				messageContent = bodyData.data[0].content.toLowerCase();
			} else if (bodyData.content) {
				messageContent = bodyData.content.toLowerCase();
			}

			// Si on a bien trouvé du texte, on vérifie s'il contient le mot clé
			if (messageContent) {
				const matches = keywords.some((keyword: string) => messageContent.includes(keyword));
				if (!matches) {
					return {}; // Le mot clé n'y est pas, on bloque l'exécution
				}
			} else {
				// Si on ne trouve pas de texte du tout mais qu'un filtre est actif, on bloque par sécurité
				return {};
			}
		}

		// On extrait les données utiles pour les afficher proprement dans n8n
		// (Conexteo met souvent les réponses dans un tableau "data")
		const returnData = (bodyData.data && Array.isArray(bodyData.data)) ? bodyData.data : [bodyData];

		// On lance le workflow !
		return {
			workflowData: [
				this.helpers.returnJsonArray(returnData),
			],
		};
	}
}