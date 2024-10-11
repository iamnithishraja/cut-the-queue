import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import userRoute from "./routes/userRoutes";
import 'dotenv/config'
import canteenRoutes from "./routes/canteenRoutes";
const app = express();
app.use(bodyParser.json({ limit: "35mb" }));
app.use(cookieParser());

app.use("/api/v1", userRoute);
app.use("/api/v2",canteenRoutes);
app.listen(process.env.PORT, () => {
  console.log("listning on port " + process.env.PORT);
});
