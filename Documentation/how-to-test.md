---

# 📘 How to Test API Endpoints

This document provides guidance for testing the `/users` and `/drivers` API endpoints, including:

* Available routes
* Minimal & full valid request JSON samples
* Validation rules
* Expected error conditions

---

## 🧑‍💼 USER ENDPOINTS

### 📍 `POST /users` — Create a New User

#### ✅ Minimal Valid Request

```json
{
  "email": "testuser@example.com",
  "phoneNumber": "9876543210",
  "firstName": "Test",
  "lastName": "User"
}
```

#### 🧾 Full Valid Request

```json
{
  "email": "driver.user@example.com",
  "phoneNumber": "9876543211",
  "firstName": "Driver",
  "lastName": "User",
  "profileImage": "https://example.com/image.jpg",
  "dateOfBirth": "1990-05-10",
  "gender": "male",
  "userType": "driver"
}
```

#### ✅ Validation Rules

| Field          | Requirement                                                            |
| -------------- | ---------------------------------------------------------------------- |
| `email`        | Required, valid email format                                           |
| `phoneNumber`  | Required, Indian format (starts with 6-9, 10 digits)                   |
| `firstName`    | Required, 2-50 alphabetic characters                                   |
| `lastName`     | Required, 2-50 alphabetic characters                                   |
| `profileImage` | Optional, valid `http(s)` URL                                          |
| `dateOfBirth`  | Optional, must be `YYYY-MM-DD` and age between 13–120                  |
| `gender`       | Optional, one of `male`, `female`, `other`                             |
| `userType`     | Optional, one of `customer`, `driver`, `parent`, `student`, `guardian` |

#### ❌ Possible Error Responses

| HTTP | Message                                           | Cause                           |
| ---- | ------------------------------------------------- | ------------------------------- |
| 400  | `email is required`, `firstName is required` etc. | Missing required fields         |
| 400  | `Please provide a valid email address`            | Invalid email format            |
| 400  | `Age must be between 13 and 120 years`            | Invalid `dateOfBirth`           |
| 400  | `Invalid gender. Must be one of...`               | Invalid enum value              |
| 409  | `Email already exists`                            | Duplicate email or phone number |
| 500  | `Internal server error. Please try again later.`  | Unexpected error                |

---

## 🚗 DRIVER ENDPOINTS

### 📍 `POST /drivers` — Create a Driver Profile for an Existing User

#### ✅ Minimal Valid Request

```json
{
  "userId": 1,
  "licenseNumber": "DL1234567890",
  "licenseExpiryDate": "2027-08-01",
  "licenseImageUrl": "https://example.com/license.jpg",
  "aadharNumber": "123456789012",
  "aadharImageUrl": "https://example.com/aadhar.jpg",
  "emergencyContactName": "Jane Doe",
  "emergencyContactPhone": "9876543210"
}
```

#### 🧾 Full Valid Request

```json
{
  "userId": 1,
  "licenseNumber": "MH1234567890123",
  "licenseExpiryDate": "2028-01-01",
  "licenseImageUrl": "https://example.com/license.jpg",
  "aadharNumber": "987654321098",
  "aadharImageUrl": "https://example.com/aadhar.jpg",
  "panNumber": "ABCDE1234F",
  "panImageUrl": "https://example.com/pan.jpg",
  "policeVerificationCertUrl": "https://example.com/police_cert.pdf",
  "emergencyContactName": "John Doe",
  "emergencyContactPhone": "9876543211",
  "bankAccountNumber": "123456789012",
  "bankIfscCode": "HDFC0001234",
  "bankAccountHolderName": "Driver User",
  "upiId": "driver@upi"
}
```

#### ✅ Validation Rules

| Field                   | Requirement                                          |
| ----------------------- | ---------------------------------------------------- |
| `userId`                | Required, must reference existing user               |
| `licenseNumber`         | Required, length 10–20                               |
| `licenseExpiryDate`     | Required, format `YYYY-MM-DD`, must be a future date |
| `licenseImageUrl`       | Required, valid URL                                  |
| `aadharNumber`          | Required, must be 12-digit numeric string            |
| `aadharImageUrl`        | Required, valid URL                                  |
| `emergencyContactName`  | Required                                             |
| `emergencyContactPhone` | Required, valid Indian number                        |
| `panNumber`             | Optional, must match PAN format if present           |
| `bankIfscCode`          | Optional, must match IFSC format if present          |
| `upiId`                 | Optional, must match UPI ID format if present        |

#### ❌ Possible Error Responses

| HTTP | Message                                                  | Cause                                        |
| ---- | -------------------------------------------------------- | -------------------------------------------- |
| 400  | `licenseNumber is required`, `Invalid license number`    | Missing or invalid required fields           |
| 400  | `License expiry date must be in the future`              | Invalid or past license expiry date          |
| 400  | `Aadhar number must be 12 digits`                        | Invalid Aadhar format                        |
| 400  | `Invalid PAN number format`                              | PAN present but in incorrect format          |
| 400  | `Invalid UPI ID format`                                  | Malformed UPI ID                             |
| 404  | `User not found`                                         | `userId` does not exist in DB                |
| 409  | `Driver profile already exists for this user`            | Attempt to create duplicate driver profile   |
| 409  | `License number already exists` / `Aadhar number exists` | Unique constraints on key identity documents |
| 500  | `Internal server error. Please try again later.`         | Unexpected error                             |

---

## 🔄 Testing Workflow

1. ✅ First, create a **user** using `POST /users`.
2. ✍️ Note the `id` field in the response. This becomes `userId` in the **driver profile**.
3. 🚗 Call `POST /drivers` using that `userId` and valid driver data.
4. 🧪 Validate different inputs by changing:

   * Email format, Aadhar, PAN, IFSC, UPI
   * Duplicate data to test constraints
   * Invalid date formats

---

## ✅ Example Testing Sequence

### 1. Create User

```bash
curl -X POST http://127.0.0.1:8787/users -H "Content-Type: application/json" -d '{
  "email": "driver1@example.com",
  "phoneNumber": "9876543210",
  "firstName": "Driver",
  "lastName": "One",
  "userType": "driver"
}'
```

### 2. Create Driver

```bash
curl -X POST http://127.0.0.1:8787/drivers -H "Content-Type: application/json" -d '{
  "userId": 1,
  "licenseNumber": "MH1234567890",
  "licenseExpiryDate": "2027-12-31",
  "licenseImageUrl": "https://example.com/license.jpg",
  "aadharNumber": "123456789012",
  "aadharImageUrl": "https://example.com/aadhar.jpg",
  "emergencyContactName": "Support Contact",
  "emergencyContactPhone": "9876543211"
}'
```

---

## 📌 Notes

* Always ensure your test data is **unique** for fields like email, phone, license, Aadhar, and PAN to avoid 409 errors.
* All dates must be in `YYYY-MM-DD` format.
* This documentation assumes your API is hosted at `http://127.0.0.1:8787`.

---
