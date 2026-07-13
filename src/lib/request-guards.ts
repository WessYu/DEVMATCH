const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const developerIdPattern = /^[a-z0-9-]{1,40}$/;
const urlProtocols = new Set(["http:", "https:"]);

export function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export function cleanEmail(value: unknown) {
  const email = cleanText(value, 180).toLowerCase();
  return emailPattern.test(email) ? email : "";
}

export function cleanDeveloperIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => cleanText(item, 40))
        .filter((item) => developerIdPattern.test(item)),
    ),
  ).slice(0, 30);
}

export function cleanUrl(value: unknown) {
  const url = cleanText(value, 500);

  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    return urlProtocols.has(parsed.protocol) ? parsed.toString() : "";
  } catch {
    return "";
  }
}

export function cleanTags(value: unknown) {
  const rawTags = Array.isArray(value)
    ? value
    : cleanText(value, 220)
        .split(",")
        .map((item) => item.trim());

  return Array.from(
    new Set(
      rawTags
        .map((item) => cleanText(item, 28))
        .filter(Boolean),
    ),
  ).slice(0, 8);
}
