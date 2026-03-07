import jwt  from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/userModel.js";

export const verifyJwt = asyncHandler(async (req, res, next) => {
	try {
		console.log(req.cookies);
		const token =
		        req.cookies?.AccessToken ||
				req.header("Authorization")?.replace("Bearer ", "");
			
		    if (!token) {
		        throw new ApiError(401, "Unauthorized Access please Login Again");
			}
			
		    const decodedObj = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
		    const user = await User.findById({ _id: decodedObj?._id }).select(
		        "-password -refreshToken"
			);
			
		    if (!user) {
		        throw new ApiError(401, "Invalid Token Please Login Again");
			}
			
		    req.user = user;
		    next();
	} catch (error) {
		throw new ApiError(401, error.message);
	}
});
