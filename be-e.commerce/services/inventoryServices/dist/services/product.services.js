"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackingWithoutData = exports.trackRecommendation = exports.findProduct = exports.getTopByListType = exports.getTopByType = exports.getTopPoint = exports.getTopSale = exports.getTopProductPurchases = exports.getTopByField = exports.getProductById = exports.createProduct = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const product_model_1 = require("../models/product.model");
const redis_service_1 = require("./redis.service");
const track = {
    price: 1,
    sale: 0.8,
    numPurchases: 1.5,
    point: 10,
};
const createProduct = async (name, description, price, fileBuffer, type, point = 0, sale, numPurchases) => {
    const imageUrl = await new Promise((resolve, reject) => {
        // Create an upload stream to Cloudinary
        // The callback is triggered once the upload completes or fails
        const stream = cloudinary_1.default.uploader.upload_stream({ folder: "Product" }, // save to "Product" folder on Cloudinary
        (error, result) => {
            if (error)
                reject(error); // upload failed → reject with error
            else
                resolve(result.secure_url); // upload succeeded → resolve with image URL
        });
        // Push the file Buffer (received from Multer) into the stream to start uploading
        stream.end(fileBuffer);
    });
    const normalize = name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    const product = await product_model_1.Product.create({
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
exports.createProduct = createProduct;
const getProductById = async (productId) => {
    const product = await product_model_1.Product.findById(productId);
    if (!product)
        throw new Error("Product does not exists");
    return product;
};
exports.getProductById = getProductById;
const getTopByField = async (field, value) => {
    const exist = await product_model_1.Product.exists({ field: { $exist: true } });
    if (!exist)
        throw new Error("Field does not exists");
    const rs = await product_model_1.Product.find({ [field]: value })
        .sort({ field: -1 })
        .limit(10);
    if (!rs.length)
        throw new Error(`Field "${field}" does not exist`);
    return rs;
};
exports.getTopByField = getTopByField;
const getTopProductPurchases = async (limit = 10, lastnumPurchases, lastId) => {
    const query = {};
    if (lastnumPurchases != undefined && lastId) {
        query.$or = [
            { numPurchases: { $lt: lastnumPurchases } },
            {
                numPurchases: lastnumPurchases,
                _id: { $gt: lastId },
            },
        ];
    }
    const items = await product_model_1.Product.find(query)
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
exports.getTopProductPurchases = getTopProductPurchases;
const getTopSale = async (limit = 10, lastSale, lastId) => {
    const query = {};
    if (lastSale != undefined && lastId) {
        query.$or = [
            { sale: { $lt: lastSale } },
            {
                sale: lastSale,
                _id: { $gt: lastId },
            },
        ];
    }
    const items = await product_model_1.Product.find(query)
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
exports.getTopSale = getTopSale;
const getTopPoint = async (limit = 10, lastPoint, lastId) => {
    const query = {};
    if (lastPoint != undefined && lastId) {
        query.$or = [
            { point: { $lt: lastPoint } },
            {
                point: lastPoint,
                _id: { $gt: lastId },
            },
        ];
    }
    const items = await product_model_1.Product.find(query)
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
exports.getTopPoint = getTopPoint;
const getTopByType = async (limit = 10, lastId, type) => {
    const query = { type };
    if (lastId) {
        query._id = { $gt: lastId };
    }
    const items = await product_model_1.Product.find(query)
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
exports.getTopByType = getTopByType;
const getTopByListType = async (limit = 2, type) => {
    const listItems = [];
    let lastPriceId = "";
    let lastSaleId = "";
    let lastnumPurchasesId = "";
    let lastPointId = "";
    let lastPrice = 0;
    let lastSale = 0;
    let lastnumPurchases = 0;
    let lastPoint = 0;
    const order = ["price", "sale", "numPurchases", "point"];
    let hasMore = true;
    while (listItems.length < limit && hasMore) {
        let added = 0;
        for (const element of type) {
            for (const ord of order) {
                if (listItems.length >= limit)
                    break;
                let items = [];
                if (ord === "price") {
                    items = await product_model_1.Product.find()
                        .sort({ [element]: -1, _id: 1, [ord]: 1 })
                        .limit(limit);
                    const lastItem = items[items.length - 1];
                    if (lastItem) {
                        lastPriceId = lastItem._id.toString();
                        lastPrice = lastItem.price;
                    }
                }
                else if (ord === "sale") {
                    items = await product_model_1.Product.find()
                        .sort({ [element]: -1, _id: 1, [ord]: -1 })
                        .limit(limit);
                    const lastItem = items[items.length - 1];
                    if (lastItem) {
                        lastSaleId = lastItem._id.toString();
                        lastSale = lastItem.sale ?? 0;
                    }
                }
                else if (ord === "numPurchases") {
                    items = await product_model_1.Product.find()
                        .sort({ [element]: -1, _id: 1, [ord]: -1 })
                        .limit(limit);
                    const lastItem = items[items.length - 1];
                    if (lastItem) {
                        lastnumPurchasesId = lastItem._id.toString();
                        lastnumPurchases = lastItem.numPurchases ?? 0;
                    }
                }
                else if (ord === "point") {
                    items = await product_model_1.Product.find()
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
        if (added === 0)
            hasMore = false;
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
exports.getTopByListType = getTopByListType;
const findProduct = async (find, limit = 10, lastTrack, lastId) => {
    const normalizedFind = find
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    const items = await product_model_1.Product.find({
        normalize: { $regex: normalizedFind, $options: "i" },
    }).limit(limit);
    for (const item of items) {
        item.track =
            item.price * track.price +
                (item.sale ?? 0) * track.sale +
                (item.numPurchases ?? 0) * track.numPurchases +
                item.point * track.point;
    }
    const filtered = lastTrack !== undefined && lastId
        ? items.filter((item) => (item.track ?? 0) < lastTrack ||
            ((item.track ?? 0) === lastTrack && item._id.toString() > lastId))
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
exports.findProduct = findProduct;
const ACTIVITY = {
    view: 1500,
    search: 200,
    click: 300,
    buy: 500,
};
const trackRecommendation = async (data) => {
    const { userId, events } = data;
    const listItems = [];
    let lastFindId = "";
    let lastFindTrack = 0;
    let lastPurchasesId = "";
    let lastPurchasesNum = 0;
    let lastSaleId = "";
    let lastSaleNum = 0;
    let lastPointId = "";
    let lastPointNum = 0;
    for (const event of events) {
        const { activity, productId, categoryId, keyword } = event;
        if (activity === "search" && keyword && keyword !== "") {
            const result = await (0, exports.findProduct)(keyword.toString(), 2, lastFindTrack, lastFindId);
            const lastItem = result.items[result.items.length - 1];
            if (lastItem) {
                lastFindId = lastItem._id.toString();
                lastFindTrack = Number(lastItem.track ?? 0);
                listItems.push(...result.items);
            }
        }
        if ((activity === "view" || activity === "click") && categoryId) {
            const result = await (0, exports.getTopByType)(2, lastPurchasesId, categoryId);
            const lastItem = result.items[result.items.length - 1];
            if (lastItem) {
                lastPurchasesId = lastItem._id.toString();
                listItems.push(...result.items);
            }
        }
        // if (activity === "buy") {
        //   const result = await getTopProductPurchases(
        //     2,
        //     lastPurchasesNum,
        //     lastPurchasesId,
        //   );
        //   const lastItem = result.items[result.items.length - 1];
        //   if (lastItem) {
        //     lastPurchasesId = lastItem._id.toString();
        //     lastPurchasesNum = lastItem.numPurchases ?? 0;
        //     listItems.push(...result.items);
        //   }
        // }
    }
    for (const item of listItems) {
        item.track =
            item.price * track.price +
                (item.sale ?? 0) * track.sale +
                (item.numPurchases ?? 0) * track.numPurchases +
                item.point * track.point;
    }
    listItems.sort((a, b) => (b.track ?? 0) - (a.track ?? 0));
    await redis_service_1.redisService.setRecommendationData(userId, {
        productId: listItems.map((item) => item._id.toString()),
        types: [...new Set(listItems.map((item) => item.type))],
        updatedAt: new Date(),
    });
    return {
        userId,
        total: listItems.length,
        cursors: {
            lastFindId,
            lastFindTrack,
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
exports.trackRecommendation = trackRecommendation;
const trackingWithoutData = async () => {
    const listItems = [];
    let lastPurchasesId = "";
    let lastPurchasesNum = 0;
    let lastSaleId = "";
    let lastSaleNum = 0;
    let lastPointId = "";
    let lastPointNum = 0;
    const data = await product_model_1.Product.find({}).limit(5);
    console.log(data.length);
    const resultPurchases = await (0, exports.getTopProductPurchases)(2, lastPurchasesNum, lastPurchasesId);
    const lastPurchasesItem = resultPurchases.items[resultPurchases.items.length - 1];
    if (lastPurchasesItem) {
        lastPurchasesId = lastPurchasesItem._id.toString();
        lastPurchasesNum = lastPurchasesItem.numPurchases ?? 0;
        listItems.push(...resultPurchases.items);
    }
    const resultPoint = await (0, exports.getTopPoint)(2, lastPointNum, lastPointId);
    const lastPointItem = resultPoint.items[resultPoint.items.length - 1];
    if (lastPointItem) {
        lastPointId = lastPointItem._id.toString();
        lastPointNum = lastPointItem.point ?? 0;
        listItems.push(...resultPoint.items);
    }
    const resultSale = await (0, exports.getTopSale)(2, lastSaleNum, lastSaleId);
    const lastSaleItem = resultSale.items[resultSale.items.length - 1];
    if (lastSaleItem) {
        lastSaleId = lastSaleItem._id.toString();
        lastSaleNum = lastSaleItem.sale ?? 0;
        listItems.push(...resultSale.items);
    }
    const seen = new Set();
    const uniqueItems = listItems.filter((item) => {
        const id = item._id.toString();
        if (seen.has(id))
            return false;
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
exports.trackingWithoutData = trackingWithoutData;
//# sourceMappingURL=product.services.js.map