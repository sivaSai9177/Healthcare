describe('Simple Test', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have working mocks', () => {
    expect(global.mockAuthClient).toBeDefined();
  });
});