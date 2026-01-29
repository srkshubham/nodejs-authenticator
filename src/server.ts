import dotenv from "dotenv";
import connectDB from "./config/db";
import http from "http";
import app from "./app";

dotenv.config();
const Port = process.env.PORT || 3000;
const startServer = async () => {
  await connectDB();
  const server = http.createServer(app);

  server.listen(Port, () => {
    console.log(`Server is running on port: ${Port}`);
  });
};

startServer().catch((err) => {
  console.error("Error while starting the server", err);
  process.exit(1);
});
