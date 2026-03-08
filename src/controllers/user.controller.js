import { User } from "../models/userModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"

const generateAccessTokenAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findOne(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        if (!accessToken) {
            throw new Error("");
        }
        if (!refreshToken) {
            throw new Error("");
        }
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            509,
            "Something went wrong while creating the accessToken"
        );
    }
};

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
    let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files?.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }

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
        coverImage:
            coverImage?.url ||
            "https://tse2.mm.bing.net/th/id/OIP.ApNxYFNHR3iaLRlDdE8-FAHaCe?pid=Api&P=0&h=180",
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
    console.log(registeredUser);
    return res
        .status(201)
        .json(
            new ApiResponse(200, registeredUser, "Registration Successfull!!")
        );
});

const loginUser = asyncHandler(async (req, res) => {
	console.log("printing req.body ", req.body);
    const { email, userName, password } = req.body;
    if (!(email || userName)) {
        throw new ApiError(400, "Email or userName is required!!");
    }
	const user = await User.findOne({ $or: [{ email }, { userName }] });
    if (!user) {
        throw new ApiError(404, "Invalid Credentials!!");
    }
    const ispasswordValid = await user.isPasswordCorrect(password);
    if (!ispasswordValid) {
        throw new ApiError(404, "Invalid Credentials!!");
    }

    const { accessToken, refreshToken } =
		await generateAccessTokenAndRefreshTokens(user._id);
	await User.findByIdAndUpdate({ _id:user._id },{ refreshToken: refreshToken });
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("AccessToken", accessToken, options)
        .cookie("RefreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "Login SuccessFull!!"
            )
        );
});

const logOut = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    await User.findByIdAndUpdate(
        _id,
        { $set: { refreshToken: undefined } },
        { returnDocument:"after"}
	);

	 const options = {
         httpOnly: true,
         secure: true,
     };
	return res.status(201).clearCookie("RefreshToken", options).clearCookie("AccessToken", options).json(new ApiResponse(200,{},"LogOut SuccessFull"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req?.cookies?.RefreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid RefreshToken");
        }
		//taking about this comparison
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token Invalid");
        }
		//creating new refreshToken
        const { accessToken, newRefreshToken } =
			await generateAccessTokenAndRefreshTokens(user._id);
		//=============================================================================================================
		//replacing the old refreshtoken with new refresh token as if don't do so ,
		// the above comparison will be done with old refreshToken and it fails;
		//=============================================================================================================
        await User.findByIdAndUpdate(user._id, {
            $set: { refreshToken: newRefreshToken },
        });

        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("AccessToken", accessToken, options)
            .cookie("RefreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token Refreshed!!"
                )
            );
    } catch (error) {
        throw new ApiError(401, "Unauthorized Access");
    }
});
export { registerUser, loginUser, logOut,refreshAccessToken};
