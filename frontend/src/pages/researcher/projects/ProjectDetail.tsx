import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsApi } from '../../../api';
import { EXPENSE_CATEGORIES } from '../../../types';
import type { Expense, FundInstallment, ProjectMember } from '../../../types';

type Tab = 'overview' | 'expenses' | 'installments' | 'team' | 'reports';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [installments, setInstallments] = useState<FundInstallment[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [tab, setTab] = useState<Tab>('overview');
  const [expenseForm, setExpenseForm] = useState<any>({});
  const [installForm, setInstallForm] = useState<any>({});
  const [memberForm, setMemberForm] = useState<any>({});
  const [showExpForm, setShowExpForm] = useState(false);
  const [showInstForm, setShowInstForm] = useState(false);
  const [showMemForm, setShowMemForm] = useState(false);

  const load = async () => {
    if (!id) return;
    const [p, e, i, m] = await Promise.all([
      projectsApi.get(id), projectsApi.expenses(id),
      projectsApi.installments(id), projectsApi.members(id)
    ]);
    setProject(p.data); setExpenses(e.data);
    setInstallments(i.data); setMembers(m.data);
  };
  useEffect(() => { load(); }, [id]);

  if (!project) return <div className="p-8 text-gray-400">Loading…</div>;

  const totalReceived = installments.reduce((s, i) => s + Number(i.amount), 0);
  const totalSpent = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + Number(e.amount), 0);
  const totalPending = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + Number(e.amount), 0);
  const remaining = totalReceived - totalSpent;
  const fmt = (n: number) => new Intl.NumberFormat('en-BD').format(n);

  const addExpense = async () => {
    if (!expenseForm.category || !expenseForm.description || !expenseForm.amount || !expenseForm.expense_date) return;
    await projectsApi.addExpense(id!, expenseForm);
    setExpenseForm({}); setShowExpForm(false); load();
  };
  const addInstallment = async () => {
    if (!installForm.installment_number || !installForm.amount) return;
    await projectsApi.addInstallment(id!, installForm);
    setInstallForm({}); setShowInstForm(false); load();
  };
  const addMember = async () => {
    if (!memberForm.name) return;
    await projectsApi.addMember(id!, memberForm);
    setMemberForm({}); setShowMemForm(false); load();
  };
  const approveExpense = async (eid: string) => { await projectsApi.approveExpense(id!, eid); load(); };
  const rejectExpense = async (eid: string) => { await projectsApi.rejectExpense(id!, eid); load(); };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'expenses', label: `Expenses (${expenses.length})` },
    { key: 'installments', label: `Installments (${installments.length})` },
    { key: 'team', label: `Team (${members.length})` },
    { key: 'reports', label: 'Reports' },
  ];

  const inp = (label: string, key: string, type='text', setter: any, val: any, placeholder='') => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={val[key]||''} onChange={e=>setter((f:any)=>({...f,[key]:e.target.value}))} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 mb-4 block">← Back to dashboard</Link>

        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mb-2 inline-block ${project.status==='active'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}`}>{project.status}</span>
              <h1 className="text-xl font-bold text-gray-900">{project.title}</h1>
              {project.description && <p className="text-gray-500 text-sm mt-1 max-w-2xl">{project.description}</p>}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-700">৳{fmt(Number(project.total_budget))}</p>
              <p className="text-xs text-gray-500">Total Budget</p>
            </div>
          </div>

          {/* Budget Summary */}
          <div className="grid grid-cols-4 gap-3 mt-5">
            {[
              { label: 'Total Budget', value: fmt(Number(project.total_budget)), color: 'blue' },
              { label: 'Received', value: fmt(totalReceived), color: 'green' },
              { label: 'Spent (Approved)', value: fmt(totalSpent), color: 'orange' },
              { label: 'Remaining', value: fmt(remaining), color: remaining >= 0 ? 'emerald' : 'red' },
            ].map(s => (
              <div key={s.label} className={`bg-${s.color}-50 rounded-xl p-3 border border-${s.color}-100`}>
                <p className={`text-lg font-bold text-${s.color}-700`}>৳{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Budget utilization</span>
              <span>{totalReceived > 0 ? Math.round((totalSpent / Number(project.total_budget)) * 100) : 0}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-2 bg-green-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Number(project.total_budget) > 0 ? (totalSpent / Number(project.total_budget)) * 100 : 0)}%` }}/>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border p-1 mb-6">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${tab===t.key?'bg-green-600 text-white':'text-gray-600 hover:bg-gray-100'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Expenses Tab */}
        {tab === 'expenses' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900">Expenses</h2>
              <button onClick={() => setShowExpForm(!showExpForm)} className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg">+ Add Expense</button>
            </div>
            {showExpForm && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                    <select value={expenseForm.category||''} onChange={e=>setExpenseForm((f:any)=>({...f,category:e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="">Select category</option>
                      {EXPENSE_CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                    </select>
                  </div>
                  {inp('Amount (BDT) *', 'amount', 'number', setExpenseForm, expenseForm)}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {inp('Description *', 'description', 'text', setExpenseForm, expenseForm, 'What was purchased/paid for')}
                  {inp('Date *', 'expense_date', 'date', setExpenseForm, expenseForm)}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {inp('Vendor', 'vendor', 'text', setExpenseForm, expenseForm)}
                  {inp('Note', 'note', 'text', setExpenseForm, expenseForm)}
                </div>
                <div className="flex gap-2">
                  <button onClick={addExpense} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700">Save Expense</button>
                  <button onClick={() => setShowExpForm(false)} className="text-gray-500 text-sm px-4 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
                </div>
              </div>
            )}
            {expenses.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No expenses recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {expenses.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{e.category}</span>
                        <p className="text-sm font-medium text-gray-900">{e.description}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{e.expense_date} {e.vendor && `· ${e.vendor}`}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <p className="font-semibold text-gray-900 text-sm">৳{fmt(Number(e.amount))}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.status==='approved'?'bg-green-100 text-green-700':e.status==='rejected'?'bg-red-100 text-red-600':'bg-yellow-100 text-yellow-700'}`}>{e.status}</span>
                      {e.status === 'pending' && (
                        <div className="flex gap-1">
                          <button onClick={() => approveExpense(e.id)} className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded">✓</button>
                          <button onClick={() => rejectExpense(e.id)} className="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-2 py-1 rounded">✕</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Installments Tab */}
        {tab === 'installments' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900">Fund Installments</h2>
              <button onClick={() => setShowInstForm(!showInstForm)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">+ Add Installment</button>
            </div>
            {showInstForm && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {inp('Installment #', 'installment_number', 'text', setInstallForm, installForm, '1st, 2nd...')}
                  {inp('Amount (BDT)', 'amount', 'number', setInstallForm, installForm)}
                  {inp('Received Date', 'received_date', 'date', setInstallForm, installForm)}
                </div>
                {inp('Bank Reference', 'bank_ref', 'text', setInstallForm, installForm)}
                <div className="flex gap-2">
                  <button onClick={addInstallment} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">Save</button>
                  <button onClick={() => setShowInstForm(false)} className="text-gray-500 text-sm px-4 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
                </div>
              </div>
            )}
            {installments.length === 0 ? <p className="text-gray-400 text-sm text-center py-8">No installments recorded.</p> : (
              <div className="space-y-2">
                {installments.map(i => (
                  <div key={i.id} className="flex items-center justify-between p-3 border rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Installment #{i.installment_number}</p>
                      <p className="text-xs text-gray-500">{i.received_date} {i.bank_ref && `· Ref: ${i.bank_ref}`}</p>
                    </div>
                    <p className="font-bold text-blue-700">৳{fmt(Number(i.amount))}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Team Tab */}
        {tab === 'team' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900">Team Members</h2>
              <button onClick={() => setShowMemForm(!showMemForm)} className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg">+ Add Member</button>
            </div>
            {showMemForm && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {inp('Name *', 'name', 'text', setMemberForm, memberForm)}
                  {inp('Email', 'email', 'email', setMemberForm, memberForm)}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                  <select value={memberForm.role||''} onChange={e=>setMemberForm((f:any)=>({...f,role:e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select role</option>
                    {['co_investigator','student','ra','volunteer'].map(r=><option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={addMember} className="bg-purple-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-purple-700">Add Member</button>
                  <button onClick={() => setShowMemForm(false)} className="text-gray-500 text-sm px-4 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
                </div>
              </div>
            )}
            {members.length === 0 ? <p className="text-gray-400 text-sm text-center py-8">No team members added.</p> : (
              <div className="grid grid-cols-2 gap-3">
                {members.map(m => (
                  <div key={m.id} className="border rounded-xl p-4">
                    <p className="font-medium text-gray-900">{m.name}</p>
                    {m.email && <p className="text-xs text-gray-500">{m.email}</p>}
                    {m.role && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full mt-1 inline-block">{m.role.replace(/_/g,' ')}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Project Overview</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Start Date:</span> <span className="font-medium">{project.start_date || '—'}</span></div>
              <div><span className="text-gray-500">End Date:</span> <span className="font-medium">{project.end_date || '—'}</span></div>
              <div><span className="text-gray-500">Status:</span> <span className="font-medium capitalize">{project.status}</span></div>
              <div><span className="text-gray-500">Pending Expenses:</span> <span className="font-medium text-yellow-600">৳{fmt(totalPending)}</span></div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {tab === 'reports' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Progress & Final Reports</h2>
            <p className="text-gray-500 text-sm mb-4">Submit progress and final reports to the funding organization.</p>
            <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg">+ Upload Report</button>
            {(!project.reports || project.reports.length === 0) && (
              <p className="text-gray-400 text-sm text-center py-8">No reports submitted yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
