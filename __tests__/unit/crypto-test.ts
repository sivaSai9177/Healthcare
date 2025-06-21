import { generateUUID } from '@/lib/core/crypto';

describe('crypto utilities', () => {
  describe('generateUUID', () => {
    it('generates a valid UUID v4', () => {
      const uuid = generateUUID();
      
      // Check format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it('generates unique UUIDs', () => {
      const uuids = new Set();
      const count = 1000;
      
      for (let i = 0; i < count; i++) {
        uuids.add(generateUUID());
      }
      
      // All generated UUIDs should be unique
      expect(uuids.size).toBe(count);
    });

    it('generates UUIDs with correct version (4)', () => {
      const uuid = generateUUID();
      const versionChar = uuid.charAt(14);
      expect(versionChar).toBe('4');
    });

    it('generates UUIDs with correct variant', () => {
      const uuid = generateUUID();
      const variantChar = uuid.charAt(19);
      expect(['8', '9', 'a', 'b']).toContain(variantChar.toLowerCase());
    });
  });

  describe('crypto polyfill', () => {
    it('provides crypto.randomUUID when not available', () => {
      // Import should have added the polyfill
      expect(typeof crypto.randomUUID).toBe('function');
    });

    it('crypto.randomUUID generates valid UUIDs', () => {
      if (typeof crypto.randomUUID === 'function') {
        const uuid = crypto.randomUUID();
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(uuid).toMatch(uuidRegex);
      }
    });
  });
});