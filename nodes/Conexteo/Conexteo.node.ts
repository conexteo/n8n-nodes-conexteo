/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	IDataObject,
} from 'n8n-workflow';

export class Conexteo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Conexteo',
		name: 'conexteo',
		icon: 'file:conexteo.svg',
		group: ['transform'],
		version: 1,
		usableAsTool: true,
		subtitle: '={{$parameter["operation"] ? $parameter["operation"] : $parameter["operationContact"] + " : " + $parameter["resource"]}}',
		description: 'Interagit avec l\'API Conexteo (SMS, RCS et Contacts)',
		defaults: { name: 'Conexteo' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{ name: 'conexteoApi', required: true },
		],
		requestDefaults: {
			baseURL: 'https://api.conexteo.com',
			headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'SMS', value: 'sms' },
					{ name: 'RC', value: 'rcs' },
					{ name: 'Contact', value: 'contact' },
				],
				default: 'sms',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: { resource: ['sms', 'rcs'] },
				},
				options: [
					{ name: 'Send', value: 'send', action: 'Send a message' },
				],
				default: 'send',
			},
			{
				displayName: 'Operation',
				name: 'operationContact',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: { resource: ['contact'] },
				},
				options: [
					{ name: 'Créer Une Liste', value: 'createList', description: 'Crée une nouvelle liste de diffusion' },
					{ name: 'Ajouter/Mettre À Jour Un Contact', value: 'upsertContact', description: 'Ajoute un contact dans une liste existante' },
				],
				default: 'upsertContact',
			},

			// ==========================================
			// BLOC : CONTACTS
			// ==========================================
			{
				displayName: 'Nom De La Liste',
				name: 'listName',
				type: 'string',
				displayOptions: { show: { resource: ['contact'], operationContact: ['createList'] } },
				default: '',
				required: true,
			},
			{
				displayName: 'ID De La Liste',
				name: 'listId',
				type: 'number',
				displayOptions: { show: { resource: ['contact'], operationContact: ['upsertContact'] } },
				default: '',
				required: true,
				description: 'L\'identifiant de la liste (ex: 1234) obtenu lors de la création',
			},
			{
				displayName: 'Numéro De Téléphone',
				name: 'contactPhone',
				type: 'string',
				displayOptions: { show: { resource: ['contact'], operationContact: ['upsertContact'] } },
				default: '',
				required: true,
			},
			{
				displayName: 'Nom (Optionnel)',
				name: 'contactName',
				type: 'string',
				displayOptions: { show: { resource: ['contact'], operationContact: ['upsertContact'] } },
				default: '',
			},
			{
				displayName: 'Prénom (Optionnel)',
				name: 'contactFirstName',
				type: 'string',
				displayOptions: { show: { resource: ['contact'], operationContact: ['upsertContact'] } },
				default: '',
			},

			// ==========================================
			// BLOC : RECIPIENT (Commun SMS & RCS)
			// ==========================================
			{
				displayName: 'Recipient Phone Number',
				name: 'recipient',
				type: 'string',
				displayOptions: { show: { resource: ['sms', 'rcs'], operation: ['send'] } },
				default: '',
				description: 'Numéro de téléphone du destinataire (ex: +33612345678)',
			},

			// ==========================================
			// BLOC : SMS CLASSIQUE
			// ==========================================
			{
				displayName: 'Message Content',
				name: 'contentSms',
				type: 'string',
				typeOptions: { rows: 4 },
				displayOptions: { show: { resource: ['sms'], operation: ['send'] } },
				default: '',
				description: 'Max 2000 caractères',
			},
			{
				displayName: 'Sender ID',
				name: 'senderSms',
				type: 'string',
				displayOptions: { show: { resource: ['sms'], operation: ['send'] } },
				default: '',
			},
			{
				displayName: 'Ajouter La Mention STOP',
				name: 'addStopMentionSms',
				type: 'boolean',
				displayOptions: { show: { resource: ['sms'], operation: ['send'] } },
				default: false,
			},
			{
				displayName: 'ℹ️ " #STOP_XXX#" sera ajouté.',
				name: 'noticeStopSms',
				type: 'notice',
				displayOptions: { show: { resource: ['sms'], operation: ['send'], addStopMentionSms: [true] } },
				default: '',
			},

			// ==========================================
			// BLOC : MENU RCS
			// ==========================================
			{
				displayName: 'Type De Message RCS',
				name: 'rcsMessageType',
				type: 'options',
				displayOptions: { show: { resource: ['rcs'], operation: ['send'] } },
				options: [
					{ name: 'Texte Simple', value: 'text' },
					{ name: 'Rich Card', value: 'card' },
					{ name: 'Carrousel', value: 'carousel' },
				],
				default: 'text',
			},
			
			// --- RCS TEXTE ---
			{
				displayName: 'Message Content',
				name: 'contentRcsText',
				type: 'string',
				typeOptions: { rows: 4 },
				displayOptions: { show: { resource: ['rcs'], operation: ['send'], rcsMessageType: ['text'] } },
				default: '',
			},
			{
				displayName: 'Ajouter La Mention STOP (RCS)',
				name: 'addStopMentionRcs',
				type: 'boolean',
				displayOptions: { show: { resource: ['rcs'], operation: ['send'], rcsMessageType: ['text'] } },
				default: false,
			},

			// --- RCS CARD ---
			{
				displayName: 'Card Title',
				name: 'cardTitle',
				type: 'string',
				displayOptions: { show: { resource: ['rcs'], operation: ['send'], rcsMessageType: ['card'] } },
				default: '',
			},
			{
				displayName: 'Card Description',
				name: 'cardDescription',
				type: 'string',
				typeOptions: { rows: 2 },
				displayOptions: { show: { resource: ['rcs'], operation: ['send'], rcsMessageType: ['card'] } },
				default: '',
			},
			{
				displayName: 'Image URL',
				name: 'cardMediaUrl',
				type: 'string',
				displayOptions: { show: { resource: ['rcs'], operation: ['send'], rcsMessageType: ['card'] } },
				default: '',
			},
			{
				displayName: 'Boutons (CTA)',
				name: 'cardButtons',
				type: 'fixedCollection',
				placeholder: 'Add a CTA',
				typeOptions: { multipleValues: true },
				displayOptions: { show: { resource: ['rcs'], operation: ['send'], rcsMessageType: ['card'] } },
				default: {},
				options: [{
					name: 'button', displayName: 'Bouton', values: [
						{ displayName: 'Type', name: 'type', type: 'options', options: [{ name: 'URL', value: 'url' }, { name: 'Appel', value: 'call' }], default: 'url' },
						{ displayName: 'Titre', name: 'title', type: 'string', default: '' },
						{ displayName: 'Valeur', name: 'value', type: 'string', default: '' },
					],
				}],
			},

			// --- RCS CAROUSEL ---
			{
				displayName: 'Cartes Du Carrousel',
				name: 'carouselCards',
				type: 'fixedCollection',
				placeholder: 'Add a card',
				typeOptions: { multipleValues: true },
				displayOptions: { show: { resource: ['rcs'], operation: ['send'], rcsMessageType: ['carousel'] } },
				default: {},
				options: [{
					name: 'card', displayName: 'Carte', values: [
																																{
																																	displayName: 'Bouton 1	-	Titre',
																																	name: 'btn1Title',
																																	type: 'string',
																																	default: '',
																																},
																																{
																																	displayName: 'Bouton 1	-	Type',
																																	name: 'btn1Type',
																																	type: 'options',
																																	options: [
																																				{
																																					name: 'Aucun',
																																					value: 'none',
																																				},
																																				{
																																					name: 'URL',
																																					value: 'url',
																																				},
																																				{
																																					name: 'Appel',
																																					value: 'call',
																																				},
																																			],
																																	default: 'none',
																																},
																																{
																																	displayName: 'Bouton 1	-	Valeur',
																																	name: 'btn1Value',
																																	type: 'string',
																																	default: '',
																																},
																																{
																																	displayName: 'Bouton 2	-	Titre',
																																	name: 'btn2Title',
																																	type: 'string',
																																	default: '',
																																},
																																{
																																	displayName: 'Bouton 2	-	Type',
																																	name: 'btn2Type',
																																	type: 'options',
																																	options: [
																																				{
																																					name: 'Aucun',
																																					value: 'none',
																																				},
																																				{
																																					name: 'URL',
																																					value: 'url',
																																				},
																																				{
																																					name: 'Appel',
																																					value: 'call',
																																				},
																																		],
																																	default: 'none',
																																},
																																{
																																	displayName: 'Bouton 2	-	Valeur',
																																	name: 'btn2Value',
																																	type: 'string',
																																	default: '',
																																},
																																{
																																	displayName: 'Description',
																																	name: 'description',
																																	type: 'string',
																																	default: '',
																																},
																																{
																																	displayName: 'Image URL',
																																	name: 'media_message_url',
																																	type: 'string',
																																	default: '',
																																},
																																{
																																	displayName: 'Title',
																																	name: 'title',
																																	type: 'string',
																																	default: '',
																																},
																														],
				}],
			},

			// --- FALLBACK ---
			{
				displayName: 'Activer Le Fallback SMS',
				name: 'enableFallback',
				type: 'boolean',
				displayOptions: { show: { resource: ['rcs'], operation: ['send'] } },
				default: false,
			},
			{
				displayName: 'Sender ID Du Fallback',
				name: 'senderFallback',
				type: 'string',
				displayOptions: { show: { resource: ['rcs'], operation: ['send'], enableFallback: [true] } },
				default: '',
			},
			{
				displayName: 'Texte Du Fallback SMS',
				name: 'fallbackContent',
				type: 'string',
				typeOptions: { rows: 4 },
				displayOptions: { show: { resource: ['rcs'], operation: ['send'], enableFallback: [true] } },
				default: '',
			},
			{
				displayName: 'Ajouter La Mention STOP Au Fallback',
				name: 'addStopMentionFallback',
				type: 'boolean',
				displayOptions: { show: { resource: ['rcs'], operation: ['send'], enableFallback: [true] } },
				default: false,
			}
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		
		for (let i = 0; i < items.length; i++) {
			let body: any = {};
			let endpointUrl = '';
			
			try {
				// ==========================================
				// RESOURCE : CONTACT
				// ==========================================
				if (resource === 'contact') {
					const operationContact = this.getNodeParameter('operationContact', i) as string;
					
					if (operationContact === 'createList') {
						body = { name: this.getNodeParameter('listName', i) as string };
						endpointUrl = 'https://api.conexteo.com/contactlists';
					} 
					else if (operationContact === 'upsertContact') {
						const listId = this.getNodeParameter('listId', i) as number;
						const phone = this.getNodeParameter('contactPhone', i) as string;
						const nom = this.getNodeParameter('contactName', i) as string;
						const prenom = this.getNodeParameter('contactFirstName', i) as string;

						const contactObj: any = { tel: phone };
						if (nom) contactObj.champ_nom = nom;
						if (prenom) contactObj.champ_prenom = prenom;

						body = {
							contactlist_id: listId,
							contacts: [contactObj]
						};
						endpointUrl = 'https://api.conexteo.com/contacts';
					}
				}
				// ==========================================
				// RESOURCE : SMS & RCS
				// ==========================================
				else if (resource === 'sms' || resource === 'rcs') {
					// Correction ici : On ne déclare 'recipient' qu'une seule fois, et on a supprimé la variable inutile
					const recipient = this.getNodeParameter('recipient', i) as string;
					endpointUrl = resource === 'rcs' ? 'https://api.conexteo.com/messages/rcs' : 'https://api.conexteo.com/messages/sms';

					if (resource === 'sms') {
						const contentSms = this.getNodeParameter('contentSms', i) as string;
						const addStopSms = this.getNodeParameter('addStopMentionSms', i, false) as boolean;
						body = { recipients: [recipient], content: addStopSms ? `${contentSms} #STOP_XXX#` : contentSms };
						const senderSms = this.getNodeParameter('senderSms', i, '') as string;
						if (senderSms) body.sender = senderSms;
					}

					if (resource === 'rcs') {
						const rcsType = this.getNodeParameter('rcsMessageType', i) as string;
						body = { type: rcsType, contacts: [{ recipient: recipient }] };
						let defaultFallbackText = "";

						if (rcsType === 'text') {
							const contentText = this.getNodeParameter('contentRcsText', i) as string;
							const addStop = this.getNodeParameter('addStopMentionRcs', i, false) as boolean;
							body.data = { text: addStop ? `${contentText}\nPour vous désabonner, répondez STOP` : contentText };
							defaultFallbackText = contentText;

						} else if (rcsType === 'card') {
							const title = this.getNodeParameter('cardTitle', i) as string;
							const description = this.getNodeParameter('cardDescription', i) as string;
							body.data = { media_message_url: this.getNodeParameter('cardMediaUrl', i) as string };
							if (title) body.data.title = title;
							if (description) body.data.description = description;

							const cardButtonsWrapper = this.getNodeParameter('cardButtons', i, {}) as any;
							const buttonsData = cardButtonsWrapper?.button || [];
							if (buttonsData.length > 0) {
								body.data.choices = buttonsData.map((btn: any) => ({
									type: btn.type,
									title: btn.title,
									...(btn.type === 'url' ? { url: btn.value } : { phoneNumber: btn.value })
								}));
							}
							defaultFallbackText = "Message multimédia non supporté.";

						} else if (rcsType === 'carousel') {
							const carouselWrapper = this.getNodeParameter('carouselCards', i, {}) as any;
							const cardsArray = carouselWrapper?.card || [];

							const formattedCards = cardsArray.map((c: any) => {
								const cardChoices = [];
								if (c.btn1Type !== 'none') cardChoices.push({ type: c.btn1Type, title: c.btn1Title, ...(c.btn1Type === 'url' ? { url: c.btn1Value } : { phoneNumber: c.btn1Value }) });
								if (c.btn2Type !== 'none') cardChoices.push({ type: c.btn2Type, title: c.btn2Title, ...(c.btn2Type === 'url' ? { url: c.btn2Value } : { phoneNumber: c.btn2Value }) });
								return {
									media_message_url: c.media_message_url,
									...(c.title ? { title: c.title } : {}),
									...(c.description ? { description: c.description } : {}),
									...(cardChoices.length > 0 ? { choices: cardChoices } : {})
								};
							});

							body.data = { cards: formattedCards };
							defaultFallbackText = "Carrousel multimédia non supporté.";
						}

						const enableFallback = this.getNodeParameter('enableFallback', i, false) as boolean;
						if (enableFallback) {
							const fallbackContent = this.getNodeParameter('fallbackContent', i, '') as string;
							const addStopFallback = this.getNodeParameter('addStopMentionFallback', i, false) as boolean;
							let finalFallbackText = fallbackContent || defaultFallbackText;
							if (addStopFallback) finalFallbackText += ' #STOP_XXX#';
							body.fallback = { content: finalFallbackText };
							const senderFallback = this.getNodeParameter('senderFallback', i, '') as string;
							if (senderFallback) body.fallback.sender = senderFallback;
						}
					}
				}

				// --- REQUÊTE FINALE ---
				const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'conexteoApi', {
					method: 'POST',
					url: endpointUrl,
					body: body,
					json: true,
				});

				returnData.push({ json: { _debug_sent_payload: body, ...responseData } });
				
			} catch (error) {
				let errorMessage = "Erreur API : ";
				if (error.error) errorMessage += typeof error.error === 'object' ? JSON.stringify(error.error) : error.error;
				else errorMessage += error.message;
				
				if (this.continueOnFail()) {
					returnData.push({ json: { error: errorMessage } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), errorMessage, { itemIndex: i });
			}
		}

		return [returnData];
	}
}