import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, or, like, desc, asc, sql, count } from 'drizzle-orm';
import { vehicles, drivers } from '../db/schema';
import { validateImageUrl, validateDateFormat } from '../helpers/validation';

interface GetVehiclesQuery {
  page?: string;
  limit?: string;
  vehicleType?: string;
  verificationStatus?: string;
  isActive?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  driverId?: string;
  make?: string;
  model?: string;
  yearFrom?: string;
  yearTo?: string;
  createdAfter?: string;
  createdBefore?: string;
}

interface CreateVehicleRequest {
  driverId: number;
  vehicleType: 'auto' | 'car' | 'bike' | 'bus' | 'van';
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  capacity: number;
  rcImageUrl: string;
  insuranceCertUrl: string;
  insuranceExpiryDate: string;
  pucCertUrl?: string;
  pucExpiryDate?: string;
  permitImageUrl?: string;
  permitExpiryDate?: string;
  vehicleImageUrls?: string;
}

interface UpdateVehicleRequest {
  driverId?: number;
  vehicleType?: 'auto' | 'car' | 'bike' | 'bus' | 'van';
  registrationNumber?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  capacity?: number;
  rcImageUrl?: string;
  insuranceCertUrl?: string;
  insuranceExpiryDate?: string;
  pucCertUrl?: string;
  pucExpiryDate?: string;
  permitImageUrl?: string;
  permitExpiryDate?: string;
  vehicleImageUrls?: string;
  isActive?: boolean;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
}

