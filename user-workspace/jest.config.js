module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.{test,Test}.ts'],
  modulePaths: ['<rootDir>'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  }
};