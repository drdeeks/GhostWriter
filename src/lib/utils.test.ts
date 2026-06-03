import { cn } from './utils';

describe('cn utility', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'active', false && 'disabled')).toBe('base active');
  });

  it('should handle array of classes', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('should handle object-based classes', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo');
  });

  it('should merge tailwind classes properly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
  });

  it('should handle null and undefined', () => {
    expect(cn('foo', null, undefined, 'bar')).toBe('foo bar');
  });
});