const validateRegistrationNumber = (regNumber: string): boolean => {
  // Indian vehicle registration number pattern
  const regPattern = /^[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{1,4}$/;
  return regPattern.test(regNumber.toUpperCase().replace(/\s/g, ''));
};

const validateYear = (year: number): boolean => {
  const currentYear = new Date().getFullYear();
  return year >= 1990 && year <= currentYear;
};

const validateCapacity = (capacity: number, vehicleType: string): boolean => {
  const capacityLimits = {
    bike: { min: 1, max: 2 },
    auto: { min: 2, max: 6 },
    car: { min: 4, max: 8 },
    van: { min: 6, max: 15 },
    bus: { min: 10, max: 60 }
  };
  
  const limits = capacityLimits[vehicleType as keyof typeof capacityLimits];
  return limits ? capacity >= limits.min && capacity <= limits.max : true;
};

const validateVehicleImageUrls = (imageUrls: string): boolean => {
  try {
    const urls = JSON.parse(imageUrls);
    if (!Array.isArray(urls)) return false;
    return urls.every((url: string) => validateImageUrl(url));
  } catch {
    return false;
  }
};

const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

const buildSearchCondition = (search: string) => {
  const searchTerm = `%${search.toLowerCase()}%`;
  return or(
    like(sql`LOWER(${vehicles.registrationNumber})`, searchTerm),
    like(sql`LOWER(${vehicles.make})`, searchTerm),
    like(sql`LOWER(${vehicles.model})`, searchTerm),
    like(sql`LOWER(${vehicles.color})`, searchTerm)
  );
};

const buildFilters = (query: GetVehiclesQuery) => {
  const conditions = [];

  if (query.vehicleType) {
    conditions.push(eq(vehicles.vehicleType, query.vehicleType as any));
  }

  if (query.verificationStatus) {
    conditions.push(eq(vehicles.verificationStatus, query.verificationStatus as any));
  }

  if (query.isActive !== undefined) {
    conditions.push(eq(vehicles.isActive, query.isActive === 'true'));
  }

  if (query.driverId) {
    conditions.push(eq(vehicles.driverId, parseInt(query.driverId)));
  }

  if (query.make) {
    conditions.push(like(sql`LOWER(${vehicles.make})`, `%${query.make.toLowerCase()}%`));
  }

  if (query.model) {
    conditions.push(like(sql`LOWER(${vehicles.model})`, `%${query.model.toLowerCase()}%`));
  }

  if (query.yearFrom) {
    conditions.push(sql`${vehicles.year} >= ${parseInt(query.yearFrom)}`);
  }

  if (query.yearTo) {
    conditions.push(sql`${vehicles.year} <= ${parseInt(query.yearTo)}`);
  }

  if (query.createdAfter) {
    conditions.push(sql`${vehicles.createdAt} >= ${query.createdAfter}`);
  }

  if (query.createdBefore) {
    conditions.push(sql`${vehicles.createdAt} <= ${query.createdBefore}`);
  }

  if (query.search) {
    conditions.push(buildSearchCondition(query.search));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
};

const getSortOrder = (sortBy: string = 'createdAt', sortOrder: string = 'desc') => {
  const validSortFields = ['createdAt', 'updatedAt', 'registrationNumber', 'make', 'model', 'year', 'verificationStatus'];
  const field = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  
  const columnMap = {
    'createdAt': vehicles.createdAt,
    'updatedAt': vehicles.updatedAt,
    'registrationNumber': vehicles.registrationNumber,
    'make': vehicles.make,
    'model': vehicles.model,
    'year': vehicles.year,
    'verificationStatus': vehicles.verificationStatus
  };
  
  const column = columnMap[field as keyof typeof columnMap];
  return sortOrder === 'asc' ? asc(column) : desc(column);
};

// Create Vehicle
export const createVehicle = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const body: CreateVehicleRequest = await c.req.json();

    // Required field validation
    const requiredFields = [
      'driverId', 'vehicleType', 'registrationNumber', 'make', 'model', 
      'year', 'color', 'capacity', 'rcImageUrl', 'insuranceCertUrl', 
      'insuranceExpiryDate'
    ];
    
    for (const field of requiredFields) {
      if (body[field as keyof CreateVehicleRequest] === undefined || 
          body[field as keyof CreateVehicleRequest] === null ||
          body[field as keyof CreateVehicleRequest] === '') {
        return c.json({
          success: false,
          message: `${field} is required`
        }, 400);
      }
    }

    // Sanitize string inputs
    body.registrationNumber = sanitizeInput(body.registrationNumber.toUpperCase());
    body.make = sanitizeInput(body.make);
    body.model = sanitizeInput(body.model);
    body.color = sanitizeInput(body.color);

    // Validate driver exists
    const driverExists = await db
      .select({ id: drivers.id })
      .from(drivers)
      .where(eq(drivers.id, body.driverId))
      .limit(1);

    if (driverExists.length === 0) {
      return c.json({
        success: false,
        message: 'Driver not found'
      }, 404);
    }

    // Validate vehicle type
    const validVehicleTypes = ['auto', 'car', 'bike', 'bus', 'van'];
    if (!validVehicleTypes.includes(body.vehicleType)) {
      return c.json({
        success: false,
        message: 'Invalid vehicle type. Must be one of: auto, car, bike, bus, van'
      }, 400);
    }

    // Validate registration number
    if (!validateRegistrationNumber(body.registrationNumber)) {
      return c.json({
        success: false,
        message: 'Invalid registration number format. Expected format: XX00XX0000'
      }, 400);
    }

    // Validate year
    if (!validateYear(body.year)) {
      return c.json({
        success: false,
        message: `Invalid year. Must be between 1990 and ${new Date().getFullYear()}`
      }, 400);
    }

    // Validate capacity based on vehicle type
    if (!validateCapacity(body.capacity, body.vehicleType)) {
      return c.json({
        success: false,
        message: `Invalid capacity for vehicle type ${body.vehicleType}`
      }, 400);
    }

    // Validate required image URLs
    if (!validateImageUrl(body.rcImageUrl)) {
      return c.json({
        success: false,
        message: 'Invalid RC image URL'
      }, 400);
    }

    if (!validateImageUrl(body.insuranceCertUrl)) {
      return c.json({
        success: false,
        message: 'Invalid insurance certificate URL'
      }, 400);
    }

    // Validate insurance expiry date
    if (!validateDateFormat(body.insuranceExpiryDate)) {
      return c.json({
        success: false,
        message: 'Insurance expiry date must be in YYYY-MM-DD format'
      }, 400);
    }

    // Validate optional fields
    if (body.pucCertUrl && !validateImageUrl(body.pucCertUrl)) {
      return c.json({
        success: false,
        message: 'Invalid PUC certificate URL'
      }, 400);
    }

    if (body.pucExpiryDate && !validateDateFormat(body.pucExpiryDate)) {
      return c.json({
        success: false,
        message: 'PUC expiry date must be in YYYY-MM-DD format'
      }, 400);
    }

    if (body.permitImageUrl && !validateImageUrl(body.permitImageUrl)) {
      return c.json({
        success: false,
        message: 'Invalid permit image URL'
      }, 400);
    }

    if (body.permitExpiryDate && !validateDateFormat(body.permitExpiryDate)) {
      return c.json({
        success: false,
        message: 'Permit expiry date must be in YYYY-MM-DD format'
      }, 400);
    }

    if (body.vehicleImageUrls && !validateVehicleImageUrls(body.vehicleImageUrls)) {
      return c.json({
        success: false,
        message: 'Invalid vehicle image URLs. Must be a valid JSON array of image URLs'
      }, 400);
    }

    // Check if registration number already exists
    const existingVehicle = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.registrationNumber, body.registrationNumber))
      .limit(1);

    if (existingVehicle.length > 0) {
      return c.json({
        success: false,
        message: 'Vehicle with this registration number already exists'
      }, 409);
    }

    // Create vehicle
    const result = await db
      .insert(vehicles)
      .values({
        driverId: body.driverId,
        vehicleType: body.vehicleType,
        registrationNumber: body.registrationNumber,
        make: body.make,
        model: body.model,
        year: body.year,
        color: body.color,
        capacity: body.capacity,
        rcImageUrl: body.rcImageUrl,
        insuranceCertUrl: body.insuranceCertUrl,
        insuranceExpiryDate: body.insuranceExpiryDate,
        pucCertUrl: body.pucCertUrl || null,
        pucExpiryDate: body.pucExpiryDate || null,
        permitImageUrl: body.permitImageUrl || null,
        permitExpiryDate: body.permitExpiryDate || null,
        vehicleImageUrls: body.vehicleImageUrls || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    return c.json({
      success: true,
      message: 'Vehicle created successfully',
      data: result[0]
    }, 201);

  } catch (error) {
    console.error('Create vehicle error:', error);

    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return c.json({
        success: false,
        message: 'Vehicle with this registration number already exists'
      }, 409);
    }

    if (error instanceof Error && error.message.includes('FOREIGN KEY constraint failed')) {
      return c.json({
        success: false,
        message: 'Invalid driver ID'
      }, 400);
    }

    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
};

