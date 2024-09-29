import { constructURL, constructBody } from '../src';

describe(__filename, () => {
  it('should construct url when the http method is get', () => {
    const targetUrl = 'https://example.com/posts/1/comments?_limit=100&_order=asc';

    const url = constructURL({
      url: 'https://example.com/posts/:postId/comments',
      method: 'GET',
      urlParams: {
        postId: 1,
      },
      query: {
        _limit: 100,
        _order: 'asc',
      },
    });

    expect(url).toEqual(targetUrl);
  });

  it('should not construct url when the http method is not get', () => {
    const targetUrl = 'https://example.com/posts/1/comments';

    const url = constructURL({
      url: 'https://example.com/posts/:postId/comments',
      method: 'POST',
      urlParams: {
        postId: 1,
      },
      query: {
        _limit: 100,
        _order: 'asc',
      },
    });

    expect(url).toEqual(targetUrl);
  });

  it('should not construct url when the query is empty', () => {
    const url = constructURL({
      url: 'https://example.com/posts',
      method: 'GET',
      query: {},
    });

    expect(url).toEqual('https://example.com/posts');
  });

  it('should construct body when there is body and the http method is not get', () => {
    const body = constructBody(
      {
        title: 'foo',
        body: 'bar',
        userId: 1,
      },
      'POST',
    );

    expect(body).toEqual(
      JSON.stringify({
        title: 'foo',
        body: 'bar',
        userId: 1,
      }),
    );
  });

  it('should not construct body when there is no body', () => {
    const body = constructBody({}, 'POST');

    expect(body).toBeUndefined();
  });

  it('should not construct body when the http method is get', () => {
    const body = constructBody(
      {
        title: 'foo',
        body: 'bar',
        userId: 1,
      },
      'GET',
    );

    expect(body).toBeUndefined();
  });
});
