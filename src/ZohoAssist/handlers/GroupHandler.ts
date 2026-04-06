import { BaseHandler } from './BaseHandler';

export class GroupHandler extends BaseHandler {
	async handle(operation: string, index: number): Promise<any> {
		const departmentId = this.getParam<string>('departmentId', index);

		if (operation === 'create') {
			const groupName = this.getParam<string>('groupName', index);
			const groupDescription = this.getParam<string>('groupDescription', index);

			if (!groupName?.trim()) throw new Error('Group Name is required.');

			const groupBody: any = {
				group_name: groupName.trim(),
				...(groupDescription ? { description: groupDescription.trim() } : {}),
				...(departmentId ? { department_id: departmentId } : {}),
			};

			return await this.request({ method: 'POST', url: '/unattended_computer/group', body: groupBody, json: true }, index);
		}

		if (operation === 'list') {
			const qs = departmentId ? { department_id: departmentId } : {};
			return await this.request({ method: 'GET', url: '/unattended_computer/group', qs, json: true }, index);
		}

		throw new Error(`The operation "${operation}" is not supported by GroupHandler.`);
	}
}
