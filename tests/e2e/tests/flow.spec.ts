import { test, expect } from '@playwright/test';

test('Flusso completo: menu → carrello → checkout → admin update', async ({ page }) => {
  const artifacts = 'tests/e2e/artifacts';
  const unique = Date.now();
  const email = `test_${unique}@example.com`;
  const password = 'P@ssw0rd!';

  // Home
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pizzeria O Vesuvio' })).toBeVisible();
  await page.screenshot({ path: `${artifacts}/home.png` });

  // Menu (usa CTA home se presente, altrimenti nav)
  const ctaMenu = page.getByRole('link', { name: 'Sfoglia il menu' });
  if (await ctaMenu.isVisible().catch(() => false)) {
    await ctaMenu.click();
  } else {
    await page.getByRole('link', { name: 'Menu' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible();
  // Aggiungi primo prodotto disponibile
  const addButtons = page.getByRole('button', { name: 'Aggiungi' });
  await addButtons.first().click();
  await page.screenshot({ path: `${artifacts}/menu.png` });

  // Carrello
  await page.getByRole('link', { name: 'Carrello' }).click();
  await expect(page.getByRole('heading', { name: 'Carrello' })).toBeVisible();
  await page.screenshot({ path: `${artifacts}/carrello.png` });

  // Checkout (non loggato → avviso)
  await page.getByRole('link', { name: 'Procedi al checkout' }).click();
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Conferma ordine' })).toBeDisabled();
  await page.screenshot({ path: `${artifacts}/checkout_not_logged.png` });

  // Registrazione e login
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Profilo utente' })).toBeVisible();
  await page.locator('input[placeholder="nome"]').fill('Mario');
  await page.locator('input[placeholder="cognome"]').fill('Rossi');
  await page.locator('input[placeholder="email"]').fill(email);
  await page.locator('input[placeholder="telefono"]').fill('07161811727');
  await page.locator('input[placeholder="via e numero, città"]').fill('Manzenstraße 60, 73037 Göppingen');
  await page.locator('input[placeholder="password"]').fill(password);
  await page.getByRole('button', { name: 'Registrati' }).click();
  await expect(page.locator('.status')).toContainText('Registrazione completata');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.locator('.status')).toContainText('Login effettuato');
  const savedToken = await page.evaluate(() => localStorage.getItem('token'));
  expect(savedToken).toBeTruthy();
  await page.screenshot({ path: `${artifacts}/profilo.png` });

  // Torna al checkout, compila e conferma
  await page.getByRole('link', { name: 'Carrello' }).click();
  await page.getByRole('link', { name: 'Procedi al checkout' }).click();
  // Assicura che il bottone sia abilitato
  const confirmBtn = page.getByRole('button', { name: 'Conferma ordine' });
  const tokenAtCheckout = await page.evaluate(() => localStorage.getItem('token'));
  expect(tokenAtCheckout).toBeTruthy();
  // Verifica lo stato del bottone prima di aspettare
  const initialDisabled = await confirmBtn.isDisabled();
  // Aspetta abilitazione
  await expect(confirmBtn).toBeEnabled({ timeout: 15000 });
  await confirmBtn.click();
  await expect(page.locator('.status')).toContainText('Ordine confermato');
  await page.screenshot({ path: `${artifacts}/checkout_confirmed.png` });

  // Login admin e aggiorna stato
  await page.getByRole('link', { name: 'Profilo' }).click();
  await page.locator('input[placeholder="email"]').fill('admin@ovesuvio.com');
  await page.locator('input[placeholder="password"]').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.locator('.status')).toContainText('Login effettuato');

  await page.getByRole('link', { name: 'Admin' }).click();
  await expect(page.getByRole('heading', { name: 'Admin dashboard' })).toBeVisible();
  // Clicca 'In preparazione' sul primo ordine
  const prepBtn = page.getByRole('button', { name: 'In preparazione' }).first();
  await prepBtn.click();
  await expect(page.locator('.status')).toContainText('Stato aggiornato');
  await page.screenshot({ path: `${artifacts}/admin_updated.png` });
});