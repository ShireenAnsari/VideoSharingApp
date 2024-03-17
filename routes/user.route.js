import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  LoginUser,
  LogoutUser,
  UpdateAvatar,
  UpdateCoverimg,
  changeCurrentPassword,
  getCurrentUser,
  refreshTaccessToken,
  registerUser,
  updateAccountDetaills,
} from "../controllers/user.controller.js";
import { VerifyJwt } from "../middlewares/auth.middleware.js";
const userrouter = Router();
userrouter.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
userrouter.route("/Login").post(LoginUser);
//secure routes
// Get id from cookies
userrouter.route("/refresh-token").post(refreshTaccessToken);
// When user is Logged in
userrouter.route("/Logout").post(VerifyJwt, LogoutUser);
userrouter.route("/Changepassword").post(VerifyJwt, changeCurrentPassword);
userrouter.route("/Current-user").get(VerifyJwt, getCurrentUser);
userrouter.route("/updateaccountDetails").put(VerifyJwt, updateAccountDetaills);
userrouter.route("/updateAvatar").put(VerifyJwt, UpdateAvatar);
userrouter.route("/updateCoverimg").put(VerifyJwt, UpdateCoverimg);

export default userrouter;
