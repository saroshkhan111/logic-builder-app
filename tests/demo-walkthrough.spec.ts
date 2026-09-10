import { test, expect, Page } from "@playwright/test";

async function goToStep(page: Page, n: number) {
  await page.getByRole("button", { name: new RegExp(`^${n}\\.`) }).click();
  await expect(page.getByText(`STEP ${n}`)).toBeVisible();
}

test("Logic Builder - Full 6-Step Demo Walkthrough", async ({ page }) => {
  await test.step("Step 1", async () => {
    await page.goto("/");
    await expect(page.getByText("STEP 1")).toBeVisible();
    const ta = page.getByPlaceholder("Example: Write a program that takes an integer and checks if it is Even or Odd...");
    const h0 = await ta.evaluate((e) => e.getBoundingClientRect().height);
    await ta.fill("Build a ride-hailing fare calculator that computes total fare based on distance, duration, and peak-hour surcharge.\n\nConstraints:\n1. Enforce a minimum fare of 150.\n2. Multiply base fare by 1.5x during peak hours.", { timeout: 5000 });
    await expect.poll(async () => ta.evaluate((e) => e.getBoundingClientRect().height)).toBeGreaterThan(h0);

    // --- Inputs panel ---
    const inputsPanel = page.locator(".bg-slate-950\\/60").filter({ hasText: "Inputs" }).first();
    const di = page.getByPlaceholder("e.g. num (Integer)");
    await di.fill("distance_km (number)", { timeout: 5000 });
    await di.locator("..").getByRole("button", { name: "Add" }).click({ timeout: 5000 });
    await di.fill("peak_hour (boolean)", { timeout: 5000 });
    await di.locator("..").getByRole("button", { name: "Add" }).click({ timeout: 5000 });
    await expect(page.getByText("distance_km (number)")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("peak_hour (boolean)")).toBeVisible({ timeout: 5000 });

    // Edit first input item
    const firstItemSpan = inputsPanel.locator("span", { hasText: "distance_km (number)" }).first();
    await firstItemSpan.locator("button").first().click({ timeout: 5000 });
    await inputsPanel.locator('.border-indigo-500 input[type="text"]').first().fill("distance_km (float)", { timeout: 5000 });
    await inputsPanel.locator('.border-indigo-500 button').first().click({ timeout: 5000 });
    await expect(page.getByText("distance_km (float)")).toBeVisible({ timeout: 5000 });

    // Delete peak_hour input item
    await page.locator("span", { hasText: "peak_hour (boolean)" }).locator("button").nth(1).click({ timeout: 5000 });
    await expect(page.getByText("peak_hour (boolean)")).not.toBeVisible({ timeout: 5000 });

    // --- Outputs panel ---
    const outputsPanel = page.locator(".bg-slate-950\\/60").filter({ hasText: "Outputs" }).first();
    const op = outputsPanel.getByPlaceholder('e.g. "Even" or "Odd"');
    await op.fill("total_fare (float)", { timeout: 5000 });
    await op.locator("..").getByRole("button", { name: "Add" }).click({ timeout: 5000 });
    await expect(outputsPanel.getByText("total_fare (float)")).toBeVisible({ timeout: 5000 });

    // --- Conditions / Restrictions panel ---
    const conditionsPanel = page.locator(".bg-slate-950\\/60").filter({ hasText: "Conditions" }).first();
    const cp = conditionsPanel.getByPlaceholder("e.g. num must be > 0");
    await cp.fill("distance_km must be > 0", { timeout: 5000 });
    await cp.locator("..").getByRole("button", { name: "Add" }).click({ timeout: 5000 });
    await expect(conditionsPanel.getByText("distance_km must be > 0")).toBeVisible({ timeout: 5000 });
  });
  await test.step("Step 2", async () => {
    await goToStep(page, 2);
    const dp = page.locator(".bg-slate-950\\/60", { hasText: "Required Data" }).first();
    await dp.getByPlaceholder("e.g. current_year (number)").fill("base_rate (number)");
    await dp.getByRole("button", { name: "Add" }).click();
    await expect(dp.getByText("base_rate (number)")).toBeVisible();
    const tp = page.locator(".bg-slate-950\\/60", { hasText: "Tools & Functions" }).first();
    await tp.getByPlaceholder("e.g. Subtraction operator (-)").fill("Multiplication operator (*)");
    await tp.getByRole("button", { name: "Add" }).click();
    await expect(tp.getByText("Multiplication operator (*)")).toBeVisible();
    const cnp = page.locator(".bg-slate-950\\/60", { hasText: "Logical Concepts" }).first();
    await cnp.getByPlaceholder("e.g. IF/ELSE condition check").fill("IF/ELSE surcharge check");
    await cnp.getByRole("button", { name: "Add" }).click();
    await expect(cnp.getByText("IF/ELSE surcharge check")).toBeVisible();
  });

  await test.step("Step 3", async () => {
    await goToStep(page, 3);
    const algo = page.getByPlaceholder(/START/);
    await algo.fill("START\nInitialize base_rate to 50\nINPUT distance_km\nCalculate distance_cost = distance_km * 10\nIF peak_hour THEN\nApply 1.5x surcharge\nENDIF\nDISPLAY total_fare\nEND", { timeout: 10000 });
    await page.waitForTimeout(1000);
    const pp = page.locator(".bg-slate-950\\/60", { hasText: "2. Pseudocode Steps" }).first();
    await expect(pp.getByText("Initialize base_rate to 50")).toBeVisible({ timeout: 10000 });
    await expect(pp.getByText("INPUT distance_km")).toBeVisible({ timeout: 10000 });
    await expect(pp.getByText(/distance_cost/)).toBeVisible({ timeout: 10000 });
    const fc = page.locator(".bg-slate-950\\/60", { hasText: "3. Live Flowchart" }).first();
    await expect(fc.locator("svg.mx-auto")).toBeVisible({ timeout: 10000 });
    const targetBadge = pp.locator('div.flex.items-center.gap-2').filter({ hasText: 'Initialize base_rate to 50' }).first();
    await targetBadge.locator('button[title="Edit Step"]').click({ timeout: 10000 });
    await pp.locator('input.bg-transparent').first().fill("Initialize base_rate to 100", { timeout: 10000 });
    await pp.locator('button.text-emerald-400').first().click({ timeout: 10000 });
    await expect(algo).toContainText("Initialize base_rate to 100", { timeout: 10000 });
    await expect(algo).not.toContainText("Initialize base_rate to 50", { timeout: 10000 });
  });

  await test.step("Step 4", async () => {
    await goToStep(page, 4);
    await page.getByPlaceholder("e.g. my_logic.py").fill("ride_fare.py");
    await expect(page.getByText("Valid PEP 8")).toBeVisible();
    await page.getByPlaceholder(/# Write Python code here/).fill("def calculate_fare(d, pk):\n    r = 50 + d * 10\n    return r * 1.5 if pk else r");
    const np = page.locator(".bg-slate-950\\/60", { hasText: "Code Notes" }).first();
    await np.getByPlaceholder("e.g. This function checks for prime numbers").fill("Peak-hour surcharge logic");
    await np.getByRole("button", { name: "Add" }).click();
    await expect(np.getByText("Peak-hour surcharge logic")).toBeVisible();
  });
  await test.step("Step 5", async () => {
    await goToStep(page, 5);
    await page.getByRole("button", { name: /Auto-Generate Test Cases/ }).click();
    await expect(page.getByText("Standard Case")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Boundary Case")).toBeVisible();
    await expect(page.getByText("Edge Case")).toBeVisible();
    await expect(page.locator("table tbody tr")).toHaveCount(3);
  });

  await test.step("Step 6", async () => {
    await goToStep(page, 6);
    await expect(page.getByText("Problem Statement: ")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Optimization Rules")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /Start a New Problem/ })).toBeVisible({ timeout: 10000 });
  });
});