import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, or, like, desc, asc, sql, count } from 'drizzle-orm';
import { drivers, users } from '../db/schema';
import { CreateDriverRequest, UpdateDriverRequest } from '../types/driver';
import { validateAadhar, validateDateFormat, validateIFSC, validateImageUrl, validateLicenseNumber, validatePAN, validatePhone, validateUPI } from '../helpers/validation';


interface GetDriversQuery {
  page?: string;
  limit?: string;
  status?: string;
  backgroundCheckStatus?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isOnline?: string;
  rating?: string;
  totalRidesFrom?: string;
  totalRidesTo?: string;
  totalEarningsFrom?: string;
  totalEarningsTo?: string;
  createdAfter?: string;
  createdBefore?: string;
}

const isDateInFuture = (date: string): boolean => {
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate > today;
};

const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

function validateName(name: string): boolean {
  // Name must be 2-100 characters, only letters and spaces
  return /^[A-Za-z\s]{2,100}$/.test(name.trim());
}


const buildSearchCondition = (search: string) => {
  const searchTerm = `%${search.toLowerCase()}%`;
  return or(
    like(drivers.licenseNumber, searchTerm),
    like(drivers.aadharNumber, searchTerm),
    like(drivers.panNumber, searchTerm),
    like(sql`LOWER(${drivers.emergencyContactName})`, searchTerm),
    like(drivers.emergencyContactPhone, searchTerm),
    like(drivers.bankAccountNumber, searchTerm),
    like(drivers.upiId, searchTerm)
  );
};

