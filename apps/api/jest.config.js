/** @type {import('jest').Config} */
module.exports = {
    displayName: 'api',
    preset: '../../jest.preset.js',
    testEnvironment: 'node',
    transform: {
        '^.+\\.(ts|js)$': ['@swc/jest', {
            jsc: {
                parser: { syntax: 'typescript', decorators: true },
                transform: { legacyDecorator: true, decoratorMetadata: true },
                target: 'es2021',
            },
            module: { type: 'commonjs' },
        }],
    },
    moduleFileExtensions: ['ts', 'js', 'json'],
    moduleNameMapper: {
        '^@shared/types$': '<rootDir>/../../libs/shared/types/src/index.ts',
        '^@shared/util$': '<rootDir>/../../libs/shared/util/src/index.ts',
        '^@prisma-db$': '<rootDir>/../../libs/prisma-db/src/index.ts',
    },
    coverageDirectory: '../../coverage/apps/api',
    transformIgnorePatterns: [
        '/node_modules/(?!(.pnpm|uuid))',
        '/node_modules/.pnpm/(?!(uuid)@)',
    ],
};
