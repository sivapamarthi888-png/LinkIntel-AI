import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { FREEMAIL_DOMAINS, extractDomain, guessCompanyDomain } from '../services/domainUtils.js';

const router = express.Router();

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many verification requests. Please try again later.' },
});

const verificationInputSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200),
  recruiterName: z.string().max(200).optional().default(''),
  recruiterEmailDomain: z.string().max(200).optional().default(''),
  jobListingUrl: z.string().max(1000).optional().default(''),
  officialCareersUrl: z.string().max(1000).optional().default(''),
});

router.post('/', verificationLimiter, (req, res) => {
  const parseResult = verificationInputSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid input',
      details: parseResult.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  const { companyName, recruiterName, recruiterEmailDomain, jobListingUrl, officialCareersUrl } =
    parseResult.data;

  type Status = 'Supported by supplied evidence' | 'Needs checking' | 'Warning detected' | 'Not independently verified';

  const checklist: { item: string; status: Status; notes: string; evidence: 'verified' | 'supplied' | 'unverified' }[] = [];

  // 1. Company name supplied
  checklist.push({
    item: 'Company name provided by the recruiter',
    status: 'Supported by supplied evidence',
    notes: companyName ? `Supplied: "${companyName}". This is user-supplied information only — it has NOT been checked against any company registry.` : 'Not provided.',
    evidence: 'supplied',
  });

  // 2. Recruiter identity
  checklist.push({
    item: 'Recruiter identity and platform profile',
    status: recruiterName ? 'Needs checking' : 'Not independently verified',
    notes: recruiterName
      ? `Supplied name: "${recruiterName}". Check the recruiter's profile on the platform you were contacted on — review how long the profile has existed, connections, and endorsements. This system has NOT looked up any profile.`
      : 'No recruiter name supplied. No identity verification was performed.',
    evidence: 'unverified',
  });

  // 3. Email domain consistency
  if (recruiterEmailDomain) {
    const domain = extractDomain(recruiterEmailDomain);
    const isFreemail = domain ? FREEMAIL_DOMAINS.includes(domain) : false;
    const candidateDomains = guessCompanyDomain(companyName);
    const domainMatchesCompany = domain ? candidateDomains.some((d) => domain === d || domain.startsWith(`${d.split('.')[0]}.`)) : false;

    checklist.push({
      item: 'Recruiter email domain consistency',
      status: domainMatchesCompany ? 'Supported by supplied evidence' : isFreemail ? 'Warning detected' : 'Needs checking',
      notes: domainMatchesCompany
        ? `Supplied domain "${domain}" resembles the company name pattern. Useful signal — but NOT conclusive proof. Scammers also register lookalike domains; verify exact spelling (e.g. cross-check letters like rn/m, 0/o, l/I).`
        : isFreemail
        ? `Supplied domain "${domain}" is a free email provider. A Gmail/Outlook address alone does NOT prove fraud (individual recruiters do use them), but legitimate hiring processes normally use a company domain. Ask why a company domain is not being used.`
        : `Supplied domain: "${domain}". Verify it is the company's real domain by checking their official website footer/contact page — do not rely on links from the recruiter's message.`,
      evidence: 'supplied',
    });
  } else {
    checklist.push({
      item: 'Recruiter email domain consistency',
      status: 'Not independently verified',
      notes: 'No email domain supplied. No domain lookup was performed — this system does not fetch external data.',
      evidence: 'unverified',
    });
  }

  // 4. Job listing URL
  checklist.push({
    item: 'Job listing exists on the official careers page',
    status: jobListingUrl && officialCareersUrl ? 'Needs checking' : jobListingUrl || officialCareersUrl ? 'Needs checking' : 'Not independently verified',
    notes:
      jobListingUrl && officialCareersUrl
        ? 'Compare the listing URL you were sent with the official careers page URL. Both were supplied by you — cross-check them yourself: does the job actually appear on the official site? No URL was fetched by this system.'
        : jobListingUrl
        ? 'A listing URL was supplied but no official careers URL to compare against. Find the company\'s official site independently (search the web — do not use links from the recruiter message) and confirm the job exists there.'
        : officialCareersUrl
        ? 'An official careers URL was supplied. Check whether this exact job appears on it.'
        : 'No URLs supplied. This system does not fetch or verify URLs.',
    evidence: 'unverified',
  });

  // 5. Platform verification badge
  checklist.push({
    item: 'Platform verification badge on recruiter/company profile',
    status: 'Needs checking',
    notes: 'Check for a verification badge on the platform profile yourself. Badges are helpful signals but can be spoofed by lookalike profiles — check the badge links to the right company. This system has NOT checked any badge.',
    evidence: 'unverified',
  });

  // 6. Payment/sensitive info warnings — always active
  checklist.push({
    item: 'No requests for payment, fees, OTPs, or sensitive information',
    status: 'Warning detected',
    notes: 'ALWAYS applicable guardrail: A legitimate employer will NEVER ask you for money at any hiring stage (application fees, training fees, equipment deposits) and will NEVER need your OTP, passwords, bank card PIN, or full ID scans before an offer is signed. Treat ANY such request as a serious red flag and stop contact.',
    evidence: 'unverified',
  });

  // Domain consistency guidance
  const candidateDomains = guessCompanyDomain(companyName);

  res.json({
    companyName,
    checklist,
    domainGuidance: {
      suppliedDomain: recruiterEmailDomain || null,
      candidateOfficialDomains: candidateDomains,
      note:
        'Candidate domains above are guesses generated from the company name to help YOUR manual check. They are not verified records and may be wrong or owned by unrelated parties.',
      rule:
        'A matching email domain is a useful signal but not conclusive proof. A freemail address alone does not prove fraud. When in doubt, contact the company through the contact details on their official website.',
    },
    guidance: {
      domainConsistency:
        'Check the recruiter email domain against the company\'s official domain. Verify exactly how it is spelled — scammers register lookalike domains.',
      officialCareersPage:
        'Open the company\'s official careers page by typing the company\'s web address yourself or finding it via web search. Do not click links from the recruiter message to reach the official site.',
      verificationBadges:
        'Look for the platform\'s verification badge on the company and recruiter profiles. Confirm the badge links to the genuine company page.',
      warnings: [
        'Never pay any recruitment, training, or equipment fee — real employers do not charge candidates.',
        'Never share OTPs, passwords, bank card details, or PINs with a recruiter.',
        'Do not send scans of ID documents before a signed offer.',
        'Be cautious of offers that skip interviews or pressure you to accept immediately.',
        'If the recruiter contacts you from a personal/freemail account, ask for a company email and verify independently.',
      ],
    },
    liveVerification: {
      performed: false,
      note: 'Live company-registry or URL reputation checks are NOT available in this prototype. Nothing here was verified against external data.',
    },
    disclaimer:
      'Guidance only. Items marked "Not independently verified" were not checked against any external source. Never rely on any single signal — combine your own checks. Do not submit applications or personal documents based on unverified information.',
  });
});

export default router;
