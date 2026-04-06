import {
	IAllExecuteFunctions,
	NodeApiError,
} from 'n8n-workflow';

export async function zohoRequest(this: IAllExecuteFunctions, options: any, itemIndex: number) {
	const maxRetries = 2;
	let lastError: any;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			const credentials = await this.getCredentials('zohoAssistOAuth2', itemIndex);
			const tokenData = credentials.oauthTokenData as any;
			const token = (tokenData?.access_token || credentials.accessToken || credentials.oauthToken || tokenData?.accessToken) as string;

			if (!token) {
				throw new Error('Access token missing. Please re-authenticate.');
			}

			const dc = (credentials.dc as string) || 'in';
			const baseMap: { [key: string]: string } = {
				in: 'https://assist.zoho.in',
				com: 'https://assist.zoho.com',
				eu: 'https://assist.zoho.eu',
				'com.au': 'https://assist.zoho.com.au',
				'com.cn': 'https://assist.zoho.com.cn',
				jp: 'https://assist.zoho.jp',
			};
			const baseUrl = baseMap[dc] || 'https://assist.zoho.in';
			const apiUrl = `${baseUrl}/api/v2`;

			const headers: { [key: string]: string } = {
				'Content-Type': 'application/x-www-form-urlencoded', // Default
				'Authorization': `Zoho-oauthtoken ${token}`,
				...options.headers,
			};

			// If json: true is passed, ensure Content-Type is correct if not already overridden
			if (options.json && !options.headers?.['Content-Type']) {
				headers['Content-Type'] = 'application/json';
			}

			// Ensure no collision with n8n injected headers if they somehow get through
			if (headers['authorization']) delete headers['authorization'];

			const requestOptions = {
				...options,
				url: options.url.startsWith('http') ? options.url : `${apiUrl}${options.url.startsWith('/') ? options.url : '/' + options.url}`,
				headers,
			};

			try {
				return await this.helpers.httpRequest.call(this, requestOptions);
			} catch (error: any) {
				const bodyStr = typeof requestOptions.body === 'string' ? requestOptions.body : JSON.stringify(requestOptions.body || {});
				const errorData = JSON.stringify(error.response?.data || error.message);
				// Enhanced diagnostic for all non-2xx errors
				throw new NodeApiError(this.getNode(), error, {
					message: `ZOHO_API_ERROR: ${errorData} | SENT_BODY: ${bodyStr} | URL: ${requestOptions.method} ${requestOptions.url}`,
				});
			}
		} catch (error: any) {
			lastError = error;
			if (error.name === 'NodeApiError') throw error; // Re-throw our diagnostic
			const status = error?.statusCode || error?.response?.status;
			const errorCode = error?.response?.data?.error?.code;

			// Special handling for Zoho 401 - Code 2000 (Invalid Token)
			if (status === 401 && (errorCode === 2000 || (error.message && error.message.includes('INVALID_OAUTHTOKEN')))) {
				const creds = await this.getCredentials('zohoAssistOAuth2', itemIndex);
				const dcValue = (creds.dc as string) || 'in';
				throw new Error(`Authorization failed (Code 2000). This usually means your Access Token is invalid for the selected Data Center (${dcValue}). Please ensure your Zoho account is actually in the ${dcValue.toUpperCase()} region.`);
			}

			if (status >= 400 && status < 500 && status !== 429 && status !== 401) throw error;

			if (attempt < maxRetries - 1) {
				await new Promise((res) => setTimeout(res, 1000));
			}
		}
	}
	throw lastError;
}
