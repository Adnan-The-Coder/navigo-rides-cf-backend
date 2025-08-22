import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, or, like, desc, asc, sql } from 'drizzle-orm';
import { users, drivers } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';

// Type definitions
interface CreateUserRequest {
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  userType?: "customer" | "driver" | "parent" | "student" | "guardian";
}

interface UpdateUserRequest extends Partial<CreateUserRequest> {
  isActive?: boolean;
  isVerified?: boolean;
}

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

// Validation helpers
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase());
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number format
  return phoneRegex.test(phone);
};

const validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s]{2,50}$/;
  return nameRegex.test(name.trim());
};

const validateDateFormat = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

const isValidAge = (dateOfBirth: string): boolean => {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= 13; // Minimum age 13
  }
  
  return age >= 13 && age <= 120; // Age between 13 and 120
};

const validateImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

// Create User
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
