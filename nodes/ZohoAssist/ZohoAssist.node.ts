import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeApiError,
} from 'n8n-workflow';

async function zohoRequest(this: IExecuteFunctions, options: any) {
  let maxRetries = 4;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await this.helpers.requestOAuth2.call(this, 'zohoAssistOAuth2', options);
    } catch (error: any) {
      const status = error?.statusCode;
      if (status >= 400 && status < 500 && status !== 429) throw error;
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(res => setTimeout(res, delay));
      attempt++;
    }
  }
  throw new Error('Max retries exceeded');
}

export class ZohoAssist implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Zoho Assist',
    name: 'zohoAssist',
    group: ['transform'],
    version: 1,
    description: 'Zoho Assist Full Node with Video Download',
    defaults: { name: 'Zoho Assist' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'zohoAssistOAuth2', required: true }],
    properties: [
      {
        displayName: 'Data Center',
        name: 'dc',
        type: 'options',
        options: [
          { name: 'India', value: 'in' },
          { name: 'US', value: 'com' },
          { name: 'EU', value: 'eu' }
        ],
        default: 'in'
      },
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        options: [
          { name: 'Report', value: 'report' }
        ],
        default: 'report'
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          { name: 'List Recordings', value: 'listRecordings' },
          { name: 'Download Video', value: 'downloadVideo' }
        ],
        default: 'listRecordings'
      },
      {
        displayName: 'Session ID',
        name: 'sessionId',
        type: 'string',
        default: ''
      }
    ]
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const dc = this.getNodeParameter('dc', i) as string;
        const baseMap: any = {
          in: 'https://assist.zoho.in',
          com: 'https://assist.zoho.com',
          eu: 'https://assist.zoho.eu'
        };
        const baseUrl = baseMap[dc] + '/api/v2';

        const operation = this.getNodeParameter('operation', i);

        if (operation === 'listRecordings') {
          const res = await zohoRequest.call(this, {
            method: 'GET',
            url: baseUrl + '/reports',
            json: true
          });

          const filtered = res.representation.filter((r: any) =>
            r.video_available && !r.video_deleted && r.video_complete
          );

          returnData.push({ json: filtered });
        }

        if (operation === 'downloadVideo') {
          const sessionId = this.getNodeParameter('sessionId', i);

          const response = await this.helpers.requestOAuth2.call(
            this,
            'zohoAssistOAuth2',
            {
              method: 'GET',
              url: `${baseUrl}/download_session_video/${sessionId}`,
              encoding: 'arraybuffer',
            }
          );

          const binary = await this.helpers.prepareBinaryData(
            Buffer.from(response),
            `${sessionId}.mp4`,
            'video/mp4'
          );

          returnData.push({
            json: { sessionId },
            binary: { video: binary }
          });
        }

      } catch (error) {
        throw new NodeApiError(this.getNode(), error);
      }
    }

    return [returnData];
  }
}