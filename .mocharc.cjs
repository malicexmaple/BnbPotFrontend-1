// Mocha config for the API/integration test suite.
// `test/JackpotGame.test.ts` is a Hardhat smart-contract test that requires
// the Hardhat runtime to be initialized; run it with `npx hardhat test`
// rather than plain `npx mocha`.
module.exports = {
  spec: ['test/**/*.test.ts'],
  ignore: ['test/JackpotGame.test.ts'],
  'node-option': ['import=tsx/esm'],
  timeout: 20000,
};
