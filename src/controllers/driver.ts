import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, or, like, desc, asc, sql } from 'drizzle-orm';
import { drivers, users } from '../db/schema';

// Type definitions
interface CreateDriverRequest {
  userId: number;
  licenseNumber: string;
  licenseExpiryDate: string;
  licenseImageUrl: string;
  aadharNumber: string;
  aadharImageUrl: string;
  panNumber?: string;
  panImageUrl?: string;
  policeVerificationCertUrl?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankAccountHolderName?: string;
  upiId?: string;
}

interface UpdateDriverRequest extends Partial<CreateDriverRequest> {
  backgroundCheckStatus?: "pending" | "in_progress" | "approved" | "rejected";
  status?: "pending" | "under_review" | "approved" | "rejected" | "suspended" | "inactive";
  rejectionReason?: string;
  rating?: number;
  totalRides?: number;
  totalEarnings?: number;
  isOnline?: boolean;
}

interface GetDriversQuery {
  page?: string;
  limit?: string;
  status?: string;
  backgroundCheckStatus?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isOnline?: string;
}

// Validation helpers
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number format
  return phoneRegex.test(phone);
};

const validatePAN = (pan: string): boolean => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

const validateAadhar = (aadhar: string): boolean => {
  const aadharRegex = /^\d{12}$/;
  return aadharRegex.test(aadhar);
};

const validateLicenseNumber = (license: string): boolean => {
  // Basic validation - adjust according to your license format
  return license.length >= 10 && license.length <= 20;
};

const validateIFSC = (ifsc: string): boolean => {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc);
};

const validateUPI = (upi: string): boolean => {
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z]{2,64}$/;
  return upiRegex.test(upi);
};

const validateDateFormat = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

const isDateInFuture = (date: string): boolean => {
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate > today;
};

// Create Driver
export const createDriver = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const body: CreateDriverRequest = await c.req.json();

    // Required field validation
    const requiredFields = [
      'userId', 'licenseNumber', 'licenseExpiryDate', 'licenseImageUrl',
      'aadharNumber', 'aadharImageUrl', 'emergencyContactName', 'emergencyContactPhone'
    ];

    for (const field of requiredFields) {
      if (!body[field as keyof CreateDriverRequest]) {
        return c.json({
          success: false,
          message: `${field} is required`
        }, 400);
      }
    }

    // Validate data formats
    if (!validateLicenseNumber(body.licenseNumber)) {
      return c.json({
        success: false,
        message: 'Invalid license number format'
      }, 400);
    }

    if (!validateDateFormat(body.licenseExpiryDate)) {
      return c.json({
        success: false,
        message: 'License expiry date must be in YYYY-MM-DD format'
      }, 400);
    }

    if (!isDateInFuture(body.licenseExpiryDate)) {
      return c.json({
        success: false,
        message: 'License expiry date must be in the future'
      }, 400);
    }

    if (!validateAadhar(body.aadharNumber)) {
      return c.json({
        success: false,
        message: 'Aadhar number must be 12 digits'
      }, 400);
    }

    if (!validatePhone(body.emergencyContactPhone)) {
      return c.json({
        success: false,
        message: 'Invalid emergency contact phone number'
      }, 400);
    }

    // Optional field validations
    if (body.panNumber && !validatePAN(body.panNumber)) {
      return c.json({
        success: false,
        message: 'Invalid PAN number format'
      }, 400);
    }

    if (body.bankIfscCode && !validateIFSC(body.bankIfscCode)) {
      return c.json({
        success: false,
        message: 'Invalid IFSC code format'
      }, 400);
    }

    if (body.upiId && !validateUPI(body.upiId)) {
      return c.json({
        success: false,
        message: 'Invalid UPI ID format'
      }, 400);
    }

    // Check if user exists
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, body.userId))
      .limit(1);

    if (userExists.length === 0) {
      return c.json({
        success: false,
        message: 'User not found'
      }, 404);
    }

    // Check if user already has a driver profile
    const existingDriver = await db
      .select()
      .from(drivers)
      .where(eq(drivers.userId, body.userId))
      .limit(1);

    if (existingDriver.length > 0) {
      return c.json({
        success: false,
        message: 'Driver profile already exists for this user'
      }, 409);
    }

    // Check unique constraints
    const duplicateCheck = await db
      .select()
      .from(drivers)
      .where(
        or(
          eq(drivers.licenseNumber, body.licenseNumber),
          eq(drivers.aadharNumber, body.aadharNumber),
          body.panNumber ? eq(drivers.panNumber, body.panNumber) : undefined
        )
      )
      .limit(1);

    if (duplicateCheck.length > 0) {
      const existing = duplicateCheck[0];
      let conflictField = '';
      if (existing.licenseNumber === body.licenseNumber) conflictField = 'License number';
      else if (existing.aadharNumber === body.aadharNumber) conflictField = 'Aadhar number';
      else if (existing.panNumber === body.panNumber) conflictField = 'PAN number';

      return c.json({
        success: false,
        message: `${conflictField} already exists`
      }, 409);
    }

    // Create driver
    const result = await db
      .insert(drivers)
      .values({
        ...body,
        panNumber: body.panNumber || null,
        panImageUrl: body.panImageUrl || null,
        policeVerificationCertUrl: body.policeVerificationCertUrl || null,
        bankAccountNumber: body.bankAccountNumber || null,
        bankIfscCode: body.bankIfscCode || null,
        bankAccountHolderName: body.bankAccountHolderName || null,
        upiId: body.upiId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    return c.json({
      success: true,
      message: 'Driver profile created successfully',
      data: result[0]
    }, 201);

  } catch (error) {
    console.error('Create driver error:', error);

    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return c.json({
        success: false,
        message: 'Duplicate data found. Please check license number, Aadhar number, or PAN number.'
      }, 409);
    }

    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
};

