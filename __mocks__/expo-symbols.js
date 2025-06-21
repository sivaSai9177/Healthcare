const React = require('react');

const SymbolView = ({ name, size = 24, color = 'black', children, ...props }) => {
  return React.createElement('View', {
    ...props,
    testID: `symbol-${name}`,
    style: { width: size, height: size },
  }, children);
};

module.exports = {
  SymbolView,
  SFSymbol: SymbolView,
  default: SymbolView,
};