import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('keyboard search, reset and accessible table', async ({ page }) => {
  await page.goto('/examples/search');
  await page.getByRole('button', { name: 'Open search', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Search', exact: true })).toBeFocused();
  await page.getByRole('textbox', { name: 'Search', exact: true }).fill('Ada');
  await expect(page.getByRole('table').getByText('Ada', { exact: true })).toBeVisible();
  await expect(page.getByRole('table').getByText('Grace', { exact: true })).toHaveCount(0);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);
  await page.getByRole('button', { name: 'Close search', exact: true }).click();
  await expect(page.getByRole('table').getByText('Grace', { exact: true })).toBeVisible();
});

test('server paging and row menu work with a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/examples/server-pagination');
  await expect(page.getByRole('table').getByText('Ada', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Go to next page' }).click();
  await expect(page.getByRole('table').getByText('Katherine', { exact: true })).toBeVisible();
  await page.goto('/examples/action-menu');
  await page.getByRole('button', { name: 'Actions for Ada', exact: true }).click();
  await page.getByRole('menuitem', { name: 'View', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Viewing Ada' })).toHaveText('Viewing Ada');
});

test('controlled client query can be reset by the application', async ({ page }) => {
  await page.goto('/examples/controlled-query');
  await page.getByRole('button', { name: 'Open search', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search', exact: true }).fill('Ada');
  await expect(page.getByRole('table').getByText('Grace', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset all query state', exact: true }).click();
  await expect(page.getByRole('table').getByText('Grace', { exact: true })).toBeVisible();
});

test('general selection and cancellable Spring export use real controls', async ({ page }) => {
  await page.goto('/examples/controlled-selection');
  await page.getByRole('checkbox', { name: 'Select row 1', exact: true }).check();
  await expect(page.getByRole('status')).toHaveText('Selected IDs: ada');
  await page.goto('/examples/spring-adapter');
  await expect(page.getByRole('table').getByText('Ada', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Export menu', exact: true }).click();
  await page.getByRole('menuitem', { name: 'CSV', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel export', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Export menu', exact: true })).toBeEnabled();
});

test('generic bulk actions use first-column selection and split toolbar placement is visible', async ({ page }) => {
  await page.goto('/examples/bulk-actions');
  const first = page.getByRole('table').getByRole('row').nth(1).getByRole('cell').first();
  await first.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Email selected', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Email preview:' })).toHaveText('Email preview: ada@example.test');
  await page.getByRole('button', { name: 'Remove selected', exact: true }).click();
  await expect(page.getByRole('table').getByRole('cell', { name: 'Ada', exact: true })).toHaveCount(0);
  await page.goto('/examples/toolbar-split');
  const search = page.locator('[data-table-toolbar-control="search"]');
  const exported = page.locator('[data-table-toolbar-control="export"]');
  await expect(search).toHaveAttribute('data-table-toolbar-side', 'left');
  await expect(exported).toHaveAttribute('data-table-toolbar-side', 'right');
  const searchBox = await search.boundingBox();
  const exportBox = await exported.boundingBox();
  expect(exportBox.x).toBeGreaterThan(searchBox.x + searchBox.width);
});


test('theme presets visibly change table surfaces without resetting search', async ({ page }) => {
  await page.goto('/examples/themes');
  await page.getByRole('button', { name: 'Open search', exact: true }).click();
  const search = page.getByRole('textbox', { name: 'Search', exact: true });
  await search.fill('Ada');
  await expect(page.getByRole('columnheader').first()).toHaveCSS('background-color', 'rgb(0, 128, 0)');
  const surface = page.locator('.MuiPaper-root').filter({ has: page.getByRole('table') });
  for (const [name, color] of [['Grey', 'rgb(245, 245, 245)'], ['Blue', 'rgb(240, 247, 255)'], ['Dark', 'rgb(18, 18, 18)'], ['Default', 'rgb(255, 255, 255)']]) {
    await page.getByRole('button', { name: 'theme selector', exact: true }).click();
    await page.getByRole('menuitem', { name, exact: true }).click();
    await expect(surface).toHaveCSS('background-color', color);
    if (name === 'Default') await expect(page.getByRole('columnheader').first()).toHaveCSS('background-color', 'rgb(0, 128, 0)');
    await expect(search).toHaveValue('Ada');
    await expect(page.getByRole('table').getByText('Grace', { exact: true })).toHaveCount(0);
  }
});


for (const applicationMode of ['light', 'dark']) {
test(`rows-per-page dropdown meets text contrast in every preset with ${applicationMode} application`, async ({ page }) => {
  await page.goto('/examples/themes');
  if (applicationMode === 'dark') await page.getByRole('button', { name: 'Use dark theme', exact: true }).click();
  for (const name of ['Default', 'Grey', 'Blue', 'Light', 'Dark']) {
    await page.getByRole('button', { name: 'theme selector', exact: true }).click();
    await page.getByRole('menuitem', { name, exact: true }).click();
    const dropdown = page.getByRole('combobox', { name: 'Rows per page:' });
    await expect(page.locator('.MuiTablePagination-root input')).toHaveAttribute('aria-labelledby', await dropdown.getAttribute('aria-labelledby'));
    const closed = await new AxeBuilder({ page }).include('.MuiTablePagination-root').include('.MuiTableHead-root').withRules(['color-contrast', 'label', 'select-name', 'aria-input-field-name']).analyze();
    expect(closed.violations, `${name}: closed dropdown`).toEqual([]);
    await dropdown.click();
    const list = page.getByRole('listbox');
    await expect(list).toBeVisible();
    await page.getByRole('option', { name: '10', exact: true }).hover();
    const open = await new AxeBuilder({ page }).include('.MuiTablePagination-menuItem').withRules(['color-contrast', 'label', 'select-name', 'aria-input-field-name']).analyze();
    expect(open.violations, `${name}: selected and hovered options`).toEqual([]);
    await page.keyboard.press('Escape');
  }
});
}
