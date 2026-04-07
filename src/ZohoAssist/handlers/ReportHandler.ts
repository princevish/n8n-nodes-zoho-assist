import { BaseHandler } from './BaseHandler';

export class ReportHandler extends BaseHandler {
	async handle(operation: string, index: number): Promise<any> {
		if (operation === 'list') {
			const type = this.getParam<string>('reportType', index);
			const fromDate = this.getParam<string>('fromDate', index);
			const toDate = this.getParam<string>('toDate', index);
			const qs: any = { type, count: 100 };

			if (fromDate) {
				const fromTs = this.validateDate(fromDate, 'From Date');
				qs.fromdate = fromTs.toString();
			}
			if (toDate) {
				const toTs = this.validateDate(toDate, 'To Date');
				qs.todate = toTs.toString();
			}
			if (fromDate && toDate && new Date(fromDate).getTime() > new Date(toDate).getTime()) {
				throw new Error('From Date must be before To Date.');
			}

			return await this.request({ method: 'GET', url: '/reports', qs, json: true }, index);
		}

		if (operation === 'downloadRecording') {
			const resourceId = String(this.getParam<string>('resourceId', index) ?? '');
			if (!resourceId.trim()) throw new Error('Session ID is required.');

			const response = await this.request({
				method: 'GET',
				url: `/download_session_video/${resourceId.trim()}`,
				responseType: 'arraybuffer',
				encoding: 'arraybuffer',
			}, index);

			const binary = await this.context.helpers.prepareBinaryData(Buffer.from(response), `${resourceId.trim()}.mp4`, 'video/mp4');
			return { sessionId: resourceId.trim(), binary };
		}

		throw new Error(`The operation "${operation}" is not supported by ReportHandler.`);
	}
}
