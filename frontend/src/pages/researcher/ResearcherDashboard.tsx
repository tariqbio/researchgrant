import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { applicationsApi, projectsApi, grantsApi } from '../../api';

export default function ResearcherDashboard() {
  const { user } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    Promise.all([
      applicationsApi.mine(),
      projectsApi.mine(),
      grantsApi.watchlist(),
    ]).then(([a, p, w]) => {
      setApps(a.data);
      setProjects(p.data);
      setWatchlist(w.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const activeProjects = projects.filter(p => p.status === 'active');
  const pendingApps = apps.filter(a => ['submitted', 'under_review'].includes(a.status));
  const awardedApps = apps.filter(a => a.status === 'awarded');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">Researcher</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{greeting}, {user?.full_name?.split(' ')[0]}</h1>
          <p className="text-gray-500 text-sm">{user?.institution || 'Welcome to GrantBD'}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Projects', value: activeProjects.length, color: 'green', icon: '🚀', to: '/projects' },
            { label: 'Applications', value: apps.length, color: 'blue', icon: '📝', to: '/applications' },
            { label: 'Pending Review', value: pendingApps.length, color: 'yellow', icon: '⏳', to: '/applications' },
            { label: 'Watchlist', value: watchlist.length, color: 'purple', icon: '⭐', to: '/watchlist' },
          ].map(s => (
            <Link key={s.label} to={s.to} className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-2xl font-bold text-${s.color}-600`}>{s.value}</div>
              <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Active Projects */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900">Active Research Projects</h2>
              <Link to="/projects" className="text-green-600 text-xs font-medium hover:underline">View all</Link>
            </div>
            {loading ? <p className="text-gray-400 text-sm">Loading…</p> :
              activeProjects.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <div className="text-3xl mb-2">🔬</div>
                  <p className="text-sm">No active projects yet.</p>
                  <p className="text-xs mt-1">Apply to grants to get started.</p>
                </div>
              ) : activeProjects.map(p => (
                <Link key={p.id} to={`/projects/${p.id}`}
                  className="block border rounded-xl p-3 hover:bg-gray-50 mb-2 transition">
                  <p className="font-medium text-gray-900 text-sm">{p.title}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">Budget: ৳{Number(p.total_budget).toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                  </div>
                </Link>
              ))
            }
          </div>

          {/* Recent Applications */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900">Recent Applications</h2>
              <Link to="/applications" className="text-green-600 text-xs font-medium hover:underline">View all</Link>
            </div>
            {loading ? <p className="text-gray-400 text-sm">Loading…</p> :
              apps.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <div className="text-3xl mb-2">📝</div>
                  <p className="text-sm">No applications yet.</p>
                  <Link to="/browse" className="text-green-600 text-xs font-medium mt-1 inline-block">Browse grants →</Link>
                </div>
              ) : apps.slice(0, 4).map(a => (
                <Link key={a.id} to={`/applications/${a.id}`}
                  className="block border rounded-xl p-3 hover:bg-gray-50 mb-2 transition">
                  <p className="font-medium text-gray-900 text-sm truncate">{a.project_title}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">{a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : 'Draft'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.status === 'awarded' ? 'bg-green-100 text-green-700' :
                      a.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      a.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{a.status.replace(/_/g, ' ')}</span>
                  </div>
                </Link>
              ))
            }
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-6 flex gap-3 flex-wrap">
          <Link to="/browse" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition">
            🔍 Browse Grants
          </Link>
          <Link to="/watchlist" className="bg-white border border-gray-300 hover:border-green-400 text-gray-700 font-medium px-5 py-2.5 rounded-lg text-sm transition">
            ⭐ Watchlist ({watchlist.length})
          </Link>
          <Link to="/profile" className="bg-white border border-gray-300 hover:border-green-400 text-gray-700 font-medium px-5 py-2.5 rounded-lg text-sm transition">
            👤 Edit Profile & Alerts
          </Link>
        </div>
      </div>
    </div>
  );
}
