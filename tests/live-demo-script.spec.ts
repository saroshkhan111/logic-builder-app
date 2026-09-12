import { test, expect } from "@playwright/test";

test.use({
  baseURL: "https://logic-builder-app.vercel.app",
  viewport: { width: 1920, height: 1080 },
  video: "off",
  screenshot: "off",
  launchOptions: {
    slowMo: 700, // Natural pace for Loom recording
    args: [
      "--window-size=1920,1080",
      "--window-position=0,0",
      "--start-maximized",
    ],
  },
});

test("Live Demo — 6 Steps (Loom Recording Ready)", async ({ page }) => {
  // ============ INTRO (3 sec) ============
  await page.goto("/");
  await expect(page.getByText("STEP 1")).toBeVisible();
  await page.waitForTimeout(2500); // Loom: intro view

  // ============ STEP 1: Problem Statement (10 sec) ============
  await test.step("Step 1: Problem Statement", async () => {
    await page
      .getByPlaceholder(/Example: Write a program/)
      .fill("Write a Python program that checks if a number is even or odd");
    await page.waitForTimeout(800);

    await page.getByPlaceholder("e.g. num (Integer)").fill("number (integer)");
    await page.getByRole("button", { name: "Add" }).first().click();
    await page.waitForTimeout(600);

    await page
      .getByPlaceholder('e.g. "Even" or "Odd"')
      .fill("result (string)");
    await page.getByRole("button", { name: "Add" }).nth(1).click();
    await page.waitForTimeout(600);

    await page
      .getByPlaceholder("e.g. num must be > 0")
      .fill("number must be >= 0");
    await page.getByRole("button", { name: "Add" }).nth(2).click();
    await page.waitForTimeout(1200); // Loom: Step 1 complete view
  });

  // ============ STEP 2: Requirements (8 sec) ============
  await test.step("Step 2: Requirements", async () => {
    await page.getByRole("button", { name: /Next: Requirements/ }).click();
    await page.waitForTimeout(1000);

    await page
      .getByPlaceholder("e.g. current_year (number)")
      .fill("number (integer)");
    await page.getByRole("button", { name: "Add" }).first().click();
    await page.waitForTimeout(600);

    await page
      .getByPlaceholder(/Subtraction/)
      .fill("Modulo operator (%)");
    await page.getByRole("button", { name: "Add" }).nth(1).click();
    await page.waitForTimeout(600);

    await page.getByPlaceholder(/IF\/ELSE/).fill("IF/ELSE condition check");
    await page.getByRole("button", { name: "Add" }).nth(2).click();
    await page.waitForTimeout(1200); // Loom: Step 2 complete
  });

  // ============ STEP 3: Algorithm + Flowchart (12 sec) ⭐ ============
  await test.step("Step 3: Algorithm", async () => {
    await page.getByRole("button", { name: /Next: Algorithm/ }).click();
    await page.waitForTimeout(1000);

    await page.getByPlaceholder(/START/).fill(`START
INPUT number
IF number MOD 2 == 0 THEN
  DISPLAY "Even"
ELSE
  DISPLAY "Odd"
ENDIF
END`);

    await page.waitForTimeout(3500); // ⭐ Loom: flowchart animation
  });

  // ============ STEP 4: Code Writing (10 sec) ============
  await test.step("Step 4: Code", async () => {
    await page
      .getByRole("button", { name: /Next: Code Writing/ })
      .click();
    await page.waitForTimeout(1000);

    await page.getByPlaceholder("e.g. my_logic.py").fill("even_odd.py");
    await page.waitForTimeout(800); // Loom: PEP 8 badge visible

    await page
      .getByPlaceholder(/# Write Python code/)
      .fill(`def check_even_odd(number):
    if number % 2 == 0:
        return "Even"
    else:
        return "Odd"`);

    await page.waitForTimeout(1500);
  });

  // ============ STEP 5: Testing (18 sec) ⭐⭐⭐ MAIN EVENT ============
  await test.step("Step 5: Testing", async () => {
    await page.getByRole("button", { name: /Next: Testing/ }).click();
    await page.waitForTimeout(1000);

    // Auto-generate
    await page.getByRole("button", { name: /Auto-Generate/ }).click();
    await page.waitForTimeout(4500); // ⭐ Loom: test cases generate

    // Run tests
    await page.getByRole("button", { name: /Run Test Suite/ }).click();
    await page.waitForTimeout(4500); // ⭐ Loom: PASSED badges appear
  });

  // ============ STEP 6: Optimization (8 sec) ============
  await test.step("Step 6: Optimization", async () => {
    await page
      .getByRole("button", { name: /Next: Optimization/ })
      .click();
    await page.waitForTimeout(3000); // Loom: dashboard view
  });

  // ============ OUTRO (3 sec) ============
  await page.waitForTimeout(3000); // Loom: final view
});
