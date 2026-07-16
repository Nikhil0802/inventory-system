import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { platformAuthAPI } from '../api/platformApi';

export default function PlatformLogin() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await platformAuthAPI.login(formData);
      localStorage.setItem('platformAccessToken', response.data.accessToken);
      localStorage.setItem('platformRefreshToken', response.data.refreshToken);
      localStorage.setItem('platformAdmin', JSON.stringify(response.data.admin));
      navigate('/platform');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl p-8 w-full max-w-md border border-slate-700">
        <h1 className="text-2xl font-bold text-center text-slate-100 mb-2">
          Platform Admin
        </h1>
        <p className="text-center text-slate-400 mb-6">Internal tenant management</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
