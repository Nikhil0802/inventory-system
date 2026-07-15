import { useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Dashboard',    path: '/dashboard',    roles: ['owner', 'admin', 'manager', 'reporter', 'reader'] },
  { label: 'Items',        path: '/items',        roles: ['owner', 'admin', 'manager', 'reporter', 'reader'] },
  { label: 'Transactions', path: '/transactions', roles: ['owner', 'admin', 'manager', 'reporter'] },
  { label: 'Scan',         path: '/scan',         roles: ['owner', 'admin', 'manager'] },
  { label: 'Expenses',     path: '/expenses',     roles: ['owner', 'admin', 'reporter'] },
  { label: 'Profit',       path: '/profit',       roles: ['owner', 'admin', 'reporter'] },
  { label: 'Reports',      path: '/reports',      roles: ['owner', 'admin', 'reporter'] },
  { label: 'Team',         path: '/team',         roles: ['owner', 'admin', 'manager', 'reporter', 'reader'] },
];

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || 'reader';

  const handleLogout = async () => {
    try {
      const { authAPI } = await import('../api/api');
      await authAPI.logout();
    } catch {
      // proceed even if server call fails
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(role));

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold whitespace-nowrap">Inventory</h1>
            <div className="hidden md:flex gap-1">
              {visibleNav.map(item => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="hover:bg-blue-700 px-3 py-2 rounded text-sm"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-tight">{user.name}</p>
              <p className="text-xs text-blue-200 capitalize">{role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
