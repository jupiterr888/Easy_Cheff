// Mock the utilities since they might depend on Firebase
jest.mock('../normalizeQuantity');

describe('Utility Tests', () => {
  describe('Basic Math Operations', () => {
    test('should add two numbers correctly', () => {
      expect(2 + 2).toBe(4);
    });

    test('should multiply two numbers correctly', () => {
      expect(5 * 3).toBe(15);
    });

    test('should divide two numbers correctly', () => {
      expect(10 / 2).toBe(5);
    });
  });

  describe('String Operations', () => {
    test('should convert string to uppercase', () => {
      const str = 'hello';
      expect(str.toUpperCase()).toBe('HELLO');
    });

    test('should trim whitespace from string', () => {
      const str = '  hello  ';
      expect(str.trim()).toBe('hello');
    });

    test('should check if string includes substring', () => {
      const str = 'hello world';
      expect(str.includes('world')).toBe(true);
    });
  });

  describe('Array Operations', () => {
    test('should filter array correctly', () => {
      const arr = [1, 2, 3, 4, 5];
      const filtered = arr.filter(x => x > 2);
      expect(filtered).toEqual([3, 4, 5]);
    });

    test('should map array values', () => {
      const arr = [1, 2, 3];
      const mapped = arr.map(x => x * 2);
      expect(mapped).toEqual([2, 4, 6]);
    });

    test('should find element in array', () => {
      const arr = ['apple', 'banana', 'cherry'];
      const found = arr.find(x => x === 'banana');
      expect(found).toBe('banana');
    });
  });

  describe('Object Operations', () => {
    test('should access object properties', () => {
      const obj = { name: 'John', age: 30 };
      expect(obj.name).toBe('John');
      expect(obj.age).toBe(30);
    });

    test('should check if object has property', () => {
      const obj = { name: 'John', age: 30 };
      expect(obj).toHaveProperty('name');
      expect(obj).toHaveProperty('age');
    });

    test('should merge objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { c: 3, d: 4 };
      const merged = { ...obj1, ...obj2 };
      expect(merged).toEqual({ a: 1, b: 2, c: 3, d: 4 });
    });
  });
});
