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