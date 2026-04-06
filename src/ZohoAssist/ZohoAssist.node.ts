import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
} from 'n8n-workflow';

import { zohoRequest } from './GenericFunctions';


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
				const departmentId = this.getNodeParameter('departmentId', i) as string;

				let res: any;
				// We set common headers, but specific operations might override or add to them
				const headers: any = {};

				if (resource === 'session') {
					if (operation === 'create') {
						const customer_email = this.getNodeParameter('customerEmail', i) as string;
						const type = this.getNodeParameter('type', i) as string;

						const body: any = {
							customer_email: customer_email.trim(),
							type,
						};

						if (departmentId) {
							body.department_id = Number(departmentId);
						}

						res = await zohoRequest.call(this, {
							method: 'POST',
							url: '/session',
							body,
							json: true,
						}, i);
					} else if (operation === 'schedule') {
						const customer_email = this.getNodeParameter('customerEmail', i) as string;
						const title = this.getNodeParameter('title', i) as string;
						const schedule_time_str = this.getNodeParameter('scheduleTime', i) as string;
						const utcoffset = this.getNodeParameter('utcOffset', i) as string;
						const time_zone = this.getNodeParameter('timeZone', i) as string;
						const reminder = this.getNodeParameter('reminder', i) as number;
						const notes = this.getNodeParameter('notes', i) as string;
						const duration = this.getNodeParameter('duration', i) as number;

						if (!schedule_time_str) {
							throw new Error('Schedule Time is required for scheduled sessions.');
						}
						const schedule_time = new Date(schedule_time_str).getTime();
						if (isNaN(schedule_time)) {
							throw new Error('Invalid Schedule Time format. Please provide a valid date.');
						}

						// Snap reminder to valid intervals (0, 5, 10, 15, 30, 45, 60, 1440)
						const validReminders = [0, 5, 10, 15, 30, 45, 60, 1440];
						let finalReminder = parseInt(reminder.toString(), 10) || 0;
						if (!validReminders.includes(finalReminder)) {
							// Snap to nearest valid if not listed, or 15
							finalReminder = 15;
						}

						const schedule_upto = schedule_time + (duration * 60 * 1000);

						const body: any = {
							mode: 'SCHEDULE',
							title,
							customer_email: customer_email.trim(),
							schedule_time: schedule_time.toString(),
							schedule_upto: schedule_upto.toString(),
							reminder: finalReminder,
							utc_offset: utcoffset || '+05:30',
							time_zone: time_zone || 'Asia/Kolkata',
						};

						if (notes) {
							body.notes = notes;
						}

						if (departmentId) {
							body.department_id = Number(departmentId);
						}

						res = await zohoRequest.call(this, {
							method: 'POST',
							url: '/session/schedule',
							body,
							json: true,
						}, i);
					} else if (operation === 'startUnattended') {
						const resourceId = this.getNodeParameter('resourceId', i);
						const qs = departmentId ? { department_id: departmentId } : {};
						res = await zohoRequest.call(this, {
							method: 'POST',
							url: `/unattended/${resourceId}/connect`,
							headers,
							qs,
						}, i);
					}
				} else if (resource === 'device') {
					if (operation === 'list') {
						res = await zohoRequest.call(this, {
							method: 'GET',
							url: '/devices',
							headers,
							json: true,
						}, i);
					} else if (operation === 'get') {
						const resourceId = this.getNodeParameter('resourceId', i);
						res = await zohoRequest.call(this, {
							method: 'GET',
							url: `/devices/${resourceId}`,
							headers,
							json: true,
						}, i);
					}
				} else if (resource === 'group') {
					if (operation === 'create') {
						const group_name = this.getNodeParameter('groupName', i);
						const groupDescription = this.getNodeParameter('groupDescription', i);
						res = await zohoRequest.call(this, {
							method: 'POST',
							url: '/unattended_computer/group',
							headers,
							body: { group_name, description: groupDescription, department_id: departmentId ? Number(departmentId) : undefined },
							json: true,
						}, i);
					} else if (operation === 'list') {
						const qs = departmentId ? { department_id: departmentId } : {};
						res = await zohoRequest.call(this, {
							method: 'GET',
							url: '/unattended_computer/group',
							headers,
							qs,
							json: true,
						}, i);
					}
				} else if (resource === 'report') {
					if (operation === 'list') {
						const type = this.getNodeParameter('reportType', i) as string;
						const fromDateValue = this.getNodeParameter('fromDate', i) as string;
						const toDateValue = this.getNodeParameter('toDate', i) as string;
						const qs: any = { type, count: 100 };
						if (fromDateValue) qs.fromdate = new Date(fromDateValue).getTime().toString();
						if (toDateValue) qs.todate = new Date(toDateValue).getTime().toString();
						res = await zohoRequest.call(this, {
							method: 'GET',
							url: '/reports',
							headers,
							qs,
							json: true,
						}, i);
					} else if (operation === 'downloadRecording') {
						const resourceId = this.getNodeParameter('resourceId', i);
						const response = await zohoRequest.call(this, {
							method: 'GET',
							url: `/download_session_video/${resourceId}`,
							headers,
							responseType: 'arraybuffer',
							encoding: 'arraybuffer',
						}, i);
						const binary = await this.helpers.prepareBinaryData(Buffer.from(response), `${resourceId}.mp4`, 'video/mp4');
						returnData.push({ json: { sessionId: resourceId }, binary: { video: binary } });
						continue;
					}
				} else if (resource === 'user') {
					if (operation === 'get') {
						res = await zohoRequest.call(this, {
							method: 'GET',
							url: '/user',
							headers,
							json: true,
						}, i);
					}
				} else if (resource === 'customApi') {
					const httpMethod = this.getNodeParameter('httpMethod', i) as string;
					const apiPath = this.getNodeParameter('apiPath', i) as string;
					const queryParams = this.getNodeParameter('queryParams', i) as any;
					const customHeaders = this.getNodeParameter('headers', i) as any;
					const body = this.getNodeParameter('body', i) as string;

					const qs: { [key: string]: any } = {};
					if (queryParams?.parameters) {
						for (const param of queryParams.parameters) {
							qs[param.name] = param.value;
						}
					}

					const fullHeaders: { [key: string]: any } = { ...headers };
					if (customHeaders?.headers) {
						for (const header of customHeaders.headers) {
							fullHeaders[header.name] = header.value;
						}
					}

					const options: any = {
						method: httpMethod,
						url: apiPath,
						headers: fullHeaders,
						qs,
						json: true,
					};

					if (body) {
						try {
							options.body = JSON.parse(body);
						} catch (e) {
							options.body = body;
						}
					}

					res = await zohoRequest.call(this, options, i);
				}

				if (Array.isArray(res?.representation)) {
					returnData.push(...res.representation.map((json: any) => ({ json })));
				} else {
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