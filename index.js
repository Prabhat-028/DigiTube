import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from "./src/db/index.js";
import express from "express";
const app = express();



connectDB().then(app.listen(process.env.PORT, async () => {
	console.log("app is successfully listening on the", process.env.PORT);
})).catch((error) => {
	console.log("Connection Failed!!", error);
});
