import { useState } from 'react';
import { ArrowLeft, Check, Minus, Plus, ShieldCheck, Star, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { FIELD_LIMITS, Product } from '../types';
import { ProductImage } from './ProductImage';

interface ProductDetailViewProps {
  product: Product;
  onBack: () => void;
  onOpenCart: () => void;
}

export function ProductDetailView({ product, onBack, onOpenCart }: ProductDetailViewProps) {
  const { user, reviews, addToCart, submitReview, loginWithGoogle, isCatalogSeeded } = useStore();
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || 'Default');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const productReviews = reviews.filter((r) => r.productId === product.id);
  const avgRating =
    productReviews.length > 0
      ? productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length
      : null;

  const outOfStock = product.stock <= 0;

  const handleAdd = async () => {
    if (outOfStock) return;
    setAdding(true);
    try {
      await addToCart(product, selectedSize, selectedColor, quantity);
      onOpenCart();
    } finally {
      setAdding(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCatalogSeeded) return;
    setSubmittingReview(true);
    try {
      await submitReview(product.id, rating, comment);
      setComment('');
      setRating(5);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-16">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>
      </div>

      {/* Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        <div className="lg:col-span-7 lg:sticky lg:top-24">
          <div className="aspect-[4/3] w-full bg-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
          <div className="space-y-2 border-b border-slate-200 pb-6">
            <p className="text-xs font-medium text-slate-500">
              {product.category} <span aria-hidden="true">/</span> {product.garmentType}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-slate-900 leading-tight text-balance">
              {product.name}
            </h1>
            <div className="flex items-center justify-between pt-2">
              <p className="text-2xl font-semibold text-slate-900 tabular-nums">
                ${product.price.toFixed(2)}
              </p>
              {avgRating !== null ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-700 tabular-nums">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{avgRating.toFixed(1)}</span>
                  <span className="text-slate-500">({productReviews.length} reviews)</span>
                </span>
              ) : (
                <span className="text-xs text-slate-500">No reviews yet</span>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>

          {/* Colour Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900">Colour</span>
              <span className="text-slate-600">{selectedColor}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((color) => {
                const active = selectedColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                      active
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900">Select Size</span>
              <span className="text-slate-500">Standard tailored fit</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => {
                const active = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[48px] px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                      active
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-800 hover:border-slate-400'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity & Availability */}
          <div className="flex items-center justify-between pt-2">
            <div className="inline-flex items-center border border-slate-200 rounded-lg">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2.5 text-slate-600 hover:text-slate-900 disabled:opacity-40"
                disabled={quantity <= 1 || outOfStock}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 text-sm font-semibold tabular-nums text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((q) => Math.min(product.stock, 20, q + 1))}
                className="p-2.5 text-slate-600 hover:text-slate-900 disabled:opacity-40"
                disabled={quantity >= product.stock || outOfStock}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <p
              className={`text-xs font-medium tabular-nums ${
                outOfStock
                  ? 'text-red-700'
                  : product.stock <= 5
                  ? 'text-amber-700'
                  : 'text-emerald-700'
              }`}
            >
              {outOfStock ? 'Currently out of stock' : `${product.stock} units available`}
            </p>
          </div>

          <button
            type="button"
            disabled={outOfStock || adding}
            onClick={handleAdd}
            className="w-full py-3.5 px-6 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            {outOfStock
              ? 'Out of Stock'
              : adding
              ? 'Adding to Bag...'
              : `Add to Bag — $${(product.price * quantity).toFixed(2)}`}
          </button>

          <div className="pt-4 border-t border-slate-200 space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-slate-700 shrink-0" />
              <span>Complimentary shipping on orders over $120. Dispatches within 24 hours.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0" />
              <span>14-day easy returns &amp; full refund to original payment method.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Ratings & Reviews */}
      <section className="pt-12 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-slate-900">
              Customer Reviews
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {productReviews.length > 0
                ? `Rated ${avgRating?.toFixed(1)} out of 5 across ${productReviews.length} customer review${productReviews.length === 1 ? '' : 's'}.`
                : 'Be the first customer to review the fit and fabric of this piece.'}
            </p>
          </div>

          {/* Write Review Form */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Write a Review</h3>
            {!user ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Sign in with your account to share a rating and review for this garment.
                </p>
                <button
                  type="button"
                  onClick={loginWithGoogle}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Sign In to Review
                </button>
              </div>
            ) : !isCatalogSeeded ? (
              <p className="text-xs text-slate-600">
                Live reviews unlock once the store catalog is initialized by an admin.
              </p>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <span className="block text-xs font-medium text-slate-700 mb-1.5">Rating</span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        aria-label={`Rate ${star} stars`}
                        className="p-1 focus-visible:outline-2 focus-visible:outline-slate-900 rounded"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="review-comment" className="block text-xs font-medium text-slate-700 mb-1.5">
                    Your Experience
                  </label>
                  <textarea
                    id="review-comment"
                    rows={3}
                    required
                    minLength={FIELD_LIMITS.REVIEW_MIN}
                    maxLength={FIELD_LIMITS.REVIEW_MAX}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Comment on fabric weight, sizing accuracy, and tailoring..."
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview || comment.trim().length < FIELD_LIMITS.REVIEW_MIN}
                  className="px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {submittingReview ? 'Posting Review...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          {productReviews.length === 0 ? (
            <div className="border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
              No reviews have been posted for this item yet.
            </div>
          ) : (
            productReviews.map((rev) => (
              <article
                key={rev.id}
                className="border border-slate-200 rounded-xl p-5 bg-white space-y-2.5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-slate-900">{rev.authorName}</span>
                    {rev.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                        <Check className="w-3.5 h-3.5" />
                        Verified Buyer
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5" aria-label={`${rev.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{rev.comment}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
