import { itemAPI } from '../api/api';

export default function ItemTable({ items, onEdit, onRefresh }) {
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await itemAPI.delete(id);
        alert('Item deleted successfully');
        onRefresh();
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to delete item');
      }
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        No items found. Add your first item using the form above.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">SKU</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Qty</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Location</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-600">{item.sku}</td>
                <td className="py-3 px-4 font-medium">{item.name}</td>
                <td className="py-3 px-4">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm capitalize">
                    {item.category}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`font-bold ${item.quantity < 10 ? 'text-red-600' : 'text-green-600'}`}>
                    {item.quantity}
                    {item.quantity < 10 && (
                      <span className="ml-1 text-xs font-normal text-red-500">Low</span>
                    )}
                  </span>
                </td>
                <td className="py-3 px-4">₹{parseFloat(item.price).toLocaleString()}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{item.location || '-'}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
