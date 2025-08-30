import { sqliteTable, text, integer, real, index, unique } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// User Management Tables
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  profileImage: text("profile_image"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender", { enum: ["male", "female", "other"] }),
  userType: text("user_type", { 
    enum: ["customer", "driver", "parent", "student", "guardian"] 
  }).notNull().default("customer"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
  uuid: text("uuid").notNull().unique(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  phoneIdx: index("users_phone_idx").on(table.phoneNumber),
  emailIdx: index("users_email_idx").on(table.email),
  userTypeIdx: index("users_user_type_idx").on(table.userType),
}));

export const schools = sqliteTable("schools", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // School board code
  address: text("address").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  phone: text("phone"),
  email: text("email"),
  principalName: text("principal_name"),
  schoolType: text("school_type", {
    enum: ["government", "private", "aided", "international", "boarding"]
  }).notNull(),
  boardType: text("board_type", {
    enum: ["cbse", "icse", "state","igcse", "ib", "other"]
  }),
  startTime: text("start_time").notNull(), // School start time
  endTime: text("end_time").notNull(), // School end time
  workingDays: text("working_days").notNull(), // JSON array of working days
  holidays: text("holidays"), // JSON array of holiday dates
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  codeIdx: index("schools_code_idx").on(table.code),
  cityIdx: index("schools_city_idx").on(table.city),
  typeIdx: index("schools_type_idx").on(table.schoolType),
}));

export const drivers = sqliteTable("drivers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_uuid: text("user_uuid").notNull().references(() => users.uuid, { onDelete: "cascade" }),
  licenseNumber: text("license_number").notNull().unique(),
  licenseExpiryDate: text("license_expiry_date").notNull(),
  licenseImageUrl: text("license_image_url").notNull(),
  aadharNumber: text("aadhar_number").notNull().unique(),
  aadharImageUrl: text("aadhar_image_url").notNull(),
  panNumber: text("pan_number").unique(),
  panImageUrl: text("pan_image_url"),
  policeVerificationCertUrl: text("police_verification_cert_url"),
  backgroundCheckStatus: text("background_check_status", { 
    enum: ["pending", "in_progress", "approved", "rejected"] 
  }).notNull().default("pending"),
  emergencyContactName: text("emergency_contact_name").notNull(),
  emergencyContactPhone: text("emergency_contact_phone").notNull(),
  bankAccountNumber: text("bank_account_number"),
  bankIfscCode: text("bank_ifsc_code"),
  bankAccountHolderName: text("bank_account_holder_name"),
  upiId: text("upi_id"),
  status: text("status", { 
    enum: ["pending", "under_review", "approved", "rejected", "suspended", "inactive"] 
  }).notNull().default("pending"),
  approvedAt: text("approved_at"),
  rejectedAt: text("rejected_at"),
  rejectionReason: text("rejection_reason"),
  rating: real("rating").default(0),
  totalRides: integer("total_rides").notNull().default(0),
  totalEarnings: real("total_earnings").notNull().default(0),
  isOnline: integer("is_online", { mode: "boolean" }).notNull().default(false),
  lastOnlineAt: text("last_online_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  licenseIdx: index("drivers_license_idx").on(table.licenseNumber),
  aadharIdx: index("drivers_aadhar_idx").on(table.aadharNumber),
  statusIdx: index("drivers_status_idx").on(table.status),
}));

export const vehicles = sqliteTable("vehicles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  driverId: integer("driver_id").notNull().references(() => drivers.id, { onDelete: "cascade" }),
  vehicleType: text("vehicle_type", { 
    enum: ["auto", "car", "bike", "bus", "van"] 
  }).notNull(),
  registrationNumber: text("registration_number").notNull().unique(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  color: text("color").notNull(),
  capacity: integer("capacity").notNull(),
  rcImageUrl: text("rc_image_url").notNull(),
  insuranceCertUrl: text("insurance_cert_url").notNull(),
  insuranceExpiryDate: text("insurance_expiry_date").notNull(),
  pucCertUrl: text("puc_cert_url"), // Pullution Under Control certificate
  pucExpiryDate: text("puc_expiry_date"),
  permitImageUrl: text("permit_image_url"), // might be optional according to legals of pooling
  permitExpiryDate: text("permit_expiry_date"),
  vehicleImageUrls: text("vehicle_image_urls"), // JSON array of image URLs
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  verificationStatus: text("verification_status", {
    enum: ["pending", "approved", "rejected"]
  }).notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  driverIdx: index("vehicles_driver_idx").on(table.driverId),
  registrationIdx: index("vehicles_registration_idx").on(table.registrationNumber),
}));

