import { User } from "../models/userModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password, userName } = req.body;

    if ([fullName, email, password].some((fields) => fields?.trim() === "")) {
        throw new ApiError(400, "All fileds are required");
    }

    const registerdUser = await User.findOne({ $or: [{ email, userName }] });
    if (registerdUser) {
        throw new ApiError(409, "Already registered ");
    }
	console.log("avatar:-", req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(409, "Avatar Image is required!!");
	}
	
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(
            500,
            "Something went Wrong Please upload the avatar image once again"
        );
    }

    // if (!coverImage) {
    //     throw new ApiError(
    //         500,
    //         "Something went Wrong Please upload the coverImage image once again"
    //     );
    // }

    const user = await User.create({
        fullName: fullName,
        avatar: avatar.url,
        email: email,
        password: password,
        userName: userName.toLowerCase(),
        coverImage: coverImage?.url || "",
    });
    if (!user) {
        throw new ApiError(500, "Unable to create your account right now");
    }
    const registeredUser = await User.findById({ _id: user?._id }).select(
        "-password -refreshToken"
    );
    if (!registeredUser) {
        throw new ApiError(500, "Unable to create your account right now");
    }

	return res.status(201).json(new ApiResponse(200,registerUser,"Registration Successfull!!"))
    console.log("Email:-", email);
});
export default registerUser;
