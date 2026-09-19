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
        
        # -> Click the 'Meta' quick-jump company button to switch the company dataset.
        # Meta button
        elem = page.get_by_role("button", name="Meta")
        await elem.click(timeout=10000)
        
        # -> Fill the search field (placeholder 'Search by ID, title, or keyword') with 'Two Sum'.
        # Search by ID, title, or keyword (Press '/' to... text field
        elem = page.get_by_role("textbox", name="Search by ID, title, or")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Two Sum")
        
        # -> Click the 'Easy' difficulty button to filter questions to Easy problems.
        # Easy button
        elem = page.get_by_role("button", name="Easy")
        await elem.click(timeout=10000)
        
        # -> Click the 'Easy' difficulty button to filter questions to Easy problems.
        # All Topics Algorithms Arrays & Hashing... dropdown
        elem = page.locator("xpath=/html/body/div/div/main/div[2]/div[2]/div[2]/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Click the 'Easy' difficulty button to filter questions to Easy problems.
        # Freq (High to Low) Freq (Low to High) Acceptance... dropdown
        elem = page.locator("xpath=/html/body/div/div/main/div[2]/div[2]/div[2]/div[2]/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # --> Assertions to verify final state
        
        # --> Selected company is 'Meta'.
        # Assert-outcome: passed
        # Assert: Company selector displays 'Meta'.
        await expect(page.get_by_role("banner").nth(0)).to_contain_text("Meta", timeout=15000), "Company selector displays 'Meta'."
        
        # --> Search for 'Two Sum' is applied and the table shows the matching row.
        # Assert-outcome: passed
        # Assert: Search box contains 'Two Sum'.
        await expect(page.get_by_role("textbox", name="Search by ID, title, or").nth(0)).to_have_value("Two Sum", timeout=15000), "Search box contains 'Two Sum'."
        # Assert-outcome: passed
        # Assert: Table displays the 'Two Sum' problem title.
        await expect(page.locator("xpath=/html/body/div/div/main/div[4]/table/tbody/tr/td[4]/div/div[1]/a").nth(0)).to_have_text("Two Sum", timeout=15000), "Table displays the 'Two Sum' problem title."
        
        # --> The displayed row shows difficulty 'Easy'.
        # Assert-outcome: passed
        # Assert: Row difficulty is 'Easy'.
        await expect(page.locator("xpath=/html/body/div/div/main/div[4]/table/tbody/tr/td[5]").nth(0)).to_have_text("Easy", timeout=15000), "Row difficulty is 'Easy'."
        
        # --> The displayed row includes topic chip 'Arrays & Hashing'.
        # Assert-outcome: passed
        # Assert: Row includes 'Arrays & Hashing' topic chip.
        await expect(page.locator("xpath=/html/body/div/div/main/div[4]/table/tbody/tr/td[4]/div/div[2]/span[1]").nth(0)).to_have_text("Arrays & Hashing", timeout=15000), "Row includes 'Arrays & Hashing' topic chip."
        
        # --> Sort dropdown shows 'Freq (High to Low)'.
        # Assert-outcome: passed
        # Assert: Sort selection shows 'Freq (High to Low)'.
        await expect(page.get_by_role("main").nth(0)).to_contain_text("Freq (High to Low)", timeout=15000), "Sort selection shows 'Freq (High to Low)'."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    