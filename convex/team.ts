import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

/**
 * Check if user has access to team page
 * Only admins, ops admins, and people managers can access
 */
export const canAccessTeamPage = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return false;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return false;
    }

    // Check if user is admin, ops admin, or people manager
    const role = user.role?.toLowerCase();
    // Handle both old string format and new boolean format
    const isPeopleManagerValue = user.isPeopleManager as boolean | string | undefined;
    const isPeopleManager = isPeopleManagerValue === true ||
                           (typeof isPeopleManagerValue === 'string' && isPeopleManagerValue.toLowerCase() === 'yes');

    return role === "admin" || role === "ops admin" || isPeopleManager;
  },
});

/**
 * Check if user is admin (for create user permission)
 */
export const isAdmin = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return false;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return false;
    }

    return user.role?.toLowerCase() === "admin";
  },
});

/**
 * Get current user ID (public)
 */
export const getCurrentUserId = query({
  args: {},
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return userId;
  },
});

/**
 * Get current user ID (internal - for use in actions)
 */
export const getCurrentUserIdInternal = query({
  args: {},
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return userId;
  },
});

/**
 * Get all users (for team page)
 * Only accessible by admins, ops admins, and people managers
 */
export const getAllUsers = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      role: v.optional(v.string()),
      isPeopleManager: v.optional(v.union(v.boolean(), v.string())),
      teamLead: v.optional(v.union(v.string(), v.null())),
      isActive: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    // Check if user has access
    const role = currentUser.role?.toLowerCase();
    // Handle both old string format and new boolean format
    const isPeopleManagerValue = currentUser.isPeopleManager as boolean | string | undefined;
    const isPeopleManager = isPeopleManagerValue === true ||
                           (typeof isPeopleManagerValue === 'string' && isPeopleManagerValue.toLowerCase() === 'yes');

    if (role !== "admin" && role !== "ops admin" && !isPeopleManager) {
      throw new Error("Unauthorized: You don't have permission to view the team");
    }

    // Get all users
    const users = await ctx.db.query("users").collect();

    return users.map(user => ({
      _id: user._id,
      _creationTime: user._creationTime,
      name: user.name,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isPeopleManager: user.isPeopleManager,
      teamLead: user.teamLead,
      isActive: user.isActive,
    }));
  },
});

/**
 * Get all team leads (users with role "Team Lead")
 */
export const getTeamLeads = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Get all users who are people managers
    const users = await ctx.db.query("users").collect();
    const teamLeads = users.filter(user =>
      user.isPeopleManager === true ||
      user.isPeopleManager === 'Yes' ||
      user.isPeopleManager === 'yes'
    );

    return teamLeads.map(lead => ({
      _id: lead._id,
      name: lead.name,
      firstName: lead.firstName,
      lastName: lead.lastName,
    }));
  },
});

/**
 * Create a new user (admin only)
 * Uses bcrypt to hash password and stores it in Convex Auth format
 */
export const createUser = action({
  args: {
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.string(),
    isPeopleManager: v.boolean(),
    teamLead: v.union(v.string(), v.null()),
    isActive: v.boolean(),
  },
  returns: v.id("users"),
  handler: async (ctx, args): Promise<Id<"users">> => {
    // Verify admin permissions
    const userId = await ctx.runQuery(api.team.getCurrentUserIdInternal);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const isAdmin = await ctx.runQuery(api.team.isAdmin);
    if (!isAdmin) {
      throw new Error("Unauthorized: Only admins can create users");
    }

    // Check if user with this email already exists
    const existingUsers = await ctx.runQuery(api.team.getAllUsers);
    if (existingUsers.some((u: any) => u.email === args.email)) {
      throw new Error("A user with this email already exists");
    }

    // Validate password
    if (args.password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    // Hash password using Scrypt (same as Convex Auth Password provider)
    const { Scrypt } = await import("lucia");
    const hashedPassword = await new Scrypt().hash(args.password);

    // Create the user with hashed password using internal mutation
    const newUserId = await ctx.runMutation(internal.team.createUserWithAuth, {
      email: args.email,
      hashedPassword,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role,
      isPeopleManager: args.isPeopleManager,
      teamLead: args.teamLead,
      isActive: args.isActive,
    });

    return newUserId;
  },
});

/**
 * Internal mutation to create user with auth account
 * This properly creates both the user profile and auth account with hashed password
 */
export const createUserWithAuth = internalMutation({
  args: {
    email: v.string(),
    hashedPassword: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.string(),
    isPeopleManager: v.boolean(),
    teamLead: v.union(v.string(), v.null()),
    isActive: v.boolean(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    // Create the user profile first
    const newUserId = await ctx.db.insert("users", {
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      name: `${args.firstName} ${args.lastName}`,
      role: args.role,
      isPeopleManager: args.isPeopleManager,
      teamLead: args.teamLead,
      isActive: args.isActive,
      emailVerificationTime: Date.now(), // Mark email as verified
    });

    // Create auth account with hashed password in Convex Auth format
    // The secret field stores the Scrypt hash directly (Lucia format)
    try {
      await ctx.db.insert("authAccounts", {
        userId: newUserId,
        provider: "password",
        providerAccountId: args.email,
        // Convex Auth Password provider expects the Scrypt hash directly
        secret: args.hashedPassword,
      } as any);
    } catch (error: any) {
      // If auth account creation fails, clean up the user
      await ctx.db.delete(newUserId);
      throw new Error(`Failed to create auth account: ${error.message}`);
    }

    return newUserId;
  },
});

/**
 * Update user (admin only)
 */
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.string(),
    isPeopleManager: v.boolean(),
    teamLead: v.union(v.string(), v.null()),
    isActive: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    // Only admins can update users
    if (currentUser.role?.toLowerCase() !== "admin") {
      throw new Error("Unauthorized: Only admins can update users");
    }

    // Check if user exists
    const userToUpdate = await ctx.db.get(args.userId);
    if (!userToUpdate) {
      throw new Error("User not found");
    }

    // Check if email is being changed and if new email already exists
    if (userToUpdate.email !== args.email) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.email))
        .first();

      if (existingUser && existingUser._id !== args.userId) {
        throw new Error("A user with this email already exists");
      }
    }

    // Update the user
    await ctx.db.patch(args.userId, {
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      name: `${args.firstName} ${args.lastName}`,
      role: args.role,
      isPeopleManager: args.isPeopleManager,
      teamLead: args.teamLead,
      isActive: args.isActive,
    });

    return null;
  },
});

/**
 * Deactivate user (admin only)
 */
export const deactivateUser = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    // Only admins can deactivate users
    if (currentUser.role?.toLowerCase() !== "admin") {
      throw new Error("Unauthorized: Only admins can deactivate users");
    }

    // Check if trying to deactivate themselves
    if (userId === args.userId) {
      throw new Error("You cannot deactivate your own account");
    }

    // Check if user exists
    const userToDeactivate = await ctx.db.get(args.userId);
    if (!userToDeactivate) {
      throw new Error("User not found");
    }

    // Deactivate the user
    await ctx.db.patch(args.userId, {
      isActive: false,
    });

    return null;
  },
});

/**
 * Reactivate user (admin only)
 */
export const reactivateUser = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    // Only admins can reactivate users
    if (currentUser.role?.toLowerCase() !== "admin") {
      throw new Error("Unauthorized: Only admins can reactivate users");
    }

    // Check if user exists
    const userToReactivate = await ctx.db.get(args.userId);
    if (!userToReactivate) {
      throw new Error("User not found");
    }

    // Reactivate the user
    await ctx.db.patch(args.userId, {
      isActive: true,
    });

    return null;
  },
});
