import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ConexteoApi implements ICredentialType {
	name = 'conexteoApi';
	icon = 'file:conexteo.svg';
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

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-APP-ID': '={{$credentials.appId}}',
				'X-API-KEY': '={{$credentials.apiKey}}',
				'Content-Type': 'application/json',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.conexteo.com',
			url: '/users/credits',
			method: 'GET',
		},
	};
}