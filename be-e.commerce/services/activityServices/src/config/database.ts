import mongoose from "mongoose";
export const connectDatabase = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI || "mongodb://mongodb:27017/activity";

    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err);
});
