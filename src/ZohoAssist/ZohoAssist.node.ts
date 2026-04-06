import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
} from 'n8n-workflow';


import { BaseHandler } from './handlers/BaseHandler';
import { SessionHandler } from './handlers/SessionHandler';
import { DeviceHandler } from './handlers/DeviceHandler';
import { GroupHandler } from './handlers/GroupHandler';
import { ReportHandler } from './handlers/ReportHandler';
import { UserHandler } from './handlers/UserHandler';
import { CustomApiHandler } from './handlers/CustomApiHandler';


export class ZohoAssist implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zoho Assist',
		name: 'zohoAssist',
		icon: 'file:zohoAssist.svg',
		group: ['transform'],
		version: 1,
		description: 'Manage remote support and unattended access sessions with Zoho Assist',
		defaults: { name: 'Zoho Assist' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'zohoAssistOAuth2', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Device', value: 'device', description: 'Manage unattended computers' },
					{ name: 'Group', value: 'group', description: 'Manage unattended computer groups' },
					{ name: 'Report', value: 'report', description: 'Access session reports and recordings' },
					{ name: 'Session', value: 'session', description: 'Manage remote support sessions' },
					{ name: 'User', value: 'user', description: 'Get technician and account information' },
					{ name: 'Custom API Call', value: 'customApi', description: 'Perform a custom API call' },
				],
				default: 'session',
			},
			// --- Session Operations ---
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['session'],
					},
				},
				options: [
					{ name: 'Create', value: 'create', description: 'Create a remote support session' },
					{ name: 'Schedule', value: 'schedule', description: 'Schedule a remote support session' },
					{ name: 'Start Unattended', value: 'startUnattended', description: 'Start an unattended access session' },
				],
				default: 'create',
			},
			// --- Device Operations ---
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['device'],
					},
				},
				options: [
					{ name: 'Get', value: 'get', description: 'Get details of an unattended computer' },
					{ name: 'List', value: 'list', description: 'List all unattended computers' },
				],
				default: 'list',
			},
			// --- Group Operations ---
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['group'],
					},
				},
				options: [
					{ name: 'Create', value: 'create', description: 'Create an unattended group' },
					{ name: 'List', value: 'list', description: 'List unattended groups' },
				],
				default: 'list',
			},
			// --- Report Operations ---
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['report'],
					},
				},
				options: [
					{ name: 'Download Recording', value: 'downloadRecording', description: 'Download a session recording video' },
					{ name: 'List', value: 'list', description: 'List session reports/recordings' },
				],
				default: 'list',
			},
			// --- User Operations ---
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['user'],
					},
				},
				options: [
					{ name: 'Get Info', value: 'get', description: 'Get technician and organization details' },
				],
				default: 'get',
			},
			// --- Custom API Operations ---
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['customApi'],
					},
				},
				options: [
					{ name: 'Custom API Call', value: 'customApi', description: 'Perform a custom API call' },
				],
				default: 'customApi',
			},

			// --- Parameters ---
			{
				displayName: 'Department ID',
				name: 'departmentId',
				type: 'string',
				default: '',
				description: 'The ID of the department to use. Required for many unattended access and multi-department accounts.',
			},

			// Session Create/Schedule
			{
				displayName: 'Customer Email',
				name: 'customerEmail',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['session'],
						operation: ['create', 'schedule'],
					},
				},
				default: '',
			},
			{
				displayName: 'Session Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'Remote Support', value: 'rs' },
					{ name: 'Diagnostic Menu', value: 'dm' },
					{ name: 'Customer Branding', value: 'cb' },
				],
				default: 'rs',
				displayOptions: {
					show: {
						resource: ['session'],
						operation: ['create'],
					},
				},
			},

			// Session Schedule Specific
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['session'],
						operation: ['schedule'],
					},
				},
				default: 'Support Session',
			},
			{
				displayName: 'Schedule Time',
				name: 'scheduleTime',
				type: 'dateTime',
				required: true,
				displayOptions: {
					show: {
						resource: ['session'],
						operation: ['schedule'],
					},
				},
				default: '',
				description: 'The scheduled start time (e.g., 2024-04-10 10:30:00)',
			},
			{
				displayName: 'Duration (Minutes)',
				name: 'duration',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['session'],
						operation: ['schedule'],
					},
				},
				default: 60,
				description: 'The duration of the session in minutes',
			},
			{
				displayName: 'Time Zone',
				name: 'timeZone',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['session'],
						operation: ['schedule'],
					},
				},
				default: 'Asia/Kolkata',
				description: 'The time zone for the scheduled session',
			},
			{
				displayName: 'UTC Offset',
				name: 'utcOffset',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['session'],
						operation: ['schedule'],
					},
				},
				default: '+05:30',
				placeholder: '+05:30',
				description: 'The UTC offset for the scheduled session (e.g., +05:30)',
			},
			{
				displayName: 'Reminder',
				name: 'reminder',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						resource: ['session'],
						operation: ['schedule'],
					},
				},
				default: 15,
				description: 'Reminder time in minutes before the session starts',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['session'],
						operation: ['schedule'],
					},
				},
				default: '',
				description: 'Description or notes for the scheduled session',
			},

			// Resource ID (for Start Unattended, Get Device)
			{
				displayName: 'Resource ID',
				name: 'resourceId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['session', 'device', 'report'],
						operation: ['startUnattended', 'get', 'downloadRecording'],
					},
				},
				default: '',
				description: 'The ID of the unattended computer or session recording',
			},

			// Group Create
			{
				displayName: 'Group Name',
				name: 'groupName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['group'],
						operation: ['create'],
					},
				},
				default: '',
			},
			{
				displayName: 'Group Description',
				name: 'groupDescription',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['group'],
						operation: ['create'],
					},
				},
				default: '',
			},

			// Reports Filtering
			{
				displayName: 'Report Type',
				name: 'reportType',
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
						resource: ['report'],
						operation: ['list'],
					},
				},
			},
			{
				displayName: 'From Date',
				name: 'fromDate',
				type: 'dateTime',
				default: '',
				displayOptions: {
					show: {
						resource: ['report'],
						operation: ['list'],
					},
				},
				description: 'Filter from this date (YYYY-MM-DD)',
			},
			{
				displayName: 'To Date',
				name: 'toDate',
				type: 'dateTime',
				default: '',
				displayOptions: {
					show: {
						resource: ['report'],
						operation: ['list'],
					},
				},
				description: 'Filter up to this date',
			},

			// --- Custom API Request Parameters ---
			{
				displayName: 'HTTP Method',
				name: 'httpMethod',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['customApi'],
						operation: ['customApi'],
					},
				},
				options: [
					{ name: 'GET', value: 'GET' },
					{ name: 'POST', value: 'POST' },
					{ name: 'PUT', value: 'PUT' },
					{ name: 'DELETE', value: 'DELETE' },
					{ name: 'PATCH', value: 'PATCH' },
					{ name: 'HEAD', value: 'HEAD' },
				],
				default: 'GET',
				description: 'The HTTP method to use',
			},
			{
				displayName: 'API Path',
				name: 'apiPath',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['customApi'],
						operation: ['customApi'],
					},
				},
				default: '',
				placeholder: '/sessions',
				description: 'The API path to call (e.g., /sessions)',
			},
			{
				displayName: 'Query Parameters',
				name: 'queryParams',
				type: 'fixedCollection',
				displayOptions: {
					show: {
						resource: ['customApi'],
						operation: ['customApi'],
					},
				},
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'Add Parameter',
				default: {},
				options: [
					{
						name: 'parameters',
						displayName: 'Parameter',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Headers',
				name: 'headers',
				type: 'fixedCollection',
				displayOptions: {
					show: {
						resource: ['customApi'],
						operation: ['customApi'],
					},
				},
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'Add Header',
				default: {},
				options: [
					{
						name: 'headers',
						displayName: 'Header',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Body',
				name: 'body',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['customApi'],
						operation: ['customApi'],
						httpMethod: ['POST', 'PUT', 'PATCH', 'DELETE'],
					},
				},
				default: '',
				description: 'The request body to send in JSON format',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				// Factory for handlers
				let handler: BaseHandler;
				switch (resource) {
					case 'session':
						handler = new SessionHandler(this);
						break;
					case 'device':
						handler = new DeviceHandler(this);
						break;
					case 'group':
						handler = new GroupHandler(this);
						break;
					case 'report':
						handler = new ReportHandler(this);
						break;
					case 'user':
						handler = new UserHandler(this);
						break;
					case 'customApi':
						handler = new CustomApiHandler(this);
						break;
					default:
						throw new Error(`The resource "${resource}" is not supported.`);
				}

				const res = await handler.handle(operation, i);

				// Consistent output handling
				if (resource === 'report' && operation === 'downloadRecording') {
					// Binary results are handled differently
					returnData.push({
						json: { sessionId: res.sessionId },
						binary: { video: res.binary },
					});
				} else if (Array.isArray(res?.representation)) {
					// If Zoho returns multiple items in a representation array
					returnData.push(...res.representation.map((json: any) => ({ json })));
				} else if (Array.isArray(res)) {
					// If handler already returned an array of INodeExecutionData
					returnData.push(...res.map((item: any) => (item.json ? item : { json: item })));
				} else {
					// Single object response
					returnData.push({ json: res || { success: true } });
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