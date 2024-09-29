import fetch, { HeadersInit, Response } from 'node-fetch';
import { AbortSignal } from 'node-fetch/externals';
import qs from 'qs';

async function baseRequest<
  Payload extends Record<string, any>,
  Data = unknown,
  ErrorReturn = unknown,
>(
  args: Request<Payload>,
  options?: Omit<RequestOptions, 'retry'>,
): Promise<readonly [Data, null] | readonly [null, RequestError<ErrorReturn>]> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | null = null;

  const { url, method, payload, headers, query, queryOptions, urlParams } = args;
  const {
    handleErrorResponse = handleResponse,
    handleSuccessResponse = handleResponse,
    timeout = 30 * 1000,
  } = options || {};

  const body = constructBody(payload, method);
  const requestURL = constructURL({ url, query, method, queryOptions, urlParams });

  try {
    timer = setTimeout(() => {
      controller.abort();
    }, timeout);

    const response = await fetch(requestURL, {
      method,
      body,
      headers,
      signal: controller.signal as AbortSignal,
    });

    if (!response.ok) {
      const data = await handleErrorResponse(response);

      throw new RequestError({
        message: `Request failed: ${method} ${requestURL} returned a status code of ${response.status}`,
        statusCode: response.status,
        data,
        url: requestURL,
        method,
        headers: response.headers.raw(),
        timestamp: Date.now(),
      });
    }

    clearTimeout(timer);

    const data = await handleSuccessResponse(response);

    return [data as Data, null] as const;
  } catch (e) {
    if (timer) {
      clearTimeout(timer);
    }

    if (e instanceof Error) {
      if (e.name === 'AbortError') {
        e = new RequestError({
          message: `Request timeout: ${method} ${requestURL} did not respond within ${timeout} second(s)`,
          data: { timeout: { seconds: timeout } },
          url: url,
          method: method,
          timestamp: Date.now(),
        });
      }
    }

    return [null, e as RequestError<ErrorReturn>] as const;
  }
}

export async function request<
  Payload extends Record<string, any>,
  Data = unknown,
  ErrorReturn = unknown,
>(
  args: Request<Payload>,
  options?: RequestOptions,
): Promise<readonly [Data, null] | readonly [null, RequestError<ErrorReturn>]> {
  const { retry } = options || {};

  if (retry?.count && retry.count > 0) {
    for (let count = 0; count < retry.count; count++) {
      const [data, error] = await baseRequest<Payload, Data, ErrorReturn>(args, options);

      if (error?.statusCode === 429) {
        return [null, error];
      }

      if (error && count === retry.count) {
        return [null, error];
      }

      if (error) {
        let delay: number | undefined = undefined;

        if (typeof retry.delay === 'function') {
          delay = retry.delay(count);
        } else if (typeof retry.delay === 'number') {
          delay = retry.delay;
        } else {
          delay = computeDefaultRetryDelay(count);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        return [data, null];
      }
    }
  }

  return baseRequest<Payload, Data, ErrorReturn>(args, options);
}

export const handleResponse: ResponseHandler = async (response) => {
  let data: any;

  if (response.headers.get('Content-Type')?.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return data;
};

export const computeDefaultRetryDelay: RetryDelayComputer = (retryCount) => {
  return retryCount * 2000;
};

export function constructBody<T extends Record<string, any>>(
  payload: T | undefined,
  method: HTTPMethods,
) {
  const p = payload || {};

  if (method === 'GET' || Object.keys(p).length === 0) {
    return undefined;
  }

  return JSON.stringify(p);
}

export function populateParams(url: string, params: { [key: string]: string | number }) {
  const urls = url.split('/');
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    if (url.startsWith(':')) {
      const key = url.slice(1);
      const value = params[key] ?? '';
      urls[i] = encodeURIComponent(value);
    }
  }

  return urls.join('/');
}

export function constructURL<T extends Record<string, any>>(args: {
  url: string;
  query?: T | undefined;
  method: HTTPMethods;
  queryOptions?: qs.IStringifyOptions;
  urlParams?: Record<string, any>;
}) {
  const { url, query, method, queryOptions, urlParams } = args;

  let requestURL = url;

  if (urlParams) {
    requestURL = populateParams(requestURL, urlParams);
  }

  if (method === 'GET' && query && Object.keys(query).length > 0) {
    return `${requestURL}?${qs.stringify(query, queryOptions)}`;
  }

  return requestURL;
}

export type Request<Payload extends Record<string, any>> = {
  url: string;
  method: HTTPMethods;
  query?: Record<string, any>;
  urlParams?: Record<string, any>;
  payload?: Payload;
  headers?: HeadersInit;
  queryOptions?: qs.IStringifyOptions;
};

export class RequestError<T> extends Error {
  statusCode?: number;
  data?: T;
  url: string;
  method: HTTPMethods;
  headers?: Record<string, string[]>;
  timestamp: number;

  constructor(args: RequestErrorArgs<T>) {
    const { message, statusCode, data, url, method, headers, timestamp } = args;
    super(message);

    this.name = 'RequestError';
    this.statusCode = statusCode;
    this.data = data;
    this.url = url;
    this.method = method;
    this.headers = headers;
    this.timestamp = timestamp;
  }
}

type RequestErrorArgs<T> = {
  url: string;
  method: HTTPMethods;
  timestamp: number;
  statusCode?: number;
  message: string;
  data?: T;
  headers?: Record<string, string[]>;
};

export type RequestOptions = {
  retry?: {
    count?: number;
    delay?: RetryDelayComputer | number;
  };
  timeout?: number;
  handleErrorResponse?: ResponseHandler;
  handleSuccessResponse?: ResponseHandler;
};

export type ResponseHandler = (response: Response) => Promise<any>;

export type RetryDelayComputer = (attempt: number) => number;

export type HTTPMethods = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
