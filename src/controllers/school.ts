import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, or, like, desc, asc, sql, count } from 'drizzle-orm';
import { schools } from '../db/schema';
import { validateEmail, validatePhone } from '../helpers/validation';

interface GetSchoolsQuery {
  page?: string;
  limit?: string;
  schoolType?: string;
  boardType?: string;
  isActive?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  city?: string;
  state?: string;
  createdAfter?: string;
  createdBefore?: string;
}

interface CreateSchoolRequest {
  name: string;
  code: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
  email?: string;
  principalName?: string;
  schoolType: 'government' | 'private' | 'aided' | 'international' | 'boarding';
  boardType?: 'cbse' | 'icse' | 'state' | 'igcse' | 'ib' | 'other';
  startTime: string;
  endTime: string;
  workingDays: string[];
  holidays?: string[];
}

interface UpdateSchoolRequest {
  name?: string;
  code?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  principalName?: string;
  schoolType?: 'government' | 'private' | 'aided' | 'international' | 'boarding';
  boardType?: 'cbse' | 'icse' | 'state' | 'igcse' | 'ib' | 'other';
  startTime?: string;
  endTime?: string;
  workingDays?: string[];
  holidays?: string[];
  isActive?: boolean;
}

// Validation helpers
const validateSchoolCode = (code: string): boolean => {
  const codeRegex = /^[A-Z0-9_-]{3,20}$/;
  return codeRegex.test(code.trim());
};

const validateSchoolName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z0-9\s.,'-]{2,100}$/;
  return nameRegex.test(name.trim());
};

const validatePincode = (pincode: string): boolean => {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode.trim());
};

const validateCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

const validateTime = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time.trim());
};

const validateWorkingDays = (days: string[]): boolean => {
  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return days.length > 0 && days.every(day => validDays.includes(day.toLowerCase()));
};

const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

const buildSearchCondition = (search: string) => {
  const searchTerm = `%${search.toLowerCase()}%`;
  return or(
    like(sql`LOWER(${schools.name})`, searchTerm),
    like(sql`LOWER(${schools.code})`, searchTerm),
    like(sql`LOWER(${schools.city})`, searchTerm),
    like(sql`LOWER(${schools.principalName})`, searchTerm),
    like(schools.email, searchTerm)
  );
};

