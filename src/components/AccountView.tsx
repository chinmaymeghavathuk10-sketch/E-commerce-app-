import { useEffect, useState } from 'react';
import {
  Check,
  LogOut,
  MapPin,
  Package,
  Plus,
  RotateCcw,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Address, Order, OrderStatus, Product } from '../types';
import { ProductImage } from './ProductImage';

interface AccountViewProps {
  onSelectProduct: (product: Product) => void;
}

type AccountTab = 'orders' | 'profile' | 'returns';

const TRACKING_STEPS: OrderStatus[] = [
  'Confirmed',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

function formatDate(ts: unknown): string {
  if (!ts) return 'Just now';
  if (ts instanceof Date) return ts.toLocaleDateString();
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate().toLocaleDateString();
  }
  return 'Recently';
}

export function AccountView({ onSelectProduct }: AccountViewProps) {
  const {
    user,
    profile,
    orders,
    products,
    loginWithGoogle,
    logout,
    updateProfileDetails,
    cancelOrder,
    requestReturn,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AccountTab>('orders');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrForm, setAddrForm] = useState<Omit<Address, 'id'>>({
    label: 'Home',
    recipient: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    isDefault: false,
  });

  const [returnTargetOrder, setReturnTargetOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  if (!user) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 flex justify-center">
        <div className="max-w-md w-full border border-slate-200 rounded-xl p-8 bg-white space-y-6 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
            <UserIcon className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-semibold text-slate-900">
              Customer Account
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sign in or create your Verve &amp; Loom account to manage delivery addresses, track shipments, review garments, and request returns.
            </p>
          </div>
          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full py-3 px-5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);
    try {
      await updateProfileDetails(displayName, phone, profile.addresses);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const newAddr: Address = {
      ...addrForm,
      id: `addr_${Date.now()}`,
      isDefault: profile.addresses.length === 0 || addrForm.isDefault,
    };
    const updated = addrForm.isDefault
      ? profile.addresses.map((a) => ({ ...a, isDefault: false })).concat(newAddr)
      : [...profile.addresses, newAddr];

    await updateProfileDetails(profile.displayName, profile.phone, updated);
    setShowAddressForm(false);
    setAddrForm({
      label: 'Home',
      recipient: '',
      phone: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      isDefault: false,
    });
  };

  const handleDeleteAddress = async (id: string) => {
    if (!profile) return;
    const remaining = profile.addresses.filter((a) => a.id !== id);
    if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
      remaining[0] = { ...remaining[0], isDefault: true };
    }
    await updateProfileDetails(profile.displayName, profile.phone, remaining);
  };

  const handleSetDefaultAddress = async (id: string) => {
    if (!profile) return;
    const updated = profile.addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    await updateProfileDetails(profile.displayName, profile.phone, updated);
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnTargetOrder) return;
    setSubmittingReturn(true);
    try {
      await requestReturn(returnTargetOrder.id, returnReason);
      setReturnTargetOrder(null);
      setReturnReason('');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const returnOrders = orders.filter((o) => o.returnStatus !== 'None');

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Account Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs text-slate-500">Customer Portal</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-slate-900">
            {profile?.displayName || user.displayName || 'Your Account'}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">{user.email}</p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-colors self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>

      {/* Tab Controls */}
      <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
        {(
          [
            { id: 'orders', label: `Orders & Tracking (${orders.length})`, icon: Package },
            { id: 'profile', label: 'Profile & Addresses', icon: MapPin },
            { id: 'returns', label: `Returns & Refunds (${returnOrders.length})`, icon: RotateCcw },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
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

      {/* Orders & Tracking Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="border border-slate-200 rounded-xl p-10 text-center space-y-2">
              <p className="text-sm font-medium text-slate-900">No orders placed yet</p>
              <p className="text-xs text-slate-500">
                Once you complete a purchase, live shipment tracking and digital receipts will appear here.
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const stepIdx = TRACKING_STEPS.indexOf(order.status);
              return (
                <article
                  key={order.id}
                  className="border border-slate-200 rounded-xl bg-white overflow-hidden"
                >
                  {/* Order Top Summary */}
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex flex-wrap items-center gap-6">
                      <div>
                        <span className="text-slate-500 block">Order Number</span>
                        <span className="font-mono font-semibold text-slate-900">
                          {order.orderNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Placed On</span>
                        <span className="font-medium text-slate-900 tabular-nums">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Payment</span>
                        <span className="font-medium text-slate-900">
                          {order.paymentMethod} ({order.paymentLast4}) · {order.paymentStatus}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Total</span>
                        <span className="font-semibold text-slate-900 tabular-nums">
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.status === 'Confirmed' && (
                        <button
                          type="button"
                          onClick={() => cancelOrder(order.id)}
                          className="px-3 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 rounded-lg font-medium transition-colors"
                        >
                          Cancel Order
                        </button>
                      )}
                      {order.status === 'Delivered' && order.returnStatus === 'None' && (
                        <button
                          type="button"
                          onClick={() => setReturnTargetOrder(order)}
                          className="px-3 py-1.5 border border-slate-300 text-slate-800 hover:border-slate-900 rounded-lg font-medium transition-colors"
                        >
                          Request Return / Refund
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Visual Order Tracking Bar */}
                  <div className="px-6 py-5 border-b border-slate-100">
                    {order.status === 'Cancelled' ? (
                      <p className="text-xs font-semibold text-red-700">
                        Order Status: Cancelled
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900">
                            Tracking Status: {order.status}
                          </span>
                          {order.returnStatus !== 'None' && (
                            <span className="font-medium text-blue-700">
                              Return Status: {order.returnStatus}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {TRACKING_STEPS.map((st, idx) => {
                            const reached = stepIdx >= idx;
                            return (
                              <div key={st} className="space-y-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    reached ? 'bg-slate-900' : 'bg-slate-200'
                                  }`}
                                />
                                <p
                                  className={`text-[11px] truncate ${
                                    reached ? 'font-semibold text-slate-900' : 'text-slate-400'
                                  }`}
                                >
                                  {st}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Items & Shipping Info */}
                  <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 divide-y divide-slate-100">
                      {order.items.map((item) => {
                        const matchedProduct = products.find((p) => p.id === item.productId);
                        return (
                          <div
                            key={`${item.productId}-${item.size}-${item.color}`}
                            className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-16 h-14 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                                <ProductImage
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                  {item.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Size {item.size} · {item.color} · Qty {item.quantity}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              <span className="text-sm font-semibold tabular-nums text-slate-900">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                              {matchedProduct && (
                                <button
                                  type="button"
                                  onClick={() => onSelectProduct(matchedProduct)}
                                  className="text-xs font-medium text-blue-700 hover:underline whitespace-nowrap"
                                >
                                  Review Item
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="lg:col-span-4 lg:border-l lg:border-slate-100 lg:pl-6 text-xs space-y-1.5 text-slate-600">
                      <p className="font-semibold text-slate-900">Delivery Address</p>
                      <p>{order.shippingAddress.recipient}</p>
                      <p>
                        {order.shippingAddress.line1}
                        {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}
                      </p>
                      <p>
                        {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                        {order.shippingAddress.postalCode}
                      </p>
                      <p className="text-slate-500">Phone: {order.shippingAddress.phone}</p>
                      <p className="pt-2 font-mono text-[11px] text-slate-400">
                        Txn: {order.paymentTxnId}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* Profile & Addresses Tab */}
      {activeTab === 'profile' && profile && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form
            onSubmit={handleSaveProfile}
            className="lg:col-span-5 border border-slate-200 rounded-xl p-6 space-y-4 h-fit"
          >
            <h2 className="font-display text-2xl font-semibold text-slate-900">
              Personal Details
            </h2>
            <div>
              <label htmlFor="profile-name" className="block text-xs font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                id="profile-name"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label htmlFor="profile-email" className="block text-xs font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <input
                id="profile-email"
                type="email"
                disabled
                value={profile.email}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 text-slate-500 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="profile-phone" className="block text-xs font-medium text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                id="profile-phone"
                type="tel"
                placeholder="+1 555 234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
            >
              {savingProfile ? 'Saving...' : 'Save Personal Details'}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-slate-900">
                Delivery Addresses ({profile.addresses.length}/5)
              </h2>
              {profile.addresses.length < 5 && (
                <button
                  type="button"
                  onClick={() => setShowAddressForm((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Address</span>
                </button>
              )}
            </div>

            {showAddressForm && (
              <form
                onSubmit={handleAddAddress}
                className="border border-slate-200 rounded-xl p-5 bg-slate-50 grid grid-cols-2 gap-3"
              >
                <input
                  type="text"
                  required
                  placeholder="Label (Home / Office)"
                  value={addrForm.label}
                  onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
                  className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  required
                  placeholder="Recipient Name"
                  value={addrForm.recipient}
                  onChange={(e) => setAddrForm({ ...addrForm, recipient: e.target.value })}
                  className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                />
                <input
                  type="tel"
                  required
                  placeholder="Contact Phone"
                  value={addrForm.phone}
                  onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                  className="col-span-2 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  required
                  placeholder="Street Address Line 1"
                  value={addrForm.line1}
                  onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })}
                  className="col-span-2 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Apartment / Suite (Optional)"
                  value={addrForm.line2 || ''}
                  onChange={(e) => setAddrForm({ ...addrForm, line2: e.target.value })}
                  className="col-span-2 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={addrForm.city}
                  onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                  className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  required
                  placeholder="State"
                  value={addrForm.state}
                  onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                  className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  required
                  placeholder="Postal / PIN Code"
                  value={addrForm.postalCode}
                  onChange={(e) => setAddrForm({ ...addrForm, postalCode: e.target.value })}
                  className="col-span-2 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                />
                <label className="col-span-2 flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={addrForm.isDefault}
                    onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })}
                    className="accent-slate-900"
                  />
                  Set as default delivery address
                </label>
                <div className="col-span-2 flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
                  >
                    Save Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg bg-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {profile.addresses.length === 0 ? (
              <div className="border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
                No saved delivery addresses yet. Add one above for faster checkout.
              </div>
            ) : (
              <div className="space-y-3">
                {profile.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="border border-slate-200 rounded-xl p-5 flex items-start justify-between gap-4 bg-white"
                  >
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">{addr.label}</span>
                        {addr.isDefault && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <Check className="w-3.5 h-3.5" />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-slate-800">{addr.recipient}</p>
                      <p className="text-slate-600">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state}{' '}
                        {addr.postalCode}
                      </p>
                      <p className="text-slate-500">Phone: {addr.phone}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-xs font-medium text-slate-700 hover:text-slate-900 underline"
                        >
                          Make Default
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label={`Remove ${addr.label} address`}
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Returns & Refunds Tab */}
      {activeTab === 'returns' && (
        <div className="space-y-6">
          <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Verve &amp; Loom 14-Day Return &amp; Refund Policy
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              Unworn garments with original tags may be returned within 14 days of delivery. Once our store team approves and completes your return inspection, your full refund is issued directly to your original UPI, Card, or Net Banking payment method and inventory is restocked.
            </p>
          </div>

          {returnOrders.length === 0 ? (
            <div className="border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
              You have no active or past return requests. Delivered orders can be returned from the Orders &amp; Tracking tab.
            </div>
          ) : (
            <div className="space-y-4">
              {returnOrders.map((o) => (
                <div
                  key={o.id}
                  className="border border-slate-200 rounded-xl p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <p className="font-mono font-semibold text-slate-900 text-sm">
                      {o.orderNumber} <span aria-hidden="true">·</span> ${o.total.toFixed(2)}
                    </p>
                    <p className="text-slate-600">Reason: {o.returnReason}</p>
                    <p className="text-slate-500">
                      Refund Destination: {o.paymentMethod} ({o.paymentLast4})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Return &amp; Refund Status</p>
                    <p className="text-sm font-semibold text-slate-900">{o.returnStatus}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Return Request Modal */}
      {returnTargetOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40" role="dialog" aria-modal="true">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-display text-2xl font-semibold text-slate-900">
              Request Return &amp; Refund
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Order <span className="font-mono font-semibold">{returnTargetOrder.orderNumber}</span> (${returnTargetOrder.total.toFixed(2)}) will be refunded to your {returnTargetOrder.paymentMethod} account upon approval.
            </p>
            <form onSubmit={handleSubmitReturn} className="space-y-4">
              <div>
                <label htmlFor="return-reason" className="block text-xs font-medium text-slate-700 mb-1">
                  Reason for Return
                </label>
                <textarea
                  id="return-reason"
                  rows={3}
                  required
                  minLength={3}
                  maxLength={500}
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="e.g., Size runs slightly large, requesting full refund..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReturnTargetOrder(null);
                    setReturnReason('');
                  }}
                  className="px-4 py-2 text-xs font-medium border border-slate-200 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  {submittingReturn ? 'Submitting...' : 'Submit Return Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
