module.exports = {
  randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
  getRandomValues: (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
  subtle: {
    digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    generateKey: jest.fn().mockResolvedValue({}),
    sign: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    verify: jest.fn().mockResolvedValue(true),
  },
};