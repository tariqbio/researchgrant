import { useEffect, useState } from 'react';
import { godAdminApi } from '../../api';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await godAdminApi.users({ role: role || undefined, status: status || undefined });
      setUsers(r.data.items); setTotal(r.data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [role, status]);

  const setUserRole = async (id: string, newRole: string) => {
    await godAdminApi.setRole(id, newRole);
    load();
  };
  const suspend = async (id: string) => { await godAdminApi.suspend(id); load(); };
  const reactivate = async (id: string) => { await godAdminApi.reactivate(id); load(); };

  const roleBadge = (r: string) => {
    const map: any = { god_admin: 'bg-amber-100 text-amber-700', moderator: 'bg-purple-100 text-purple-700', org: 'bg-blue-100 text-blue-700', researcher: 'bg-green-100 text-green-700' };
    return map[r] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>
        <div className="flex gap-3 mb-6">
          <select value={role} onChange={e => setRole(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Roles</option>
            {['researcher','org','moderator','god_admin'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Statuses</option>
            {['active','pending','suspended'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="text-sm text-gray-500 self-center">Total: {total}</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Name','Email','Role','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{u.full_name}</p>
                    {u.institution && <p className="text-xs text-gray-500">{u.institution}</p>}
                    {u.org_name && <p className="text-xs text-gray-500">{u.org_name}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge(u.role)}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.account_status==='active'?'bg-green-100 text-green-700':u.account_status==='pending'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>
                      {u.account_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {u.role === 'researcher' && (
                        <button onClick={() => setUserRole(u.id, 'moderator')} className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded-lg">→ Moderator</button>
                      )}
                      {u.role === 'moderator' && (
                        <button onClick={() => setUserRole(u.id, 'researcher')} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-lg">→ Researcher</button>
                      )}
                      {u.account_status !== 'suspended' ? (
                        <button onClick={() => suspend(u.id)} className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-lg">Suspend</button>
                      ) : (
                        <button onClick={() => reactivate(u.id)} className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded-lg">Reactivate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
