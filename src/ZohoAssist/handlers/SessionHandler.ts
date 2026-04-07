import { BaseHandler } from './BaseHandler';

export class SessionHandler extends BaseHandler {
	async handle(operation: string, index: number): Promise<any> {
		const departmentId = this.getParam<string>('departmentId', index);

		if (operation === 'create') {
			const customerEmail = this.getParam<string>('customerEmail', index);
			const type = this.getParam<string>('type', index);
			const trimmedEmail = this.validateEmail(customerEmail, 'creating a session');

			const qs: any = { customer_email: trimmedEmail, type };
			if (departmentId) {
				qs.department_id = departmentId;
			}

			return await this.request({ method: 'POST', url: '/session', qs, json: true }, index);
		}

		if (operation === 'schedule') {
			const customerEmail = this.getParam<string>('customerEmail', index);
			const title = this.getParam<string>('title', index);
			const scheduleTimeStr = this.getParam<string>('scheduleTime', index);
			const utcOffset = this.getParam<string>('utcOffset', index) || '+05:30';
			const timeZone = this.getParam<string>('timeZone', index) || 'Asia/Kolkata';
			const reminder = this.getParam<number>('reminder', index);
			const notes = this.getParam<string>('notes', index);
			const duration = this.getParam<number>('duration', index);

			// Validation
			const validationErrors: string[] = [];
			const trimmedEmail = this.validateEmail(customerEmail, 'scheduling a session');
			const scheduleTime = this.validateDate(scheduleTimeStr, 'Schedule Time');

			if (!title || !title.trim()) validationErrors.push('Title is required.');
			if (scheduleTime <= Date.now()) validationErrors.push('Schedule Time must be in the future.');
			if (!duration || duration <= 0) validationErrors.push('Duration must be positive.');
			if (!/^[+-]\d{2}:\d{2}$/.test(utcOffset)) validationErrors.push(`Invalid UTC Offset: ${utcOffset}`);

			if (validationErrors.length > 0) {
				throw new Error(`Validation failed:\n${validationErrors.join('\n')}`);
			}

			const validReminders = [0, 5, 10, 15, 30, 45, 60, 1440];
			const finalReminder = validReminders.includes(reminder) ? reminder : 15;

			const body: any = {
				mode: 'SCHEDULE',
				title: title.trim(),
				customer_email: trimmedEmail,
				schedule_time: scheduleTime,
				schedule_upto: scheduleTime + (duration * 60 * 1000),
				reminder: finalReminder,
				utc_offset: utcOffset,
				time_zone: timeZone,
			};

			if (notes?.trim()) body.notes = notes.trim();
			if (departmentId) body.department_id = departmentId;

			return await this.request({ method: 'POST', url: '/session/schedule', body, json: true }, index);
		}

		if (operation === 'startUnattended') {
			const resourceId = String(this.getParam<string>('resourceId', index) ?? '');
			if (!resourceId.trim()) throw new Error('Resource ID is required.');

			const qs = departmentId ? { department_id: departmentId } : {};
			return await this.request({ method: 'POST', url: `/unattended/${resourceId.trim()}/connect`, qs, json: true }, index);
		}

		throw new Error(`The operation "${operation}" is not supported by SessionHandler.`);
	}
}
