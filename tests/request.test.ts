import nodeFetch, { Headers } from 'node-fetch';
import { request } from '../src';
import { createMockResponse } from './test.utils';

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
  } as unknown as Headers;

  const fetch = nodeFetch as jest.MockedFunction<typeof nodeFetch>;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('should launch get request', async () => {
    const response = createMockResponse({
      json: () => Promise.resolve({ userId: 1 }),
      headers,
      ok: true,
      status: 200,
    });

    fetch.mockResolvedValue(response);

    const [data, err] = await request({
      url: 'https://example.com',
      method: 'GET',
    });

    expect(data).toEqual({ userId: 1 });
    expect(err).toBeNull();
  });

  it('should throw error', async () => {
    const response = createMockResponse({
      json: () => Promise.resolve({ error: 'not found' }),
      text: () => Promise.resolve(''),
      ok: false,
      status: 404,
      headers,
    });

    fetch.mockResolvedValue(response);

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
    const response = createMockResponse({
      json: () => Promise.resolve({ userId: 1 }),
      headers,
      ok: true,
      status: 200,
    });

    fetch.mockResolvedValue(response);

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

    const response = createMockResponse({
      json: () => Promise.resolve({ error: 'not found' }),
      text: () => Promise.resolve(''),
      ok: false,
      status: 404,
      headers,
    });

    fetch.mockResolvedValue(response);

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

  it('should retry request', async () => {
    const errorResponse = createMockResponse({
      json: () => Promise.resolve({ error: 'Server Error' }),
      headers,
      ok: false,
      status: 500,
    });

    const successResponse = createMockResponse({
      json: () => Promise.resolve({ userId: 1 }),
      headers,
      ok: true,
      status: 200,
    });

    fetch.mockResolvedValueOnce(errorResponse).mockResolvedValueOnce(successResponse);

    const req = request(
      {
        url: 'https://example.com',
        method: 'GET',
      },
      { retry: { count: 1, delay: 0 } },
    );

    await jest.runAllTimersAsync();

    const [data, err] = await req;

    expect(data).toEqual({ userId: 1 });
    expect(err).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should stop retrying after receiving 429 status code', async () => {
    const errorResponse = createMockResponse({
      json: () => Promise.resolve({ error: 'Too Many Requests' }),
      headers,
      ok: false,
      status: 429,
    });

    fetch.mockResolvedValueOnce(errorResponse);

    const req = request(
      {
        url: 'https://example.com',
        method: 'GET',
      },
      { retry: { count: 5, delay: 0 } },
    );

    await jest.runAllTimersAsync();

    const [data, err] = await req;

    const thrown = {
      data: err?.data,
      headers: err?.headers,
      method: err?.method,
      statusCode: err?.statusCode,
      timestamp: err?.timestamp,
      url: err?.url,
    };

    expect(data).toBeNull();
    expect(thrown).toEqual({
      data: { error: 'Too Many Requests' },
      headers: { 'content-type': ['application/json'] },
      method: 'GET',
      statusCode: 429,
      timestamp: expect.any(Number),
      url: 'https://example.com',
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry request with custom retry delay', async () => {
    const errorResponse = createMockResponse({
      json: () => Promise.resolve({ error: 'Server Error' }),
      headers,
      ok: false,
      status: 500,
    });

    const errorResponse2 = createMockResponse({
      json: () => Promise.resolve({ error: 'Server Error 2' }),
      headers,
      ok: false,
      status: 500,
    });

    const successResponse = createMockResponse({
      json: () => Promise.resolve({ userId: 1 }),
      headers,
      ok: true,
      status: 200,
    });

    fetch
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(errorResponse2)
      .mockResolvedValueOnce(successResponse);

    const req = request(
      {
        url: 'https://example.com',
        method: 'GET',
      },
      {
        retry: {
          count: 5,
          delay: (times) => {
            return times * 2000;
          },
        },
      },
    );

    await jest.advanceTimersByTimeAsync(60000);

    const [data, err] = await req;

    expect(data).toEqual({ userId: 1 });
    expect(err).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
