import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import userRoute from "./routes/userRoutes";
import 'dotenv/config'

const app = express();
app.use(bodyParser.json({ limit: "35mb" }));
app.use(cookieParser());

app.use("/api/v1", userRoute);

app.listen(process.env.PORT, () => {
  console.log("listning on port " + process.env.PORT);
});
