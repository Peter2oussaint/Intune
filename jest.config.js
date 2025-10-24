const path = require("path");

module.exports = {
  projects: [
    {
      displayName: "backend",
      testEnvironment: "node",
      roots: ["<rootDir>/backend"],
      testMatch: ["**/*.test.js"],
      setupFilesAfterEnv: ["<rootDir>/backend/setupTests.js"],
      transform: { "^.+\\.[jt]sx?$": "babel-jest" },
    },

    {
      displayName: "frontend",
      testEnvironment: "jsdom",
      roots: ["<rootDir>/frontend/src"],
      testMatch: ["**/*.test.js"],
      setupFilesAfterEnv: [
        // your file if you have it; otherwise you can use @testing-library/jest-dom directly
        "<rootDir>/frontend/src/setupTests.js",
      ],
      transform: { "^.+\\.[jt]sx?$": "babel-jest" },
      moduleNameMapper: {
        // 🔒 Force a single React instance (from the app)
        "^react$": "<rootDir>/frontend/node_modules/react",
        "^react-dom$": "<rootDir>/frontend/node_modules/react-dom",
        "^react/jsx-runtime$":
          "<rootDir>/frontend/node_modules/react/jsx-runtime",

        // Assets & styles
        "\\.(css|less|scss|sass)$": "identity-obj-proxy",
        "\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/__mocks__/fileMock.js",
      },
    },
  ],

  coverageDirectory: "<rootDir>/coverage",
  collectCoverageFrom: [
    "frontend/src/**/*.{js,jsx}",
    "backend/**/*.js",
    "!**/node_modules/**",
    "!**/build/**",
  ],
};
