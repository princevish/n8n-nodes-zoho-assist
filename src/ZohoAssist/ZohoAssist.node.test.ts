import { IExecuteFunctions } from 'n8n-workflow';
import { ZohoAssist } from './ZohoAssist.node';
import { zohoRequest } from './GenericFunctions';

// Mock the zohoRequest function
jest.mock('./GenericFunctions', () => ({
	zohoRequest: jest.fn(),
}));

describe('ZohoAssist Node', () => {
	let zohoAssist: ZohoAssist;
	let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;

	beforeEach(() => {
		zohoAssist = new ZohoAssist();
		mockExecuteFunctions = {
			getNodeParameter: jest.fn(),
			getInputData: jest.fn().mockReturnValue([{ json: {} }]),
			helpers: {
				prepareBinaryData: jest.fn().mockResolvedValue({}),
			},
			continueOnFail: jest.fn().mockReturnValue(false),
		} as unknown as jest.Mocked<IExecuteFunctions>;

		(zohoRequest as jest.Mock).mockClear();
	});

	it('should successfully create an instant session', async () => {
		mockExecuteFunctions.getNodeParameter.mockImplementation((name: string) => {
			if (name === 'resource') return 'session';
			if (name === 'operation') return 'create';
			if (name === 'customerEmail') return 'test@example.com';
			if (name === 'type') return 'rs';
			if (name === 'departmentId') return '123456';
			return '';
		});

		(zohoRequest as jest.Mock).mockResolvedValue({ session_id: '123' });

		const result = await zohoAssist.execute.call(mockExecuteFunctions);

		expect(zohoRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				method: 'POST',
				url: '/session',
				body: {
					customer_email: 'test@example.com',
					type: 'rs',
					department_id: 123456,
				},
				json: true,
			}),
			0
		);
		expect(result[0][0].json).toEqual({ session_id: '123' });
	});

	it('should successfully schedule a session with correct data types', async () => {
		const futureDate = '2026-04-10 10:30:00';
		const futureTimestamp = new Date(futureDate).getTime();

		mockExecuteFunctions.getNodeParameter.mockImplementation((name: string) => {
			if (name === 'resource') return 'session';
			if (name === 'operation') return 'schedule';
			if (name === 'customerEmail') return 'test@example.com';
			if (name === 'title') return 'Support Session';
			if (name === 'scheduleTime') return futureDate;
			if (name === 'utcOffset') return '+05:30';
			if (name === 'timeZone') return 'Asia/Kolkata';
			if (name === 'reminder') return 15;
			if (name === 'notes') return 'Some notes';
			if (name === 'departmentId') return '123456';
			if (name === 'duration') return 60;
			return '';
		});

		(zohoRequest as jest.Mock).mockResolvedValue({ session_id: '456' });

		const result = await zohoAssist.execute.call(mockExecuteFunctions);

		expect(zohoRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				method: 'POST',
				url: '/session/schedule',
				body: expect.objectContaining({
					mode: 'SCHEDULE',
					schedule_time: futureTimestamp.toString(),
					schedule_upto: (futureTimestamp + 60 * 60 * 1000).toString(),
					department_id: 123456,
					notes: 'Some notes',
				}),
				json: true,
			}),
			0
		);
	});

	it('should omit notes in schedule if empty', async () => {
		mockExecuteFunctions.getNodeParameter.mockImplementation((name: string) => {
			if (name === 'resource') return 'session';
			if (name === 'operation') return 'schedule';
			if (name === 'scheduleTime') return '2026-04-10 10:30:00';
			if (name === 'notes') return '';
			return 'value';
		});

		await zohoAssist.execute.call(mockExecuteFunctions);

		const callArgs = (zohoRequest as jest.Mock).mock.calls[0][0];
		expect(callArgs.body.notes).toBeUndefined();
	});

	it('should list devices', async () => {
		mockExecuteFunctions.getNodeParameter.mockImplementation((name: string) => {
			if (name === 'resource') return 'device';
			if (name === 'operation') return 'list';
			return '';
		});

		(zohoRequest as jest.Mock).mockResolvedValue([{ id: 'dev1' }]);

		await zohoAssist.execute.call(mockExecuteFunctions);

		expect(zohoRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				method: 'GET',
				url: '/devices',
			}),
			0
		);
	});

	it('should get current user info', async () => {
		mockExecuteFunctions.getNodeParameter.mockImplementation((name: string) => {
			if (name === 'resource') return 'user';
			if (name === 'operation') return 'get';
			return '';
		});

		(zohoRequest as jest.Mock).mockResolvedValue({ email: 'user@example.com' });

		await zohoAssist.execute.call(mockExecuteFunctions);

		expect(zohoRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				method: 'GET',
				url: '/user',
			}),
			0
		);
	});
});
