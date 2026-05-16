import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { projectsApi } from '../../../api'
import { EXPENSE_CATEGORIES } from '../../../types'

type Tab = 'overview'|'expenses'|'installments'|'team'|'reports'

export default function ProjectDetail() {
  const { id } = useParams<{id:string}>()
  const [project, setProject] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [installments, setInstallments] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [tab, setTab] = useState<Tab>('overview')
  const [expForm, setExpForm] = useState<any>({})
  const [instForm, setInstForm] = useState<any>({})
  const [memForm, setMemForm] = useState<any>({})
  const [showExpForm, setShowExpForm] = useState(false)
  const [showInstForm, setShowInstForm] = useState(false)
  const [showMemForm, setShowMemForm] = useState(false)

  const load = async () => {
    if (!id) return
    const [p,e,i,m] = await Promise.all([projectsApi.get(id),projectsApi.expenses(id),projectsApi.installments(id),projectsApi.members(id)])
    setProject(p);setExpenses(e);setInstallments(i);setMembers(m)
  }
  useEffect(()=>{load()},[id])

  if (!project) return <div className="p-8 text-gray-400 text-center">Loading…</div>

  const fmt = (n:number) => new Intl.NumberFormat('en-BD').format(n)
  const totalReceived = installments.reduce((s,i)=>s+Number(i.amount),0)
  const totalSpent = expenses.filter(e=>e.status==='approved').reduce((s,e)=>s+Number(e.amount),0)
  const TABS: {key:Tab;label:string}[] = [
    {key:'overview',label:'Overview'},{key:'expenses',label:`Expenses (${expenses.length})`},
    {key:'installments',label:`Funds (${installments.length})`},{key:'team',label:`Team (${members.length})`},{key:'reports',label:'Reports'},
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 mb-4 block">← Dashboard</Link>
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div><h1 className="text-xl font-bold text-gray-900">{project.title}</h1>{project.description&&<p className="text-gray-500 text-sm mt-1">{project.description}</p>}</div>
          <div className="text-right"><p className="text-2xl font-bold text-green-700">৳{fmt(Number(project.total_budget))}</p><p className="text-xs text-gray-500">Total Budget</p></div>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-5">
          {[['Budget',fmt(Number(project.total_budget)),'blue'],['Received',fmt(totalReceived),'green'],['Spent',fmt(totalSpent),'orange'],['Remaining',fmt(totalReceived-totalSpent),(totalReceived-totalSpent)>=0?'emerald':'red']].map(([l,v,c])=>(
            <div key={l} className={`bg-${c}-50 rounded-xl p-3 border border-${c}-100`}>
              <p className={`text-lg font-bold text-${c}-700`}>৳{v}</p>
              <p className="text-xs text-gray-500 mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 bg-white rounded-xl border p-1 mb-6">
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${tab===t.key?'bg-green-600 text-white':'text-gray-600 hover:bg-gray-100'}`}>{t.label}</button>
        ))}
      </div>

      {tab==='overview'&&(
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Project Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[['Start',project.start_date||'—'],['End',project.end_date||'—'],['Status',project.status],['Currency',project.currency]].map(([l,v])=>(
              <div key={l}><span className="text-gray-500">{l}:</span> <span className="font-medium">{v}</span></div>
            ))}
          </div>
        </div>
      )}

      {tab==='expenses'&&(
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900">Expenses</h2>
            <button onClick={()=>setShowExpForm(!showExpForm)} className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg">+ Add</button>
          </div>
          {showExpForm&&(
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                <select value={expForm.category||''} onChange={e=>setExpForm((f:any)=>({...f,category:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select</option>{Object.entries(EXPENSE_CATEGORIES).map(([k,l])=><option key={k} value={k}>{l}</option>)}
                </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Amount *</label>
                <input type="number" value={expForm.amount||''} onChange={e=>setExpForm((f:any)=>({...f,amount:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
                <input value={expForm.description||''} onChange={e=>setExpForm((f:any)=>({...f,description:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"/></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                <input type="date" value={expForm.expense_date||''} onChange={e=>setExpForm((f:any)=>({...f,expense_date:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"/></div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>projectsApi.addExpense(id!,expForm).then(()=>{setExpForm({});setShowExpForm(false);load()})} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg">Save</button>
                <button onClick={()=>setShowExpForm(false)} className="text-gray-500 text-sm px-4 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
              </div>
            </div>
          )}
          {expenses.length===0?<p className="text-gray-400 text-sm text-center py-8">No expenses yet.</p>:
          expenses.map(e=>(
            <div key={e.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 mb-2">
              <div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mr-2">{e.category}</span>
                <span className="text-sm font-medium text-gray-900">{e.description}</span>
                <p className="text-xs text-gray-500 mt-0.5">{e.expense_date}{e.vendor&&` · ${e.vendor}`}</p>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <p className="font-semibold text-sm">৳{fmt(Number(e.amount))}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.status==='approved'?'bg-green-100 text-green-700':e.status==='rejected'?'bg-red-100 text-red-600':'bg-yellow-100 text-yellow-700'}`}>{e.status}</span>
                {e.status==='pending'&&<div className="flex gap-1">
                  <button onClick={()=>projectsApi.approveExpense(id!,e.id).then(load)} className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded">✓</button>
                  <button onClick={()=>projectsApi.rejectExpense(id!,e.id).then(load)} className="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-2 py-1 rounded">✕</button>
                </div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='installments'&&(
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900">Fund Installments</h2>
            <button onClick={()=>setShowInstForm(!showInstForm)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">+ Add</button>
          </div>
          {showInstForm&&(
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {[['#','installment_number','text'],['Amount','amount','number'],['Date','received_date','date']].map(([l,k,t])=>(
                  <div key={k}><label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                  <input type={t} value={instForm[k]||''} onChange={e=>setInstForm((f:any)=>({...f,[k]:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"/></div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={()=>projectsApi.addInstallment(id!,instForm).then(()=>{setInstForm({});setShowInstForm(false);load()})} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg">Save</button>
                <button onClick={()=>setShowInstForm(false)} className="text-gray-500 text-sm px-4 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
              </div>
            </div>
          )}
          {installments.length===0?<p className="text-gray-400 text-sm text-center py-8">No installments yet.</p>:
          installments.map(i=>(
            <div key={i.id} className="flex items-center justify-between p-3 border rounded-xl mb-2">
              <div><p className="font-medium text-sm">Installment #{i.installment_number}</p><p className="text-xs text-gray-500">{i.received_date||'—'}</p></div>
              <p className="font-bold text-blue-700">৳{fmt(Number(i.amount))}</p>
            </div>
          ))}
        </div>
      )}

      {tab==='team'&&(
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900">Team Members</h2>
            <button onClick={()=>setShowMemForm(!showMemForm)} className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg">+ Add</button>
          </div>
          {showMemForm&&(
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[['Name *','name','text'],['Email','email','email']].map(([l,k,t])=>(
                  <div key={k}><label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                  <input type={t} value={memForm[k]||''} onChange={e=>setMemForm((f:any)=>({...f,[k]:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"/></div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={()=>projectsApi.addMember(id!,memForm).then(()=>{setMemForm({});setShowMemForm(false);load()})} className="bg-purple-600 text-white text-sm px-4 py-2 rounded-lg">Add</button>
                <button onClick={()=>setShowMemForm(false)} className="text-gray-500 text-sm px-4 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
              </div>
            </div>
          )}
          {members.length===0?<p className="text-gray-400 text-sm text-center py-8">No members yet.</p>:
          <div className="grid grid-cols-2 gap-3">{members.map(m=>(
            <div key={m.id} className="border rounded-xl p-4">
              <p className="font-medium text-gray-900">{m.name}</p>
              {m.email&&<p className="text-xs text-gray-500">{m.email}</p>}
              {m.role&&<span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full mt-1 inline-block">{m.role}</span>}
            </div>
          ))}</div>}
        </div>
      )}

      {tab==='reports'&&(
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Reports</h2>
          <p className="text-gray-400 text-sm text-center py-8">No reports submitted yet.</p>
        </div>
      )}
    </div>
  )
}
