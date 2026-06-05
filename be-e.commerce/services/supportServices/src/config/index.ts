import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 3009,
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/support",
};
