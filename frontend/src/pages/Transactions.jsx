import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { transactionAPI, itemAPI } from '../api/api';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    itemId: '',
    type: 'purchase',
    quantity: 1,
    price: 0,
    referenceNo: '',
    transactionDate: new Date().toISOString().split('T')[0],
    supplierOrBuyer: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [txRes, itemRes] = await Promise.all([
        transactionAPI.getAll(),
        itemAPI.getAll(),
      ]);
      setTransactions(txRes.data);
      setItems(itemRes.data);
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);
    try {
      await transactionAPI.create(formData);
      setFormData({
        itemId: '',
        type: 'purchase',
        quantity: 1,
        price: 0,
        referenceNo: '',
        transactionDate: new Date().toISOString().split('T')[0],
        supplierOrBuyer: '',
        notes: '',
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create transaction');
    } finally {
      setFormLoading(false);
    }
  };

  const typeColors = {
    purchase: 'bg-green-500',
    sale: 'bg-red-500',
    transfer: 'bg-blue-500',
    adjustment: 'bg-gray-500',
  };

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Transactions</h2>

        {/* Record Transaction Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Record Transaction</h3>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item <span className="text-red-500">*</span>
                </label>
                <select
                  name="itemId"
                  value={formData.itemId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select an item</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku}) — Stock: {item.quantity}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="purchase">Purchase (stock in)</option>
                  <option value="sale">Sale (stock out)</option>
                  <option value="transfer">Transfer</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per unit (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="transactionDate"
                  value={formData.transactionDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier / Buyer
                </label>
                <input
                  type="text"
                  name="supplierOrBuyer"
                  value={formData.supplierOrBuyer}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Company or person name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference No.
                </label>
                <input
                  type="text"
                  name="referenceNo"
                  value={formData.referenceNo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Invoice / PO number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              {formLoading ? 'Recording...' : 'Record Transaction'}
            </button>
          </form>
        </div>

        {/* Transactions Table */}
        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No transactions yet. Record your first transaction above.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                Transaction History ({transactions.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Item</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Qty</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Price/Unit</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Supplier/Buyer</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{tx.item?.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-white text-sm capitalize ${typeColors[tx.type] || 'bg-gray-500'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">{tx.quantity}</td>
                      <td className="py-3 px-4">₹{parseFloat(tx.price).toLocaleString()}</td>
                      <td className="py-3 px-4 font-medium">₹{parseFloat(tx.totalAmount).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{tx.supplierOrBuyer || '-'}</td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(tx.transactionDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
