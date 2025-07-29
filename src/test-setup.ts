import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';

// Setup global fetch for tests
global.fetch = global.fetch || (() =>
  Promise.reject(new Error('fetch not available in test environment'))
);