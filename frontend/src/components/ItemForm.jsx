import { useState, useEffect, useMemo } from 'react';
import { itemAPI } from '../api/api';

const GST_RATES = ['0', '5', '12', '18', '28'];

export default function ItemForm({ onSuccess, editingItem, onCancel, prefillBarcode = '' }) {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    barcode: prefillBarcode,
    quantity: 0,
    price: 0,
    category: 'electronics',
    manufacturingDate: '',
    expiryDate: '',
    serialNumber: '',
    location: '',
    purchasePrice: '',
    salePriceRetail: '',
    salePriceWholesale: '',
    mrp: '',
    gstRate: '18',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...editingItem,
        manufacturingDate: editingItem.manufacturingDate
          ? editingItem.manufacturingDate.split('T')[0]
          : '',
        expiryDate: editingItem.expiryDate
          ? editingItem.expiryDate.split('T')[0]
          : '',
        purchasePrice: editingItem.purchasePrice ?? '',
        salePriceRetail: editingItem.salePriceRetail ?? '',
        salePriceWholesale: editingItem.salePriceWholesale ?? '',
        mrp: editingItem.mrp ?? '',
        gstRate: editingItem.gstRate ?? '18',
      });
    }
  }, [editingItem]);

  // Real-time profit calculation
  const profitInfo = useMemo(() => {
    const purchase = parseFloat(formData.purchasePrice);
    const sale = parseFloat(formData.salePriceRetail);
    if (!purchase || !sale || sale <= 0) return null;
    const profitAmount = sale - purchase;
    const profitPct = (profitAmount / sale) * 100;
    const gst = parseFloat(formData.gstRate) || 0;
    const gstAmount = sale * (gst / 100);

    const mrp = parseFloat(formData.mrp);
    const mrpInfo = mrp > 0 ? {
      discount: (mrp - sale).toFixed(2),
      aboveMrp: sale > mrp,
    } : null;

    const wholesale = parseFloat(formData.salePriceWholesale);
    const wholesaleInfo = wholesale > 0 && purchase > 0 ? {
      marginAmount: (wholesale - purchase).toFixed(2),
      marginPct: ((wholesale - purchase) / wholesale * 100).toFixed(1),
      isValid: wholesale >= purchase,
    } : null;

    return {
      profitAmount: profitAmount.toFixed(2),
      profitPct: profitPct.toFixed(1),
      gstAmount: gstAmount.toFixed(2),
      priceWithGST: (sale + gstAmount).toFixed(2),
      isValid: sale >= purchase,
      color: profitPct >= 15 ? 'green' : profitPct >= 10 ? 'yellow' : 'red',
      mrpInfo,
      wholesaleInfo,
    };
  }, [formData.purchasePrice, formData.salePriceRetail, formData.salePriceWholesale, formData.mrp, formData.gstRate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (editingItem) {
        await itemAPI.update(editingItem.id, formData);
        alert('Item updated successfully');
      } else {
        await itemAPI.create(formData);
        alert('Item created successfully');
        setFormData({
          sku: '',
          name: '',
          description: '',
          barcode: '',
          quantity: 0,
          price: 0,
          category: 'electronics',
          manufacturingDate: '',
          expiryDate: '',
          serialNumber: '',
          location: '',
          purchasePrice: '',
          salePriceRetail: '',
          salePriceWholesale: '',
          mrp: '',
          gstRate: '18',
        });
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        {editingItem ? 'Edit Item' : 'Add New Item'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="SKU-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Item Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="electronics">Electronics</option>
              <option value="consumables">Consumables</option>
              <option value="raw_materials">Raw Materials</option>
              <option value="finished_goods">Finished Goods</option>
              <option value="tools">Tools</option>
              <option value="furniture">Furniture</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barcode
            </label>
            <input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="1234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Shelf A1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Serial Number
            </label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="SN-12345"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manufacturing Date
            </label>
            <input
              type="date"
              name="manufacturingDate"
              value={formData.manufacturingDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Pricing & Profit Section */}
          <div className="md:col-span-2">
            <div className="border-t border-gray-200 pt-4 mt-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Pricing & Profit</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Cost you paid"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price / Retail (₹)</label>
                  <input
                    type="number"
                    name="salePriceRetail"
                    value={formData.salePriceRetail}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Price you sell at"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale Price (₹) <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="number"
                    name="salePriceWholesale"
                    value={formData.salePriceWholesale}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Bulk / distributor price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MRP (₹) <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="number"
                    name="mrp"
                    value={formData.mrp}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Maximum Retail Price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
                  <select
                    name="gstRate"
                    value={formData.gstRate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {GST_RATES.map(r => (
                      <option key={r} value={r}>{r}%</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Real-time Profit Preview */}
              {profitInfo && (
                <div className={`mt-4 p-4 rounded-lg border-2 ${
                  !profitInfo.isValid
                    ? 'bg-red-50 border-red-300'
                    : profitInfo.color === 'green'
                    ? 'bg-green-50 border-green-300'
                    : profitInfo.color === 'yellow'
                    ? 'bg-yellow-50 border-yellow-300'
                    : 'bg-red-50 border-red-300'
                }`}>
                  {!profitInfo.isValid ? (
                    <p className="text-red-700 font-medium text-sm">Sale price cannot be less than purchase price</p>
                  ) : (
                    <div className="space-y-3 text-sm">
                      {/* Row 1: Retail profit */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <p className="text-gray-500">Retail Profit (₹)</p>
                          <p className={`font-bold text-lg ${profitInfo.color === 'green' ? 'text-green-700' : profitInfo.color === 'yellow' ? 'text-yellow-700' : 'text-red-700'}`}>
                            ₹{profitInfo.profitAmount}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Retail Margin</p>
                          <p className={`font-bold text-lg ${profitInfo.color === 'green' ? 'text-green-700' : profitInfo.color === 'yellow' ? 'text-yellow-700' : 'text-red-700'}`}>
                            {profitInfo.profitPct}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">GST ({formData.gstRate}%)</p>
                          <p className="font-semibold text-gray-700">₹{profitInfo.gstAmount}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Price + GST</p>
                          <p className="font-semibold text-gray-700">₹{profitInfo.priceWithGST}</p>
                        </div>
                      </div>

                      {/* Row 2: MRP comparison (only when MRP is set) */}
                      {profitInfo.mrpInfo && (
                        <div className={`pt-2 border-t ${profitInfo.mrpInfo.aboveMrp ? 'border-red-200' : 'border-gray-200'}`}>
                          {profitInfo.mrpInfo.aboveMrp ? (
                            <p className="text-red-700 font-semibold">
                              Warning: Sale price is ₹{Math.abs(profitInfo.mrpInfo.discount)} ABOVE MRP — not permitted in India
                            </p>
                          ) : (
                            <p className="text-blue-700">
                              MRP: Selling ₹{profitInfo.mrpInfo.discount} below MRP
                              {parseFloat(profitInfo.mrpInfo.discount) === 0 && ' (At MRP)'}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Row 3: Wholesale margin (only when wholesale price is set) */}
                      {profitInfo.wholesaleInfo && (
                        <div className="pt-2 border-t border-gray-200 grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-gray-500">Wholesale Profit (₹)</p>
                            <p className={`font-bold text-lg ${profitInfo.wholesaleInfo.isValid ? 'text-blue-700' : 'text-red-700'}`}>
                              {profitInfo.wholesaleInfo.isValid ? `₹${profitInfo.wholesaleInfo.marginAmount}` : 'Below cost!'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Wholesale Margin</p>
                            <p className={`font-bold text-lg ${profitInfo.wholesaleInfo.isValid ? 'text-blue-700' : 'text-red-700'}`}>
                              {profitInfo.wholesaleInfo.isValid ? `${profitInfo.wholesaleInfo.marginPct}%` : '—'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Item description"
              rows="3"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            {loading ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
          </button>
          {editingItem && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
