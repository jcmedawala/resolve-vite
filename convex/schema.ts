import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom admin fields
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.optional(v.string()),
    isPeopleManager: v.optional(v.union(v.boolean(), v.string())), // Allow both for migration
    teamLead: v.optional(v.union(v.string(), v.null())),
    isActive: v.optional(v.boolean()),
  }).index("email", ["email"]),
  calls: defineTable({
    streamCallId: v.string(),
    callType: v.string(), // "one_on_one", "team_meeting", "kyc_session"
    initiatorId: v.id("users"),
    participantIds: v.array(v.id("users")),
    status: v.string(), // "scheduled", "active", "ended", "cancelled"
    scheduledTime: v.optional(v.number()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()), // in seconds
    recordingUrl: v.optional(v.string()),
    metadata: v.optional(v.object({
      title: v.optional(v.string()),
      clientName: v.optional(v.string()),
      clientId: v.optional(v.string()),
      notes: v.optional(v.string()),
    })),
  })
    .index("by_initiator", ["initiatorId"])
    .index("by_status", ["status"])
    .index("by_scheduled_time", ["scheduledTime"])
    .index("by_stream_call_id", ["streamCallId"]),
  numbers: defineTable({
    value: v.number(),
  }),
});
