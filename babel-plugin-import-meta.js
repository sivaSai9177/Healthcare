module.exports = function() {
  return {
    visitor: {
      MemberExpression(path) {
        if (
          path.node.object &&
          path.node.object.type === 'MetaProperty' &&
          path.node.object.meta.name === 'import' &&
          path.node.object.property.name === 'meta'
        ) {
          // Replace import.meta.url with a dummy value
          if (path.node.property.name === 'url') {
            path.replaceWithSourceString('"http://localhost:8081"');
          } else if (path.node.property.name === 'env') {
            // Replace import.meta.env with process.env
            path.replaceWith({
              type: 'MemberExpression',
              object: {
                type: 'Identifier',
                name: 'process'
              },
              property: {
                type: 'Identifier',
                name: 'env'
              }
            });
          } else {
            // Replace other import.meta properties with empty object
            path.replaceWithSourceString('{}');
          }
        }
      }
    }
  };
};