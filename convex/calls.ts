import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get all calls for the current user (both as initiator and participant)
 */
export const getMyCalls = query({
  args: {
    status: v.optional(v.string()), // Filter by status if provided
  },
  returns: v.array(
    v.object({
      _id: v.id("calls"),
      _creationTime: v.number(),
      streamCallId: v.string(),
      callType: v.string(),
      initiatorId: v.id("users"),
      participantIds: v.array(v.id("users")),
      status: v.string(),
      scheduledTime: v.optional(v.number()),
      startTime: v.optional(v.number()),
      endTime: v.optional(v.number()),
      duration: v.optional(v.number()),
      recordingUrl: v.optional(v.string()),
      metadata: v.optional(
        v.object({
          title: v.optional(v.string()),
          clientName: v.optional(v.string()),
          clientId: v.optional(v.string()),
          notes: v.optional(v.string()),
        })
      ),
      // Populated fields
      initiatorName: v.string(),
      participantNames: v.array(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Get all calls
    const calls = await ctx.db.query("calls").collect();

    // Filter to calls where user is initiator or participant
    let filteredCalls = calls.filter(
      (call) =>
        call.initiatorId === userId || call.participantIds.includes(userId)
    );

    // Apply status filter if provided
    if (args.status) {
      filteredCalls = filteredCalls.filter(
        (call) => call.status === args.status
      );
    }

    // Sort by creation time (most recent first)
    filteredCalls.sort((a, b) => b._creationTime - a._creationTime);

    // Populate user names
    const callsWithNames = await Promise.all(
      filteredCalls.map(async (call) => {
        const initiator = await ctx.db.get(call.initiatorId);
        const initiatorName =
          initiator?.name ||
          `${initiator?.firstName || ""} ${initiator?.lastName || ""}`.trim() ||
          "Unknown";

        const participantNames = await Promise.all(
          call.participantIds.map(async (participantId) => {
            const participant = await ctx.db.get(participantId);
            return (
              participant?.name ||
              `${participant?.firstName || ""} ${participant?.lastName || ""}`.trim() ||
              "Unknown"
            );
          })
        );

        return {
          ...call,
          initiatorName,
          participantNames,
        };
      })
    );

    return callsWithNames;
  },
});

/**
 * Get a specific call by ID
 */
export const getCall = query({
  args: {
    callId: v.id("calls"),
  },
  returns: v.union(
    v.object({
      _id: v.id("calls"),
      _creationTime: v.number(),
      streamCallId: v.string(),
      callType: v.string(),
      initiatorId: v.id("users"),
      participantIds: v.array(v.id("users")),
      status: v.string(),
      scheduledTime: v.optional(v.number()),
      startTime: v.optional(v.number()),
      endTime: v.optional(v.number()),
      duration: v.optional(v.number()),
      recordingUrl: v.optional(v.string()),
      metadata: v.optional(
        v.object({
          title: v.optional(v.string()),
          clientName: v.optional(v.string()),
          clientId: v.optional(v.string()),
          notes: v.optional(v.string()),
        })
      ),
      // Populated fields
      initiatorName: v.string(),
      participantNames: v.array(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const call = await ctx.db.get(args.callId);
    if (!call) {
      return null;
    }

    // Check if user has access to this call
    if (
      call.initiatorId !== userId &&
      !call.participantIds.includes(userId)
    ) {
      throw new Error("You do not have access to this call");
    }

    // Populate user names
    const initiator = await ctx.db.get(call.initiatorId);
    const initiatorName =
      initiator?.name ||
      `${initiator?.firstName || ""} ${initiator?.lastName || ""}`.trim() ||
      "Unknown";

    const participantNames = await Promise.all(
      call.participantIds.map(async (participantId) => {
        const participant = await ctx.db.get(participantId);
        return (
          participant?.name ||
          `${participant?.firstName || ""} ${participant?.lastName || ""}`.trim() ||
          "Unknown"
        );
      })
    );

    return {
      ...call,
      initiatorName,
      participantNames,
    };
  },
});

/**
 * Get active calls
 */
export const getActiveCalls = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("calls"),
      _creationTime: v.number(),
      streamCallId: v.string(),
      callType: v.string(),
      initiatorId: v.id("users"),
      participantIds: v.array(v.id("users")),
      status: v.string(),
      startTime: v.optional(v.number()),
      metadata: v.optional(
        v.object({
          title: v.optional(v.string()),
          clientName: v.optional(v.string()),
          clientId: v.optional(v.string()),
          notes: v.optional(v.string()),
        })
      ),
      initiatorName: v.string(),
      participantNames: v.array(v.string()),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Get all active calls
    const calls = await ctx.db
      .query("calls")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Filter to calls where user is initiator or participant
    const filteredCalls = calls.filter(
      (call) =>
        call.initiatorId === userId || call.participantIds.includes(userId)
    );

    // Populate user names
    const callsWithNames = await Promise.all(
      filteredCalls.map(async (call) => {
        const initiator = await ctx.db.get(call.initiatorId);
        const initiatorName =
          initiator?.name ||
          `${initiator?.firstName || ""} ${initiator?.lastName || ""}`.trim() ||
          "Unknown";

        const participantNames = await Promise.all(
          call.participantIds.map(async (participantId) => {
            const participant = await ctx.db.get(participantId);
            return (
              participant?.name ||
              `${participant?.firstName || ""} ${participant?.lastName || ""}`.trim() ||
              "Unknown"
            );
          })
        );

        return {
          _id: call._id,
          _creationTime: call._creationTime,
          streamCallId: call.streamCallId,
          callType: call.callType,
          initiatorId: call.initiatorId,
          participantIds: call.participantIds,
          status: call.status,
          startTime: call.startTime,
          metadata: call.metadata,
          initiatorName,
          participantNames,
        };
      })
    );

    return callsWithNames;
  },
});

/**
 * Create a new call
 */
export const createCall = mutation({
  args: {
    streamCallId: v.string(),
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
  returns: v.id("calls"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Check if user is active
    const user = await ctx.db.get(userId);
    if (!user || user.isActive === false) {
      throw new Error("User account is not active");
    }

    // Validate participants are active users
    const participants = await Promise.all(
      args.participantIds.map((id) => ctx.db.get(id))
    );

    const inactiveParticipants = participants.filter(
      (p) => !p || p.isActive === false
    );
    if (inactiveParticipants.length > 0) {
      throw new Error("Cannot invite inactive users to call");
    }

    // Determine initial status
    const status = args.scheduledTime ? "scheduled" : "active";
    const startTime = args.scheduledTime ? undefined : Date.now();

    const callId = await ctx.db.insert("calls", {
      streamCallId: args.streamCallId,
      callType: args.callType,
      initiatorId: userId,
      participantIds: args.participantIds,
      status,
      scheduledTime: args.scheduledTime,
      startTime,
      metadata: args.metadata,
    });

    return callId;
  },
});

/**
 * Update call status (e.g., start, end, cancel)
 */
export const updateCallStatus = mutation({
  args: {
    callId: v.id("calls"),
    status: v.string(),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()),
    recordingUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const call = await ctx.db.get(args.callId);
    if (!call) {
      throw new Error("Call not found");
    }

    // Only initiator or participants can update call status
    if (
      call.initiatorId !== userId &&
      !call.participantIds.includes(userId)
    ) {
      throw new Error("You do not have permission to update this call");
    }

    const updates: any = {
      status: args.status,
    };

    if (args.status === "active" && !call.startTime) {
      updates.startTime = Date.now();
    }

    if (args.status === "ended") {
      updates.endTime = args.endTime || Date.now();
      if (args.duration !== undefined) {
        updates.duration = args.duration;
      }
      if (args.recordingUrl) {
        updates.recordingUrl = args.recordingUrl;
      }
    }

    await ctx.db.patch(args.callId, updates);
    return null;
  },
});

/**
 * Add participant to a call
 */
export const addParticipant = mutation({
  args: {
    callId: v.id("calls"),
    participantId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const call = await ctx.db.get(args.callId);
    if (!call) {
      throw new Error("Call not found");
    }

    // Only initiator can add participants
    if (call.initiatorId !== userId) {
      throw new Error("Only the call initiator can add participants");
    }

    // Check if participant is already in the call
    if (call.participantIds.includes(args.participantId)) {
      throw new Error("Participant is already in the call");
    }

    // Check if participant is active
    const participant = await ctx.db.get(args.participantId);
    if (!participant || participant.isActive === false) {
      throw new Error("Cannot add inactive user to call");
    }

    await ctx.db.patch(args.callId, {
      participantIds: [...call.participantIds, args.participantId],
    });

    return null;
  },
});

/**
 * Update call metadata
 */
export const updateCallMetadata = mutation({
  args: {
    callId: v.id("calls"),
    metadata: v.object({
      title: v.optional(v.string()),
      clientName: v.optional(v.string()),
      clientId: v.optional(v.string()),
      notes: v.optional(v.string()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const call = await ctx.db.get(args.callId);
    if (!call) {
      throw new Error("Call not found");
    }

    // Only initiator or participants can update metadata
    if (
      call.initiatorId !== userId &&
      !call.participantIds.includes(userId)
    ) {
      throw new Error("You do not have permission to update this call");
    }

    await ctx.db.patch(args.callId, {
      metadata: args.metadata,
    });

    return null;
  },
});

/**
 * Delete a call (only for cancelled/ended calls)
 */
export const deleteCall = mutation({
  args: {
    callId: v.id("calls"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const call = await ctx.db.get(args.callId);
    if (!call) {
      throw new Error("Call not found");
    }

    // Only initiator can delete calls
    if (call.initiatorId !== userId) {
      throw new Error("Only the call initiator can delete calls");
    }

    // Can only delete cancelled or ended calls
    if (call.status !== "cancelled" && call.status !== "ended") {
      throw new Error("Can only delete cancelled or ended calls");
    }

    await ctx.db.delete(args.callId);
    return null;
  },
});
