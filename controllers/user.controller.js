import { asyncHandler } from "../utils/asynchandler.js";
import { APIError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { DeletefromCloudinary, uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import jwt from "jsonwebtoken";
const generateAccessAndrefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generaterefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new APIError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};
const registerUser = asyncHandler(async (req, res) => {
  //get user details
  //velidation- not empty
  //check user exist or not: username email
  //check for images, check for avatar
  //upload them to cloudnary,avatar
  //create user object-create entry
  //remove password and refresh token field from response
  //check for user creation
  //return response
  const { fullname, email, username, password } = req.body;
  console.log("email:", email);
  if (fullname === "") {
    throw new APIError(400, "Fullname is required");
  }
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new APIError(400, "All fields all required");
  }
  const existeduser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existeduser) {
    throw new APIError(409, "User with email or username already exist");
  }
  const avatarLocalpath = req.files?.avatar[0]?.path;
  console.log(avatarLocalpath);
  // const Coverimglocalpth=req.files?.coverImg[0]?.path
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.Length > 0
  ) {
    //if it incounters an error of cannot had property of undefined reading null in cover image
    coverImageLocalPath = req.files?.coverImg[0]?.path;
  }
  if (!avatarLocalpath) {
    throw new APIError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalpath);
  const Coverimg = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new APIError(400, "Avatar file is required");
  }
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    Coverimg: Coverimg?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new APIError(500, "Error creating user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const LoginUser = asyncHandler(
  asyncHandler(async (req, res) => {
    //req body->data
    //username or email
    //find user
    //password check
    //access and refresh token
    //send cookies
    const { email, username, password } = req.body;
    if (!username && !email) {
      throw new APIError(400, "username or password is required");
    }
    const user = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (!user) {
      throw new APIError(404, "User does not exist");
    }
    const isPasswordvalid = await user.isPasswordCorrect(password);
    if (!isPasswordvalid) {
      throw new APIError(401, "Invalid user credentials");
    }
    const { accessToken, refreshToken } = await generateAccessAndrefreshTokens(
      user._id
    );
    const LoggedInuser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: LoggedInuser,
            accessToken,
            refreshToken,
          },
          "User logged in Successfully"
        )
      );
  })
);
const LogoutUser = asyncHandler(async (req, res) => {
  const _id = req.user._id;
  await User.findByIdAndUpdate(
    _id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Loggedout successfully"));
});
const refreshTaccessToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incommingRefreshToken) {
    throw new APIError(401, "unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new APIError(401, "Invalid refresh token");
    }
    if (incommingRefreshToken !== user?.refreshToken) {
      throw new APIError(401, "Refresh token is expiired or used");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newrefreshToken } =
      await generateAccessAndrefreshTokens(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newrefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw APIError(401, error?.message || "Error ");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  // if(!(newPassword===confirmPass))
  // {
  //     throw  new APIError(401,"Confirm password and new password did not changed");
  // }
  const user = await User.findById(req.user?._id);
  const ispasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!ispasswordCorrect) {
    throw new APIError(400, "Invalid old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully");
});
const updateAccountDetaills = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new APIError(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email: email,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Accountt updated successfully"));
});
const UpdateAvatar = asyncHandler(async (req, res) => {
  const AvatarLocalpath = (req.file?.path = req.body);
  // const _id = req.user?._id;
  // const GetUser=await  User.findById(_id)
  // console.log(GetUser)
  // if(!GetUser)
  // {
  //   throw new APIError(400,"User not found")
  // }
  // const getavatarpath=GetUser?.avatar;
  // DeletefromCloudinary(getavatarpath);
  if (!AvatarLocalpath) {
    throw new APIError(400, "Avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(AvatarLocalpath);
  if (!avatar?.url) {
    throw new APIError(400, "Error while uploading an avatar");
  }
  
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar?.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});
const UpdateCoverimg = asyncHandler(async (req, res) => {
  const CoverLocalpath = (req.file?.path = req.body);
  if (!CoverLocalpath) {
    throw new APIError(400, "Cover file is missing");
  }
  const cover = await uploadOnCloudinary(CoverLocalpath);
  if (!cover?.url) {
    throw new APIError(400, "Error while uploading an Coverimg");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: cover?.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});
export {
  registerUser,
  LoginUser,
  LogoutUser,
  refreshTaccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetaills,
  UpdateAvatar,
  UpdateCoverimg,
};
