import { apiClient as api } from './client';
import type { User, Grant, GrantApplication, ResearchProject, Expense, FundInstallment, ProjectMember } from '../types';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  setupStatus: () => api.get('/auth/setup/status'),
  setup: (data: any) => api.post('/auth/setup', data),
};

// ── Grants ────────────────────────────────────────────────────────────────────
export const grantsApi = {
  list: (params?: any) => api.get('/grants', { params }),
  listPublic: (params?: any) => api.get('/grants/public', { params }),
  get: (id: string) => api.get(`/grants/${id}`),
  watchlist: () => api.get('/grants/me/watchlist'),
  toggleWatchlist: (id: string) => api.post(`/grants/${id}/watchlist`),
  stats: () => api.get('/grants/stats/summary'),
  adminQueue: (params?: any) => api.get('/grants/admin/queue', { params }),
  adminCreate: (data: any) => api.post('/grants/admin/create', data),
  adminAction: (id: string, action: string, edits?: any, note?: string) =>
    api.post(`/grants/admin/${id}/action`, { action, edits, admin_note: note }),
};

// ── Pipeline ───────────────────────────────────────────────────────────────────
export const pipelineApi = {
  upload: (formData: FormData) => api.post('/pipeline/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getJob: (id: string) => api.get(`/pipeline/jobs/${id}`),
  listJobs: () => api.get('/pipeline/jobs'),
  submit: (data: any) => api.post('/pipeline/submit', data),
  listSubmissions: () => api.get('/pipeline/submissions'),
  approveSubmission: (id: string) => api.post(`/pipeline/submissions/${id}/approve`),
  rejectSubmission: (id: string) => api.post(`/pipeline/submissions/${id}/reject`),
};

// ── Applications ───────────────────────────────────────────────────────────────
export const applicationsApi = {
  create: (data: any) => api.post('/applications', data),
  mine: () => api.get('/applications/mine'),
  get: (id: string) => api.get(`/applications/${id}`),
  update: (id: string, data: any) => api.patch(`/applications/${id}`, data),
  submit: (id: string) => api.post(`/applications/${id}/submit`),
  uploadProposal: (id: string, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post(`/applications/${id}/upload-proposal`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadCV: (id: string, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post(`/applications/${id}/upload-cv`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  forGrant: (grantId: string) => api.get(`/applications/for-grant/${grantId}`),
  decide: (id: string, action: string, awarded_amount?: number, reviewer_note?: string) =>
    api.post(`/applications/${id}/decision?action=${action}`, null, { params: { action, awarded_amount, reviewer_note } }),
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectsApi = {
  mine: () => api.get('/applications/projects/mine'),
  get: (id: string) => api.get(`/applications/projects/${id}`),
  // Expenses
  expenses: (projectId: string) => api.get(`/applications/projects/${projectId}/expenses`),
  addExpense: (projectId: string, data: any) => api.post(`/applications/projects/${projectId}/expenses`, data),
  approveExpense: (projectId: string, expenseId: string) => api.post(`/applications/projects/${projectId}/expenses/${expenseId}/approve`),
  rejectExpense: (projectId: string, expenseId: string, reason?: string) =>
    api.post(`/applications/projects/${projectId}/expenses/${expenseId}/reject`, null, { params: { reason } }),
  uploadReceipt: (projectId: string, expenseId: string, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post(`/applications/projects/${projectId}/expenses/${expenseId}/upload-receipt`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  // Installments
  installments: (projectId: string) => api.get(`/applications/projects/${projectId}/installments`),
  addInstallment: (projectId: string, data: any) => api.post(`/applications/projects/${projectId}/installments`, data),
  // Members
  members: (projectId: string) => api.get(`/applications/projects/${projectId}/members`),
  addMember: (projectId: string, data: any) => api.post(`/applications/projects/${projectId}/members`, data),
};

// ── Org ───────────────────────────────────────────────────────────────────────
export const orgApi = {
  publishGrant: (data: any) => api.post('/org/grants', data),
  myGrants: () => api.get('/org/grants'),
  updateGrant: (id: string, data: any) => api.patch(`/org/grants/${id}`, data),
};

// ── God Admin ─────────────────────────────────────────────────────────────────
export const godAdminApi = {
  stats: () => api.get('/god-admin/stats'),
  users: (params?: any) => api.get('/god-admin/users', { params }),
  pendingOrgs: () => api.get('/god-admin/orgs/pending'),
  verifyOrg: (id: string) => api.post(`/god-admin/users/${id}/verify-org`),
  rejectOrg: (id: string) => api.post(`/god-admin/users/${id}/reject-org`),
  setRole: (id: string, role: string) => api.post(`/god-admin/users/${id}/set-role?role=${role}`),
  suspend: (id: string) => api.post(`/god-admin/users/${id}/suspend`),
  reactivate: (id: string) => api.post(`/god-admin/users/${id}/reactivate`),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  me: () => api.get('/users/me'),
  update: (data: any) => api.patch('/users/me', data),
  changePassword: (current: string, next: string) =>
    api.post('/users/me/change-password', { current_password: current, new_password: next }),
};
