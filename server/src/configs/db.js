import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => console.log("✅ Database connected"));
    mongoose.connection.on("error", (err) => console.log("❌ DB Error:", err));

    await mongoose.connect(`${process.env.MONGODB_URL}/hive`);
  } catch (error) {
    console.log("❌ Database connection failed:", error.message);
  }
};

export default connectDB;
