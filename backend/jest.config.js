module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'middlewares/**/*.js',
    'models/**/*.js',
    '!models/index.js',
    '!**/node_modules/**',
    '!**/test/**',
    '!**/tests/**',
    '!migrations/**',
    '!crear_rh.js'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  testMatch: [
    '**/test/**/*.test.js',
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],
  verbose: true,
  forceExit: true,
  clearMocks: true
}
