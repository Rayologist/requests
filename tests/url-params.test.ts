import { populateParams } from '../src';

describe(__filename, () => {
  it('should populate params', () => {
    const url = 'https://jsonplaceholder.typicode.com/posts/:postId/comments';
    const params = {
      postId: 2,
    };
    const expected = 'https://jsonplaceholder.typicode.com/posts/2/comments';
    expect(populateParams(url, params)).toEqual(expected);

    const url2 = 'https://jsonplaceholder.typicode.com/posts/:postId/comments/:commentId';
    const params2 = {
      postId: 2,
      commentId: 3,
    };
    const expected2 = 'https://jsonplaceholder.typicode.com/posts/2/comments/3';
    expect(populateParams(url2, params2)).toEqual(expected2);

    const url3 = 'https://jsonplaceholder.typicode.com/posts/:postId/comments/:comment_id';
    const params3 = {
      postId: 2,
      comment_id: 5,
    };
    const expected3 = 'https://jsonplaceholder.typicode.com/posts/2/comments/5';
    expect(populateParams(url3, params3)).toEqual(expected3);
  });

  it('should not populate params', () => {
    const url = 'https://jsonplaceholder.typicode.com/posts/:postId/comments';
    const params = {
      postId: 2,
      commentId: 3,
    };
    const expected = 'https://jsonplaceholder.typicode.com/posts/2/comments';
    expect(populateParams(url, params)).toEqual(expected);

    const url2 = 'https://jsonplaceholder.typicode.com/posts/:postId/comments/:commentId';
    const params2 = {
      postId: 2,
    };

    const expected2 = 'https://jsonplaceholder.typicode.com/posts/2/comments/';
    expect(populateParams(url2, params2)).toEqual(expected2);

    const url3 = 'https://jsonplaceholder.typicode.com/posts/:postId/comments/:comment_id';
    const params3 = {
      comment_id: 2,
    };

    const expected3 = 'https://jsonplaceholder.typicode.com/posts//comments/2';
    expect(populateParams(url3, params3)).toEqual(expected3);
  });
});
