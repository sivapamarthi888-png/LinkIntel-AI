import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import Dashboard from '../pages/Dashboard'
import api from '../services/api'

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

const mockedApi = api as unknown as { get: ReturnType<typeof vi.fn> }

const dashboardData = {
  totalApplications: 7,
  interviewsScheduled: 1,
  offersReceived: 1,
  activeApplications: 5,
  upcomingFollowUpCount: 3,
  avgSkillMatch: 62,
  statusCounts: { Interested: 1, Applied: 1, Assessment: 1, Interview: 1, Offer: 1, Rejected: 1, Withdrawn: 1 },
  recentJobAnalyses: [
    { id: 'a1', createdAt: '2026-10-24T08:00:00Z', riskCategory: 'High', riskScore: 85, jobTitle: 'Data Entry', analysisType: 'Rule-Based Demo Analysis' },
  ],
  recentSkillMatches: [{ id: 's1', createdAt: '2026-10-24T07:00:00Z', matchPercentage: 62, targetJobTitle: 'Frontend Developer' }],
  roadmapProgress: [{ id: 'r1', targetCareer: 'Frontend Developer', updatedAt: '2026-10-24', tracked: 4, completed: 2, completionPercent: 50 }],
  upcomingInterviews: [],
  upcomingFollowUps: [],
  overdueFollowUps: [],
  recentActivity: [{ type: 'job_analysis', id: 'a1', timestamp: '2026-10-24T08:00:00Z', summary: 'Analyzed "Data Entry" — High risk' }],
  recentApplications: [],
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows real stats from the API', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: dashboardData })
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.getByText('7')).toBeInTheDocument())
    expect(screen.getByText('62%')).toBeInTheDocument()
    // Chart panel renders with the actual data
    expect(screen.getByText(/Application status breakdown/i)).toBeInTheDocument()
  })

  it('shows an error state with retry when the API fails', async () => {
    mockedApi.get.mockRejectedValueOnce({ response: { status: 503, data: { error: 'Service unavailable' } } })
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.getByText(/Could not load dashboard/i)).toBeInTheDocument())
    const retry = screen.getByRole('button', { name: /retry/i })
    expect(retry).toBeInTheDocument()
    // click retry triggers another fetch
    fireEvent.click(retry)
  })

  it('renders the empty-state hint when no applications tracked', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { ...dashboardData, totalApplications: 0, statusCounts: {}, avgSkillMatch: null },
    })
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.getByText(/No applications tracked yet/i)).toBeInTheDocument())
  })
})
