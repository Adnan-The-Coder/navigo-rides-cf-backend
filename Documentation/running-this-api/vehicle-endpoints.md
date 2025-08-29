# Vehicle API Documentation

Base URL: `/vehicle`

## Table of Contents
1. [Create Vehicle](#1-create-vehicle)
2. [Get All Vehicles](#2-get-all-vehicles)
3. [Get Vehicle by ID](#3-get-vehicle-by-id)
4. [Update Vehicle](#4-update-vehicle)
5. [Delete Vehicle](#5-delete-vehicle)

---

## 1. Create Vehicle

**Endpoint:** `POST /vehicle/create`

**Description:** Creates a new vehicle for a driver with complete validation.

### Request Body

```json
{
  "driverId": 1,
  "vehicleType": "car",
  "registrationNumber": "KA01AB1234",
  "make": "Toyota",
  "model": "Innova",
  "year": 2020,
  "color": "White",
  "capacity": 7,
  "rcImageUrl": "https://example.com/rc-image.jpg",
  "insuranceCertUrl": "https://example.com/insurance.jpg",
  "insuranceExpiryDate": "2025-12-31",
  "pucCertUrl": "https://example.com/puc.jpg",
  "pucExpiryDate": "2024-06-30",
  "permitImageUrl": "https://example.com/permit.jpg",
  "permitExpiryDate": "2025-03-15",
  "vehicleImageUrls": "[\"https://example.com/vehicle1.jpg\", \"https://example.com/vehicle2.jpg\"]"
}
```

### Required Fields
- `driverId` (number): Valid driver ID
- `vehicleType` (string): One of: "auto", "car", "bike", "bus", "van"
- `registrationNumber` (string): Indian vehicle registration format
- `make` (string): Vehicle manufacturer
- `model` (string): Vehicle model
- `year` (number): Manufacturing year (1990 - current year)
- `color` (string): Vehicle color
- `capacity` (number): Seating capacity
- `rcImageUrl` (string): Valid image URL for RC
- `insuranceCertUrl` (string): Valid image URL for insurance certificate
- `insuranceExpiryDate` (string): Date in YYYY-MM-DD format

### Optional Fields
- `pucCertUrl` (string): PUC certificate image URL
- `pucExpiryDate` (string): PUC expiry date (YYYY-MM-DD)
- `permitImageUrl` (string): Permit image URL
- `permitExpiryDate` (string): Permit expiry date (YYYY-MM-DD)
- `vehicleImageUrls` (string): JSON array of vehicle image URLs

### Success Response (201)

```json
{
  "success": true,
  "message": "Vehicle created successfully",
  "data": {
    "id": 1,
    "driverId": 1,
    "vehicleType": "car",
    "registrationNumber": "KA01AB1234",
    "make": "Toyota",
    "model": "Innova",
    "year": 2020,
    "color": "White",
    "capacity": 7,
    "rcImageUrl": "https://example.com/rc-image.jpg",
    "insuranceCertUrl": "https://example.com/insurance.jpg",
    "insuranceExpiryDate": "2025-12-31",
    "pucCertUrl": "https://example.com/puc.jpg",
    "pucExpiryDate": "2024-06-30",
    "permitImageUrl": "https://example.com/permit.jpg",
    "permitExpiryDate": "2025-03-15",
    "vehicleImageUrls": "[\"https://example.com/vehicle1.jpg\", \"https://example.com/vehicle2.jpg\"]",
    "isActive": true,
    "verificationStatus": "pending",
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
  "message": "driverId is required"
}
```

#### Driver Not Found (404)
```json
{
  "success": false,
  "message": "Driver not found"
}
```

#### Invalid Vehicle Type (400)
```json
{
  "success": false,
  "message": "Invalid vehicle type. Must be one of: auto, car, bike, bus, van"
}
```

#### Invalid Registration Number (400)
```json
{
  "success": false,
  "message": "Invalid registration number format. Expected format: XX00XX0000"
}
```

#### Invalid Year (400)
```json
{
  "success": false,
  "message": "Invalid year. Must be between 1990 and 2024"
}
```

#### Invalid Capacity (400)
```json
{
  "success": false,
  "message": "Invalid capacity for vehicle type car"
}
```

#### Invalid Image URL (400)
```json
{
  "success": false,
  "message": "Invalid RC image URL"
}
```

#### Invalid Date Format (400)
```json
{
  "success": false,
  "message": "Insurance expiry date must be in YYYY-MM-DD format"
}
```

#### Registration Number Already Exists (409)
```json
{
  "success": false,
  "message": "Vehicle with this registration number already exists"
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

## 2. Get All Vehicles

**Endpoint:** `GET /vehicle/get-all`

**Description:** Retrieves all vehicles with filtering, pagination, sorting, and search capabilities.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 10 | Number of records per page (max 100) |
| `vehicleType` | string | - | Filter by vehicle type |
| `verificationStatus` | string | - | Filter by verification status |
| `isActive` | boolean | - | Filter by active status |
| `search` | string | - | Search in registration, make, model, color |
| `sortBy` | string | createdAt | Sort field |
| `sortOrder` | string | desc | Sort order (asc/desc) |
| `driverId` | number | - | Filter by driver ID |
| `make` | string | - | Filter by vehicle make |
| `model` | string | - | Filter by vehicle model |
| `yearFrom` | number | - | Filter vehicles from this year |
| `yearTo` | number | - | Filter vehicles up to this year |
| `createdAfter` | string | - | Filter vehicles created after date |
| `createdBefore` | string | - | Filter vehicles created before date |

### Example Requests

**Basic Request:**
```
GET /vehicle/get-all
```

**With Pagination:**
```
GET /vehicle/get-all?page=2&limit=20
```

**With Filters:**
```
GET /vehicle/get-all?vehicleType=car&verificationStatus=approved&isActive=true
```

**With Search:**
```
GET /vehicle/get-all?search=toyota&sortBy=year&sortOrder=desc
```

**Complex Query:**
```
GET /vehicle/get-all?vehicleType=car&make=toyota&yearFrom=2018&yearTo=2022&page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Vehicles retrieved successfully",
  "data": [
    {
      "id": 1,
      "driverId": 1,
      "vehicleType": "car",
      "registrationNumber": "KA01AB1234",
      "make": "Toyota",
      "model": "Innova",
      "year": 2020,
      "color": "White",
      "capacity": 7,
      "rcImageUrl": "https://example.com/rc-image.jpg",
      "insuranceCertUrl": "https://example.com/insurance.jpg",
      "insuranceExpiryDate": "2025-12-31",
      "pucCertUrl": "https://example.com/puc.jpg",
      "pucExpiryDate": "2024-06-30",
      "permitImageUrl": "https://example.com/permit.jpg",
      "permitExpiryDate": "2025-03-15",
      "vehicleImageUrls": "[\"https://example.com/vehicle1.jpg\"]",
      "isActive": true,
      "verificationStatus": "approved",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "driverName": "John Doe",
      "driverEmail": "john@example.com",
      "driverPhone": "+91-9876543210"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
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

## 3. Get Vehicle by ID

**Endpoint:** `GET /vehicle/get/:id`

**Description:** Retrieves a specific vehicle by its ID with driver information.

### Path Parameters
- `id` (number): Vehicle ID

### Example Request
```
GET /vehicle/get/1
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Vehicle retrieved successfully",
  "data": {
    "id": 1,
    "driverId": 1,
    "vehicleType": "car",
    "registrationNumber": "KA01AB1234",
    "make": "Toyota",
    "model": "Innova",
    "year": 2020,
    "color": "White",
    "capacity": 7,
    "rcImageUrl": "https://example.com/rc-image.jpg",
    "insuranceCertUrl": "https://example.com/insurance.jpg",
    "insuranceExpiryDate": "2025-12-31",
    "pucCertUrl": "https://example.com/puc.jpg",
    "pucExpiryDate": "2024-06-30",
    "permitImageUrl": "https://example.com/permit.jpg",
    "permitExpiryDate": "2025-03-15",
    "vehicleImageUrls": "[\"https://example.com/vehicle1.jpg\"]",
    "isActive": true,
    "verificationStatus": "approved",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "driverName": "John Doe",
    "driverEmail": "john@example.com",
    "driverPhone": "+91-9876543210"
  }
}
```

### Error Responses

#### Invalid Vehicle ID (400)
```json
{
  "success": false,
  "message": "Invalid vehicle ID"
}
```

#### Vehicle Not Found (404)
```json
{
  "success": false,
  "message": "Vehicle not found"
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

## 4. Update Vehicle

**Endpoint:** `PATCH /vehicle/update/:id`

**Description:** Updates vehicle information. All fields are optional for partial updates.

### Path Parameters
- `id` (number): Vehicle ID

### Request Body (All fields optional)

```json
{
  "driverId": 2,
  "vehicleType": "van",
  "registrationNumber": "KA02CD5678",
  "make": "Mahindra",
  "model": "Bolero",
  "year": 2021,
  "color": "Black",
  "capacity": 8,
  "rcImageUrl": "https://example.com/new-rc.jpg",
  "insuranceCertUrl": "https://example.com/new-insurance.jpg",
  "insuranceExpiryDate": "2026-01-31",
  "pucCertUrl": "https://example.com/new-puc.jpg",
  "pucExpiryDate": "2024-12-31",
  "permitImageUrl": "https://example.com/new-permit.jpg",
  "permitExpiryDate": "2025-06-30",
  "vehicleImageUrls": "[\"https://example.com/new-vehicle1.jpg\"]",
  "isActive": true,
  "verificationStatus": "approved"
}
```

### Example Requests

**Update only verification status:**
```json
{
  "verificationStatus": "approved"
}
```

**Update vehicle details:**
```json
{
  "make": "Honda",
  "model": "City",
  "color": "Silver",
  "year": 2022
}
```

**Deactivate vehicle:**
```json
{
  "isActive": false
}
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Vehicle updated successfully",
  "data": {
    "id": 1,
    "driverId": 2,
    "vehicleType": "van",
    "registrationNumber": "KA02CD5678",
    "make": "Mahindra",
    "model": "Bolero",
    "year": 2021,
    "color": "Black",
    "capacity": 8,
    "rcImageUrl": "https://example.com/new-rc.jpg",
    "insuranceCertUrl": "https://example.com/new-insurance.jpg",
    "insuranceExpiryDate": "2026-01-31",
    "pucCertUrl": "https://example.com/new-puc.jpg",
    "pucExpiryDate": "2024-12-31",
    "permitImageUrl": "https://example.com/new-permit.jpg",
    "permitExpiryDate": "2025-06-30",
    "vehicleImageUrls": "[\"https://example.com/new-vehicle1.jpg\"]",
    "isActive": true,
    "verificationStatus": "approved",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:45:00.000Z"
  }
}
```

### Error Responses

#### Invalid Vehicle ID (400)
```json
{
  "success": false,
  "message": "Invalid vehicle ID"
}
```

#### Vehicle Not Found (404)
```json
{
  "success": false,
  "message": "Vehicle not found"
}
```

#### Driver Not Found (404)
```json
{
  "success": false,
  "message": "Driver not found"
}
```

#### Invalid Vehicle Type (400)
```json
{
  "success": false,
  "message": "Invalid vehicle type. Must be one of: auto, car, bike, bus, van"
}
```

#### Invalid Registration Format (400)
```json
{
  "success": false,
  "message": "Invalid registration number format. Expected format: XX00XX0000"
}
```

#### Registration Already Exists (409)
```json
{
  "success": false,
  "message": "Vehicle with this registration number already exists"
}
```

#### Invalid Year (400)
```json
{
  "success": false,
  "message": "Invalid year. Must be between 1990 and 2024"
}
```

#### Invalid Capacity (400)
```json
{
  "success": false,
  "message": "Invalid capacity for vehicle type van"
}
```

#### Invalid Image URL (400)
```json
{
  "success": false,
  "message": "Invalid RC image URL"
}
```

#### Invalid Date Format (400)
```json
{
  "success": false,
  "message": "Insurance expiry date must be in YYYY-MM-DD format"
}
```

#### Invalid Verification Status (400)
```json
{
  "success": false,
  "message": "Invalid verification status. Must be one of: pending, approved, rejected"
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

## 5. Delete Vehicle

**Endpoint:** `DELETE /vehicle/delete/:id/:deleteType`

**Description:** Deletes a vehicle either by soft delete (deactivation) or hard delete (permanent removal).

### Path Parameters
- `id` (number): Vehicle ID
- `deleteType` (string): Either "soft" or "hard"

### Example Requests

**Soft Delete (Deactivate):**
```
DELETE /vehicle/delete/1/soft
```

**Hard Delete (Permanent):**
```
DELETE /vehicle/delete/1/hard
```

### Success Responses

#### Soft Delete Success (200)
```json
{
  "success": true,
  "message": "Vehicle soft deleted successfully",
  "data": {
    "id": 1,
    "driverId": 1,
    "vehicleType": "car",
    "registrationNumber": "KA01AB1234",
    "make": "Toyota",
    "model": "Innova",
    "year": 2020,
    "color": "White",
    "capacity": 7,
    "rcImageUrl": "https://example.com/rc-image.jpg",
    "insuranceCertUrl": "https://example.com/insurance.jpg",
    "insuranceExpiryDate": "2025-12-31",
    "pucCertUrl": "https://example.com/puc.jpg",
    "pucExpiryDate": "2024-06-30",
    "permitImageUrl": "https://example.com/permit.jpg",
    "permitExpiryDate": "2025-03-15",
    "vehicleImageUrls": "[\"https://example.com/vehicle1.jpg\"]",
    "isActive": false,
    "verificationStatus": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

#### Hard Delete Success (200)
```json
{
  "success": true,
  "message": "Vehicle hard deleted successfully",
  "data": {
    "id": 1,
    "driverId": 1,
    "vehicleType": "car",
    "registrationNumber": "KA01AB1234",
    "make": "Toyota",
    "model": "Innova",
    "year": 2020,
    "color": "White",
    "capacity": 7,
    "rcImageUrl": "https://example.com/rc-image.jpg",
    "insuranceCertUrl": "https://example.com/insurance.jpg",
    "insuranceExpiryDate": "2025-12-31",
    "pucCertUrl": "https://example.com/puc.jpg",
    "pucExpiryDate": "2024-06-30",
    "permitImageUrl": "https://example.com/permit.jpg",
    "permitExpiryDate": "2025-03-15",
    "vehicleImageUrls": "[\"https://example.com/vehicle1.jpg\"]",
    "isActive": true,
    "verificationStatus": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

#### Invalid Vehicle ID (400)
```json
{
  "success": false,
  "message": "Invalid vehicle ID"
}
```

#### Invalid Delete Type (400)
```json
{
  "success": false,
  "message": "Invalid delete type. It must be either \"soft\" or \"hard\""
}
```

#### Vehicle Not Found (404)
```json
{
  "success": false,
  "message": "Vehicle not found"
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

## Capacity Validation Rules

| Vehicle Type | Min Capacity | Max Capacity |
|-------------|-------------|-------------|
| bike | 1 | 2 |
| auto | 2 | 6 |
| car | 4 | 8 |
| van | 6 | 15 |
| bus | 10 | 60 |

## Registration Number Format

Indian vehicle registration format: **XX00XX0000**
- First 2 characters: State code (letters)
- Next 1-2 digits: District code
- Next 1-2 characters: Series code (letters)
- Last 1-4 digits: Vehicle number

Examples: `KA01AB1234`, `MH12CD5678`, `DL8CA1234`

## Date Format

All date fields must be in **YYYY-MM-DD** format.
Examples: `2024-12-31`, `2025-06-15`

## Image URL Validation

Image URLs must be valid HTTP/HTTPS URLs pointing to image files.
Supported formats: jpg, jpeg, png, gif, webp

## Vehicle Image URLs Format

The `vehicleImageUrls` field should be a JSON string containing an array of image URLs:
```json
"[\"https://example.com/image1.jpg\", \"https://example.com/image2.jpg\"]"
```