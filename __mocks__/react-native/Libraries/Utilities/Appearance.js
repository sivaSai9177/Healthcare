// Mock for Appearance module
module.exports = {
  getColorScheme: jest.fn(() => 'light'),
  addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
  removeChangeListener: jest.fn(),
  setColorScheme: jest.fn(),
};