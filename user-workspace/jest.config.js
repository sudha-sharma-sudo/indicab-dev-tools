module.exports = {
  preset: 'ts-jest',
  moduleNameMapper: {
    '^vscode$': '<rootDir>/src/test/vscode-mock.ts'
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testEnvironment: 'node',
  testMatch: [
    '**/src/test/**/*.test.ts',
    '**/src/test/**/*.spec.ts'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/dist/'
  ]
};