import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  ADMIN_BOOTSTRAP_EMAIL,
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../firebase';
import { SEED_PRODUCTS } from '../data/seedCatalog';
import {
  Address,
  CartItem,
  FIELD_LIMITS,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ReturnStatus,
  Review,
  UserProfile,
} from '../types';

interface CheckoutPayload {
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentLast4: string;
}

interface StoreContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  profile: UserProfile | null;
  products: Product[];
  isCatalogSeeded: boolean;
  productsLoading: boolean;
  reviews: Review[];
  cart: CartItem[];
  orders: Order[];
  allOrders: Order[];
  allUsers: UserProfile[];
  toast: string | null;
  showToast: (message: string) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfileDetails: (displayName: string, phone: string, addresses: Address[]) => Promise<void>;
  addToCart: (product: Product, size: string, color: string, quantity: number) => Promise<void>;
  updateCartQuantity: (productId: string, size: string, color: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string, size: string, color: string) => Promise<void>;
  clearCart: () => Promise<void>;
  placeOrder: (payload: CheckoutPayload) => Promise<Order>;
  cancelOrder: (orderId: string) => Promise<void>;
  requestReturn: (orderId: string, reason: string) => Promise<void>;
  submitReview: (productId: string, rating: number, comment: string) => Promise<void>;
  saveProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  seedCatalog: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  processReturn: (order: Order, nextReturnStatus: ReturnStatus) => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function sanitizeCartItem(item: CartItem): CartItem {
  return {
    productId: item.productId,
    name: item.name.slice(0, FIELD_LIMITS.NAME_MAX),
    price: Number(item.price),
    imageUrl: item.imageUrl.slice(0, 500),
    size: item.size.slice(0, 20),
    color: item.color.slice(0, 40),
    quantity: Math.max(1, Math.min(FIELD_LIMITS.MAX_QTY_PER_ITEM, Math.floor(item.quantity))),
  };
}

