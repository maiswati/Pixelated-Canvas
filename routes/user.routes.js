import { Router } from "express";
import {  buildUserProfile, login, registerUser } from "../controllers/user.controller.js";
const router = Router();

router.route('/register').post(registerUser);
router.route('/login').post(login);
router.route('/userprofile/:id').get(buildUserProfile);
export default router;



