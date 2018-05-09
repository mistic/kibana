module.exports = {
  overrides: [
    {
      files: [
        '**/*.test.js',
        '**/__mocks__/**/*.js',
      ],
      plugins: [
        'jest',
      ],

      env: {
        'jest/globals': true,
      },

      rules: {
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
      },
    }
  ]
};
