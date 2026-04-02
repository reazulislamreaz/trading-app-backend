import catchAsync from "../../utils/catch_async";
import manageResponse from "../../utils/manage_response";
import { user_services } from "./user.service";
import httpStatus from "http-status";

const update_profile = catchAsync(async (req, res) => {
  const result = await user_services.update_profile_into_db(req);
  manageResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Profile update successful.",
    data: result,
  });
});
const get_all_users = catchAsync(async (req, res) => {
  const result = await user_services.get_all_users_from_db(req.query);

  manageResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Users retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const get_single_user = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await user_services.get_single_user_from_db(id as string);

  manageResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User details retrieved successfully",
    data: result,
  });
});

const suspend_user = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await user_services.suspend_user_from_db(id as string);

  manageResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User suspended successfully",
    data: result,
  });
});

export const user_controllers = {
  update_profile,
  get_all_users,
  get_single_user,
  suspend_user,
};
