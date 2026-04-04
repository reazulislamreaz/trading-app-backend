import { user_controllers } from "./user.controller";
import { user_validations } from "./user.validation";
import auth from "../../middlewares/auth";
import RequestValidator from "../../middlewares/request_validator";
import { Router } from "express";

const userRoute = Router();

userRoute.patch(
  "/update-profile",
  auth("ADMIN", "USER"),
  RequestValidator(user_validations.update_user),
  user_controllers.update_profile,
);
userRoute.get("/", auth("ADMIN","USER","MASTER"), user_controllers.get_all_users);

userRoute.get("/:id", auth("ADMIN"), user_controllers.get_single_user);

userRoute.patch("/suspend/:id", auth("ADMIN"), user_controllers.suspend_user);

export default userRoute;