// Ride Management
export const rides = sqliteTable("rides", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rideNumber: text("ride_number").notNull().unique(),
  bookedByUserId: integer("booked_by_user_id").notNull().references(() => users.id), // Who booked the ride
  familyId: integer("family_id").references(() => families.id), // null for non-family rides
  driverId: integer("driver_id").notNull().references(() => drivers.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  contractId: integer("contract_id").references(() => contracts.id), // null for on-demand rides
  rideType: text("ride_type", {
    enum: ["on_demand", "scheduled", "contract", "family_plan"]
  }).notNull(),
  ridePurpose: text("ride_purpose", {
    enum: ["school_pickup", "school_drop", "medical", "recreational", "emergency", "general"]
  }).default("general"),
  pickupAddress: text("pickup_address").notNull(),
  pickupLatitude: real("pickup_latitude").notNull(),
  pickupLongitude: real("pickup_longitude").notNull(),
  dropoffAddress: text("dropoff_address").notNull(),
  dropoffLatitude: real("dropoff_latitude").notNull(),
  dropoffLongitude: real("dropoff_longitude").notNull(),
  estimatedDistance: real("estimated_distance"),
  actualDistance: real("actual_distance"),
  estimatedDuration: integer("estimated_duration"), // in minutes
  actualDuration: integer("actual_duration"),
  estimatedFare: real("estimated_fare"),
  actualFare: real("actual_fare"),
  passengerCount: integer("passenger_count").notNull().default(1),
  childPassengerCount: integer("child_passenger_count").notNull().default(0),
  specialInstructions: text("special_instructions"),
  requiresChildSeat: integer("requires_child_seat", { mode: "boolean" }).notNull().default(false),
  requestedAt: text("requested_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  acceptedAt: text("accepted_at"),
  arrivedAt: text("arrived_at"),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  cancelledAt: text("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  cancelledBy: text("cancelled_by", { enum: ["customer", "driver", "system", "guardian"] }),
  status: text("status", {
    enum: ["requested", "accepted", "arrived", "started", "completed", "cancelled"]
  }).notNull().default("requested"),
  paymentStatus: text("payment_status", {
    enum: ["pending", "paid", "failed", "refunded"]
  }).notNull().default("pending"),
  rating: integer("rating"), // 1-5 stars
  feedback: text("feedback"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  rideNumberIdx: index("rides_ride_number_idx").on(table.rideNumber),
  bookedByIdx: index("rides_booked_by_idx").on(table.bookedByUserId),
  familyIdx: index("rides_family_idx").on(table.familyId),
  driverIdx: index("rides_driver_idx").on(table.driverId),
  statusIdx: index("rides_status_idx").on(table.status),
  dateIdx: index("rides_date_idx").on(table.requestedAt),
  contractIdx: index("rides_contract_idx").on(table.contractId),
  purposeIdx: index("rides_purpose_idx").on(table.ridePurpose),
}));

// Service Plans & Pricing
export const servicePlans = sqliteTable("service_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  vehicleType: text("vehicle_type", { 
    enum: ["auto", "car", "bike", "bus", "van"] 
  }).notNull(),
  planType: text("plan_type", {
    enum: ["daily", "weekly", "monthly", "quarterly", "yearly", "per_ride"]
  }).notNull(),
  basePrice: real("base_price").notNull(),
  pricePerKm: real("price_per_km"),
  pricePerMinute: real("price_per_minute"),
  maxDistance: integer("max_distance"), // in km
  maxRides: integer("max_rides"),
  discountPercentage: real("discount_percentage").default(0),
  features: text("features"), // JSON array of features
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  vehicleTypeIdx: index("service_plans_vehicle_type_idx").on(table.vehicleType),
  planTypeIdx: index("service_plans_plan_type_idx").on(table.planType),
}));