const buildFilters = (query: GetDriversQuery) => {
  const conditions = [];

  if (query.status) {
    conditions.push(eq(drivers.status, query.status as any));
  }

  if (query.backgroundCheckStatus) {
    conditions.push(eq(drivers.backgroundCheckStatus, query.backgroundCheckStatus as any));
  }

  if (query.isOnline !== undefined) {
    conditions.push(eq(drivers.isOnline, query.isOnline === 'true'));
  }

  if (query.rating) {
    const ratingValue = parseFloat(query.rating);
    if (!isNaN(ratingValue)) {
      conditions.push(sql`${drivers.rating} >= ${ratingValue}`);
    }
  }

  if (query.totalRidesFrom) {
    const ridesFrom = parseInt(query.totalRidesFrom);
    if (!isNaN(ridesFrom)) {
      conditions.push(sql`${drivers.totalRides} >= ${ridesFrom}`);
    }
  }

  if (query.totalRidesTo) {
    const ridesTo = parseInt(query.totalRidesTo);
    if (!isNaN(ridesTo)) {
      conditions.push(sql`${drivers.totalRides} <= ${ridesTo}`);
    }
  }

  if (query.totalEarningsFrom) {
    const earningsFrom = parseFloat(query.totalEarningsFrom);
    if (!isNaN(earningsFrom)) {
      conditions.push(sql`${drivers.totalEarnings} >= ${earningsFrom}`);
    }
  }

  if (query.totalEarningsTo) {
    const earningsTo = parseFloat(query.totalEarningsTo);
    if (!isNaN(earningsTo)) {
      conditions.push(sql`${drivers.totalEarnings} <= ${earningsTo}`);
    }
  }

  if (query.createdAfter) {
    conditions.push(sql`${drivers.createdAt} >= ${query.createdAfter}`);
  }

  if (query.createdBefore) {
    conditions.push(sql`${drivers.createdAt} <= ${query.createdBefore}`);
  }

  if (query.search) {
    conditions.push(buildSearchCondition(query.search));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
};

const getSortOrder = (sortBy: string = 'createdAt', sortOrder: string = 'desc') => {
  const validSortFields = ['createdAt', 'updatedAt', 'rating', 'totalRides', 'totalEarnings', 'licenseNumber'];
  const field = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  
  const columnMap = {
    'createdAt': drivers.createdAt,
    'updatedAt': drivers.updatedAt,
    'rating': drivers.rating,
    'totalRides': drivers.totalRides,
    'totalEarnings': drivers.totalEarnings,
    'licenseNumber': drivers.licenseNumber
  };
  
  const column = columnMap[field as keyof typeof columnMap];
  return sortOrder === 'asc' ? asc(column) : desc(column);
};

// Create Driver
export const createDriver = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const body: CreateDriverRequest = await c.req.json();

    // Required field validation
    const requiredFields = [
      'user_uuid', 'licenseNumber', 'licenseExpiryDate', 'licenseImageUrl',
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
      .where(eq(users.uuid, body.user_uuid))
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
      .where(eq(drivers.user_uuid, body.user_uuid))
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

// Get Drivers with pagination and filtering
export const getAllDrivers = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const query = c.req.query() as GetDriversQuery;

    // Pagination
    const page = Math.max(1, parseInt(query.page || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10')));
    const offset = (page - 1) * limit;

    // Build filters
    const whereCondition = buildFilters(query);
    
    // Build sort order
    const orderBy = getSortOrder(query.sortBy, query.sortOrder);

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(drivers)
      .where(whereCondition);

    const total = totalResult[0].count;

    // Get paginated drivers
    const result = await db
      .select()
      .from(drivers)
      .where(whereCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return c.json({
      success: true,
      message: 'Drivers retrieved successfully',
      data: result,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get drivers error:', error);
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
    const userUuid = c.req.param('uuid');
    const body: UpdateDriverRequest = await c.req.json();

    if (!userUuid) {
      return c.json({
        success: false,
        message: 'User UUID is required'
      }, 400);
    }

    // Check if driver exists
    const existingDriver = await db
      .select()
      .from(drivers)
      .where(eq(drivers.user_uuid, userUuid))
      .limit(1);

    if (existingDriver.length === 0) {
      return c.json({
        success: false,
        message: 'Driver not found'
      }, 404);
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    // Validate and sanitize fields only if they are provided
    if (body.licenseNumber !== undefined) {
      body.licenseNumber = sanitizeInput(body.licenseNumber.toUpperCase());
      if (!validateLicenseNumber(body.licenseNumber)) {
        return c.json({
          success: false,
          message: 'Invalid license number format'
        }, 400);
      }
      updateData.licenseNumber = body.licenseNumber;
    }

    if (body.licenseExpiryDate !== undefined) {
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
      updateData.licenseExpiryDate = body.licenseExpiryDate;
    }

    if (body.licenseImageUrl !== undefined) {
      if (body.licenseImageUrl && !validateImageUrl(body.licenseImageUrl)) {
        return c.json({
          success: false,
          message: 'Please provide a valid license image URL'
        }, 400);
      }
      updateData.licenseImageUrl = body.licenseImageUrl;
    }

    if (body.aadharNumber !== undefined) {
      body.aadharNumber = sanitizeInput(body.aadharNumber);
      if (!validateAadhar(body.aadharNumber)) {
        return c.json({
          success: false,
          message: 'Aadhar number must be 12 digits'
        }, 400);
      }
      updateData.aadharNumber = body.aadharNumber;
    }

    if (body.aadharImageUrl !== undefined) {
      if (body.aadharImageUrl && !validateImageUrl(body.aadharImageUrl)) {
        return c.json({
          success: false,
          message: 'Please provide a valid aadhar image URL'
        }, 400);
      }
      updateData.aadharImageUrl = body.aadharImageUrl;
    }

    if (body.panNumber !== undefined) {
      if (body.panNumber) {
        body.panNumber = sanitizeInput(body.panNumber.toUpperCase());
        if (!validatePAN(body.panNumber)) {
          return c.json({
            success: false,
            message: 'Invalid PAN number format'
          }, 400);
        }
      }
      updateData.panNumber = body.panNumber;
    }

    if (body.panImageUrl !== undefined) {
      if (body.panImageUrl && !validateImageUrl(body.panImageUrl)) {
        return c.json({
          success: false,
          message: 'Please provide a valid PAN image URL'
        }, 400);
      }
      updateData.panImageUrl = body.panImageUrl;
    }

    if (body.policeVerificationCertUrl !== undefined) {
      if (body.policeVerificationCertUrl && !validateImageUrl(body.policeVerificationCertUrl)) {
        return c.json({
          success: false,
          message: 'Please provide a valid police verification certificate URL'
        }, 400);
      }
      updateData.policeVerificationCertUrl = body.policeVerificationCertUrl;
    }

    if (body.emergencyContactName !== undefined) {
      body.emergencyContactName = sanitizeInput(body.emergencyContactName);
      if (!validateName(body.emergencyContactName)) {
        return c.json({
          success: false,
          message: 'Emergency contact name must be 2-100 characters and contain only letters and spaces'
        }, 400);
      }
      updateData.emergencyContactName = body.emergencyContactName;
    }

    if (body.emergencyContactPhone !== undefined) {
      body.emergencyContactPhone = sanitizeInput(body.emergencyContactPhone);
      if (!validatePhone(body.emergencyContactPhone)) {
        return c.json({
          success: false,
          message: 'Invalid emergency contact phone number'
        }, 400);
      }
      updateData.emergencyContactPhone = body.emergencyContactPhone;
    }

    if (body.bankAccountNumber !== undefined) {
      if (body.bankAccountNumber) {
        body.bankAccountNumber = sanitizeInput(body.bankAccountNumber);
      }
      updateData.bankAccountNumber = body.bankAccountNumber;
    }

    if (body.bankIfscCode !== undefined) {
      if (body.bankIfscCode) {
        body.bankIfscCode = sanitizeInput(body.bankIfscCode.toUpperCase());
        if (!validateIFSC(body.bankIfscCode)) {
          return c.json({
            success: false,
            message: 'Invalid IFSC code format'
          }, 400);
        }
      }
      updateData.bankIfscCode = body.bankIfscCode;
    }

    if (body.bankAccountHolderName !== undefined) {
      if (body.bankAccountHolderName) {
        body.bankAccountHolderName = sanitizeInput(body.bankAccountHolderName);
        if (!validateName(body.bankAccountHolderName)) {
          return c.json({
            success: false,
            message: 'Bank account holder name must be 2-100 characters and contain only letters and spaces'
          }, 400);
        }
      }
      updateData.bankAccountHolderName = body.bankAccountHolderName;
    }

    if (body.upiId !== undefined) {
      if (body.upiId) {
        body.upiId = sanitizeInput(body.upiId.toLowerCase());
        if (!validateUPI(body.upiId)) {
          return c.json({
            success: false,
            message: 'Invalid UPI ID format'
          }, 400);
        }
      }
      updateData.upiId = body.upiId;
    }

    if (body.backgroundCheckStatus !== undefined) {
      const validBackgroundCheckStatuses = ['pending', 'in_progress', 'approved', 'rejected'];
      if (!validBackgroundCheckStatuses.includes(body.backgroundCheckStatus)) {
        return c.json({
          success: false,
          message: 'Invalid background check status. Must be one of: pending, in_progress, approved, rejected'
        }, 400);
      }
      updateData.backgroundCheckStatus = body.backgroundCheckStatus;
    }

    if (body.status !== undefined) {
      const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'suspended', 'inactive'];
      if (!validStatuses.includes(body.status)) {
        return c.json({
          success: false,
          message: 'Invalid status. Must be one of: pending, under_review, approved, rejected, suspended, inactive'
        }, 400);
      }
      updateData.status = body.status;
    }

    if (body.rejectionReason !== undefined) {
      updateData.rejectionReason = body.rejectionReason;
    }

    if (body.rating !== undefined && (body.rating < 0 || body.rating > 5)) {
      return c.json({
        success: false,
        message: 'Rating must be between 0 and 5'
      }, 400);
    }

    if (body.rating !== undefined) {
      updateData.rating = body.rating;
    }

    if (body.totalRides !== undefined) {
      if (body.totalRides < 0) {
        return c.json({
          success: false,
          message: 'Total rides cannot be negative'
        }, 400);
      }
      updateData.totalRides = body.totalRides;
    }

    if (body.totalEarnings !== undefined) {
      if (body.totalEarnings < 0) {
        return c.json({
          success: false,
          message: 'Total earnings cannot be negative'
        }, 400);
      }
      updateData.totalEarnings = body.totalEarnings;
    }

    if (body.isOnline !== undefined) {
      updateData.isOnline = body.isOnline;
    }

    // Check unique constraints if updating unique fields
    if (body.licenseNumber || body.aadharNumber || body.panNumber) {
      const duplicateConditions = [];
      
      if (body.licenseNumber) {
        duplicateConditions.push(eq(drivers.licenseNumber, body.licenseNumber));
      }
      
      if (body.aadharNumber) {
        duplicateConditions.push(eq(drivers.aadharNumber, body.aadharNumber));
      }
      
      if (body.panNumber) {
        duplicateConditions.push(eq(drivers.panNumber, body.panNumber));
      }

      if (duplicateConditions.length > 0) {
        const duplicateCheck = await db
          .select()
          .from(drivers)
          .where(
            and(
              or(...duplicateConditions),
              sql`${drivers.user_uuid} != ${userUuid}`
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
    }

    // Handle status updates with timestamps
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
      .where(eq(drivers.user_uuid, userUuid))
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

// GET Driver by user uuid
export const getDriverByUUID = async (c:Context) => {
  try{
    const db = drizzle(c.env.DB);
    const userUUID = c.req.param('uuid');
    if(!userUUID){
      return c.json({
        success: false,
        message: 'User UUID is required'
      }, 400);
    }
    const driver = await db.select().from(drivers).where(eq(drivers.user_uuid, userUUID)).limit(1);
    if(driver.length === 0){
      return c.json({
        success: false,
        message: 'Driver not found'
      }, 404);
    }
    return c.json({
      success: true,
      message: 'Driver retrieved successfully',
      data: driver[0]
    });
  } catch (error) {
    console.error('Get driver by UUID error:', error);
    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
}

export const deleteDriver = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const userUUID = c.req.param('uuid');
    const mode = c.req.param('mode')?.toLowerCase(); // "soft" or "hard"

    if (!userUUID) {
      return c.json({
        success: false,
        message: 'User UUID is required'
      }, 400);
    }

    if (!mode || !['soft', 'hard'].includes(mode)) {
      return c.json({
        success: false,
        message: 'Invalid delete mode. Must be "soft" or "hard".'
      }, 400);
    }

    // Check if driver exists
    const existingDriver = await db
      .select()
      .from(drivers)
      .where(eq(drivers.user_uuid, userUUID))
      .limit(1);

    if (existingDriver.length === 0) {
      return c.json({
        success: false,
        message: 'Driver not found'
      }, 404);
    }

    if (mode === 'soft') {
      // Soft delete - update status to 'inactive'
      await db
        .update(drivers)
        .set({
          status: 'inactive',
          updatedAt: new Date().toISOString()
        })
        .where(eq(drivers.user_uuid, userUUID));

      return c.json({
        success: true,
        message: 'Driver soft-deleted (status set to inactive)'
      });
    }

    // Hard delete
    await db
      .delete(drivers)
      .where(eq(drivers.user_uuid, userUUID));

    return c.json({
      success: true,
      message: 'Driver permanently deleted'
    });

  } catch (error) {
    console.error('Delete driver error:', error);
    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
};
