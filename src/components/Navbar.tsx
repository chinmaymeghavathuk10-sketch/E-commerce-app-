import { ShoppingBag } from 'lucide-react';
import { AppView, Category } from '../types';

interface NavbarProps {
  activeView: AppView;
  selectedCategory: Category | 'All';
  isAdmin: boolean;
  isSignedIn: boolean;
  userFirstName?: string;
  cartCount: number;
  onNavigateHome: (category: Category | 'All') => void;
  onNavigateAccount: () => void;
  onNavigateAdmin: () => void;
  onOpenCart: () => void;
}

export function Navbar({
  activeView,
  selectedCategory,
  isAdmin,
  isSignedIn,
  userFirstName,
  cartCount,
  onNavigateHome,
  onNavigateAccount,
  onNavigateAdmin,
  onOpenCart,
}: NavbarProps) {
  const navLinkClass = (active: boolean) =>
    `text-sm font-medium transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b ${
      active
        ? 'text-slate-900 border-slate-900'
        : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigateHome('All')}
          className="font-display text-2xl font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900"
        >
          Verve & Loom
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Primary navigation">
          <button
            type="button"
            onClick={() => onNavigateHome("Men's Wear")}
            className={navLinkClass(activeView === 'home' && selectedCategory === "Men's Wear")}
          >
            Men&apos;s Wear
          </button>
          <button
            type="button"
            onClick={() => onNavigateHome("Women's Wear")}
            className={navLinkClass(activeView === 'home' && selectedCategory === "Women's Wear")}
          >
            Women&apos;s Wear
          </button>
          <button
            type="button"
            onClick={() => onNavigateHome("Kids' Wear")}
            className={navLinkClass(activeView === 'home' && selectedCategory === "Kids' Wear")}
          >
            Kids&apos; Wear
          </button>
          <button
            type="button"
            onClick={onNavigateAccount}
            className={navLinkClass(activeView === 'account')}
          >
            {isSignedIn ? (userFirstName ? `${userFirstName} · Orders` : 'Orders') : 'Sign In'}
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={onNavigateAdmin}
              className={navLinkClass(activeView === 'admin')}
            >
              Admin
            </button>
          )}
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Bag</span>
            <span className="tabular-nums font-mono text-xs bg-white/15 px-1.5 py-0.5 rounded">
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      {/* Compact mobile navigation row */}
      <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center gap-4 overflow-x-auto text-xs font-medium text-slate-600">
        <button
          type="button"
          onClick={() => onNavigateHome('All')}
          className={`whitespace-nowrap shrink-0 ${selectedCategory === 'All' && activeView === 'home' ? 'text-slate-900 font-semibold' : ''}`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => onNavigateHome("Men's Wear")}
          className={`whitespace-nowrap shrink-0 ${selectedCategory === "Men's Wear" && activeView === 'home' ? 'text-slate-900 font-semibold' : ''}`}
        >
          Men&apos;s
        </button>
        <button
          type="button"
          onClick={() => onNavigateHome("Women's Wear")}
          className={`whitespace-nowrap shrink-0 ${selectedCategory === "Women's Wear" && activeView === 'home' ? 'text-slate-900 font-semibold' : ''}`}
        >
          Women&apos;s
        </button>
        <button
          type="button"
          onClick={() => onNavigateHome("Kids' Wear")}
          className={`whitespace-nowrap shrink-0 ${selectedCategory === "Kids' Wear" && activeView === 'home' ? 'text-slate-900 font-semibold' : ''}`}
        >
          Kids&apos;
        </button>
        <button
          type="button"
          onClick={onNavigateAccount}
          className={`whitespace-nowrap shrink-0 ${activeView === 'account' ? 'text-slate-900 font-semibold' : ''}`}
        >
          {isSignedIn ? 'Orders & Profile' : 'Sign In'}
        </button>
        {isAdmin && (
          <button
            type="button"
            onClick={onNavigateAdmin}
            className={`whitespace-nowrap shrink-0 ${activeView === 'admin' ? 'text-slate-900 font-semibold' : ''}`}
          >
            Admin
          </button>
        )}
      </div>
    </header>
  );
}
