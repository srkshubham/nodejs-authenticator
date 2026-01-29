import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    // console.log("mongodb is connected");
  } catch (error) {
    // console.log("Mongodb connection error");
    process.exit(1);
  }
};

export default connectDB;
