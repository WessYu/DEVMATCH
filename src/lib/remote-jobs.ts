export type RemoteJob = {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  category: string;
  jobType: string;
  publishedAt: string;
  location: string;
  salary: string;
  description: string;
  excerpt: string;
  url: string;
  tags: string[];
  source: "Remotive";
};

type RemotiveJob = {
  id?: number | string;
  url?: string;
  title?: string;
  company_name?: string;
  company_logo?: string;
  category?: string;
  job_type?: string;
  publication_date?: string;
  candidate_required_location?: string;
  salary?: string;
  description?: string;
};

type RemotiveResponse = {
  jobs?: RemotiveJob[];
};

const technologyMatchers: Array<[string, RegExp]> = [
  ["React", /\breact(?:\.js)?\b/i],
  ["Next.js", /\bnext(?:\.js|js)?\b/i],
  ["TypeScript", /\btypescript\b/i],
  ["JavaScript", /\bjavascript\b/i],
  ["Node.js", /\bnode(?:\.js|js)?\b/i],
  ["HTML", /\bhtml5?\b/i],
  ["CSS", /\bcss3?\b/i],
  ["Vue", /\bvue(?:\.js|js)?\b/i],
  ["Angular", /\bangular\b/i],
  ["Python", /\bpython\b/i],
  ["Java", /\bjava\b/i],
  ["PHP", /\bphp\b/i],
  ["Ruby", /\bruby\b/i],
  ["AWS", /\baws\b|amazon web services/i],
  ["Remote", /\bremote\b|worldwide|anywhere/i],
  ["Junior", /\bjunior\b|entry[- ]level|graduate/i],
];

function decodeEntities(value: string) {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
    "&ndash;": "–",
    "&mdash;": "—",
    "&bull;": "•",
  };

  return value
    .replace(/&(amp|lt|gt|quot|#39|nbsp|ndash|mdash|bull);/gi, (entity) => entities[entity.toLowerCase()] ?? entity)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)));
}

function htmlToText(html: string) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/(p|div|h[1-6]|ul|ol|li|section)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function truncate(value: string, length: number) {
  if (value.length <= length) return value;
  const shortened = value.slice(0, length + 1).replace(/\s+\S*$/, "").trim();
  return `${shortened || value.slice(0, length).trim()}…`;
}

function normalizeJobType(value: string) {
  const labels: Record<string, string> = {
    full_time: "Tempo integral",
    part_time: "Meio período",
    contract: "Contrato",
    freelance: "Freelance",
    internship: "Estágio",
    temporary: "Temporário",
  };

  return labels[value] ?? value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Não informado";
}

function extractTags(job: RemotiveJob, description: string) {
  const searchable = `${job.title ?? ""} ${job.category ?? ""} ${job.candidate_required_location ?? ""} ${description}`;
  const tags = technologyMatchers.filter(([, matcher]) => matcher.test(searchable)).map(([name]) => name);
  if (job.category && !tags.includes(job.category)) tags.push(job.category);
  return Array.from(new Set(tags)).slice(0, 8);
}

function normalizeJob(job: RemotiveJob): RemoteJob | null {
  const title = String(job.title ?? "").trim();
  const company = String(job.company_name ?? "").trim();
  const url = String(job.url ?? "").trim();
  if (!title || !company || !url.startsWith("https://")) return null;

  const description = truncate(htmlToText(String(job.description ?? "")), 1800);
  const id = String(job.id ?? `${company}-${title}`).replace(/[^a-zA-Z0-9_-]/g, "-");

  return {
    id: `remotive-${id}`,
    title,
    company,
    companyLogo: String(job.company_logo ?? "").trim(),
    category: String(job.category ?? "Desenvolvimento de software").trim(),
    jobType: normalizeJobType(String(job.job_type ?? "")),
    publishedAt: String(job.publication_date ?? new Date().toISOString()),
    location: String(job.candidate_required_location ?? "Remoto").trim() || "Remoto",
    salary: String(job.salary ?? "").trim(),
    description,
    excerpt: truncate(description, 360),
    url,
    tags: extractTags(job, description),
    source: "Remotive",
  };
}

function relevanceScore(job: RemoteJob, query: string) {
  const haystack = `${job.title} ${job.company} ${job.category} ${job.location} ${job.tags.join(" ")} ${job.description}`.toLowerCase();
  const tokens = query.toLowerCase().split(/\s+/).map((token) => token.trim()).filter((token) => token.length > 1);
  const defaultSignals = ["front end", "frontend", "react", "javascript", "typescript", "junior", "web developer"];
  const signals = tokens.length ? tokens : defaultSignals;

  return signals.reduce((score, signal) => {
    if (job.title.toLowerCase().includes(signal)) return score + 8;
    if (job.tags.some((tag) => tag.toLowerCase().includes(signal))) return score + 5;
    if (haystack.includes(signal)) return score + 2;
    return score;
  }, 0);
}

export async function getRemoteJobs(query = "", requestedLimit = 24) {
  const limit = Math.max(1, Math.min(requestedLimit, 40));
  const endpoint = new URL("https://remotive.com/api/remote-jobs");
  endpoint.searchParams.set("category", "software-dev");
  endpoint.searchParams.set("limit", "80");

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "User-Agent": "DevMatch/1.0 (+https://devmatch-neon.vercel.app)",
    },
    next: { revalidate: 21_600 },
  });

  if (!response.ok) throw new Error(`Remotive returned ${response.status}`);

  const payload = await response.json() as RemotiveResponse;
  const jobs = (payload.jobs ?? [])
    .map(normalizeJob)
    .filter((job): job is RemoteJob => Boolean(job));

  const tokens = query.toLowerCase().split(/\s+/).map((token) => token.trim()).filter((token) => token.length > 1);
  const filtered = tokens.length
    ? jobs.filter((job) => {
        const haystack = `${job.title} ${job.company} ${job.category} ${job.location} ${job.tags.join(" ")} ${job.description}`.toLowerCase();
        return tokens.some((token) => haystack.includes(token));
      })
    : jobs;

  return filtered
    .sort((a, b) => {
      const scoreDifference = relevanceScore(b, query) - relevanceScore(a, query);
      if (scoreDifference) return scoreDifference;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, limit);
}
