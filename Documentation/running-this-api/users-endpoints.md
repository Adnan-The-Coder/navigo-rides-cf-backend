# User Endpoints API Documentation

This document provides a detailed guide to the user-related API endpoints. All examples assume a base URL of `{base_url}`.

-----

## 1\. Create a New User 

This endpoint allows you to create a new user profile by sending a JSON payload.

### Endpoint Details

  * **URL:** `{base_url}/users/create`
  * **Method:** `POST`
  * **Request Headers:** `Content-Type: application/json`

### Request Body (Minimum Payload)

The following fields are required to create a new user. All fields are sanitized and validated.

```json
{
  "email": "contact@adnanthecoder.com",
  "phoneNumber": "9900523400",
  "firstName": "Adnan",
  "lastName": "Ali"
}
```

### Request Body (Optional Fields)

You can include optional fields in the request body. If included, they must pass validation.

```json
{
  "email": "newuser@example.com",
  "phoneNumber": "9876543210",
  "firstName": "Jane",
  "lastName": "Doe",
  "profileImage": "https://example.com/path/to/profile.jpg",
  "dateOfBirth": "1990-05-15",
  "gender": "female",
  "userType": "student"
}
```

  * `dateOfBirth`: Must be in `YYYY-MM-DD` format.
  * `gender`: Must be `male`, `female`, or `other`.
  * `userType`: Must be `customer`, `driver`, `parent`, `student`, or `guardian`.

### Example Responses

#### Success (`201 Created`)

A new user is created and a unique `uuid` is generated.

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 1,
    "email": "contact@adnanthecoder.com",
    "phoneNumber": "9900523400",
    "firstName": "Adnan",
    "lastName": "Ali",
    "profileImage": null,
    "dateOfBirth": null,
    "gender": null,
    "userType": "customer",
    "isActive": true,
    "isVerified": false,
    "uuid": "d814cc5d-1097-4a10-92c4-118dfa5e92d2",
    "createdAt": "2025-08-28T01:00:00Z",
    "updatedAt": "2025-08-28T01:00:00Z"
  }
}
```

#### Error (`400 Bad Request`)

This error occurs if a required field is missing or an invalid value is provided.

```json
{
  "success": false,
  "message": "email is required"
}
```

or

```json
{
  "success": false,
  "message": "Date of birth must be in YYYY-MM-DD format"
}
```

#### Error (`409 Conflict`)

This error occurs if the email or phone number is already registered.

```json
{
  "success": false,
  "message": "Email already exists"
}
```

-----

## 2\. Get All Users 

This endpoint retrieves a list of all users with support for pagination, sorting, and filtering.

### Endpoint Details

  * **URL:** `{base_url}/users/get-all`
  * **Method:** `GET`
  * **Request Headers:** `Content-Type: application/json`

### Query Parameters

You can use query parameters to filter, sort, and paginate the results.

  * `page`: (Number, default: `1`) The page number.
  * `limit`: (Number, default: `10`, max: `100`) The number of users per page.
  * `userType`: (String) Filter by user type (`customer`, `driver`, etc.).
  * `isActive`: (Boolean) Filter by user status (`true` or `false`).
  * `isVerified`: (Boolean) Filter by verification status (`true` or `false`).
  * `search`: (String) Search by `firstName`, `lastName`, `email`, or `phoneNumber`.
  * `sortBy`: (String) Field to sort by (`createdAt`, `updatedAt`, `firstName`, `lastName`, `email`).
  * `sortOrder`: (String, default: `desc`) Sort order (`asc` or `desc`).
  * `gender`: (String) Filter by gender (`male`, `female`, or `other`).
  * `createdAfter`: (String) Filter for users created after a specific date (e.g., `2024-01-01T00:00:00Z`).
  * `createdBefore`: (String) Filter for users created before a specific date.

### Example Request

`{base_url}/users/get-all?page=2&limit=50&userType=student&sortBy=lastName&sortOrder=asc&search=john`

### Example Response

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    // Array of user objects
  ],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 125,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": true
  }
}
```

-----

## 3\. Get User by UUID 

This endpoint fetches a single user's details using their unique UUID.

