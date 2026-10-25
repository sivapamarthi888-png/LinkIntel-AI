// Shared helpers for deriving and classifying domains from user input.
// Used by the verification route and the live company check service.

// A freemail domain is a mild signal only, never proof of fraud
export const FREEMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'protonmail.com',
  'mail.ru',
  'yandex.com',
];

export function extractDomain(input: string): string | null {
  try {
    const trimmed = input.trim().toLowerCase();
    // If it's a URL, parse the hostname
    if (trimmed.includes('://')) {
      const url = new URL(trimmed);
      return url.hostname.replace(/^www\./, '');
    }
    // If it's an email address
    if (trimmed.includes('@')) {
      return trimmed.split('@')[1] || null;
    }
    // Treat as bare domain
    if (/^[a-z0-9.-]+\.[a-z]{2,}$/.test(trimmed)) {
      return trimmed;
    }
    return null;
  } catch {
    return null;
  }
}

export function companySlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .split(/\s+/)
    .join('');
}

export function guessCompanyDomain(companyName: string): string[] {
  // Generate plausible candidate domains — SUGGESTIONS to probe/check,
  // never assertions that they belong to the company.
  const slug = companySlug(companyName);
  if (!slug || slug.length < 3) return [];
  return [`${slug}.com`, `${slug}.io`, `${slug}.co`];
}

// Only well-formed public-domain hosts are probed; anything else is rejected
// so we never attempt requests to bare hostnames like "localhost".
export function isProbablePublicDomain(domain: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(
    domain.replace(/^www\./, '')
  );
}
