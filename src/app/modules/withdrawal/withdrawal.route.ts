import { Router } from "express";
import auth from "../../middlewares/auth";
import RequestValidator from "../../middlewares/request_validator";
import { withdrawal_controllers } from "./withdrawal.controller";
import { withdrawal_validations } from "./withdrawal.validation";

const router = Router();

// User routes
router.post(
  "/request",
  auth("USER", "ADMIN", "MASTER"),
  RequestValidator(withdrawal_validations.create_withdrawal_request),
  withdrawal_controllers.create_withdrawal_request,
);

router.get(
  "/my-requests",
  auth("USER", "ADMIN", "MASTER"),
  withdrawal_controllers.get_my_withdrawals,
);

// Admin routes
router.get(
  "/all-requests",
  auth("ADMIN"),
  withdrawal_controllers.get_all_withdrawals,
);

router.patch(
  "/status/:id",
  auth("ADMIN"),
  RequestValidator(withdrawal_validations.update_withdrawal_status),
  withdrawal_controllers.update_withdrawal_status,
);

export const withdrawal_routes = router;
