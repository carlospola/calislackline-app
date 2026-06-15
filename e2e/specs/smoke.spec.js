const { test, expect } = require('@playwright/test');

// Test banale: prova che il runner gira senza dipendere dal dev server.
test('smoke: runner works', () => {
  expect(1).toBe(1);
});
