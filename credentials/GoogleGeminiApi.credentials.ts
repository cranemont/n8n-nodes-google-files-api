import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class GoogleGeminiApi implements ICredentialType {
	name = 'googleGeminiApi';
	displayName = 'Google Gemini API';
	documentationUrl = 'https://ai.google.dev/gemini-api/docs';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Google AI Studio에서 발급받은 API Key',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			qs: {
				key: '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://generativelanguage.googleapis.com',
			url: '/v1beta/models',
		},
	};
}
