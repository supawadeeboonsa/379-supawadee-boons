// tests/example.spec.ts
import { test, expect, Page } from '@playwright/test';

/** ---------- Config ---------- **/
const APP_URL = process.env.APP_URL || 'http://localhost:9000/#/';

/** ----------  Helper: Wait for server  ---------- **/
const waitForServer = async (url: string, timeout = 20000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // ignore
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not respond within ${timeout}ms`);
};

/** ---------- Bootstrapping ---------- **/
const gotoApp = async (page: Page) => {
  await waitForServer(APP_URL);
  await page.goto(APP_URL);
  await expect(page.locator('#q-app')).toBeVisible();
  await expect(page.locator('form')).toBeVisible();
};

/** ---------- Locators ---------- **/
const nameInput = (page: Page) => page.getByLabel('Your name');
const ageInput = (page: Page) => page.getByLabel('Your age');
const submitBtn = (page: Page) => page.getByRole('button', { name: /submit/i });
const resetBtn = (page: Page) => page.getByRole('button', { name: /reset|clear/i });
const termsSwitch = (page: Page) => page.getByRole('switch', { name: /i accept/i });
const messagesOf = (page: Page, label: string) =>
  page.locator('.q-field, .q-input').filter({ hasText: label }).locator('.q-field__messages').last();

/** ---------- Regex ---------- **/
const NAME_EMPTY_REGEX = /please type something/i;
const AGE_EMPTY_REGEX = /please type (your|something) age/i;
const AGE_NEG_REGEX = /positive|greater than 0|invalid|please type (your|a real) age|please type something/i;

/** ---------- Assertion Helpers ---------- **/
const expectNoErrorMessages = async (page: Page) => {
  await expect(page.locator('.q-transition--field-message-leave-active')).toHaveCount(0);
  await expect(page.locator('.q-field__messages').filter({ hasText: /please|invalid|error/i })).toHaveCount(0);
};

/** ---------- Tests ---------- **/
test.describe('Quasar Form Input Validation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test('validates name input', async ({ page }) => {
    await submitBtn(page).click();
    await expect(messagesOf(page, 'Your name')).toContainText(NAME_EMPTY_REGEX);

    await nameInput(page).fill('John Doe');
    await submitBtn(page).click();
    await expect(messagesOf(page, 'Your name')).not.toContainText(/please|invalid|error/i);
  });

  test('validates age input', async ({ page }) => {
    await nameInput(page).fill('John Doe');

    await submitBtn(page).click();
    await expect(messagesOf(page, 'Your age')).toContainText(AGE_EMPTY_REGEX);

    await ageInput(page).fill('-1');
    await submitBtn(page).click();
    await expect(messagesOf(page, 'Your age')).toContainText(AGE_NEG_REGEX);
  });

  test('handles terms acceptance', async ({ page }) => {
    await nameInput(page).fill('John Doe');
    await ageInput(page).fill('25');

    await submitBtn(page).click();
    await expect(termsSwitch(page)).toHaveAttribute('aria-checked', 'false');

    await termsSwitch(page).click();
    await expect(termsSwitch(page)).toHaveAttribute('aria-checked', 'true');
    await submitBtn(page).click();

    await expectNoErrorMessages(page);
  });

  test('resets form inputs', async ({ page }) => {
    await nameInput(page).fill('John Doe');
    await ageInput(page).fill('25');
    await termsSwitch(page).click();
    await expect(termsSwitch(page)).toHaveAttribute('aria-checked', 'true');

    await resetBtn(page).click();

    await expect(nameInput(page)).toHaveValue('');
    await expect(ageInput(page)).toHaveValue('');
    await expect(termsSwitch(page)).toHaveAttribute('aria-checked', 'false');
  });
});
