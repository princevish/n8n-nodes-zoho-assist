import {
	IAllExecuteFunctions,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
} from 'n8n-workflow';

async function zohoRequest(this: IAllExecuteFunctions, options: any, itemIndex: number) {
	const maxRetries = 3;
	let lastError: any;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			const credentials = await this.getCredentials('zohoAssistOAuth2', itemIndex);
			const token = ((credentials.oauthTokenData as any)?.access_token || credentials.accessToken || credentials.oauthToken) as string;

			if (!token) {
				throw new Error(`Access token missing. Please re-authenticate your Zoho Assist credentials.`);
			}

			const requestOptions = {
				...options,
				headers: {
					...options.headers,
					'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
					Authorization: `Zoho-oauthtoken ${token}`,
				},
			};
			return await this.helpers.httpRequest.call(this, requestOptions);
		} catch (error: any) {
			lastError = error;
			const status = error?.statusCode || error?.response?.status;

			// Don't retry on 4xx errors (except 429)
			if (status >= 400 && status < 500 && status !== 429) {
				throw error;
			}

			// Don't retry if it's a specific error without status that won't be fixed by retrying (like auth setup)
			if (!status && (error.message?.includes('token') || error.message?.includes('credential'))) {
				throw error;
			}

			// Wait before next retry
			if (attempt < maxRetries - 1) {
				const delay = Math.pow(2, attempt) * 1000;
				await new Promise((res) => setTimeout(res, delay));
			}
		}
	}
	throw lastError || new Error('Max retries exceeded while calling Zoho Assist API');
}

export class ZohoAssist implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zoho Assist',
		name: 'zohoAssist',
		group: ['transform'],
		version: 1,
		description: 'Zoho Assist integration for reports and recording downloads',
		defaults: { name: 'Zoho Assist' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'zohoAssistOAuth2', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [{ name: 'Report', value: 'report' }],
				default: 'report',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{ name: 'List Recordings', value: 'listRecordings', description: 'List available session recordings' },
					{ name: 'Download Video', value: 'downloadVideo', description: 'Download a session recording video as binary' },
				],
				default: 'listRecordings',
			},
			{
				displayName: 'Session ID',
				name: 'sessionId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['downloadVideo'],
					},
				},
				default: '',
				description: 'The ID of the session to download the video for',
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Remote Support', value: 'rs' },
					{ name: 'Unattended Remote Support', value: 'URS' },
					{ name: 'Diagnostic Menu', value: 'DM' },
				],
				default: 'all',
				displayOptions: {
					show: {
						operation: ['listRecordings'],
					},
				},
				description: 'The type of sessions to list recordings for',
			},
			{
				displayName: 'From Date',
				name: 'fromDate',
				type: 'dateTime',
				default: '',
				placeholder: 'YYYY-MM-DD',
				displayOptions: {
					show: {
						operation: ['listRecordings'],
					},
				},
				description: 'Filter recordings from this date. If not provided, defaults to the last 30 days.',
			},
			{
				displayName: 'To Date',
				name: 'toDate',
				type: 'dateTime',
				default: '',
				placeholder: 'YYYY-MM-DD',
				displayOptions: {
					show: {
						operation: ['listRecordings'],
					},
				},
				description: 'Filter recordings up to this date',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const credentials = await this.getCredentials('zohoAssistOAuth2');
				const dc = (credentials.dc as string);
				
				if (!dc) {
					throw new Error('Data Center (DC) is not defined in credentials. Please re-save your Zoho Assist credentials.');
				}

				const baseMap: { [key: string]: string } = {
					in: 'https://assist.zoho.in',
					com: 'https://assist.zoho.com',
					eu: 'https://assist.zoho.eu',
					'com.au': 'https://assist.zoho.com.au',
					'com.cn': 'https://assist.zoho.com.cn',
					jp: 'https://assist.zoho.jp',
				};
				const baseUrl = `${baseMap[dc] || 'https://assist.zoho.com'}/api/v2`;

				const operation = this.getNodeParameter('operation', i);

				if (operation === 'listRecordings') {
					const type = this.getNodeParameter('type', i) as string;
					const fromDateValue = this.getNodeParameter('fromDate', i) as string;
					const toDateValue = this.getNodeParameter('toDate', i) as string;

					const qs: any = { 
						type,
						count: 100,
					};
					
					if (fromDateValue) {
						qs.fromdate = new Date(fromDateValue).getTime().toString();
					}
					if (toDateValue) {
						qs.todate = new Date(toDateValue).getTime().toString();
					}

					const res = await zohoRequest.call(this, {
						method: 'GET',
						url: `${baseUrl}/reports`,
						qs,
						json: true,
					}, i);

					const filtered = (res.representation || []).filter(
						(r: any) => r.video_available && !r.video_deleted && r.video_complete,
					);

					returnData.push({ json: filtered });
				}

				if (operation === 'downloadVideo') {
					const sessionId = this.getNodeParameter('sessionId', i);

					const response = await zohoRequest.call(this, {
						method: 'GET',
						url: `${baseUrl}/download_session_video/${sessionId}`,
						responseType: 'arraybuffer', // For Axios (n8n 1.0+)
						encoding: 'arraybuffer', // For Request-Promise (legacy n8n)
					}, i);

					const binary = await this.helpers.prepareBinaryData(
						Buffer.from(response),
						`${sessionId}.mp4`,
						'video/mp4',
					);

					returnData.push({
						json: { sessionId },
						binary: { video: binary },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw new NodeApiError(this.getNode(), error);
			}
		}

		return [returnData];
	}
}