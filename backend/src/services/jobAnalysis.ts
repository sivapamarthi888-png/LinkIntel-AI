export function analyzeJobRuleBased(jobData: any) {
  const text = `${jobData.jobTitle || ''} ${jobData.companyName || ''} ${jobData.jobDescription || ''} ${jobData.recruiterEmailOrUrl || ''}`.toLowerCase();
  
  const warningSigns = [];
  let riskScore = 0;
  
  if (text.includes('upfront') && (text.includes('fee') || text.includes('payment') || text.includes('cost'))) {
    warningSigns.push({
      sign: 'Requests for upfront payment/fees',
      excerpt: 'Contains mentions of upfront fees or payments',
      why: 'Legitimate employers do not charge recruitment fees to job seekers.'
    });
    riskScore += 30;
  }
  
  if (text.includes('otp') || text.includes('password') || text.includes('bank details') || text.includes('credit card')) {
    warningSigns.push({
      sign: 'Requests sensitive personal/financial information',
      excerpt: 'Asks for OTP, passwords, or financial details',
      why: 'Never share sensitive credentials or financial information.'
    });
    riskScore += 25;
  }
  
  if (text.includes('wire transfer') || text.includes('western union') || text.includes('crypto') || text.includes('bitcoin')) {
    warningSigns.push({
      sign: 'Suspicious payment instructions',
      excerpt: 'Mentions unusual payment methods',
      why: 'Scammers often request untraceable payment methods.'
    });
    riskScore += 25;
  }
  
  if (text.includes('urgent') || text.includes('immediate') || text.includes('act now')) {
    warningSigns.push({
      sign: 'High pressure tactics',
      excerpt: 'Uses urgency to rush decisions',
      why: 'Legitimate recruiters give reasonable time to consider offers.'
    });
    riskScore += 10;
  }
  
  if (text.includes('guarantee') && text.includes('job')) {
    warningSigns.push({
      sign: 'Unrealistic job guarantees',
      excerpt: 'Guarantees employment',
      why: 'No legitimate employer can guarantee employment without proper process.'
    });
    riskScore += 15;
  }
  
  if (text.match(/gmail\.com|yahoo\.com|hotmail\.com|outlook\.com/) && !text.includes('company.com')) {
    warningSigns.push({
      sign: 'Personal email domain used by recruiter',
      excerpt: 'Uses free email service',
      why: 'Professional recruiters typically use company domains, though not always conclusive.'
    });
    riskScore += 5;
  }
  
  let riskCategory = 'Low';
  if (riskScore >= 40) riskCategory = 'High';
  else if (riskScore >= 20) riskCategory = 'Medium';
  
  const positiveIndicators = [];
  if (text.includes('company website') || text.includes('careers page')) {
    positiveIndicators.push('Mentions official company channels');
  }
  
  return {
    riskCategory,
    riskScore: Math.min(riskScore, 100),
    shortExplanation: riskScore === 0 ? 'No obvious red flags detected, but remain cautious.' :
      `Analysis found ${warningSigns.length} potential warning sign(s). Risk score is an estimate, not proof of fraud.`,
    detectedWarningSigns: warningSigns,
    supportingExcerpts: warningSigns.map(w => w.excerpt),
    positiveIndicators,
    recommendedNextActions: [
      'Verify the job on the official company careers page',
      'Research the recruiter and company independently',
      'Never send money to a recruiter — real employers do not charge fees',
      'Never share OTPs, passwords or sensitive financial information',
      'Be cautious of pressure to accept quickly or unusual contact channels'
    ],
    questionsToAskRecruiter: [
      'Can you send the official job description link from your company careers page?',
      'What is the official company email domain you use for hiring?',
      'Will we communicate via the official platform you claim to represent?',
      'Could we schedule an interview through your official company channels?'
    ],
    uncertaintyDisclaimer: 'This risk score is a heuristic estimate, not a verified probability of fraud. A low-risk result is not proof of legitimacy — always verify independently.',
    analysisType: 'Rule-Based Demo Analysis'
  };
}
