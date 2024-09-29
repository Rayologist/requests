import { Response } from 'node-fetch';

type PartialRecord<T> = {
  [P in keyof T]?: Partial<T[P]>;
};

export function createMockResponse(args: PartialRecord<Response>) {
  return args as Response;
}
