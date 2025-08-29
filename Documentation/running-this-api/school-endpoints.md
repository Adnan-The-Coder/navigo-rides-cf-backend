# School API Documentation

## Base URL
```
/school
```

## Table of Contents
1. [Create School](#1-create-school)
2. [Get Schools (List with Filters)](#2-get-schools-list-with-filters)
3. [Get School by ID](#3-get-school-by-id)
4. [Get School by Code](#4-get-school-by-code)
5. [Update School](#5-update-school)
6. [Delete School](#6-delete-school)

---

## 1. Create School

**Endpoint:** `POST /school/create`

**Description:** Creates a new school with comprehensive validation.

### Request Body (JSON)

#### Required Fields:
```json
{
  "name": "Delhi Public School",
  "code": "DPS_001",
  "address": "123 Education Street, Sector 15",
  "latitude": 28.5355,
  "longitude": 77.3910,
  "city": "Gurgaon",
  "state": "Haryana",
  "pincode": "122001",
  "schoolType": "private",
  "startTime": "08:00",
  "endTime": "14:30",
  "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
}
```

#### Complete Example with Optional Fields:
```json
{
  "name": "Delhi Public School International",
  "code": "DPS_INTL_001",
  "address": "123 Education Street, Sector 15, Near Metro Station",
  "latitude": 28.5355,
  "longitude": 77.3910,
  "city": "Gurgaon",
  "state": "Haryana",
  "pincode": "122001",
  "phone": "9876543210",
  "email": "info@dpsintl.edu.in",
  "principalName": "Dr. Rajesh Kumar",
  "schoolType": "private",
  "boardType": "cbse",
  "startTime": "08:00",
  "endTime": "14:30",
  "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
  "holidays": ["2024-01-26", "2024-08-15", "2024-10-02"]
}
```

### Field Validations

| Field | Type | Required | Validation Rules |
|-------|------|----------|------------------|
| `name` | string | Yes | 2-100 characters, alphanumeric + spaces + basic punctuation |
| `code` | string | Yes | 3-20 characters, uppercase letters, numbers, hyphens, underscores, **must be unique** |
| `address` | string | Yes | Any non-empty string |
| `latitude` | number | Yes | -90 to 90 |
| `longitude` | number | Yes | -180 to 180 |
| `city` | string | Yes | Any non-empty string |
| `state` | string | Yes | Any non-empty string |
| `pincode` | string | Yes | 6-digit Indian pincode (cannot start with 0) |
| `phone` | string | No | 10-digit Indian mobile (starts with 6-9) |
| `email` | string | No | Valid email format |
| `principalName` | string | No | Any string |
| `schoolType` | string | Yes | `government`, `private`, `aided`, `international`, `boarding` |
| `boardType` | string | No | `cbse`, `icse`, `state`, `igcse`, `ib`, `other` |
| `startTime` | string | Yes | HH:MM format (24-hour) |
| `endTime` | string | Yes | HH:MM format (24-hour) |
| `workingDays` | array | Yes | Array of valid days: `monday`, `tuesday`, etc. (lowercase) |
| `holidays` | array | No | Array of date strings in YYYY-MM-DD format |

### Success Response (201)
```json
{
  "success": true,
  "message": "School created successfully",
  "data": {
    "id": 1,
    "name": "Delhi Public School International",
    "code": "DPS_INTL_001",
    "address": "123 Education Street, Sector 15, Near Metro Station",
    "latitude": 28.5355,
    "longitude": 77.3910,
    "city": "Gurgaon",
    "state": "Haryana",
    "pincode": "122001",
    "phone": "9876543210",
    "email": "info@dpsintl.edu.in",
    "principalName": "Dr. Rajesh Kumar",
    "schoolType": "private",
    "boardType": "cbse",
    "startTime": "08:00",
    "endTime": "14:30",
    "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    "holidays": ["2024-01-26", "2024-08-15", "2024-10-02"],
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

#### Missing Required Field (400)
```json
{
  "success": false,
  "message": "name is required"
}
```

#### Invalid School Name (400)
```json
{
  "success": false,
  "message": "School name must be 2-100 characters and contain only letters, numbers, spaces, and basic punctuation"
}
```

#### Invalid School Code (400)
```json
{
  "success": false,
  "message": "School code must be 3-20 characters and contain only uppercase letters, numbers, hyphens, and underscores"
}
```

#### Invalid Pincode (400)
```json
{
  "success": false,
  "message": "Please provide a valid 6-digit Indian pincode"
}
```

#### Invalid Coordinates (400)
```json
{
  "success": false,
  "message": "Please provide valid latitude (-90 to 90) and longitude (-180 to 180) coordinates"
}
```

#### Invalid Time Format (400)
```json
{
  "success": false,
  "message": "Please provide valid time in HH:MM format for start and end times"
}
```

#### Invalid Working Days (400)
```json
{
  "success": false,
  "message": "Please provide valid working days (monday, tuesday, wednesday, thursday, friday, saturday, sunday)"
}
```

#### Invalid Email (400)
```json
{
  "success": false,
  "message": "Please provide a valid email address"
}
```

#### Invalid Phone (400)
```json
{
  "success": false,
  "message": "Please provide a valid Indian mobile number (10 digits starting with 6-9)"
}
```

#### Invalid School Type (400)
```json
{
  "success": false,
  "message": "Invalid school type. Must be one of: government, private, aided, international, boarding"
}
```

#### Invalid Board Type (400)
```json
{
  "success": false,
  "message": "Invalid board type. Must be one of: cbse, icse, state, igcse, ib, other"
}
```

#### Duplicate School Code (409)
```json
{
  "success": false,
  "message": "School code already exists"
}
```

#### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error. Please try again later."
}
```

---

## 2. Get Schools (List with Filters)

**Endpoint:** `GET /school/get-filtered`

**Description:** Retrieve schools with optional filtering, search, pagination, and sorting.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 10 | Number of schools per page (max 100) |
| `schoolType` | string | - | Filter by school type |
| `boardType` | string | - | Filter by board type |
| `isActive` | boolean | - | Filter by active status |
| `search` | string | - | Search in name, code, city, principal name, email |
| `sortBy` | string | createdAt | Sort field: `createdAt`, `updatedAt`, `name`, `code`, `city`, `state` |
| `sortOrder` | string | desc | Sort order: `asc` or `desc` |
| `city` | string | - | Filter by city (partial match) |
| `state` | string | - | Filter by state (partial match) |
| `createdAfter` | string | - | Filter schools created after date (YYYY-MM-DD) |
| `createdBefore` | string | - | Filter schools created before date (YYYY-MM-DD) |

### Example Requests

#### Basic Request
```
GET /school/get-filtered
```

#### With Pagination
```
GET /school/get-filtered?page=2&limit=20
```

#### With Filters
```
GET /school/get-filtered?schoolType=private&boardType=cbse&city=Delhi&isActive=true
```

#### With Search
```
GET /school/get-filtered?search=delhi%20public&sortBy=name&sortOrder=asc
```

#### Complex Query
```
GET /school/get-filtered?schoolType=private&city=gurgaon&createdAfter=2024-01-01&sortBy=name&sortOrder=asc&page=1&limit=25
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Schools retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Delhi Public School",
      "code": "DPS_001",
      "address": "123 Education Street, Sector 15",
      "latitude": 28.5355,
      "longitude": 77.3910,
      "city": "Gurgaon",
      "state": "Haryana",
      "pincode": "122001",
      "phone": "9876543210",
      "email": "info@dps.edu.in",
      "principalName": "Dr. Rajesh Kumar",
      "schoolType": "private",
      "boardType": "cbse",
      "startTime": "08:00",
      "endTime": "14:30",
      "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
      "holidays": ["2024-01-26", "2024-08-15"],
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### Empty Result (200)
```json
{
  "success": true,
  "message": "Schools retrieved successfully",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### Error Response (500)
```json
{
  "success": false,
  "message": "Internal server error. Please try again later."
}
```

---

## 3. Get School by ID

**Endpoint:** `GET /school/get/:id`

**Description:** Retrieve a specific school by its ID.

### Path Parameters
- `id` (required): School ID (integer)

### Example Request
```
GET /school/get/1
```

### Success Response (200)
```json
{
  "success": true,
  "message": "School retrieved successfully",
  "data": {
    "id": 1,
    "name": "Delhi Public School",
    "code": "DPS_001",
    "address": "123 Education Street, Sector 15",
    "latitude": 28.5355,
    "longitude": 77.3910,
    "city": "Gurgaon",
    "state": "Haryana",
    "pincode": "122001",
    "phone": "9876543210",
    "email": "info@dps.edu.in",
    "principalName": "Dr. Rajesh Kumar",
    "schoolType": "private",
    "boardType": "cbse",
    "startTime": "08:00",
    "endTime": "14:30",
    "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    "holidays": ["2024-01-26", "2024-08-15"],
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

#### Invalid ID (400)
```json
{
  "success": false,
  "message": "Valid school ID is required"
}
```

#### School Not Found (404)
```json
{
  "success": false,
  "message": "School not found"
}
```

#### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error. Please try again later."
}
```

---

## 4. Get School by Code

**Endpoint:** `GET /school/get/:code`

**Description:** Retrieve a specific school by its unique code.

### Path Parameters
- `code` (required): School code (string, case-insensitive)

### Example Request
```
GET school/get/DPS_001
```

### Success Response (200)
```json
{
  "success": true,
  "message": "School retrieved successfully",
  "data": {
    "id": 1,
    "name": "Delhi Public School",
    "code": "DPS_001",
    "address": "123 Education Street, Sector 15",
    "latitude": 28.5355,
    "longitude": 77.3910,
    "city": "Gurgaon",
    "state": "Haryana",
    "pincode": "122001",
    "phone": "9876543210",
    "email": "info@dps.edu.in",
    "principalName": "Dr. Rajesh Kumar",
    "schoolType": "private",
    "boardType": "cbse",
    "startTime": "08:00",
    "endTime": "14:30",
    "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    "holidays": ["2024-01-26", "2024-08-15"],
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

#### Missing Code (400)
```json
{
  "success": false,
  "message": "School code is required"
}
```

#### School Not Found (404)
```json
{
  "success": false,
  "message": "School not found"
}
```

#### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error. Please try again later."
}
```

---

## 5. Update School

**Endpoint:** `PATCH /school/update/:id`

**Description:** Update a school's information. This is a partial update - only provide the fields you want to change.

### Path Parameters
- `id` (required): School ID (integer)

### Request Body Examples

#### Update Basic Info
```json
{
  "name": "Delhi Public School - Updated",
  "principalName": "Dr. Priya Sharma",
  "phone": "9876543211"
}
```

#### Update School Type and Board
```json
{
  "schoolType": "international",
  "boardType": "ib",
  "email": "info@dpsinternational.edu.in"
}
```

#### Update Location
```json
{
  "address": "456 New Education Hub, Sector 20",
  "city": "Noida",
  "state": "Uttar Pradesh",
  "pincode": "201301",
  "latitude": 28.5672,
  "longitude": 77.3240
}
```

#### Update Schedule
```json
{
  "startTime": "08:30",
  "endTime": "15:00",
  "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "holidays": ["2024-01-26", "2024-08-15", "2024-10-02", "2024-12-25"]
}
```

#### Deactivate School
```json
{
  "isActive": false
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "School updated successfully",
  "data": {
    "id": 1,
    "name": "Delhi Public School - Updated",
    "code": "DPS_001",
    "address": "123 Education Street, Sector 15",
    "latitude": 28.5355,
    "longitude": 77.3910,
    "city": "Gurgaon",
    "state": "Haryana",
    "pincode": "122001",
    "phone": "9876543211",
    "email": "info@dps.edu.in",
    "principalName": "Dr. Priya Sharma",
    "schoolType": "private",
    "boardType": "cbse",
    "startTime": "08:00",
    "endTime": "14:30",
    "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    "holidays": ["2024-01-26", "2024-08-15"],
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T14:45:00.000Z"
  }
}
```

### Error Responses

#### Invalid ID (400)
```json
{
  "success": false,
  "message": "Valid school ID is required"
}
```

#### School Not Found (404)
```json
{
  "success": false,
  "message": "School not found"
}
```

#### Invalid School Name (400)
```json
{
  "success": false,
  "message": "School name must be 2-100 characters and contain only letters, numbers, spaces, and basic punctuation"
}
```

#### Invalid School Code (400)
```json
{
  "success": false,
  "message": "School code must be 3-20 characters and contain only uppercase letters, numbers, hyphens, and underscores"
}
```

#### Duplicate Code (409)
```json
{
  "success": false,
  "message": "School code already exists"
}
```

#### Invalid Coordinates (400)
```json
{
  "success": false,
  "message": "Please provide valid latitude (-90 to 90) and longitude (-180 to 180) coordinates"
}
```

#### Invalid Pincode (400)
```json
{
  "success": false,
  "message": "Please provide a valid 6-digit Indian pincode"
}
```

#### Invalid Phone (400)
```json
{
  "success": false,
  "message": "Please provide a valid Indian mobile number (10 digits starting with 6-9)"
}
```

#### Invalid Email (400)
```json
{
  "success": false,
  "message": "Please provide a valid email address"
}
```

#### Invalid School Type (400)
```json
{
  "success": false,
  "message": "Invalid school type. Must be one of: government, private, aided, international, boarding"
}
```

#### Invalid Board Type (400)
```json
{
  "success": false,
  "message": "Invalid board type. Must be one of: cbse, icse, state, igcse, ib, other"
}
```

#### Invalid Time (400)
```json
{
  "success": false,
  "message": "Please provide valid start time in HH:MM format"
}
```

#### Invalid Working Days (400)
```json
{
  "success": false,
  "message": "Please provide valid working days (monday, tuesday, wednesday, thursday, friday, saturday, sunday)"
}
```

#### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error. Please try again later."
}
```

---

## 6. Delete School

**Endpoint:** `DELETE school/delete/:id/:deleteType?`

**Description:** Delete a school either soft delete (deactivate) or hard delete (permanent removal).

### Path Parameters
- `id` (required): School ID (integer)
- `deleteType` (optional): `soft` or `hard` (default: `soft`)

### Example Requests

#### Soft Delete (Default)
```
DELETE school/delete/:id.
```
or
```
DELETE school/delete/:id/soft
```

#### Hard Delete (Permanent)
```
DELETE school/delete/1/hard
```

### Success Response (200)

#### Soft Delete Response
```json
{
  "success": true,
  "message": "School soft deleted successfully",
  "data": {
    "id": 1,
    "name": "Delhi Public School",
    "code": "DPS_001",
    "address": "123 Education Street, Sector 15",
    "latitude": 28.5355,
    "longitude": 77.3910,
    "city": "Gurgaon",
    "state": "Haryana",
    "pincode": "122001",
    "phone": "9876543210",
    "email": "info@dps.edu.in",
    "principalName": "Dr. Rajesh Kumar",
    "schoolType": "private",
    "boardType": "cbse",
    "startTime": "08:00",
    "endTime": "14:30",
    "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    "holidays": ["2024-01-26", "2024-08-15"],
    "isActive": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T16:20:00.000Z"
  }
}
```

#### Hard Delete Response
```json
{
  "success": true,
  "message": "School hard deleted successfully",
  "data": {
    "id": 1,
    "name": "Delhi Public School",
    "code": "DPS_001",
    "address": "123 Education Street, Sector 15",
    "latitude": 28.5355,
    "longitude": 77.3910,
    "city": "Gurgaon",
    "state": "Haryana",
    "pincode": "122001",
    "phone": "9876543210",
    "email": "info@dps.edu.in",
    "principalName": "Dr. Rajesh Kumar",
    "schoolType": "private",
    "boardType": "cbse",
    "startTime": "08:00",
    "endTime": "14:30",
    "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    "holidays": ["2024-01-26", "2024-08-15"],
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

#### Invalid ID (400)
```json
{
  "success": false,
  "message": "Valid school ID is required"
}
```

#### Invalid Delete Type (400)
```json
{
  "success": false,
  "message": "Invalid delete type. It must be either \"soft\" or \"hard\""
}
```

#### School Not Found (404)
```json
{
  "success": false,
  "message": "School not found"
}
```

#### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error. Please try again later."
}
```

---

## General Notes

### Data Types and Formats

1. **Dates**: All dates are in ISO 8601 format (`YYYY-MM-DDTHH:mm:ss.sssZ`)
2. **Time**: School start/end times are in 24-hour format (`HH:MM`)
3. **Coordinates**: Decimal degrees (latitude: -90 to 90, longitude: -180 to 180)
4. **Phone**: Indian mobile numbers (10 digits starting with 6, 7, 8, or 9)
5. **Pincode**: 6-digit Indian postal codes (cannot start with 0)
6. **Working Days**: Lowercase day names in English
7. **Holidays**: Array of date strings in `YYYY-MM-DD` format

### Input Sanitization

All string inputs are automatically:
- Trimmed of leading/trailing whitespace
- Multiple consecutive spaces reduced to single spaces
- School codes converted to uppercase

### Pagination Limits

- Minimum page: 1
- Minimum limit: 1
- Maximum limit: 100
- Default limit: 10

### Performance Tips

1. Use specific filters to reduce result sets
2. Implement client-side caching for frequently accessed schools
3. Use pagination for large datasets
4. Index on frequently searched fields (code, city, schoolType)

### Security Considerations

1. Validate all inputs on client side before sending
2. Implement rate limiting for API endpoints
3. Use HTTPS for all API communications
4. Sanitize user inputs to prevent injection attacks