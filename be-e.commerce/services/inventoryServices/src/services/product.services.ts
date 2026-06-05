import { moveMessagePortToContext } from "node:worker_threads";
import cloudinary from "../config/cloudinary";
import { Product, PProduct, ProductSchema } from "../models/product.model";
import Inventory from "../models/inventory.model";
import { redisService } from "./redis.service";
import { PipelineStage, Types } from "mongoose";
const track: {
  price: number;
  sale: number;
  numPurchases: number;
  point: number;
} = {
  price: 1,
  sale: 0.8,
  numPurchases: 1.5,
  point: 10,
};

// Distinct product ids that at least one shop carries in inventory. Used to keep
// orphan products (no owning shop) off the public storefront / homepage feeds.
const getOwnedProductIds = async (): Promise<Types.ObjectId[]> =>
  Inventory.distinct("productId") as Promise<Types.ObjectId[]>;

// Deterministic placeholder used when no usable image is supplied.
const placeholderImage = (name: string) =>
  `https://placehold.co/600x600/eeeeee/001a41?text=${encodeURIComponent(
    name.slice(0, 20),
  )}`;

const uploadToCloudinary = (fileBuffer: Buffer) =>
  new Promise<string>((resolve, reject) => {
    // Create an upload stream to Cloudinary; the callback fires on success/failure.
    const stream = cloudinary.uploader.upload_stream(
      { folder: "Product" }, // save to "Product" folder on Cloudinary
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      },
    );
    // Push the file Buffer (received from Multer) into the stream to start uploading
    stream.end(fileBuffer);
  });

export const createProduct = async (
  name: string,
  description: string,
  price: number,
  // Image is optional. Supply an uploaded file (→ Cloudinary) OR a direct image
  // URL (→ stored verbatim). When neither is usable, a placeholder is used.
  image: { fileBuffer?: Buffer; imageUrl?: string },
  type: string,
  point: number = 0,
  sale?: number,
  numPurchases?: number,
) => {
  let imageUrl: string;
  if (image.fileBuffer) {
    // Cloudinary is optional: if credentials are missing/invalid (e.g. local dev),
    // fall back to a deterministic placeholder so listing creation still succeeds.
    try {
      imageUrl = await uploadToCloudinary(image.fileBuffer);
    } catch (err) {
      console.warn(
        "[createProduct] Cloudinary upload failed, using placeholder image:",
        (err as { message?: string })?.message ?? err,
      );
      imageUrl = placeholderImage(name);
    }
  } else if (
    typeof image.imageUrl === "string" &&
    /^https?:\/\//i.test(image.imageUrl.trim())
  ) {
    imageUrl = image.imageUrl.trim();
  } else {
    imageUrl = placeholderImage(name);
  }

  const normalize = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const product = await Product.create({
    name,
    normalize,
    description,
    price,
    imageUrl,
    type,
    point,
    ...(sale !== undefined && { sale }),
    ...(numPurchases !== undefined && { numPurchases }),
  });

  return product;
};

export const getProductById = async (productId: string) => {
  const product = await Product.findOne({
    _id: productId,
    status: "approved",
  }).lean();
  if (!product) throw new Error("Product does not exists");
  // Hide moderated reviews from the storefront, but stamp each surviving review
  // with its original array position so the client can address it (report) even
  // though the list has gaps.
  const reviews = ((product.reviews ?? []) as ReviewEntry[])
    .map((r, index) => ({ r, index }))
    .filter(({ r }) => !r.hidden)
    .map(({ r, index }) => ({
      author: r.author,
      rating: r.rating,
      text: r.text,
      date: r.date,
      reply: r.reply ?? null,
      index,
    }));
  return { ...product, reviews };
};

export const getTopByField = async (field: string, value: unknown) => {
  const exist = await Product.exists({ field: { $exist: true } });
  if (!exist) throw new Error("Field does not exists");
  const rs = await Product.find({ [field]: value })
    .sort({ field: -1 })
    .limit(10);
  if (!rs.length) throw new Error(`Field "${field}" does not exist`);
  return rs;
};

