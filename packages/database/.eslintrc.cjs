module.exports = {
  extends: ['../../.eslintrc.cjs'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  // seed.ts runs via tsx and is intentionally excluded from the build tsconfig,
  // so it can't be type-aware linted; skip it.
  ignorePatterns: ['prisma/**', 'dist', 'node_modules'],
};
