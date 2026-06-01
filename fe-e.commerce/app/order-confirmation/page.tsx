"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Package, ArrowRight, Home } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const ORDER_ITEMS = [
  {
    name: "V60 Ceramic Dripper",
    variant: "White / 02",
    qty: 1,
    price: "$45.00",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDuYPHC5ZucXkMLQdPzRtMwA5fwVf4vodbpXzIAj1S6x4XKjM2fAlF7-u-Z-AU3MWyNLivbqT5NJVyhECEfYebs0h9qutzgtz955zo46r6UKJ_32aNcoy_7_fNGgqJzQY7CDeFPibKGTiQOwhV3lPfA9eC6I9W4_XCDYFh4FgdiwfC_x7VTV8hox8fmMw3BIDeUe8i7OCB11qcswwjZTdPA83Cj2SJY5IbVEXpLsg6dQg6vLyyj5o-lN_LUe6-ocebtxqygqhHLieN3",
  },
  {
    name: "Cylindrical Tumbler Set",
    variant: "Matte Black · ×2",
    qty: 2,
    price: "$64.00",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAgZgxJBL_cQBXBw5VzGLXPpgE5RrL1cjMbWzL19VtO-XmfNNZV1pTCD8rc39nQXx99rcFwYIBT_DXnucwl9RgW8yKfo4HhdOSq_L0oCSntd6PaPXphuxOKKyW1xWwfBGwb72fuxp_0uPUaDG4DJGiKGwxMoyC3d6Miv61WWKFUAWGd3H-IlEY28QsPuHJioAksGYxaOHKRI2Qg3AG52p3ws5sxT3xorquBUeftVmdxuHfT73crxvuynz2znqMFjVdss1scuZQ8o4Nz",
  },
];

const ORDER_ID = "4921";
const ORDER_TOTAL = "$209.00";
const ESTIMATED_DELIVERY = "November 12–14, 2024";

export default function OrderConfirmationPage() {
  const [checkVisible, setCheckVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCheckVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-[1280px] mx-auto px-4 sm:px-10 py-16 w-full">
        <div className="max-w-2xl mx-auto">
          {/* Success mark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={checkVisible ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary-container border-4 border-deep-navy flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-deep-navy" strokeWidth={2} />
              </div>
              {/* Ripple rings */}
              {checkVisible && (
                <>
                  <motion.div
                    initial={{ scale: 1, opacity: 0.4 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                    className="absolute inset-0 rounded-full border-2 border-primary-container"
                  />
                  <motion.div
                    initial={{ scale: 1, opacity: 0.25 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.45 }}
                    className="absolute inset-0 rounded-full border border-primary-container"
                  />
                </>
              )}
            </div>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE, delay: 0.25 }}
            className="text-center mb-10"
          >
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <div className="h-px w-8 bg-primary-container flex-shrink-0" />
              <p className="text-label-caps text-primary">Order Confirmed</p>
              <div className="h-px w-8 bg-primary-container flex-shrink-0" />
            </div>
            <h1 className="text-display-lg-mobile text-deep-navy">Thank you, Alex!</h1>
            <p className="text-on-surface-variant mt-2 text-sm">
              Your order{" "}
              <span className="font-bold text-deep-navy">#{ORDER_ID}</span> has been placed
              and is being prepared.
            </p>
          </motion.div>

          {/* Order card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE, delay: 0.35 }}
            className="bg-white border-2 border-deep-navy rounded-2xl overflow-hidden mb-6"
          >
            {/* Cyan accent */}
            <div className="h-1 bg-primary-container w-full" />

            <div className="p-6 space-y-6">
              {/* Delivery estimate */}
              <div className="flex items-center gap-4 p-4 bg-surface-container-low border border-deep-navy/10 rounded-xl">
                <div className="w-10 h-10 bg-deep-navy rounded-xl flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-primary-container" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Estimated Delivery
                  </p>
                  <p className="font-bold text-deep-navy mt-0.5">{ESTIMATED_DELIVERY}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                  Items Ordered
                </p>
                <div className="space-y-3">
                  {ORDER_ITEMS.map((item) => (
                    <div key={item.name} className="flex gap-3 items-center">
                      <div className="w-14 h-14 border border-deep-navy/15 rounded-xl bg-surface-container-low p-2 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/56x56/e2e2e2/6a7a7b?text=IMG"; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-deep-navy truncate">{item.name}</p>
                        <p className="text-xs text-on-surface-variant">{item.variant}</p>
                      </div>
                      <p className="text-sm font-bold text-deep-navy shrink-0">{item.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t-2 border-deep-navy pt-4 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Order Total
                </span>
                <span className="text-xl font-bold text-deep-navy">{ORDER_TOTAL}</span>
              </div>
            </div>
          </motion.div>

          {/* Delivery address */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.45 }}
            className="bg-white border-2 border-deep-navy/15 rounded-2xl p-5 mb-8"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              Shipping To
            </p>
            <p className="text-sm font-bold text-deep-navy">Alex Nordström</p>
            <p className="text-sm text-on-surface-variant">14 Fjord Street, Apt 3B · Oslo, 0150 · Norway</p>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.55 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link
              href={`/orders/${ORDER_ID}`}
              className="flex-1 flex items-center justify-center gap-2 h-12 bg-primary-container text-deep-navy text-label-caps font-bold rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors active:scale-[0.97]"
            >
              Track Order
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 h-12 border-2 border-deep-navy text-deep-navy text-label-caps font-bold rounded-xl hover:bg-surface-container transition-colors active:scale-[0.97]"
            >
              <Home className="w-4 h-4" />
              Back to Shop
            </Link>
          </motion.div>

          {/* Below card note */}
          <p className="text-center text-xs text-on-surface-variant mt-6">
            A confirmation email has been sent to{" "}
            <span className="font-semibold text-deep-navy">alex@nordstrom.co</span>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
