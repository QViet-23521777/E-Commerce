"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ChevronLeft,
  MessageSquare,
  MapPin,
  RotateCcw,
  Printer,
  Star,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const TRACKING_STEPS = [
  {
    label: "Order Placed",
    date: "Nov 3, 10:24 AM",
    done: true,
    icon: CheckCircle2,
  },
  {
    label: "Payment Confirmed",
    date: "Nov 3, 10:26 AM",
    done: true,
    icon: CheckCircle2,
  },
  {
    label: "Processing",
    date: "Nov 4, 9:00 AM",
    done: true,
    icon: Clock,
  },
  {
    label: "Shipped",
    date: "Nov 5, 2:15 PM",
    done: false,
    icon: Truck,
    active: true,
  },
  {
    label: "Out for Delivery",
    date: "Estimated Nov 7",
    done: false,
    icon: MapPin,
  },
  {
    label: "Delivered",
    date: "Estimated Nov 7",
    done: false,
    icon: CheckCircle2,
  },
];

const ORDER_ITEMS = [
  {
    name: "V60 Ceramic Dripper",
    variant: "White / 02",
    qty: 1,
    price: "$145.50",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDuYPHC5ZucXkMLQdPzRtMwA5fwVf4vodbpXzIAj1S6x4XKjM2fAlF7-u-Z-AU3MWyNLivbqT5NJVyhECEfYebs0h9qutzgtz955zo46r6UKJ_32aNcoy_7_fNGgqJzQY7CDeFPibKGTiQOwhV3lPfA9eC6I9W4_XCDYFh4FgdiwfC_x7VTV8hox8fmMw3BIDeUe8i7OCB11qcswwjZTdPA83Cj2SJY5IbVEXpLsg6dQg6vLyyj5o-lN_LUe6-ocebtxqygqhHLieN3",
  },
];

