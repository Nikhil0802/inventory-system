import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Navbar from '../components/Navbar';
import { itemAPI, transactionAPI, profitAPI } from '../api/api';

const StatCard = ({ label, value, sub, bg = 'bg-blue-50', text = 'text-blue-700' }) => (
  <div className={`${bg} rounded-xl p-5`}>
    <p className="text-gray-500 text-sm font-medium mb-1">{label}</p>
    <p className={`text-3xl font-bold ${text}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const TypeBadge = ({ type }) => {
  const colors = {
    purchase: 'bg-green-100 text-green-700',
    sale: 'bg-red-100 text-red-700',
    transfer: 'bg-blue-100 text-blue-700',
    adjustment: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${colors[type] || 'bg-gray-100 text-gray-600'}`}>
      {type}
    </span>
  );
};

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const now = new Date();

  const [inventory, setInventory] = useState({ totalItems: 0, totalValue: 0, lowStockCount: 0 });
  const [recentTx, setRecentTx] = useState([]);
  const [todayProfit, setTodayProfit] = useState(null);
  const [monthProfit, setMonthProfit] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [itemsRes, txRes, todayRes, monthRes, itemsProfitRes] = await Promise.all([
          itemAPI.getAll(),
          transactionAPI.getAll(),
          profitAPI.getToday(),
          profitAPI.getMonth(now.getFullYear(), now.getMonth() + 1),
          profitAPI.getItems(),
        ]);

        const items = itemsRes.data;
        setInventory({
          totalItems: items.length,
          totalValue: items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0).toFixed(2),
          lowStockCount: items.filter(i => i.quantity < 10).length,
        });
        setRecentTx(txRes.data.slice(0, 5));
        setTodayProfit(todayRes.data);
        setMonthProfit(monthRes.data);
        setTopItems(itemsProfitRes.data.slice(0, 5));
      } catch (err) {
        console.error('Dashboard load error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const chartData = monthProfit?.dailyBreakdown?.slice(-14) || [];

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Welcome back, {user.name}</h2>
          <p className="text-gray-500 mt-1">
            {now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-16">Loading dashboard...</p>
        ) : (
          <>
            {/* ── Inventory Stats ── */}
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Inventory</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Items" value={inventory.totalItems} bg="bg-blue-50" text="text-blue-700" />
              <StatCard label="Inventory Value" value={`₹${Number(inventory.totalValue).toLocaleString('en-IN')}`} bg="bg-indigo-50" text="text-indigo-700" />
              <StatCard label="Low Stock" value={inventory.lowStockCount} sub="Below 10 units" bg="bg-yellow-50" text="text-yellow-700" />
              <StatCard label="License" value={user.license?.type || 'Free'} sub={`${user.license?.itemLimit ?? '—'} item limit`} bg="bg-purple-50" text="text-purple-700" />
            </div>

            {/* ── Today's Profit ── */}
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Today's Performance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Today's Sales" value={`₹${todayProfit?.totalSales?.toLocaleString('en-IN') ?? 0}`} bg="bg-green-50" text="text-green-700" />
              <StatCard
                label="Today's Profit"
                value={`₹${todayProfit?.grossProfit?.toLocaleString('en-IN') ?? 0}`}
                sub={`${todayProfit?.profitMargin ?? 0}% margin`}
                bg="bg-emerald-50"
                text="text-emerald-700"
              />
              <StatCard label="Transactions" value={todayProfit?.transactionCount ?? 0} sub="Sales today" bg="bg-cyan-50" text="text-cyan-700" />
              <StatCard
                label="Avg Sale Value"
                value={todayProfit?.transactionCount
                  ? `₹${(todayProfit.totalSales / todayProfit.transactionCount).toFixed(0)}`
                  : '₹0'}
                bg="bg-teal-50"
                text="text-teal-700"
              />
            </div>

            {/* ── Monthly Summary + Chart ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

              {/* Monthly P&L */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-700 mb-4">This Month — {monthProfit?.month}</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Total Sales', value: monthProfit?.totalSales, color: 'text-blue-700' },
                    { label: 'Cost of Goods', value: monthProfit?.totalCost, color: 'text-gray-600' },
                    { label: 'Gross Profit', value: monthProfit?.grossProfit, color: 'text-green-700' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-500">{label}</span>
                      <span className={`font-semibold ${color}`}>₹{value?.toLocaleString('en-IN') ?? 0}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2">
                    <span className="text-sm text-gray-500 font-medium">Profit Margin</span>
                    <span className={`font-bold text-lg ${
                      (monthProfit?.profitMargin ?? 0) >= 15 ? 'text-green-700'
                      : (monthProfit?.profitMargin ?? 0) >= 10 ? 'text-yellow-600'
                      : 'text-red-600'
                    }`}>
                      {monthProfit?.profitMargin ?? 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Daily profit chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-700 mb-4">Daily Profit — Last 14 Days</h3>
                {chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-gray-300 text-sm">No sales data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${v}`} />
                      <Tooltip formatter={v => [`₹${v}`, 'Profit']} labelFormatter={l => `Date: ${l}`} />
                      <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── Top Products + Recent Transactions ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Top products by profit */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-700 mb-4">Top Products by Profit</h3>
                {topItems.length === 0 ? (
                  <p className="text-gray-300 text-sm text-center py-8">Record sales transactions to see rankings</p>
                ) : (
                  <div className="space-y-3">
                    {topItems.map(item => (
                      <div key={item.itemId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-gray-100 rounded-full text-xs font-bold text-gray-500 flex items-center justify-center">{item.rank}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{item.name}</p>
                            <p className="text-xs text-gray-400">{item.quantitySold} units sold</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-700">₹{item.totalProfit?.toLocaleString('en-IN')}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                            item.profitMargin >= 15 ? 'bg-green-100 text-green-700'
                            : item.profitMargin >= 10 ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                          }`}>{item.profitMargin}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent transactions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-700 mb-4">Recent Transactions</h3>
                {recentTx.length === 0 ? (
                  <p className="text-gray-300 text-sm text-center py-8">No transactions yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentTx.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{tx.item?.name}</p>
                          <p className="text-xs text-gray-400">{new Date(tx.transactionDate).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <TypeBadge type={tx.type} />
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-700">₹{parseFloat(tx.totalAmount).toLocaleString('en-IN')}</p>
                            <p className="text-xs text-gray-400">qty {tx.quantity}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
