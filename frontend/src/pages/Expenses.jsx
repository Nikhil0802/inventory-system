import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, Cell,
} from 'recharts';
import Navbar from '../components/Navbar';
import { expenseAPI } from '../api/api';

const TABS = [
  { id: 'record', label: 'Record Expense' },
  { id: 'all', label: 'All Expenses' },
  { id: 'summary', label: 'Monthly Summary' },
  { id: 'netprofit', label: 'Net Profit' },
  { id: 'trend', label: 'Expense Trend' },
  { id: 'categories', label: 'Manage Categories' },
];

const CAT_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

const now = new Date();
const THIS_YEAR = now.getFullYear();
const THIS_MONTH = now.getMonth() + 1;

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN')}`;
const pct = (n) => `${parseFloat(n || 0).toFixed(1)}%`;

const MonthYearPicker = ({ year, month, onYear, onMonth }) => (
  <div className="flex gap-2">
    <select value={month} onChange={e => onMonth(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
        <option key={i} value={i + 1}>{m}</option>
      ))}
    </select>
    <select value={year} onChange={e => onYear(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
      {[THIS_YEAR - 1, THIS_YEAR, THIS_YEAR + 1].map(y => <option key={y} value={y}>{y}</option>)}
    </select>
  </div>
);

export default function Expenses() {
  const [activeTab, setActiveTab] = useState('record');
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [netProfit, setNetProfit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Expense form state
  const [form, setForm] = useState({
    categoryId: '', amount: '', vendor: '',
    description: '', expenseDate: now.toISOString().split('T')[0], isRecurring: false,
  });

  // All Expenses filters
  const [filterYear, setFilterYear] = useState(THIS_YEAR);
  const [filterMonth, setFilterMonth] = useState(THIS_MONTH);
  const [filterCat, setFilterCat] = useState('all');

  // Summary / Net Profit month pickers
  const [summaryYear, setSummaryYear] = useState(THIS_YEAR);
  const [summaryMonth, setSummaryMonth] = useState(THIS_MONTH);
  const [npYear, setNpYear] = useState(THIS_YEAR);
  const [npMonth, setNpMonth] = useState(THIS_MONTH);

  // Recurring auto-populate state
  const [pendingRecurring, setPendingRecurring] = useState([]);
  const [recurringDismissed, setRecurringDismissed] = useState(false);
  const [recurringSelected, setRecurringSelected] = useState({});
  const [recurringLoading, setRecurringLoading] = useState(false);

  // Trend state
  const [trendData, setTrendData] = useState(null);
  const [trendMonths, setTrendMonths] = useState(6);
  const [trendLoading, setTrendLoading] = useState(false);

  // Category form state
  const [catForm, setCatForm] = useState({ name: '', description: '', monthlyBudget: '', isRecurring: false });
  const [editingCat, setEditingCat] = useState(null);
  const [catLoading, setCatLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    const res = await expenseAPI.getCategories();
    setCategories(res.data);
  }, []);

  const loadExpenses = useCallback(async () => {
    const res = await expenseAPI.getAll({ year: filterYear, month: filterMonth });
    setExpenses(res.data);
  }, [filterYear, filterMonth]);

  const loadSummary = useCallback(async () => {
    const res = await expenseAPI.getMonthlySummary(summaryYear, summaryMonth);
    setSummary(res.data);
  }, [summaryYear, summaryMonth]);

  const loadNetProfit = useCallback(async () => {
    const res = await expenseAPI.getNetProfit(npYear, npMonth);
    setNetProfit(res.data);
  }, [npYear, npMonth]);

  const loadTrend = useCallback(async (months) => {
    setTrendLoading(true);
    try {
      const res = await expenseAPI.getTrend(months);
      setTrendData(res.data);
    } catch (err) {
      console.error('loadTrend error', err);
    } finally {
      setTrendLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        const [,,,,pendingRes] = await Promise.all([
          loadCategories(), loadExpenses(), loadSummary(), loadNetProfit(),
          expenseAPI.getPendingRecurring(),
        ]);
        const pending = pendingRes.data;
        setPendingRecurring(pending);
        setRecurringSelected(Object.fromEntries(pending.map(e => [e.id, true])));
      } catch (err) {
        console.error('Expenses init error', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Reload when filters change
  useEffect(() => { if (!loading) loadExpenses(); }, [filterYear, filterMonth]);
  useEffect(() => { if (!loading) loadSummary(); }, [summaryYear, summaryMonth]);
  useEffect(() => { if (!loading) loadNetProfit(); }, [npYear, npMonth]);
  useEffect(() => { if (activeTab === 'trend') loadTrend(trendMonths); }, [activeTab, trendMonths]);

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleFormChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setFormLoading(true);
    try {
      await expenseAPI.create(form);
      setForm({ categoryId: '', amount: '', vendor: '', description: '', expenseDate: now.toISOString().split('T')[0], isRecurring: false });
      await Promise.all([loadExpenses(), loadSummary(), loadNetProfit()]);
      showSuccess('Expense recorded successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record expense');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expenseAPI.delete(id);
      await Promise.all([loadExpenses(), loadSummary(), loadNetProfit()]);
      showSuccess('Expense deleted.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete expense');
    }
  };

  const handleConfirmRecurring = async () => {
    setRecurringLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const toCreate = pendingRecurring
        .filter(e => recurringSelected[e.id])
        .map(e => ({
          categoryId: e.categoryId,
          amount: e.amount,
          vendor: e.vendor,
          description: e.description,
          expenseDate: today,
        }));
      await expenseAPI.confirmRecurring({ expenses: toCreate });
      setRecurringDismissed(true);
      setPendingRecurring([]);
      await Promise.all([loadExpenses(), loadSummary(), loadNetProfit()]);
      showSuccess(`${toCreate.length} recurring expense${toCreate.length > 1 ? 's' : ''} added for this month.`);
    } catch (err) {
      setError('Failed to confirm recurring expenses');
    } finally {
      setRecurringLoading(false);
    }
  };

  // Category CRUD
  const handleSaveCat = async e => {
    e.preventDefault();
    setCatLoading(true); setError('');
    try {
      if (editingCat) {
        await expenseAPI.updateCategory(editingCat.id, catForm);
        showSuccess('Category updated.');
      } else {
        await expenseAPI.createCategory(catForm);
        showSuccess('Category created.');
      }
      setCatForm({ name: '', description: '', monthlyBudget: '' });
      setEditingCat(null);
      await loadCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save category');
    } finally {
      setCatLoading(false);
    }
  };

  const handleEditCat = (cat) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name, description: cat.description || '', monthlyBudget: cat.monthlyBudget ? String(cat.monthlyBudget) : '', isRecurring: cat.isRecurring || false });
  };

  const handleDeleteCat = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await expenseAPI.deleteCategory(id);
      await loadCategories();
      showSuccess('Category deleted.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete category');
    }
  };

  // Filtered expenses for All tab
  const filteredExpenses = filterCat === 'all'
    ? expenses
    : expenses.filter(e => e.categoryId === filterCat);

  const totalFiltered = filteredExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);

  if (loading) return (
    <>
      <Navbar />
      <p className="text-center text-gray-400 py-24">Loading...</p>
    </>
  );

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Expenses</h2>
          <div className="text-right">
            <p className="text-sm text-gray-400">This month</p>
            <p className="text-xl font-bold text-red-600">{fmt(summary?.totalExpenses)}</p>
          </div>
        </div>

        {/* Alerts */}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}<button className="float-right font-bold" onClick={() => setError('')}>×</button></div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>}

        {/* Budget alert banners */}
        {summary?.byCategory?.filter(c => c.isOverBudget || c.isNearBudget).map(c => (
          <div key={c.id} className={`flex items-center gap-2 px-4 py-2 rounded-lg mb-2 text-sm font-medium ${c.isOverBudget ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-yellow-50 border border-yellow-200 text-yellow-700'}`}>
            <span>{c.isOverBudget ? '🔴' : '🟡'}</span>
            <span>
              <strong>{c.name}</strong>: {fmt(c.spent)} spent
              {c.budget ? ` of ${fmt(c.budget)} budget (${pct(c.budgetUsed)} used)` : ''}
              {c.isOverBudget ? ' — OVER BUDGET' : ' — Approaching limit'}
            </span>
          </div>
        ))}

        {/* Recurring expense confirmation banner */}
        {pendingRecurring.length > 0 && !recurringDismissed && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-purple-800">
                  {pendingRecurring.length} recurring expense{pendingRecurring.length > 1 ? 's' : ''} from last month
                </p>
                <p className="text-sm text-purple-600 mt-0.5">Review and confirm to add them for this month</p>
              </div>
              <button onClick={() => setRecurringDismissed(true)} className="text-purple-400 hover:text-purple-700 text-xl font-bold leading-none">×</button>
            </div>
            <div className="space-y-2 mb-4">
              {pendingRecurring.map(exp => (
                <label key={exp.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recurringSelected[exp.id] || false}
                    onChange={e => setRecurringSelected(p => ({ ...p, [exp.id]: e.target.checked }))}
                    className="h-4 w-4 text-purple-600 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    <strong>{exp.category?.name}</strong>
                    {exp.vendor && <span className="text-gray-400"> — {exp.vendor}</span>}
                    <span className="ml-2 font-semibold text-purple-700">{fmt(exp.amount)}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmRecurring}
                disabled={recurringLoading || !Object.values(recurringSelected).some(Boolean)}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
              >
                {recurringLoading ? 'Confirming...' : `Confirm Selected (${Object.values(recurringSelected).filter(Boolean).length})`}
              </button>
              <button onClick={() => setRecurringDismissed(true)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Sub-tabs */}
        <div className="flex flex-wrap gap-1 bg-gray-100 rounded-xl p-1 mb-8 w-fit">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── RECORD EXPENSE ── */}
        {activeTab === 'record' && (
          <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-700 mb-5">Record New Expense</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select name="categoryId" value={form.categoryId} onChange={handleFormChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input type="number" name="amount" value={form.amount} onChange={handleFormChange} min="0.01" step="0.01" required placeholder="0.00" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor / Paid To</label>
                  <input type="text" name="vendor" value={form.vendor} onChange={handleFormChange} placeholder="e.g. Landlord, Electricity Board" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" name="expenseDate" value={form.expenseDate} onChange={handleFormChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes</label>
                  <input type="text" name="description" value={form.description} onChange={handleFormChange} placeholder="Optional details" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="md:col-span-2 flex items-center gap-3">
                  <input type="checkbox" id="isRecurring" name="isRecurring" checked={form.isRecurring} onChange={handleFormChange} className="h-4 w-4 text-blue-600 rounded" />
                  <label htmlFor="isRecurring" className="text-sm text-gray-700">This is a recurring monthly expense (e.g. rent, salary)</label>
                </div>
              </div>
              <button type="submit" disabled={formLoading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 px-8 rounded-lg text-sm">
                {formLoading ? 'Saving...' : 'Record Expense'}
              </button>
            </form>
          </div>
        )}

        {/* ── ALL EXPENSES ── */}
        {activeTab === 'all' && (
          <div>
            <div className="flex flex-wrap gap-3 items-end mb-5">
              <MonthYearPicker year={filterYear} month={filterMonth} onYear={setFilterYear} onMonth={setFilterMonth} />
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="ml-auto bg-red-50 rounded-lg px-4 py-2 text-sm">
                <span className="text-gray-500">Total: </span>
                <span className="font-bold text-red-600">{fmt(totalFiltered)}</span>
                <span className="text-gray-400 ml-2">({filteredExpenses.length} entries)</span>
              </div>
            </div>

            {filteredExpenses.length === 0
              ? <p className="text-center text-gray-400 py-16">No expenses for this period.</p>
              : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-500 border-b border-gray-100">
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Vendor / Paid To</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Recurring</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredExpenses.map(exp => (
                        <tr key={exp.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">{exp.category?.name}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{exp.vendor || '—'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{exp.description || '—'}</td>
                          <td className="px-4 py-3 text-right font-semibold text-red-600">{fmt(exp.amount)}</td>
                          <td className="px-4 py-3 text-gray-500">{new Date(exp.expenseDate).toLocaleDateString('en-IN')}</td>
                          <td className="px-4 py-3 text-center text-xs">{exp.isRecurring ? <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">Yes</span> : <span className="text-gray-300">—</span>}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleDeleteExpense(exp.id)} className="text-red-400 hover:text-red-600 text-xs font-medium">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}

        {/* ── MONTHLY SUMMARY ── */}
        {activeTab === 'summary' && (
          <div>
            <div className="flex flex-wrap gap-4 items-center mb-6">
              <MonthYearPicker year={summaryYear} month={summaryMonth} onYear={setSummaryYear} onMonth={setSummaryMonth} />
            </div>

            {!summary ? <p className="text-gray-400 text-sm py-8">Loading...</p> : (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-red-50 rounded-xl p-4">
                    <p className="text-xs text-red-600 font-medium">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-700">{fmt(summary.totalExpenses)}</p>
                    <p className="text-xs text-gray-400 mt-1">{summary.expenseCount} entries</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4">
                    <p className="text-xs text-orange-600 font-medium">Total Budget</p>
                    <p className="text-2xl font-bold text-orange-700">{fmt(summary.totalBudget)}</p>
                    <p className="text-xs text-gray-400 mt-1">across all categories</p>
                  </div>
                  <div className={`rounded-xl p-4 ${summary.totalBudget > 0 && summary.totalExpenses > summary.totalBudget ? 'bg-red-100' : 'bg-green-50'}`}>
                    <p className="text-xs font-medium text-gray-600">Budget Remaining</p>
                    <p className={`text-2xl font-bold ${summary.totalBudget > 0 && summary.totalExpenses > summary.totalBudget ? 'text-red-700' : 'text-green-700'}`}>
                      {summary.totalBudget > 0 ? fmt(summary.totalBudget - summary.totalExpenses) : 'No budget set'}
                    </p>
                  </div>
                </div>

                {/* Budget vs Actual chart */}
                {summary.byCategory?.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                    <h3 className="font-semibold text-gray-700 mb-4">Budget vs Actual by Category</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={summary.byCategory} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v, name) => [fmt(v), name === 'spent' ? 'Spent' : 'Budget']} />
                        <Legend formatter={v => v === 'spent' ? 'Spent' : 'Budget'} />
                        <Bar dataKey="budget" fill="#e5e7eb" name="budget" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="spent" name="spent" radius={[4, 4, 0, 0]}>
                          {summary.byCategory.map((entry, index) => (
                            <Cell key={index} fill={entry.isOverBudget ? '#ef4444' : entry.isNearBudget ? '#f59e0b' : '#8b5cf6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Category breakdown table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-500 border-b border-gray-100">
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3 text-right">Spent</th>
                        <th className="px-4 py-3 text-right">Budget</th>
                        <th className="px-4 py-3 text-right">Remaining</th>
                        <th className="px-4 py-3">Usage</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {summary.byCategory?.map(cat => (
                        <tr key={cat.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{cat.name}</td>
                          <td className="px-4 py-3 text-right font-semibold text-red-600">{fmt(cat.spent)}</td>
                          <td className="px-4 py-3 text-right text-gray-500">{cat.budget ? fmt(cat.budget) : <span className="text-gray-300">—</span>}</td>
                          <td className="px-4 py-3 text-right">
                            {cat.budget
                              ? <span className={cat.isOverBudget ? 'text-red-600 font-semibold' : 'text-green-600'}>{fmt(cat.budget - cat.spent)}</span>
                              : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {cat.budgetUsed !== null && (
                              <div className="w-full bg-gray-100 rounded-full h-2 max-w-[120px]">
                                <div
                                  className={`h-2 rounded-full ${cat.isOverBudget ? 'bg-red-500' : cat.isNearBudget ? 'bg-yellow-500' : 'bg-purple-500'}`}
                                  style={{ width: `${Math.min(cat.budgetUsed, 100)}%` }}
                                />
                              </div>
                            )}
                            {cat.budgetUsed !== null && <p className="text-xs text-gray-400 mt-0.5">{pct(cat.budgetUsed)}</p>}
                          </td>
                          <td className="px-4 py-3 text-center text-xs">
                            {cat.isOverBudget
                              ? <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Over Budget</span>
                              : cat.isNearBudget
                              ? <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Near Limit</span>
                              : cat.budget
                              ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">OK</span>
                              : <span className="text-gray-300">No budget</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── NET PROFIT ── */}
        {activeTab === 'netprofit' && (
          <div>
            <div className="flex flex-wrap gap-4 items-center mb-6">
              <MonthYearPicker year={npYear} month={npMonth} onYear={setNpYear} onMonth={setNpMonth} />
            </div>

            {!netProfit ? <p className="text-gray-400 text-sm py-8">Loading...</p> : (
              <div className="max-w-2xl">
                {/* P&L Statement Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                  <div className="bg-gray-800 text-white px-6 py-4">
                    <p className="text-xs text-gray-400 uppercase tracking-widest">Profit & Loss Statement</p>
                    <p className="text-lg font-bold mt-0.5">
                      {['January','February','March','April','May','June','July','August','September','October','November','December'][netProfit.month - 1]} {netProfit.year}
                    </p>
                  </div>

                  <div className="p-6 space-y-0">
                    {/* Revenue */}
                    <div className="flex justify-between py-3 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Revenue</span>
                      <span className="text-sm font-bold text-gray-800">{fmt(netProfit.revenue)}</span>
                    </div>
                    <div className="flex justify-between py-2.5 pl-4 border-b border-gray-50">
                      <span className="text-sm text-gray-500">Total Sales</span>
                      <span className="text-sm text-gray-700">{fmt(netProfit.revenue)}</span>
                    </div>

                    {/* COGS */}
                    <div className="flex justify-between py-3 border-b border-gray-100 mt-1">
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Cost of Goods Sold</span>
                      <span className="text-sm font-bold text-gray-500">({fmt(netProfit.cogs)})</span>
                    </div>

                    {/* Gross Profit */}
                    <div className="flex justify-between py-3 border-b-2 border-gray-200 bg-blue-50 px-3 -mx-3 rounded">
                      <span className="text-sm font-bold text-blue-800">GROSS PROFIT</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-blue-700">{fmt(netProfit.grossProfit)}</span>
                        <span className="text-xs text-blue-400 ml-2">({pct(netProfit.grossMargin)} margin)</span>
                      </div>
                    </div>

                    {/* Operating Expenses */}
                    <div className="flex justify-between py-3 border-b border-gray-100 mt-1">
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Operating Expenses</span>
                      <span className="text-sm font-bold text-red-500">({fmt(netProfit.totalExpenses)})</span>
                    </div>
                    {netProfit.expenseBreakdown?.map(e => (
                      <div key={e.name} className="flex justify-between py-2 pl-4 border-b border-gray-50">
                        <span className="text-sm text-gray-500">{e.name}</span>
                        <span className="text-sm text-red-400">({fmt(e.amount)})</span>
                      </div>
                    ))}

                    {/* Net Profit */}
                    <div className={`flex justify-between py-4 mt-2 px-3 -mx-3 rounded-b-xl ${netProfit.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                      <span className={`text-base font-bold uppercase tracking-wide ${netProfit.netProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>NET PROFIT</span>
                      <div className="text-right">
                        <span className={`text-xl font-bold ${netProfit.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt(netProfit.netProfit)}</span>
                        <span className={`text-xs ml-2 ${netProfit.netProfit >= 0 ? 'text-green-500' : 'text-red-400'}`}>({pct(netProfit.netMargin)} net margin)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick insight */}
                {netProfit.revenue === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
                    No sales recorded for this month. Record transactions to see full P&L.
                  </div>
                )}
                {netProfit.revenue > 0 && netProfit.cogs === 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                    COGS is ₹0 because item purchase prices are not set. Add purchase prices to items for accurate P&L.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── EXPENSE TREND ── */}
        {activeTab === 'trend' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-semibold text-gray-700">Month-over-Month Expense Trend</h3>
                <p className="text-sm text-gray-400 mt-0.5">Compare your spending across months</p>
              </div>
              <select
                value={trendMonths}
                onChange={e => setTrendMonths(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value={3}>Last 3 months</option>
                <option value={6}>Last 6 months</option>
                <option value={12}>Last 12 months</option>
              </select>
            </div>

            {trendLoading ? (
              <p className="text-center text-gray-400 py-16">Loading trend data...</p>
            ) : !trendData || trendData.months.length === 0 ? (
              <p className="text-center text-gray-400 py-16">No expense data found for this period.</p>
            ) : (
              <>
                {/* Total expenses bar chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                  <p className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">Total Expenses by Month</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={trendData.months} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={v => [fmt(v), 'Total']} />
                      <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Stacked category breakdown */}
                {trendData.topCategories.length > 0 && (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                    <p className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">Category Breakdown by Month</p>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={trendData.months} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v, name) => [fmt(v), name]} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        {trendData.topCategories.map((cat, i) => (
                          <Bar key={cat} dataKey={cat} stackId="stack" fill={CAT_COLORS[i % CAT_COLORS.length]} name={cat} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Month-over-month table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left text-gray-500 border-b border-gray-100">
                          <th className="px-4 py-3">Month</th>
                          <th className="px-4 py-3 text-right">Total</th>
                          <th className="px-4 py-3 text-right">vs Prev Month</th>
                          {trendData.topCategories.slice(0, 4).map(cat => (
                            <th key={cat} className="px-4 py-3 text-right text-xs">{cat.split(' ')[0]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {trendData.months.map((m, i) => {
                          const prev = trendData.months[i - 1];
                          const change = prev && prev.total > 0
                            ? ((m.total - prev.total) / prev.total * 100)
                            : null;
                          return (
                            <tr key={m.label} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-700">{m.label}</td>
                              <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmt(m.total)}</td>
                              <td className="px-4 py-3 text-right">
                                {change !== null ? (
                                  <span className={`font-medium text-xs px-2 py-0.5 rounded-full ${change > 5 ? 'bg-red-100 text-red-700' : change < -5 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                                  </span>
                                ) : <span className="text-gray-300">—</span>}
                              </td>
                              {trendData.topCategories.slice(0, 4).map(cat => (
                                <td key={cat} className="px-4 py-3 text-right text-gray-500 text-xs">
                                  {m[cat] ? fmt(m[cat]) : <span className="text-gray-200">—</span>}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── MANAGE CATEGORIES ── */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Category form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-700 mb-4">{editingCat ? 'Edit Category' : 'Add Category'}</h3>
              <form onSubmit={handleSaveCat} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                  <input type="text" value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Marketing" required className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Budget (₹)</label>
                  <input type="number" value={catForm.monthlyBudget} onChange={e => setCatForm(p => ({ ...p, monthlyBudget: e.target.value }))} min="0" step="0.01" placeholder="Leave blank for no budget" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="catRecurring" checked={catForm.isRecurring} onChange={e => setCatForm(p => ({ ...p, isRecurring: e.target.checked }))} className="h-4 w-4 text-blue-600 rounded" />
                  <label htmlFor="catRecurring" className="text-sm text-gray-700">This is a recurring monthly category (e.g. rent, salaries)</label>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={catLoading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-6 rounded-lg text-sm">
                    {catLoading ? 'Saving...' : editingCat ? 'Update' : 'Add Category'}
                  </button>
                  {editingCat && (
                    <button type="button" onClick={() => { setEditingCat(null); setCatForm({ name: '', description: '', monthlyBudget: '' }); }} className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2 px-6 rounded-lg text-sm">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Category list */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-700">Your Categories ({categories.length})</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800">{cat.name}</p>
                        {cat.isRecurring && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">Recurring</span>}
                      </div>
                      {cat.description && <p className="text-xs text-gray-400 mt-0.5">{cat.description}</p>}
                      {cat.monthlyBudget && <p className="text-xs text-purple-600 mt-0.5">Budget: {fmt(cat.monthlyBudget)}/month</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleEditCat(cat)} className="text-blue-500 hover:text-blue-700 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50">Edit</button>
                      <button onClick={() => handleDeleteCat(cat.id)} className="text-red-400 hover:text-red-600 text-xs font-medium px-2 py-1 rounded hover:bg-red-50">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
