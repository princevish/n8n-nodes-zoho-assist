import { BaseHandler } from './BaseHandler';

export class DeviceHandler extends BaseHandler {
	async handle(operation: string, index: number): Promise<any> {
		const departmentId = this.getParam<string>('departmentId', index);

		if (operation === 'list') {
			const qs = departmentId ? { department_id: departmentId } : {};
			return await this.request({ method: 'GET', url: '/devices', qs, json: true }, index);
		}

		if (operation === 'get') {
			const resourceId = String(this.getParam<string>('resourceId', index) ?? '');
			if (!resourceId.trim()) throw new Error('Resource ID (Device ID) is required.');

			const qs = departmentId ? { department_id: departmentId } : {};
			return await this.request({ method: 'GET', url: `/devices/${resourceId.trim()}`, qs, json: true }, index);
		}

		throw new Error(`The operation "${operation}" is not supported by DeviceHandler.`);
	}
}
