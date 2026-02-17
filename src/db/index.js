import mongoose from "mongoose";


import dotenv from 'dotenv';
dotenv.config();


export const connectDB = async () => {
	try {
		const connectionInstance = await mongoose.connect(
			`${process.env.MONGODB_URI}`
		);
		console.log("DataBase connected successfully!!");
		// console.log("DataBase connected successfully!!", connectionInstance);

	} catch (error) {
		console.log("error Yaha hai",error);
	}
	
};