export const driverServicePlans = sqliteTable("driver_service_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  driverId: integer("driver_id").notNull().references(() => drivers.id, { onDelete: "cascade" }),
  servicePlanId: integer("service_plan_id").notNull().references(() => servicePlans.id),
  customPrice: real("custom_price"), // Override plan price if needed
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  driverIdx: index("driver_service_plans_driver_idx").on(table.driverId),
  planIdx: index("driver_service_plans_plan_idx").on(table.servicePlanId),
  uniqueDriverPlan: unique("unique_driver_plan").on(table.driverId, table.servicePlanId),
}));

// Contract Management
export const contracts = sqliteTable("contracts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractNumber: text("contract_number").notNull().unique(),
  familyId: integer("family_id").references(() => families.id), // For family contracts
  primaryUserId: integer("primary_user_id").notNull().references(() => users.id), // Contract holder
  driverId: integer("driver_id").notNull().references(() => drivers.id),
  servicePlanId: integer("service_plan_id").notNull().references(() => servicePlans.id),
  driverServicePlanId: integer("driver_service_plan_id")
    .notNull()
    .references(() => driverServicePlans.id),
  contractType: text("contract_type", {
    enum: ["individual", "family", "school_transport"]
  }).notNull().default("individual"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  totalAmount: real("total_amount").notNull(),
  advanceAmount: real("advance_amount").notNull().default(0),
  remainingAmount: real("remaining_amount").notNull(),
  pickupAddress: text("pickup_address").notNull(),
  pickupLatitude: real("pickup_latitude").notNull(),
  pickupLongitude: real("pickup_longitude").notNull(),
  dropoffAddress: text("dropoff_address"),
  dropoffLatitude: real("dropoff_latitude"),
  dropoffLongitude: real("dropoff_longitude"),
  scheduleType: text("schedule_type", {
    enum: ["daily", "weekly", "custom"]
  }).notNull().default("daily"),
  scheduleDays: text("schedule_days"), // JSON array for days of week
  scheduleTime: text("schedule_time"),
  maxPassengers: integer("max_passengers").notNull().default(1),
  allowedFamilyMembers: text("allowed_family_members"), // JSON array of family member IDs
  specialInstructions: text("special_instructions"),
  childSafetyRequirements: text("child_safety_requirements"), // JSON array of safety requirements
  status: text("status", {
    enum: ["draft", "pending", "active", "completed", "cancelled", "expired"]
  }).notNull().default("pending"),
  paymentStatus: text("payment_status", {
    enum: ["pending", "partial", "paid", "refunded"]
  }).notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  contractNumberIdx: index("contracts_contract_number_idx").on(table.contractNumber),
  familyIdx: index("contracts_family_idx").on(table.familyId),
  primaryUserIdx: index("contracts_primary_user_idx").on(table.primaryUserId),
  driverIdx: index("contracts_driver_idx").on(table.driverId),
  statusIdx: index("contracts_status_idx").on(table.status),
  dateIdx: index("contracts_date_idx").on(table.startDate, table.endDate),
  typeIdx: index("contracts_type_idx").on(table.contractType),
}));

export const rideTracking = sqliteTable("ride_tracking", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rideId: integer("ride_id").notNull().references(() => rides.id, { onDelete: "cascade" }),
  driverId: integer("driver_id").notNull().references(() => drivers.id),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  accuracy: real("accuracy"),
  speed: real("speed"),
  heading: real("heading"),
  timestamp: text("timestamp").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  rideIdx: index("ride_tracking_ride_idx").on(table.rideId),
  timestampIdx: index("ride_tracking_timestamp_idx").on(table.timestamp),
}));

// Reviews & Ratings
export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rideId: integer("ride_id").notNull().references(() => rides.id),
  reviewerId: integer("reviewer_id").notNull().references(() => users.uuid),
  revieweeId: integer("reviewee_id").notNull().references(() => users.uuid),
  reviewerType: text("reviewer_type", { enum: ["customer", "driver"] }).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  tags: text("tags"), // JSON array of predefined tags
  isAnonymous: integer("is_anonymous", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  rideIdx: index("reviews_ride_idx").on(table.rideId),
  reviewerIdx: index("reviews_reviewer_idx").on(table.reviewerId),
  revieweeIdx: index("reviews_reviewee_idx").on(table.revieweeId),
}));

