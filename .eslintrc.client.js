module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'drizzle-orm',
            message: 'Database imports are not allowed in client-side code. Use tRPC API routes instead.',
          },
          {
            name: 'drizzle-kit',
            message: 'drizzle-kit is a build tool and should not be imported in application code.',
          },
          {
            name: '@/src/db',
            message: 'Direct database access is not allowed in client-side code. Use tRPC API routes instead.',
          },
        ],
        patterns: [
          {
            group: ['*/db/*', '*/database/*'],
            message: 'Database imports are not allowed in client-side code. Use tRPC API routes instead.',
          },
        ],
      },
    ],
  },
};