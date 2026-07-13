import { test, expect } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3002";

test("mobile authenticated product flow", async ({ page }) => {
  const stamp = Date.now();
  const email = `mobile.${stamp}@example.com`;
  const password = "senha1234";
  const postTitle = `Post mobile ${stamp}`;

  await page.goto(`${baseUrl}/feed`);

  await page.getByPlaceholder("Nome").fill("Empresa Mobile");
  await page.getByPlaceholder("email@empresa.com").fill(email);
  await page.getByPlaceholder("Senha").fill(password);
  await expect(page.getByRole("button", { name: "Criar acesso" })).toBeEnabled();

  const signupResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/api/auth") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Criar acesso" }).click();
  const signupResponse = await signupResponsePromise;
  expect(signupResponse.status()).toBe(200);
  await expect(page.getByText(email)).toBeVisible();

  const logoutAfterSignupPromise = page.waitForResponse(
    (response) => response.url().includes("/api/session") && response.request().method() === "DELETE",
  );
  await page.getByLabel("Sair").click();
  await logoutAfterSignupPromise;
  await expect(page.getByRole("button", { name: "Entrar" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Entrar" }).first().click();
  await page.getByPlaceholder("email@empresa.com").fill(email);
  await page.getByPlaceholder("Senha").fill(password);
  await expect(page.getByRole("button", { name: "Entrar" }).last()).toBeEnabled();

  const signinResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/api/auth") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Entrar" }).last().click();
  const signinResponse = await signinResponsePromise;
  expect(signinResponse.status()).toBe(200);
  await expect(page.getByText(email)).toBeVisible();

  await page.getByPlaceholder("Título da publicação").fill(postTitle);
  await page
    .getByPlaceholder("Compartilhe projeto, aprendizado, disponibilidade ou pedido")
    .fill("Publicado a partir do fluxo mobile autenticado.");
  await page.getByPlaceholder("React, Next, Remoto").fill("Mobile, React");

  const feedResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/api/feed") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Publicar" }).click();
  const feedResponse = await feedResponsePromise;
  expect(feedResponse.status()).toBe(201);
  await expect(page.getByText("Publicado.")).toBeVisible();
  await expect(page.getByRole("heading", { name: postTitle })).toBeVisible();

  await page.goto(`${baseUrl}/contratante`);
  await expect(page.getByText("Candidatos para revisão")).toBeVisible();

  const matchResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/api/matches") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Dar match" }).first().click();
  const matchResponse = await matchResponsePromise;
  expect(matchResponse.status()).toBe(200);
  await expect(page.getByText("Matches abertos")).toBeVisible();
  await page.getByRole("link", { name: /Enzo Takeda/ }).click();
  await expect(page).toHaveURL(/\/chat\?match=/);

  await expect(page.getByText("Histórico do match")).toBeVisible();
  await page.getByPlaceholder("Mensagem").fill("Mensagem enviada no teste mobile.");

  const chatResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/api/chat") && response.request().method() === "POST",
  );
  await page.locator("form").filter({ has: page.getByPlaceholder("Mensagem") }).getByRole("button").click();
  const chatResponse = await chatResponsePromise;
  expect(chatResponse.status()).toBe(200);
  await expect(page.getByText("Mensagem enviada no teste mobile.")).toBeVisible();

  await page.goto(`${baseUrl}/contratante`);
  const logoutAfterChatPromise = page.waitForResponse(
    (response) => response.url().includes("/api/session") && response.request().method() === "DELETE",
  );
  await page.getByLabel("Sair").click();
  await logoutAfterChatPromise;
  await page.reload();
  await expect(page.getByText("Acesso restrito")).toBeVisible();
  await expect(page.getByText("Nenhuma sessão válida encontrada.")).toBeVisible();
});
