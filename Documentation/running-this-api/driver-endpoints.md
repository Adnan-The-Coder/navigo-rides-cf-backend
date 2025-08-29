http://127.0.0.1:8787

Create Driver
/driver/create
{
  "user_uuid": "172a2d91-9073-4fd1-91ac-3c35bf13905e", // uuid of the user, the user needs to created first before  
  "licenseNumber": "MH12AB1234",
  "licenseExpiryDate": "2030-12-31",
  "licenseImageUrl": "https://example.com/license.jpg",
  "aadharNumber": "123412341234",
  "aadharImageUrl": "https://example.com/aadhar.jpg",
  "emergencyContactName": "John Doe",
  "emergencyContactPhone": "9876543210"
}


// update driver
/driver/update/:uuid
Request Type: Patch request
> ⚠️ **Important:** Replace `:uuid` in your Postman URL with the actual driver's UUID, and make sure your method is **`PATCH`**.

---

### ✅ 1. **Basic Valid Update**

```json
{
  "licenseNumber": "MH12AB1234",
  "licenseExpiryDate": "2030-01-01",
  "emergencyContactName": "John Doe",
  "emergencyContactPhone": "9876543210",
  "status": "approved"
}
```

---

### ⚠️ 2. **Invalid License Number**

```json
{
  "licenseNumber": "123"
}
```

Expected Response: `400 - Invalid license number format`

---

### ⚠️ 3. **Invalid Emergency Contact Name**

```json
{
  "emergencyContactName": "J0hn!!"
}
```

Expected Response: `400 - Emergency contact name must be 2-100 characters and contain only letters and spaces`

---

### ✅ 4. **PAN and Aadhar Validation Test**

```json
{
  "panNumber": "ABCDE1234F",
  "aadharNumber": "123456789012"
}
```

---

### ⚠️ 5. **Invalid PAN Format**

```json
{
  "panNumber": "12345ABCDE"
}
```

Expected Response: `400 - Invalid PAN number format`

---

### ✅ 6. **Full Bank Details Update**

```json
{
  "bankAccountNumber": "123456789012",
  "bankIfscCode": "SBIN0001234",
  "bankAccountHolderName": "Alice Smith",
  "upiId": "alice@upi"
}
```

---

### ⚠️ 7. **Invalid IFSC and UPI Format**

```json
{
  "bankIfscCode": "ABC123",
  "upiId": "invalidupi"
}
```

Expected Response:

* `400 - Invalid IFSC code format`
* `400 - Invalid UPI ID format`

---

### ✅ 8. **Only Status Change**

```json
{
  "status": "rejected",
  "rejectionReason": "Document mismatch"
}
```

---

### ✅ 9. **Background Check Status Update**

```json
{
  "backgroundCheckStatus": "in_progress"
}
```

---

### ⚠️ 10. **Invalid Background Check Status**

```json
{
  "backgroundCheckStatus": "processing"
}
```

Expected Response: `400 - Invalid background check status. Must be one of: pending, in_progress, approved, rejected`

---

### ✅ 11. **Rating and Earnings Update**

```json
{
  "rating": 4.8,
  "totalRides": 120,
  "totalEarnings": 58000.50
}
```

---

### ⚠️ 12. **Negative Earnings**

```json
{
  "totalEarnings": -1000
}
```

Expected Response: `400 - Total earnings cannot be negative`

---

### ✅ 13. **Valid Image URLs**

```json
{
  "licenseImageUrl": "https://example.com/license.jpg",
  "aadharImageUrl": "https://example.com/aadhar.jpg",
  "panImageUrl": "https://example.com/pan.jpg",
  "policeVerificationCertUrl": "https://example.com/certificate.jpg"
}
```

---

### ⚠️ 14. **Invalid Image URLs**

```json
{
  "licenseImageUrl": "ftp://example.com/license.jpg"
}
```

Expected Response: `400 - Please provide a valid license image URL`

---

### ✅ 15. **Minimal Update (Just Going Online)**

```json
{
  "isOnline": true
}
```

// get all drivers information 
Request type: Get

/driver/get-all
{}