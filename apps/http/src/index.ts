import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoute from "./routes/userRoutes";
import "dotenv/config";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(bodyParser.json({ limit: "35mb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Api test route");
});

app.use("/api/v1", userRoute);

app.listen(process.env.PORT, () => {
  console.log("Listening on port " + process.env.PORT);
});
