import express from "express";
const app = express();
import cookieParser from "cookie-parser";

import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
app.use(cors({ origin: process.env.ORIGIN, credentials: true }));
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));
app.use(cookieParser());
app.use(express.static("public"));

export default app; 
