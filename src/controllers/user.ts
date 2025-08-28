import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, or, like, desc, asc, sql, count } from 'drizzle-orm';
import { users, drivers } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';
import { CreateUserRequest } from '../types/user';
import { validateEmail, validatePhone, validateDateFormat, isValidAge, validateImageUrl } from '../helpers/validation';

interface GetUsersQuery {
  page?: string;
  limit?: string;
  userType?: string;
  isActive?: string;
  isVerified?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  gender?: string;
  createdAfter?: string;
  createdBefore?: string;
}

interface UpdateUserRequest {
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  userType?: 'customer' | 'driver' | 'parent' | 'student' | 'guardian';
  isActive?: boolean;
  isVerified?: boolean;
}

const validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s]{2,50}$/;
  return nameRegex.test(name.trim());
};

const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

const buildSearchCondition = (search: string) => {
  const searchTerm = `%${search.toLowerCase()}%`;
  return or(
    like(sql`LOWER(${users.firstName})`, searchTerm),
    like(sql`LOWER(${users.lastName})`, searchTerm),
    like(sql`LOWER(${users.email})`, searchTerm),
    like(users.phoneNumber, searchTerm)
  );
};

const buildFilters = (query: GetUsersQuery) => {
  const conditions = [];

  if (query.userType) {
    conditions.push(eq(users.userType, query.userType as any));
  }

  if (query.isActive !== undefined) {
    conditions.push(eq(users.isActive, query.isActive === 'true'));
  }

  if (query.isVerified !== undefined) {
    conditions.push(eq(users.isVerified, query.isVerified === 'true'));
  }

  if (query.gender) {
    conditions.push(eq(users.gender, query.gender as any));
  }

  if (query.createdAfter) {
    conditions.push(sql`${users.createdAt} >= ${query.createdAfter}`);
  }

  if (query.createdBefore) {
    conditions.push(sql`${users.createdAt} <= ${query.createdBefore}`);
  }

  if (query.search) {
    conditions.push(buildSearchCondition(query.search));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
};

const getSortOrder = (sortBy: string = 'createdAt', sortOrder: string = 'desc') => {
  const validSortFields = ['createdAt', 'updatedAt', 'firstName', 'lastName', 'email'];
  const field = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  
  // Map field names to actual columns to ensure type safety
  const columnMap = {
    'createdAt': users.createdAt,
    'updatedAt': users.updatedAt,
    'firstName': users.firstName,
    'lastName': users.lastName,
    'email': users.email
  };
  
  const column = columnMap[field as keyof typeof columnMap];
  return sortOrder === 'asc' ? asc(column) : desc(column);
};

// Create User (existing function - keeping as is)
export const createUser = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const body: CreateUserRequest = await c.req.json();

    // Required field validation
    const requiredFields = ['email', 'phoneNumber', 'firstName', 'lastName'];
    
    for (const field of requiredFields) {
      if (!body[field as keyof CreateUserRequest]) {
        return c.json({
          success: false,
          message: `${field} is required`
        }, 400);
      }
    }

    // Sanitize inputs
    body.email = sanitizeInput(body.email.toLowerCase());
    body.phoneNumber = sanitizeInput(body.phoneNumber);
    body.firstName = sanitizeInput(body.firstName);
    body.lastName = sanitizeInput(body.lastName);

    // Validate data formats
    if (!validateEmail(body.email)) {
      return c.json({
        success: false,
        message: 'Please provide a valid email address'
      }, 400);
    }

    if (!validatePhone(body.phoneNumber)) {
      return c.json({
        success: false,
        message: 'Please provide a valid Indian mobile number (10 digits starting with 6-9)'
      }, 400);
    }

    if (!validateName(body.firstName)) {
      return c.json({
        success: false,
        message: 'First name must be 2-50 characters and contain only letters and spaces'
      }, 400);
    }

    if (!validateName(body.lastName)) {
      return c.json({
        success: false,
        message: 'Last name must be 2-50 characters and contain only letters and spaces'
      }, 400);
    }

    // Optional field validations
    if (body.dateOfBirth) {
      if (!validateDateFormat(body.dateOfBirth)) {
        return c.json({
          success: false,
          message: 'Date of birth must be in YYYY-MM-DD format'
        }, 400);
      }

      if (!isValidAge(body.dateOfBirth)) {
        return c.json({
          success: false,
          message: 'Age must be between 13 and 120 years'
        }, 400);
      }
    }

    if (body.profileImage && !validateImageUrl(body.profileImage)) {
      return c.json({
        success: false,
        message: 'Please provide a valid image URL'
      }, 400);
    }

    // Validate enum values
    const validUserTypes = ["customer", "driver", "parent", "student", "guardian"];
    if (body.userType && !validUserTypes.includes(body.userType)) {
      return c.json({
        success: false,
        message: 'Invalid user type. Must be one of: customer, driver, parent, student, guardian'
      }, 400);
    }

    const validGenders = ["male", "female", "other"];
    if (body.gender && !validGenders.includes(body.gender)) {
      return c.json({
        success: false,
        message: 'Invalid gender. Must be one of: male, female, other'
      }, 400);
    }

    // Check unique constraints
    const existingUser = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, body.email),
          eq(users.phoneNumber, body.phoneNumber)
        )
      )
      .limit(1);

    if (existingUser.length > 0) {
      const existing = existingUser[0];
      const conflictField = existing.email === body.email ? 'Email' : 'Phone number';
      
      return c.json({
        success: false,
        message: `${conflictField} already exists`
      }, 409);
    }

    // Generate UUID for user
    const userUuid = uuidv4();

    // Create user
    const result = await db
      .insert(users)
      .values({
        email: body.email,
        phoneNumber: body.phoneNumber,
        firstName: body.firstName,
        lastName: body.lastName,
        profileImage: body.profileImage || null,
        dateOfBirth: body.dateOfBirth || null,
        gender: body.gender || null,
        userType: body.userType || "customer",
        uuid: userUuid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    // Remove sensitive data from response
    const { ...userData } = result[0];

    return c.json({
      success: true,
      message: 'User created successfully',
      data: userData
    }, 201);

  } catch (error) {
    console.error('Create user error:', error);

    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return c.json({
        success: false,
        message: 'Email or phone number already exists'
      }, 409);
    }

    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
};

