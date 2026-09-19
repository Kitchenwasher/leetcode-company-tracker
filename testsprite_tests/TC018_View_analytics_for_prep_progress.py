import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:3000/")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Click the 'Analytics & Heatmap (Press 'a')' button to open the analytics view.
        # Analytics & Heatmap (Press 'a') button
        elem = page.get_by_role("button", name="Analytics & Heatmap (Press 'a")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Analytics modal is open and shows the Total Solved summary card.
        await page.get_by_text("/ 3399").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: passed
        # Assert: The analytics 'Total Solved' summary card is visible.
        await expect(page.get_by_text("/ 3399").nth(0)).to_be_visible(timeout=15000), "The analytics 'Total Solved' summary card is visible."
        
        # --> Solved-by-difficulty breakdown is visible in the analytics view.
        await page.get_by_text("Easy (0)").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: passed
        # Assert: The 'Easy' row in the difficulty breakdown is visible.
        await expect(page.get_by_text("Easy (0)").nth(0)).to_be_visible(timeout=15000), "The 'Easy' row in the difficulty breakdown is visible."
        
        # --> Activity Consistency Heatmap grid is present with day tiles.
        await page.get_by_title("-09-21: 0 questions solved").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: passed
        # Assert: At least one day tile in the Activity Consistency Heatmap is visible.
        await expect(page.get_by_title("-09-21: 0 questions solved").nth(0)).to_be_visible(timeout=15000), "At least one day tile in the Activity Consistency Heatmap is visible."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    