import { BaseHandler } from './BaseHandler';

export class CustomApiHandler extends BaseHandler {
	async handle(operation: string, index: number): Promise<any> {
		if (operation === 'customApi') {
			const httpMethod = this.getParam<string>('httpMethod', index);
			const apiPath = this.getParam<string>('apiPath', index);
			const queryParams = this.getParam<any>('queryParams', index);
			const customHeaders = this.getParam<any>('headers', index);
			const body = this.getParam<string>('body', index);

			if (!apiPath?.trim()) throw new Error('API Path is required.');
			if (!apiPath.startsWith('/') && !apiPath.startsWith('http')) {
				throw new Error('API Path should start with "/" or be a full URL.');
			}

			const qs: { [key: string]: any } = {};
			if (queryParams?.parameters) {
				for (const param of queryParams.parameters) {
					if (!param.name?.trim()) throw new Error('Query parameter name cannot be empty.');
					qs[param.name] = param.value;
				}
			}

			const fullHeaders: { [key: string]: any } = {};
			if (customHeaders?.headers) {
				for (const header of customHeaders.headers) {
					if (!header.name?.trim()) throw new Error('Header name cannot be empty.');
					fullHeaders[header.name] = header.value;
				}
			}

			const options: any = { method: httpMethod, url: apiPath.trim(), headers: fullHeaders, qs, json: true };

			if (body?.trim()) {
				try {
					options.body = JSON.parse(body.trim());
				} catch (e) {
					throw new Error('Request body is not valid JSON.');
				}
			}

			return await this.request(options, index);
		}
		throw new Error(`The operation "${operation}" is not supported by CustomApiHandler.`);
	}
}