// Family Management
export const families = sqliteTable("families", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  familyCode: text("family_code").notNull().unique(), // Unique identifier for family sharing
  familyName: text("family_name").notNull(),
  primaryUserId: integer("primary_user_id").notNull().references(() => users.id),
  address: text("address"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  emergencyContactRelation: text("emergency_contact_relation"),
  specialInstructions: text("special_instructions"), // Special instructions for all family rides
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  familyCodeIdx: index("families_family_code_idx").on(table.familyCode),
  primaryUserIdx: index("families_primary_user_idx").on(table.primaryUserId),
  cityIdx: index("families_city_idx").on(table.city),
}));


export const familyMembers = sqliteTable("family_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  familyId: integer("family_id").notNull().references(() => families.id, { onDelete: "cascade" }),
  userUUID: text("user_uuid").references(() => users.uuid), // null for non-registered family members
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender", { enum: ["male", "female", "other"] }),
  relationshipToPrimary: text("relationship_to_primary", {
    enum: ["self", "spouse", "child", "parent", "sibling", "grandparent", "grandchild", "other"]
  }).notNull(),
  memberType: text("member_type", {
    enum: ["adult", "student", "child", "elderly"]
  }).notNull(),
  schoolId: integer("school_id").references(() => schools.id), // For students
  grade: text("grade"), // For students
  section: text("section"), // For students
  rollNumber: text("roll_number"), // For students
  profileImage: text("profile_image"),
  phoneNumber: text("phone_number"), // For older children/teens
  emailAddress: text("email_address"), // For older children/teens
  medicalInfo: text("medical_info"), // Any medical conditions or allergies
  specialNeeds: text("special_needs"), // Special assistance required
  canTravelAlone: integer("can_travel_alone", { mode: "boolean" }).notNull().default(false),
  requiresAdultSupervision: integer("requires_adult_supervision", { mode: "boolean" }).notNull().default(true),
  authorizedPickupPersons: text("authorized_pickup_persons"), // JSON array of authorized people
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  familyIdx: index("family_members_family_idx").on(table.familyId),
  userUUIDx: index("family_members_user_idx").on(table.userUUID),
  memberTypeIdx: index("family_members_member_type_idx").on(table.memberType),
  schoolIdx: index("family_members_school_idx").on(table.schoolId),
  uniqueFamilyUser: unique("unique_family_user").on(table.familyId, table.userUUID),
}));


// Family Invitation System
export const familyInvitations = sqliteTable("family_invitations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  familyId: integer("family_id").notNull().references(() => families.id, { onDelete: "cascade" }),
  invitedByUserUUID: text("invited_by_user_id").notNull().references(() => users.uuid),
  inviteeEmail: text("invitee_email"),
  inviteePhone: text("invitee_phone"),
  inviteeName: text("invitee_name").notNull(),
  relationshipToPrimary: text("relationship_to_primary").notNull(),
  memberType: text("member_type", {
    enum: ["adult", "student", "child", "elderly"]
  }).notNull(),
  invitationCode: text("invitation_code").notNull().unique(),
  permissions: text("permissions"), // JSON object with permission settings
  status: text("status", {
    enum: ["pending", "accepted", "declined", "expired", "cancelled"]
  }).notNull().default("pending"),
  expiresAt: text("expires_at").notNull(),
  acceptedAt: text("accepted_at"),
  acceptedByUserUUID: text("accepted_by_user_uuid").references(() => users.uuid),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  familyIdx: index("family_invitations_family_idx").on(table.familyId),
  codeIdx: index("family_invitations_code_idx").on(table.invitationCode),
  statusIdx: index("family_invitations_status_idx").on(table.status),
  expiryIdx: index("family_invitations_expiry_idx").on(table.expiresAt),
}));

