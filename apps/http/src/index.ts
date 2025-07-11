import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoute from "./routes/userRoutes";
import "dotenv/config";
import canteenRoutes from "./routes/canteenRoutes";
import orderRouter from "./routes/orderRoutes";
import Razorpay from "razorpay";
import path from "path";
import {
  prometheusMiddleware,
  register,
} from "./middlewares/prometheusMiddleware";

const app = express();
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(prometheusMiddleware);
app.use(bodyParser.json({ limit: "35mb" }));
app.use(cookieParser());

export const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY || "your-razorpay-keyid",
  key_secret: process.env.RAZORPAY_APT_SECRET,
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// very dangerous to use in prod.
// app.get("/slow",async(req,res)=>{
//   try {
//     await new Promise((resolve)=>setTimeout(resolve,3000));
//     res.send("done");
//   } catch (err) {
//     res.status(500).end(err);
//   }
// });

app.use("/api/v1", userRoute);
app.use("/api/v1", canteenRoutes);
app.use("/api/v1", orderRouter);

app.listen(process.env.PORT, () => {
  console.log("Listening on port " + process.env.PORT);
});
