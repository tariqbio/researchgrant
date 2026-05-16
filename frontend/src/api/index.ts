import { apiClient } from './client'
import type {
  Grant, GrantListResponse, GrantSearchParams,
  TokenResponse, User, IngestionJob, Source, CommunitySubmission,
} from '../types'

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { email: string; password: string; full_name: string; institution?: string; designation?: string }) =>
    apiClient.post<TokenResponse>('/auth/register', data).then(r => r.data),

  login: (email: string, password: string) =>
    apiClient.post<TokenResponse>('/auth/login', { email, password }).then(r => r.data),
}

// ── Users ─────────────────────────────────────────────────────────────────────

export const userApi = {
  me: () => apiClient.get<User>('/users/me').then(r => r.data),

  update: (data: Partial<User>) =>
    apiClient.patch<User>('/users/me', data).then(r => r.data),
}

// ── Grants ────────────────────────────────────────────────────────────────────

export const grantApi = {
  list: (params: GrantSearchParams) =>
    apiClient.get<GrantListResponse>('/grants', { params }).then(r => r.data),

  listPublic: (params: GrantSearchParams) =>
    apiClient.get<GrantListResponse>('/grants/public', { params }).then(r => r.data),

  get: (id: string) =>
    apiClient.get<Grant>(`/grants/${id}`).then(r => r.data),

  toggleWatchlist: (id: string) =>
    apiClient.post<{ saved: boolean }>(`/grants/${id}/watchlist`).then(r => r.data),

  myWatchlist: (page = 1) =>
    apiClient.get<GrantListResponse>('/grants/me/watchlist', { params: { page } }).then(r => r.data),

  // Admin
  reviewQueue: (page = 1) =>
    apiClient.get<GrantListResponse>('/grants/admin/queue', { params: { page } }).then(r => r.data),

  approve: (id: string, edits?: Partial<Grant>, adminNote?: string) =>
    apiClient.post(`/grants/admin/${id}/action`, { action: 'approve', edits, admin_note: adminNote }).then(r => r.data),

  reject: (id: string, adminNote?: string) =>
    apiClient.post(`/grants/admin/${id}/action`, { action: 'reject', admin_note: adminNote }).then(r => r.data),
}

// ── Pipeline ──────────────────────────────────────────────────────────────────

export const pipelineApi = {
  uploadPdf: (file: File, sourceId?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (sourceId) form.append('source_id', sourceId)
    return apiClient.post<IngestionJob>('/pipeline/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  submitUrl: (source_url: string, notes?: string) =>
    apiClient.post<CommunitySubmission>('/pipeline/submit', { source_url, notes }).then(r => r.data),

  submissions: () =>
    apiClient.get<CommunitySubmission[]>('/pipeline/submissions').then(r => r.data),

  sources: () =>
    apiClient.get<Source[]>('/pipeline/sources').then(r => r.data),

  createSource: (data: { name: string; url?: string; source_type: string }) =>
    apiClient.post<Source>('/pipeline/sources', data).then(r => r.data),
}

// ── Applications (v2) ─────────────────────────────────────────────────────────
export const applicationsApi = {
  create: (data: any) => apiClient.post('/applications', data).then(r => r.data),
  mine: () => apiClient.get('/applications/mine').then(r => r.data),
  get: (id: string) => apiClient.get(`/applications/${id}`).then(r => r.data),
  update: (id: string, data: any) => apiClient.patch(`/applications/${id}`, data).then(r => r.data),
  submit: (id: string) => apiClient.post(`/applications/${id}/submit`).then(r => r.data),
  uploadProposal: (id: string, file: File) => {
    const fd = new FormData(); fd.append('file', file)
    return apiClient.post(`/applications/${id}/upload-proposal`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },
  uploadCV: (id: string, file: File) => {
    const fd = new FormData(); fd.append('file', file)
    return apiClient.post(`/applications/${id}/upload-cv`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },
  forGrant: (grantId: string) => apiClient.get(`/applications/for-grant/${grantId}`).then(r => r.data),
  decide: (id: string, action: string, awarded_amount?: number, reviewer_note?: string) =>
    apiClient.post(`/applications/${id}/decision`, null, { params: { action, awarded_amount, reviewer_note } }).then(r => r.data),
}

// ── Projects / Expenses (v2) ──────────────────────────────────────────────────
export const projectsApi = {
  mine: () => apiClient.get('/applications/projects/mine').then(r => r.data),
  get: (id: string) => apiClient.get(`/applications/projects/${id}`).then(r => r.data),
  expenses: (projectId: string) => apiClient.get(`/applications/projects/${projectId}/expenses`).then(r => r.data),
  addExpense: (projectId: string, data: any) => apiClient.post(`/applications/projects/${projectId}/expenses`, data).then(r => r.data),
  approveExpense: (projectId: string, expenseId: string) => apiClient.post(`/applications/projects/${projectId}/expenses/${expenseId}/approve`).then(r => r.data),
  rejectExpense: (projectId: string, expenseId: string, reason?: string) =>
    apiClient.post(`/applications/projects/${projectId}/expenses/${expenseId}/reject`, null, { params: { reason } }).then(r => r.data),
  installments: (projectId: string) => apiClient.get(`/applications/projects/${projectId}/installments`).then(r => r.data),
  addInstallment: (projectId: string, data: any) => apiClient.post(`/applications/projects/${projectId}/installments`, data).then(r => r.data),
  members: (projectId: string) => apiClient.get(`/applications/projects/${projectId}/members`).then(r => r.data),
  addMember: (projectId: string, data: any) => apiClient.post(`/applications/projects/${projectId}/members`, data).then(r => r.data),
}

// ── Org (v2) ──────────────────────────────────────────────────────────────────
export const orgApi = {
  publishGrant: (data: any) => apiClient.post('/org/grants', data).then(r => r.data),
  myGrants: () => apiClient.get('/org/grants').then(r => r.data),
  updateGrant: (id: string, data: any) => apiClient.patch(`/org/grants/${id}`, data).then(r => r.data),
}

// ── God Admin (v2) ────────────────────────────────────────────────────────────
export const godAdminApi = {
  stats: () => apiClient.get('/god-admin/stats').then(r => r.data),
  users: (params?: any) => apiClient.get('/god-admin/users', { params }).then(r => r.data),
  pendingOrgs: () => apiClient.get('/god-admin/orgs/pending').then(r => r.data),
  verifyOrg: (id: string) => apiClient.post(`/god-admin/users/${id}/verify-org`).then(r => r.data),
  rejectOrg: (id: string) => apiClient.post(`/god-admin/users/${id}/reject-org`).then(r => r.data),
  setRole: (id: string, role: string) => apiClient.post(`/god-admin/users/${id}/set-role`, null, { params: { role } }).then(r => r.data),
  suspend: (id: string) => apiClient.post(`/god-admin/users/${id}/suspend`).then(r => r.data),
  reactivate: (id: string) => apiClient.post(`/god-admin/users/${id}/reactivate`).then(r => r.data),
}

// ── Auth v2 extras ─────────────────────────────────────────────────────────────
export const authApiV2 = {
  setupStatus: () => apiClient.get('/auth/setup/status').then(r => r.data),
  setup: (data: any) => apiClient.post('/auth/setup', data).then(r => r.data),
  registerV2: (data: any) => apiClient.post('/auth/register', data).then(r => r.data),
}
