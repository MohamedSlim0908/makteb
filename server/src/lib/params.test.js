import { describe, it, expect } from 'vitest';
import { param, query } from './params.js';

describe('param()', () => {
  it('returns the param value as a string', () => {
    const req = { params: { id: 'abc123' } };
    expect(param(req, 'id')).toBe('abc123');
  });

  it('returns first element when param is an array', () => {
    const req = { params: { id: ['first', 'second'] } };
    expect(param(req, 'id')).toBe('first');
  });

  it('returns undefined when param does not exist', () => {
    const req = { params: {} };
    expect(param(req, 'missing')).toBeUndefined();
  });

  it('handles numeric-like string params', () => {
    const req = { params: { page: '3' } };
    expect(param(req, 'page')).toBe('3');
  });

  it('handles UUID-style params', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const req = { params: { communityId: uuid } };
    expect(param(req, 'communityId')).toBe(uuid);
  });
});

describe('query()', () => {
  it('returns the query value as a string', () => {
    const req = { query: { search: 'tunisie' } };
    expect(query(req, 'search')).toBe('tunisie');
  });

  it('returns undefined when query param does not exist', () => {
    const req = { query: {} };
    expect(query(req, 'missing')).toBeUndefined();
  });

  it('returns first element when query is an array', () => {
    const req = { query: { tag: ['js', 'python'] } };
    expect(query(req, 'tag')).toBe('js');
  });

  it('converts numeric values to string', () => {
    const req = { query: { page: 2 } };
    expect(query(req, 'page')).toBe('2');
  });

  it('returns undefined for explicit undefined values', () => {
    const req = { query: { opt: undefined } };
    expect(query(req, 'opt')).toBeUndefined();
  });

  it('handles empty string query values', () => {
    const req = { query: { q: '' } };
    expect(query(req, 'q')).toBe('');
  });
});
