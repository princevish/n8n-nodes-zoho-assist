import {
	IExecuteFunctions,
	INodeExecutionData,
} from 'n8n-workflow';
import { zohoRequest } from '../GenericFunctions';

export abstract class BaseHandler {
	constructor(protected readonly context: IExecuteFunctions) {}

	/**
	 * Helper to get node parameters easily
	 */
	protected getParam<T>(name: string, index: number, defaultValue?: T): T {
		return this.context.getNodeParameter(name, index, defaultValue) as T;
	}

	/**
	 * Common request wrapper
	 */
	protected async request(options: any, index: number) {
		return await zohoRequest.call(this.context, options, index);
	}

	/**
	 * Handle the operation. Each sub-handler implements this.
	 */
	abstract handle(operation: string, index: number): Promise<INodeExecutionData[] | any>;

	/**
	 * Utility for validating email
	 */
	protected validateEmail(email: string, operationName: string): string {
		const trimmed = email?.trim();
		if (!trimmed) {
			throw new Error(`Customer Email is required for ${operationName}.`);
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
			throw new Error(`Customer Email "${trimmed}" is not a valid email address.`);
		}
		return trimmed;
	}

	/**
	 * Utility for validating date
	 */
	protected validateDate(dateStr: string, fieldName: string): number {
		if (!dateStr) {
			throw new Error(`${fieldName} is required.`);
		}
		const ts = new Date(dateStr).getTime();
		if (isNaN(ts)) {
			throw new Error(`${fieldName} "${dateStr}" is not a valid date format.`);
		}
		return ts;
	}
}
