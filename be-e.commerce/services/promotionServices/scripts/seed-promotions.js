// Seed demo promotions into the `promotion` database.
// Run via: docker exec ecommerce-mongodb mongosh "mongodb://localhost:27017/promotion" --quiet --file /tmp/seed-promotions.js
const now = new Date();
const start = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
const end = new Date(now.getTime() + 90 * 24 * 3600 * 1000);

const docs = [
  {
    code: "FROST10",
    title: "Frost 10% Off",
    description: "10% off your entire order.",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: 100000,
    startDate: start,
    endDate: end,
    active: true,
    usageLimit: null,
    usedCount: 0,
    usageLimitPerUser: null,
    productIds: [],
    redemptions: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    code: "WELCOME50K",
    title: "Welcome ₫50,000",
    description: "₫50,000 off orders from ₫200,000.",
    discountType: "fixed",
    discountValue: 50000,
    minOrderAmount: 200000,
    maxDiscountAmount: null,
    startDate: start,
    endDate: end,
    active: true,
    usageLimit: 1000,
    usedCount: 0,
    usageLimitPerUser: 5,
    productIds: [],
    redemptions: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    code: "NORDIC25",
    title: "Nordic 25% Off",
    description: "25% off, up to ₫300,000.",
    discountType: "percentage",
    discountValue: 25,
    minOrderAmount: 300000,
    maxDiscountAmount: 300000,
    startDate: start,
    endDate: end,
    active: true,
    usageLimit: null,
    usedCount: 0,
    usageLimitPerUser: null,
    productIds: [],
    redemptions: [],
    createdAt: now,
    updatedAt: now,
  },
];

db.promotions.deleteMany({ code: { $in: docs.map((d) => d.code) } });
db.promotions.insertMany(docs);
print("promotions in db:", db.promotions.countDocuments());
