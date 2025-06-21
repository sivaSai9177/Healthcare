const mockThemeStore = {
  colorScheme: 'light',
  theme: 'default',
  setColorScheme: jest.fn(),
  setTheme: jest.fn(),
  getEffectiveColorScheme: jest.fn(() => 'light'),
  getThemeColors: jest.fn(() => ({
    primary: '#007AFF',
    background: '#FFFFFF',
    text: '#000000',
    border: '#E5E5E5',
  })),
};

const createMockUseThemeStore = () => {
  return jest.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockThemeStore);
    }
    return mockThemeStore;
  });
};

module.exports = {
  useThemeStore: createMockUseThemeStore(),
  themeStore: mockThemeStore,
  __setMockTheme: (theme) => {
    Object.assign(mockThemeStore, theme);
  },
  __resetMockTheme: () => {
    Object.assign(mockThemeStore, {
      colorScheme: 'light',
      theme: 'default',
    });
  },
};