import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { godAdminApi } from '../../api'

export default function GodAdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [pendingOrgs, setPendingOrgs] = useState<any[]>([])
  useEffect(()=>{
    Promise.all([godAdminApi.stats(), godAdminApi.pendingOrgs()])
      .then(([s,o])=>{setStats(s);setPendingOrgs(o)}).catch(()=>{})
  },[])

  const verify = async (id:string) => { await godAdminApi.verifyOrg(id); setPendingOrgs(p=>p.filter(o=>o.id!==id)) }
  const reject = async (id:string) => { await godAdminApi.rejectOrg(id); setPendingOrgs(p=>p.filter(o=>o.id!==id)) }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">God Admin</span>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Platform Control</h1>
      </div>
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            ['Researchers',stats.users.total,'🔬'],['Organizations',stats.orgs.total,'🏛️'],
            ['Active Grants',stats.grants.published,'📋'],['Applications',stats.applications.total,'📝'],
            ['Pending Review',stats.grants.pending_review,'⏳'],['Active Projects',stats.projects.active,'🚀'],
            ['Awarded',stats.applications.awarded,'🏆'],['Moderators',stats.staff.moderators,'👥'],
          ].map(([l,v,i]:any)=>(
            <div key={l} className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="text-2xl mb-1">{i}</div>
              <div className="text-2xl font-bold text-gray-900">{v}</div>
              <div className="text-gray-500 text-xs mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          ['/admin','Review Queue','📋'],
          ['/admin/upload','Upload PDF','📄'],
          ['/god-admin/users','Manage Users','👥'],
          ['/admin/create','Add Grant','➕'],
        ].map(([to,l,i])=>(
          <Link key={to} to={to} className="bg-white border-2 border-gray-100 hover:border-green-300 rounded-xl p-4 text-center transition">
            <div className="text-2xl mb-2">{i}</div>
            <div className="text-sm font-medium text-gray-700">{l}</div>
          </Link>
        ))}
      </div>
      {pendingOrgs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-gray-900">Pending Org Verifications</h2>
            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{pendingOrgs.length}</span>
          </div>
          {pendingOrgs.map(org=>(
            <div key={org.id} className="flex items-start justify-between p-4 border rounded-xl mb-2">
              <div>
                <p className="font-medium text-gray-900">{org.org_name}</p>
                <p className="text-xs text-gray-500">{org.org_type} · {org.email}</p>
                {org.org_description && <p className="text-xs text-gray-600 mt-1 max-w-lg">{org.org_description}</p>}
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={()=>verify(org.id)} className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg">Verify</button>
                <button onClick={()=>reject(org.id)} className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium px-3 py-1.5 rounded-lg">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
