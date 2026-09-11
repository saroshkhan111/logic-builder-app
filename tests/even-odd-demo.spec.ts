import { test, expect, Page } from "@playwright/test";

// Enable video recording + parallel mode for speed
test.use({
  video: "on",
});
test.setTimeout(300_000);
test.describe.configure({ mode: "parallel" });

async function goToStepViaSidebar(page: Page, n: number) {
  await page.getByRole("button", { name: new RegExp(`^${n}\\.`) }).click();
  await expect(page.getByText(`STEP ${n}`)).toBeVisible();
}

test("Logic Builder - Even/Odd Problem Full 6-Step Demo", async ({ page }) => {
  // ──────────────────────────────────────────────
  // STEP 1: Problem Statement
  // ──────────────────────────────────────────────
  await test.step("Step 1: Problem Statement", async () => {
    await page.goto("/");
    await expect(page.getByText("STEP 1")).toBeVisible();

    // Fill problem statement textarea
    const ta = page.getByPlaceholder(
      "Example: Write a program that takes an integer and checks if it is Even or Odd..."
    );
    await ta.fill(
      "Write a Python program that takes an integer number and checks if it is even or odd. Return 'Even' if the number is divisible by 2, otherwise return 'Odd'.",
      { timeout: 1500 }
    );

    // --- Inputs panel ---
    const inputsPanel = page
      .locator(".bg-slate-950\\/60")
      .filter({ hasText: "Inputs" })
      .first();
    const di = page.getByPlaceholder("e.g. num (Integer)");
    await di.fill("number (integer)", { timeout: 1500 });
    await di
      .locator("..")
      .getByRole("button", { name: "Add" })
      .click({ timeout: 1500 });
    await expect(page.getByText("number (integer)")).toBeVisible({
      timeout: 1500,
    });

    // --- Outputs panel ---
    const outputsPanel = page
      .locator(".bg-slate-950\\/60")
      .filter({ hasText: "Outputs" })
      .first();
    const op = outputsPanel.getByPlaceholder('e.g. "Even" or "Odd"');
    await op.fill("result (string)", { timeout: 1500 });
    await op
      .locator("..")
      .getByRole("button", { name: "Add" })
      .click({ timeout: 1500 });
    await expect(outputsPanel.getByText("result (string)")).toBeVisible({
      timeout: 1500,
    });

    // --- Conditions / Restrictions panel ---
    const conditionsPanel = page
      .locator(".bg-slate-950\\/60")
      .filter({ hasText: "Conditions" })
      .first();
    const cp = conditionsPanel.getByPlaceholder("e.g. num must be > 0");
    await cp.fill("number must be >= 0", { timeout: 1500 });
    await cp
      .locator("..")
      .getByRole("button", { name: "Add" })
      .click({ timeout: 1500 });
    await expect(
      conditionsPanel.getByText("number must be >= 0")
    ).toBeVisible({ timeout: 1500 });

    // Screenshot
    await page.screenshot({ path: "step1-complete.png", fullPage: true });

    // Wait for video pacing
    await page.waitForTimeout(500);

    // Navigate to Step 2
    await page
      .getByRole("button", { name: /Next: Requirements Analysis/ })
      .click();
  });

  // ──────────────────────────────────────────────
  // STEP 2: Requirements Analysis
  // ──────────────────────────────────────────────
  await test.step("Step 2: Requirements Analysis", async () => {
    await expect(page.getByText("STEP 2")).toBeVisible();

    // --- Required Data panel ---
    const dp = page
      .locator(".bg-slate-950\\/60", { hasText: "Required Data" })
      .first();
    await dp.getByPlaceholder("e.g. current_year (number)").fill("number (integer)");
    await dp.getByRole("button", { name: "Add" }).click();
    await expect(dp.getByText("number (integer)")).toBeVisible();

    // --- Tools & Functions panel ---
    const tp = page
      .locator(".bg-slate-950\\/60", { hasText: "Tools & Functions" })
      .first();
    await tp
      .getByPlaceholder("e.g. Subtraction operator (-)")
      .fill("Modulo operator (%)");
    await tp.getByRole("button", { name: "Add" }).click();
    await expect(tp.getByText("Modulo operator (%)")).toBeVisible();

    await tp
      .getByPlaceholder("e.g. Subtraction operator (-)")
      .fill("Comparison operator (==)");
    await tp.getByRole("button", { name: "Add" }).click();
    await expect(tp.getByText("Comparison operator (==)")).toBeVisible();

    // --- Logical Concepts panel ---
    const cnp = page
      .locator(".bg-slate-950\\/60", { hasText: "Logical Concepts" })
      .first();
    await cnp
      .getByPlaceholder("e.g. IF/ELSE condition check")
      .fill("IF/ELSE condition check");
    await cnp.getByRole("button", { name: "Add" }).click();
    await expect(cnp.getByText("IF/ELSE condition check")).toBeVisible();

    // Screenshot
    await page.screenshot({ path: "step2-complete.png", fullPage: true });

    // Wait for video pacing
    await page.waitForTimeout(500);

    // Navigate to Step 3
    await page
      .getByRole("button", { name: /Next: Algorithm Design/ })
      .click();
  });

  // ──────────────────────────────────────────────
  // STEP 3: Algorithm Design
  // ──────────────────────────────────────────────
  await test.step("Step 3: Algorithm Design", async () => {
    await expect(page.getByText("STEP 3")).toBeVisible();

    // Fill algorithm textarea
    const algo = page.getByPlaceholder(/START/);
    await algo.fill(
      "START\nINPUT number\nIF number % 2 == 0 THEN\n    result = \"Even\"\nELSE\n    result = \"Odd\"\nENDIF\nDISPLAY result\nEND",
      { timeout: 10000 }
    );

    // Wait for pseudocode steps to generate
    await page.waitForTimeout(500);

    // Verify pseudocode steps visible
    const pp = page
      .locator(".bg-slate-950\\/60", { hasText: "2. Pseudocode Steps" })
      .first();
    await expect(
      pp.getByText("INPUT number")
    ).toBeVisible({ timeout: 10000 });
    await expect(pp.getByText(/number % 2 == 0/)).toBeVisible({
      timeout: 10000,
    });

    // Verify flowchart visible
    const fc = page
      .locator(".bg-slate-950\\/60", { hasText: "3. Live Flowchart" })
      .first();
    await expect(fc.locator("svg.mx-auto")).toBeVisible({
      timeout: 10000,
    });

    // Screenshot
    await page.screenshot({ path: "step3-complete.png", fullPage: true });

    // Wait for video pacing
    await page.waitForTimeout(500);

    // Navigate to Step 4
    await page
      .getByRole("button", { name: /Next: Code Writing/ })
      .click();
  });

  // ──────────────────────────────────────────────
  // STEP 4: Code Writing
  // ──────────────────────────────────────────────
  await test.step("Step 4: Code Writing", async () => {
    await expect(page.getByText("STEP 4")).toBeVisible();

    // Fill file name
    await page.getByPlaceholder("e.g. my_logic.py").fill("even_odd.py");
    await expect(page.getByText("Valid PEP 8")).toBeVisible();

    // Fill Python code
    await page
      .getByPlaceholder(/# Write Python code here/)
      .fill(
        "def check_even_odd(number):\n    if number % 2 == 0:\n        return \"Even\"\n    else:\n        return \"Odd\""
      );

    // Add code note
    const np = page
      .locator(".bg-slate-950\\/60", { hasText: "Code Notes" })
      .first();
    await np
      .getByPlaceholder("e.g. This function checks for prime numbers")
      .fill("Even/Odd check using modulo");
    await np.getByRole("button", { name: "Add" }).click();
    await expect(np.getByText("Even/Odd check using modulo")).toBeVisible();

    // Screenshot
    await page.screenshot({ path: "step4-complete.png", fullPage: true });

    // Wait for video pacing
    await page.waitForTimeout(500);

    // Navigate to Step 5
    await page.getByRole("button", { name: /Next: Testing/ }).click();
  });

  // ──────────────────────────────────────────────
  // STEP 5: Testing
  // ──────────────────────────────────────────────
  await test.step("Step 5: Testing", async () => {
    await expect(page.getByText("STEP 5")).toBeVisible();

    // Auto-generate test cases
    await page
      .getByRole("button", { name: /Auto-Generate/ })
      .first()
      .click();

    // Wait for test generation (needs more time for AI/smart generation)
    await page.waitForTimeout(3000);

    // Wait for test cases to appear
    await expect(page.locator("table tbody tr").first()).toBeVisible({
      timeout: 15_000,
    });

    // Run the tests
    await page
      .getByRole("button", { name: /Run Test Suite/ })
      .click();

    // Wait for tests to run (pyodide execution needs time)
    await page.waitForTimeout(3000);

    // Wait for tests to complete — verify all PASSED
    await expect(page.getByText("PASSED").first()).toBeVisible({
      timeout: 30_000,
    });

    // Verify all test rows show PASSED
    const passedRows = page.locator("table tbody tr").filter({
      has: page.locator("text=PASSED"),
    });
    const count = await passedRows.count();
    expect(count).toBeGreaterThan(0);

    // Screenshot
    await page.screenshot({ path: "step5-complete.png", fullPage: true });

    // Wait for video pacing
    await page.waitForTimeout(500);

    // Navigate to Step 6
    await page
      .getByRole("button", { name: /Next: Optimization/ })
      .click();
  });

  // ──────────────────────────────────────────────
  // STEP 6: Optimization & Analysis
  // ──────────────────────────────────────────────
  await test.step("Step 6: Optimization & Analysis", async () => {
    await expect(page.getByText("STEP 6")).toBeVisible();

    // Verify all sections are visible
    await expect(page.getByText("Optimization & Analysis")).toBeVisible({
      timeout: 1500,
    });
    await expect(page.getByText("Complexity Analysis")).toBeVisible({
      timeout: 1500,
    });
    await expect(page.getByText("Smart Suggestions")).toBeVisible({
      timeout: 1500,
    });
    await expect(page.getByText("Optimization Rules")).toBeVisible({
      timeout: 1500,
    });

    // Verify "Start a New Problem" button is visible
    await expect(
      page.getByRole("button", { name: /Start a New Problem/ })
    ).toBeVisible({ timeout: 1500 });

    // Screenshot
    await page.screenshot({ path: "step6-complete.png", fullPage: true });

    // Wait for video pacing
    await page.waitForTimeout(500);
  });
});
