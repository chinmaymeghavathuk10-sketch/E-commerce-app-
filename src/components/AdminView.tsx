import { useState } from 'react';
import { Edit2, Package, Plus, RefreshCw, RotateCcw, Trash2, Users } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { STUDIO_IMAGE_PRESETS } from '../data/seedCatalog';
import { Category, GarmentType, OrderStatus, Product } from '../types';
import { ProductImage } from './ProductImage';

type AdminTab = 'products' | 'orders' | 'returns' | 'customers';

const CATEGORIES: Category[] = ["Men's Wear", "Women's Wear", "Kids' Wear"];
const GARMENT_TYPES: GarmentType[] = [
  'Shirts',
  'T-Shirts',
  'Jeans',
  'Trousers',
  'Dresses',
  'Jackets',
];
const ORDER_STATUSES: OrderStatus[] = [
  'Confirmed',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

interface ProductFormState {
  id?: string;
  name: string;
  category: Category;
  garmentType: GarmentType;
  description: string;
  price: string;
  imageUrl: string;
  sizesInput: string;
  colorsInput: string;
  stock: string;
  featured: boolean;
}

const EMPTY_FORM: ProductFormState = {
  name: '',
  category: "Men's Wear",
  garmentType: 'Shirts',
  description: '',
  price: '85',
  imageUrl: STUDIO_IMAGE_PRESETS[0].url,
  sizesInput: 'S, M, L, XL',
  colorsInput: 'Obsidian, Chalk White',
  stock: '20',
  featured: false,
};

export function AdminView() {
  const {
    isAdmin,
    products,
    isCatalogSeeded,
    allOrders,
    allUsers,
    saveProduct,
    deleteProduct,
    seedCatalog,
    updateOrderStatus,
    processReturn,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  if (!isAdmin) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-sm text-slate-600">
          Administrator privileges are required to access the store management console.
        </p>
      </div>
    );
  }

  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const pendingReturns = allOrders.filter(
    (o) => o.returnStatus === 'Requested' || o.returnStatus === 'Approved'
  );

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setForm({
      id: product.id,
      name: product.name,
      category: product.category,
      garmentType: product.garmentType,
      description: product.description,
      price: String(product.price),
      imageUrl: product.imageUrl,
      sizesInput: product.sizes.join(', '),
      colorsInput: product.colors.join(', '),
      stock: String(product.stock),
      featured: product.featured,
    });
    setModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const sizes = form.sizesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const colors = form.colorsInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      await saveProduct({
        id: form.id,
        name: form.name,
        category: form.category,
        garmentType: form.garmentType,
        description: form.description,
        price: Number(form.price) || 1,
        imageUrl: form.imageUrl,
        sizes: sizes.length > 0 ? sizes : ['M'],
        colors: colors.length > 0 ? colors : ['Standard'],
        stock: Math.max(0, Math.floor(Number(form.stock) || 0)),
        featured: form.featured,
      });
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickRestock = async (product: Product) => {
    await saveProduct({
      id: product.id,
      name: product.name,
      category: product.category,
      garmentType: product.garmentType,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      sizes: product.sizes,
      colors: product.colors,
      stock: product.stock + 10,
      featured: product.featured,
    });
  };

  const returnQueue = allOrders.filter((o) => o.returnStatus !== 'None');

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs text-slate-500">Store Operations</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-slate-900">
            Admin Management Console
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {!isCatalogSeeded && (
            <button
              type="button"
              onClick={seedCatalog}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-xs font-semibold text-slate-800 rounded-lg hover:border-slate-900"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Seed Default Catalog</span>
            </button>
          )}
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Clothing Item</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-slate-200 rounded-xl p-5 bg-white">
          <p className="text-xs text-slate-500">Catalog Products</p>
          <p className="text-2xl font-semibold text-slate-900 tabular-nums mt-1">
            {products.length}
          </p>
        </div>
        <div className="border border-slate-200 rounded-xl p-5 bg-white">
          <p className="text-xs text-slate-500">Inventory Units</p>
          <p className="text-2xl font-semibold text-slate-900 tabular-nums mt-1">
            {totalUnits}{' '}
            {lowStockCount > 0 && (
              <span className="text-xs font-medium text-amber-700 ml-1">
                ({lowStockCount} low stock)
              </span>
            )}
          </p>
        </div>
        <div className="border border-slate-200 rounded-xl p-5 bg-white">
          <p className="text-xs text-slate-500">Total Customer Orders</p>
          <p className="text-2xl font-semibold text-slate-900 tabular-nums mt-1">
            {allOrders.length}
          </p>
        </div>
        <div className="border border-slate-200 rounded-xl p-5 bg-white">
          <p className="text-xs text-slate-500">Pending Returns</p>
          <p className="text-2xl font-semibold text-slate-900 tabular-nums mt-1">
            {pendingReturns.length}
          </p>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
        {(
          [
            { id: 'products', label: 'Products & Inventory', icon: Package },
            { id: 'orders', label: `Orders (${allOrders.length})`, icon: RefreshCw },
            { id: 'returns', label: `Returns & Refunds (${returnQueue.length})`, icon: RotateCcw },
            { id: 'customers', label: `Customers (${allUsers.length})`, icon: Users },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Products & Inventory Tab */}
      {activeTab === 'products' && (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Product</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Price</th>
                  <th className="py-3.5 px-4 font-semibold">Stock</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 bg-slate-100 rounded-md overflow-hidden border border-slate-200 shrink-0">
                          <ProductImage
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{prod.name}</p>
                          <p className="text-slate-500">
                            Sizes: {prod.sizes.join(', ')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {prod.category} · {prod.garmentType}
                    </td>
                    <td className="py-3.5 px-4 font-semibold tabular-nums text-slate-900">
                      ${prod.price.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-semibold tabular-nums ${
                          prod.stock === 0
                            ? 'text-red-700'
                            : prod.stock <= 5
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {prod.stock} units
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickRestock(prod)}
                          className="px-2.5 py-1 border border-slate-200 rounded-md text-slate-700 hover:border-slate-400 font-medium"
                        >
                          +10 Stock
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(prod)}
                          aria-label={`Edit ${prod.name}`}
                          className="p-1.5 text-slate-600 hover:text-slate-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProduct(prod.id)}
                          aria-label={`Delete ${prod.name}`}
                          className="p-1.5 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Management Tab */}
      {activeTab === 'orders' && (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          {allOrders.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No customer orders have been placed yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Order #</th>
                    <th className="py-3.5 px-4 font-semibold">Customer</th>
                    <th className="py-3.5 px-4 font-semibold">Items</th>
                    <th className="py-3.5 px-4 font-semibold">Total &amp; Payment</th>
                    <th className="py-3.5 px-4 font-semibold">Fulfillment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        {order.orderNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-900">{order.customerName}</p>
                        <p className="text-slate-500">{order.customerEmail}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {order.items.map((i) => `${i.quantity}x ${i.name} (${i.size})`).join(', ')}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums">
                        <p className="font-semibold text-slate-900">${order.total.toFixed(2)}</p>
                        <p className="text-slate-500">
                          {order.paymentMethod} · {order.paymentStatus}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          aria-label={`Update status for ${order.orderNumber}`}
                          value={order.status}
                          onChange={(e) =>
                            updateOrderStatus(order.id, e.target.value as OrderStatus)
                          }
                          className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                        >
                          {ORDER_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Returns & Refunds Tab */}
      {activeTab === 'returns' && (
        <div className="space-y-4">
          {returnQueue.length === 0 ? (
            <div className="border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500 bg-white">
              No return or refund requests in queue.
            </div>
          ) : (
            returnQueue.map((order) => (
              <div
                key={order.id}
                className="border border-slate-200 rounded-xl p-5 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 text-xs">
                  <p className="text-sm font-semibold text-slate-900">
                    <span className="font-mono">{order.orderNumber}</span> · {order.customerName} ($
                    {order.total.toFixed(2)})
                  </p>
                  <p className="text-slate-600">Reason: {order.returnReason}</p>
                  <p className="text-slate-500">
                    Current Return Status:{' '}
                    <span className="font-semibold text-slate-900">{order.returnStatus}</span> · Payment:{' '}
                    {order.paymentStatus}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {order.returnStatus === 'Requested' && (
                    <button
                      type="button"
                      onClick={() => processReturn(order, 'Approved')}
                      className="px-3.5 py-2 border border-slate-300 text-xs font-semibold rounded-lg text-slate-800 hover:border-slate-900"
                    >
                      Approve Return
                    </button>
                  )}
                  {(order.returnStatus === 'Requested' || order.returnStatus === 'Approved') && (
                    <>
                      <button
                        type="button"
                        onClick={() => processReturn(order, 'Refunded')}
                        className="px-3.5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
                      >
                        Issue Refund &amp; Restock
                      </button>
                      <button
                        type="button"
                        onClick={() => processReturn(order, 'Rejected')}
                        className="px-3.5 py-2 border border-red-200 text-red-700 text-xs font-medium rounded-lg hover:bg-red-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Customers Directory Tab */}
      {activeTab === 'customers' && (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Customer Name</th>
                  <th className="py-3.5 px-4 font-semibold">Email</th>
                  <th className="py-3.5 px-4 font-semibold">Phone</th>
                  <th className="py-3.5 px-4 font-semibold">Saved Addresses</th>
                  <th className="py-3.5 px-4 font-semibold">Orders Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allUsers.map((cust) => {
                  const custOrderCount = allOrders.filter((o) => o.userId === cust.uid).length;
                  return (
                    <tr key={cust.uid}>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {cust.displayName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{cust.email}</td>
                      <td className="py-3.5 px-4 text-slate-600">{cust.phone || '—'}</td>
                      <td className="py-3.5 px-4 tabular-nums text-slate-600">
                        {cust.addresses?.length || 0}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums font-semibold text-slate-900">
                        {custOrderCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40" role="dialog" aria-modal="true">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-2xl font-semibold text-slate-900">
              {form.id ? 'Edit Clothing Item' : 'Add New Clothing Item'}
            </h2>
            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={120}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Garment Type</label>
                  <select
                    value={form.garmentType}
                    onChange={(e) =>
                      setForm({ ...form, garmentType: e.target.value as GarmentType })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {GARMENT_TYPES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Inventory Stock</label>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    required
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Studio Photography Preset
                </label>
                <select
                  value={
                    STUDIO_IMAGE_PRESETS.some((p) => p.url === form.imageUrl)
                      ? form.imageUrl
                      : 'custom'
                  }
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      setForm({ ...form, imageUrl: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white mb-2"
                >
                  {STUDIO_IMAGE_PRESETS.map((p) => (
                    <option key={p.url} value={p.url}>
                      {p.label}
                    </option>
                  ))}
                  <option value="custom">Custom Image Path / URL</option>
                </select>
                <input
                  type="text"
                  required
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="/src/assets/images/..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Sizes (comma-separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={form.sizesInput}
                    onChange={(e) => setForm({ ...form, sizesInput: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Colours (comma-separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={form.colorsInput}
                    onChange={(e) => setForm({ ...form, colorsInput: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  minLength={5}
                  maxLength={1200}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <label className="flex items-center gap-2 text-slate-700 pt-1">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="accent-slate-900"
                />
                Feature this garment at the top of the collection
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800"
                >
                  {saving ? 'Saving...' : form.id ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
