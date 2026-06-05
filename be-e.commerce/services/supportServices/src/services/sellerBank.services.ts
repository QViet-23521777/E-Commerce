import { SellerBank } from "../models/sellerBank.model";

const view = (doc: any) =>
  doc
    ? {
        sellerId: doc.sellerId,
        bankName: doc.bankName ?? "",
        accountNo: doc.accountNo ?? "",
        updatedAt: doc.updatedAt,
      }
    : { sellerId: "", bankName: "", accountNo: "" };

/** The seller's bank profile (empty shell if none saved yet). */
export const getSellerBank = async (sellerId: string) => {
  const doc = await SellerBank.findOne({ sellerId }).lean();
  return view(doc);
};

/** Upsert the seller's bank profile. */
export const saveSellerBank = async (
  sellerId: string,
  input: { bankName?: string; accountNo?: string },
) => {
  const doc = await SellerBank.findOneAndUpdate(
    { sellerId },
    {
      $set: {
        bankName: String(input.bankName || "").trim(),
        accountNo: String(input.accountNo || "").trim(),
      },
    },
    { upsert: true, new: true },
  ).lean();
  return view(doc);
};
