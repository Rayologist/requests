import fetch from 'node-fetch';
import { request } from '../src';

jest.mock('node-fetch');

describe(__filename, () => {
  const raw = (): Record<string, string[]> => ({
    'content-type': ['application/json'],
  });

  const headers = {
    raw,
    get: (name: string) => {
      return raw()[name.toLowerCase()];
    },
  };

  it('should launch get request', async () => {
    (fetch as any).mockResolvedValue({
      json: () => Promise.resolve({ userId: 1 }),
      headers,
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
    (fetch as any).mockResolvedValue({
      json: () => Promise.resolve({ error: 'not found' }),
      text: () => Promise.resolve(''),
      ok: false,
      status: 404,
      headers,
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
    expect(thrown).toStrictEqual(error);
  });

  it('should correctly handle successful responses with a custom success handler', async () => {
    (fetch as any).mockResolvedValue({
      json: () => Promise.resolve({ userId: 1 }),
      headers,
      ok: true,
      status: 200,
    });

    const [data, err] = await request(
      {
        url: 'https://example.com',
        method: 'GET',
      },
      {
        handleSuccessResponse: async (response) => {
          return 123;
        },
      },
    );

    expect(data).toEqual(123);
    expect(err).toBeNull();
  });

  it('should correctly handle failed responses with a custom error handler', async () => {
    const buffer = Buffer.from('some error message');
    (fetch as any).mockResolvedValue({
      json: () => Promise.resolve({ error: 'not found' }),
      text: () => Promise.resolve(''),
      ok: false,
      status: 404,
      headers,
    });

    const [data, err] = await request(
      {
        url: 'https://example.com',
        method: 'POST',
      },
      {
        handleErrorResponse: async (response) => {
          return buffer;
        },
      },
    );

    const error = {
      data: buffer,
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
    expect(thrown).toStrictEqual(error);
  });
});
