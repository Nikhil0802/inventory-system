import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold">Inventory</h1>
            <div className="hidden md:flex gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="hover:bg-blue-700 px-3 py-2 rounded"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/items')}
                className="hover:bg-blue-700 px-3 py-2 rounded"
              >
                Items
              </button>
              <button
                onClick={() => navigate('/transactions')}
                className="hover:bg-blue-700 px-3 py-2 rounded"
              >
                Transactions
              </button>
              <button
                onClick={() => navigate('/scan')}
                className="hover:bg-blue-700 px-3 py-2 rounded"
              >
                Scan
              </button>
              <button
                onClick={() => navigate('/expenses')}
                className="hover:bg-blue-700 px-3 py-2 rounded"
              >
                Expenses
              </button>
              <button
                onClick={() => navigate('/profit')}
                className="hover:bg-blue-700 px-3 py-2 rounded"
              >
                Profit
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="hover:bg-blue-700 px-3 py-2 rounded"
              >
                Reports
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm">{user.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
