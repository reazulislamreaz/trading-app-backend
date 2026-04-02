import bcrypt from "bcrypt";
import { Account_Model } from "../modules/auth/auth.schema";
import { configs } from "../configs";
import { User_Model } from "../modules/user/user.schema";

const seedAdmin = async () => {
  const adminEmail = configs.seed.admin_email;

  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL not found in env");
  }

  const isExist = await Account_Model.findOne({ email: adminEmail });

  if (isExist) {
    console.log(" Admin already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash(
    configs.seed.admin_password as string,
    10,
  );

  const account = await Account_Model.create({
    email: adminEmail,
    password: hashedPassword,
    role: "ADMIN",
    isVerified: true,
  });
  await User_Model.create({
    name: "Admin",
    accountId: account._id,
  });
  console.log("Admin created successfully");
};

export default seedAdmin;
