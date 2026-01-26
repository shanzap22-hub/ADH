const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('--- STARTING PAYMENT FLOW TEST (LONG WAIT) ---');
    console.log('Target: https://adh.today');

    try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        console.log('Navigating...');
        await page.goto('https://adh.today');

        // 1. Click Join Button
        const joinButton = await page.getByRole('button', { name: /Join|Access|Unlock/i }).first();
        if (joinButton) {
            console.log('Clicking Join...');
            await joinButton.click();
            await page.waitForTimeout(2000);

            // 2. Fill Phone Number in the first modal
            console.log('Filling Phone Number...');
            const phoneInput = page.locator('input[type="tel"]');
            await phoneInput.fill('9876543210');

            // 3. Click "Pay"
            const payButton = page.locator('button:has-text("Pay")');
            console.log('Clicking Pay...');
            await payButton.click();

            console.log('Waiting for Razorpay (15s)...');
            await page.waitForTimeout(15000); // 15 seconds

            // 4. Take Screenshot of Razorpay
            const screenshotPath = path.join(process.cwd(), 'razorpay_step2_full.png');
            await page.screenshot({ path: screenshotPath });
            console.log('Screenshot saved to:', screenshotPath);

        } else {
            console.log('Join button not found!');
        }

        await browser.close();
        console.log('--- TEST COMPLETE ---');

    } catch (err) {
        console.error('ERROR:', err);
    }
})();