// Get Vehicles with filters and pagination
export const getVehicles = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const query = c.req.query() as GetVehiclesQuery;

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
      .from(vehicles)
      .where(whereCondition);

    const total = totalResult[0].count;

    // Get paginated vehicles with driver info
    const result = await db
      .select({
        id: vehicles.id,
        driverId: vehicles.driverId,
        vehicleType: vehicles.vehicleType,
        registrationNumber: vehicles.registrationNumber,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
        color: vehicles.color,
        capacity: vehicles.capacity,
        rcImageUrl: vehicles.rcImageUrl,
        insuranceCertUrl: vehicles.insuranceCertUrl,
        insuranceExpiryDate: vehicles.insuranceExpiryDate,
        pucCertUrl: vehicles.pucCertUrl,
        pucExpiryDate: vehicles.pucExpiryDate,
        permitImageUrl: vehicles.permitImageUrl,
        permitExpiryDate: vehicles.permitExpiryDate,
        vehicleImageUrls: vehicles.vehicleImageUrls,
        isActive: vehicles.isActive,
        verificationStatus: vehicles.verificationStatus,
        createdAt: vehicles.createdAt,
        updatedAt: vehicles.updatedAt,
        // Driver info
        // driverName: sql`${drivers.firstName} || ' ' || ${drivers.lastName}`,
        // driverEmail: drivers.email,
        // driverPhone: drivers.phoneNumber
      })
      .from(vehicles)
      .leftJoin(drivers, eq(vehicles.driverId, drivers.id))
      .where(whereCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return c.json({
      success: true,
      message: 'Vehicles retrieved successfully',
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
    console.error('Get vehicles error:', error);
    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
};

// Get Vehicle by ID
export const getVehicleById = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const id = parseInt(c.req.param('id'));

    if (isNaN(id)) {
      return c.json({
        success: false,
        message: 'Invalid vehicle ID'
      }, 400);
    }

    const result = await db
      .select({
        id: vehicles.id,
        driverId: vehicles.driverId,
        vehicleType: vehicles.vehicleType,
        registrationNumber: vehicles.registrationNumber,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
        color: vehicles.color,
        capacity: vehicles.capacity,
        rcImageUrl: vehicles.rcImageUrl,
        insuranceCertUrl: vehicles.insuranceCertUrl,
        insuranceExpiryDate: vehicles.insuranceExpiryDate,
        pucCertUrl: vehicles.pucCertUrl,
        pucExpiryDate: vehicles.pucExpiryDate,
        permitImageUrl: vehicles.permitImageUrl,
        permitExpiryDate: vehicles.permitExpiryDate,
        vehicleImageUrls: vehicles.vehicleImageUrls,
        isActive: vehicles.isActive,
        verificationStatus: vehicles.verificationStatus,
        createdAt: vehicles.createdAt,
        updatedAt: vehicles.updatedAt,
        // Driver info
        // driverName: sql`${drivers.firstName} || ' ' || ${drivers.lastName}`,
        // driverEmail: drivers.email,
        // driverPhone: drivers.phoneNumber
      })
      .from(vehicles)
      .leftJoin(drivers, eq(vehicles.driverId, drivers.id))
      .where(eq(vehicles.id, id))
      .limit(1);

    if (result.length === 0) {
      return c.json({
        success: false,
        message: 'Vehicle not found'
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Vehicle retrieved successfully',
      data: result[0]
    });

  } catch (error) {
    console.error('Get vehicle by ID error:', error);
    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
};

// Update Vehicle (PATCH - partial update)
export const updateVehicle = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const id = parseInt(c.req.param('id'));
    const body: UpdateVehicleRequest = await c.req.json();

    if (isNaN(id)) {
      return c.json({
        success: false,
        message: 'Invalid vehicle ID'
      }, 400);
    }

    // Check if vehicle exists
    const existingVehicle = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id))
      .limit(1);

    if (existingVehicle.length === 0) {
      return c.json({
        success: false,
        message: 'Vehicle not found'
      }, 404);
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    // Validate and update fields only if they are provided
    if (body.driverId !== undefined) {
      const driverExists = await db
        .select({ id: drivers.id })
        .from(drivers)
        .where(eq(drivers.id, body.driverId))
        .limit(1);

      if (driverExists.length === 0) {
        return c.json({
          success: false,
          message: 'Driver not found'
        }, 404);
      }
      updateData.driverId = body.driverId;
    }

    if (body.vehicleType !== undefined) {
      const validVehicleTypes = ['auto', 'car', 'bike', 'bus', 'van'];
      if (!validVehicleTypes.includes(body.vehicleType)) {
        return c.json({
          success: false,
          message: 'Invalid vehicle type. Must be one of: auto, car, bike, bus, van'
        }, 400);
      }
      updateData.vehicleType = body.vehicleType;
    }

    if (body.registrationNumber !== undefined) {
      body.registrationNumber = sanitizeInput(body.registrationNumber.toUpperCase());
      if (!validateRegistrationNumber(body.registrationNumber)) {
        return c.json({
          success: false,
          message: 'Invalid registration number format. Expected format: XX00XX0000'
        }, 400);
      }

      // Check if registration number already exists for another vehicle
      const regExists = await db
        .select()
        .from(vehicles)
        .where(and(
          eq(vehicles.registrationNumber, body.registrationNumber),
          sql`${vehicles.id} != ${id}`
        ))
        .limit(1);

      if (regExists.length > 0) {
        return c.json({
          success: false,
          message: 'Vehicle with this registration number already exists'
        }, 409);
      }

      updateData.registrationNumber = body.registrationNumber;
    }

    if (body.make !== undefined) {
      updateData.make = sanitizeInput(body.make);
    }

    if (body.model !== undefined) {
      updateData.model = sanitizeInput(body.model);
    }

    if (body.year !== undefined) {
      if (!validateYear(body.year)) {
        return c.json({
          success: false,
          message: `Invalid year. Must be between 1990 and ${new Date().getFullYear()}`
        }, 400);
      }
      updateData.year = body.year;
    }

    if (body.color !== undefined) {
      updateData.color = sanitizeInput(body.color);
    }

    if (body.capacity !== undefined) {
      const vehicleType = body.vehicleType || existingVehicle[0].vehicleType;
      if (!validateCapacity(body.capacity, vehicleType)) {
        return c.json({
          success: false,
          message: `Invalid capacity for vehicle type ${vehicleType}`
        }, 400);
      }
      updateData.capacity = body.capacity;
    }

    if (body.rcImageUrl !== undefined) {
      if (body.rcImageUrl && !validateImageUrl(body.rcImageUrl)) {
        return c.json({
          success: false,
          message: 'Invalid RC image URL'
        }, 400);
      }
      updateData.rcImageUrl = body.rcImageUrl;
    }

    if (body.insuranceCertUrl !== undefined) {
      if (body.insuranceCertUrl && !validateImageUrl(body.insuranceCertUrl)) {
        return c.json({
          success: false,
          message: 'Invalid insurance certificate URL'
        }, 400);
      }
      updateData.insuranceCertUrl = body.insuranceCertUrl;
    }

    if (body.insuranceExpiryDate !== undefined) {
      if (body.insuranceExpiryDate && !validateDateFormat(body.insuranceExpiryDate)) {
        return c.json({
          success: false,
          message: 'Insurance expiry date must be in YYYY-MM-DD format'
        }, 400);
      }
      updateData.insuranceExpiryDate = body.insuranceExpiryDate;
    }

    if (body.pucCertUrl !== undefined) {
      if (body.pucCertUrl && !validateImageUrl(body.pucCertUrl)) {
        return c.json({
          success: false,
          message: 'Invalid PUC certificate URL'
        }, 400);
      }
      updateData.pucCertUrl = body.pucCertUrl;
    }

    if (body.pucExpiryDate !== undefined) {
      if (body.pucExpiryDate && !validateDateFormat(body.pucExpiryDate)) {
        return c.json({
          success: false,
          message: 'PUC expiry date must be in YYYY-MM-DD format'
        }, 400);
      }
      updateData.pucExpiryDate = body.pucExpiryDate;
    }

    if (body.permitImageUrl !== undefined) {
      if (body.permitImageUrl && !validateImageUrl(body.permitImageUrl)) {
        return c.json({
          success: false,
          message: 'Invalid permit image URL'
        }, 400);
      }
      updateData.permitImageUrl = body.permitImageUrl;
    }

    if (body.permitExpiryDate !== undefined) {
      if (body.permitExpiryDate && !validateDateFormat(body.permitExpiryDate)) {
        return c.json({
          success: false,
          message: 'Permit expiry date must be in YYYY-MM-DD format'
        }, 400);
      }
      updateData.permitExpiryDate = body.permitExpiryDate;
    }

    if (body.vehicleImageUrls !== undefined) {
      if (body.vehicleImageUrls && !validateVehicleImageUrls(body.vehicleImageUrls)) {
        return c.json({
          success: false,
          message: 'Invalid vehicle image URLs. Must be a valid JSON array of image URLs'
        }, 400);
      }
      updateData.vehicleImageUrls = body.vehicleImageUrls;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }

    if (body.verificationStatus !== undefined) {
      const validStatuses = ['pending', 'approved', 'rejected'];
      if (!validStatuses.includes(body.verificationStatus)) {
        return c.json({
          success: false,
          message: 'Invalid verification status. Must be one of: pending, approved, rejected'
        }, 400);
      }
      updateData.verificationStatus = body.verificationStatus;
    }

    // Update vehicle
    const result = await db
      .update(vehicles)
      .set(updateData)
      .where(eq(vehicles.id, id))
      .returning();

    return c.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: result[0]
    });

  } catch (error) {
    console.error('Update vehicle error:', error);

    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return c.json({
        success: false,
        message: 'Vehicle with this registration number already exists'
      }, 409);
    }

    if (error instanceof Error && error.message.includes('FOREIGN KEY constraint failed')) {
      return c.json({
        success: false,
        message: 'Invalid driver ID'
      }, 400);
    }

    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
};

