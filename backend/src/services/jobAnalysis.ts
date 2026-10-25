import type { CompanyCheckResult } from './companyCheck.js';

// ---------- gibberish / placeholder detection ----------
// Real English almost never produces tokens without vowels or with very long
// consonant runs. Nonsense like "Tctctc", "Cvt", "tcrctctct" does.

const VOWELS = /[aeiouy]/;
const LONG_CONSONANT_RUN = /[bcdfghjklmnpqrstvxzw]{4,}/;

function isNonword(token: string): boolean {
  const w = token.replace(/[^a-z]/gi, '');
  if (w.length < 3) return false; // short tokens (css, git, ai…) are exempt
  if (!VOWELS.test(w)) return true; // no vowels: "cvt", "chr", "tctc"
  return LONG_CONSONANT_RUN.test(w); // e.g. "tsktsktsk"-style runs
}

/**
 * Detects meaningless/placeholder text: >= 2 non-word tokens AND >= 30% of
 * evaluable tokens are non-words. Acronyms (CSS, HTML) survive because they
 * are a small fraction of real text.
 */
export function looksLikeNoise(text: string): boolean {
  const tokens = (text.match(/[A-Za-z][A-Za-z'-]{1,}/g) || []).filter((t) => t.length >= 3);
  if (!tokens.length) return true; // nothing evaluable at all
  const nonwords = tokens.filter(isNonword).length;
  return nonwords >= 2 && nonwords / tokens.length >= 0.3;
}

function wordCount(text: string): number {
  return (text.trim().match(/\S+/g) || []).length;
}

// ---------- main rule-based analyzer ----------

export function analyzeJobRuleBased(
  jobData: any,
  companyCheck?: Pick<CompanyCheckResult, 'webPresence' | 'foundDomain' | 'emailDomainIsFreemail'> | null
) {
  const text = `${jobData.jobTitle || ''} ${jobData.companyName || ''} ${jobData.jobDescription || ''} ${jobData.recruiterEmailOrUrl || ''}`.toLowerCase();

  const warningSigns: { sign: string; excerpt: string; why: string }[] = [];
  let riskScore = 0;

  // Meaningless / placeholder content must never pass as a clean "Low Risk"
  if (looksLikeNoise(text)) {
    warningSigns.push({
      sign: 'Meaningless or placeholder text detected',
      excerpt: 'Supplied details contain mostly non-words (e.g. random letters) and cannot be evaluated as a real job posting',
      why: 'Test entries, gibberish, or templated spam provide no trustworthy signal. Never respond to or share information with such sources — verify who actually sent it.',
    });
    riskScore += 25;
  } else if (wordCount(jobData.jobDescription || '') + wordCount(jobData.jobTitle || '') < 8) {
    warningSigns.push({
      sign: 'Very little information provided',
      excerpt: 'Job details are too brief to evaluate properly',
      why: 'Legitimate postings normally describe the role, requirements and location. Sparse details force you to rely on the recruiter — ask for a full, official job description.',
    });
    riskScore += 10;
  }

  if (text.includes('upfront') && (text.includes('fee') || text.includes('payment') || text.includes('cost'))) {
    warningSigns.push({
      sign: 'Requests for upfront payment/fees',
      excerpt: 'Contains mentions of upfront fees or payments',
      why: 'Legitimate employers do not charge recruitment fees to job seekers.',
    });
    riskScore += 30;
  }

  if (text.includes('otp') || text.includes('password') || text.includes('bank details') || text.includes('credit card')) {
    warningSigns.push({
      sign: 'Requests sensitive personal/financial information',
      excerpt: 'Asks for OTP, passwords, or financial details',
      why: 'Never share sensitive credentials or financial information.',
    });
    riskScore += 25;
  }

  if (text.includes('wire transfer') || text.includes('western union') || text.includes('crypto') || text.includes('bitcoin')) {
    warningSigns.push({
      sign: 'Suspicious payment instructions',
      excerpt: 'Mentions unusual payment methods',
      why: 'Scammers often request untraceable payment methods.',
    });
    riskScore += 25;
  }

  if (text.includes('urgent') || text.includes('immediate') || text.includes('act now')) {
    warningSigns.push({
      sign: 'High pressure tactics',
      excerpt: 'Uses urgency to rush decisions',
      why: 'Legitimate recruiters give reasonable time to consider offers.',
    });
    riskScore += 10;
  }

  if (text.includes('guarantee') && text.includes('job')) {
    warningSigns.push({
      sign: 'Unrealistic job guarantees',
      excerpt: 'Guarantees employment',
      why: 'No legitimate employer can guarantee employment without proper process.',
    });
    riskScore += 15;
  }

  if (text.match(/gmail\.com|yahoo\.com|hotmail\.com|outlook\.com/) && !text.includes('company.com')) {
    warningSigns.push({
      sign: 'Personal email domain used by recruiter',
      excerpt: 'Uses free email service',
      why: 'Professional recruiters typically use company domains, though not always conclusive.',
    });
    riskScore += 5;
  }

  // Live company presence check (only attached when probes ran)
  if (companyCheck && companyCheck.webPresence === 'not-found') {
    warningSigns.push({
      sign: 'No matching company website found online',
      excerpt: 'Live DNS check: none of the likely domains for this company name resolve',
      why: 'An established company normally has some matching web presence. Absence is a caution signal — not proof of fraud by itself, but combined with other signs it points strongly toward a fake company.',
    });
    riskScore += 20; // pushes the overall result to at least Medium — never a clean "Low Risk"
    if (companyCheck.emailDomainIsFreemail) riskScore += 10;
  }

  let riskCategory = 'Low';
  if (riskScore >= 40) riskCategory = 'High';
  else if (riskScore >= 20) riskCategory = 'Medium';

  const positiveIndicators: string[] = [];
  if (text.includes('company website') || text.includes('careers page')) {
    positiveIndicators.push('Mentions official company channels');
  }
  if (companyCheck && companyCheck.foundDomain) {
    positiveIndicators.push(
      `A live website responded at ${companyCheck.foundDomain} during this analysis — confirm it actually belongs to this company`
    );
  }

  return {
    riskCategory,
    riskScore: Math.min(riskScore, 100),
    shortExplanation:
      riskScore === 0
        ? 'No obvious red flags detected, but remain cautious.'
        : `Analysis found ${warningSigns.length} potential warning sign(s). Risk score is an estimate, not proof of fraud.`,
    detectedWarningSigns: warningSigns,
    supportingExcerpts: warningSigns.map((w) => w.excerpt),
    positiveIndicators,
    recommendedNextActions: [
      'Verify the job on the official company careers page',
      'Research the recruiter and company independently',
      'Never send money to a recruiter — real employers do not charge fees',
      'Never share OTPs, passwords or sensitive financial information',
      'Be cautious of pressure to accept quickly or unusual contact channels',
    ],
    questionsToAskRecruiter: [
      'Can you send the official job description link from your company careers page?',
      'What is the official company email domain you use for hiring?',
      'Will we communicate via the official platform you claim to represent?',
      'Could we schedule an interview through your official company channels?',
    ],
    uncertaintyDisclaimer:
      'This risk score is a heuristic estimate, not a verified probability of fraud. A low-risk result is not proof of legitimacy — always verify independently.',
    analysisType: 'Rule-Based Demo Analysis',
  };
}
