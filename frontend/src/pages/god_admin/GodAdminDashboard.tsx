import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { godAdminApi } from '../../api';

export default function GodAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [pendingOrgs, setPendingOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([godAdminApi.stats(), godAdminApi.pendingOrgs()])
      .then(([s, o]) => { setStats(s.data); setPendingOrgs(o.data); })
      .finally(() => setLoading(false));
  }, []);

  const verifyOrg = async (id: string) => {
    await godAdminApi.verifyOrg(id);
    setPendingOrgs(p => p.filter(o => o.id !== id));
  };
  const rejectOrg = async (id: string) => {
    await godAdminApi.rejectOrg(id);
    setPendingOrgs(p => p.filter(o => o.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">God Admin</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Platform Control Center</h1>
          <p className="text-gray-500 text-sm">Full platform visibility and control</p>
        </div>

        {/* Platform Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Researchers', value: stats.users.total, color: 'green', icon: '🔬' },
              { label: 'Organizations', value: stats.orgs.total, color: 'blue', icon: '🏛️' },
              { label: 'Active Grants', value: stats.grants.published, color: 'purple', icon: '📋' },
              { label: 'Applications', value: stats.applications.total, color: 'orange', icon: '📝' },
              { label: 'Pending Review', value: stats.grants.pending_review, color: 'yellow', icon: '⏳' },
              { label: 'Active Projects', value: stats.projects.active, color: 'teal', icon: '🚀' },
              { label: 'Awarded', value: stats.applications.awarded, color: 'emerald', icon: '🏆' },
              { label: 'Moderators', value: stats.staff.moderators, color: 'gray', icon: '👥' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className={`text-2xl font-bold text-${s.color}-600`}>{s.value}</div>
                <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { to: '/admin/queue', label: 'Review Queue', icon: '📋', color: 'green' },
            { to: '/admin/upload', label: 'Upload PDF', icon: '📄', color: 'blue' },
            { to: '/god-admin/users', label: 'Manage Users', icon: '👥', color: 'purple' },
            { to: '/god-admin/staff', label: 'Assign Staff', icon: '🔑', color: 'amber' },
          ].map(l => (
            <Link key={l.to} to={l.to} className={`bg-white border-2 border-${l.color}-100 hover:border-${l.color}-300 rounded-xl p-4 text-center transition group`}>
              <div className="text-2xl mb-2">{l.icon}</div>
              <div className={`text-sm font-medium text-${l.color}-700`}>{l.label}</div>
            </Link>
          ))}
        </div>

        {/* Pending Org Verifications */}
        {pendingOrgs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-semibold text-gray-900">Pending Organization Verifications</h2>
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{pendingOrgs.length}</span>
            </div>
            <div className="space-y-3">
              {pendingOrgs.map(org => (
                <div key={org.id} className="flex items-start justify-between p-4 border rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">{org.org_name}</p>
                    <p className="text-xs text-gray-500">{org.org_type} · {org.email}</p>
                    {org.org_website && <a href={org.org_website} target="_blank" rel="noreferrer" className="text-blue-600 text-xs hover:underline">{org.org_website}</a>}
                    {org.org_description && <p className="text-xs text-gray-600 mt-1 max-w-lg">{org.org_description}</p>}
                  </div>
                  <div className="flex gap-2 ml-4 shrink-0">
                    <button onClick={() => verifyOrg(org.id)} className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition">Verify</button>
                    <button onClick={() => rejectOrg(org.id)} className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium px-3 py-1.5 rounded-lg transition">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Staff Management teaser */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Staff Management</h2>
          <p className="text-sm text-gray-500 mb-3">Assign moderator roles to trusted users.</p>
          <Link to="/god-admin/users" className="inline-block bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            Manage All Users →
          </Link>
        </div>
      </div>
    </div>
  );
}