// Delete Vehicle (Soft delete or Hard delete)
export const deleteVehicle = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const id = parseInt(c.req.param('id'));
    const deleteType = c.req.param('deleteType') || 'soft';

    if (isNaN(id)) {
      return c.json({
        success: false,
        message: 'Invalid vehicle ID'
      }, 400);
    }

    // Validate deleteType
    if (!['soft', 'hard'].includes(deleteType)) {
      return c.json({
        success: false,
        message: 'Invalid delete type. It must be either "soft" or "hard"'
      }, 400);
    }

    // Check if vehicle exists
    const existingVehicle = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id))
      .limit(1);

    if (existingVehicle.length === 0) {
      return c.json({
        success: false,
        message: 'Vehicle not found'
      }, 404);
    }

    let result;
    if (deleteType === 'soft') {
      result = await db
        .update(vehicles)
        .set({
          isActive: false,
          updatedAt: new Date().toISOString()
        })
        .where(eq(vehicles.id, id))
        .returning();
    } else {
      result = await db
        .delete(vehicles)
        .where(eq(vehicles.id, id))
        .returning();
    }

    return c.json({
      success: true,
      message: `Vehicle ${deleteType} deleted successfully`,
      data: result[0]
    });

  } catch (error) {
    console.error('Delete vehicle error:', error);
    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.'
    }, 500);
  }
};