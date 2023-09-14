import fetch from 'node-fetch';
import { request } from '../src';

jest.mock('node-fetch');

describe(__filename, () => {
  it('should launch get request', async () => {
    (fetch as any).mockResolvedValue({
      json: () => Promise.resolve({ userId: 1 }),
      ok: true,
      status: 200,
    });
    const [data, err] = await request({
      url: 'https://example.com',
      method: 'GET',
    });

    expect(data).toEqual({ userId: 1 });
    expect(err).toBeNull();
  });

  it('should throw error', async () => {
    const raw = (): Record<string, string[]> => ({
      'content-type': ['application/json'],
    });

    (fetch as any).mockResolvedValue({
      json: () => Promise.resolve({ error: 'not found' }),
      text: () => Promise.resolve(''),
      ok: false,
      status: 404,
      headers: {
        raw,
        get: (name: string) => {
          return raw()[name.toLowerCase()];
        },
      },
    });

    const [data, err] = await request({
      url: 'https://example.com',
      method: 'POST',
    });

    const error = {
      data: { error: 'not found' },
      headers: { 'content-type': ['application/json'] },
      method: 'POST',
      statusCode: 404,
      timestamp: expect.any(Number),
      url: 'https://example.com',
    };

    const thrown = {
      data: err?.data,
      headers: err?.headers,
      method: err?.method,
      statusCode: err?.statusCode,
      timestamp: err?.timestamp,
      url: err?.url,
    };

    expect(data).toBeNull();
    expect(error).toStrictEqual(thrown);
  });
});
