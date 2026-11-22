import { Star } from 'lucide-react';
import { Product } from '../types';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  ratingAvg: number | null;
  reviewCount: number;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export function ProductCard({
  product,
  ratingAvg,
  reviewCount,
  onSelectProduct,
  onQuickAdd,
}: ProductCardProps) {
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <article className="group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <button
        type="button"
        onClick={() => onSelectProduct(product)}
        className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-slate-900"
      >
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </button>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
            <span className="truncate">
              {product.category} <span aria-hidden="true">·</span> {product.garmentType}
            </span>
            {ratingAvg !== null && (
              <span className="inline-flex items-center gap-1 text-slate-700 font-medium tabular-nums shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {ratingAvg.toFixed(1)} ({reviewCount})
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelectProduct(product)}
            className="text-left block w-full"
          >
            <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1">
              {product.name}
            </h3>
          </button>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold text-slate-900 tabular-nums">
              ${product.price.toFixed(2)}
            </p>
            <p
              className={`text-xs ${
                outOfStock
                  ? 'text-red-700 font-medium'
                  : lowStock
                  ? 'text-amber-700 font-medium'
                  : 'text-slate-500'
              }`}
            >
              {outOfStock
                ? 'Out of stock'
                : lowStock
                ? `Only ${product.stock} left`
                : `${product.sizes.length} sizes · In stock`}
            </p>
          </div>

          <button
            type="button"
            disabled={outOfStock}
            onClick={() => onQuickAdd(product)}
            className="px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            {outOfStock ? 'Sold Out' : 'Quick Add'}
          </button>
        </div>
      </div>
    </article>
  );
}
