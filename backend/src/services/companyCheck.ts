// Live company background check — genuinely probes the public internet:
//   1) DNS resolution of likely company domains (company-name derived + recruiter email domain)
//   2) HTTPS reachability of any domain that resolves
//   3) Optional Gemini + Google Search grounding when GEMINI_API_KEY is configured
// Honesty rules: this is a DNS/HTTP presence probe, NOT a company-registry lookup.
// "Website found" confirms existence of a site, never that it belongs to the company.

import dnsPromises from 'node:dns/promises';
import { FREEMAIL_DOMAINS, extractDomain, guessCompanyDomain, isProbablePublicDomain } from './domainUtils.js';

export interface DomainProbe {
  domain: string;
  source: 'company-name' | 'recruiter-email';
  /** null = check could not be performed reliably */
  resolves: boolean | null;
  websiteResponded: boolean | null;
  httpStatus: number | null;
}

export interface CompanyWebSearch {
  status: 'performed' | 'failed';
  summary: string;
  sources: string[];
}

export interface CompanyCheckResult {
  companyName: string;
  webPresence: 'found' | 'not-found' | 'uncertain';
  foundDomain: string | null;
  logoUrl: string | null;
  verdict: string;
  verdictLevel: 'ok' | 'warn' | 'danger';
  probes: DomainProbe[];
  emailDomain: string | null;
  emailDomainIsFreemail: boolean;
  signals: string[];
  checksPerformed: string[];
  aiWebSearch: CompanyWebSearch | null;
  disclaimer: string;
}

// ---------- low-level probes (all bounded by timeouts) ----------

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  timeoutValue: T
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(timeoutValue), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function domainResolves(domain: string, timeoutMs = 4000): Promise<boolean | null> {
  if (!isProbablePublicDomain(domain)) return null;
  try {
    const records = await withTimeout(dnsPromises.resolve(domain), timeoutMs, []);
    return records.length > 0;
  } catch (err: any) {
    // ENOTFOUND/NXDOMAIN: name not registered. ENODATA: name exists in the
    // parent zone but has no usable address record (no website).
    if (['ENOTFOUND', 'NXDOMAIN', 'ENODATA'].includes(err?.code)) return false;
    return null; // timeouts / resolver errors are inconclusive
  }
}

export async function websiteResponds(
  domain: string,
  timeoutMs = 6000
): Promise<{ responded: boolean; status: number | null }> {
  if (!isProbablePublicDomain(domain)) return { responded: false, status: null };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`https://${domain}`, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'LinkIntelAI-Prototype/1.0 (job-safety check)' },
    });
    return { responded: true, status: res.status };
  } catch {
    return { responded: false, status: null };
  } finally {
    clearTimeout(timer);
  }
}

export async function probeDomain(domain: string, source: DomainProbe['source']): Promise<DomainProbe> {
  const base: DomainProbe = { domain, source, resolves: null, websiteResponded: null, httpStatus: null };
  const resolves = await domainResolves(domain);
  if (resolves !== true) return { ...base, resolves };
  const site = await websiteResponds(domain);
  return { ...base, resolves: true, websiteResponded: site.responded, httpStatus: site.status };
}

// ---------- optional Gemini web-search grounding ----------

async function searchCompanyWithGemini(
  companyName: string,
  emailDomain: string | null
): Promise<CompanyWebSearch | null> {
  if (!process.env.GEMINI_API_KEY) return null;
  // Imported lazily so demo environments never load this module eagerly.
  const { generateTextWithPrompt, tryParseJsonFromGemini } = await import('./gemini.js');

  const prompt = `You have web search access. Research whether a real, established company exists under the name "${companyName}"${emailDomain ? ` (claimed recruiting email domain: ${emailDomain})` : ''}.
Check: official website, news coverage, job postings on established boards, company registries/LinkedIn-style presence.
Return ONLY JSON: {"verdict":"likely-real"|"likely-fake"|"unclear","summary":"<2-3 factual sentences citing what you found>","sources":["<urls>"],"officialWebsite":"<url or null>"}`;

  const response = await generateTextWithPrompt(prompt, 'company_web_search', {
    temperature: 0.1,
    timeoutMs: 40_000,
    maxOutputTokens: 1024,
  });
  const parsed = tryParseJsonFromGemini(response);
  if (!parsed || typeof parsed.summary !== 'string') return null;
  return {
    status: 'performed',
    summary: `${verdictLabel(parsed.verdict)} — ${parsed.summary}`,
    sources: Array.isArray(parsed.sources) ? parsed.sources.slice(0, 6).map(String) : [],
  };
}

function verdictLabel(verdict: unknown): string {
  if (verdict === 'likely-real') return 'Live web search: an established company appears to exist under this name.';
  if (verdict === 'likely-fake') return 'Live web search: no credible evidence of an established company under this name.';
  return 'Live web search: results were inconclusive.';
}

// ---------- pure assembly (unit-tested without network) ----------

