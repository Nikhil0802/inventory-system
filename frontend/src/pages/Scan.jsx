import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BarcodeScanner from '../components/BarcodeScanner';
import { itemAPI, transactionAPI } from '../api/api';
import Navbar from '../components/Navbar';

const TYPES = ['purchase', 'sale', 'transfer', 'adjustment'];

const TYPE_COLORS = {
  purchase: 'bg-green-600 text-white border-green-600',
  sale: 'bg-red-600 text-white border-red-600',
  transfer: 'bg-blue-600 text-white border-blue-600',
  adjustment: 'bg-yellow-500 text-white border-yellow-500',
};

const defaultForm = () => ({
  type: 'purchase',
  quantity: '',
  price: '',
  transactionDate: new Date().toISOString().split('T')[0],
  referenceNo: '',
  supplierOrBuyer: '',
  notes: '',
});

export default function Scan() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('scanning'); // scanning | found | not_found | success
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [item, setItem] = useState(null);
  const [form, setForm] = useState(defaultForm());
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [lookupError, setLookupError] = useState('');

  const lookupBarcode = async (barcode) => {
    setLookupError('');
    try {
      const res = await itemAPI.getByBarcode(barcode);
      setItem(res.data);
      setForm(f => ({ ...f, price: res.data.price || '' }));
      setPhase('found');
    } catch (err) {
      if (err.response?.status === 404) {
        setScannedBarcode(barcode);
        setPhase('not_found');
      } else {
        setLookupError('Failed to look up barcode. Try again.');
      }
    }
  };

  const handleScan = (barcode) => {
    setScannedBarcode(barcode);
    lookupBarcode(barcode);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    lookupBarcode(manualBarcode.trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setApiError('');
    try {
      await transactionAPI.create({
        itemId: item.id,
        type: form.type,
        quantity: parseInt(form.quantity),
        price: parseFloat(form.price),
        transactionDate: form.transactionDate,
        referenceNo: form.referenceNo,
        supplierOrBuyer: form.supplierOrBuyer,
        notes: form.notes,
      });
      setPhase('success');
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to record transaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setPhase('scanning');
    setScannedBarcode('');
    setManualBarcode('');
    setCameraError('');
    setItem(null);
    setForm(defaultForm());
    setApiError('');
    setLookupError('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Barcode Scanner</h1>

        {/* SCANNING PHASE */}
        {phase === 'scanning' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-3">Point camera at a product barcode to scan it.</p>
              {cameraError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                  {cameraError}
                </div>
              ) : (
                <BarcodeScanner onScan={handleScan} onError={setCameraError} />
              )}
            </div>

            {/* Manual entry fallback */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Or enter barcode manually</p>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={e => setManualBarcode(e.target.value)}
                  placeholder="Enter barcode number..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Search
                </button>
              </form>
              {lookupError && (
                <p className="text-red-600 text-sm mt-2">{lookupError}</p>
              )}
            </div>
          </div>
        )}

        {/* NOT FOUND PHASE */}
        {phase === 'not_found' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 text-xl flex-shrink-0">!</div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Item Not Found</h2>
                <p className="text-sm text-gray-500">Barcode: <span className="font-mono font-medium text-gray-700">{scannedBarcode}</span></p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-6">No item with this barcode exists in your inventory. Would you like to add it?</p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/items?barcode=${encodeURIComponent(scannedBarcode)}`)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Add New Item
              </button>
              <button
                onClick={reset}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Scan Again
              </button>
            </div>
          </div>
        )}

        {/* FOUND + TRANSACTION FORM PHASE */}
        {phase === 'found' && item && (
          <div className="space-y-5">
            {/* Item details card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">Item Found</span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                <span className="text-gray-500">Name</span>
                <span className="font-medium text-gray-800">{item.name}</span>
                <span className="text-gray-500">SKU</span>
                <span className="font-medium text-gray-800">{item.sku}</span>
                <span className="text-gray-500">Barcode</span>
                <span className="font-mono text-gray-800">{item.barcode || '—'}</span>
                <span className="text-gray-500">Category</span>
                <span className="font-medium text-gray-800">{item.category || '—'}</span>
                <span className="text-gray-500">Location</span>
                <span className="font-medium text-gray-800">{item.location || '—'}</span>
                <span className="text-gray-500">Current Stock</span>
                <span className="font-bold text-blue-700 text-base">{item.quantity} units</span>
                <span className="text-gray-500">Unit Price</span>
                <span className="font-medium text-gray-800">₹{item.price}</span>
                {item.serialNumber && (
                  <>
                    <span className="text-gray-500">Serial No.</span>
                    <span className="font-medium text-gray-800">{item.serialNumber}</span>
                  </>
                )}
                {item.expiryDate && (
                  <>
                    <span className="text-gray-500">Expiry Date</span>
                    <span className="font-medium text-gray-800">{new Date(item.expiryDate).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>

            {/* Transaction form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-700 mb-4">Record Transaction</h3>

              {apiError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">
                  {apiError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Transaction type selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {TYPES.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, type: t }))}
                        className={`py-2 px-2 rounded-lg text-xs font-semibold capitalize border-2 transition-all ${
                          form.type === t
                            ? TYPE_COLORS[t]
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {form.type === 'purchase' && 'Adds stock — incoming goods from supplier'}
                    {form.type === 'sale' && 'Removes stock — outgoing goods to customer'}
                    {form.type === 'transfer' && 'Adds stock — moved in from another location'}
                    {form.type === 'adjustment' && 'Manual stock correction (positive or negative)'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.quantity}
                      onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price per unit *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Date *</label>
                  <input
                    type="date"
                    required
                    value={form.transactionDate}
                    onChange={e => setForm(f => ({ ...f, transactionDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier / Buyer</label>
                  <input
                    type="text"
                    value={form.supplierOrBuyer}
                    onChange={e => setForm(f => ({ ...f, supplierOrBuyer: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference No.</label>
                  <input
                    type="text"
                    value={form.referenceNo}
                    onChange={e => setForm(f => ({ ...f, referenceNo: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Invoice / PO number (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Optional"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'Saving...' : 'Record Transaction'}
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUCCESS PHASE */}
        {phase === 'success' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              ✓
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Transaction Recorded</h2>
            <p className="text-gray-500 text-sm mb-2">
              <span className="capitalize font-medium text-gray-700">{form.type}</span> of{' '}
              <span className="font-medium text-gray-700">{form.quantity} unit(s)</span>
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Item: <span className="font-medium text-gray-700">{item?.name}</span>
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700"
              >
                Scan Another
              </button>
              <button
                onClick={() => navigate('/transactions')}
                className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200"
              >
                View Transactions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