// Family Subscriptions - Track active plans for families
export const familySubscriptions = sqliteTable("family_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  familyId: integer("family_id").notNull().references(() => families.id, { onDelete: "cascade" }),
  servicePlanId: integer("service_plan_id").notNull().references(() => servicePlans.id),
  subscribedByUserId: integer("subscribed_by_user_id").notNull().references(() => users.id),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  totalAmount: real("total_amount").notNull(),
  discountAmount: real("discount_amount").default(0),
  usedRides: integer("used_rides").notNull().default(0),
  remainingRides: integer("remaining_rides"),
  usedDistance: real("used_distance").notNull().default(0),
  remainingDistance: real("remaining_distance"),
  autoRenewal: integer("auto_renewal", { mode: "boolean" }).notNull().default(false),
  status: text("status", {
    enum: ["active", "expired", "cancelled", "suspended"]
  }).notNull().default("active"),
  paymentStatus: text("payment_status", {
    enum: ["pending", "paid", "failed", "refunded"]
  }).notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  familyIdx: index("family_subscriptions_family_idx").on(table.familyId),
  planIdx: index("family_subscriptions_plan_idx").on(table.servicePlanId),
  statusIdx: index("family_subscriptions_status_idx").on(table.status),
  dateIdx: index("family_subscriptions_date_idx").on(table.startDate, table.endDate),
}));


export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  familyId: integer("family_id").references(() => families.id),
  rideId: integer("ride_id").references(() => rides.id),
  notificationType: text("notification_type", {
    enum: [
      "ride_booked", "ride_started", "ride_completed", "ride_cancelled",
      "driver_arrived", "pickup_completed", "family_member_added",
      "guardian_authorized", "payment_due", "subscription_expiring",
      "emergency_alert", "safety_concern"
    ]
  }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority", {
    enum: ["low", "medium", "high", "urgent"]
  }).notNull().default("medium"),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  actionRequired: integer("action_required", { mode: "boolean" }).notNull().default(false),
  actionUrl: text("action_url"),
  metadata: text("metadata"), // JSON object with additional data
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  readAt: text("read_at"),
}, (table) => ({
  userIdx: index("notifications_user_idx").on(table.userId),
  familyIdx: index("notifications_family_idx").on(table.familyId),
  typeIdx: index("notifications_type_idx").on(table.notificationType),
  priorityIdx: index("notifications_priority_idx").on(table.priority),
  unreadIdx: index("notifications_unread_idx").on(table.userId, table.isRead),
}));


// Ride Safety Incidents and Reports
export const safetyIncidents = sqliteTable("safety_incidents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rideId: integer("ride_id").references(() => rides.id),
  reportedByUserId: integer("reported_by_user_id").notNull().references(() => users.id),
  driverId: integer("driver_id").references(() => drivers.id),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  familyId: integer("family_id").references(() => families.id),
  incidentType: text("incident_type", {
    enum: [
      "unsafe_driving", "inappropriate_behavior", "vehicle_safety_issue",
      "route_deviation", "unauthorized_stop", "child_safety_concern",
      "emergency_situation", "accident", "breakdown", "other"
    ]
  }).notNull(),
  severity: text("severity", {
    enum: ["low", "medium", "high", "critical"]
  }).notNull(),
  description: text("description").notNull(),
  location: text("location"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  evidenceUrls: text("evidence_urls"), // JSON array of photo/video URLs
  witnessContacts: text("witness_contacts"), // JSON array of witness information
  status: text("status", {
    enum: ["reported", "investigating", "resolved", "escalated", "closed"]
  }).notNull().default("reported"),
  investigatedByUserId: integer("investigated_by_user_id").references(() => users.id),
  resolutionNotes: text("resolution_notes"),
  actionTaken: text("action_taken"),
  followUpRequired: integer("follow_up_required", { mode: "boolean" }).notNull().default(true),
  reportedAt: text("reported_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  resolvedAt: text("resolved_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  rideIdx: index("safety_incidents_ride_idx").on(table.rideId),
  reporterIdx: index("safety_incidents_reporter_idx").on(table.reportedByUserId),
  driverIdx: index("safety_incidents_driver_idx").on(table.driverId),
  familyIdx: index("safety_incidents_family_idx").on(table.familyId),
  statusIdx: index("safety_incidents_status_idx").on(table.status),
  severityIdx: index("safety_incidents_severity_idx").on(table.severity),
  typeIdx: index("safety_incidents_type_idx").on(table.incidentType),
}));