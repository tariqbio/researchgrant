// ── Core domain types ────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  full_name: string
  institution: string | null
  designation: string | null
  research_interests: string[]
  preferred_language: 'en' | 'bn'
  email_alerts_enabled: boolean
  is_admin: boolean
  created_at: string
}

export interface Grant {
  id: string
  title_en: string
  title_bn: string | null
  issuing_agency: string
  agency_type: string | null
  deadline: string | null
  published_at: string | null
  funding_min: number | null
  funding_max: number | null
  currency: string
  eligibility_types: string[]
  research_areas: string[]
  description_en: string | null
  description_bn: string | null
  source_url: string | null
  status: GrantStatus
  ai_confidence_score: number | null
  ai_extracted_fields: Record<string, number> | null
  created_at: string | null
  days_until_deadline: number | null
  is_watchlisted: boolean | null
  match_reasons: string[] | null
}

export type GrantStatus =
  | 'pending_review'
  | 'approved'
  | 'published'
  | 'expired'
  | 'rejected'

export interface IngestionJob {
  id: string
  source_id: string | null
  raw_url: string | null
  raw_file_path: string | null
  ocr_engine: string | null
  ocr_confidence: number | null
  ai_model: string | null
  ai_extracted_json: Record<string, unknown> | null
  job_status: JobStatus
  failure_reason: string | null
  created_at: string
}

export type JobStatus =
  | 'pending_ocr'
  | 'ocr_running'
  | 'ocr_failed'
  | 'ai_running'
  | 'ai_failed'
  | 'pending_review'
  | 'approved'
  | 'rejected'

export interface Source {
  id: string
  name: string
  url: string | null
  source_type: string
  is_active: boolean
  last_checked_at: string | null
}

export interface CommunitySubmission {
  id: string
  source_url: string
  notes: string | null
  status: string
  created_at: string
}

// ── API response shapes ───────────────────────────────────────────────────────

export interface GrantListResponse {
  items: Grant[]
  total: number
  page: number
  page_size: number
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

// ── Search params ─────────────────────────────────────────────────────────────

export interface GrantSearchParams {
  query?: string
  research_areas?: string
  eligibility_types?: string
  deadline_within_days?: number
  funding_min?: number
  funding_max?: number
  agency?: string
  sort_by?: 'deadline' | 'created_at' | 'funding_max'
  page?: number
  page_size?: number
}

// ── Taxonomy ──────────────────────────────────────────────────────────────────

export const RESEARCH_AREAS: Record<string, string> = {
  biotechnology: 'Biotechnology',
  life_sciences: 'Life Sciences',
  agriculture: 'Agriculture',
  crop_science: 'Crop Science',
  soil_science: 'Soil Science',
  food_technology: 'Food Technology',
  fisheries: 'Fisheries',
  veterinary: 'Veterinary Science',
  engineering: 'Engineering',
  civil_engineering: 'Civil Engineering',
  mechanical_engineering: 'Mechanical Engineering',
  electrical_engineering: 'Electrical Engineering',
  chemical_engineering: 'Chemical Engineering',
  ict: 'ICT',
  software_engineering: 'Software Engineering',
  data_science: 'Data Science',
  ai_ml: 'AI & Machine Learning',
  climate_environment: 'Climate & Environment',
  water_resources: 'Water Resources',
  renewable_energy: 'Renewable Energy',
  social_sciences: 'Social Sciences',
  economics: 'Economics',
  education: 'Education',
  public_health: 'Public Health',
  medicine: 'Medicine',
  pharmacy: 'Pharmacy',
  chemistry: 'Chemistry',
  physics: 'Physics',
  mathematics: 'Mathematics',
  urban_planning: 'Urban Planning',
  architecture: 'Architecture',
  law: 'Law',
  humanities: 'Humanities',
}

export const ELIGIBILITY_TYPES: Record<string, string> = {
  faculty: 'Faculty',
  phd_student: 'PhD Student',
  masters_student: "Master's Student",
  undergraduate_student: 'Undergraduate Student',
  postdoc: 'Postdoc',
  scientist: 'Scientist',
  researcher: 'Researcher',
  government_employee: 'Government Employee',
  ngo_worker: 'NGO Worker',
  private_sector: 'Private Sector',
}

// ── Role system (v2) ──────────────────────────────────────────────────────────
export type UserRole = 'researcher' | 'org' | 'moderator' | 'god_admin'

// Extended User with role fields
export interface UserV2 extends User {
  role: UserRole
  account_status: 'pending' | 'active' | 'suspended'
  department?: string | null
  academic_degree?: string | null
  orcid_id?: string | null
  phone?: string | null
  publication_count?: number
  org_name?: string | null
  org_type?: string | null
  org_website?: string | null
  org_verified?: boolean
}

// ── Grant Application ─────────────────────────────────────────────────────────
export interface GrantApplication {
  id: string
  grant_id: string
  applicant_id: string
  status: 'draft' | 'submitted' | 'under_review' | 'awarded' | 'rejected' | 'withdrawn'
  project_title: string
  abstract: string
  objectives?: string | null
  methodology?: string | null
  expected_outcomes?: string | null
  research_areas: string[]
  co_investigators?: any[]
  project_start_date?: string | null
  project_end_date?: string | null
  budget_total_requested?: number | null
  budget_breakdown?: any
  proposal_pdf_path?: string | null
  cv_pdf_path?: string | null
  reviewer_note?: string | null
  awarded_amount?: number | null
  created_at?: string | null
  submitted_at?: string | null
}

// ── Research Project ──────────────────────────────────────────────────────────
export interface ResearchProject {
  id: string
  grant_id: string
  pi_id: string
  application_id?: string | null
  title: string
  description?: string | null
  total_budget: number
  currency: string
  budget_breakdown?: any
  start_date?: string | null
  end_date?: string | null
  status: 'active' | 'completed' | 'suspended'
  reports?: any[]
  created_at?: string | null
}

// ── Expense ───────────────────────────────────────────────────────────────────
export interface Expense {
  id: string
  project_id: string
  member_id?: string | null
  category: string
  description: string
  amount: number
  currency: string
  expense_date: string
  receipt_path?: string | null
  vendor?: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string | null
  note?: string | null
  created_at?: string | null
}

export interface FundInstallment {
  id: string
  project_id: string
  installment_number: string
  amount: number
  received_date?: string | null
  bank_ref?: string | null
  note?: string | null
  created_at?: string | null
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id?: string | null
  name: string
  email?: string | null
  role?: string | null
}

export const EXPENSE_CATEGORIES: Record<string, string> = {
  personnel: 'Personnel / Salary',
  equipment: 'Equipment',
  travel: 'Travel',
  consumables: 'Consumables / Materials',
  overhead: 'Overhead',
  publication: 'Publication / Printing',
  other: 'Other',
}
