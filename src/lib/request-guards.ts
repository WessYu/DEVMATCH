const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const developerIdPattern = /^[a-z0-9-]{1,40}$/;

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
