import { test, expect, request } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3002";

function sessionCookie(response) {
  const cookie = response.headers()["set-cookie"] ?? "";
  return cookie.split(";")[0];
}

test("backend trusts session identity for feed, matches and chat", async () => {
  const api = await request.newContext({ baseURL });
  const stamp = Date.now();

  const profiles = await api.get("/api/profiles");
  expect(profiles.ok()).toBeTruthy();
  const profileBody = await profiles.json();
  const developerId = profileBody.developers?.[0]?.id;
  expect(developerId).toBeTruthy();

  const unauthFeed = await api.post("/api/feed", {
    data: { title: "Sem sessão", body: "bloquear" },
  });
  expect(unauthFeed.status()).toBe(401);

  const companyAuth = await api.post("/api/auth", {
    data: {
      intent: "signup",
      name: "Empresa Segura",
      email: `security.company.${stamp}@example.com`,
      password: "senha1234",
      mode: "company",
    },
  });
  expect(companyAuth.ok()).toBeTruthy();
  const companyCookie = sessionCookie(companyAuth);
  expect(companyCookie).toContain("devmatch_session=");

  const companyApi = await request.newContext({
    baseURL,
    extraHTTPHeaders: { cookie: companyCookie },
  });

  const spoofedFeed = await companyApi.post("/api/feed", {
    data: {
      author: { name: "Nome falso", email: "spoof@example.com", mode: "developer" },
      email: "spoof@example.com",
      mode: "developer",
      title: "Post seguro",
      body: "Autor precisa vir da sessão.",
      kind: "post",
    },
  });
  expect(spoofedFeed.status()).toBe(201);
  const spoofedFeedBody = await spoofedFeed.json();
  expect(spoofedFeedBody.post.authorName).toBe("Empresa Segura");
  expect(spoofedFeedBody.post.authorMode).toBe("company");
  expect(spoofedFeedBody.post.authorEmail).toContain(`security.company.${stamp}`);

  const devAuth = await api.post("/api/auth", {
    data: {
      intent: "signup",
      name: "Dev Seguro",
      email: `security.dev.${stamp}@example.com`,
      password: "senha1234",
      mode: "developer",
    },
  });
  expect(devAuth.ok()).toBeTruthy();
  const devApi = await request.newContext({
    baseURL,
    extraHTTPHeaders: { cookie: sessionCookie(devAuth) },
  });

  const devMatch = await devApi.post("/api/matches", {
    data: { likedIds: [developerId], companyEmail: "spoof@example.com" },
  });
  expect(devMatch.status()).toBe(403);

  const companyMatch = await companyApi.post("/api/matches", {
    data: { likedIds: [developerId], companyEmail: "spoof@example.com" },
  });
  expect(companyMatch.ok()).toBeTruthy();
  const matchBody = await companyMatch.json();
  const matchKey = matchBody.matches?.[0]?.matchKey;
  expect(matchKey).toBeTruthy();

  const spoofedChat = await companyApi.post("/api/chat", {
    data: { matchId: matchKey, message: "Mensagem segura", author: "developer" },
  });
  expect(spoofedChat.ok()).toBeTruthy();
  const spoofedChatBody = await spoofedChat.json();
  expect(spoofedChatBody.message.author).toBe("company");

  const outsiderChat = await devApi.post("/api/chat", {
    data: { matchId: matchKey, message: "Não participo", author: "developer" },
  });
  expect(outsiderChat.status()).toBe(403);
});
