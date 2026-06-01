"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Monitor,
  ShoppingBag,
  UtensilsCrossed,
  Home,
  Heart,
  Dumbbell,
  BookOpen,
  Baby,
  Car,
  PawPrint,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const ICON_OPTIONS = [
  { name: "Monitor", Icon: Monitor },
  { name: "ShoppingBag", Icon: ShoppingBag },
  { name: "UtensilsCrossed", Icon: UtensilsCrossed },
  { name: "Home", Icon: Home },
  { name: "Heart", Icon: Heart },
  { name: "Dumbbell", Icon: Dumbbell },
  { name: "BookOpen", Icon: BookOpen },
  { name: "Baby", Icon: Baby },
  { name: "Car", Icon: Car },
  { name: "PawPrint", Icon: PawPrint },
];

interface Category {
  id: string;
  label: string;
  slug: string;
  iconName: string;
  children: number;
}

const INITIAL_CATEGORIES: Category[] = [
  { id: "cat-1", label: "Electronics", slug: "electronics", iconName: "Monitor", children: 8 },
  { id: "cat-2", label: "Fashion", slug: "fashion", iconName: "ShoppingBag", children: 12 },
  { id: "cat-3", label: "Food & Grocery", slug: "food-grocery", iconName: "UtensilsCrossed", children: 6 },
  { id: "cat-4", label: "Home & Living", slug: "home-living", iconName: "Home", children: 9 },
  { id: "cat-5", label: "Health & Beauty", slug: "health-beauty", iconName: "Heart", children: 7 },
  { id: "cat-6", label: "Sports", slug: "sports", iconName: "Dumbbell", children: 5 },
  { id: "cat-7", label: "Books", slug: "books", iconName: "BookOpen", children: 4 },
  { id: "cat-8", label: "Toys & Baby", slug: "toys-baby", iconName: "Baby", children: 6 },
  { id: "cat-9", label: "Automotive", slug: "automotive", iconName: "Car", children: 3 },
  { id: "cat-10", label: "Pet Supplies", slug: "pet-supplies", iconName: "PawPrint", children: 4 },
];

function getIcon(name: string) {
  return ICON_OPTIONS.find((o) => o.name === name)?.Icon ?? Monitor;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [selected, setSelected] = useState<Category | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saved, setSaved] = useState(false);

  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formIcon, setFormIcon] = useState("Monitor");

  function openEdit(cat: Category) {
    setSelected(cat);
    setIsNew(false);
    setFormName(cat.label);
    setFormSlug(cat.slug);
    setFormIcon(cat.iconName);
    setSaved(false);
  }

  function openNew() {
    setSelected(null);
    setIsNew(true);
    setFormName("");
    setFormSlug("");
    setFormIcon("Monitor");
    setSaved(false);
  }

  function handleSave() {
    if (isNew) {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        label: formName,
        slug: formSlug || slugify(formName),
        iconName: formIcon,
        children: 0,
      };
      setCategories((prev) => [...prev, newCat]);
      setIsNew(false);
      setSelected(newCat);
    } else if (selected) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === selected.id
            ? { ...c, label: formName, slug: formSlug || slugify(formName), iconName: formIcon }
            : c
        )
      );
      setSelected((prev) => prev ? { ...prev, label: formName, slug: formSlug, iconName: formIcon } : prev);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleDelete(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  const showForm = isNew || selected !== null;

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-px w-5 bg-red-400" />
          <p className="text-label-caps text-red-500">Taxonomy</p>
        </div>
        <h1 className="text-2xl font-bold text-deep-navy tracking-tight">Category Management</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Organise the platform product taxonomy.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Category tree */}
        <div className="lg:col-span-2 bg-white border-2 border-deep-navy rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-deep-navy bg-surface-container-low">
            <h2 className="font-bold text-deep-navy text-sm">Top-Level Categories</h2>
            <button
              onClick={openNew}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-deep-navy px-3 py-1.5 rounded-xl hover:bg-primary transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <div className="divide-y divide-outline-variant">
            {categories.map((cat) => {
              const Icon = getIcon(cat.iconName);
              const isActive = selected?.id === cat.id;
              return (
                <div
                  key={cat.id}
                  className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors group ${
                    isActive ? "bg-primary-container/20 border-l-4 border-primary-container" : "hover:bg-surface-container-low border-l-4 border-transparent"
                  }`}
                  onClick={() => openEdit(cat)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    isActive ? "bg-primary-container/30 border-primary-container" : "bg-surface-container border-outline-variant"
                  }`}>
                    <Icon className={`w-4 h-4 ${isActive ? "text-deep-navy" : "text-on-surface-variant"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? "text-deep-navy" : "text-on-surface"}`}>{cat.label}</p>
                    <p className="text-[10px] text-on-surface-variant">{cat.children} sub-categories</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEdit(cat)}
                      className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-deep-navy transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-on-surface-variant hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-deep-navy/60 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Edit / create form */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {showForm ? (
              <motion.div
                key={isNew ? "new" : selected?.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="bg-white border-2 border-deep-navy rounded-xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b-2 border-deep-navy bg-surface-container-low">
                  <h2 className="font-bold text-deep-navy text-sm">
                    {isNew ? "New Category" : `Edit: ${selected?.label}`}
                  </h2>
                  {saved && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Saved!
                    </motion.span>
                  )}
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-2">
                      Category Name
                    </label>
                    <input
                      value={formName}
                      onChange={(e) => {
                        setFormName(e.target.value);
                        if (isNew) setFormSlug(slugify(e.target.value));
                      }}
                      placeholder="e.g. Electronics"
                      className="block w-full h-11 px-4 border-2 border-deep-navy/30 rounded-xl bg-white text-sm focus:border-primary-container outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-2">
                      Slug
                    </label>
                    <input
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      placeholder="e.g. electronics"
                      className="block w-full h-11 px-4 border-2 border-deep-navy/30 rounded-xl bg-white text-sm font-mono focus:border-primary-container outline-none transition-colors"
                    />
                    <p className="text-[10px] text-on-surface-variant mt-1.5">Used in URLs: /search?category=<strong>{formSlug || "slug"}</strong></p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-2">
                      Icon
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {ICON_OPTIONS.map(({ name, Icon }) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setFormIcon(name)}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                            formIcon === name
                              ? "border-primary-container bg-primary-container/20"
                              : "border-outline-variant bg-white hover:border-deep-navy"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${formIcon === name ? "text-deep-navy" : "text-on-surface-variant"}`} />
                          <span className="text-[8px] font-medium text-on-surface-variant truncate w-full text-center">{name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.1em] text-deep-navy mb-2">
                      Parent Category
                    </label>
                    <select className="block w-full h-11 px-4 border-2 border-deep-navy/30 rounded-xl bg-white text-sm focus:border-primary-container outline-none transition-colors">
                      <option value="">Top Level</option>
                      {categories.filter((c) => c.id !== selected?.id).map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={!formName.trim()}
                      className="flex-1 h-10 bg-primary-container text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy disabled:opacity-40 transition-all"
                    >
                      {isNew ? "Create Category" : "Save Changes"}
                    </button>
                    <button
                      onClick={() => { setSelected(null); setIsNew(false); }}
                      className="px-4 h-10 bg-white text-on-surface-variant text-sm font-bold rounded-xl border-2 border-outline-variant hover:border-deep-navy transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-64 bg-white border-2 border-dashed border-outline-variant rounded-xl text-center p-6"
              >
                <p className="text-sm font-medium text-on-surface-variant">Select a category to edit</p>
                <p className="text-xs text-outline mt-1">or click Add to create a new one</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