export default function OrderDetailPage() {
  const activeStep = TRACKING_STEPS.findIndex((s) => !s.done);
  const progressPct = Math.round(
    (TRACKING_STEPS.filter((s) => s.done).length / TRACKING_STEPS.length) * 100
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-[1280px] mx-auto px-4 sm:px-10 py-12">
        {/* Breadcrumb */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface mb-6 transition-colors duration-150"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <p className="text-label-caps text-primary mb-1">Order #4918</p>
            <h1 className="text-display-lg-mobile text-on-surface">
              Order Details
            </h1>
            <p className="text-on-surface-variant mt-1">
              Placed on November 3, 2024
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href="/chat"
              className="flex items-center gap-2 border-2 border-deep-navy text-on-surface px-4 py-2.5 rounded-lg text-button"
            >
              <MessageSquare className="w-4 h-4" />
              Contact Shop
            </Link>
            <button className="flex items-center gap-2 border-2 border-outline-variant text-on-surface-variant px-4 py-2.5 rounded-lg text-button hover:border-deep-navy hover:text-on-surface transition-all duration-150">
              <Printer className="w-4 h-4" />
              Invoice
            </button>
            <button className="flex items-center gap-2 border-2 border-outline-variant text-on-surface-variant px-4 py-2.5 rounded-lg text-button hover:border-deep-navy hover:text-on-surface transition-all duration-150">
              <RotateCcw className="w-4 h-4" />
              Return
            </button>
            <Link
              href="/orders/4918/review"
              className="flex items-center gap-2 bg-primary-container text-deep-navy px-4 py-2.5 rounded-lg text-button border-2 border-transparent hover:border-deep-navy transition-all duration-150 active:scale-[0.97]"
            >
              <Star className="w-4 h-4" />
              Write Review
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Tracking + Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tracking Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.4, ease: EASE },
              }}
              className="border-2 border-deep-navy rounded-xl p-6 bg-surface-container-lowest"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-deep-navy rounded-lg flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-primary-container" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-on-surface">In Transit</p>
                  <p className="text-xs text-on-surface-variant">
                    Estimated delivery: November 7, 2024
                  </p>
                </div>
                <span className="text-label-caps border border-tertiary/30 text-tertiary bg-tertiary/5 px-2 py-0.5 rounded-full">
                  Shipped
                </span>
              </div>

              {/* Progress bar */}
              <div className="relative h-1.5 bg-surface-container-high rounded-full overflow-hidden mb-8">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${progressPct}%`,
                    transition: { duration: 0.8, ease: EASE, delay: 0.3 },
                  }}
                  className="absolute inset-y-0 left-0 bg-primary-container rounded-full"
                />
                <div className="absolute inset-y-0 w-12 bg-white/50 animate-scan rounded-full" />
              </div>

              {/* Steps */}
              <div className="relative">
                {TRACKING_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const isLast = i === TRACKING_STEPS.length - 1;
                  const isActive = i === activeStep;
                  const isFuture = !step.done && !isActive;

                  return (
                    <div key={step.label} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <motion.div
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{
                            scale: 1,
                            opacity: 1,
                            transition: {
                              duration: 0.3,
                              ease: EASE,
                              delay: i * 0.07,
                            },
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 ${
                            step.done
                              ? "bg-deep-navy border-deep-navy"
                              : isActive
                              ? "bg-primary-container border-primary-container"
                              : "bg-surface-container border-outline-variant"
                          }`}
                        >
                          <Icon
                            className={`w-3.5 h-3.5 ${
                              step.done
                                ? "text-primary-container"
                                : isActive
                                ? "text-deep-navy"
                                : "text-outline"
                            }`}
                          />
                        </motion.div>
                        {!isLast && (
                          <div
                            className={`w-0.5 my-1 ${
                              step.done ? "bg-deep-navy" : "bg-outline-variant"
                            }`}
                            style={{ minHeight: "2rem" }}
                          />
                        )}
                      </div>
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          transition: {
                            duration: 0.3,
                            ease: EASE,
                            delay: i * 0.07 + 0.1,
                          },
                        }}
                        className={`pb-4 ${isLast ? "pb-0" : ""}`}
                      >
                        <p
                          className={`font-semibold text-sm ${
                            isFuture ? "text-on-surface-variant" : "text-on-surface"
                          }`}
                        >
                          {step.label}
                          {isActive && (
                            <span className="ml-2 text-label-caps text-primary-container bg-deep-navy px-1.5 py-0.5 rounded">
                              Current
                            </span>
                          )}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${
                            isFuture ? "text-outline" : "text-on-surface-variant"
                          }`}
                        >
                          {step.date}
                        </p>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Items */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.4, ease: EASE, delay: 0.1 },
              }}
              className="border-2 border-deep-navy rounded-xl p-6 bg-surface-container-lowest"
            >
              <h2 className="font-semibold text-on-surface mb-4">
                Items Ordered
              </h2>
              <div className="space-y-4">
                {ORDER_ITEMS.map((item) => (
                  <div key={item.name} className="flex gap-4 items-start">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-lg object-cover border border-outline-variant shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/80x80/e2e2e2/6a7a7b?text=IMG";
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-on-surface">
                        {item.name}
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        {item.variant}
                      </p>
                      <p className="text-sm text-on-surface-variant mt-1">
                        Qty: {item.qty}
                      </p>
                    </div>
                    <p className="font-bold text-on-surface">{item.price}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right: Summary Cards */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.4, ease: EASE, delay: 0.15 },
              }}
              className="border-2 border-deep-navy rounded-xl p-5 bg-surface-container-lowest"
            >
              <h3 className="font-semibold text-on-surface mb-4">
                Order Summary
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  ["Subtotal", "$145.50"],
                  ["Shipping", "Free"],
                  ["Tax (15%)", "$21.83"],
                ].map(([label, val]) => (
                  <div
                    key={label}
                    className="flex justify-between text-on-surface-variant"
                  >
                    <span>{label}</span>
                    <span>{val}</span>
                  </div>
                ))}
                <div className="border-t border-outline-variant pt-2 flex justify-between font-bold text-on-surface">
                  <span>Total</span>
                  <span>$167.33</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.4, ease: EASE, delay: 0.2 },
              }}
              className="border-2 border-deep-navy rounded-xl p-5 bg-surface-container-lowest"
            >
              <h3 className="font-semibold text-on-surface mb-3">
                Delivery Address
              </h3>
              <div className="text-sm text-on-surface-variant space-y-0.5">
                <p className="font-medium text-on-surface">Alex Chen</p>
                <p>14 Fjord Street, Apt 3B</p>
                <p>Oslo, 0150</p>
                <p>Norway</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.4, ease: EASE, delay: 0.25 },
              }}
              className="border-2 border-deep-navy rounded-xl p-5 bg-surface-container-lowest"
            >
              <h3 className="font-semibold text-on-surface mb-3">
                Tracking Number
              </h3>
              <p className="text-sm font-mono text-primary bg-primary/5 px-3 py-2 rounded border border-primary/20 break-all">
                NOR-4918-QW7XY
              </p>
              <p className="text-xs text-on-surface-variant mt-2">
                Carrier: Bring Logistics
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.4, ease: EASE, delay: 0.3 },
              }}
              className="border-2 border-deep-navy rounded-xl p-5 bg-surface-container-lowest"
            >
              <h3 className="font-semibold text-on-surface mb-3">
                Sold by
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-deep-navy rounded-lg flex items-center justify-center text-xs font-bold text-primary-container shrink-0">
                  NL
                </div>
                <div>
                  <p className="font-medium text-sm text-on-surface">
                    Nordic Living Co.
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Verified Seller
                  </p>
                </div>
              </div>
              <Link
                href="/chat"
                className="mt-3 w-full flex items-center justify-center gap-2 border border-outline-variant text-on-surface-variant rounded-lg py-2 text-xs font-medium hover:border-deep-navy hover:text-on-surface transition-all duration-150"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Message Seller
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
