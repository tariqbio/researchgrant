import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { applicationsApi } from '../../api'

const statusStyle: Record<string,string> = {
  draft:'bg-gray-100 text-gray-600', submitted:'bg-blue-100 text-blue-700',
  under_review:'bg-yellow-100 text-yellow-700', awarded:'bg-green-100 text-green-700',
  rejected:'bg-red-100 text-red-600', withdrawn:'bg-gray-100 text-gray-400',
}

export default function MyApplications() {
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(()=>{ applicationsApi.mine().then(setApps).finally(()=>setLoading(false)) },[])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 mb-2 block">← Dashboard</Link>
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
      </div>
      {loading ? <div className="text-center py-16 text-gray-400">Loading…</div> :
       apps.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-gray-500 text-sm mb-4">No applications yet.</p>
          <Link to="/grants" className="bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm inline-block">Browse Grants</Link>
        </div>
      ) : apps.map(app=>(
        <div key={app.id} className="bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md transition mb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[app.status]}`}>{app.status.replace(/_/g,' ')}</span>
              <h3 className="font-semibold text-gray-900 mt-1">{app.project_title}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{app.abstract}</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                {app.budget_total_requested&&<span>Budget: ৳{Number(app.budget_total_requested).toLocaleString()}</span>}
                {app.submitted_at&&<span>Submitted: {new Date(app.submitted_at).toLocaleDateString()}</span>}
                {app.awarded_amount&&<span className="text-green-600 font-medium">Awarded: ৳{Number(app.awarded_amount).toLocaleString()}</span>}
              </div>
            </div>
            <Link to={`/applications/${app.id}`} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium ml-4">View →</Link>
          </div>
        </div>
      ))}
    </div>
  )
}
