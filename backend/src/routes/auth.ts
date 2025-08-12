import { Router } from "express";
import {
  register,
  login,
  me,
  logout,
  updateProfile,
  updatePassword,
  updateProfilePicture,
} from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", me);
router.post("/logout", logout);
router.put("/profile", updateProfile);
router.put("/password", updatePassword);
router.put("/profile-picture", updateProfilePicture);

export default router;
