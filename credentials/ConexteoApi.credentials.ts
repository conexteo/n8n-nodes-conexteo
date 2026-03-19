/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	ICredentialType,
	INodeProperties,
	ICredentialTestResponse,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
} from 'n8n-workflow';

export class ConexteoApi implements ICredentialType {
	name = 'conexteoApi';
	icon = 'file:conexteo.svg' as any;
	displayName = 'Conexteo API';
	documentationUrl = 'https://developers.conexteo.com/';

	properties: INodeProperties[] = [
		{
			displayName: 'App ID (X-APP-ID)',
			name: 'appId',
			type: 'string',
			default: '',
			required: true,
			description: 'L\'App ID de votre compte Conexteo',
		},
		{
			displayName: 'API Key (X-API-KEY)',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'La clé API de votre compte Conexteo',
		},
	];

	authenticate = {
		type: 'generic',
		properties: {
			headers: {
				'X-APP-ID': '={{$credentials.appId}}',
				'X-API-KEY': '={{$credentials.apiKey}}',
				'Content-Type': 'application/json',
			},
		},
	} as any;

	async test(this: IExecuteSingleFunctions): Promise<ICredentialTestResponse> {
		const options: IHttpRequestOptions = {
			method: 'GET',
			url: 'https://api.conexteo.com/users/credits',
			json: true,
		};
		try {
			await this.helpers.httpRequestWithAuthentication.call(this, 'conexteoApi', options);
			return {
				status: 'OK',
				message: 'Connexion réussie !',
			};
		} catch (error: any) {
			return {
				status: 'Error',
				message: `Erreur de connexion : ${error.message}`,
			};
		}
	}
}