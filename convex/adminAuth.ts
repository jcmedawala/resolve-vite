import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Custom admin signup mutation with secret code validation.
 * This mutation validates the secret code and then updates the user profile
 * with admin-specific fields after the user is created via the standard auth flow.
 */
export const validateSecretCode = mutation({
  args: {
    secretCode: v.string(),
  },
  handler: async (_ctx, args) => {
    // Validate secret code against Convex cloud environment variable
    // This reads from the Convex dashboard environment variables (not local .env)
    const expectedSecretCode = process.env.ADMIN_SECRET_CODE;
    
    if (!expectedSecretCode) {
      throw new Error("Admin secret code not configured in Convex dashboard. Please add ADMIN_SECRET_CODE to your environment variables.");
    }
    
    if (args.secretCode !== expectedSecretCode) {
      throw new Error("Invalid secret code");
    }

    return { valid: true };
  },
});

/**
 * Update user profile with admin-specific information after signup.
 * This should be called after the user has been created through the Password provider.
 */
export const updateAdminProfile = mutation({
  args: {
    userId: v.id("users"),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      firstName: args.firstName,
      lastName: args.lastName,
      name: `${args.firstName} ${args.lastName}`,
      role: "Admin",
      isPeopleManager: false,
      teamLead: null,
      isActive: true,
    });

    return { success: true };
  },
});
