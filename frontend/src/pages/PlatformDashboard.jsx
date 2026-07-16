import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { platformAuthAPI, platformAPI } from '../api/platformApi';

const TIERS = ['free', 'starter', 'pro', 'enterprise'];

const STATUS_COLORS = {
  active: 'bg-green-900/40 text-green-300',
  suspended: 'bg-red-900/40 text-red-300',
};

export default function PlatformDashboard() {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem('platformAdmin') || '{}');

  const [organizations, setOrganizations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await platformAPI.getOrganizations({ search: search || undefined, tier: tier || undefined, page });
      setOrganizations(res.data.organizations);
      setTotal(res.data.total);
      setPageSize(res.data.pageSize);
    } catch {
      setError('Failed to load organizations.');
    } finally {
      setLoading(false);
    }
  }, [search, tier, page]);

  useEffect(() => { load(); }, [load]);

  const handleLogout = async () => {
    try { await platformAuthAPI.logout(); } catch { /* proceed regardless */ }
    localStorage.removeItem('platformAccessToken');
    localStorage.removeItem('platformRefreshToken');
    localStorage.removeItem('platformAdmin');
    navigate('/platform/login');
  };

  const handleSuspend = async (org) => {
    const reason = window.prompt(`Suspend "${org.name}" — reason (visible to the org owner):`);
    if (reason === null) return;
    try {
      await platformAPI.suspend(org.id, reason);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to suspend organization.');
    }
  };

  const handleUnsuspend = async (org) => {
    if (!window.confirm(`Unsuspend "${org.name}"?`)) return;
    try {
      await platformAPI.unsuspend(org.id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to unsuspend organization.');
    }
  };

  const handlePlanChange = async (org, planTier) => {
    try {
      await platformAPI.updatePlanTier(org.id, planTier);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to change plan tier.');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <h1 className="text-lg font-bold">Platform Admin — Organizations</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{admin.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-700/80 hover:bg-red-700 px-3 py-1.5 rounded text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-3 mb-6 flex-wrap">
          <input
            type="text"
            placeholder="Search by org name or owner email..."
            value={search}
            onChange={e => { setPage(1); setSearch(e.target.value); }}
            className="flex-1 min-w-[240px] px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={tier}
            onChange={e => { setPage(1); setTier(e.target.value); }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm outline-none"
          >
            <option value="">All tiers</option>
            {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading...</div>
        ) : error ? (
          <div className="text-red-400 text-center py-8">{error}</div>
        ) : (
          <>
            <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/80 border-b border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-400">Organization</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-400">Owner</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-400">Plan</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-400">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-400">Users</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-400">Last Activity</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-400">Created</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {organizations.map(org => (
                    <tr key={org.id} className="hover:bg-slate-700/30">
                      <td className="px-4 py-3 font-medium">
                        <Link to={`/platform/organizations/${org.id}`} className="hover:text-indigo-400">
                          {org.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{org.owner?.email || '—'}</td>
                      <td className="px-4 py-3">
                        <select
                          value={org.planTier}
                          onChange={e => handlePlanChange(org, e.target.value)}
                          className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs outline-none cursor-pointer"
                        >
                          {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[org.status] || 'bg-slate-700 text-slate-300'}`}>
                          {org.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{org.memberCount}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {org.lastActivity ? new Date(org.lastActivity).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {org.status === 'suspended' ? (
                          <button
                            onClick={() => handleUnsuspend(org)}
                            className="text-green-400 hover:text-green-300 text-xs font-medium"
                          >
                            Unsuspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspend(org)}
                            className="text-red-400 hover:text-red-300 text-xs font-medium"
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {organizations.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500">No organizations found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4 text-sm text-slate-400">
              <span>{total} organization{total !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 bg-slate-800 border border-slate-700 rounded disabled:opacity-40"
                >
                  Prev
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 bg-slate-800 border border-slate-700 rounded disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
