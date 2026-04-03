import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class ZohoAssistOAuth2 implements ICredentialType {
	name = 'zohoAssistOAuth2';
	displayName = 'Zoho Assist OAuth2';
	extends = ['oAuth2Api'];

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
			default: 'com',
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
			displayName: 'Auth Query Params',
			name: 'authQueryParams',
			type: 'hidden',
			default: 'access_type=offline&prompt=consent',
		},
	];

	async preAuthentication(this: any, credentials: any) {
		const dc = credentials.dc || 'in';
		const map: any = {
			in: 'https://accounts.zoho.in',
			com: 'https://accounts.zoho.com',
			eu: 'https://accounts.zoho.eu',
			'com.au': 'https://accounts.zoho.com.au',
			'com.cn': 'https://accounts.zoho.com.cn',
			jp: 'https://accounts.zoho.jp',
		};

		const accountsUrl = map[dc] || 'https://accounts.zoho.com';

		return {
			...credentials,
			authUrl: `${accountsUrl}/oauth/v2/auth`,
			accessTokenUrl: `${accountsUrl}/oauth/v2/token`,
		};
	}
}