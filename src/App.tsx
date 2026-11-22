import { useMemo, useRef, useState } from 'react';
import { ArrowRight, Search, ShieldCheck, Sparkles, Truck, X } from 'lucide-react';
import { AccountView } from './components/AccountView';
import { AdminView } from './components/AdminView';
import { CartCheckoutDrawer } from './components/CartCheckoutDrawer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailView } from './components/ProductDetailView';
import { StoreProvider, useStore } from './context/StoreContext';
import { HERO_BANNER_IMAGE } from './data/seedCatalog';
import { AppView, Category, GarmentType, Product } from './types';

const GARMENT_FILTERS: (GarmentType | 'All')[] = [
  'All',
  'Shirts',
  'T-Shirts',
  'Jeans',
  'Trousers',
  'Dresses',
  'Jackets',
];

function StorefrontApp() {
  const {
    user,
    isAdmin,
    profile,
    products,
    reviews,
    cart,
    toast,
    addToCart,
  } = useStore();

  const [activeView, setActiveView] = useState<AppView>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [selectedGarmentType, setSelectedGarmentType] = useState<GarmentType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const catalogRef = useRef<HTMLElement | null>(null);

  const activeProduct = useMemo(
    () => products.find((p) => p.id === activeProductId) || null,
    [products, activeProductId]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (selectedGarmentType !== 'All' && p.garmentType !== selectedGarmentType) return false;
      if (
        q.length > 0 &&
        !p.name.toLowerCase().includes(q) &&
        !p.description.toLowerCase().includes(q) &&
        !p.garmentType.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });

    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price-desc') {
      return [...list].sort((a, b) => b.price - a.price);
    }
    return list;
  }, [products, selectedCategory, selectedGarmentType, searchQuery, sortBy]);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const userFirstName = useMemo(() => {
    const raw = profile?.displayName || user?.displayName;
    return raw ? raw.split(' ')[0] : undefined;
  }, [profile, user]);

  const handleNavigateHome = (category: Category | 'All') => {
    setSelectedCategory(category);
    setSelectedGarmentType('All');
    setActiveProductId(null);
    setActiveView('home');
    if (category !== 'All') {
      window.setTimeout(() => {
        catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectProduct = (product: Product) => {
    setActiveProductId(product.id);
    setActiveView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickAdd = async (product: Product) => {
    await addToCart(product, product.sizes[0] || 'M', product.colors[0] || 'Standard', 1);
    setCartOpen(true);
  };

  const getProductRating = (productId: string) => {
    const prodReviews = reviews.filter((r) => r.productId === productId);
    if (prodReviews.length === 0) return { avg: null, count: 0 };
    const avg = prodReviews.reduce((s, r) => s + r.rating, 0) / prodReviews.length;
    return { avg, count: prodReviews.length };
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Navbar
        activeView={activeView}
        selectedCategory={selectedCategory}
        isAdmin={isAdmin}
        isSignedIn={Boolean(user)}
        userFirstName={userFirstName}
        cartCount={cartCount}
        onNavigateHome={handleNavigateHome}
        onNavigateAccount={() => {
          setActiveView('account');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateAdmin={() => {
          setActiveView('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCart={() => setCartOpen(true)}
      />

      <main className="flex-1">
        {activeView === 'home' && (
          <>
            {/* Section 1: Storefront Hero */}
            <section className="border-b border-slate-200 bg-slate-50">
              <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
                <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
                  <div className="space-y-4">
                    <p className="text-xs font-medium text-slate-500">
                      Seasonal Apparel Collection <span aria-hidden="true">·</span> Men&apos;s, Women&apos;s &amp; Kids&apos;
                    </p>
                    <h1 className="font-display text-4xl sm:text-5xl font-semibold text-slate-900 leading-[1.08] text-balance">
                      Tailored essentials crafted in natural fibres.
                    </h1>
                    <p className="text-[15px] text-slate-600 leading-relaxed max-w-md">
                      Browse structured shirting, Japanese selvedge denim, linen dresses, and everyday organic cotton staples designed to last.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => catalogRef.current?.scrollIntoView({ behavior: 'smooth' })}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
                    >
                      <span>Explore Collection</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView('account')}
                      className="px-5 py-3 border border-slate-300 bg-white text-slate-800 text-sm font-medium rounded-lg hover:border-slate-900 transition-colors whitespace-nowrap"
                    >
                      {user ? 'My Orders' : 'Customer Sign In'}
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <div className="relative h-64 sm:h-80 lg:h-full min-h-[340px] rounded-xl overflow-hidden border border-slate-200 bg-slate-200">
                    <img
                      src={HERO_BANNER_IMAGE}
                      alt="Verve & Loom seasonal clothing showroom featuring shirts, wool jackets, and pleated trousers"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/75 via-black/30 to-transparent text-white flex items-end justify-between">
                      <div>
                        <p className="text-xs text-white/80">Curated Wardrobe</p>
                        <p className="text-sm font-medium">
                          Complimentary shipping on orders over $120
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Search, Category Filters & Product Grid */}
            <section ref={catalogRef} className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                  <h2 className="font-display text-3xl sm:text-4xl font-semibold text-slate-900">
                    {selectedCategory === 'All' ? 'Complete Collection' : selectedCategory}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1 tabular-nums">
                    Showing {filteredProducts.length} clothing item{filteredProducts.length === 1 ? '' : 's'}
                  </p>
                </div>

                {/* Search & Sort Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      aria-label="Search clothing by name"
                      placeholder="Search shirts, jeans, dresses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-64 pl-9 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <select
                    aria-label="Sort products"
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')
                    }
                    className="px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                  >
                    <option value="featured">Sort: Featured</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Category & Garment Type Segmented Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
                  {(['All', "Men's Wear", "Women's Wear", "Kids' Wear"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cat === 'All' ? 'All Categories' : cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                  {GARMENT_FILTERS.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedGarmentType(type)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                        selectedGarmentType === type
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {type === 'All' ? 'All Garments' : type}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3-Column Product Grid */}
              {filteredProducts.length === 0 ? (
                <div className="border border-slate-200 rounded-xl p-12 text-center space-y-3">
                  <p className="text-sm font-medium text-slate-900">
                    No clothing items match your current filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedGarmentType('All');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                  {filteredProducts.map((product) => {
                    const { avg, count } = getProductRating(product.id);
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        ratingAvg={avg}
                        reviewCount={count}
                        onSelectProduct={handleSelectProduct}
                        onQuickAdd={handleQuickAdd}
                      />
                    );
                  })}
                </div>
              )}
            </section>

            {/* Section 3: Store Standards & Return Policy */}
            <section className="border-t border-slate-200 bg-slate-50">
              <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <Truck className="w-5 h-5 text-slate-900" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Tracked Nationwide Delivery
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Orders over $120 ship complimentary. Follow every milestone from confirmation to doorstep delivery in your account portal.
                  </p>
                </div>
                <div className="space-y-2">
                  <ShieldCheck className="w-5 h-5 text-slate-900" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    14-Day Return &amp; Refund Policy
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Request returns directly from delivered orders for a full refund to your UPI, Debit Card, Credit Card, or Net Banking source.
                  </p>
                </div>
                <div className="space-y-2">
                  <Sparkles className="w-5 h-5 text-slate-900" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Verified Natural Materials
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Combed organic cotton, European flax linen, and merino wool tailored with real-time stock accuracy.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {activeView === 'product' && activeProduct && (
          <ProductDetailView
            product={activeProduct}
            onBack={() => setActiveView('home')}
            onOpenCart={() => setCartOpen(true)}
          />
        )}

        {activeView === 'account' && (
          <AccountView onSelectProduct={handleSelectProduct} />
        )}

        {activeView === 'admin' && <AdminView />}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-display text-lg font-semibold text-slate-900">
              Verve &amp; Loom
            </span>
            <span aria-hidden="true">·</span>
            <span>&copy; {new Date().getFullYear()} Verve &amp; Loom Apparel</span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => handleNavigateHome("Men's Wear")}
              className="hover:text-slate-900"
            >
              Men&apos;s Wear
            </button>
            <button
              type="button"
              onClick={() => handleNavigateHome("Women's Wear")}
              className="hover:text-slate-900"
            >
              Women&apos;s Wear
            </button>
            <button
              type="button"
              onClick={() => handleNavigateHome("Kids' Wear")}
              className="hover:text-slate-900"
            >
              Kids&apos; Wear
            </button>
            <button
              type="button"
              onClick={() => setActiveView('account')}
              className="hover:text-slate-900"
            >
              Order Tracking &amp; Returns
            </button>
          </div>
        </div>
      </footer>

      <CartCheckoutDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onNavigateOrders={() => {
          setActiveView('account');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-lg border border-slate-800 max-w-sm"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <StorefrontApp />
      </StoreProvider>
    </ErrorBoundary>
  );
}
