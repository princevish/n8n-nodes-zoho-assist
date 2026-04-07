import { IAllExecuteFunctions } from 'n8n-workflow';
import { zohoRequest } from './GenericFunctions';

describe('zohoRequest', () => {
    test('refreshes token when Zoho returns INVALID_OAUTHTOKEN in a Buffer payload', async () => {
        const helperHttpRequest = jest.fn()
            .mockRejectedValueOnce({
                response: {
                    status: 401,
                    data: Buffer.from(JSON.stringify({ error: { code: 2000, message: 'INVALID_OAUTHTOKEN' } })),
                },
                message: 'Request failed with status code 401',
            })
            .mockResolvedValueOnce({ access_token: 'new-access-token' })
            .mockResolvedValueOnce({ result: 'success' });

        const mockContext = {
            getCredentials: jest.fn().mockResolvedValue({
                oauthTokenData: { access_token: 'old-access-token', refresh_token: 'refresh-token' },
                clientId: 'client-id',
                clientSecret: 'client-secret',
                dc: 'in',
            }),
            helpers: {
                httpRequest: helperHttpRequest,
            },
            getNode: jest.fn(),
            getNodeParameter: jest.fn(),
        } as unknown as IAllExecuteFunctions;

        const response = await zohoRequest.call(
            mockContext,
            { method: 'GET', url: '/user', json: true },
            0,
        );

        expect(response).toEqual({ result: 'success' });
        expect(helperHttpRequest).toHaveBeenCalledTimes(3);
        expect((helperHttpRequest.mock.calls[1] as any)[0]).toMatchObject({
            method: 'POST',
            url: 'https://accounts.zoho.in/oauth/v2/token',
        });
    });
});
