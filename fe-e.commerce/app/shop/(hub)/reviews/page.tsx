"use client";

import { useEffect, useMemo, useState } from "react";
import { Star, MessageSquare, Loader2, EyeOff, Flag } from "lucide-react";
import {
  fetchSellerReviews,
  replyToReview,
  type SellerReviewRow,
} from "@/lib/reviews";

export default function ShopReviewsPage() {
  const [rows, setRows] = useState<SellerReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const keyOf = (r: SellerReviewRow) => `${r.productId}:${r.index}`;

  const load = async () => {
    setLoading(true);
    const data = await fetchSellerReviews();
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const byProduct = new Map<string, SellerReviewRow[]>();
    for (const r of rows) {
      const list = byProduct.get(r.productId) ?? [];
      list.push(r);
      byProduct.set(r.productId, list);
    }
    return Array.from(byProduct.values());
  }, [rows]);

  const submitReply = async (r: SellerReviewRow) => {
    const key = keyOf(r);
    const body = (drafts[key] ?? "").trim();
    if (!body) return;
    setSavingKey(key);
    try {
      await replyToReview(r.productId, r.index, body);
      setDrafts((d) => ({ ...d, [key]: "" }));
      await load();
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-primary flex-shrink-0" />
          <span className="text-label-caps text-primary">Reputation</span>
        </div>
        <h1 className="text-display-lg-mobile text-deep-navy mt-1">Customer Reviews</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Respond to reviews on your products. Replies are public on the product page.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-on-surface-variant text-sm py-16 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading reviews…
        </div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-outline mx-auto" />
          <p className="text-sm text-on-surface-variant">No reviews on your products yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group[0].productId} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-deep-navy/15 bg-surface-container-low overflow-hidden shrink-0">
                  {group[0].productImage && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={group[0].productImage} alt="" className="w-full h-full object-contain" />
                  )}
                </div>
                <h2 className="text-base font-bold text-deep-navy">{group[0].productName}</h2>
              </div>

              {group.map((r) => {
                const key = keyOf(r);
                return (
                  <div
                    key={key}
                    className={`p-5 border-2 rounded-2xl space-y-3 ${
                      r.hidden ? "border-error/40 bg-error/5" : "border-deep-navy/15 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-deep-navy capitalize">{r.author}</span>
                        <StarRow value={r.rating} />
                      </div>
                      <div className="flex items-center gap-2">
                        {r.reportedCount > 0 && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-error">
                            <Flag className="w-3 h-3" /> {r.reportedCount}
                          </span>
                        )}
                        {r.hidden && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-error">
                            <EyeOff className="w-3 h-3" /> Hidden
                          </span>
                        )}
                        <span className="text-[11px] uppercase tracking-widest text-outline">
                          {new Date(r.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {r.text && <p className="text-sm text-on-surface-variant leading-relaxed">{r.text}</p>}

                    {r.reply ? (
                      <div className="ml-3 pl-3 border-l-2 border-primary-container space-y-1">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
                          Your reply
                        </p>
                        <p className="text-sm text-on-surface-variant leading-relaxed">{r.reply.body}</p>
                      </div>
                    ) : (
                      <div className="flex items-end gap-2">
                        <textarea
                          value={drafts[key] ?? ""}
                          onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                          placeholder="Write a public reply…"
                          rows={2}
                          className="flex-1 px-3 py-2 border border-deep-navy/20 rounded-lg text-sm text-on-surface bg-transparent focus:border-primary-container outline-none resize-none"
                        />
                        <button
                          onClick={() => submitReply(r)}
                          disabled={savingKey === key || !(drafts[key] ?? "").trim()}
                          className="h-10 px-4 bg-deep-navy text-primary-container text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-deep-navy/80 transition-colors active:scale-[0.97] disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                        >
                          {savingKey === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Reply"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
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
