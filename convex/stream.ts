"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Generate a Stream Video token for the current user
 * This token is used to authenticate with the Stream Video API on the client
 */
export const generateStreamToken = action({
  args: {},
  returns: v.object({
    token: v.string(),
    userId: v.string(),
    apiKey: v.string(),
  }),
  handler: async (ctx): Promise<{ token: string; userId: string; apiKey: string }> => {
    const userId: string | null = await ctx.runQuery(api.team.getCurrentUserId);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Get user details
    const user = await ctx.runQuery(api.myFunctions.getCurrentUser);
    if (!user || user.isActive === false) {
      throw new Error("User account is not active");
    }

    // Get Stream API credentials from environment
    const apiKey = process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error(
        "Stream API credentials not configured. Please add STREAM_API_KEY and STREAM_API_SECRET to Convex environment variables."
      );
    }

    try {
      // Create Stream user ID from Convex user ID
      const streamUserId: string = userId.toString();

      // Prepare user data for Stream
      const userName = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "User";

      // Generate token using Stream's server-side SDK
      const { StreamClient } = await import("@stream-io/node-sdk");

      const streamClient = new StreamClient(apiKey, apiSecret);

      // Create or update user in Stream
      await streamClient.upsertUsers([
        {
          id: streamUserId,
          name: userName,
          role: "user",
        },
      ]);

      // Generate token for the user
      const token = streamClient.createToken(streamUserId);

      return {
        token,
        userId: streamUserId,
        apiKey,
      };
    } catch (error) {
      console.error("Error generating Stream token:", error);
      throw new Error(
        `Failed to generate Stream token: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});

/**
 * Create a call in Stream and store it in the database
 */
export const createStreamCall = action({
  args: {
    callType: v.string(),
    participantIds: v.array(v.id("users")),
    scheduledTime: v.optional(v.number()),
    metadata: v.optional(
      v.object({
        title: v.optional(v.string()),
        clientName: v.optional(v.string()),
        clientId: v.optional(v.string()),
        notes: v.optional(v.string()),
      })
    ),
  },
  returns: v.object({
    callId: v.id("calls"),
    streamCallId: v.string(),
  }),
  handler: async (ctx, args): Promise<{ callId: any; streamCallId: string }> => {
    const userId: string | null = await ctx.runQuery(api.team.getCurrentUserId);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Get Stream API credentials
    const apiKey = process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error(
        "Stream API credentials not configured. Please add STREAM_API_KEY and STREAM_API_SECRET to Convex environment variables."
      );
    }

    try {
      // Generate a unique call ID
      const streamCallId = `call-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Create the call in Stream
      const { StreamClient } = await import("@stream-io/node-sdk");
      const streamClient = new StreamClient(apiKey, apiSecret);

      // Always use "default" as Stream's call type
      // Our custom callType (one_on_one, team_meeting, kyc_session) is stored in metadata
      const streamCallType = "default";

      // Create the call
      const call = streamClient.video.call(streamCallType, streamCallId);

      await call.getOrCreate({
        data: {
          created_by_id: userId.toString(),
          starts_at: args.scheduledTime ? new Date(args.scheduledTime) : undefined,
          custom: args.metadata,
        },
      });

      // Store in Convex database
      const callId: any = await ctx.runMutation(api.calls.createCall, {
        streamCallId,
        callType: args.callType,
        participantIds: args.participantIds,
        scheduledTime: args.scheduledTime,
        metadata: args.metadata,
      });

      return {
        callId,
        streamCallId,
      };
    } catch (error) {
      console.error("Error creating Stream call:", error);
      throw new Error(
        `Failed to create Stream call: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});

/**
 * Get a Stream call and verify access
 */
export const getStreamCall = action({
  args: {
    callId: v.id("calls"),
  },
  returns: v.object({
    streamCallId: v.string(),
    callType: v.string(),
  }),
  handler: async (ctx, args): Promise<{ streamCallId: string; callType: string }> => {
    const userId: string | null = await ctx.runQuery(api.team.getCurrentUserId);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Get call from database
    const call: any = await ctx.runQuery(api.calls.getCall, {
      callId: args.callId,
    });

    if (!call) {
      throw new Error("Call not found");
    }

    return {
      streamCallId: call.streamCallId,
      callType: call.callType,
    };
  },
});

/**
 * Force end a call in Stream (for admin cleanup)
 */
export const endStreamCall = action({
  args: {
    callId: v.id("calls"),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const userId: string | null = await ctx.runQuery(api.team.getCurrentUserId);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Get call from database
    const call: any = await ctx.runQuery(api.calls.getCall, {
      callId: args.callId,
    });

    if (!call) {
      throw new Error("Call not found");
    }

    // Get Stream API credentials
    const apiKey = process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error("Stream API credentials not configured");
    }

    try {
      const { StreamClient } = await import("@stream-io/node-sdk");
      const streamClient = new StreamClient(apiKey, apiSecret);

      // End the call in Stream
      const streamCall = streamClient.video.call("default", call.streamCallId);
      await streamCall.end();

      // Update status in Convex
      await ctx.runMutation(api.calls.updateCallStatus, {
        callId: args.callId,
        status: "ended",
        endTime: Date.now(),
      });

      return null;
    } catch (error) {
      console.error("Error ending Stream call:", error);
      // Still update Convex even if Stream fails
      await ctx.runMutation(api.calls.updateCallStatus, {
        callId: args.callId,
        status: "ended",
        endTime: Date.now(),
      });
      return null;
    }
  },
});

/**
 * Admin utility: End a call by its Stream call ID
 * Use this to clean up orphaned calls
 */
export const endStreamCallByStreamId = action({
  args: {
    streamCallId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (_ctx, args): Promise<{ success: boolean; message: string }> => {
    // Get Stream API credentials
    const apiKey = process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      return {
        success: false,
        message: "Stream API credentials not configured",
      };
    }

    try {
      const { StreamClient } = await import("@stream-io/node-sdk");
      const streamClient = new StreamClient(apiKey, apiSecret);

      // End the call in Stream
      const streamCall = streamClient.video.call("default", args.streamCallId);
      await streamCall.end();

      return {
        success: true,
        message: `Successfully ended Stream call: ${args.streamCallId}`,
      };
    } catch (error) {
      console.error("Error ending Stream call:", error);
      return {
        success: false,
        message: `Failed to end call: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
