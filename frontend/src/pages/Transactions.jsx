import { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Navbar from '../components/Navbar';
import { transactionAPI, itemAPI } from '../api/api';

const TABS = [
  { id: 'record', label: 'Record Transaction' },
  { id: 'all', label: 'All Transactions' },
  { id: 'recent', label: 'Recent' },
  { id: 'today', label: "Today's" },
  { id: 'top10', label: 'Top 10 by Value' },
  { id: 'report', label: 'Transaction Report' },
];

const TYPE_COLORS = {
  purchase: 'bg-green-100 text-green-700',
  sale: 'bg-red-100 text-red-700',
  transfer: 'bg-blue-100 text-blue-700',
  adjustment: 'bg-yellow-100 text-yellow-700',
};

const TypeBadge = ({ type }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${TYPE_COLORS[type] || 'bg-gray-100 text-gray-600'}`}>
    {type}
  </span>
);

const TxTable = ({ rows, emptyMsg = 'No transactions found.' }) => (
  rows.length === 0
    ? <p className="text-center text-gray-400 text-sm py-12">{emptyMsg}</p>
    : (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Price/Unit</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
                <th className="px-4 py-3 text-right">GST</th>
                <th className="px-4 py-3 text-right">Net Total</th>
                <th className="px-4 py-3">Supplier / Buyer</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{tx.item?.name || '—'}</td>
                  <td className="px-4 py-3"><TypeBadge type={tx.type} /></td>
                  <td className="px-4 py-3 text-right">{tx.quantity}</td>
                  <td className="px-4 py-3 text-right">₹{parseFloat(tx.price).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right text-gray-600">₹{parseFloat(tx.totalAmount).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right text-orange-600 text-xs">
                    {tx.gstAmount ? `₹${parseFloat(tx.gstAmount).toLocaleString('en-IN')} (${tx.gstRate}%)` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">
                    {tx.netAmount ? `₹${parseFloat(tx.netAmount).toLocaleString('en-IN')}` : `₹${parseFloat(tx.totalAmount).toLocaleString('en-IN')}`}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{tx.supplierOrBuyer || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(tx.transactionDate).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
);

export default function Transactions() {
  const [activeTab, setActiveTab] = useState('record');
  const [transactions, setTransactions] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [allSearch, setAllSearch] = useState('');
  const [allTypeFilter, setAllTypeFilter] = useState('all');

  // Report state
  const now = new Date();
  const [reportFrom, setReportFrom] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
  const [reportTo, setReportTo] = useState(now.toISOString().split('T')[0]);
  const [reportType, setReportType] = useState('all');
  const [reportRows, setReportRows] = useState([]);
  const [reportGenerated, setReportGenerated] = useState(false);

  const [formData, setFormData] = useState({
    itemId: '', type: 'purchase', quantity: 1, price: 0,
    referenceNo: '', transactionDate: now.toISOString().split('T')[0],
    supplierOrBuyer: '', notes: '', gstRate: '0', paymentMethod: 'cash',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [txRes, itemRes] = await Promise.all([transactionAPI.getAll(), itemAPI.getAll()]);
      setTransactions(txRes.data);
      setItems(itemRes.data);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(p => {
      const updated = { ...p, [name]: value };
      // Auto-fill GST rate from selected item
      if (name === 'itemId') {
        const selectedItem = items.find(i => i.id === value);
        updated.gstRate = selectedItem?.gstRate ?? '0';
      }
      return updated;
    });
  };

  // Live GST breakdown — only for sales
  const gstInfo = useMemo(() => {
    if (formData.type !== 'sale') return null;
    const qty = parseInt(formData.quantity) || 0;
    const price = parseFloat(formData.price) || 0;
    const rate = parseFloat(formData.gstRate) || 0;
    if (qty <= 0 || price <= 0) return null;
    const subtotal = price * qty;
    const gstAmount = parseFloat((subtotal * rate / 100).toFixed(2));
    const netAmount = parseFloat((subtotal + gstAmount).toFixed(2));
    return { subtotal, rate, gstAmount, netAmount };
  }, [formData.type, formData.quantity, formData.price, formData.gstRate]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setFormLoading(true);
    try {
      const payload = {
        ...formData,
        ...(gstInfo && { gstAmount: gstInfo.gstAmount, netAmount: gstInfo.netAmount }),
      };
      await transactionAPI.create(payload);
      setFormData({ itemId: '', type: 'purchase', quantity: 1, price: 0, referenceNo: '', transactionDate: now.toISOString().split('T')[0], supplierOrBuyer: '', notes: '', gstRate: '0', paymentMethod: 'cash' });
      await fetchData();
      setActiveTab('all');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record transaction');
    } finally {
      setFormLoading(false);
    }
  };

  // Derived lists
  const todayStr = now.toDateString();
  const todayTx = transactions.filter(tx => new Date(tx.transactionDate).toDateString() === todayStr);
  const recentTx = [...transactions].slice(0, 10);
  const top10Tx = [...transactions].sort((a, b) => parseFloat(b.totalAmount) - parseFloat(a.totalAmount)).slice(0, 10);
  const allFiltered = transactions.filter(tx => {
    const matchSearch = !allSearch || tx.item?.name?.toLowerCase().includes(allSearch.toLowerCase()) || tx.referenceNo?.toLowerCase().includes(allSearch.toLowerCase()) || tx.supplierOrBuyer?.toLowerCase().includes(allSearch.toLowerCase());
    const matchType = allTypeFilter === 'all' || tx.type === allTypeFilter;
    return matchSearch && matchType;
  });

  const generateReport = () => {
    const from = new Date(reportFrom);
    const to = new Date(reportTo);
    to.setHours(23, 59, 59);
    const filtered = transactions.filter(tx => {
      const d = new Date(tx.transactionDate);
      const matchDate = d >= from && d <= to;
      const matchType = reportType === 'all' || tx.type === reportType;
      return matchDate && matchType;
    });
    setReportRows(filtered);
    setReportGenerated(true);
  };

  const exportPDF = (rows, title) => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('INVENTORY MANAGEMENT SYSTEM', 105, 18, { align: 'center' });
    doc.setFontSize(13);
    doc.text(title, 105, 27, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 105, 34, { align: 'center' });
    doc.line(14, 38, 196, 38);
    autoTable(doc, {
      startY: 44,
      head: [['Item', 'Type', 'Qty', 'Price/Unit', 'Total', 'Supplier/Buyer', 'Date']],
      body: rows.map(tx => [
        tx.item?.name || '—', tx.type, tx.quantity,
        `₹${parseFloat(tx.price).toLocaleString('en-IN')}`,
        `₹${parseFloat(tx.totalAmount).toLocaleString('en-IN')}`,
        tx.supplierOrBuyer || '—',
        new Date(tx.transactionDate).toLocaleDateString('en-IN'),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
    });
    const total = rows.reduce((s, t) => s + parseFloat(t.totalAmount), 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ₹${total.toLocaleString('en-IN')} across ${rows.length} transactions`, 14, doc.lastAutoTable.finalY + 10);
    doc.save(`${title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  const exportExcel = (rows, filename) => {
    const data = [
      ['Item', 'Type', 'Qty', 'Price/Unit (₹)', 'Total (₹)', 'Supplier/Buyer', 'Reference No', 'Date', 'Notes'],
      ...rows.map(tx => [
        tx.item?.name || '—', tx.type, tx.quantity,
        parseFloat(tx.price), parseFloat(tx.totalAmount),
        tx.supplierOrBuyer || '—', tx.referenceNo || '—',
        new Date(tx.transactionDate).toLocaleDateString('en-IN'),
        tx.notes || '—',
      ]),
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), 'Transactions');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const SummaryBar = ({ rows }) => {
    const total = rows.reduce((s, t) => s + parseFloat(t.totalAmount), 0);
    const sales = rows.filter(t => t.type === 'sale').reduce((s, t) => s + parseFloat(t.totalAmount), 0);
    const purchases = rows.filter(t => t.type === 'purchase').reduce((s, t) => s + parseFloat(t.totalAmount), 0);
    return (
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Total Value', value: `₹${total.toLocaleString('en-IN')}`, color: 'text-blue-700 bg-blue-50' },
          { label: 'Sales', value: `₹${sales.toLocaleString('en-IN')}`, color: 'text-red-700 bg-red-50' },
          { label: 'Purchases', value: `₹${purchases.toLocaleString('en-IN')}`, color: 'text-green-700 bg-green-50' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-4 ${color}`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Transactions</h2>
          <span className="text-sm text-gray-400">{transactions.length} total</span>
        </div>

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

        {loading ? <p className="text-center text-gray-400 py-16">Loading...</p> : (
          <>
            {/* ── RECORD TRANSACTION ── */}
            {activeTab === 'record' && (
              <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-700 mb-5">Record New Transaction</h3>
                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
                      <select name="itemId" value={formData.itemId} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                        <option value="">Select an item</option>
                        {items.map(item => <option key={item.id} value={item.id}>{item.name} ({item.sku}) — Stock: {item.quantity}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                      <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                        <option value="purchase">Purchase (stock in)</option>
                        <option value="sale">Sale (stock out)</option>
                        <option value="transfer">Transfer</option>
                        <option value="adjustment">Adjustment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                      <input type="date" name="transactionDate" value={formData.transactionDate} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                      <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="1" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price per unit (₹) *</label>
                      <input type="number" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier / Buyer</label>
                      <input type="text" name="supplierOrBuyer" value={formData.supplierOrBuyer} onChange={handleChange} placeholder="Optional" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reference No.</label>
                      <input type="text" name="referenceNo" value={formData.referenceNo} onChange={handleChange} placeholder="Invoice / PO number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    {/* GST Rate — shown for sales */}
                    {formData.type === 'sale' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
                        <select name="gstRate" value={formData.gstRate} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                          {['0', '5', '12', '18', '28'].map(r => <option key={r} value={r}>{r}% GST</option>)}
                        </select>
                      </div>
                    )}

                    {/* Payment Method — shown for sales */}
                    {formData.type === 'sale' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                        <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                          <option value="cash">Cash</option>
                          <option value="upi">UPI</option>
                          <option value="card">Card</option>
                          <option value="cheque">Cheque</option>
                          <option value="credit">Credit</option>
                        </select>
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <input type="text" name="notes" value={formData.notes} onChange={handleChange} placeholder="Optional" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                  </div>

                  {/* GST Breakdown Panel */}
                  {gstInfo && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                      <p className="font-semibold text-blue-800 mb-2">GST Breakdown</p>
                      <div className="space-y-1 text-blue-700">
                        <div className="flex justify-between">
                          <span>Subtotal ({formData.quantity} × ₹{parseFloat(formData.price || 0).toLocaleString('en-IN')})</span>
                          <span className="font-medium">₹{gstInfo.subtotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>GST ({gstInfo.rate}%)</span>
                          <span className="font-medium">₹{gstInfo.gstAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between border-t border-blue-300 pt-1 mt-1 font-bold text-blue-900">
                          <span>Total Payable by Customer</span>
                          <span>₹{gstInfo.netAmount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={formLoading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 px-8 rounded-lg transition text-sm">
                    {formLoading ? 'Recording...' : 'Record Transaction'}
                  </button>
                </form>
              </div>
            )}

            {/* ── ALL TRANSACTIONS ── */}
            {activeTab === 'all' && (
              <div>
                <div className="flex flex-col md:flex-row gap-3 mb-5">
                  <input type="text" placeholder="Search item, supplier, reference..." value={allSearch} onChange={e => setAllSearch(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  <select value={allTypeFilter} onChange={e => setAllTypeFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                    <option value="all">All Types</option>
                    <option value="purchase">Purchase</option>
                    <option value="sale">Sale</option>
                    <option value="transfer">Transfer</option>
                    <option value="adjustment">Adjustment</option>
                  </select>
                  <button onClick={() => exportPDF(allFiltered, 'All Transactions')} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">PDF</button>
                  <button onClick={() => exportExcel(allFiltered, 'all-transactions')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Excel</button>
                </div>
                <SummaryBar rows={allFiltered} />
                <TxTable rows={allFiltered} emptyMsg="No transactions match your search." />
              </div>
            )}

            {/* ── RECENT ── */}
            {activeTab === 'recent' && (
              <div>
                <div className="flex justify-between items-center mb-5">
                  <p className="text-sm text-gray-500">Last 10 transactions recorded</p>
                  <div className="flex gap-2">
                    <button onClick={() => exportPDF(recentTx, 'Recent Transactions')} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">PDF</button>
                    <button onClick={() => exportExcel(recentTx, 'recent-transactions')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Excel</button>
                  </div>
                </div>
                <SummaryBar rows={recentTx} />
                <TxTable rows={recentTx} emptyMsg="No transactions yet." />
              </div>
            )}

            {/* ── TODAY'S ── */}
            {activeTab === 'today' && (
              <div>
                <div className="flex justify-between items-center mb-5">
                  <p className="text-sm text-gray-500">{todayTx.length} transaction{todayTx.length !== 1 ? 's' : ''} today — {now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <div className="flex gap-2">
                    <button onClick={() => exportPDF(todayTx, "Today's Transactions")} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">PDF</button>
                    <button onClick={() => exportExcel(todayTx, 'todays-transactions')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Excel</button>
                  </div>
                </div>
                <SummaryBar rows={todayTx} />
                <TxTable rows={todayTx} emptyMsg="No transactions recorded today." />
              </div>
            )}

            {/* ── TOP 10 BY VALUE ── */}
            {activeTab === 'top10' && (
              <div>
                <div className="flex justify-between items-center mb-5">
                  <p className="text-sm text-gray-500">10 highest-value transactions of all time</p>
                  <div className="flex gap-2">
                    <button onClick={() => exportPDF(top10Tx, 'Top 10 Transactions by Value')} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">PDF</button>
                    <button onClick={() => exportExcel(top10Tx, 'top10-transactions')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Excel</button>
                  </div>
                </div>
                <TxTable rows={top10Tx} emptyMsg="No transactions yet." />
              </div>
            )}

            {/* ── TRANSACTION REPORT ── */}
            {activeTab === 'report' && (
              <div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                  <h3 className="font-semibold text-gray-700 mb-4">Generate Transaction Report</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                      <input type="date" value={reportFrom} onChange={e => { setReportFrom(e.target.value); setReportGenerated(false); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                      <input type="date" value={reportTo} onChange={e => { setReportTo(e.target.value); setReportGenerated(false); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select value={reportType} onChange={e => { setReportType(e.target.value); setReportGenerated(false); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="all">All Types</option>
                        <option value="purchase">Purchase</option>
                        <option value="sale">Sale</option>
                        <option value="transfer">Transfer</option>
                        <option value="adjustment">Adjustment</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button onClick={generateReport} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
                        Generate
                      </button>
                    </div>
                  </div>
                </div>

                {reportGenerated && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-gray-500">{reportRows.length} transaction{reportRows.length !== 1 ? 's' : ''} found</p>
                      <div className="flex gap-2">
                        <button onClick={() => exportPDF(reportRows, `Transaction Report ${reportFrom} to ${reportTo}`)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">Download PDF</button>
                        <button onClick={() => exportExcel(reportRows, `transaction-report-${reportFrom}-${reportTo}`)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Download Excel</button>
                      </div>
                    </div>
                    <SummaryBar rows={reportRows} />
                    <TxTable rows={reportRows} emptyMsg="No transactions found for the selected period." />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
