import { Router } from "express";
import {upload} from '../middlewares/multer.middleware.js'
import {LoginUser, LogoutUser, refreshTaccessToken, registerUser} from '../controllers/user.controller.js'
import { VerifyJwt } from "../middlewares/auth.middleware.js";
const userrouter=Router()
userrouter.route('/register').post(
    upload.fields([
   {name:'avatar',
maxCount:1},
   {
    name:'coverImage',
    maxCount:1
   }
    ]),
    registerUser)
    userrouter.route('/Login').post(LoginUser)
    //secure routes
    userrouter.route('/Logout').post(VerifyJwt, LogoutUser)
    userrouter.route('/refresh-token').post(refreshTaccessToken)
export default userrouter