export const getTopProductPurchases = async (
  limit: number = 10,
  lastnumPurchases?: number,
  lastId?: string,
) => {
  const query: any = {
    status: "approved",
    _id: { $in: await getOwnedProductIds() },
  };
  if (lastnumPurchases != undefined && lastId) {
    query.$or = [
      { numPurchases: { $lt: lastnumPurchases } },
      {
        numPurchases: lastnumPurchases,
        _id: { $gt: lastId },
      },
    ];
  }

  const items = await Product.find(query)
    .sort({ numPurchases: -1, _id: 1 })
    .limit(limit);

  const lastItem = items[items.length - 1];
  return {
    items,
    nextCusor: lastItem
      ? { lastnumPurchases: lastItem.numPurchases, lastId: lastItem._id }
      : null,
  };
};

export const getTopSale = async (
  limit: number = 10,
  lastSale: number,
  lastId: string,
) => {
  const query: any = {
    status: "approved",
    _id: { $in: await getOwnedProductIds() },
  };
  if (lastSale != undefined && lastId) {
    query.$or = [
      { sale: { $lt: lastSale } },
      {
        sale: lastSale,
        _id: { $gt: lastId },
      },
    ];
  }

  const items = await Product.find(query)
    .sort({ sale: -1, _id: 1 })
    .limit(limit);

  const lastItem = items[items.length - 1];
  return {
    items,
    nextCusor: lastItem
      ? { lastSale: lastItem.sale, lastId: lastItem._id }
      : null,
  };
};

export const getTopPoint = async (
  limit: number = 10,
  lastPoint: number,
  lastId: string,
) => {
  const query: any = {
    status: "approved",
    _id: { $in: await getOwnedProductIds() },
  };
  if (lastPoint != undefined && lastId) {
    query.$or = [
      { point: { $lt: lastPoint } },
      {
        point: lastPoint,
        _id: { $gt: lastId },
      },
    ];
  }

  const items = await Product.find(query)
    .sort({ point: -1, _id: 1 })
    .limit(limit);

  const lastItem = items[items.length - 1];
  return {
    items,
    nextCusor: lastItem
      ? { lastPoint: lastItem.point, lastId: lastItem._id }
      : null,
  };
};

export const getTopByType = async (
  limit: number = 10,
  lastId: string,
  type: string,
) => {
  const ownedIds = await getOwnedProductIds();
  const idFilter: Record<string, unknown> = { $in: ownedIds };
  if (lastId) idFilter.$gt = lastId;
  const query: Record<string, unknown> = {
    type,
    status: "approved",
    _id: idFilter,
  };
  const items = await Product.find(query)
    .sort({ _id: 1, sale: 1, numPurchases: -1, point: -1 })
    .limit(limit);

  const lastItem = items[items.length - 1];
  return {
    items,
    nextCusor: lastItem
      ? { lastPoint: lastItem.point, lastId: lastItem._id }
      : null,
  };
};

