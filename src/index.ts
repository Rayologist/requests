import fetch, { HeaderInit } from 'node-fetch';
import qs from 'qs';

export async function request<
  Payload extends Record<string, any>,
  Data = unknown,
  ErrorReturn = unknown,
>(
  args: Request<Payload>,
): Promise<readonly [Data, null] | readonly [null, RequestError<ErrorReturn>]> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | null = null;

  const { url, method, payload, headers, query, queryOptions, urlParams, timeout = 30 } = args;

  const body = constuctBody(payload, method);
  const requestURL = constructURL({ url, query, method, queryOptions, urlParams });

  try {
    timer = setTimeout(() => {
      controller.abort(`{ url: "${requestURL}", timeout: "${timeout} s" }`);
    }, timeout * 1000);

    const response = await fetch(requestURL, {
      method,
      body,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      let data;
      if (response.headers.get('Content-Type')?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      throw new RequestError({
        statusCode: response.status,
        data,
        url: requestURL,
        method,
        headers: response.headers.raw(),
        timestamp: Date.now(),
      });
    }

    clearTimeout(timer);

    const contentType = response.headers.get('Content-Type');

    let data: any;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return [data as Data, null] as const;
  } catch (e) {
    if (timer) {
      clearTimeout(timer);
    }

    if (e instanceof Error) {
      if (e.name === 'AbortError') {
        e = new RequestError({
          message: controller.signal.reason,
          url: url,
          method: method,
          timestamp: Date.now(),
        });
      }
    }

    return [null, e as RequestError<ErrorReturn>] as const;
  }
}

export function constuctBody<T extends Record<string, any>>(
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
  headers?: HeaderInit;
  timeout?: number;
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
  message?: string;
  data?: T;
  headers?: Record<string, string[]>;
};

export type HTTPMethods = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
