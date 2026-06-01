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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ProductCardProps } from "@/components/ProductCard";

export interface CategoryChipData {
  label: string;
  slug: string;
  Icon: LucideIcon;
}

export const BROWSE_CATEGORIES: CategoryChipData[] = [
  { label: "Electronics", slug: "electronics", Icon: Monitor },
  { label: "Fashion", slug: "fashion", Icon: ShoppingBag },
  { label: "Food & Grocery", slug: "food-grocery", Icon: UtensilsCrossed },
  { label: "Home & Living", slug: "home-living", Icon: Home },
  { label: "Health & Beauty", slug: "health-beauty", Icon: Heart },
  { label: "Sports", slug: "sports", Icon: Dumbbell },
  { label: "Books", slug: "books", Icon: BookOpen },
  { label: "Toys & Baby", slug: "toys-baby", Icon: Baby },
  { label: "Automotive", slug: "automotive", Icon: Car },
  { label: "Pet Supplies", slug: "pet-supplies", Icon: PawPrint },
];

export const ELECTRONICS_PRODUCTS: ProductCardProps[] = [
  {
    id: 201,
    name: '4K Smart TV 55"',
    price: 399.99,
    originalPrice: 599.99,
    image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&q=80",
    category: "electronics",
    tag: "Hot",
  },
  {
    id: 202,
    name: "Laptop Pro 14 i7",
    price: 849.99,
    originalPrice: 1199.99,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80",
    category: "electronics",
  },
  {
    id: 203,
    name: "Noise Cancelling Headphones",
    price: 149.99,
    originalPrice: 249.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
    category: "electronics",
  },
  {
    id: 204,
    name: "Mechanical Keyboard RGB",
    price: 79.99,
    originalPrice: 129.99,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80",
    category: "electronics",
  },
];

export const FASHION_PRODUCTS: ProductCardProps[] = [
  {
    id: 301,
    name: "Linen Summer Dress",
    price: 34.99,
    originalPrice: 59.99,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80",
    category: "fashion",
    tag: "New",
  },
  {
    id: 302,
    name: "Classic White Sneakers",
    price: 49.99,
    originalPrice: 89.99,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    category: "fashion",
  },
  {
    id: 303,
    name: "Crossbody Leather Bag",
    price: 64.99,
    originalPrice: 110.0,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80",
    category: "fashion",
  },
  {
    id: 304,
    name: "Floral Blouse Collection",
    price: 24.99,
    originalPrice: 44.99,
    image: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=400&q=80",
    category: "fashion",
  },
];

export const GROCERY_PRODUCTS: ProductCardProps[] = [
  {
    id: 401,
    name: "Organic Grain Bundle",
    price: 12.99,
    originalPrice: 18.99,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
    category: "food-grocery",
  },
  {
    id: 402,
    name: "Premium Olive Oil 500ml",
    price: 9.99,
    originalPrice: 15.99,
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80",
    category: "food-grocery",
  },
  {
    id: 403,
    name: "Herbal Tea Collection",
    price: 7.99,
    originalPrice: 13.99,
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80",
    category: "food-grocery",
  },
  {
    id: 404,
    name: "Nuts & Seeds Mix 500g",
    price: 8.49,
    originalPrice: 12.99,
    image: "https://images.unsplash.com/photo-1609167830220-7164aa360951?w=400&q=80",
    category: "food-grocery",
  },
];

export const JUST_FOR_YOU: ProductCardProps[] = [
  { id: 501, name: "Bluetooth Speaker Mini", price: 24.99, originalPrice: 49.99, image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80" },
  { id: 502, name: "Yoga Mat Premium", price: 19.99, originalPrice: 39.99, image: "https://images.unsplash.com/photo-1601925228907-5e2e654a5de5?w=400&q=80" },
  { id: 503, name: "Vitamin C Serum 30ml", price: 14.99, originalPrice: 29.99, image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80" },
  { id: 504, name: "Ceramic Mug Set (4)", price: 22.99, originalPrice: 39.99, image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&q=80" },
  { id: 505, name: "Running Socks 6-Pack", price: 9.99, originalPrice: 17.99, image: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&q=80" },
  { id: 506, name: "Desk Organizer Wood", price: 18.99, originalPrice: 32.99, image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80" },
  { id: 507, name: "Travel Pillow Memory Foam", price: 16.99, originalPrice: 29.99, image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80" },
  { id: 508, name: "Resistance Band Set", price: 11.99, originalPrice: 22.99, image: "https://images.unsplash.com/photo-1598289431512-b97b0917afae?w=400&q=80" },
  { id: 509, name: "Scented Candle Set", price: 21.99, originalPrice: 39.99, image: "https://images.unsplash.com/photo-1602607574957-c6fbd3d7c7c1?w=400&q=80" },
  { id: 510, name: "Phone Stand Adjustable", price: 8.99, originalPrice: 15.99, image: "https://images.unsplash.com/photo-1586920740099-f83dbff83e52?w=400&q=80" },
  { id: 511, name: "Reusable Water Bottle", price: 13.99, originalPrice: 24.99, image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80" },
  { id: 512, name: "Wireless Mouse Slim", price: 17.99, originalPrice: 34.99, image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80" },
  { id: 513, name: "Bamboo Cutting Board", price: 15.99, originalPrice: 27.99, image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&q=80" },
  { id: 514, name: "Face Roller Jade", price: 10.99, originalPrice: 21.99, image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80" },
  { id: 515, name: "LED Desk Lamp USB", price: 20.99, originalPrice: 39.99, image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80" },
  { id: 516, name: "Protein Shaker Bottle", price: 7.99, originalPrice: 14.99, image: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&q=80" },
  { id: 517, name: "Canvas Tote Bag", price: 12.99, originalPrice: 22.99, image: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400&q=80" },
  { id: 518, name: "Herb Garden Starter Kit", price: 17.99, originalPrice: 30.99, image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80" },
  { id: 519, name: "Sleep Eye Mask Silk", price: 9.99, originalPrice: 18.99, image: "https://images.unsplash.com/photo-1586776977607-310e9c725c37?w=400&q=80" },
  { id: 520, name: "Mini Fan USB Rechargeable", price: 11.99, originalPrice: 21.99, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
];