const buildFilters = (query: GetSchoolsQuery) => {
  const conditions = [];

  if (query.schoolType) {
    conditions.push(eq(schools.schoolType, query.schoolType as any));
  }

  if (query.boardType) {
    conditions.push(eq(schools.boardType, query.boardType as any));
  }

  if (query.isActive !== undefined) {
    conditions.push(eq(schools.isActive, query.isActive === 'true'));
  }

  if (query.city) {
    conditions.push(like(sql`LOWER(${schools.city})`, `%${query.city.toLowerCase()}%`));
  }

  if (query.state) {
    conditions.push(like(sql`LOWER(${schools.state})`, `%${query.state.toLowerCase()}%`));
  }

  if (query.createdAfter) {
    conditions.push(sql`${schools.createdAt} >= ${query.createdAfter}`);
  }

  if (query.createdBefore) {
    conditions.push(sql`${schools.createdAt} <= ${query.createdBefore}`);
  }

  if (query.search) {
    conditions.push(buildSearchCondition(query.search));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
};

const getSortOrder = (sortBy: string = 'createdAt', sortOrder: string = 'desc') => {
  const validSortFields = ['createdAt', 'updatedAt', 'name', 'code', 'city', 'state'];
  const field = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  
  const columnMap = {
    'createdAt': schools.createdAt,
    'updatedAt': schools.updatedAt,
    'name': schools.name,
    'code': schools.code,
    'city': schools.city,
    'state': schools.state
  };
  
  const column = columnMap[field as keyof typeof columnMap];
  return sortOrder === 'asc' ? asc(column) : desc(column);
};

// Create School
export const createSchool = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const body: CreateSchoolRequest = await c.req.json();

    // Required field validation
    const requiredFields = ['name', 'code', 'address', 'latitude', 'longitude', 'city', 'state', 'pincode', 'schoolType', 'startTime', 'endTime', 'workingDays'];
    
    for (const field of requiredFields) {
      if (body[field as keyof CreateSchoolRequest] === undefined || body[field as keyof CreateSchoolRequest] === null) {
        return c.json({
          success: false,
          message: `${field} is required`
        }, 400);
      }
    }

    // Sanitize string inputs
    body.name = sanitizeInput(body.name);
    body.code = sanitizeInput(body.code.toUpperCase());
    body.address = sanitizeInput(body.address);
    body.city = sanitizeInput(body.city);
    body.state = sanitizeInput(body.state);
    body.pincode = sanitizeInput(body.pincode);

    if (body.email) {
      body.email = sanitizeInput(body.email.toLowerCase());
    }

    if (body.phone) {
      body.phone = sanitizeInput(body.phone);
    }

    if (body.principalName) {
      body.principalName = sanitizeInput(body.principalName);
    }

    // Validate data formats
    if (!validateSchoolName(body.name)) {
      return c.json({
        success: false,
        message: 'School name must be 2-100 characters and contain only letters, numbers, spaces, and basic punctuation'
      }, 400);
    }

    if (!validateSchoolCode(body.code)) {
      return c.json({
        success: false,
        message: 'School code must be 3-20 characters and contain only uppercase letters, numbers, hyphens, and underscores'
      }, 400);
    }

    if (!validatePincode(body.pincode)) {
      return c.json({
        success: false,
        message: 'Please provide a valid 6-digit Indian pincode'
      }, 400);
    }

    if (!validateCoordinates(body.latitude, body.longitude)) {
      return c.json({
        success: false,
        message: 'Please provide valid latitude (-90 to 90) and longitude (-180 to 180) coordinates'
      }, 400);
    }

    if (!validateTime(body.startTime) || !validateTime(body.endTime)) {
      return c.json({
        success: false,
        message: 'Please provide valid time in HH:MM format for start and end times'
      }, 400);
    }

    if (!validateWorkingDays(body.workingDays)) {
      return c.json({
        success: false,
        message: 'Please provide valid working days (monday, tuesday, wednesday, thursday, friday, saturday, sunday)'
      }, 400);
    }

    // Optional field validations
    if (body.email && !validateEmail(body.email)) {
      return c.json({
        success: false,
        message: 'Please provide a valid email address'
      }, 400);
    }

    if (body.phone && !validatePhone(body.phone)) {
      return c.json({
        success: false,
        message: 'Please provide a valid Indian mobile number (10 digits starting with 6-9)'
      }, 400);
    }

    // Validate enum values
    const validSchoolTypes = ["government", "private", "aided", "international", "boarding"];
    if (!validSchoolTypes.includes(body.schoolType)) {
      return c.json({
        success: false,
        message: 'Invalid school type. Must be one of: government, private, aided, international, boarding'
      }, 400);
    }

    const validBoardTypes = ["cbse", "icse", "state", "igcse", "ib", "other"];
    if (body.boardType && !validBoardTypes.includes(body.boardType)) {
      return c.json({
        success: false,
        message: 'Invalid board type. Must be one of: cbse, icse, state, igcse, ib, other'
      }, 400);
    }

    // Check unique constraints
    const existingSchool = await db
      .select()
      .from(schools)
      .where(eq(schools.code, body.code))
      .limit(1);

    if (existingSchool.length > 0) {
      return c.json({
        success: false,
        message: 'School code already exists'
      }, 409);
    }

    // Create school
    const result = await db
      .insert(schools)
      .values({
        name: body.name,
        code: body.code,
        address: body.address,
        latitude: body.latitude,
        longitude: body.longitude,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        phone: body.phone || null,
        email: body.email || null,
        principalName: body.principalName || null,
        schoolType: body.schoolType,
        boardType: body.boardType || null,
        startTime: body.startTime,
        endTime: body.endTime,
        workingDays: JSON.stringify(body.workingDays),
        holidays: body.holidays ? JSON.stringify(body.holidays) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    // Parse JSON fields for response
    const schoolData = {
      ...result[0],
      workingDays: JSON.parse(result[0].workingDays),
      holidays: result[0].holidays ? JSON.parse(result[0].holidays) : null
    };

    return c.json({
      success: true,
      message: 'School created successfully',
      data: schoolData
    }, 201);

  } catch (error) {
    console.error('Create school error:', error);

    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return c.json({
        success: false,
        message: 'School code already exists'
      }, 409);
    }

    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
};

// Get Schools with filtering and pagination
export const getSchools = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const query = c.req.query() as GetSchoolsQuery;

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
      .from(schools)
      .where(whereCondition);

    const total = totalResult[0].count;

    // Get paginated schools
    const result = await db
      .select()
      .from(schools)
      .where(whereCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Parse JSON fields
    const schoolsData = result.map(school => ({
      ...school,
      workingDays: JSON.parse(school.workingDays),
      holidays: school.holidays ? JSON.parse(school.holidays) : null
    }));

    const totalPages = Math.ceil(total / limit);

    return c.json({
      success: true,
      message: 'Schools retrieved successfully',
      data: schoolsData,
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
    console.error('Get schools error:', error);
    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
};

// Get School by ID
export const getSchoolById = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const id = c.req.param('id');

    if (!id || isNaN(Number(id))) {
      return c.json({
        success: false,
        message: 'Valid school ID is required'
      }, 400);
    }

    const result = await db
      .select()
      .from(schools)
      .where(eq(schools.id, Number(id)))
      .limit(1);

    if (result.length === 0) {
      return c.json({
        success: false,
        message: 'School not found'
      }, 404);
    }

    // Parse JSON fields
    const schoolData = {
      ...result[0],
      workingDays: JSON.parse(result[0].workingDays),
      holidays: result[0].holidays ? JSON.parse(result[0].holidays) : null
    };

    return c.json({
      success: true,
      message: 'School retrieved successfully',
      data: schoolData
    });

  } catch (error) {
    console.error('Get school by ID error:', error);
    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
};

// Get School by Code
export const getSchoolByCode = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const code = c.req.param('code');

    if (!code) {
      return c.json({
        success: false,
        message: 'School code is required'
      }, 400);
    }

    const result = await db
      .select()
      .from(schools)
      .where(eq(schools.code, code.toUpperCase()))
      .limit(1);

    if (result.length === 0) {
      return c.json({
        success: false,
        message: 'School not found'
      }, 404);
    }

    // Parse JSON fields
    const schoolData = {
      ...result[0],
      workingDays: JSON.parse(result[0].workingDays),
      holidays: result[0].holidays ? JSON.parse(result[0].holidays) : null
    };

    return c.json({
      success: true,
      message: 'School retrieved successfully',
      data: schoolData
    });

  } catch (error) {
    console.error('Get school by code error:', error);
    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
};

// Update School (PATCH - partial update)
export const updateSchool = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const id = c.req.param('id');
    const body: UpdateSchoolRequest = await c.req.json();

    if (!id || isNaN(Number(id))) {
      return c.json({
        success: false,
        message: 'Valid school ID is required'
      }, 400);
    }

    // Check if school exists
    const existingSchool = await db
      .select()
      .from(schools)
      .where(eq(schools.id, Number(id)))
      .limit(1);

    if (existingSchool.length === 0) {
      return c.json({
        success: false,
        message: 'School not found'
      }, 404);
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    // Validate and sanitize fields only if they are provided
    if (body.name !== undefined) {
      body.name = sanitizeInput(body.name);
      if (!validateSchoolName(body.name)) {
        return c.json({
          success: false,
          message: 'School name must be 2-100 characters and contain only letters, numbers, spaces, and basic punctuation'
        }, 400);
      }
      updateData.name = body.name;
    }

    if (body.code !== undefined) {
      body.code = sanitizeInput(body.code.toUpperCase());
      if (!validateSchoolCode(body.code)) {
        return c.json({
          success: false,
          message: 'School code must be 3-20 characters and contain only uppercase letters, numbers, hyphens, and underscores'
        }, 400);
      }

      // Check if code already exists for another school
      const codeExists = await db
        .select()
        .from(schools)
        .where(and(
          eq(schools.code, body.code),
          sql`${schools.id} != ${Number(id)}`
        ))
        .limit(1);

      if (codeExists.length > 0) {
        return c.json({
          success: false,
          message: 'School code already exists'
        }, 409);
      }

      updateData.code = body.code;
    }

    if (body.address !== undefined) {
      updateData.address = sanitizeInput(body.address);
    }

    if (body.latitude !== undefined || body.longitude !== undefined) {
      const lat = body.latitude ?? existingSchool[0].latitude;
      const lng = body.longitude ?? existingSchool[0].longitude;
      
      if (!validateCoordinates(lat, lng)) {
        return c.json({
          success: false,
          message: 'Please provide valid latitude (-90 to 90) and longitude (-180 to 180) coordinates'
        }, 400);
      }

      if (body.latitude !== undefined) updateData.latitude = body.latitude;
      if (body.longitude !== undefined) updateData.longitude = body.longitude;
    }

    if (body.city !== undefined) {
      updateData.city = sanitizeInput(body.city);
    }

    if (body.state !== undefined) {
      updateData.state = sanitizeInput(body.state);
    }

    if (body.pincode !== undefined) {
      body.pincode = sanitizeInput(body.pincode);
      if (!validatePincode(body.pincode)) {
        return c.json({
          success: false,
          message: 'Please provide a valid 6-digit Indian pincode'
        }, 400);
      }
      updateData.pincode = body.pincode;
    }

    if (body.phone !== undefined) {
      if (body.phone) {
        body.phone = sanitizeInput(body.phone);
        if (!validatePhone(body.phone)) {
          return c.json({
            success: false,
            message: 'Please provide a valid Indian mobile number (10 digits starting with 6-9)'
          }, 400);
        }
      }
      updateData.phone = body.phone;
    }

    if (body.email !== undefined) {
      if (body.email) {
        body.email = sanitizeInput(body.email.toLowerCase());
        if (!validateEmail(body.email)) {
          return c.json({
            success: false,
            message: 'Please provide a valid email address'
          }, 400);
        }
      }
      updateData.email = body.email;
    }

    if (body.principalName !== undefined) {
      updateData.principalName = body.principalName ? sanitizeInput(body.principalName) : null;
    }

    if (body.schoolType !== undefined) {
      const validSchoolTypes = ["government", "private", "aided", "international", "boarding"];
      if (!validSchoolTypes.includes(body.schoolType)) {
        return c.json({
          success: false,
          message: 'Invalid school type. Must be one of: government, private, aided, international, boarding'
        }, 400);
      }
      updateData.schoolType = body.schoolType;
    }

    if (body.boardType !== undefined) {
      const validBoardTypes = ["cbse", "icse", "state", "igcse", "ib", "other"];
      if (body.boardType && !validBoardTypes.includes(body.boardType)) {
        return c.json({
          success: false,
          message: 'Invalid board type. Must be one of: cbse, icse, state, igcse, ib, other'
        }, 400);
      }
      updateData.boardType = body.boardType;
    }

    if (body.startTime !== undefined) {
      if (!validateTime(body.startTime)) {
        return c.json({
          success: false,
          message: 'Please provide valid start time in HH:MM format'
        }, 400);
      }
      updateData.startTime = body.startTime;
    }

    if (body.endTime !== undefined) {
      if (!validateTime(body.endTime)) {
        return c.json({
          success: false,
          message: 'Please provide valid end time in HH:MM format'
        }, 400);
      }
      updateData.endTime = body.endTime;
    }

    if (body.workingDays !== undefined) {
      if (!validateWorkingDays(body.workingDays)) {
        return c.json({
          success: false,
          message: 'Please provide valid working days (monday, tuesday, wednesday, thursday, friday, saturday, sunday)'
        }, 400);
      }
      updateData.workingDays = JSON.stringify(body.workingDays);
    }

    if (body.holidays !== undefined) {
      updateData.holidays = body.holidays ? JSON.stringify(body.holidays) : null;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }

    // Update school
    const result = await db
      .update(schools)
      .set(updateData)
      .where(eq(schools.id, Number(id)))
      .returning();

    // Parse JSON fields for response
    const schoolData = {
      ...result[0],
      workingDays: JSON.parse(result[0].workingDays),
      holidays: result[0].holidays ? JSON.parse(result[0].holidays) : null
    };

    return c.json({
      success: true,
      message: 'School updated successfully',
      data: schoolData
    });

  } catch (error) {
    console.error('Update school error:', error);

    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return c.json({
        success: false,
        message: 'School code already exists'
      }, 409);
    }

    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
};