export const getTopByListType = async (limit: number = 2, type: string[]) => {
  const ownedIds = await getOwnedProductIds();
  const listItems: PProduct[] = [];
  let lastPriceId: string = "";
  let lastSaleId: string = "";
  let lastnumPurchasesId: string = "";
  let lastPointId: string = "";

  let lastPrice: number = 0;
  let lastSale: number = 0;
  let lastnumPurchases: number = 0;
  let lastPoint: number = 0;

  const order = ["price", "sale", "numPurchases", "point"];
  let hasMore = true;

  while (listItems.length < limit && hasMore) {
    let added = 0;

    for (const element of type) {
      for (const ord of order) {
        if (listItems.length >= limit) break;

        let items: PProduct[] = [];

        if (ord === "price") {
          items = await Product.find({ status: "approved", _id: { $in: ownedIds } })
            .sort({ [element]: -1, _id: 1, [ord]: 1 })
            .limit(limit);
          const lastItem = items[items.length - 1];
          if (lastItem) {
            lastPriceId = lastItem._id.toString();
            lastPrice = lastItem.price;
          }
        } else if (ord === "sale") {
          items = await Product.find({ status: "approved", _id: { $in: ownedIds } })
            .sort({ [element]: -1, _id: 1, [ord]: -1 })
            .limit(limit);
          const lastItem = items[items.length - 1];
          if (lastItem) {
            lastSaleId = lastItem._id.toString();
            lastSale = lastItem.sale ?? 0;
          }
        } else if (ord === "numPurchases") {
          items = await Product.find({ status: "approved", _id: { $in: ownedIds } })
            .sort({ [element]: -1, _id: 1, [ord]: -1 })
            .limit(limit);
          const lastItem = items[items.length - 1];
          if (lastItem) {
            lastnumPurchasesId = lastItem._id.toString();
            lastnumPurchases = lastItem.numPurchases ?? 0;
          }
        } else if (ord === "point") {
          items = await Product.find({ status: "approved", _id: { $in: ownedIds } })
            .sort({ [element]: -1, _id: 1, [ord]: -1 })
            .limit(limit);
          const lastItem = items[items.length - 1];
          if (lastItem) {
            lastPointId = lastItem._id.toString();
            lastPoint = lastItem.point;
          }
        }
        const firstItem = items[0];
        if (firstItem) {
          firstItem.track =
            firstItem.price * track.price +
            (firstItem.sale ?? 0) * track.sale +
            (firstItem.numPurchases ?? 0) * track.numPurchases +
            firstItem.point * track.point;
          listItems.push(firstItem);
          added += 1;
        }
      }
    }

    if (added === 0) hasMore = false;
  }
  listItems.sort((a, b) => (b.track ?? 0) - (a.track ?? 0));
  return {
    listItems,
    nextCursor: {
      lastPriceId,
      lastSaleId,
      lastnumPurchasesId,
      lastPointId,
      lastPrice,
      lastSale,
      lastnumPurchases,
      lastPoint,
    },
  };
};

export const findProduct = async (
  find: string,
  limit: number = 10,
  lastTrack?: number,
  lastId?: string,
) => {
  const normalizedFind = find
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const pipeline: PipelineStage[] = [
    {
      $match: {
        normalize: { $regex: normalizedFind, $options: "i" },
        status: "approved",
        _id: { $in: await getOwnedProductIds() },
      },
    },
    {
      $addFields: {
        track: {
          $add: [
            { $multiply: ["$price", track.price] },
            { $multiply: [{ $ifNull: ["$sale", 0] }, track.sale] },
            {
              $multiply: [
                { $ifNull: ["$numPurchases", 0] },
                track.numPurchases,
              ],
            },
            { $multiply: ["$point", track.point] },
          ],
        },
      },
    },
    {
      $sort: { track: -1, _id: 1 },
    },
  ];

  if (lastTrack !== undefined && lastId) {
    pipeline.push({
      $match: {
        $or: [
          { track: { $lt: lastTrack } },
          { track: lastTrack, _id: { $gt: new Types.ObjectId(lastId) } },
        ],
      },
    });
  }

  pipeline.push({ $limit: limit });

  const items = await Product.aggregate(pipeline);

  const lastItem = items[items.length - 1];
  return {
    items,
    nextCursor: lastItem
      ? { lastTrack: lastItem.track, lastId: lastItem._id }
      : null,
  };
};

// ─── STOREFRONT SEARCH (filters + sort + pagination) ────────────────────────
// A faceted search for the storefront /search page. Distinct from `findProduct`
// (which powers the recommendation engine and must keep its cursor signature):
// this one supports category/price/rating/in-stock filters, explicit sort
// orders, and page-based pagination with a total count.
export interface SearchOptions {
  q?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  onSale?: boolean;
  sort?: "relevance" | "price_asc" | "price_desc" | "newest" | "rating" | "popular";
  page?: number;
  limit?: number;
}

