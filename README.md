# TypeScript HTTP Request Utility

This repository contains a TypeScript utility function, `request`, designed to make HTTP requests simple, consistent, and robust. Built on top of `node-fetch`, it provides additional features such as timeouts, automatic retries, custom response handling, and more.

## Table of Contents

1. [Installation](#installation)
2. [Basic Usage](#basic-usage)
3. [Advanced Features](#advanced-features)
   - [URL Parameters](#url-parameters)
   - [Query Parameters](#query-parameters)
   - [Automatic Retries](#automatic-retries)
   - [Custom Response Handling](#custom-response-handling)
4. [API Reference](#api-reference)
5. [Error Handling](#error-handling)
6. [Examples](#examples)

## Installation

You can either copy the code from `src/index.ts` into your project or clone this repository.

Install the required packages:

```bash
pnpm i node-fetch@2 qs
```

For TypeScript users:

```bash
pnpm i -D typescript @types/node-fetch @types/qs
```

## Basic Usage

Here's a simple example of how to use the library:

```typescript
import { request } from '<package-name>';

async function fetchUserData(userId: string) {
  const [data, error] = await request({
    url: 'https://api.example.com/users/:id',
    method: 'GET',
    urlParams: { id: userId },
  });

  if (error) {
    console.error('Error fetching user data:', error);
    return null;
  }

  return data;
}
```

## Advanced Features

### URL Parameters

You can use URL parameters by including them in the URL with a colon prefix and providing values in the `urlParams` object:

```typescript
const [data, error] = await request({
  url: 'https://api.example.com/users/:userId/posts/:postId',
  method: 'GET',
  urlParams: { userId: 1, postId: 999 },
});
```

### Query Parameters

You can include query parameters in your request:

```typescript
const [data, error] = await request({
  url: 'https://api.example.com/search',
  method: 'GET',
  query: {
    q: 'nodejs',
    page: 1,
    limit: 10,
  },
});
```

#### Customizing Query Strings with `queryOptions`

You can pass options recognized by `qs.stringify` through the `queryOptions` field:

```typescript
const [data, error] = await request({
  url: 'https://api.example.com/items',
  method: 'GET',
  query: { arrayParam: ['item1', 'item2', 'item3'] },
  queryOptions: {
    arrayFormat: 'indices'
  }
});
```

This would result in the URL: `https://api.example.com/items?arrayParam[0]=item1&arrayParam[1]=item2&arrayParam[2]=item3`

### Automatic Retries

Configure automatic retries for failed requests:

```typescript
const [data, error] = await request({
  url: 'https://api.example.com/data',
  method: 'GET',
}, {
  retry: {
    count: 3,
    delay: 1000, // 1 second between retries
  },
});
```

You can also use a function to implement more advanced retry strategies:

```typescript
retry: {
  count: 3,
  delay: (attempt) => Math.pow(2, attempt) * 1000, // Exponential backoff
}
```

### Custom Response Handling

You can provide custom handlers for successful and error responses:

```typescript
const [data, error] = await request({
  url: 'https://api.example.com/data',
  method: 'GET',
}, {
  handleSuccessResponse: async (response) => {
    return response.blob()
  },
  handleErrorResponse: async (response) => {
    return response.text()
  },
});
```

## API Reference

### `request<Payload, Data, ErrorReturn>(args: Request<Payload>, options?: RequestOptions)`

The main function for making HTTP requests.

#### Parameters

- `args`: An object containing request details
  - `url`: The URL to send the request to
  - `method`: The HTTP method ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')
  - `query` (optional): Query parameters
  - `urlParams` (optional): URL parameters to replace in the URL
  - `payload` (optional): Request body for POST, PUT, PATCH requests
  - `headers` (optional): Request headers
  - `queryOptions` (optional): Options for query string stringification

- `options` (optional): Additional request options
  - `retry` (optional): Retry configuration
    - `count`: Number of retry attempts
    - `delay`: Delay between retries (number in ms or function)
  - `timeout` (optional): Request timeout in milliseconds
  - `handleErrorResponse` (optional): Custom error response handler
  - `handleSuccessResponse` (optional): Custom success response handler

#### Returns

A Promise that resolves to a tuple:

- On success: `[data, null]`
- On error: `[null, error]`

## Error Handling

The library uses a `RequestError` class for error handling. It includes details such as status code, error data, URL, method, headers, and timestamp.

```typescript
const [data, error] = await request({
  url: 'https://api.example.com/data',
  method: 'GET',
});

if (error instanceof RequestError) {
  console.error(`Error ${error.statusCode}: ${error.message}`);
  console.error('Error data:', error.data);
  console.error(`Failed URL: ${error.url}`);
  // ... other debug information
}
```

### Typing Error Return Values

You can specify the structure of expected error payloads:

```typescript
interface ExpectedErrorType {
  message: string;
  errorCode: number;
}

const [data, error] = await request<RequestPayload, ResponseType, ExpectedErrorType>({
  url: 'https://api.example.com/endpoint',
  method: 'GET',
});

if (error instanceof RequestError) {
  if (error.data) {
    console.log(`Error message: ${error.data.message}`);
    console.log(`Error code: ${error.data.errorCode}`);
  }
}
```

### Handling Timeout

```typescript
const [data, error] = await request({
  url: 'https://api.example.com/slow-endpoint',
  method: 'GET',
  timeout: 10000, // 10 seconds timeout
});

if (error instanceof RequestError) {
  if (error.message.includes('timeout')) {
    console.error(error.message);
    console.log(`Timeout occurred after ${error?.data.timeout.seconds} seconds`);
  }
}
```

## Examples

### POST Request with JSON Payload

```typescript
const [data, error] = await request({
  url: 'https://api.example.com/users',
  method: 'POST',
  payload: {
    name: 'John Doe',
    email: 'john@example.com',
  },
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### GET Request with Query Parameters

```typescript
const [data, error] = await request({
  url: 'https://api.example.com/search',
  method: 'GET',
  query: {
    q: 'nodejs',
    page: 1,
    limit: 10,
  },
});
```

### Request with Timeout

```typescript
const [data, error] = await request({
  url: 'https://api.example.com/long-running-task',
  method: 'GET',
}, {
  timeout: 60000, // 60 seconds
});
```

This documentation provides an overview of the HTTP request library's features and usage. For more detailed information about specific functions or classes, refer to the inline comments in the source code.

## Contact

If you have any questions, please feel free to file issues or contact the maintainer at `bwchen.dev@gmail.com`.
