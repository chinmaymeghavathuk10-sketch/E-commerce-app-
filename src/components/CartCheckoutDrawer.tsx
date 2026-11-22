import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Landmark,
  Lock,
  Minus,
  Plus,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Address, Order, PaymentMethod } from '../types';
import { ProductImage } from './ProductImage';

interface CartCheckoutDrawerProps {
  open: boolean;
  onClose: () => void;
  onNavigateOrders: () => void;
}

type DrawerStep = 'bag' | 'checkout' | 'confirmation';

export function CartCheckoutDrawer({
  open,
  onClose,
  onNavigateOrders,
}: CartCheckoutDrawerProps) {
  const {
    user,
    profile,
    cart,
    products,
    isCatalogSeeded,
    loginWithGoogle,
    updateProfileDetails,
    updateCartQuantity,
    removeFromCart,
    placeOrder,
  } = useStore();

  const [step, setStep] = useState<DrawerStep>('bag');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  const [newAddress, setNewAddress] = useState<Omit<Address, 'id' | 'isDefault'>>({
    label: 'Home',
    recipient: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [upiId, setUpiId] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [netBankingId, setNetBankingId] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (open) {
      setErrorMsg(null);
      if (step === 'confirmation' && cart.length > 0) {
        setStep('bag');
      }
    }
  }, [open]);

  useEffect(() => {
    if (profile) {
      const def = profile.addresses.find((a) => a.isDefault) || profile.addresses[0];
      if (def) {
        setSelectedAddressId(def.id);
      } else {
        setSelectedAddressId('new');
        setNewAddress((prev) => ({
          ...prev,
          recipient: prev.recipient || profile.displayName,
          phone: prev.phone || profile.phone || '',
        }));
      }
    }
  }, [profile]);

  if (!open) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = cart.length === 0 ? 0 : subtotal >= 120 ? 0 : 12;
  const total = subtotal + shippingFee;
  const freeShippingRemaining = Math.max(0, 120 - subtotal);

  const formatCardNumber = (val: string) =>
    val
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(.{4})/g, '$1 ')
      .trim();

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user) {
      setErrorMsg('Please sign in to complete your order.');
      return;
    }

    let shippingAddress: Address;
    if (selectedAddressId !== 'new' && profile) {
      const found = profile.addresses.find((a) => a.id === selectedAddressId);
      if (!found) {
        setErrorMsg('Please select a valid delivery address.');
        return;
      }
      shippingAddress = found;
    } else {
      if (
        newAddress.recipient.trim().length < 2 ||
        newAddress.phone.trim().length < 5 ||
        newAddress.line1.trim().length < 3 ||
        newAddress.city.trim().length < 1 ||
        newAddress.state.trim().length < 1 ||
        newAddress.postalCode.trim().length < 3
      ) {
        setErrorMsg('Please complete all required delivery address fields.');
        return;
      }
      shippingAddress = {
        ...newAddress,
        id: `addr_${Date.now()}`,
        isDefault: (profile?.addresses.length || 0) === 0,
      };
    }

    let paymentLast4 = '';
    if (paymentMethod === 'UPI') {
      if (!upiId.includes('@') || upiId.trim().length < 5) {
        setErrorMsg('Please enter a valid UPI ID (e.g., name@okaxis).');
        return;
      }
      paymentLast4 = upiId.trim();
    } else if (paymentMethod === 'Debit Card' || paymentMethod === 'Credit Card') {
      const digits = cardNumber.replace(/\s/g, '');
      if (cardHolder.trim().length < 2 || digits.length < 16 || cardExpiry.length < 5 || cardCvv.length < 3) {
        setErrorMsg('Please enter complete cardholder name, 16-digit card number, MM/YY expiry, and CVV.');
        return;
      }
      paymentLast4 = `•••• ${digits.slice(-4)}`;
    } else if (paymentMethod === 'Net Banking') {
      if (netBankingId.trim().length < 3) {
        setErrorMsg('Please enter your Net Banking customer ID.');
        return;
      }
      paymentLast4 = bankName;
    }

    setProcessing(true);
    try {
      // Simulate payment gateway authorization
      await new Promise((res) => setTimeout(res, 1100));

      if (selectedAddressId === 'new' && saveNewAddress && profile && profile.addresses.length < 5) {
        await updateProfileDetails(
          profile.displayName,
          profile.phone || shippingAddress.phone,
          [...profile.addresses, shippingAddress]
        );
      }

      const order = await placeOrder({
        shippingAddress,
        paymentMethod,
        paymentLast4,
      });
      setConfirmedOrder(order);
      setStep('confirmation');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to process payment.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping Bag">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => setStep('bag')}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg"
                aria-label="Back to bag"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="font-display text-2xl font-semibold text-slate-900">
              {step === 'bag'
                ? 'Shopping Bag'
                : step === 'checkout'
                ? 'Checkout & Payment'
                : 'Order Confirmed'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 'bag' && (
            <>
              {cart.length === 0 ? (
                <div className="py-16 text-center space-y-4">
                  <p className="text-sm text-slate-600">Your shopping bag is currently empty.</p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Browse Clothing
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                    {freeShippingRemaining > 0
                      ? `Add $${freeShippingRemaining.toFixed(2)} more for complimentary shipping.`
                      : 'Your order qualifies for complimentary shipping.'}
                  </div>

                  <div className="divide-y divide-slate-200">
                    {cart.map((item) => {
                      const prod = products.find((p) => p.id === item.productId);
                      const maxStock = prod ? prod.stock : 20;
                      return (
                        <div
                          key={`${item.productId}-${item.size}-${item.color}`}
                          className="py-4 flex gap-4"
                        >
                          <div className="w-24 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                            <ProductImage
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-semibold text-slate-900 truncate">
                                {item.name}
                              </h3>
                              <button
                                type="button"
                                aria-label={`Remove ${item.name}`}
                                onClick={() => removeFromCart(item.productId, item.size, item.color)}
                                className="text-slate-400 hover:text-red-600 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-xs text-slate-500">
                              Size: {item.size} <span aria-hidden="true">·</span> Colour: {item.color}
                            </p>
                            <div className="flex items-center justify-between pt-1">
                              <div className="inline-flex items-center border border-slate-200 rounded-md">
                                <button
                                  type="button"
                                  aria-label="Decrease quantity"
                                  onClick={() =>
                                    updateCartQuantity(item.productId, item.size, item.color, item.quantity - 1)
                                  }
                                  className="p-1.5 text-slate-600 hover:text-slate-900"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-2.5 text-xs font-semibold tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  aria-label="Increase quantity"
                                  disabled={item.quantity >= maxStock}
                                  onClick={() =>
                                    updateCartQuantity(item.productId, item.size, item.color, item.quantity + 1)
                                  }
                                  className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-35"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {step === 'checkout' && (
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-6">
              {errorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                  {errorMsg}
                </div>
              )}

              {!isCatalogSeeded && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                  Store inventory is awaiting first-time activation by the store administrator.
                </div>
              )}

              {/* 1. Delivery Address */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">1. Delivery Address</h3>

                {profile && profile.addresses.length > 0 && (
                  <div className="space-y-2">
                    {profile.addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`block p-3.5 rounded-lg border cursor-pointer transition-colors ${
                          selectedAddressId === addr.id
                            ? 'border-slate-900 bg-slate-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="deliveryAddress"
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="mt-1 accent-slate-900"
                          />
                          <div className="text-xs space-y-0.5">
                            <p className="font-semibold text-slate-900">
                              {addr.label} <span aria-hidden="true">·</span> {addr.recipient}
                            </p>
                            <p className="text-slate-600">
                              {addr.line1}
                              {addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state}{' '}
                              {addr.postalCode}
                            </p>
                            <p className="text-slate-500">Phone: {addr.phone}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                    <label
                      className={`block p-3 rounded-lg border cursor-pointer text-xs font-medium ${
                        selectedAddressId === 'new'
                          ? 'border-slate-900 bg-slate-50 text-slate-900'
                          : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliveryAddress"
                        checked={selectedAddressId === 'new'}
                        onChange={() => setSelectedAddressId('new')}
                        className="mr-2.5 accent-slate-900"
                      />
                      Deliver to a new address
                    </label>
                  </div>
                )}

                {selectedAddressId === 'new' && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <input
                      type="text"
                      required
                      placeholder="Address Label (e.g. Home)"
                      value={newAddress.label}
                      onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                      className="col-span-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Recipient Full Name"
                      value={newAddress.recipient}
                      onChange={(e) => setNewAddress({ ...newAddress, recipient: e.target.value })}
                      className="col-span-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="Phone Number"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="col-span-2 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Street Address / Flat / Building"
                      value={newAddress.line1}
                      onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                      className="col-span-2 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="col-span-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                    <input
                      type="text"
                      required
                      placeholder="State"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="col-span-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Postal / PIN Code"
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      className="col-span-2 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                    {profile && profile.addresses.length < 5 && (
                      <label className="col-span-2 flex items-center gap-2 text-xs text-slate-600 pt-1">
                        <input
                          type="checkbox"
                          checked={saveNewAddress}
                          onChange={(e) => setSaveNewAddress(e.target.checked)}
                          className="accent-slate-900"
                        />
                        Save this address to my profile for future orders
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Online Payment Gateway */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">2. Payment Method</h3>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Lock className="w-3.5 h-3.5" />
                    Encrypted Gateway
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'UPI', label: 'UPI', icon: Smartphone },
                      { id: 'Debit Card', label: 'Debit Card', icon: CreditCard },
                      { id: 'Credit Card', label: 'Credit Card', icon: CreditCard },
                      { id: 'Net Banking', label: 'Net Banking', icon: Landmark },
                    ] as const
                  ).map(({ id, label, icon: Icon }) => {
                    const active = paymentMethod === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPaymentMethod(id)}
                        className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium rounded-lg border transition-colors ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="whitespace-nowrap">{label}</span>
                      </button>
                    );
                  })}
                </div>

                {paymentMethod === 'UPI' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                    <label htmlFor="upi-id" className="block text-xs font-medium text-slate-700">
                      Enter UPI ID (Google Pay, PhonePe, Paytm, BHIM)
                    </label>
                    <input
                      id="upi-id"
                      type="text"
                      required
                      placeholder="username@okaxis"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>
                )}

                {(paymentMethod === 'Debit Card' || paymentMethod === 'Credit Card') && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Name on Card"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="col-span-2 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      placeholder="Card Number (16 digits)"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      className="col-span-2 px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      className="col-span-1 px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                    <input
                      type="password"
                      required
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="CVV"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="col-span-1 px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>
                )}

                {paymentMethod === 'Net Banking' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                    <div>
                      <label htmlFor="bank-select" className="block text-xs font-medium text-slate-700 mb-1">
                        Select Bank
                      </label>
                      <select
                        id="bank-select"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                      >
                        <option>HDFC Bank</option>
                        <option>ICICI Bank</option>
                        <option>State Bank of India</option>
                        <option>Axis Bank</option>
                        <option>Kotak Mahindra Bank</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Customer / Net Banking User ID"
                      value={netBankingId}
                      onChange={(e) => setNetBankingId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>
                )}
              </div>
            </form>
          )}

          {step === 'confirmation' && confirmedOrder && (
            <div className="space-y-6 py-4">
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="w-5 h-5" />
                  <h3 className="text-base font-semibold">
                    Order {confirmedOrder.orderNumber} Confirmed — Preparing Shipment
                  </h3>
                </div>
                <p className="text-xs text-emerald-800">
                  Payment of <span className="font-semibold tabular-nums">${confirmedOrder.total.toFixed(2)}</span>{' '}
                  verified via {confirmedOrder.paymentMethod} ({confirmedOrder.paymentLast4}).
                </p>
                <p className="text-xs font-mono text-emerald-700">
                  Transaction ID: {confirmedOrder.paymentTxnId}
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Order Receipt Summary
                </h4>
                <div className="divide-y divide-slate-100">
                  {confirmedOrder.items.map((item) => (
                    <div
                      key={`${item.productId}-${item.size}-${item.color}`}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-slate-500">
                          {item.size} · {item.color} · Qty {item.quantity}
                        </p>
                      </div>
                      <span className="font-semibold tabular-nums text-slate-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-slate-200 text-xs space-y-1 text-slate-600">
                  <p className="font-semibold text-slate-900">Delivering To</p>
                  <p>
                    {confirmedOrder.shippingAddress.recipient} — {confirmedOrder.shippingAddress.line1},{' '}
                    {confirmedOrder.shippingAddress.city}, {confirmedOrder.shippingAddress.state}{' '}
                    {confirmedOrder.shippingAddress.postalCode}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateOrders();
                  }}
                  className="flex-1 py-3 px-4 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Track Order &amp; History
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('bag');
                    onClose();
                  }}
                  className="flex-1 py-3 px-4 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg hover:border-slate-400 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {step !== 'confirmation' && cart.length > 0 && (
          <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="tabular-nums">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="tabular-nums">
                  {shippingFee === 0 ? 'Complimentary' : `$${shippingFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-slate-900 pt-2 border-t border-slate-200 text-base">
                <span>Total</span>
                <span className="tabular-nums">${total.toFixed(2)}</span>
              </div>
            </div>

            {step === 'bag' ? (
              user ? (
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full py-3.5 px-6 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Proceed to Checkout
                </button>
              ) : (
                <button
                  type="button"
                  onClick={loginWithGoogle}
                  className="w-full py-3.5 px-6 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Sign In with Google to Checkout
                </button>
              )
            ) : (
              <button
                type="submit"
                form="checkout-form"
                disabled={processing || !isCatalogSeeded}
                className="w-full py-3.5 px-6 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                {processing
                  ? 'Authorizing Payment...'
                  : `Pay $${total.toFixed(2)} & Place Order`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
