/** @type {import('jest').Config} */
module.exports = {
  // Use Node.js test environment (no browser APIs needed for backend)
  testEnvironment: "node",

  // Disable Babel transform — backend is pure CommonJS and doesn't need transpilation
  transform: {},

  // Match .test.js and .integration.test.js files
  testMatch: [
    "**/*.test.js",
    "**/*.integration.test.js",
  ],

  // Ignore node_modules and Next.js build artifacts
  testPathIgnorePatterns: ["/node_modules/"],

  // Show verbose output
  verbose: true,
};
