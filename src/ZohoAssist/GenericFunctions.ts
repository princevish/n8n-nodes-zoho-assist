import {
	IAllExecuteFunctions,
	NodeApiError,
} from 'n8n-workflow';

export async function zohoRequest(this: IAllExecuteFunctions, options: any, itemIndex: number) {
	const maxRetries = 2;
	let lastError: any;
	let currentToken: string | null = null;

	const parseRawResponseBody = (body: any) => {
		if (body === undefined || body === null) {
			return {};
		}

		if (Buffer.isBuffer(body)) {
			const text = body.toString('utf8');
			try {
				return JSON.parse(text);
			} catch {
				return { raw: text };
			}
		}

		if (body instanceof ArrayBuffer) {
			const text = Buffer.from(body).toString('utf8');
			try {
				return JSON.parse(text);
			} catch {
				return { raw: text };
			}
		}

		if (body?.type === 'Buffer' && Array.isArray(body.data)) {
			const text = Buffer.from(body.data).toString('utf8');
			try {
				return JSON.parse(text);
			} catch {
				return { raw: text };
			}
		}

		if (typeof body === 'string') {
			try {
				return JSON.parse(body);
			} catch {
				return { raw: body };
			}
		}

		return body;
	};

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			const credentials = await this.getCredentials('zohoAssistOAuth2', itemIndex);
			const tokenData = credentials.oauthTokenData as any;
			const token = currentToken || (tokenData?.access_token || credentials.accessToken || credentials.oauthToken || tokenData?.accessToken) as string;

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
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': `Zoho-oauthtoken ${token}`,
				...options.headers,
			};

			if (options.json && !options.headers?.['Content-Type']) {
				headers['Content-Type'] = 'application/json';
			}

			if (headers['authorization']) delete headers['authorization'];

			const requestOptions = {
				...options,
				url: options.url.startsWith('http') ? options.url : `${apiUrl}${options.url.startsWith('/') ? options.url : '/' + options.url}`,
				headers,
			};

			try {
				return await this.helpers.httpRequest.call(this, requestOptions);
			} catch (error: any) {
				const status = error?.statusCode || error?.response?.status || error?.httpCode;
				const rawResponseBody = error?.response?.data || error?.body || error?.cause?.response?.data;
				const errorDataObj = parseRawResponseBody(rawResponseBody) || {};
				const errorCode = errorDataObj?.error?.code || errorDataObj?.error_code;
				const errorMessage = String(errorDataObj?.error?.message || errorDataObj?.message || error.message || '');

				// If it's a 401 Invalid Token, we let the outer catch handle the refresh/retry
				if (status === 401 && (errorCode === 2000 || /INVALID_OAUTHTOKEN/i.test(errorMessage) || /INVALID_OAUTHTOKEN/i.test(error.message))) {
					throw error;
				}

				const bodyStr = typeof requestOptions.body === 'string' ? requestOptions.body : JSON.stringify(requestOptions.body || {});

				// Translate Zoho error codes to human-readable messages
				const paramName = errorDataObj?.error?.parameter_name || '';
				const zohoMessage = errorDataObj?.error?.message || '';
				let humanMessage = '';

				if (errorCode === 1000 && zohoMessage === 'Internal server error') {
					humanMessage = `Zoho Assist rejected the request (Code 1000). This usually means one of the parameter VALUES is invalid (e.g., wrong department_id, invalid timestamps). ` +
						`Verify your Department ID is correct (use GET /api/v2/user to check). ` +
						`Department IDs are typically 18+ digit strings like "299031000000000411", NOT the Organization ID.`;
				} else if (zohoMessage === 'LESS_THAN_MIN_OCCURANCE') {
					humanMessage = `Required parameter "${paramName}" is missing. Please provide a value for "${paramName}".`;
				} else if (zohoMessage === 'EXTRA_PARAM_FOUND') {
					humanMessage = `Unexpected parameter "${paramName}" was sent. Remove this parameter from the request.`;
				} else if (zohoMessage === 'INVALID_DATATYPE') {
					humanMessage = `Parameter "${paramName}" has wrong data type. Check the Zoho Assist API docs for the correct format.`;
				} else if (errorCode === 5000) {
					humanMessage = `Zoho server error (Code 5000). The Zoho Assist service may be temporarily unavailable. Try again later.`;
				} else if (errorCode === 4000) {
					humanMessage = `Bad request (Code 4000): ${zohoMessage}. Check all parameters match the API specification.`;
				}

				const errorSummary = humanMessage || `Zoho API Error: Code ${errorCode || 'unknown'} - ${zohoMessage || 'No details provided'}`;
				const debugInfo = `\n[Debug] Status: ${status} | Sent Body: ${bodyStr} | URL: ${requestOptions.method} ${requestOptions.url}`;

				throw new NodeApiError(this.getNode(), error, {
					message: `${errorSummary}${debugInfo}`,
				});
			}
		} catch (error: any) {
			lastError = error;
			const status = error?.statusCode || error?.response?.status;
			const errorDataObj = parseRawResponseBody(error.response?.data) || {};
			const errorCode = errorDataObj.error?.code || errorDataObj.error_code;
			const errorMessage = String(errorDataObj?.error?.message || errorDataObj?.message || error.message || '');

			// Handle 401/2000 (Invalid Token) by refreshing the token and retrying
			if (status === 401 && (errorCode === 2000 || /INVALID_OAUTHTOKEN/i.test(errorMessage) || /INVALID_OAUTHTOKEN/i.test(error.message))) {
				if (attempt < maxRetries - 1) {
					try {
						const credentials = await this.getCredentials('zohoAssistOAuth2', itemIndex);
						const tokenData = credentials.oauthTokenData as any;

						if (!tokenData?.refresh_token) {
							throw new Error('No refresh token available. Please re-authenticate.');
						}

						const dc = (credentials.dc as string) || 'in';
						const accountsMap: { [key: string]: string } = {
							in: 'https://accounts.zoho.in',
							com: 'https://accounts.zoho.com',
							eu: 'https://accounts.zoho.eu',
							'com.au': 'https://accounts.zoho.com.au',
							'com.cn': 'https://accounts.zoho.com.cn',
							jp: 'https://accounts.zoho.jp',
						};
						const accountsUrl = accountsMap[dc] || 'https://accounts.zoho.in';

						// Refresh the token
						const refreshResponse = await this.helpers.httpRequest.call(this, {
							method: 'POST',
							url: `${accountsUrl}/oauth/v2/token`,
							headers: {
								'Content-Type': 'application/x-www-form-urlencoded',
							},
							body: {
								grant_type: 'refresh_token',
								refresh_token: tokenData.refresh_token,
								client_id: credentials.clientId,
								client_secret: credentials.clientSecret,
							},
						});

						// Update the token for this execution
						currentToken = refreshResponse.access_token;

					} catch (refreshError) {
						// If refresh fails, continue to retry with the same token or fail
						console.error('Token refresh failed:', refreshError);
					}

					// Small delay before retry
					await new Promise((res) => setTimeout(res, 500));
					continue;
				}

				// If we're out of retries, provide a better error message about the Data Center
				const credentials = await this.getCredentials('zohoAssistOAuth2', itemIndex);
				throw new NodeApiError(this.getNode(), error, {
					message: `Authorization failed after retry. Please verify your Zoho account is actually in the ${String(credentials.dc || 'selected').toUpperCase()} region and re-authenticate.`,
				});
			}

			// For any other terminal errors, re-throw
			if (error.name === 'NodeApiError' || (status >= 400 && status < 500 && status !== 429)) {
				throw error;
			}

			if (attempt < maxRetries - 1) {
				await new Promise((res) => setTimeout(res, 1000));
			}
		}
	}
	throw lastError;
}