export const searchProductsAdvanced = async (opts: SearchOptions) => {
  const page = Math.max(1, Number(opts.page) || 1);
  const limit = Math.min(Math.max(1, Number(opts.limit) || 12), 48);
  const skip = (page - 1) * limit;

  // Restrict to products an actual shop carries. When `inStock` is requested,
  // narrow further to those with summed quantity > 0 (a subset of owned ids).
  let allowedIds = await getOwnedProductIds();
  if (opts.inStock) {
    const rows = await Inventory.aggregate<{ _id: Types.ObjectId }>([
      { $group: { _id: "$productId", qty: { $sum: "$quantity" } } },
      { $match: { qty: { $gt: 0 } } },
    ]);
    allowedIds = rows.map((r) => r._id);
  }

  const match: Record<string, unknown> = {
    status: "approved",
    _id: { $in: allowedIds },
  };

  if (opts.q && opts.q.trim()) {
    const normalizedFind = opts.q
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();
    match.normalize = { $regex: normalizedFind, $options: "i" };
  }
  if (opts.type) match.type = opts.type;

  const price: Record<string, number> = {};
  if (opts.minPrice !== undefined) price.$gte = opts.minPrice;
  if (opts.maxPrice !== undefined) price.$lte = opts.maxPrice;
  if (Object.keys(price).length) match.price = price;

  if (opts.minRating !== undefined) match.rating = { $gte: opts.minRating };
  if (opts.onSale) match.sale = { $gt: 0 };

  const sortStage: Record<string, 1 | -1> =
    opts.sort === "price_asc"
      ? { price: 1, _id: 1 }
      : opts.sort === "price_desc"
        ? { price: -1, _id: 1 }
        : opts.sort === "newest"
          ? { createdAt: -1, _id: 1 }
          : opts.sort === "rating"
            ? { rating: -1, _id: 1 }
            : opts.sort === "popular"
              ? { numPurchases: -1, _id: 1 }
              : { track: -1, _id: 1 }; // relevance (default)

  const pipeline: PipelineStage[] = [
    { $match: match },
    {
      $addFields: {
        track: {
          $add: [
            { $multiply: ["$price", track.price] },
            { $multiply: [{ $ifNull: ["$sale", 0] }, track.sale] },
            { $multiply: [{ $ifNull: ["$numPurchases", 0] }, track.numPurchases] },
            { $multiply: ["$point", track.point] },
          ],
        },
      },
    },
    {
      $facet: {
        items: [{ $sort: sortStage }, { $skip: skip }, { $limit: limit }],
        total: [{ $count: "count" }],
      },
    },
  ];

  const [result] = await Product.aggregate(pipeline);
  const items = result?.items ?? [];
  const total = result?.total?.[0]?.count ?? 0;

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

const ACTIVITY = {
  view: 1500,
  search: 200,
  click: 300,
  buy: 500,
};

export const trackRecommendation = async (data: {
  userId: string;
  events: {
    activity: string;
    productId?: string;
    type?: string;
    keyword?: string;
  }[];
}) => {
  const { userId, events } = data;
  console.log(
    "Tracking inventory recommendation for user:",
    userId,
    "with events:",
    events,
  );

  const listItemsMap = new Map<string, PProduct>();

  const pushItems = (items: PProduct[]) => {
    for (const item of items) {
      const id = item._id.toString();
      if (!listItemsMap.has(id)) {
        listItemsMap.set(id, item);
      }
    }
  };

  // ─── CURSOR CHO findProduct ───
  let lastFindId: string = "";
  let lastFindTrack: number = 0;

  // ─── CURSOR CHO getTopByType ───
  let lastTopByTypeId: string = "";

  // ─── CURSOR CHO getTopProductPurchases ───
  let lastPurchasesId: string = "";
  let lastPurchasesNum: number = 0;

  // ─── CURSOR CHO getTopSale ───
  let lastSaleId: string = "";
  let lastSaleNum: number = 0;

  // ─── CURSOR CHO getTopPoint ───
  let lastPointId: string = "";
  let lastPointNum: number = 0;

  for (const event of events) {
    console.log("Processing event:", event);
    let { activity, productId, type, keyword } = event;

    // ─── SEARCH ───
    if (activity === "search" && keyword && keyword !== "") {
      const result = await findProduct(
        keyword.toString(),
        2,
        lastFindTrack,
        lastFindId,
      );
      console.log("Search result:", result);

      const lastItem = result.items[result.items.length - 1];
      if (lastItem) {
        lastFindId = lastItem._id.toString();
        lastFindTrack = Number(lastItem.track ?? 0);
        pushItems(result.items);
      }

      if (!type && result.items.length > 0) {
        type = result.items[0].type;
        console.log(`[SEARCH] Assigned type from search result:`, type);
      }
    }

    // ─── LẤY TYPE NẾU CHƯA CÓ ───
    if (!type && productId) {
      const product = await Product.findById(productId);
      if (product) {
        type = product.type;
      }
    }

    // ─── TOP BY TYPE (view / click / search) ───
    if (
      (activity === "view" || activity === "click" || activity === "search") &&
      type
    ) {
      const result = await getTopByType(2, lastTopByTypeId, type);
      console.log(`Top products for type "${type}":`, result);

      const lastItem = result.items[result.items.length - 1];
      if (lastItem) {
        lastTopByTypeId = lastItem._id.toString();
        pushItems(result.items);
      }
    }

    // ─── BUY → gọi cả 3 function ───
    if (activity === "buy") {
      const [resultPurchases, resultSale, resultPoint] = await Promise.all([
        getTopProductPurchases(6, lastPurchasesNum, lastPurchasesId),
        getTopSale(6, lastSaleNum, lastSaleId),
        getTopPoint(6, lastPointNum, lastPointId),
      ]);

      console.log(`Top purchases:`, resultPurchases);
      console.log(`Top sale:`, resultSale);
      console.log(`Top point:`, resultPoint);

      const lastPurchasesItem =
        resultPurchases.items[resultPurchases.items.length - 1];
      if (lastPurchasesItem) {
        lastPurchasesId = lastPurchasesItem._id.toString();
        lastPurchasesNum = lastPurchasesItem.numPurchases ?? 0;
        pushItems(resultPurchases.items);
      }

      const lastSaleItem = resultSale.items[resultSale.items.length - 1];
      if (lastSaleItem) {
        lastSaleId = lastSaleItem._id.toString();
        lastSaleNum = lastSaleItem.sale ?? 0;
        pushItems(resultSale.items);
      }

      const lastPointItem = resultPoint.items[resultPoint.items.length - 1];
      if (lastPointItem) {
        lastPointId = lastPointItem._id.toString();
        lastPointNum = lastPointItem.point ?? 0;
        pushItems(resultPoint.items);
      }
    }
  }

  // ─── TÍNH TRACK SCORE & SORT ───
  const listItems = Array.from(listItemsMap.values());
  console.log("Unique items before scoring:", listItems.length);

  for (const item of listItems) {
    item.track =
      item.price * track.price +
      (item.sale ?? 0) * track.sale +
      (item.numPurchases ?? 0) * track.numPurchases +
      item.point * track.point;
  }

  listItems.sort((a, b) => (b.track ?? 0) - (a.track ?? 0));

  // ─── LƯU REDIS ───
  await redisService.setRecommendationData(userId, {
    productId: listItems.map((item) => item._id.toString()),
    types: [...new Set(listItems.map((item) => item.type))],
    updatedAt: new Date(),
  });

  console.log("Updated recommendation data in Redis for user:", userId, {
    productId: listItems.map((item) => item._id.toString()),
    types: [...new Set(listItems.map((item) => item.type))],
  });

  return {
    userId,
    total: listItems.length,
    cursors: {
      lastFindId,
      lastFindTrack,
      lastTopByTypeId,
      lastPurchasesId,
      lastPurchasesNum,
      lastSaleId,
      lastSaleNum,
      lastPointId,
      lastPointNum,
    },
    items: listItems,
  };
};

export const trackingWithoutData = async (
  lastPurchasesId = "",
  lastPurchasesNum = 0,
  lastSaleId = "",
  lastSaleNum = 0,
  lastPointId = "",
  lastPointNum = 0,
) => {
  const listItems: PProduct[] = [];

  const resultPurchases = await getTopProductPurchases(
    2,
    lastPurchasesNum,
    lastPurchasesId,
  );
  const lastPurchasesItem =
    resultPurchases.items[resultPurchases.items.length - 1];
  if (lastPurchasesItem) {
    lastPurchasesId = lastPurchasesItem._id.toString();
    lastPurchasesNum = lastPurchasesItem.numPurchases ?? 0;
    listItems.push(...resultPurchases.items);
  }

  const resultPoint = await getTopPoint(2, lastPointNum, lastPointId);
  const lastPointItem = resultPoint.items[resultPoint.items.length - 1];
  if (lastPointItem) {
    lastPointId = lastPointItem._id.toString();
    lastPointNum = lastPointItem.point ?? 0;
    listItems.push(...resultPoint.items);
  }

  const resultSale = await getTopSale(2, lastSaleNum, lastSaleId);
  const lastSaleItem = resultSale.items[resultSale.items.length - 1];
  if (lastSaleItem) {
    lastSaleId = lastSaleItem._id.toString();
    lastSaleNum = lastSaleItem.sale ?? 0;
    listItems.push(...resultSale.items);
  }

  const seen = new Set<string>();
  const uniqueItems = listItems.filter((item) => {
    const id = item._id.toString();
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  for (const item of uniqueItems) {
    item.track =
      item.price * track.price +
      (item.sale ?? 0) * track.sale +
      (item.numPurchases ?? 0) * track.numPurchases +
      item.point * track.point;
  }

  uniqueItems.sort((a, b) => (b.track ?? 0) - (a.track ?? 0));

  return {
    total: uniqueItems.length,
    cursors: {
      lastPurchasesId,
      lastPurchasesNum,
      lastSaleId,
      lastSaleNum,
      lastPointId,
      lastPointNum,
    },
    items: uniqueItems,
  };
};

export const listProductsByStatus = async (
  status: string = "pending",
  limit: number = 50,
) => {
  const products = await Product.find({ status })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  const ids = products.map((p) => p._id);
  const invs = await Inventory.find({ productId: { $in: ids } })
    .select("productId sellerId")
    .lean();
  const sellerByProduct = new Map(
    invs.map((i) => [String(i.productId), String(i.sellerId)]),
  );
  return products.map((p) => ({
    ...p,
    sellerId: sellerByProduct.get(String(p._id)) ?? null,
  }));
};

// Recompute a product's aggregate rating from its NON-hidden reviews. Used by
// both the add-review and moderation paths so a hidden review never skews the
// average or the count.
type ReviewEntry = NonNullable<PProduct["reviews"]>[number];
const recomputeRating = (
  reviews: ReviewEntry[],
): { count: number; avg: number } => {
  const visible = reviews.filter((r) => !r.hidden);
  const count = visible.length;
  const avg = count
    ? visible.reduce((sum, r) => sum + (r.rating || 0), 0) / count
    : 0;
  return { count, avg: Math.round(avg * 10) / 10 };
};

// Append a buyer review to a product and recompute its aggregate rating. The
// product already carries an embedded `reviews[]` (seeded data) — this is the
// write path the storefront review form posts to.
export const addReview = async (
  productId: string,
  review: { author?: string; rating?: number; text?: string },
) => {
  const rating = Math.max(0, Math.min(5, Math.floor(Number(review.rating) || 0)));
  const entry = {
    author: String(review.author || "Anonymous").trim() || "Anonymous",
    rating,
    text: String(review.text || "").trim(),
    date: new Date(),
  };

  const product = await Product.findById(productId);
  if (!product) throw new Error("Product does not exists");

  product.reviews = [...(product.reviews ?? []), entry];
  const { count, avg } = recomputeRating(product.reviews);
  product.numReviews = count;
  product.rating = avg;
  await product.save();

  return {
    rating: product.rating,
    numReviews: product.numReviews,
    review: entry,
  };
};

// ─── REVIEW REPLIES & MODERATION ────────────────────────────────────────────
export interface SellerReviewRow {
  productId: string;
  productName: string;
  productImage?: string;
  index: number;
  author: string;
  rating: number;
  text: string;
  date: Date;
  reply?: { body: string; author: string; at: Date } | null;
  hidden: boolean;
  reportedCount: number;
}

// A seller replies to a review on one of their own products. Ownership is
// verified against the inventory the seller carries (seller's userId === the
// inventory.sellerId used everywhere else).
export const replyToReview = async (
  productId: string,
  index: number,
  body: string,
  sellerId: string,
) => {
  const owns = await Inventory.exists({ productId, sellerId });
  if (!owns) throw new Error("FORBIDDEN");

  const text = String(body || "").trim();
  if (!text) throw new Error("EMPTY_REPLY");

  const product = await Product.findById(productId);
  if (!product) throw new Error("Product does not exists");
  const reviews = product.reviews ?? [];
  if (index < 0 || index >= reviews.length) throw new Error("REVIEW_NOT_FOUND");

  reviews[index].reply = { body: text, author: "Shop", at: new Date() };
  product.markModified("reviews");
  await product.save();
  return reviews[index];
};

// Admin hides/unhides a review. Unhiding also clears its report flags.
export const moderateReview = async (
  productId: string,
  index: number,
  hidden: boolean,
) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product does not exists");
  const reviews = product.reviews ?? [];
  if (index < 0 || index >= reviews.length) throw new Error("REVIEW_NOT_FOUND");

  reviews[index].hidden = !!hidden;
  if (!hidden) reviews[index].reportedCount = 0;
  const { count, avg } = recomputeRating(reviews);
  product.numReviews = count;
  product.rating = avg;
  product.markModified("reviews");
  await product.save();
  return reviews[index];
};

// Any buyer can flag a review; this surfaces it in the admin moderation queue.
export const reportReview = async (productId: string, index: number) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product does not exists");
  const reviews = product.reviews ?? [];
  if (index < 0 || index >= reviews.length) throw new Error("REVIEW_NOT_FOUND");

  reviews[index].reportedCount = (reviews[index].reportedCount || 0) + 1;
  product.markModified("reviews");
  await product.save();
  return { reportedCount: reviews[index].reportedCount };
};

// All reviews across the products a seller carries (incl. hidden + reported),
// each tagged with the product + its stable index so the seller can reply.
export const listSellerReviews = async (
  sellerId: string,
): Promise<SellerReviewRow[]> => {
  const invs = await Inventory.find({ sellerId }).select("productId").lean();
  const ids = invs.map((i) => i.productId);
  if (ids.length === 0) return [];

  const products = await Product.find({ _id: { $in: ids } })
    .select("name imageUrl reviews")
    .lean();

  const out: SellerReviewRow[] = [];
  for (const p of products) {
    ((p.reviews ?? []) as ReviewEntry[]).forEach((r, index) => {
      out.push({
        productId: String(p._id),
        productName: p.name,
        productImage: p.imageUrl,
        index,
        author: r.author,
        rating: r.rating,
        text: r.text,
        date: r.date,
        reply: r.reply ?? null,
        hidden: !!r.hidden,
        reportedCount: r.reportedCount || 0,
      });
    });
  }
  out.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return out;
};

// Reported (or already-hidden) reviews across the whole catalogue — the admin
// moderation queue.
export const listReportedReviews = async (): Promise<SellerReviewRow[]> => {
  const products = await Product.find({
    $or: [{ "reviews.reportedCount": { $gt: 0 } }, { "reviews.hidden": true }],
  })
    .select("name imageUrl reviews")
    .lean();

  const out: SellerReviewRow[] = [];
  for (const p of products) {
    ((p.reviews ?? []) as ReviewEntry[]).forEach((r, index) => {
      if ((r.reportedCount || 0) > 0 || r.hidden) {
        out.push({
          productId: String(p._id),
          productName: p.name,
          productImage: p.imageUrl,
          index,
          author: r.author,
          rating: r.rating,
          text: r.text,
          date: r.date,
          reply: r.reply ?? null,
          hidden: !!r.hidden,
          reportedCount: r.reportedCount || 0,
        });
      }
    });
  }
  out.sort((a, b) => b.reportedCount - a.reportedCount);
  return out;
};

// Catalog counts by moderation status — feeds the admin dashboard headline stats.
export const getProductStats = async () => {
  const rows = await Product.aggregate<{ _id: string; count: number }>([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const byStatus: Record<string, number> = {};
  let total = 0;
  for (const r of rows) {
    byStatus[r._id] = r.count;
    total += r.count;
  }
  return {
    total,
    pending: byStatus.pending ?? 0,
    approved: byStatus.approved ?? 0,
    rejected: byStatus.rejected ?? 0,
  };
};

export const setProductStatus = async (
  productId: string,
  status: string,
  reason?: string,
) => {
  if (!["approved", "rejected", "pending"].includes(status)) {
    throw new Error("INVALID_STATUS");
  }
  const update: Record<string, unknown> = { status };
  update.rejectionReason = status === "rejected" ? reason ?? "" : undefined;
  const product = await Product.findByIdAndUpdate(productId, update, {
    new: true,
  });
  if (!product) throw new Error("Product does not exists");
  return product;
};
