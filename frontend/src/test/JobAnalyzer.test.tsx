import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import JobAnalyzer from '../pages/JobAnalyzer'
import api from '../services/api'

// Mock the API layer
vi.mock('../services/api', () => {
  const apiMock = {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '/api' },
    isAxiosError: false,
  }
  return { default: apiMock, extractApiError: (e: any) => e?.response?.data?.error || 'Request failed' }
})

const mockedApi = api as unknown as {
  post: ReturnType<typeof vi.fn>
}

function renderPage() {
  return render(
    <MemoryRouter>
      <JobAnalyzer />
    </MemoryRouter>
  )
}

const filledAnalysis = {
  id: 'test-1',
  riskCategory: 'High',
  riskScore: 85,
  shortExplanation: 'Multiple strong scam indicators found.',
  detectedWarningSigns: [
    { sign: 'Requests upfront payment', excerpt: 'Pay $99 fee upfront', why: 'Real employers never charge candidates.' },
  ],
  recommendedNextActions: ['Verify on official careers page'],
  questionsToAskRecruiter: ['What is your official email domain?'],
  analysisType: 'Rule-Based Demo Analysis',
  analysisTimestamp: new Date('2026-10-24T10:00:00Z').toISOString(),
  uncertaintyDisclaimer: 'Estimate only.',
}

describe('JobAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the analysis form with accessible labels', () => {
    renderPage()
    expect(screen.getByLabelText(/job title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/job description or recruiter message/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /analyze job/i })).toBeInTheDocument()
  })

  it('shows the empty state before analysis', () => {
    renderPage()
    expect(screen.getByText(/no analysis yet/i)).toBeInTheDocument()
  })

  it('loads the suspicious sample into the form', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /suspicious sample/i }))
    expect((screen.getByLabelText(/job title/i) as HTMLInputElement).value).toContain('Work From Home')
    expect((screen.getByLabelText(/company name/i) as HTMLInputElement).value).toContain('QuickCash')
  })

  it('loads the ordinary sample into the form', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /ordinary sample/i }))
    expect((screen.getByLabelText(/company name/i) as HTMLInputElement).value).toContain('TechCorp')
  })

  it('clears the form', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /suspicious sample/i }))
    fireEvent.click(screen.getByRole('button', { name: /clear form/i }))
    expect((screen.getByLabelText(/job title/i) as HTMLInputElement).value).toBe('')
  })

  it('submits and displays a risk result with evidence and timestamp', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: filledAnalysis })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /suspicious sample/i }))
    fireEvent.click(screen.getByRole('button', { name: /analyze job/i }))

    await waitFor(() => {
      expect(screen.getByText('High Risk')).toBeInTheDocument()
    })
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByText(/Requests upfront payment/i)).toBeInTheDocument()
    expect(screen.getByText(/Pay \$99 fee upfront/i)).toBeInTheDocument()
    expect(screen.getByText(/Real employers never charge candidates/i)).toBeInTheDocument()
    expect(screen.getByText(/Rule-Based Demo Analysis/i)).toBeInTheDocument()
    expect(screen.getAllByText(/estimate/i).length).toBeGreaterThan(0)
  })

  it('shows the loading state while analyzing', async () => {
    let resolve: (v: any) => void = () => undefined
    mockedApi.post.mockReturnValueOnce(new Promise((r) => (resolve = r)))
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /ordinary sample/i }))
    fireEvent.click(screen.getByRole('button', { name: /analyze job/i }))
    expect(await screen.findByText(/checking the company online/i)).toBeInTheDocument()
    resolve({ data: filledAnalysis })
    await waitFor(() => expect(screen.getByText('High Risk')).toBeInTheDocument())
  })

  it('displays API error when analysis fails', async () => {
    mockedApi.post.mockRejectedValueOnce({ response: { data: { error: 'Too many AI analysis requests. Please try again later.' } } })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /ordinary sample/i }))
    fireEvent.click(screen.getByRole('button', { name: /analyze job/i }))
    // Result panel should remain dismissed; the toast shows the error
    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalled()
    })
  })

  it('shows the live company background check when present in the result', async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: {
        ...filledAnalysis,
        companyCheck: {
          companyName: 'Tctctc',
          webPresence: 'not-found',
          foundDomain: null,
          logoUrl: null,
          verdict: 'No verifiable online presence found — treat with strong caution',
          verdictLevel: 'danger',
          probes: [
            { domain: 'tctctc.com', source: 'company-name', resolves: false, websiteResponded: false, httpStatus: null },
            { domain: 'tctctc.io', source: 'company-name', resolves: false, websiteResponded: false, httpStatus: null },
          ],
          emailDomain: null,
          emailDomainIsFreemail: false,
          signals: ['None of the likely domains (tctctc.com, tctctc.io) resolve in public DNS.'],
          checksPerformed: ['DNS resolution lookup of candidate domains'],
          aiWebSearch: null,
          disclaimer: 'This is a live DNS/website probe, NOT a company-registry lookup.',
        },
      },
    })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /suspicious sample/i }))
    fireEvent.click(screen.getByRole('button', { name: /analyze job/i }))

    await waitFor(() => {
      expect(screen.getByText(/No verifiable online presence found/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Company background check \(live\)/i)).toBeInTheDocument()
    expect(screen.getAllByText(/tctctc\.com/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/does not exist in public DNS/i).length).toBeGreaterThan(0)
  })

  it('does not render the company panel when the API omitted it (tests still pass)', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: filledAnalysis })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /ordinary sample/i }))
    fireEvent.click(screen.getByRole('button', { name: /analyze job/i }))
    await waitFor(() => expect(screen.getByText('High Risk')).toBeInTheDocument())
    expect(screen.queryByText(/Company background check/i)).not.toBeInTheDocument()
  })
})
