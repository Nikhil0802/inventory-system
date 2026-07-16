import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { platformAPI } from '../api/platformApi';

const STATUS_COLORS = {
  active: 'bg-green-900/40 text-green-300',
  suspended: 'bg-red-900/40 text-red-300',
};

export default function PlatformOrgDetail() {
  const { id } = useParams();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [licenseForm, setLicenseForm] = useState({ type: '', itemLimit: '', maxUsers: '', expiryDate: '' });
  const [licenseMsg, setLicenseMsg] = useState('');
  const [licenseSaving, setLicenseSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await platformAPI.getOrganization(id);
      setOrg(res.data);
      const lic = res.data.license;
      setLicenseForm({
        type: lic?.type || 'free',
        itemLimit: lic?.itemLimit ?? '',
        maxUsers: lic?.maxUsers ?? '',
        expiryDate: lic?.expiryDate ? lic.expiryDate.slice(0, 10) : '',
      });
    } catch {
      setError('Failed to load organization.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSuspend = async () => {
    const reason = window.prompt(`Suspend "${org.name}" — reason (visible to the org owner):`);
    if (reason === null) return;
    try {
      await platformAPI.suspend(org.id, reason);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to suspend organization.');
    }
  };

  const handleUnsuspend = async () => {
    if (!window.confirm(`Unsuspend "${org.name}"?`)) return;
    try {
      await platformAPI.unsuspend(org.id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to unsuspend organization.');
    }
  };

  const handleLicenseSave = async (e) => {
    e.preventDefault();
    setLicenseMsg('');
    setLicenseSaving(true);
    try {
      await platformAPI.updateLicense(org.id, {
        type: licenseForm.type,
        itemLimit: licenseForm.itemLimit === '' ? undefined : parseInt(licenseForm.itemLimit),
        maxUsers: licenseForm.maxUsers === '' ? undefined : parseInt(licenseForm.maxUsers),
        expiryDate: licenseForm.expiryDate || null,
      });
      setLicenseMsg('License updated.');
      load();
    } catch (err) {
      setLicenseMsg(err.response?.data?.error || 'Failed to update license.');
    } finally {
      setLicenseSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900 text-slate-500 flex items-center justify-center">Loading...</div>;
  }
  if (error || !org) {
    return <div className="min-h-screen bg-slate-900 text-red-400 flex items-center justify-center">{error || 'Not found.'}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link to="/platform" className="text-slate-400 hover:text-slate-200 text-sm">&larr; Organizations</Link>
          <h1 className="text-lg font-bold">{org.name}</h1>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[org.status] || 'bg-slate-700 text-slate-300'}`}>
            {org.status}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {org.status === 'suspended' && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300 flex justify-between items-center">
            <span>
              Suspended {org.suspendedAt ? `on ${new Date(org.suspendedAt).toLocaleDateString()}` : ''}
              {org.suspendedReason ? ` — ${org.suspendedReason}` : ''}
            </span>
            <button onClick={handleUnsuspend} className="text-green-400 hover:text-green-300 font-medium">
              Unsuspend
            </button>
          </div>
        )}
        {org.status !== 'suspended' && (
          <div className="flex justify-end">
            <button onClick={handleSuspend} className="text-red-400 hover:text-red-300 text-sm font-medium">
              Suspend this organization
            </button>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-slate-400 mb-3">Overview</h2>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between"><dt className="text-slate-500">Owner</dt><dd>{org.owner?.name} ({org.owner?.email})</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Plan tier</dt><dd className="capitalize">{org.planTier}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Created</dt><dd>{new Date(org.createdAt).toLocaleDateString()}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Members</dt><dd>{org.members.length}</dd></div>
            </dl>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-slate-400 mb-3">License</h2>
            <form onSubmit={handleLicenseSave} className="text-sm space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-slate-500">Type</label>
                <input
                  value={licenseForm.type}
                  onChange={e => setLicenseForm(f => ({ ...f, type: e.target.value }))}
                  className="bg-slate-900 border border-slate-600 rounded px-2 py-1 w-32 outline-none"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-slate-500">Item limit</label>
                <input
                  type="number"
                  value={licenseForm.itemLimit}
                  onChange={e => setLicenseForm(f => ({ ...f, itemLimit: e.target.value }))}
                  className="bg-slate-900 border border-slate-600 rounded px-2 py-1 w-32 outline-none"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-slate-500">Max users</label>
                <input
                  type="number"
                  value={licenseForm.maxUsers}
                  onChange={e => setLicenseForm(f => ({ ...f, maxUsers: e.target.value }))}
                  className="bg-slate-900 border border-slate-600 rounded px-2 py-1 w-32 outline-none"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-slate-500">Expiry date</label>
                <input
                  type="date"
                  value={licenseForm.expiryDate}
                  onChange={e => setLicenseForm(f => ({ ...f, expiryDate: e.target.value }))}
                  className="bg-slate-900 border border-slate-600 rounded px-2 py-1 w-40 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={licenseSaving}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white font-medium py-1.5 rounded"
              >
                {licenseSaving ? 'Saving...' : 'Save license'}
              </button>
              {licenseMsg && <p className="text-xs text-slate-400">{licenseMsg}</p>}
            </form>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <h2 className="text-sm font-semibold text-slate-400 px-5 py-3 border-b border-slate-700">Members</h2>
          <table className="w-full text-sm">
            <thead className="bg-slate-800/80 border-b border-slate-700">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-slate-500">Name</th>
                <th className="text-left px-4 py-2 font-medium text-slate-500">Email</th>
                <th className="text-left px-4 py-2 font-medium text-slate-500">Role</th>
                <th className="text-left px-4 py-2 font-medium text-slate-500">Status</th>
                <th className="text-left px-4 py-2 font-medium text-slate-500">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {org.members.map(m => (
                <tr key={m.id}>
                  <td className="px-4 py-2">{m.name}</td>
                  <td className="px-4 py-2 text-slate-400">{m.email}</td>
                  <td className="px-4 py-2 capitalize">{m.role}</td>
                  <td className="px-4 py-2">{m.status}</td>
                  <td className="px-4 py-2 text-slate-500 text-xs">
                    {m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleDateString() : 'Never'}
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
