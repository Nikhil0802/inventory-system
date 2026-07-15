import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { teamAPI } from '../api/api';

const ROLE_COLORS = {
  owner:    'bg-purple-100 text-purple-700',
  admin:    'bg-blue-100 text-blue-700',
  manager:  'bg-green-100 text-green-700',
  reporter: 'bg-yellow-100 text-yellow-700',
  reader:   'bg-gray-100 text-gray-600',
};

const ROLE_DESCRIPTIONS = {
  admin:    'Full access, can manage users',
  manager:  'Items & transactions, no financials',
  reporter: 'Read-only reports & dashboards',
  reader:   'View inventory only',
};

export default function TeamMembers() {
  const [members, setMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'manager' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const canManage = ['owner', 'admin'].includes(currentUser.role);

  const load = async () => {
    try {
      setLoading(true);
      const res = await teamAPI.getTeam();
      setMembers(res.data.members);
      setPendingInvites(res.data.pendingInvites);
    } catch {
      setError('Failed to load team members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteMsg('');
    setInviteLoading(true);
    try {
      await teamAPI.invite(inviteForm);
      setInviteMsg(`Invite sent to ${inviteForm.email}`);
      setInviteForm({ email: '', role: 'manager' });
      load();
    } catch (err) {
      setInviteMsg(err.response?.data?.error || 'Failed to send invite.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await teamAPI.changeRole(userId, newRole);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to change role.');
    }
  };

  const handleRemove = async (userId, name) => {
    if (!window.confirm(`Remove ${name} from the organization?`)) return;
    try {
      await teamAPI.removeMember(userId);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member.');
    }
  };

  const handleCancelInvite = async (inviteId) => {
    try {
      await teamAPI.cancelInvite(inviteId);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel invite.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Team Members</h1>
            <p className="text-gray-500 text-sm mt-1">
              Organization: <span className="font-medium">{currentUser.organizationName || '—'}</span>
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
            >
              + Invite Member
            </button>
          )}
        </div>

        {/* Invite Form */}
        {showInvite && canManage && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Invite a New Member</h2>
            <form onSubmit={handleInvite} className="flex gap-3 flex-wrap">
              <input
                type="email"
                placeholder="Email address"
                value={inviteForm.email}
                onChange={e => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                required
                className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
              <select
                value={inviteForm.role}
                onChange={e => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              >
                {Object.entries(ROLE_DESCRIPTIONS).map(([role, desc]) => (
                  <option key={role} value={role}>{role} — {desc}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={inviteLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {inviteLoading ? 'Sending...' : 'Send Invite'}
              </button>
            </form>
            {inviteMsg && (
              <p className={`mt-3 text-sm ${inviteMsg.startsWith('Invite sent') ? 'text-green-600' : 'text-red-600'}`}>
                {inviteMsg}
              </p>
            )}
          </div>
        )}

        {/* Members List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Last Login</th>
                    {canManage && <th className="px-4 py-3"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {m.name}
                        {m.id === currentUser.id && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{m.email}</td>
                      <td className="px-4 py-3">
                        {canManage && m.role !== 'owner' && m.id !== currentUser.id ? (
                          <select
                            value={m.role}
                            onChange={e => handleRoleChange(m.id, e.target.value)}
                            className={`px-2 py-1 rounded-full text-xs font-medium border-0 outline-none cursor-pointer ${ROLE_COLORS[m.role] || 'bg-gray-100 text-gray-600'}`}
                          >
                            {Object.keys(ROLE_DESCRIPTIONS).map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[m.role] || 'bg-gray-100 text-gray-600'}`}>
                            {m.role}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleDateString() : 'Never'}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3 text-right">
                          {m.role !== 'owner' && m.id !== currentUser.id && (
                            <button
                              onClick={() => handleRemove(m.id, m.name)}
                              className="text-red-500 hover:text-red-700 text-xs font-medium"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pending Invites */}
            {pendingInvites.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100">
                  <h2 className="text-sm font-semibold text-yellow-700">Pending Invites ({pendingInvites.length})</h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Expires</th>
                      {canManage && <th className="px-4 py-3"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingInvites.map(inv => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">{inv.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[inv.role] || ''}`}>
                            {inv.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {new Date(inv.expiresAt).toLocaleDateString()}
                        </td>
                        {canManage && (
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleCancelInvite(inv.id)}
                              className="text-gray-400 hover:text-red-500 text-xs font-medium"
                            >
                              Cancel
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
