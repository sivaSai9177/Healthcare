/**
 * Babel plugin to transform import.meta references for Metro bundler compatibility
 */
module.exports = function(babel) {
  const { types: t } = babel;
  
  return {
    visitor: {
      MetaProperty(path) {
        if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
          const parent = path.parent;
          
          // Handle import.meta.url
          if (t.isMemberExpression(parent) && parent.property.name === 'url') {
            path.parentPath.replaceWith(t.stringLiteral(''));
          }
          // Handle import.meta.env
          else if (t.isMemberExpression(parent) && parent.property.name === 'env') {
            path.parentPath.replaceWith(
              t.memberExpression(
                t.identifier('process'),
                t.identifier('env')
              )
            );
          }
          // Handle bare import.meta
          else {
            path.replaceWith(
              t.objectExpression([
                t.objectProperty(
                  t.identifier('url'),
                  t.stringLiteral('')
                ),
                t.objectProperty(
                  t.identifier('env'),
                  t.memberExpression(
                    t.identifier('process'),
                    t.identifier('env')
                  )
                )
              ])
            );
          }
        }
      }
    }
  };
};