### Endpoint Details

  * **URL:** `{base_url}/users/get/:uuid`
  * **Method:** `GET`
  * **URL Parameter:** `:uuid` (string, the user's unique identifier)
  * **Example URL:** `http://127.0.0.1:8787/users/get/d814cc5d-1097-4a10-92c4-118dfa5e92d2`

### Example Responses

#### Success (`200 OK`)

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": 1,
    "email": "contact@adnanthecoder.com",
    "phoneNumber": "9900523400",
    "firstName": "Adnan",
    "lastName": "Ali",
    "profileImage": null,
    "dateOfBirth": null,
    "gender": null,
    "userType": "customer",
    "isActive": true,
    "isVerified": false,
    "uuid": "d814cc5d-1097-4a10-92c4-118dfa5e92d2",
    "createdAt": "2025-08-28T01:00:00Z",
    "updatedAt": "2025-08-28T01:00:00Z"
  }
}
```

#### Error (`404 Not Found`)

This happens if the UUID does not match any user in the database.

```json
{
  "success": false,
  "message": "User not found"
}
```

-----

## 4\. Update User by UUID 

This endpoint performs a partial update (`PATCH`) on a user's profile.

### Endpoint Details

  * **URL:** `{base_url}/users/update/:uuid`
  * **Method:** `PATCH`
  * **URL Parameter:** `:uuid` (string, the user's unique identifier)
  * **Request Headers:** `Content-Type: application/json`

### Request Body

The request body is a JSON object containing one or more fields to update. Any field included must pass validation.

| Field | Description | Validation |
|---|---|---|
| `email` | User's email address | Must be a valid email format and unique. |
| `phoneNumber`| User's phone number | Must be a valid 10-digit Indian number and unique. |
| `firstName` | User's first name | 2-50 characters, only letters and spaces. |
| `lastName` | User's last name | 2-50 characters, only letters and spaces. |
| `profileImage`| URL for the user's profile image | Must be a valid image URL. |
| `dateOfBirth`| User's date of birth | `YYYY-MM-DD` format, age between 13 and 120. |
| `gender` | User's gender | `male`, `female`, or `other`. |
| `userType` | Type of user account | `customer`, `driver`, `parent`, etc. |
| `isActive` | User account status | `true` or `false`. |
| `isVerified` | User verification status | `true` or `false`. |

### Example Payloads

  * **Update Multiple Fields:**
    ```json
    {
      "email": "updatedemail@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "profileImage": "https://example.com/path/to/profile.jpg"
    }
    ```
  * **Update Single Field:**
    ```json
    {
      "phoneNumber": "9876543210"
    }
    ```

### Example Responses

#### Success (`200 OK`)

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 1,
    "email": "updatedemail@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "updatedAt": "2025-08-28T01:05:00Z",
    // ...other fields
  }
}
```

#### Error (`400 Bad Request`)

Occurs with invalid data formats or values.

```json
{
  "success": false,
  "message": "Age must be between 13 and 120 years"
}
```

#### Error (`409 Conflict`)

Occurs if the new email or phone number is already in use by another user.

```json
{
  "success": false,
  "message": "Email already exists"
}
```

#### Error (`404 Not Found`)

This happens if the provided UUID does not exist.

```json
{
  "success": false,
  "message": "User not found"
}
```

-----

## 5\. Delete a User 

This endpoint allows for both **soft** and **hard** deletion of a user profile.

### Endpoint Details

  * **URL:** `{base_url}/users/delete/:uuid/:deleteType`
  * **Method:** `DELETE`
  * **URL Parameters:**
      * `:uuid` (string, the user's unique identifier)
      * `:deleteType` (string, `soft` or `hard`. Defaults to `soft` if not provided).

### Soft Delete (`/users/delete/:uuid/soft`)

A soft delete marks the user as inactive (`isActive: false`) without removing their data from the database. This is the default behavior if `:deleteType` is omitted.

### Hard Delete (`/users/delete/:uuid/hard`)

A hard delete permanently removes the user record from the database. This is irreversible.

### Example Responses

#### Success (`200 OK`)

```json
{
  "success": true,
  "message": "User soft deleted successfully",
  "data": {
    "id": 1,
    "isActive": false,
    "updatedAt": "2025-08-28T01:10:00Z",
    // ...other fields
  }
}
```

or

```json
{
  "success": true,
  "message": "User hard deleted successfully",
  "data": {
    "id": 1,
    "uuid": "d814cc5d-1097-4a10-92c4-118dfa5e92d2"
  }
}
```

#### Error (`400 Bad Request`)

```json
{
  "success": false,
  "message": "Invalid delete type. It must be either \"soft\" or \"hard\""
}
```

#### Error (`404 Not Found`)

```json
{
  "success": false,
  "message": "User not found"
}
```