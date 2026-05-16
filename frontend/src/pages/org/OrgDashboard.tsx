import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { orgApi } from '../../api'

export default function OrgDashboard() {
  const { user } = useAuth()
  const [grants, setGrants] = useState<any[]>([])
  useEffect(() => { orgApi.myGrants().then(setGrants).catch(() => {}) }, [])

  if (user?.account_status === 'pending') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow p-10 max-w-md text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Pending</h2>
        <p className="text-gray-500 text-sm">Your organization is under review. Usually 1–2 business days.</p>
        <p className="mt-4 text-sm text-gray-400">Registered as: <strong>{user.org_name}</strong></p>
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">Funding Organization</span>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{user?.org_name}</h1>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[['Published', grants.filter(g=>g.status==='published').length,'green'],['Total',grants.length,'blue'],['Expired',grants.filter(g=>g.status==='expired').length,'gray']].map(([l,v,c]:any)=>(
          <div key={l} className="bg-white rounded-xl p-5 shadow-sm border">
            <div className={`text-3xl font-bold text-${c}-600`}>{v}</div>
            <div className="text-gray-500 text-sm mt-1">{l} Grants</div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mb-6">
        <Link to="/org/publish" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition">+ Publish Grant Call</Link>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Your Grant Calls</h2>
        {grants.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <Link to="/org/publish" className="text-blue-600 text-sm font-medium">Publish your first grant →</Link>
          </div>
        ) : grants.map(g => (
          <div key={g.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 mb-2">
            <div>
              <p className="font-medium text-gray-900 text-sm">{g.title_en}</p>
              <p className="text-xs text-gray-500">Deadline: {g.deadline || 'Not set'}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${g.status==='published'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{g.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
