import { getProperty, setProperty } from '../DynamicSheet';

describe('DynamicSheet Utils', () => {
  describe('getProperty', () => {
    it('should return undefined for null or undefined objects', () => {
      expect(getProperty(null, 'a.b')).toBeUndefined();
      expect(getProperty(undefined, 'a.b')).toBeUndefined();
    });

    it('should return undefined when path implies an object but it is a primitive', () => {
      const obj = { a: 'string' };
      expect(getProperty(obj, 'a.b')).toBeUndefined();
    });

    it('should return the correct value', () => {
      const obj = { a: { b: { c: 5 } } };
      expect(getProperty(obj, 'a.b.c')).toBe(5);
    });
  });

  describe('setProperty', () => {
    it('should handle updating a valid path', () => {
      const obj = { a: { b: 1 } };
      const res = setProperty(obj, 'a.b', 2);
      expect(res.a.b).toBe(2);
      expect(obj.a.b).toBe(1); // immutability
    });

    it('should overwrite a primitive if the path expects an object', () => {
      const obj = { a: 'primitive' };
      const res = setProperty(obj, 'a.b', 2);
      expect(res.a.b).toBe(2);
    });

    it('should overwrite null if the path expects an object', () => {
      const obj = { a: null };
      const res = setProperty(obj, 'a.b', 2);
      expect(res.a.b).toBe(2);
    });

    it('should create nested objects if they do not exist', () => {
      const obj = {};
      const res = setProperty(obj, 'a.b.c', 3);
      expect(res.a.b.c).toBe(3);
    });
  });
});
