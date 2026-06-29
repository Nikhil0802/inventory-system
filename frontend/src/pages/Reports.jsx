import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Navbar from '../components/Navbar';
import { profitAPI } from '../api/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Reports() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [reportType, setReportType] = useState('pl');
  const [data, setData] = useState(null);
  const [itemsData, setItemsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError('');
    setData(null);
    setGenerated(false);
    try {
      const [monthRes, itemsRes] = await Promise.all([
        profitAPI.getMonth(year, month),
        profitAPI.getItems(),
      ]);
      setData(monthRes.data);
      setItemsData(itemsRes.data);
      setGenerated(true);
    } catch {
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const title = reportType === 'pl' ? 'Profit & Loss Statement' : 'Item Profitability Report';
    const period = `${MONTHS[month - 1]} ${year}`;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INVENTORY MANAGEMENT SYSTEM', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text(title, 105, 30, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${period}`, 105, 38, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 105, 44, { align: 'center' });
    doc.line(14, 48, 196, 48);

    if (reportType === 'pl' && data) {
      autoTable(doc, {
        startY: 55,
        head: [['Description', 'Amount (₹)']],
        body: [
          ['Total Sales', `₹${data.totalSales?.toLocaleString('en-IN') ?? 0}`],
          ['Cost of Goods Sold', `₹${data.totalCost?.toLocaleString('en-IN') ?? 0}`],
          ['Gross Profit', `₹${data.grossProfit?.toLocaleString('en-IN') ?? 0}`],
          ['Profit Margin', `${data.profitMargin ?? 0}%`],
          ['Total Transactions', data.transactionCount ?? 0],
        ],
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
      });

      if (data.dailyBreakdown?.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Daily Breakdown', 14, doc.lastAutoTable.finalY + 15);
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 20,
          head: [['Date', 'Sales (₹)', 'Profit (₹)']],
          body: data.dailyBreakdown.map(d => [d.date, `₹${d.sales?.toLocaleString('en-IN')}`, `₹${d.profit?.toLocaleString('en-IN')}`]),
          theme: 'grid',
          headStyles: { fillColor: [37, 99, 235] },
        });
      }
    } else if (reportType === 'items' && itemsData.length > 0) {
      autoTable(doc, {
        startY: 55,
        head: [['#', 'Product', 'SKU', 'Qty Sold', 'Revenue (₹)', 'Profit (₹)', 'Margin %']],
        body: itemsData.map(i => [
          i.rank, i.name, i.sku, i.quantitySold,
          `₹${i.totalRevenue?.toLocaleString('en-IN')}`,
          `₹${i.totalProfit?.toLocaleString('en-IN')}`,
          `${i.profitMargin}%`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
      });
    }

    doc.save(`${reportType}-report-${period.replace(' ', '-')}.pdf`);
  };

  const exportExcel = () => {
    const period = `${MONTHS[month - 1]}_${year}`;
    const wb = XLSX.utils.book_new();

    if (reportType === 'pl' && data) {
      const summary = [
        ['Profit & Loss Statement'],
        [`Period: ${MONTHS[month - 1]} ${year}`],
        [],
        ['Description', 'Amount (₹)'],
        ['Total Sales', data.totalSales],
        ['Cost of Goods Sold', data.totalCost],
        ['Gross Profit', data.grossProfit],
        ['Profit Margin (%)', data.profitMargin],
        ['Total Transactions', data.transactionCount],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'P&L Summary');

      if (data.dailyBreakdown?.length > 0) {
        const daily = [['Date', 'Sales (₹)', 'Profit (₹)'], ...data.dailyBreakdown.map(d => [d.date, d.sales, d.profit])];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(daily), 'Daily Breakdown');
      }
    } else if (reportType === 'items' && itemsData.length > 0) {
      const rows = [
        ['#', 'Product', 'SKU', 'Qty Sold', 'Revenue (₹)', 'Cost (₹)', 'Profit (₹)', 'Margin %'],
        ...itemsData.map(i => [i.rank, i.name, i.sku, i.quantitySold, i.totalRevenue, i.totalCost, i.totalProfit, i.profitMargin]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Item Profitability');
    }

    XLSX.writeFile(wb, `${reportType}-report-${period}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Reports & Export</h2>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={e => { setReportType(e.target.value); setGenerated(false); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="pl">Monthly P&L</option>
                <option value="items">Item Profitability</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={month}
                onChange={e => { setMonth(parseInt(e.target.value)); setGenerated(false); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={year}
                onChange={e => { setYear(parseInt(e.target.value)); setGenerated(false); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {[now.getFullYear(), now.getFullYear() - 1].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={generate}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        {/* Report Output */}
        {generated && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

            {/* Export buttons */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                {reportType === 'pl' ? `P&L Statement — ${MONTHS[month - 1]} ${year}` : 'Item Profitability (All Time)'}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={exportPDF}
                  className="flex items-center gap-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
                >
                  Download PDF
                </button>
                <button
                  onClick={exportExcel}
                  className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Download Excel
                </button>
              </div>
            </div>

            {/* P&L Report */}
            {reportType === 'pl' && data && (
              <div>
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                  <div className="bg-blue-600 text-white px-6 py-3">
                    <p className="font-bold text-center">PROFIT & LOSS STATEMENT</p>
                    <p className="text-center text-blue-100 text-sm">{data.month}</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {[
                      { label: 'Total Sales', value: data.totalSales, bold: false, color: 'text-blue-700' },
                      { label: 'Cost of Goods Sold', value: data.totalCost, bold: false, color: 'text-gray-700' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex justify-between px-6 py-3">
                        <span className="text-gray-600">{label}</span>
                        <span className={`font-medium ${color}`}>₹{value?.toLocaleString('en-IN') ?? 0}</span>
                      </div>
                    ))}
                    <div className="flex justify-between px-6 py-4 bg-green-50">
                      <span className="font-bold text-gray-800">Gross Profit</span>
                      <span className="font-bold text-green-700 text-lg">₹{data.grossProfit?.toLocaleString('en-IN') ?? 0}</span>
                    </div>
                    <div className="flex justify-between px-6 py-3 bg-gray-50">
                      <span className="text-gray-600">Profit Margin</span>
                      <span className={`font-bold ${(data.profitMargin ?? 0) >= 15 ? 'text-green-700' : (data.profitMargin ?? 0) >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {data.profitMargin ?? 0}%
                      </span>
                    </div>
                    <div className="flex justify-between px-6 py-3">
                      <span className="text-gray-600">Total Transactions</span>
                      <span className="font-medium">{data.transactionCount}</span>
                    </div>
                  </div>
                </div>

                {data.dailyBreakdown?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">Daily Breakdown</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-left text-gray-500">
                            <th className="px-4 py-2 rounded-tl-lg">Date</th>
                            <th className="px-4 py-2 text-right">Sales (₹)</th>
                            <th className="px-4 py-2 text-right rounded-tr-lg">Profit (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {data.dailyBreakdown.map(d => (
                            <tr key={d.date} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-gray-700">{d.date}</td>
                              <td className="px-4 py-2 text-right text-gray-700">₹{d.sales?.toLocaleString('en-IN')}</td>
                              <td className="px-4 py-2 text-right font-medium text-green-700">₹{d.profit?.toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Item Profitability Report */}
            {reportType === 'items' && (
              <div>
                {itemsData.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-12">No sales transactions recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left text-gray-500">
                          <th className="px-4 py-2">#</th>
                          <th className="px-4 py-2">Product</th>
                          <th className="px-4 py-2">SKU</th>
                          <th className="px-4 py-2 text-right">Qty Sold</th>
                          <th className="px-4 py-2 text-right">Revenue</th>
                          <th className="px-4 py-2 text-right">Profit</th>
                          <th className="px-4 py-2 text-right">Margin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {itemsData.map(item => (
                          <tr key={item.itemId} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-400">{item.rank}</td>
                            <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                            <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.sku}</td>
                            <td className="px-4 py-3 text-right">{item.quantitySold}</td>
                            <td className="px-4 py-3 text-right text-gray-700">₹{item.totalRevenue?.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 text-right font-semibold text-green-700">₹{item.totalProfit?.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 text-right">
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
