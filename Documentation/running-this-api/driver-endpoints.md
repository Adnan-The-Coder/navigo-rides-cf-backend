# Driver Management API Documentation

## Base URL
`http://127.0.0.1:8787/driver`

---

## 📋 Table of Contents
1. [Create Driver](#1-create-driver)
2. [Get All Drivers](#2-get-all-drivers)
3. [Update Driver](#3-update-driver)
4. [Get Driver by UUID](#4-get-driver-by-uuid)
5. [Delete Driver](#5-delete-driver)
6. [Error Codes Reference](#6-error-codes-reference)

---

## 1. Create Driver

### **Endpoint:** `POST /driver/create`

Creates a new driver profile for an existing user.

### **Request Body (Required Fields):**
```json
{
  "user_uuid": "172a2d91-9073-4fd1-91ac-3c35bf13905e",
  "licenseNumber": "MH12AB1234",
  "licenseExpiryDate": "2030-12-31",
  "licenseImageUrl": "https://example.com/license.jpg",
  "aadharNumber": "123412341234",
  "aadharImageUrl": "https://example.com/aadhar.jpg",
  "emergencyContactName": "John Doe",
  "emergencyContactPhone": "9876543210"
}
```

### **Optional Fields:**
```json
{
  "panNumber": "ABCDE1234F",
  "panImageUrl": "https://example.com/pan.jpg",
  "policeVerificationCertUrl": "https://example.com/police-cert.jpg",
  "bankAccountNumber": "123456789012",
  "bankIfscCode": "SBIN0001234",
  "bankAccountHolderName": "John Doe",
  "upiId": "john@paytm"
}
```

### **Success Response (201):**
```json
{
  "success": true,
  "message": "Driver profile created successfully",
  "data": {
    "id": 1,
    "user_uuid": "172a2d91-9073-4fd1-91ac-3c35bf13905e",
    "licenseNumber": "MH12AB1234",
    "status": "pending",
    "backgroundCheckStatus": "pending",
    "createdAt": "2025-08-29T10:30:00Z",
    "updatedAt": "2025-08-29T10:30:00Z"
    // ... other fields
  }
}
```

### **Error Responses:**

#### Missing Required Fields (400):
```json
{
  "success": false,
  "message": "user_uuid is required"
}
```

#### Invalid License Number (400):
```json
{
  "success": false,
  "message": "Invalid license number format"
}
```

#### Invalid Date Format (400):
```json
{
  "success": false,
  "message": "License expiry date must be in YYYY-MM-DD format"
}
```

#### License Expired (400):
```json
{
  "success": false,
  "message": "License expiry date must be in the future"
}
```

#### Invalid Aadhar (400):
```json
{
  "success": false,
  "message": "Aadhar number must be 12 digits"
}
```

#### Invalid Phone Number (400):
```json
{
  "success": false,
  "message": "Invalid emergency contact phone number"
}
```

#### User Not Found (404):
```json
{
  "success": false,
  "message": "User not found"
}
```

#### Driver Already Exists (409):
```json
{
  "success": false,
  "message": "Driver profile already exists for this user"
}
```

#### Duplicate Unique Fields (409):
```json
{
  "success": false,
  "message": "License number already exists"
}
```

---

## 2. Get All Drivers

### **Endpoint:** `GET /driver/get-all`

Retrieves all drivers with pagination, filtering, and sorting options.

### **Query Parameters (All Optional):**
```
/driver/get-all?page=1&limit=10&status=approved&search=MH12&sortBy=createdAt&sortOrder=desc
```

| Parameter | Type | Description | Default | Example |
|-----------|------|-------------|---------|---------|
| `page` | number | Page number | 1 | `?page=2` |
| `limit` | number | Items per page (max 100) | 10 | `?limit=25` |
| `status` | string | Driver status | - | `?status=approved` |
| `backgroundCheckStatus` | string | Background check status | - | `?backgroundCheckStatus=pending` |
| `search` | string | Search term | - | `?search=MH12` |
| `sortBy` | string | Sort field | createdAt | `?sortBy=rating` |
| `sortOrder` | string | Sort order (asc/desc) | desc | `?sortOrder=asc` |
| `isOnline` | boolean | Online status | - | `?isOnline=true` |
| `rating` | number | Minimum rating | - | `?rating=4.5` |
| `totalRidesFrom` | number | Minimum total rides | - | `?totalRidesFrom=50` |
| `totalRidesTo` | number | Maximum total rides | - | `?totalRidesTo=200` |
| `totalEarningsFrom` | number | Minimum earnings | - | `?totalEarningsFrom=10000` |
| `totalEarningsTo` | number | Maximum earnings | - | `?totalEarningsTo=50000` |
| `createdAfter` | date | Created after date | - | `?createdAfter=2024-01-01` |
| `createdBefore` | date | Created before date | - | `?createdBefore=2024-12-31` |

### **Valid Sort Fields:**
- `createdAt`
- `updatedAt`
- `rating`
- `totalRides`
- `totalEarnings`
- `licenseNumber`

### **Valid Status Values:**
- `pending`
- `under_review`
- `approved`
- `rejected`
- `suspended`
- `inactive`

### **Valid Background Check Status Values:**
- `pending`
- `in_progress`
- `approved`
- `rejected`

### **Success Response (200):**
```json
{
  "success": true,
  "message": "Drivers retrieved successfully",
  "data": [
    {
      "id": 1,
      "user_uuid": "172a2d91-9073-4fd1-91ac-3c35bf13905e",
      "licenseNumber": "MH12AB1234",
      "status": "approved",
      "rating": 4.8,
      "totalRides": 125,
      "totalEarnings": 45000.50,
      "isOnline": true,
      "createdAt": "2025-08-29T10:30:00Z"
      // ... other fields
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### **Example Queries:**

#### Get approved drivers with high ratings:
```
GET /driver/get-all?status=approved&rating=4.0&sortBy=rating&sortOrder=desc
```

#### Search for specific license numbers:
```
GET /driver/get-all?search=MH12&limit=5
```

#### Get drivers created this month:
```
GET /driver/get-all?createdAfter=2025-08-01&createdBefore=2025-08-31
```

---

## 3. Update Driver

### **Endpoint:** `PATCH /driver/update/:uuid`

Updates an existing driver's information. All fields are optional.

### **URL Parameter:**
- `:uuid` - The user's UUID (not the driver ID)

### **Example Request:**
```
PATCH /driver/update/172a2d91-9073-4fd1-91ac-3c35bf13905e
```

### **Request Body Examples:**

#### Basic Information Update:
```json
{
  "licenseNumber": "MH14XY5678",
  "licenseExpiryDate": "2031-06-30",
  "emergencyContactName": "Jane Smith",
  "emergencyContactPhone": "9123456789"
}
```

#### Status Update:
```json
{
  "status": "approved",
  "backgroundCheckStatus": "approved"
}
```

#### Status Rejection:
```json
{
  "status": "rejected",
  "rejectionReason": "Invalid documents submitted"
}
```

#### Bank Details Update:
```json
{
  "bankAccountNumber": "987654321012",
  "bankIfscCode": "HDFC0001234",
  "bankAccountHolderName": "John Doe",
  "upiId": "john@phonepe"
}
```

#### Rating and Statistics Update:
```json
{
  "rating": 4.9,
  "totalRides": 250,
  "totalEarnings": 75000.75,
  "isOnline": true
}
```

#### Document URLs Update:
```json
{
  "licenseImageUrl": "https://example.com/new-license.jpg",
  "aadharImageUrl": "https://example.com/new-aadhar.jpg",
  "panImageUrl": "https://example.com/pan.jpg",
  "policeVerificationCertUrl": "https://example.com/police-cert.jpg"
}
```

### **Success Response (200):**
```json
{
  "success": true,
  "message": "Driver updated successfully",
  "data": {
    "id": 1,
    "user_uuid": "172a2d91-9073-4fd1-91ac-3c35bf13905e",
    "licenseNumber": "MH14XY5678",
    "status": "approved",
    "approvedAt": "2025-08-29T11:00:00Z",
    "updatedAt": "2025-08-29T11:00:00Z"
    // ... other updated fields
  }
}
```

### **Error Responses:**

#### Missing UUID (400):
```json
{
  "success": false,
  "message": "User UUID is required"
}
```

#### Driver Not Found (404):
```json
{
  "success": false,
  "message": "Driver not found"
}
```

#### Invalid License Number (400):
```json
{
  "success": false,
  "message": "Invalid license number format"
}
```

#### Invalid Date (400):
```json
{
  "success": false,
  "message": "License expiry date must be in the future"
}
```

#### Invalid Emergency Contact Name (400):
```json
{
  "success": false,
  "message": "Emergency contact name must be 2-100 characters and contain only letters and spaces"
}
```

#### Invalid PAN Format (400):
```json
{
  "success": false,
  "message": "Invalid PAN number format"
}
```

#### Invalid IFSC Code (400):
```json
{
  "success": false,
  "message": "Invalid IFSC code format"
}
```

#### Invalid UPI ID (400):
```json
{
  "success": false,
  "message": "Invalid UPI ID format"
}
```

#### Invalid Status (400):
```json
{
  "success": false,
  "message": "Invalid status. Must be one of: pending, under_review, approved, rejected, suspended, inactive"
}
```

#### Invalid Rating (400):
```json
{
  "success": false,
  "message": "Rating must be between 0 and 5"
}
```

#### Negative Values (400):
```json
{
  "success": false,
  "message": "Total earnings cannot be negative"
}
```

#### Duplicate Unique Fields (409):
```json
{
  "success": false,
  "message": "License number already exists"
}
```

### **Test Cases for Update:**---

## 4. Get Driver by UUID

### **Endpoint:** `GET /driver/get/:uuid`

Retrieves a specific driver's information by their user UUID.

### **URL Parameter:**
- `:uuid` - The user's UUID

### **Example Request:**
```
GET /driver/get/172a2d91-9073-4fd1-91ac-3c35bf13905e
```

### **Success Response (200):**
```json
{
  "success": true,
  "message": "Driver retrieved successfully",
  "data": {
    "id": 1,
    "user_uuid": "172a2d91-9073-4fd1-91ac-3c35bf13905e",
    "licenseNumber": "MH12AB1234",
    "licenseExpiryDate": "2030-12-31",
    "licenseImageUrl": "https://example.com/license.jpg",
    "aadharNumber": "123412341234",
    "aadharImageUrl": "https://example.com/aadhar.jpg",
    "panNumber": "ABCDE1234F",
    "panImageUrl": "https://example.com/pan.jpg",
    "policeVerificationCertUrl": "https://example.com/police-cert.jpg",
    "emergencyContactName": "John Doe",
    "emergencyContactPhone": "9876543210",
    "bankAccountNumber": "123456789012",
    "bankIfscCode": "SBIN0001234",
    "bankAccountHolderName": "John Doe",
    "upiId": "john@paytm",
    "status": "approved",
    "backgroundCheckStatus": "approved",
    "rejectionReason": null,
    "rating": 4.8,
    "totalRides": 125,
    "totalEarnings": 45000.50,
    "isOnline": true,
    "createdAt": "2025-08-29T10:30:00Z",
    "updatedAt": "2025-08-29T11:00:00Z",
    "approvedAt": "2025-08-29T11:00:00Z",
    "rejectedAt": null,
    "lastOnlineAt": "2025-08-29T11:00:00Z"
  }
}
```

### **Error Responses:**

#### Missing UUID (400):
```json
{
  "success": false,
  "message": "User UUID is required"
}
```

#### Driver Not Found (404):
```json
{
  "success": false,
  "message": "Driver not found"
}
```

---

## 5. Delete Driver

### **Endpoint:** `DELETE /driver/delete/:uuid/:mode`

Deletes a driver profile either softly (status change) or permanently.

### **URL Parameters:**
- `:uuid` - The user's UUID
- `:mode` - Delete mode: `soft` or `hard`

### **Example Requests:**
```
DELETE /driver/delete/172a2d91-9073-4fd1-91ac-3c35bf13905e/soft
DELETE /driver/delete/172a2d91-9073-4fd1-91ac-3c35bf13905e/hard
```

### **Soft Delete Response (200):**
```json
{
  "success": true,
  "message": "Driver soft-deleted (status set to inactive)"
}
```

### **Hard Delete Response (200):**
```json
{
  "success": true,
  "message": "Driver permanently deleted"
}
```

### **Error Responses:**

#### Missing UUID (400):
```json
{
  "success": false,
  "message": "User UUID is required"
}
```

#### Invalid Mode (400):
```json
{
  "success": false,
  "message": "Invalid delete mode. Must be \"soft\" or \"hard\"."
}
```

#### Driver Not Found (404):
```json
{
  "success": false,
  "message": "Driver not found"
}
```

---

## 6. Error Codes Reference

| HTTP Code | Description | Common Causes |
|-----------|-------------|---------------|
| **400** | Bad Request | Invalid data format, missing required fields, validation failures |
| **404** | Not Found | Driver/User not found |
| **409** | Conflict | Duplicate unique fields (license, aadhar, PAN) |
| **500** | Internal Server Error | Database connection issues, unexpected server errors |

### **Common Validation Formats:**

| Field | Format | Example |
|-------|--------|---------|
| **License Number** | State code + numbers + letters | `MH12AB1234` |
| **Aadhar Number** | 12 digits | `123412341234` |
| **PAN Number** | 5 letters + 4 numbers + 1 letter | `ABCDE1234F` |
| **Phone Number** | 10 digits | `9876543210` |
| **IFSC Code** | 4 letters + 7 characters | `SBIN0001234` |
| **UPI ID** | username@provider | `user@paytm` |
| **Date** | YYYY-MM-DD | `2030-12-31` |
| **Image URL** | Valid HTTP/HTTPS URL | `https://example.com/image.jpg` |

### **Important Notes:**

1. **User Must Exist First**: Before creating a driver profile, ensure the user exists in the users table.

2. **Unique Constraints**: License number, Aadhar number, and PAN number must be unique across all drivers.

3. **Status Flow**: 
   - New drivers start with `status: "pending"`
   - Approve with `status: "approved"` (sets `approvedAt` timestamp)
   - Reject with `status: "rejected"` + `rejectionReason` (sets `rejectedAt` timestamp)

4. **Date Validation**: All dates must be in YYYY-MM-DD format and license expiry must be in the future.

5. **Search Functionality**: The search parameter searches across license number, aadhar, PAN, emergency contact details, bank account, and UPI ID.

6. **Pagination**: Maximum limit is 100 items per page to prevent performance issues.

7. **Online Status**: When `isOnline` changes, `lastOnlineAt` timestamp is automatically updated.
