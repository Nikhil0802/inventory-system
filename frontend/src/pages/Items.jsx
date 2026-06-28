import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ItemForm from '../components/ItemForm';
import ItemTable from '../components/ItemTable';
import { itemAPI } from '../api/api';

export default function Items() {
  const [searchParams] = useSearchParams();
  const prefillBarcode = searchParams.get('barcode') || '';
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchItems = async () => {
    try {
      const response = await itemAPI.getAll();
      setItems(response.data);
    } catch (error) {
      console.error('Failed to load items', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleEdit = (item) => {
    setEditingItem(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.barcode && item.barcode.includes(searchTerm));

    const matchesCategory =
      categoryFilter === 'all' || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Inventory Items</h2>
          <span className="text-gray-500 text-sm">{items.length} total items</span>
        </div>

        <ItemForm
          onSuccess={fetchItems}
          editingItem={editingItem}
          onCancel={() => setEditingItem(null)}
          prefillBarcode={prefillBarcode}
        />

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name, SKU or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="consumables">Consumables</option>
            <option value="raw_materials">Raw Materials</option>
            <option value="finished_goods">Finished Goods</option>
            <option value="tools">Tools</option>
            <option value="furniture">Furniture</option>
            <option value="other">Other</option>
          </select>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading items...</p>
        ) : (
          <>
            {searchTerm || categoryFilter !== 'all' ? (
              <p className="text-sm text-gray-500 mb-3">
                Showing {filteredItems.length} of {items.length} items
              </p>
            ) : null}
            <ItemTable
              items={filteredItems}
              onEdit={handleEdit}
              onRefresh={fetchItems}
            />
          </>
        )}
      </div>
    </>
  );
}
