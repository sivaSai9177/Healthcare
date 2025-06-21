// Mock for @testing-library/react-native in Node environment
module.exports = {
  render: jest.fn(() => ({
    getByText: jest.fn(),
    getByTestId: jest.fn(),
    queryByText: jest.fn(),
    queryByTestId: jest.fn(),
    findByText: jest.fn(),
    findByTestId: jest.fn(),
    rerender: jest.fn(),
    unmount: jest.fn(),
    container: {},
    debug: jest.fn(),
  })),
  screen: {
    getByText: jest.fn(),
    getByTestId: jest.fn(),
    queryByText: jest.fn(),
    queryByTestId: jest.fn(),
    findByText: jest.fn(),
    findByTestId: jest.fn(),
    debug: jest.fn(),
  },
  fireEvent: {
    press: jest.fn(),
    changeText: jest.fn(),
    scroll: jest.fn(),
  },
  waitFor: jest.fn((callback) => callback()),
  act: jest.fn((callback) => callback()),
  within: jest.fn(() => ({
    getByText: jest.fn(),
    getByTestId: jest.fn(),
  })),
};