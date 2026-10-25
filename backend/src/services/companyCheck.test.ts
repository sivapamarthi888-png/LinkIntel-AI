import { describe, it, expect } from 'vitest';
import { assembleCompanyCheck, type DomainProbe } from './companyCheck.js';
import { looksLikeNoise } from './jobAnalysis.js';
import { extractDomain, guessCompanyDomain, isProbablePublicDomain, FREEMAIL_DOMAINS } from './domainUtils.js';

const probe = (over: Partial<DomainProbe>): DomainProbe => ({
  domain: 'example.com',
  source: 'company-name',
  resolves: null,
  websiteResponded: null,
  httpStatus: null,
  ...over,
});

describe('noise (gibberish) detection', () => {
  it('flags random-letter inputs like the live-website fake report', () => {
    expect(looksLikeNoise('Cvt v t Tctctc Funturnomtr chr h t tcrctctct Cr t Tctc')).toBe(true);
  });

  it('flags a company name that is pure non-words', () => {
    expect(looksLikeNoise('tctctc tcrctctct')).toBe(true);
  });

  it('does not flag ordinary English job text', () => {
    const ordinary =
      'Junior Software Developer TechCorp is seeking a Junior Software Developer to join our growing engineering team. ' +
      'You will build features with JavaScript and React under the guidance of senior engineers.';
    expect(looksLikeNoise(ordinary.toLowerCase())).toBe(false);
  });

  it('does not flag text containing a few acronyms', () => {
    expect(
      looksLikeNoise('we are hiring a software developer in our company css html skills are a plus')
    ).toBe(false);
  });

  it('flags text that has no evaluable words', () => {
    expect(looksLikeNoise('x y z h t')).toBe(true);
  });
});

describe('domain helpers', () => {
  it('derives slug candidates from a company name', () => {
    expect(guessCompanyDomain('Siva group of companies')).toEqual([
      'sivagroupofcompanies.com',
      'sivagroupofcompanies.io',
      'sivagroupofcompanies.co',
    ]);
  });

  it('extracts domains from emails, urls and bare domains', () => {
    expect(extractDomain('hr@quickcash.com')).toBe('quickcash.com');
    expect(extractDomain('https://www.jobs.example.io/careers')).toBe('jobs.example.io');
    expect(extractDomain('plain-text-input')).toBeNull();
  });

  it('rejects hosts that are not public domains before probing', () => {
    expect(isProbablePublicDomain('localhost')).toBe(false);
    expect(isProbablePublicDomain('example.com')).toBe(true);
    expect(isProbablePublicDomain('sub.example.co.uk')).toBe(true);
  });

  it('classifies freemail domains', () => {
    expect(FREEMAIL_DOMAINS).toContain('gmail.com');
  });
});

describe('company check assembly (pure, no network)', () => {
  const companyName = 'Tctctc';
  const email = 'tctc';

  it('reports danger verdict when every candidate domain definitively fails DNS', () => {
    const result = assembleCompanyCheck(
      companyName,
      email,
      [
        probe({ domain: 'tctctc.com', resolves: false }),
        probe({ domain: 'tctctc.io', resolves: false }),
      ],
      null
    );
    expect(result.webPresence).toBe('not-found');
    expect(result.verdictLevel).toBe('danger');
    expect(result.verdict).toMatch(/No verifiable online presence/i);
    expect(result.logoUrl).toBeNull();
    expect(result.signals.some((s) => s.includes('tctctc.com'))).toBe(true);
    expect(result.checksPerformed.length).toBeGreaterThan(0);
    expect(result.disclaimer).toMatch(/NOT a company-registry/i);
  });

  it('reports ok verdict with logo when a website responds', () => {
    const result = assembleCompanyCheck(
      'TechCorp',
      'jobs@techcorp.com',
      [probe({ domain: 'techcorp.com', resolves: true, websiteResponded: true, httpStatus: 200 })],
      null
    );
    expect(result.webPresence).toBe('found');
    expect(result.verdictLevel).toBe('ok');
    expect(result.foundDomain).toBe('techcorp.com');
    expect(result.logoUrl).toContain('google.com/s2/favicons?domain=techcorp.com');
    expect(result.signals[0]).toMatch(/responded/i);
  });

  it('is uncertain (never dangerous) when probes are inconclusive', () => {
    const result = assembleCompanyCheck(
      'Unknown Corp',
      '',
      [probe({ domain: 'unknowncorp.com', resolves: null })],
      null
    );
    expect(result.webPresence).toBe('uncertain');
    expect(result.verdictLevel).toBe('warn');
  });

  it('flags freemail recruiter domains as a signal but not per-se fraud', () => {
    const result = assembleCompanyCheck(
      'Some Company',
      'hr@gmail.com',
      [probe({ domain: 'somecompany.com', resolves: true, websiteResponded: true, httpStatus: 200 })],
      null
    );
    expect(result.emailDomainIsFreemail).toBe(true);
    expect(result.signals.some((s) => s.includes('gmail.com'))).toBe(true);
  });

  it('incorporates a successful AI web search result', () => {
    const result = assembleCompanyCheck(
      'Acme',
      '',
      [probe({ domain: 'acme.com', resolves: false })],
      { status: 'performed', summary: 'Live web search: an established company appears to exist under this name. Found acme.com.', sources: ['https://acme.com'] }
    );
    expect(result.aiWebSearch?.status).toBe('performed');
    expect(result.aiWebSearch?.sources).toContain('https://acme.com');
  });
});