// Delete School (Soft delete or Hard delete based on deleteType parameter)
export const deleteSchool = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const id = c.req.param('id');
    const deleteType = c.req.param('deleteType') || 'soft';

    if (!id || isNaN(Number(id))) {
      return c.json({
        success: false,
        message: 'Valid school ID is required'
      }, 400);
    }

    // Validate deleteType
    if (!['soft', 'hard'].includes(deleteType)) {
      return c.json({
        success: false,
        message: 'Invalid delete type. It must be either "soft" or "hard"'
      }, 400);
    }

    // Check if school exists
    const existingSchool = await db
      .select()
      .from(schools)
      .where(eq(schools.id, Number(id)))
      .limit(1);

    if (existingSchool.length === 0) {
      return c.json({
        success: false,
        message: 'School not found'
      }, 404);
    }

    let result;
    if (deleteType === 'soft') {
      result = await db
        .update(schools)
        .set({
          isActive: false,
          updatedAt: new Date().toISOString()
        })
        .where(eq(schools.id, Number(id)))
        .returning();
    } else {
      // Hard delete
      result = await db
        .delete(schools)
        .where(eq(schools.id, Number(id)))
        .returning();
    }

    // Parse JSON fields for response if result exists
    const schoolData = result[0] ? {
      ...result[0],
      workingDays: result[0].workingDays ? JSON.parse(result[0].workingDays) : null,
      holidays: result[0].holidays ? JSON.parse(result[0].holidays) : null
    } : null;

    return c.json({
      success: true,
      message: `School ${deleteType} deleted successfully`,
      data: schoolData
    });

  } catch (error) {
    console.error('Delete school error:', error);
    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
};