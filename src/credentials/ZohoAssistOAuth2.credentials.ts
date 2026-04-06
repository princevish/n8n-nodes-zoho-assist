import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class ZohoAssistOAuth2 implements ICredentialType {
	name = 'zohoAssistOAuth2';
	displayName = 'Zoho Assist OAuth2';
	extends = ['oAuth2Api'];

	authentication = 'body' as const;

	properties: INodeProperties[] = [
		{
			displayName: 'Data Center',
			name: 'dc',
			type: 'options',
			options: [
				{ name: 'India', value: 'in' },
				{ name: 'US', value: 'com' },
				{ name: 'EU', value: 'eu' },
				{ name: 'Australia', value: 'com.au' },
				{ name: 'China', value: 'com.cn' },
				{ name: 'Japan', value: 'jp' },
			],
			default: 'in',
			required: true,
			description: 'The data center where your Zoho account is hosted (e.g., US, India, EU)',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'string',
			default: 'ZohoAssist.sessionapi.ALL,ZohoAssist.unattended.computer.ALL,ZohoAssist.unattended.group.ALL,ZohoAssist.unattended.device.CREATE,ZohoAssist.reportapi.READ,ZohoAssist.userapi.READ',
		},
		{
			displayName: 'Auth Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: 'access_type=offline&prompt=consent',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'header',
		},
	];

	async preAuthentication(this: any, credentials: any) {
		const dc = credentials.dc || 'in';
		const map: { [key: string]: string } = {
			in: 'https://accounts.zoho.in',
			com: 'https://accounts.zoho.com',
			eu: 'https://accounts.zoho.eu',
			'com.au': 'https://accounts.zoho.com.au',
			'com.cn': 'https://accounts.zoho.com.cn',
			jp: 'https://accounts.zoho.jp',
		};

		const accountsUrl = map[dc] || 'https://accounts.zoho.in';

		return {
			...credentials,
			authUrl: `${accountsUrl}/oauth/v2/auth`,
			accessTokenUrl: `${accountsUrl}/oauth/v2/token`,
			authentication: 'body',
		};
	}
}
