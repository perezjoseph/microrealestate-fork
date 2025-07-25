// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

require('@testing-library/jest-dom');

// Mock localStorage for testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Mock navigator for testing
const navigatorMock = {
  language: 'en-US',
  languages: ['en-US', 'es-DO', 'fr-FR']
};

// Setup global mocks for Node environment to simulate browser
global.window = {
  localStorage: localStorageMock,
  navigator: navigatorMock
};

global.localStorage = localStorageMock;
global.navigator = navigatorMock;

// Mock the typeof window check to return 'object' instead of 'undefined'
Object.defineProperty(global, 'window', {
  value: {
    localStorage: localStorageMock,
    navigator: navigatorMock
  },
  writable: true
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