export const getUsers = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const query = c.req.query() as GetUsersQuery;

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
      .from(users)
      .where(whereCondition);

    const total = totalResult[0].count;

    // Get paginated users
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        phoneNumber: users.phoneNumber,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImage: users.profileImage,
        dateOfBirth: users.dateOfBirth,
        gender: users.gender,
        userType: users.userType,
        isActive: users.isActive,
        isVerified: users.isVerified,
        uuid: users.uuid,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(whereCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return c.json({
      success: true,
      message: 'Users retrieved successfully',
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
    console.error('Get users error:', error);
    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
};

export const getUserByUuid = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const uuid = c.req.param('uuid');

    if (!uuid) {
      return c.json({
        success: false,
        message: 'User UUID is required'
      }, 400);
    }

    const result = await db
      .select({
        id: users.id,
        email: users.email,
        phoneNumber: users.phoneNumber,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImage: users.profileImage,
        dateOfBirth: users.dateOfBirth,
        gender: users.gender,
        userType: users.userType,
        isActive: users.isActive,
        isVerified: users.isVerified,
        uuid: users.uuid,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.uuid, uuid))  // Directly query by uuid
      .limit(1);

    if (result.length === 0) {
      return c.json({
        success: false,
        message: 'User not found'
      }, 404);
    }

    return c.json({
      success: true,
      message: 'User retrieved successfully',
      data: result[0]
    });

  } catch (error) {
    console.error('Get user by UUID error:', error);
    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
};

// Update User (PATCH - partial update)
export const updateUser = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const identifier = c.req.param('uuid'); // Use uuid directly
    const body: UpdateUserRequest = await c.req.json();

    if (!identifier) {
      return c.json({
        success: false,
        message: 'User uuid is required'
      }, 400);
    }

    // Check if user exists by UUID (only use uuid)
    const whereCondition = eq(users.uuid, identifier);  // Only use uuid

    const existingUser = await db
      .select()
      .from(users)
      .where(whereCondition)
      .limit(1);

    if (existingUser.length === 0) {
      return c.json({
        success: false,
        message: 'User not found'
      }, 404);
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    // Validate and sanitize fields only if they are provided
    if (body.email !== undefined) {
      body.email = sanitizeInput(body.email.toLowerCase());
      if (!validateEmail(body.email)) {
        return c.json({
          success: false,
          message: 'Please provide a valid email address'
        }, 400);
      }

      // Check if email already exists for another user
      const emailExists = await db
        .select()
        .from(users)
        .where(and(
          eq(users.email, body.email),
          sql`${users.uuid} != ${identifier}` // Ensure we're excluding the current user
        ))
        .limit(1);

      if (emailExists.length > 0) {
        return c.json({
          success: false,
          message: 'Email already exists'
        }, 409);
      }

      updateData.email = body.email;
    }

    if (body.phoneNumber !== undefined) {
      body.phoneNumber = sanitizeInput(body.phoneNumber);
      if (!validatePhone(body.phoneNumber)) {
        return c.json({
          success: false,
          message: 'Please provide a valid Indian mobile number (10 digits starting with 6-9)'
        }, 400);
      }

      // Check if phone already exists for another user
      const phoneExists = await db
        .select()
        .from(users)
        .where(and(
          eq(users.phoneNumber, body.phoneNumber),
          sql`${users.uuid} != ${identifier}` // Ensure we're excluding the current user
        ))
        .limit(1);

      if (phoneExists.length > 0) {
        return c.json({
          success: false,
          message: 'Phone number already exists'
        }, 409);
      }

      updateData.phoneNumber = body.phoneNumber;
    }

    if (body.firstName !== undefined) {
      body.firstName = sanitizeInput(body.firstName);
      if (!validateName(body.firstName)) {
        return c.json({
          success: false,
          message: 'First name must be 2-50 characters and contain only letters and spaces'
        }, 400);
      }
      updateData.firstName = body.firstName;
    }

    if (body.lastName !== undefined) {
      body.lastName = sanitizeInput(body.lastName);
      if (!validateName(body.lastName)) {
        return c.json({
          success: false,
          message: 'Last name must be 2-50 characters and contain only letters and spaces'
        }, 400);
      }
      updateData.lastName = body.lastName;
    }

    if (body.dateOfBirth !== undefined) {
      if (body.dateOfBirth && !validateDateFormat(body.dateOfBirth)) {
        return c.json({
          success: false,
          message: 'Date of birth must be in YYYY-MM-DD format'
        }, 400);
      }

      if (body.dateOfBirth && !isValidAge(body.dateOfBirth)) {
        return c.json({
          success: false,
          message: 'Age must be between 13 and 120 years'
        }, 400);
      }

      updateData.dateOfBirth = body.dateOfBirth;
    }

    if (body.profileImage !== undefined) {
      if (body.profileImage && !validateImageUrl(body.profileImage)) {
        return c.json({
          success: false,
          message: 'Please provide a valid image URL'
        }, 400);
      }
      updateData.profileImage = body.profileImage;
    }

    if (body.gender !== undefined) {
      const validGenders = ["male", "female", "other"];
      if (body.gender && !validGenders.includes(body.gender)) {
        return c.json({
          success: false,
          message: 'Invalid gender. Must be one of: male, female, other'
        }, 400);
      }
      updateData.gender = body.gender;
    }

    if (body.userType !== undefined) {
      const validUserTypes = ["customer", "driver", "parent", "student", "guardian"];
      if (!validUserTypes.includes(body.userType)) {
        return c.json({
          success: false,
          message: 'Invalid user type. Must be one of: customer, driver, parent, student, guardian'
        }, 400);
      }
      updateData.userType = body.userType;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }

    if (body.isVerified !== undefined) {
      updateData.isVerified = body.isVerified;
    }

    // Update user
    const result = await db
      .update(users)
      .set(updateData)
      .where(whereCondition)
      .returning();

    return c.json({
      success: true,
      message: 'User updated successfully',
      data: result[0]
    });

  } catch (error) {
    console.error('Update user error:', error);

    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return c.json({
        success: false,
        message: 'Email or phone number already exists'
      }, 409);
    }

    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
};