function sanitizeAddress(addr: Address): Address {
  const clean: Address = {
    id: addr.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || `addr_${Date.now()}`,
    label: addr.label.trim().slice(0, 40) || 'Home',
    recipient: addr.recipient.trim().slice(0, 100),
    phone: addr.phone.trim().slice(0, 24),
    line1: addr.line1.trim().slice(0, 160),
    city: addr.city.trim().slice(0, 80),
    state: addr.state.trim().slice(0, 80),
    postalCode: addr.postalCode.trim().slice(0, 20),
    isDefault: Boolean(addr.isDefault),
  };
  if (addr.line2 && addr.line2.trim().length > 0) {
    clean.line2 = addr.line2.trim().slice(0, 120);
  }
  return clean;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [hasAdminDoc, setHasAdminDoc] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firestoreProducts, setFirestoreProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [autoSeedAttempted, setAutoSeedAttempted] = useState(false);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => {
      setToast((prev) => (prev === message ? null : prev));
    }, 3600);
  };

  const isAdmin = useMemo(() => {
    if (!user || !user.emailVerified) return false;
    return user.email === ADMIN_BOOTSTRAP_EMAIL || hasAdminDoc;
  }, [user, hasAdminDoc]);

  // 1. Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setHasAdminDoc(false);
        setProfile(null);
        setOrders([]);
        setAllOrders([]);
        setAllUsers([]);
        setAuthReady(true);
        return;
      }

      try {
        const adminSnap = await getDoc(doc(db, 'admins', nextUser.uid));
        setHasAdminDoc(adminSnap.exists());
      } catch {
        setHasAdminDoc(false);
      }

      // Ensure user profile exists
      const userRef = doc(db, 'users', nextUser.uid);
      try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          const initialProfile = {
            uid: nextUser.uid,
            email: nextUser.email || 'customer@verveloom.store',
            displayName: (nextUser.displayName || 'Customer').slice(0, FIELD_LIMITS.DISPLAY_NAME_MAX),
            phone: '',
            addresses: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, initialProfile);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${nextUser.uid}`);
      }

      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // 2. Public products listener
  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as Product);
        list.sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
        setFirestoreProducts(list);
        setProductsLoading(false);
      },
      (error) => {
        setProductsLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'products');
      }
    );
    return () => unsub();
  }, []);

  // 3. Public reviews listener
  useEffect(() => {
    const q = query(collection(db, 'reviews'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as Review);
        setReviews(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'reviews');
      }
    );
    return () => unsub();
  }, []);

  // 4. Auto-seed catalog once when Admin signs in and Firestore products are empty
  useEffect(() => {
    if (authReady && isAdmin && !productsLoading && firestoreProducts.length === 0 && !autoSeedAttempted) {
      setAutoSeedAttempted(true);
      seedCatalog().catch(console.error);
    }
  }, [authReady, isAdmin, productsLoading, firestoreProducts.length, autoSeedAttempted]);

  // 5. Authenticated User Profile, Cart & Orders listeners
  useEffect(() => {
    if (!authReady || !user) return;

    const userUnsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    );

    const cartUnsub = onSnapshot(
      doc(db, 'carts', user.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as { items?: CartItem[] };
          setCart(data.items || []);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `carts/${user.uid}`);
      }
    );

    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const ordersUnsub = onSnapshot(
      ordersQuery,
      (snap) => {
        setOrders(snap.docs.map((d) => d.data() as Order));
      },
      (error) => {
        // Fallback without composite index if index still building
        if (error instanceof Error && error.message.includes('index')) {
          const fallbackQ = query(collection(db, 'orders'), where('userId', '==', user.uid));
          onSnapshot(fallbackQ, (s) => {
            setOrders(s.docs.map((d) => d.data() as Order));
          });
        } else {
          handleFirestoreError(error, OperationType.LIST, 'orders');
        }
      }
    );

    return () => {
      userUnsub();
      cartUnsub();
      ordersUnsub();
    };
  }, [authReady, user]);

  // 6. Admin global listeners (all orders + all users)
  useEffect(() => {
    if (!authReady || !user || !isAdmin) {
      setAllOrders([]);
      setAllUsers([]);
      return;
    }

    const allOrdersUnsub = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        setAllOrders(snap.docs.map((d) => d.data() as Order));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );

    const allUsersUnsub = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        setAllUsers(snap.docs.map((d) => d.data() as UserProfile));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
    );

    return () => {
      allOrdersUnsub();
      allUsersUnsub();
    };
  }, [authReady, user, isAdmin]);

  const isCatalogSeeded = firestoreProducts.length > 0;
  const products = useMemo(() => {
    if (firestoreProducts.length > 0) return firestoreProducts;
    return SEED_PRODUCTS.map((item) => ({ ...item }));
  }, [firestoreProducts]);

  const persistCart = async (nextItems: CartItem[]) => {
    const cleanItems = nextItems.slice(0, FIELD_LIMITS.MAX_CART_ITEMS).map(sanitizeCartItem);
    setCart(cleanItems);
    if (!user) return;
    try {
      await setDoc(doc(db, 'carts', user.uid), {
        userId: user.uid,
        items: cleanItems,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `carts/${user.uid}`);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const guestItems = [...cart];
      const cred = await signInWithPopup(auth, googleProvider);
      const signedInUser = cred.user;
      if (guestItems.length > 0) {
        const cartSnap = await getDoc(doc(db, 'carts', signedInUser.uid));
        const existingItems: CartItem[] = cartSnap.exists()
          ? (cartSnap.data().items as CartItem[]) || []
          : [];
        const merged = [...existingItems];
        for (const gi of guestItems) {
          const idx = merged.findIndex(
            (m) => m.productId === gi.productId && m.size === gi.size && m.color === gi.color
          );
          if (idx >= 0) {
            merged[idx] = {
              ...merged[idx],
              quantity: Math.min(FIELD_LIMITS.MAX_QTY_PER_ITEM, merged[idx].quantity + gi.quantity),
            };
          } else {
            merged.push(gi);
          }
        }
        await setDoc(doc(db, 'carts', signedInUser.uid), {
          userId: signedInUser.uid,
          items: merged.slice(0, FIELD_LIMITS.MAX_CART_ITEMS).map(sanitizeCartItem),
          updatedAt: serverTimestamp(),
        });
      }
      showToast(`Signed in as ${signedInUser.displayName || signedInUser.email}`);
    } catch (error) {
      console.error(error);
      showToast('Sign-in was cancelled or blocked. Please try again.');
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCart([]);
    showToast('You have been securely logged out.');
  };

  const updateProfileDetails = async (displayName: string, phone: string, addresses: Address[]) => {
    if (!user || !profile) return;
    const cleanAddresses = addresses.slice(0, 5).map(sanitizeAddress);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim().slice(0, FIELD_LIMITS.DISPLAY_NAME_MAX) || profile.displayName,
        phone: phone.trim().slice(0, FIELD_LIMITS.PHONE_MAX),
        addresses: cleanAddresses,
        updatedAt: serverTimestamp(),
      });
      showToast('Profile and delivery addresses saved.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const addToCart = async (product: Product, size: string, color: string, quantity: number) => {
    if (product.stock <= 0) {
      showToast('This garment is currently out of stock.');
      return;
    }
    const existingIndex = cart.findIndex(
      (i) => i.productId === product.id && i.size === size && i.color === color
    );
    const next = [...cart];
    if (existingIndex >= 0) {
      const newQty = Math.min(
        product.stock,
        FIELD_LIMITS.MAX_QTY_PER_ITEM,
        next[existingIndex].quantity + quantity
      );
      next[existingIndex] = { ...next[existingIndex], quantity: newQty };
    } else {
      next.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        size,
        color,
        quantity: Math.min(product.stock, quantity),
      });
    }
    await persistCart(next);
    showToast(`Added ${product.name} (${size}) to bag.`);
  };

  const updateCartQuantity = async (
    productId: string,
    size: string,
    color: string,
    quantity: number
  ) => {
    if (quantity <= 0) {
      await removeFromCart(productId, size, color);
      return;
    }
    const product = products.find((p) => p.id === productId);
    const maxAllowed = product ? Math.min(product.stock, FIELD_LIMITS.MAX_QTY_PER_ITEM) : quantity;
    const next = cart.map((item) =>
      item.productId === productId && item.size === size && item.color === color
        ? { ...item, quantity: Math.min(maxAllowed, quantity) }
        : item
    );
    await persistCart(next);
  };

  const removeFromCart = async (productId: string, size: string, color: string) => {
    const next = cart.filter(
      (item) => !(item.productId === productId && item.size === size && item.color === color)
    );
    await persistCart(next);
  };

  const clearCart = async () => {
    await persistCart([]);
  };

  const placeOrder = async (payload: CheckoutPayload): Promise<Order> => {
    if (!user) throw new Error('Please sign in to place your order.');
    if (!isCatalogSeeded) {
      throw new Error('Store inventory is initializing. Please sign in with the store admin account once to activate live inventory.');
    }
    if (cart.length === 0) throw new Error('Your shopping bag is empty.');

    // Validate stock totals per productId
    const qtyByProduct: Record<string, number> = {};
    for (const item of cart) {
      qtyByProduct[item.productId] = (qtyByProduct[item.productId] || 0) + item.quantity;
    }
    for (const [productId, neededQty] of Object.entries(qtyByProduct)) {
      const prod = firestoreProducts.find((p) => p.id === productId);
      if (!prod || prod.stock < neededQty) {
        throw new Error(`Insufficient stock for ${prod?.name || productId}. Available: ${prod?.stock ?? 0}`);
      }
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = subtotal >= 120 ? 0 : 12;
    const total = Number((subtotal + shippingFee).toFixed(2));

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const orderNumber = `VL-${Math.floor(100000 + Math.random() * 900000)}`;
    const paymentTxnId = `TXN${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`;

    const cleanAddress = sanitizeAddress(payload.shippingAddress);
    const cleanItems = cart.map(sanitizeCartItem);

    const newOrderDoc = {
      id: orderId,
      orderNumber,
      userId: user.uid,
      customerName: (profile?.displayName || user.displayName || cleanAddress.recipient).slice(0, 100),
      customerEmail: user.email || 'customer@verveloom.store',
      items: cleanItems,
      subtotal,
      shippingFee,
      total,
      shippingAddress: cleanAddress,
      paymentMethod: payload.paymentMethod,
      paymentLast4: payload.paymentLast4.slice(0, 48),
      paymentTxnId,
      paymentStatus: 'Paid' as const,
      status: 'Confirmed' as const,
      returnStatus: 'None' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'orders', orderId), newOrderDoc);

      // Decrement inventory automatically
      for (const [productId, neededQty] of Object.entries(qtyByProduct)) {
        const prod = firestoreProducts.find((p) => p.id === productId)!;
        batch.update(doc(db, 'products', productId), {
          stock: Math.max(0, prod.stock - neededQty),
          updatedAt: serverTimestamp(),
        });
      }

      // Clear cart
      batch.set(doc(db, 'carts', user.uid), {
        userId: user.uid,
        items: [],
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      setCart([]);
      showToast(`Order ${orderNumber} confirmed.`);

      return {
        ...newOrderDoc,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `orders/${orderId}`);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'Cancelled',
        updatedAt: serverTimestamp(),
      });
      showToast('Order cancelled.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const requestReturn = async (orderId: string, reason: string) => {
    const cleanReason = reason.trim().slice(0, FIELD_LIMITS.RETURN_REASON_MAX);
    if (cleanReason.length < 3) {
      showToast('Please provide a brief reason for your return request.');
      return;
    }
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        returnStatus: 'Requested',
        returnReason: cleanReason,
        returnRequestedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast('Return and refund request submitted.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const submitReview = async (productId: string, rating: number, comment: string) => {
    if (!user) {
      showToast('Please sign in to submit a product review.');
      return;
    }
    const cleanComment = comment.trim().slice(0, FIELD_LIMITS.REVIEW_MAX);
    if (cleanComment.length < FIELD_LIMITS.REVIEW_MIN) {
      showToast('Please write at least a few words for your review.');
      return;
    }
    const verifiedPurchase = orders.some(
      (o) => o.status !== 'Cancelled' && o.items.some((i) => i.productId === productId)
    );
    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      await setDoc(doc(db, 'reviews', reviewId), {
        id: reviewId,
        productId,
        userId: user.uid,
        authorName: (profile?.displayName || user.displayName || 'Customer').slice(0, 80),
        rating: Math.max(1, Math.min(5, Math.round(rating))),
        comment: cleanComment,
        verifiedPurchase,
        createdAt: serverTimestamp(),
      });
      showToast('Thank you for your review.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `reviews/${reviewId}`);
    }
  };

  const seedCatalog = async () => {
    try {
      const batch = writeBatch(db);
      for (const item of SEED_PRODUCTS) {
        batch.set(doc(db, 'products', item.id), {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
      showToast('Store catalog synchronized with live inventory.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  };

  const saveProduct = async (
    productInput: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => {
    const productId =
      productInput.id && productInput.id.trim().length > 0
        ? productInput.id.replace(/[^a-zA-Z0-9_-]/g, '')
        : `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const existing = firestoreProducts.find((p) => p.id === productId);
    const payload = {
      id: productId,
      name: productInput.name.trim().slice(0, FIELD_LIMITS.NAME_MAX),
      category: productInput.category,
      garmentType: productInput.garmentType,
      description: productInput.description.trim().slice(0, FIELD_LIMITS.DESC_MAX),
      price: Math.max(1, Number(productInput.price)),
      imageUrl: productInput.imageUrl.trim().slice(0, 500),
      sizes: productInput.sizes.slice(0, 10),
      colors: productInput.colors.slice(0, 10),
      stock: Math.max(0, Math.floor(Number(productInput.stock))),
      featured: Boolean(productInput.featured),
      updatedAt: serverTimestamp(),
    };

    try {
      if (existing) {
        await updateDoc(doc(db, 'products', productId), payload);
        showToast(`Updated ${payload.name}.`);
      } else {
        await setDoc(doc(db, 'products', productId), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        showToast(`Added ${payload.name} to catalog.`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `products/${productId}`);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      showToast('Product removed from catalog.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        updatedAt: serverTimestamp(),
      });
      showToast(`Order status updated to ${status}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const processReturn = async (order: Order, nextReturnStatus: ReturnStatus) => {
    try {
      if (nextReturnStatus === 'Refunded') {
        const batch = writeBatch(db);
        batch.update(doc(db, 'orders', order.id), {
          returnStatus: 'Refunded',
          paymentStatus: 'Refunded',
          updatedAt: serverTimestamp(),
        });

        // Restore inventory stock on refund
        const qtyByProduct: Record<string, number> = {};
        for (const item of order.items) {
          qtyByProduct[item.productId] = (qtyByProduct[item.productId] || 0) + item.quantity;
        }
        for (const [productId, restoreQty] of Object.entries(qtyByProduct)) {
          const prod = firestoreProducts.find((p) => p.id === productId);
          if (prod) {
            batch.update(doc(db, 'products', productId), {
              stock: prod.stock + restoreQty,
              updatedAt: serverTimestamp(),
            });
          }
        }
        await batch.commit();
        showToast(`Refund processed for ${order.orderNumber} and inventory restored.`);
      } else {
        await updateDoc(doc(db, 'orders', order.id), {
          returnStatus: nextReturnStatus,
          updatedAt: serverTimestamp(),
        });
        showToast(`Return status updated to ${nextReturnStatus}.`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${order.id}`);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        user,
        authReady,
        isAdmin,
        profile,
        products,
        isCatalogSeeded,
        productsLoading,
        reviews,
        cart,
        orders,
        allOrders,
        allUsers,
        toast,
        showToast,
        loginWithGoogle,
        logout,
        updateProfileDetails,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        placeOrder,
        cancelOrder,
        requestReturn,
        submitReview,
        saveProduct,
        deleteProduct,
        seedCatalog,
        updateOrderStatus,
        processReturn,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