export function assembleCompanyCheck(
  companyName: string,
  recruiterEmailOrUrl: string,
  probes: DomainProbe[],
  aiWebSearch?: CompanyWebSearch | null
): CompanyCheckResult {
  const emailDomain = extractDomain(recruiterEmailOrUrl || '');
  const emailDomainIsFreemail = emailDomain ? FREEMAIL_DOMAINS.includes(emailDomain) : false;

  const respondedProbe = probes.find((p) => p.websiteResponded === true);
  const resolvingProbe = probes.find((p) => p.resolves === true);
  const allDefinitivelyUnresolved =
    probes.length > 0 && probes.every((p) => p.resolves === false);

  const webPresence: CompanyCheckResult['webPresence'] = respondedProbe
    ? 'found'
    : allDefinitivelyUnresolved
      ? 'not-found'
      : resolvingProbe
        ? 'uncertain'
        : 'uncertain';

  const foundDomain = respondedProbe?.domain ?? null;
  const logoUrl = foundDomain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(foundDomain)}&sz=128`
    : null;

  const signals: string[] = [];
  if (respondedProbe) {
    signals.push(
      `A live website responded at https://${respondedProbe.domain} (HTTP ${respondedProbe.httpStatus}). Confirm this site genuinely belongs to the company — possession of a domain is easy and scammers register lookalike names.`
    );
  } else if (allDefinitivelyUnresolved) {
    signals.push(
      `None of the likely domains (${probes.map((p) => p.domain).join(', ')}) resolve in public DNS. An established company usually has some matching web presence — absence is a caution signal, not definitive proof of fraud.`
    );
  } else if (probes.length === 0) {
    signals.push('No probeable domains could be derived from the supplied details.');
  } else {
    signals.push(
      'Network checks were inconclusive (timeouts or blocked responses) — no judgment can be made from this check alone.'
    );
  }
  if (emailDomain && emailDomainIsFreemail) {
    signals.push(
      `Recruiter uses the free personal email domain "${emailDomain}" — individual recruiters do use these, but legitimate hiring processes normally use a company domain.`
    );
  }

  let verdict: string;
  let verdictLevel: CompanyCheckResult['verdictLevel'];
  if (webPresence === 'found') {
    verdict = 'Company website found online — verify it belongs to this company';
    verdictLevel = 'ok';
  } else if (webPresence === 'not-found') {
    verdict = 'No verifiable online presence found — treat with strong caution';
    verdictLevel = 'danger';
  } else {
    verdict = 'Checks inconclusive — verify manually';
    verdictLevel = 'warn';
  }
  if (aiWebSearch?.status === 'performed') {
    verdict =
      verdictLevel === 'danger' && aiWebSearch.summary.startsWith('Live web search: no credible evidence')
        ? 'No verifiable online presence — live web search found no credible company under this name'
        : verdict;
  }

  return {
    companyName,
    webPresence,
    foundDomain,
    logoUrl,
    verdict,
    verdictLevel,
    probes,
    emailDomain,
    emailDomainIsFreemail,
    signals,
    checksPerformed: [
      'DNS resolution lookup of candidate domains (company-name derived + recruiter email domain)',
      'HTTPS reachability probe of any domain that resolved',
      ...(aiWebSearch?.status === 'performed'
        ? ['Gemini live web search with Google Search grounding']
        : []),
    ],
    aiWebSearch: aiWebSearch ?? null,
    disclaimer:
      'This is a live DNS/website probe, NOT a company-registry or trademark lookup. A responding website is not proof of legitimacy; an unsolicited contact plus any of the red flags elsewhere in this report matters more. Always verify the company through its official channels independently.',
  };
}

// ---------- entry point used by routes ----------

export async function runCompanyCheck(jobData: {
  companyName?: string;
  recruiterEmailOrUrl?: string;
}): Promise<CompanyCheckResult> {
  const companyName = String(jobData.companyName || '').trim();
  const recruiterEmailOrUrl = String(jobData.recruiterEmailOrUrl || '').trim();
  const emailDomain = extractDomain(recruiterEmailOrUrl);
  const emailDomainIsFreemail = emailDomain ? FREEMAIL_DOMAINS.includes(emailDomain) : false;

  const candidates: { domain: string; source: DomainProbe['source'] }[] = [];
  for (const d of guessCompanyDomain(companyName)) {
    candidates.push({ domain: d, source: 'company-name' });
  }
  if (emailDomain && !emailDomainIsFreemail && isProbablePublicDomain(emailDomain)) {
    candidates.push({ domain: emailDomain, source: 'recruiter-email' });
  }
  // De-duplicate and cap at 4 probes for latency.
  const seen = new Set<string>();
  const unique = candidates.filter((c) => {
    if (seen.has(c.domain)) return false;
    seen.add(c.domain);
    return isProbablePublicDomain(c.domain);
  }).slice(0, 4);

  const probes = await Promise.all(unique.map((c) => probeDomain(c.domain, c.source)));

  let aiWebSearch: CompanyWebSearch | null = null;
  if (process.env.GEMINI_API_KEY) {
    try {
      aiWebSearch = await searchCompanyWithGemini(companyName, emailDomain);
    } catch {
      aiWebSearch = { status: 'failed', summary: 'Live web search unavailable for this request.', sources: [] };
    }
  }

  return assembleCompanyCheck(companyName || 'N/A', recruiterEmailOrUrl, probes, aiWebSearch);
}

// Public-domain re-exports used elsewhere
export { FREEMAIL_DOMAINS, extractDomain, isProbablePublicDomain };
