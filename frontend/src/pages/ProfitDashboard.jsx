import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Navbar from '../components/Navbar';
import { profitAPI } from '../api/api';

const StatCard = ({ label, value, sub, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };
  return (
    <div className={`rounded-xl border-2 p-5 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-70 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-sm mt-1 opacity-70">{sub}</p>}
    </div>
  );
};

const GrowthBadge = ({ value }) => {
  if (value === null || value === undefined) return null;
  const up = value >= 0;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {up ? '↑' : '↓'} {Math.abs(value)}% vs yesterday
    </span>
  );
};

export default function ProfitDashboard() {
  const now = new Date();
  const [today, setToday] = useState(null);
  const [month, setMonth] = useState(null);
  const [items, setItems] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [todayRes, monthRes, itemsRes, compRes] = await Promise.all([
          profitAPI.getToday(),
          profitAPI.getMonth(now.getFullYear(), now.getMonth() + 1),
          profitAPI.getItems(),
          profitAPI.getComparison('month'),
        ]);
        setToday(todayRes.data);
        setMonth(monthRes.data);
        setItems(itemsRes.data.slice(0, 5));
        setComparison(compRes.data);
      } catch (err) {
        setError('Failed to load profit data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading profit data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      </div>
    </div>
  );

  const chartData = month?.dailyBreakdown?.slice(-14) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Profit Dashboard</h2>
            <p className="text-gray-500 text-sm mt-1">{now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Today's snapshot */}
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Today's Snapshot</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Sales"
            value={`₹${today?.totalSales?.toLocaleString('en-IN') ?? 0}`}
            sub={<GrowthBadge value={today?.salesGrowth} />}
            color="blue"
          />
          <StatCard
            label="Gross Profit"
            value={`₹${today?.grossProfit?.toLocaleString('en-IN') ?? 0}`}
            sub={`${today?.profitMargin ?? 0}% margin`}
            color="green"
          />
          <StatCard
            label="Transactions"
            value={today?.transactionCount ?? 0}
            sub="Sales recorded today"
            color="purple"
          />
          <StatCard
            label="Avg Transaction"
            value={today?.transactionCount
              ? `₹${(today.totalSales / today.transactionCount).toFixed(0)}`
              : '₹0'}
            sub="Per sale today"
            color="yellow"
          />
        </div>

        {/* Monthly summary + chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Monthly P&L */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">This Month — {month?.month}</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Sales', value: month?.totalSales, color: 'text-blue-700' },
                { label: 'Cost of Goods', value: month?.totalCost, color: 'text-gray-600' },
                { label: 'Gross Profit', value: month?.grossProfit, color: 'text-green-700' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600 text-sm">{label}</span>
                  <span className={`font-semibold ${color}`}>₹{value?.toLocaleString('en-IN') ?? 0}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-600 text-sm font-medium">Profit Margin</span>
                <span className={`font-bold text-lg ${(month?.profitMargin ?? 0) >= 15 ? 'text-green-700' : (month?.profitMargin ?? 0) >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {month?.profitMargin ?? 0}%
                </span>
              </div>
            </div>
            {comparison && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                <span className="text-sm text-gray-500">vs last month:</span>
                <GrowthBadge value={comparison.salesGrowth} />
              </div>
            )}
          </div>

          {/* Daily profit chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Daily Profit (Last 14 days)</h3>
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No sales data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${v}`} />
                  <Tooltip formatter={(v) => [`₹${v}`, 'Profit']} labelFormatter={l => `Date: ${l}`} />
                  <Bar dataKey="profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top 5 products by profit */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Top Products by Profit (All Time)</h3>
          {items.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No sales recorded yet. Record transactions to see profit rankings.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-3 pr-4">#</th>
                    <th className="pb-3 pr-4">Product</th>
                    <th className="pb-3 pr-4 text-right">Qty Sold</th>
                    <th className="pb-3 pr-4 text-right">Revenue</th>
                    <th className="pb-3 pr-4 text-right">Profit</th>
                    <th className="pb-3 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.itemId} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 pr-4 text-gray-400 font-medium">{item.rank}</td>
                      <td className="py-3 pr-4 font-medium text-gray-800">{item.name}</td>
                      <td className="py-3 pr-4 text-right text-gray-600">{item.quantitySold}</td>
                      <td className="py-3 pr-4 text-right text-gray-600">₹{item.totalRevenue?.toLocaleString('en-IN')}</td>
                      <td className="py-3 pr-4 text-right font-semibold text-green-700">₹{item.totalProfit?.toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item.profitMargin >= 15 ? 'bg-green-100 text-green-700' : item.profitMargin >= 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {item.profitMargin}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
