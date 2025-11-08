import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Migration: Update all existing users with default values for new fields
 * Run this once to migrate existing users to the new schema
 */
export const migrateUsersToNewSchema = mutation({
  args: {},
  returns: v.object({
    updated: v.number(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    // Get all users
    const users = await ctx.db.query("users").collect();
    let updated = 0;

    for (const user of users) {
      const updates: Record<string, any> = {};

      // Set isActive to true if undefined
      if (user.isActive === undefined) {
        updates.isActive = true;
      }

      // Convert isPeopleManager from string to boolean if needed
      const isPeopleManagerValue = user.isPeopleManager as boolean | string | undefined;
      if (typeof isPeopleManagerValue === 'string') {
        updates.isPeopleManager = isPeopleManagerValue.toLowerCase() === 'yes';
      } else if (isPeopleManagerValue === undefined) {
        updates.isPeopleManager = false;
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(user._id, updates);
        updated++;
      }
    }

    return {
      updated,
      message: `Successfully migrated ${updated} users to the new schema`,
    };
  },
});

/**
 * Migration: Fix role capitalization
 * Ensures all roles have proper capitalization (Admin, Ops Admin, etc.)
 */
export const fixRoleCapitalization = mutation({
  args: {},
  returns: v.object({
    updated: v.number(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    // Get all users
    const users = await ctx.db.query("users").collect();
    let updated = 0;

    // Map of lowercase to proper capitalization
    const roleMapping: Record<string, string> = {
      "admin": "Admin",
      "ops admin": "Ops Admin",
      "kyc analyst": "KYC Analyst",
      "qc analyst": "QC Analyst",
      "team lead": "Team Lead",
    };

    for (const user of users) {
      if (user.role) {
        const lowerRole = user.role.toLowerCase();
        const properRole = roleMapping[lowerRole];

        // If role needs to be fixed
        if (properRole && user.role !== properRole) {
          await ctx.db.patch(user._id, {
            role: properRole,
          });
          updated++;
        }
      }
    }

    return {
      updated,
      message: `Successfully fixed capitalization for ${updated} user roles`,
    };
  },
});
