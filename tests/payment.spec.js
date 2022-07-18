import { test, expect } from "@playwright/test";


const BASE_URL = "http://localhost:3000";
const LANDING_PAGE = '/listings'

test.beforeEach(async ({ page }, testInfo) => {
  // Extend timeout for all tests running this hook by 30 seconds.
  testInfo.setTimeout(testInfo.timeout + 30000);
});

test('basic test', async ({ page }) => {
  await page.goto(BASE_URL + LANDING_PAGE);
  // Click text=Post
  await page.locator('text=Post').click();
  await page.waitForURL('http://localhost:3000/listing/post');

  // Fill input[name="company_name"]
  await page.locator('input[name="company_name"]').fill('company name');

  // Fill input[name="description"]
  await page.locator('input[name="description"]').fill('this is a job description');

  // Select 2
  await page.locator('select[name="category"]').selectOption('2');

  // Fill input[name="website"]
  await page.locator('input[name="website"]').fill('http://localhost:3000/listing/post');

  // Fill input[name="profile_url"]
  await page.locator('input[name="profile_url"]').fill('http://localhost:3000/listing/post');

  // Fill input[name="application_url"]
  await page.locator('input[name="application_url"]').fill('http://localhost:3000/listing/post');

  // Click text=Submit
  await page.locator('text=Submit').click();
  // await page.waitForURL('http://localhost:3000/pay/54/confirm');

  // Click text=Card number
  await page.waitForSelector('iframe')

  const iframeId = await page.evaluate(() => window.document.getElementsByTagName('iframe')[0].name);

  await page.frameLocator('iframe[name="' + iframeId + '"]').locator('[placeholder="\\31 234 1234 1234 1234"]').fill('4111 1111 1111 1111');

  // Fill [placeholder="MM \/ YY"]
  await page.frameLocator('iframe[name="' + iframeId + '"]').locator('[placeholder="MM \\/ YY"]').fill('03 / 26')

  // Fill [placeholder="CVC"]
  await page.frameLocator('iframe[name="' + iframeId + '"]').locator('[placeholder="CVC"]').fill('432');

  // Fill [placeholder="WS11 1DB"]
  await page.frameLocator('iframe[name="' + iframeId + '"]').locator('[placeholder="WS11 1DB"]').fill('HAS WED');

  // Click button:has-text("Pay now")
  await page.locator('button:has-text("Pay now")').click();

  // Click text=Successful Payment
  await page.waitForSelector('text=Successful Payment');


});