// Delete User (Soft delete or Hard delete based on deleteType parameter)
export const deleteUser = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const identifier = c.req.param('uuid'); 
    const deleteType = c.req.param('deleteType') || 'soft';  // Default to 'soft' if not provided

    if (!identifier) {
      return c.json({
        success: false,
        message: 'User uuid is required'
      }, 400);
    }

    // Validate deleteType to be either 'soft' or 'hard'
    if (!['soft', 'hard'].includes(deleteType)) {
      return c.json({
        success: false,
        message: 'Invalid delete type. It must be either "soft" or "hard"'
      }, 400);
    }

    // Check if user exists by UUID (only use uuid)
    const whereCondition = eq(users.uuid, identifier); 

    const existingUser = await db
      .select()
      .from(users)
      .where(whereCondition)
      .limit(1);

    if (existingUser.length === 0) {
      return c.json({
        success: false,
        message: 'User not found'
      }, 404);
    }

    let result;
    if (deleteType === 'soft') {
      result = await db
        .update(users)  
        .set({
          isActive: false,
          updatedAt: new Date().toISOString()
        })
        .where(whereCondition)
        .returning();
    } else {
      // Hard delete (remove user from the database entirely)
      result = await db
        .delete(users) 
        .where(whereCondition)  
        .returning();
    }

    return c.json({
      success: true,
      message: `User ${deleteType} deleted successfully`,
      data: result[0]
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
};