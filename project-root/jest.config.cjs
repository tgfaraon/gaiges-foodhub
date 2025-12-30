module.exports = {
  projects: [
    {
      displayName: "backend",
      testMatch: ["<rootDir>/__tests__/**/*.test.js"],
      testEnvironment: "node",
      transform: { "^.+\\.[tj]sx?$": "babel-jest" },
      setupFiles: ["<rootDir>/jest.env.js"], // load env + mongoose for backend
      setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
      transformIgnorePatterns: [
        "node_modules/(?!bson|mongodb|mongoose)" // allow ESM packages to be transpiled
      ],
    },
    {
      displayName: "frontend",
      testMatch: ["<rootDir>/foodhub-client/src/**/*.test.js"],
      testEnvironment: "jsdom",
      transform: { "^.+\\.[tj]sx?$": "babel-jest" },
      moduleNameMapper: {
        "\\.(css|less|scss|sass)$": "identity-obj-proxy",
      },
      // 👇 only load matchers/polyfills, not backend env
      setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
      transformIgnorePatterns: [
        "node_modules/(?!bson|mongodb|mongoose)"
      ],
    },
  ],
};