import { BaseHandler } from './BaseHandler';

export class UserHandler extends BaseHandler {
	async handle(operation: string, index: number): Promise<any> {
		if (operation === 'get') {
			return await this.request({ method: 'GET', url: '/user', json: true }, index);
		}
		throw new Error(`The operation "${operation}" is not supported by UserHandler.`);
	}
}
