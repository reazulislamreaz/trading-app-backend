import { Router } from "express";
import auth from "../../middlewares/auth";
import RequestValidator from "../../middlewares/request_validator";
import { system_config_controllers } from "./system_config.controller";
import { system_config_validations } from "./system_config.validation";

const router = Router();

router.get(
  "/",
  auth("ADMIN", "MASTER"),
  system_config_controllers.get_config
);

router.patch(
  "/referral-reward",
  auth("ADMIN", "MASTER"),
  RequestValidator(system_config_validations.update_referral_reward),
  system_config_controllers.update_referral_reward
);

export const system_config_routes = router;
