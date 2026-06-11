import { createLogger } from "~/lib/logger";
import { UserModel } from "~/modules/authentication/authentication.model";
import { UserRole } from "~/modules/authentication/authentication.types";
import bcrypt from "bcryptjs";

const logger = createLogger("ReviewWorkflowSeed");

export async function seedReviewWorkflow() {
  const agencyExists = await UserModel.findOne({ email: "agency@demo.com" });
  const clientExists = await UserModel.findOne({ email: "client@demo.com" });

  if (!agencyExists) {
    await UserModel.create({
      username: "demo_agency",
      email: "agency@demo.com",
      password_hash: await bcrypt.hash("password123", 12),
      role: UserRole.Agency,
      is_active: true,
      email_verified: true,
      profile: { display_name: "Demo Agency" },
    });
    logger.info("Seeded agency demo user: agency@demo.com / password123");
  }

  if (!clientExists) {
    await UserModel.create({
      username: "demo_client",
      email: "client@demo.com",
      password_hash: await bcrypt.hash("password123", 12),
      role: UserRole.Client,
      is_active: true,
      email_verified: true,
      profile: { display_name: "Demo Client" },
    });
    logger.info("Seeded client demo user: client@demo.com / password123");
  }
}
