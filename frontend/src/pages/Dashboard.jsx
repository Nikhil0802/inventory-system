import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { itemAPI, transactionAPI } from '../api/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockCount: 0,
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const itemsRes = await itemAPI.getAll();
        const transactionsRes = await transactionAPI.getAll();

        const items = itemsRes.data;
        const transactions = transactionsRes.data;

        const totalValue = items.reduce((sum, item) => {
          return sum + (parseFloat(item.price) * item.quantity);
        }, 0);

        const lowStockCount = items.filter(item => item.quantity < 10).length;

        setStats({
          totalItems: items.length,
          totalValue: totalValue.toFixed(2),
          lowStockCount,
          recentTransactions: transactions.slice(0, 5),
        });
      } catch (error) {
        console.error('Failed to load dashboard', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome back, {user.name}
        </h2>
        <p className="text-gray-500 mb-8">Here's your inventory overview</p>

        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-100 rounded-lg p-6">
                <h3 className="text-gray-700 font-medium mb-1">Total Items</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.totalItems}</p>
              </div>
              <div className="bg-green-100 rounded-lg p-6">
                <h3 className="text-gray-700 font-medium mb-1">Inventory Value</h3>
                <p className="text-3xl font-bold text-green-600">₹{stats.totalValue}</p>
              </div>
              <div className="bg-yellow-100 rounded-lg p-6">
                <h3 className="text-gray-700 font-medium mb-1">Low Stock Items</h3>
                <p className="text-3xl font-bold text-yellow-600">{stats.lowStockCount}</p>
                <p className="text-xs text-gray-500 mt-1">Below 10 units</p>
              </div>
              <div className="bg-purple-100 rounded-lg p-6">
                <h3 className="text-gray-700 font-medium mb-1">License</h3>
                <p className="text-lg font-bold text-purple-600 capitalize">
                  {user.license?.type || 'Free'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {user.license?.itemLimit} item limit
                </p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Recent Transactions
              </h3>
              {stats.recentTransactions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No transactions yet. Start by adding items and recording transactions.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 text-gray-600">Item</th>
                        <th className="text-left py-2 px-2 text-gray-600">Type</th>
                        <th className="text-left py-2 px-2 text-gray-600">Quantity</th>
                        <th className="text-left py-2 px-2 text-gray-600">Amount</th>
                        <th className="text-left py-2 px-2 text-gray-600">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentTransactions.map((tx) => (
                        <tr key={tx.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2">{tx.item?.name}</td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-1 rounded text-white text-sm ${
                              tx.type === 'purchase' ? 'bg-green-500' :
                              tx.type === 'sale' ? 'bg-red-500' :
                              tx.type === 'transfer' ? 'bg-blue-500' :
                              'bg-gray-500'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-2 px-2">{tx.quantity}</td>
                          <td className="py-2 px-2">₹{tx.totalAmount}</td>
                          <td className="py-2 px-2">
                            {new Date(tx.transactionDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