// Get Driver by ID
export const getDriverById = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const driverId = parseInt(c.req.param('id'));

    if (isNaN(driverId)) {
      return c.json({
        success: false,
        message: 'Invalid driver ID'
      }, 400);
    }

    const driver = await db
      .select()
      .from(drivers)
      .where(eq(drivers.id, driverId))
      .limit(1);

    if (driver.length === 0) {
      return c.json({
        success: false,
        message: 'Driver not found'
      }, 404);
    }

    return c.json({
      success: true,
      data: driver[0]
    });

  } catch (error) {
    console.error('Get driver error:', error);
    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
};


// Update Driver
export const updateDriver = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const driverId = parseInt(c.req.param('id'));
    const body: UpdateDriverRequest = await c.req.json();

    if (isNaN(driverId)) {
      return c.json({
        success: false,
        message: 'Invalid driver ID'
      }, 400);
    }

    // Check if driver exists
    const existingDriver = await db
      .select()
      .from(drivers)
      .where(eq(drivers.id, driverId))
      .limit(1);

    if (existingDriver.length === 0) {
      return c.json({
        success: false,
        message: 'Driver not found'
      }, 404);
    }

    // Validate update data
    if (body.licenseNumber && !validateLicenseNumber(body.licenseNumber)) {
      return c.json({
        success: false,
        message: 'Invalid license number format'
      }, 400);
    }

    if (body.licenseExpiryDate) {
      if (!validateDateFormat(body.licenseExpiryDate)) {
        return c.json({
          success: false,
          message: 'License expiry date must be in YYYY-MM-DD format'
        }, 400);
      }
      if (!isDateInFuture(body.licenseExpiryDate)) {
        return c.json({
          success: false,
          message: 'License expiry date must be in the future'
        }, 400);
      }
    }

    if (body.aadharNumber && !validateAadhar(body.aadharNumber)) {
      return c.json({
        success: false,
        message: 'Aadhar number must be 12 digits'
      }, 400);
    }

    if (body.panNumber && !validatePAN(body.panNumber)) {
      return c.json({
        success: false,
        message: 'Invalid PAN number format'
      }, 400);
    }

    if (body.emergencyContactPhone && !validatePhone(body.emergencyContactPhone)) {
      return c.json({
        success: false,
        message: 'Invalid emergency contact phone number'
      }, 400);
    }

    if (body.bankIfscCode && !validateIFSC(body.bankIfscCode)) {
      return c.json({
        success: false,
        message: 'Invalid IFSC code format'
      }, 400);
    }

    if (body.upiId && !validateUPI(body.upiId)) {
      return c.json({
        success: false,
        message: 'Invalid UPI ID format'
      }, 400);
    }

    if (body.rating !== undefined && (body.rating < 0 || body.rating > 5)) {
      return c.json({
        success: false,
        message: 'Rating must be between 0 and 5'
      }, 400);
    }

    if (body.totalRides !== undefined && body.totalRides < 0) {
      return c.json({
        success: false,
        message: 'Total rides cannot be negative'
      }, 400);
    }

    if (body.totalEarnings !== undefined && body.totalEarnings < 0) {
      return c.json({
        success: false,
        message: 'Total earnings cannot be negative'
      }, 400);
    }

    // Check unique constraints if updating unique fields
    if (body.licenseNumber || body.aadharNumber || body.panNumber) {
      const duplicateCheck = await db
        .select()
        .from(drivers)
        .where(
          and(
            or(
              body.licenseNumber ? eq(drivers.licenseNumber, body.licenseNumber) : undefined,
              body.aadharNumber ? eq(drivers.aadharNumber, body.aadharNumber) : undefined,
              body.panNumber ? eq(drivers.panNumber, body.panNumber) : undefined
            ),
            sql`${drivers.id} != ${driverId}`
          )
        )
        .limit(1);

      if (duplicateCheck.length > 0) {
        const existing = duplicateCheck[0];
        let conflictField = '';
        if (existing.licenseNumber === body.licenseNumber) conflictField = 'License number';
        else if (existing.aadharNumber === body.aadharNumber) conflictField = 'Aadhar number';
        else if (existing.panNumber === body.panNumber) conflictField = 'PAN number';

        return c.json({
          success: false,
          message: `${conflictField} already exists`
        }, 409);
      }
    }

    // Handle status updates
    const updateData: any = {
      ...body,
      updatedAt: new Date().toISOString()
    };

    // Set approval/rejection timestamps
    if (body.status === 'approved' && existingDriver[0].status !== 'approved') {
      updateData.approvedAt = new Date().toISOString();
      updateData.rejectedAt = null;
      updateData.rejectionReason = null;
    } else if (body.status === 'rejected' && existingDriver[0].status !== 'rejected') {
      updateData.rejectedAt = new Date().toISOString();
      updateData.approvedAt = null;
    }

    // Update online status timestamp
    if (body.isOnline !== undefined && body.isOnline !== existingDriver[0].isOnline) {
      updateData.lastOnlineAt = new Date().toISOString();
    }

    // Update driver
    const result = await db
      .update(drivers)
      .set(updateData)
      .where(eq(drivers.id, driverId))
      .returning();

    return c.json({
      success: true,
      message: 'Driver updated successfully',
      data: result[0]
    });

  } catch (error) {
    console.error('Update driver error:', error);

    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return c.json({
        success: false,
        message: 'Duplicate data found. Please check license number, Aadhar number, or PAN number.'
      }, 409);
    }

    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
};

// Delete Driver (Soft delete by setting status to inactive)
export const deleteDriver = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const driverId = parseInt(c.req.param('id'));

    if (isNaN(driverId)) {
      return c.json({
        success: false,
        message: 'Invalid driver ID'
      }, 400);
    }

    // Check if driver exists
    const existingDriver = await db
      .select()
      .from(drivers)
      .where(eq(drivers.id, driverId))
      .limit(1);

    if (existingDriver.length === 0) {
      return c.json({
        success: false,
        message: 'Driver not found'
      }, 404);
    }

    // Soft delete by setting status to inactive
    const result = await db
      .update(drivers)
      .set({
        status: 'inactive',
        isOnline: false,
        updatedAt: new Date().toISOString()
      })
      .where(eq(drivers.id, driverId))
      .returning();

    return c.json({
      success: true,
      message: 'Driver deleted successfully',
      data: result[0]
    });

  } catch (error) {
    console.error('Delete driver error:', error);
    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
};