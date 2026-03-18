import cloudinary from "../config/cloudinary";
import { Product, PProduct } from "../models/product.model";

const track: {
  price: number;
  sale: number;
  numPurchases: number;
  point: number;
} = {
  price: 1000,
  sale: 800,
  numPurchases: 1500,
  point: 1000,
};

export const createProduct = async (
  name: string,
  description: string,
  price: number,
  fileBuffer: Buffer,
  type: string,
  point: number = 0,
  sale?: number,
  numPurchases?: number,
) => {
  const imageUrl = await new Promise<string>((resolve, reject) => {
    // Create an upload stream to Cloudinary
    // The callback is triggered once the upload completes or fails
    const stream = cloudinary.uploader.upload_stream(
      { folder: "Product" }, // save to "Product" folder on Cloudinary
      (error, result) => {
        if (error)
          reject(error); // upload failed → reject with error
        else resolve(result!.secure_url); // upload succeeded → resolve with image URL
      },
    );
    // Push the file Buffer (received from Multer) into the stream to start uploading
    stream.end(fileBuffer);
  });

  const normalize = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const product = await Product.create({
    name,
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
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product does not exists");
  return product;
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
  const query: any = {};
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
  const query: any = {};
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
  const query: any = {};
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
  const query: Record<string, unknown> = { type };
  if (lastId) {
    query._id = { $gt: lastId };
  }
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
          items = await Product.find()
            .sort({ [element]: -1, _id: 1, [ord]: 1 })
            .limit(limit);
          const lastItem = items[items.length - 1];
          if (lastItem) {
            lastPriceId = lastItem._id.toString();
            lastPrice = lastItem.price;
          }
        } else if (ord === "sale") {
          items = await Product.find()
            .sort({ [element]: -1, _id: 1, [ord]: -1 })
            .limit(limit);
          const lastItem = items[items.length - 1];
          if (lastItem) {
            lastSaleId = lastItem._id.toString();
            lastSale = lastItem.sale ?? 0;
          }
        } else if (ord === "numPurchases") {
          items = await Product.find()
            .sort({ [element]: -1, _id: 1, [ord]: -1 })
            .limit(limit);
          const lastItem = items[items.length - 1];
          if (lastItem) {
            lastnumPurchasesId = lastItem._id.toString();
            lastnumPurchases = lastItem.numPurchases ?? 0;
          }
        } else if (ord === "point") {
          items = await Product.find()
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

  const items = await Product.find({
    normalize: { $regex: normalizedFind, $options: "i" },
  }).limit(limit);

  for (const item of items) {
    item.track =
      item.price * track.price +
      (item.sale ?? 0) * track.sale +
      (item.numPurchases ?? 0) * track.numPurchases +
      item.point * track.point;
  }

  const filtered =
    lastTrack !== undefined && lastId
      ? items.filter(
          (item) =>
            (item.track ?? 0) < lastTrack ||
            ((item.track ?? 0) === lastTrack && item._id.toString() > lastId),
        )
      : items;

  filtered.sort((a, b) => (b.track ?? 0) - (a.track ?? 0));

  const lastItem = filtered[filtered.length - 1];
  return {
    items: filtered,
    nextCursor: lastItem
      ? { lastTrack: lastItem.track, lastId: lastItem._id }
      : null,
  };
};
