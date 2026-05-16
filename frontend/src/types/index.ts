export type UserRole = 'researcher' | 'org' | 'moderator' | 'god_admin';
export type AccountStatus = 'pending' | 'active' | 'suspended';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  account_status: AccountStatus;
  institution?: string;
  department?: string;
  designation?: string;
  academic_degree?: string;
  orcid_id?: string;
  phone?: string;
  research_interests: string[];
  publication_count?: number;
  preferred_language: string;
  email_alerts_enabled: boolean;
  is_admin: boolean;
  org_name?: string;
  org_type?: string;
  org_website?: string;
  org_verified?: boolean;
  created_at?: string;
}

export interface Grant {
  id: string;
  title_en: string;
  title_bn?: string;
  issuing_agency: string;
  agency_type?: string;
  deadline?: string;
  published_at?: string;
  funding_min?: number;
  funding_max?: number;
  currency: string;
  eligibility_types: string[];
  research_areas: string[];
  description_en?: string;
  description_bn?: string;
  source_url?: string;
  status: string;
  ai_confidence_score?: number;
  requires_proposal_pdf?: boolean;
  requires_cv?: boolean;
  requires_budget_breakdown?: boolean;
  application_instructions?: string;
  max_budget_requested?: number;
  is_saved?: boolean;
}

export interface GrantApplication {
  id: string;
  grant_id: string;
  applicant_id: string;
  status: 'draft' | 'submitted' | 'under_review' | 'awarded' | 'rejected' | 'withdrawn';
  project_title: string;
  abstract: string;
  objectives?: string;
  methodology?: string;
  expected_outcomes?: string;
  research_areas: string[];
  co_investigators?: any[];
  project_start_date?: string;
  project_end_date?: string;
  budget_total_requested?: number;
  budget_breakdown?: any;
  proposal_pdf_path?: string;
  cv_pdf_path?: string;
  reviewer_note?: string;
  awarded_amount?: number;
  created_at?: string;
  submitted_at?: string;
}

export interface ResearchProject {
  id: string;
  grant_id: string;
  pi_id: string;
  application_id?: string;
  title: string;
  description?: string;
  total_budget: number;
  currency: string;
  budget_breakdown?: any;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'completed' | 'suspended';
  reports?: any[];
  created_at?: string;
}

export interface Expense {
  id: string;
  project_id: string;
  member_id?: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  receipt_path?: string;
  vendor?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  note?: string;
  created_at?: string;
}

export interface FundInstallment {
  id: string;
  project_id: string;
  installment_number: string;
  amount: number;
  received_date?: string;
  bank_ref?: string;
  note?: string;
  created_at?: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id?: string;
  name: string;
  email?: string;
  role?: string;
}

export const RESEARCH_AREAS = [
  { slug: 'biotechnology', label: 'Biotechnology' },
  { slug: 'life_sciences', label: 'Life Sciences' },
  { slug: 'agriculture', label: 'Agriculture' },
  { slug: 'crop_science', label: 'Crop Science' },
  { slug: 'food_technology', label: 'Food Technology' },
  { slug: 'fisheries', label: 'Fisheries' },
  { slug: 'engineering', label: 'Engineering' },
  { slug: 'ict', label: 'ICT' },
  { slug: 'ai_ml', label: 'AI / Machine Learning' },
  { slug: 'data_science', label: 'Data Science' },
  { slug: 'climate_environment', label: 'Climate & Environment' },
  { slug: 'water_resources', label: 'Water Resources' },
  { slug: 'renewable_energy', label: 'Renewable Energy' },
  { slug: 'social_sciences', label: 'Social Sciences' },
  { slug: 'economics', label: 'Economics' },
  { slug: 'education', label: 'Education' },
  { slug: 'public_health', label: 'Public Health' },
  { slug: 'medicine', label: 'Medicine' },
  { slug: 'pharmacy', label: 'Pharmacy' },
  { slug: 'chemistry', label: 'Chemistry' },
  { slug: 'physics', label: 'Physics' },
  { slug: 'mathematics', label: 'Mathematics' },
  { slug: 'humanities', label: 'Humanities' },
];

export const EXPENSE_CATEGORIES = [
  { slug: 'personnel', label: 'Personnel / Salary' },
  { slug: 'equipment', label: 'Equipment' },
  { slug: 'travel', label: 'Travel' },
  { slug: 'consumables', label: 'Consumables / Materials' },
  { slug: 'overhead', label: 'Overhead' },
  { slug: 'publication', label: 'Publication / Printing' },
  { slug: 'other', label: 'Other' },
];
