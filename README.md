# TypeScript Backend Utility: `request`

This repository contains a TypeScript utility function, `request`, designed to make HTTP requests simple and consistent. The function is built on top of `node-fetch` and provides additional features such as timeouts, request payload support, query parameter support, and more.

## Installation

Please feel free to copy the code from `src/index.ts` into your project. Alternatively, you can git clone this repository.

Here's the required packages:

```bash
pnpm i node-fetch@2 qs
```

If you are using typescript:

```bash
pnpm i -D typescript @types/node-fetch @types/qs
```

## Usage

### GET request with query string

```typescript
import { request } from '<package-name>';

const [data, error] = await request<{}, ResponseType>({
  url: 'https://api.example.com/endpoint',
  method: 'GET',
  query: { _limit: 5, _sort: 'desc' },
});

```

In this case, the `query` object includes both `_limit` and `_sort`. The constructed URL would be `https://api.example.com/endpoint?_limit=5&_sort=desc`.

#### Customizing Query Strings with `queryOptions`

This feature leverages the `qs` library to stringify the query object.

You can pass in options recognized by `qs.stringify` through the `queryOptions` field. This allows you to control array format, add array indices, specify delimiter types, and much more.

Here's an example:

```typescript
const [data, error] = await request<{}, ResponseType>({
  url: 'https://api.example.com/items',
  method: 'GET',
  query: { arrayParam: ['item1', 'item2', 'item3'] },
  queryOptions: {
    arrayFormat: 'indices'
  }
});
```

In this example, the URL would be transformed to:

```txt
https://api.example.com/items?arrayParam[0]=item1&arrayParam[1]=item2&arrayParam[2]=item3
```

For a complete list of options and their usage, you can refer to the [`qs` library documentation](https://github.com/ljharb/qs).

### POST request with JSON payload

```typescript
const [data, error] = await request<{ userId: string, username: string }, ResponseType>({
  url: 'https://api.example.com/endpoint',
  method: 'POST',
  payload: { userId: 'e534f5a8f828b4', username: "rayologist" },
  headers: { 'Content-Type': 'application/json' },
  timeout: 60,
});
```

In this case, the `payload` object includes both `userId` and `username`. The `headers` object specifies that the payload is JSON. The `timeout` property specifies that the request should timeout after 60 seconds.

### Using URL Parameters

In certain scenarios, you may need to use dynamic URL parameters in your request URL. For example, RESTful APIs often use path parameters to identify specific resources. The `request` function supports this feature through the `urlParams` option.

```typescript
const [data, error] = await request<{}, ResponseType>({
  url: 'https://api.example.com/users/:userId/posts/:postId',
  method: 'GET',
  urlParams: { userId: 1, postId: 999 },
});

if (data) {
  console.log(`Post data: ${JSON.stringify(data)}`);
}

if (error) {
  console.log(error.message);
}
```

In this case, the `urlParams` object includes both `userId` and `postId`. The constructed URL would be `https://api.example.com/users/1/posts/999`.

### Handling Errors

Here's how you can handle errors in a basic scenario:

```typescript
const [data, error] = await request<{}, ResponseType>({
  url: 'https://api.example.com/endpoint',
  method: 'GET',
});

if (error) {
  console.error(error.message);
}
```

In this example, if the request fails, the `error` object will be populated, and you can log the error message or take other appropriate actions.

#### Advanced Error Handling with `RequestError`

The function will throw a `RequestError` object containing additional information that can help with debugging:

- `message`: A string description of the error, including method, URL, and status code (if applicable).
- `statusCode`: The HTTP status code of the response
- `data`: The payload returned in the error response, if any
- `url`: The URL where the request was made
- `method`: The HTTP method used for the request
- `headers`: The headers returned by the server
- `timestamp`: The timestamp when the error occurred

```typescript
const [data, error] = await request<{}, ResponseType>({
  url: 'https://api.example.com/endpoint',
  method: 'GET',
});

if (error instanceof RequestError) {
  console.error(`Request failed with status code ${error.statusCode}`);
  console.error(`Error data: ${JSON.stringify(error.data)}`);
  console.error(`Failed URL: ${error.url}`);
  // ... other debug information
}
```

#### Typing Error Return Values

If you are aware of the structure of the error payload that could be returned from a specific API endpoint, you can specify that type by providing it as the third type parameter when calling the `request` function. This will allow you to benefit from TypeScript's type checking for better error handling.

Here's an example:

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
    // Now `error.data` is strongly typed
    console.log(`Error message: ${error.data.message}`);
    console.log(`Error code: ${error.data.errorCode}`);
  }
}
```

By using the third type parameter, you make your error handling code more robust and self-explanatory, as TypeScript will enforce that `error.data` conforms to the `ExpectedErrorType` interface.

#### Handling Timeout

The `request` function supports timeout via the `timeout` option. When a timeout occurs, it also throws a `RequestError` object, which you can handle as follows:

```typescript
const [data, error] = await request<{}, ResponseType>({
  url: 'https://api.example.com/slow-endpoint',
  method: 'GET',
  timeout: 10, // 10 seconds timeout
});

if (error instanceof RequestError) {
  if (error.message.includes('timeout')) {
    console.error(error.message);
    console.log(`Timeout occurred after ${error?.data.timeout.seconds} seconds`)
  }
}
```

## API Reference

### Types

#### `Request`

An object that describes the properties for setting up an HTTP request. See inline comments in the source code for detailed property descriptions.

### Functions

#### `request`

Generalized HTTP request function.

### RequestError Class

Extends the native `Error` class to include additional fields useful for debugging HTTP errors.

## Contact

If you have any questions, please feel free to file issues or contact me at `bwchen.dev@gmail.com`
