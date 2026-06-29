import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Navbar from '../components/Navbar';
import ItemForm from '../components/ItemForm';
import ItemTable from '../components/ItemTable';
import { itemAPI } from '../api/api';

const TABS = [
  { id: 'list', label: 'Items List' },
  { id: 'add', label: 'Add Item' },
  { id: 'remove', label: 'Remove Item' },
  { id: 'modify', label: 'Modify Item' },
  { id: 'report', label: 'Inventory Report' },
];

const CATEGORIES = ['electronics', 'consumables', 'raw_materials', 'finished_goods', 'tools', 'furniture', 'other'];

function InventoryReport({ items }) {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  const filtered = items.filter(item => {
    const matchCat = categoryFilter === 'all' || item.category === categoryFilter;
    const matchStock = stockFilter === 'all'
      ? true
      : stockFilter === 'low' ? item.quantity < 10
      : stockFilter === 'out' ? item.quantity === 0
      : item.quantity >= 10;
    return matchCat && matchStock;
  });

  const totalValue = filtered.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
  const totalItems = filtered.length;
  const lowStock = filtered.filter(i => i.quantity < 10).length;

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('INVENTORY REPORT', 148, 18, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')} | Total Items: ${totalItems} | Total Value: ₹${totalValue.toLocaleString('en-IN')}`, 148, 26, { align: 'center' });
    doc.line(14, 30, 282, 30);
    autoTable(doc, {
      startY: 36,
      head: [['SKU', 'Name', 'Category', 'Stock', 'Price (₹)', 'Purchase Price', 'Sale Price', 'Profit %', 'Location']],
      body: filtered.map(i => [
        i.sku, i.name, i.category?.replace('_', ' '),
        i.quantity,
        `₹${parseFloat(i.price).toLocaleString('en-IN')}`,
        i.purchasePrice ? `₹${parseFloat(i.purchasePrice).toLocaleString('en-IN')}` : '—',
        i.salePriceRetail ? `₹${parseFloat(i.salePriceRetail).toLocaleString('en-IN')}` : '—',
        i.profitPercentage ? `${parseFloat(i.profitPercentage).toFixed(1)}%` : '—',
        i.location || '—',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
      didParseCell: (data) => {
        if (data.column.index === 3 && data.section === 'body') {
          const qty = parseInt(data.cell.raw);
          if (qty === 0) data.cell.styles.textColor = [220, 38, 38];
          else if (qty < 10) data.cell.styles.textColor = [217, 119, 6];
        }
      },
    });
    doc.save(`inventory-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const rows = [
      ['SKU', 'Name', 'Category', 'Stock', 'Price (₹)', 'Purchase Price (₹)', 'Sale Price (₹)', 'Profit %', 'Margin (₹)', 'GST Rate', 'MRP (₹)', 'Location', 'Barcode', 'Serial No'],
      ...filtered.map(i => [
        i.sku, i.name, i.category?.replace('_', ' '), i.quantity,
        parseFloat(i.price),
        i.purchasePrice ? parseFloat(i.purchasePrice) : '',
        i.salePriceRetail ? parseFloat(i.salePriceRetail) : '',
        i.profitPercentage ? parseFloat(i.profitPercentage) : '',
        i.marginAmount ? parseFloat(i.marginAmount) : '',
        i.gstRate || '',
        i.mrp ? parseFloat(i.mrp) : '',
        i.location || '', i.barcode || '', i.serialNumber || '',
      ]),
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Inventory');
    XLSX.writeFile(wb, `inventory-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-medium">Total Items (filtered)</p>
          <p className="text-2xl font-bold text-blue-700">{totalItems}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-green-600 font-medium">Total Inventory Value</p>
          <p className="text-2xl font-bold text-green-700">₹{totalValue.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4">
          <p className="text-xs text-yellow-600 font-medium">Low Stock Items</p>
          <p className="text-2xl font-bold text-yellow-700">{lowStock}</p>
        </div>
      </div>

      {/* Filters + export */}
      <div className="flex flex-wrap gap-3 mb-5 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Stock Level</label>
          <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="all">All Stock Levels</option>
            <option value="ok">In Stock (10+)</option>
            <option value="low">Low Stock (&lt;10)</option>
            <option value="out">Out of Stock (0)</option>
          </select>
        </div>
        <div className="flex gap-2 ml-auto">
          <button onClick={exportPDF} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">Download PDF</button>
          <button onClick={exportExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Download Excel</button>
        </div>
      </div>

      {/* Inventory table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Purchase Price</th>
                <th className="px-4 py-3 text-right">Sale Price</th>
                <th className="px-4 py-3 text-right">Profit %</th>
                <th className="px-4 py-3">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0
                ? <tr><td colSpan={9} className="text-center text-gray-400 py-12">No items match filters.</td></tr>
                : filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{item.sku}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs capitalize">{item.category?.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold text-sm ${item.quantity === 0 ? 'text-red-600' : item.quantity < 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {item.quantity}
                        {item.quantity === 0 && <span className="ml-1 text-xs font-normal">Out</span>}
                        {item.quantity > 0 && item.quantity < 10 && <span className="ml-1 text-xs font-normal">Low</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">₹{parseFloat(item.price).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{item.purchasePrice ? `₹${parseFloat(item.purchasePrice).toLocaleString('en-IN')}` : '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{item.salePriceRetail ? `₹${parseFloat(item.salePriceRetail).toLocaleString('en-IN')}` : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      {item.profitPercentage
                        ? <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${parseFloat(item.profitPercentage) >= 15 ? 'bg-green-100 text-green-700' : parseFloat(item.profitPercentage) >= 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{parseFloat(item.profitPercentage).toFixed(1)}%</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{item.location || '—'}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Items() {
  const [searchParams] = useSearchParams();
  const prefillBarcode = searchParams.get('barcode') || '';

  const [activeTab, setActiveTab] = useState(prefillBarcode ? 'add' : 'list');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [deleteSearch, setDeleteSearch] = useState('');
  const [modifySearch, setModifySearch] = useState('');

  const fetchItems = async () => {
    try {
      const res = await itemAPI.getAll();
      setItems(res.data);
    } catch (err) {
      console.error('Failed to load items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const filteredItems = items.filter(item => {
    const matchSearch = !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.barcode && item.barcode.includes(searchTerm));
    const matchCat = categoryFilter === 'all' || item.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const deleteFilteredItems = items.filter(item =>
    !deleteSearch ||
    item.name.toLowerCase().includes(deleteSearch.toLowerCase()) ||
    item.sku.toLowerCase().includes(deleteSearch.toLowerCase())
  );

  const modifyFilteredItems = items.filter(item =>
    !modifySearch ||
    item.name.toLowerCase().includes(modifySearch.toLowerCase()) ||
    item.sku.toLowerCase().includes(modifySearch.toLowerCase())
  );

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await itemAPI.delete(id);
      await fetchItems();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete item');
    }
  };

  const handleSelectForEdit = (item) => {
    setEditingItem(item);
    setModifySearch('');
  };

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Inventory Items</h2>
          <span className="text-sm text-gray-400">{items.length} total items</span>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 w-fit">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setEditingItem(null);
              }}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-16">Loading items...</p>
        ) : (
          <>
            {/* ── ITEMS LIST ── */}
            {activeTab === 'list' && (
              <div>
                <div className="flex flex-col md:flex-row gap-3 mb-5">
                  <input
                    type="text"
                    placeholder="Search by name, SKU or barcode..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="all">All Categories</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                {(searchTerm || categoryFilter !== 'all') && (
                  <p className="text-sm text-gray-400 mb-3">Showing {filteredItems.length} of {items.length} items</p>
                )}
                <ItemTable items={filteredItems} onEdit={(item) => { setEditingItem(item); setActiveTab('modify'); }} onRefresh={fetchItems} />
              </div>
            )}

            {/* ── ADD ITEM ── */}
            {activeTab === 'add' && (
              <div className="max-w-3xl">
                <p className="text-sm text-gray-500 mb-6">Fill in the details below to add a new item to your inventory.</p>
                <ItemForm
                  onSuccess={() => { fetchItems(); setActiveTab('list'); }}
                  editingItem={null}
                  onCancel={() => setActiveTab('list')}
                  prefillBarcode={prefillBarcode}
                />
              </div>
            )}

            {/* ── REMOVE ITEM ── */}
            {activeTab === 'remove' && (
              <div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <span className="text-red-500 text-lg mt-0.5">⚠</span>
                  <div>
                    <p className="text-red-700 font-semibold text-sm">Permanent Action</p>
                    <p className="text-red-600 text-sm">Deleting an item cannot be undone. All transaction history linked to this item will remain.</p>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Search item to remove..."
                  value={deleteSearch}
                  onChange={e => setDeleteSearch(e.target.value)}
                  className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none text-sm mb-5"
                />

                {deleteFilteredItems.length === 0 ? (
                  <p className="text-gray-400 text-sm py-8 text-center">No items found.</p>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left text-gray-500 border-b border-gray-100">
                          <th className="px-5 py-3">Name</th>
                          <th className="px-5 py-3">SKU</th>
                          <th className="px-5 py-3">Category</th>
                          <th className="px-5 py-3 text-center">Stock</th>
                          <th className="px-5 py-3 text-right">Price</th>
                          <th className="px-5 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {deleteFilteredItems.map(item => (
                          <tr key={item.id} className="hover:bg-red-50 transition-colors">
                            <td className="px-5 py-3 font-medium text-gray-800">{item.name}</td>
                            <td className="px-5 py-3 text-gray-400 font-mono text-xs">{item.sku}</td>
                            <td className="px-5 py-3">
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs capitalize">{item.category?.replace('_', ' ')}</span>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className={`font-semibold ${item.quantity < 10 ? 'text-red-600' : 'text-green-600'}`}>{item.quantity}</span>
                            </td>
                            <td className="px-5 py-3 text-right text-gray-600">₹{parseFloat(item.price).toLocaleString('en-IN')}</td>
                            <td className="px-5 py-3 text-right">
                              <button
                                onClick={() => handleDelete(item.id, item.name)}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── INVENTORY REPORT ── */}
            {activeTab === 'report' && (
              <InventoryReport items={items} />
            )}

            {/* ── MODIFY ITEM ── */}
            {activeTab === 'modify' && (
              <div>
                {!editingItem ? (
                  <div>
                    <p className="text-sm text-gray-500 mb-5">Select an item to edit its details.</p>
                    <input
                      type="text"
                      placeholder="Search item to modify..."
                      value={modifySearch}
                      onChange={e => setModifySearch(e.target.value)}
                      className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm mb-5"
                    />
                    {modifyFilteredItems.length === 0 ? (
                      <p className="text-gray-400 text-sm py-8 text-center">No items found.</p>
                    ) : (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 text-left text-gray-500 border-b border-gray-100">
                              <th className="px-5 py-3">Name</th>
                              <th className="px-5 py-3">SKU</th>
                              <th className="px-5 py-3">Category</th>
                              <th className="px-5 py-3 text-center">Stock</th>
                              <th className="px-5 py-3 text-right">Price</th>
                              <th className="px-5 py-3"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {modifyFilteredItems.map(item => (
                              <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                                <td className="px-5 py-3 font-medium text-gray-800">{item.name}</td>
                                <td className="px-5 py-3 text-gray-400 font-mono text-xs">{item.sku}</td>
                                <td className="px-5 py-3">
                                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs capitalize">{item.category?.replace('_', ' ')}</span>
                                </td>
                                <td className="px-5 py-3 text-center">
                                  <span className={`font-semibold ${item.quantity < 10 ? 'text-red-600' : 'text-green-600'}`}>{item.quantity}</span>
                                </td>
                                <td className="px-5 py-3 text-right text-gray-600">₹{parseFloat(item.price).toLocaleString('en-IN')}</td>
                                <td className="px-5 py-3 text-right">
                                  <button
                                    onClick={() => handleSelectForEdit(item)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                  >
                                    Edit
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="max-w-3xl">
                    <div className="flex items-center gap-3 mb-6">
                      <button
                        onClick={() => setEditingItem(null)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                      >
                        ← Back to list
                      </button>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-600 text-sm">Editing: <strong>{editingItem.name}</strong></span>
                    </div>
                    <ItemForm
                      editingItem={editingItem}
                      onSuccess={() => { fetchItems(); setEditingItem(null); }}
                      onCancel={() => setEditingItem(null)}
                    />
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
