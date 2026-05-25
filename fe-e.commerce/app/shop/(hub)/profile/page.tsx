"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Store,
  Camera,
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  FileText,
  Save,
  Check,
  Star,
  ShieldCheck,
} from "lucide-react";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

type TabId = "info" | "shipping" | "policies";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "info", label: "Store Info", icon: Store },
  { id: "shipping", label: "Contact & Shipping", icon: MapPin },
  { id: "policies", label: "Policies", icon: FileText },
];

function SaveButton({ onClick, saved }: { onClick: () => void; saved: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      animate={saved ? { backgroundColor: "#001a41" } : { backgroundColor: "#00f3ff" }}
      transition={{ duration: 0.25, ease: EASE }}
      className="flex items-center gap-2 h-10 px-5 rounded-xl border-2 border-transparent hover:border-deep-navy active:scale-[0.97] transition-all duration-150 text-sm font-bold"
    >
      {saved ? (
        <>
          <Check className="w-4 h-4 text-primary-container" />
          <span className="text-primary-container">Saved</span>
        </>
      ) : (
        <>
          <Save className="w-4 h-4 text-deep-navy" />
          <span className="text-deep-navy">Save Changes</span>
        </>
      )}
    </motion.button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-150"
    />
  );
}

export default function ShopProfilePage() {
  const [activeTab, setActiveTab] = useState<TabId>("info");
  const [saved, setSaved] = useState(false);

  // Store info state
  const [storeName, setStoreName] = useState("Nordic Living Co.");
  const [tagline, setTagline] = useState("Scandinavian design for modern living");
  const [description, setDescription] = useState(
    "We curate premium Scandinavian homeware and lifestyle products, bringing the essence of Nordic design to your home. Every piece in our collection is selected for its craftsmanship, sustainability, and timeless aesthetic."
  );
  const [category, setCategory] = useState("Home & Living");
  const [website, setWebsite] = useState("https://nordicliving.co");

  // Contact & shipping state
  const [email, setEmail] = useState("hello@nordicliving.co");
  const [phone, setPhone] = useState("+47 21 23 45 67");
  const [address, setAddress] = useState("14 Fjord Street, Apt 3B");
  const [city, setCity] = useState("Oslo");
  const [country, setCountry] = useState("Norway");
  const [processingTime, setProcessingTime] = useState("1-2");
  const [freeShipping, setFreeShipping] = useState("150");

  // Policies state
  const [returnPolicy, setReturnPolicy] = useState(
    "We accept returns within 30 days of delivery. Items must be unused, in their original packaging. Contact us at hello@nordicliving.co to initiate a return. Refunds are processed within 5-7 business days."
  );
  const [privacyNote, setPrivacyNote] = useState(
    "We collect only the information necessary to process your order and improve our services. Your personal data is never sold to third parties. For questions, contact us at privacy@nordicliving.co."
  );

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="p-6 lg:p-8 max-w-[900px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-px w-5 bg-primary-container" />
            <p className="text-label-caps text-primary">Settings</p>
          </div>
          <h1 className="text-2xl font-bold text-deep-navy tracking-tight">
            Shop Profile
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Manage your store identity and settings
          </p>
        </div>
        <SaveButton onClick={handleSave} saved={saved} />
      </div>

      {/* Store banner strip */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="bg-white border-2 border-deep-navy rounded-xl overflow-hidden mb-6"
      >
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-deep-navy via-deep-navy/80 to-primary/30 relative">
          <button className="absolute inset-0 flex items-center justify-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium">
            <Camera className="w-4 h-4" />
            Change Banner
          </button>
        </div>

        {/* Avatar + info */}
        <div className="px-6 pb-5">
          <div className="flex items-end gap-4 -mt-7 mb-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 bg-primary-container border-4 border-white rounded-xl flex items-center justify-center text-xl font-bold text-deep-navy shadow-sm">
                NL
              </div>
              <button className="absolute -bottom-1 -right-1 w-5 h-5 bg-deep-navy rounded-full flex items-center justify-center border-2 border-white">
                <Camera className="w-2.5 h-2.5 text-primary-container" />
              </button>
            </div>
            <div className="pb-1">
              <p className="font-bold text-deep-navy">{storeName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-primary fill-primary" />
                  <span className="text-xs font-medium text-on-surface-variant">
                    4.9 (128 reviews)
                  </span>
                </div>
                <span className="text-outline-variant">·</span>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-primary" />
                  <span className="text-xs text-primary font-semibold">
                    Verified Seller
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE, delay: 0.06 }}
        className="flex border-2 border-deep-navy rounded-xl overflow-hidden bg-white mb-5"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all duration-150 ${
                active
                  ? "bg-deep-navy text-white"
                  : "text-on-surface-variant hover:text-deep-navy hover:bg-surface-container-low"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="bg-white border-2 border-deep-navy rounded-xl p-6"
      >
        {activeTab === "info" && (
          <div className="space-y-6">
            <div>
              <FieldLabel>Store Name</FieldLabel>
              <Input value={storeName} onChange={setStoreName} placeholder="Your shop name" />
            </div>

            <div>
              <FieldLabel>Tagline</FieldLabel>
              <Input
                value={tagline}
                onChange={setTagline}
                placeholder="A short description of your shop"
              />
              <p className="text-[10px] text-on-surface-variant mt-1.5">
                Appears below your store name. Max 80 characters.
              </p>
            </div>

            <div>
              <FieldLabel>Store Description</FieldLabel>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Tell shoppers about your store…"
                className="block w-full px-4 py-3 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-150 resize-none leading-relaxed"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <FieldLabel>Primary Category</FieldLabel>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors duration-150 appearance-none"
                >
                  {[
                    "Home & Living",
                    "Fashion",
                    "Electronics",
                    "Food & Beverage",
                    "Sports & Outdoors",
                    "Beauty",
                    "Art & Crafts",
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>Store Website</FieldLabel>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourshop.com"
                    className="block w-full h-11 pl-10 pr-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-150"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "shipping" && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <FieldLabel>Business Email</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full h-11 pl-10 pr-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors duration-150"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Phone Number</FieldLabel>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full h-11 pl-10 pr-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors duration-150"
                  />
                </div>
              </div>
            </div>

            <div>
              <FieldLabel>Street Address</FieldLabel>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="block w-full h-11 pl-10 pr-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors duration-150"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <FieldLabel>City</FieldLabel>
                <Input value={city} onChange={setCity} />
              </div>
              <div>
                <FieldLabel>Country</FieldLabel>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors duration-150"
                >
                  {["Norway", "Sweden", "Denmark", "Finland", "Iceland"].map(
                    (c) => (
                      <option key={c}>{c}</option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="border-t border-outline-variant pt-6">
              <h3 className="font-bold text-deep-navy mb-4 text-sm">
                Shipping Settings
              </h3>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <FieldLabel>Processing Time</FieldLabel>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                    <select
                      value={processingTime}
                      onChange={(e) => setProcessingTime(e.target.value)}
                      className="block w-full h-11 pl-10 pr-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors duration-150"
                    >
                      {["Same day", "1-2", "2-3", "3-5"].map((t) => (
                        <option key={t} value={t}>
                          {t === "Same day" ? "Same day" : `${t} business days`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <FieldLabel>Free Shipping Threshold ($)</FieldLabel>
                  <input
                    type="number"
                    value={freeShipping}
                    onChange={(e) => setFreeShipping(e.target.value)}
                    min={0}
                    className="block w-full h-11 px-4 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface focus:border-primary-container outline-none transition-colors duration-150"
                  />
                  <p className="text-[10px] text-on-surface-variant mt-1.5">
                    Orders above this amount ship free. Set 0 to always charge.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "policies" && (
          <div className="space-y-6">
            <div>
              <FieldLabel>Return & Refund Policy</FieldLabel>
              <textarea
                value={returnPolicy}
                onChange={(e) => setReturnPolicy(e.target.value)}
                rows={6}
                className="block w-full px-4 py-3 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-150 resize-none leading-relaxed"
              />
              <p className="text-[10px] text-on-surface-variant mt-1.5">
                This policy is displayed on your shop page and during checkout.
              </p>
            </div>

            <div>
              <FieldLabel>Privacy Note for Customers</FieldLabel>
              <textarea
                value={privacyNote}
                onChange={(e) => setPrivacyNote(e.target.value)}
                rows={4}
                className="block w-full px-4 py-3 border-2 border-deep-navy/20 rounded-xl bg-white text-sm text-on-surface placeholder:text-outline focus:border-primary-container outline-none transition-colors duration-150 resize-none leading-relaxed"
              />
            </div>

            <div className="p-4 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface-variant leading-relaxed">
              <p className="font-bold text-deep-navy mb-1">Note</p>
              ShopIn requires sellers to maintain policies compliant with our{" "}
              <span className="underline cursor-pointer text-primary">
                Seller Agreement
              </span>
              . Misleading or missing policies may result in account suspension.
            </div>
          </div>
        )}
      </motion.div>

      <div className="mt-4 flex justify-end">
        <SaveButton onClick={handleSave} saved={saved} />
      </div>
    </div>
  );
}
