"use client";

import { useEffect, useState } from "react";
import { Star, Loader2, Eye, EyeOff, Flag, ShieldCheck } from "lucide-react";
import {
  fetchReportedReviews,
  moderateReview,
  type SellerReviewRow,
} from "@/lib/reviews";

export default function AdminReviewsPage() {
  const [rows, setRows] = useState<SellerReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const keyOf = (r: SellerReviewRow) => `${r.productId}:${r.index}`;

  const load = async () => {
    setLoading(true);
    const data = await fetchReportedReviews();
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleHidden = async (r: SellerReviewRow) => {
    const key = keyOf(r);
    setBusyKey(key);
    try {
      await moderateReview(r.productId, r.index, !r.hidden);
      await load();
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-primary flex-shrink-0" />
          <span className="text-label-caps text-primary">Moderation</span>
        </div>
        <h1 className="text-display-lg-mobile text-deep-navy mt-1">Review Moderation</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Reported and hidden reviews across the catalogue. Hiding a review removes it from the
          storefront and excludes it from the product rating.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-on-surface-variant text-sm py-16 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading queue…
        </div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <ShieldCheck className="w-8 h-8 text-primary mx-auto" />
          <p className="text-sm text-on-surface-variant">Nothing flagged. The queue is clear.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const key = keyOf(r);
            return (
              <div
                key={key}
                className={`p-5 border-2 rounded-2xl flex gap-4 ${
                  r.hidden ? "border-error/40 bg-error/5" : "border-deep-navy/15 bg-white"
                }`}
              >
                <div className="w-12 h-12 rounded-lg border border-deep-navy/15 bg-surface-container-low overflow-hidden shrink-0">
                  {r.productImage && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={r.productImage} alt="" className="w-full h-full object-contain" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm font-bold text-deep-navy truncate">{r.productName}</p>
                    <div className="flex items-center gap-2">
                      {r.reportedCount > 0 && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-error">
                          <Flag className="w-3 h-3" /> {r.reportedCount} report{r.reportedCount === 1 ? "" : "s"}
                        </span>
                      )}
                      {r.hidden && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-error">
                          <EyeOff className="w-3 h-3" /> Hidden
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-deep-navy capitalize">{r.author}</span>
                    <StarRow value={r.rating} />
                    <span className="text-[11px] uppercase tracking-widest text-outline">
                      {new Date(r.date).toLocaleDateString()}
                    </span>
                  </div>
                  {r.text && <p className="text-sm text-on-surface-variant leading-relaxed">{r.text}</p>}
                  {r.reply && (
                    <div className="ml-3 pl-3 border-l-2 border-primary-container">
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        <span className="font-bold text-primary">Shop: </span>
                        {r.reply.body}
                      </p>
                    </div>
                  )}

                  <div className="pt-1">
                    <button
                      onClick={() => toggleHidden(r)}
                      disabled={busyKey === key}
                      className={`flex items-center gap-1.5 h-9 px-4 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors active:scale-[0.97] disabled:opacity-50 ${
                        r.hidden
                          ? "border-2 border-deep-navy text-deep-navy hover:bg-surface-container"
                          : "bg-error text-white hover:bg-error/90"
                      }`}
                    >
                      {busyKey === key ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : r.hidden ? (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Unhide
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" /> Hide
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StarRow({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${
            n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-surface-container text-outline"
          }`}
        />
      ))}
    </div>
  );
}
