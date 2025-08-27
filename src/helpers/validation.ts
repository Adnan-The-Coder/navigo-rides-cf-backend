export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number format
  return phoneRegex.test(phone);
};

export const validatePAN = (pan: string): boolean => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

export const validateAadhar = (aadhar: string): boolean => {
  const aadharRegex = /^\d{12}$/;
  return aadharRegex.test(aadhar);
};

export const validateLicenseNumber = (license: string): boolean => {
  // Basic validation - adjust according to your license format
  return license.length >= 10 && license.length <= 20;
};

export const validateIFSC = (ifsc: string): boolean => {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc);
};

export const validateUPI = (upi: string): boolean => {
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z]{2,64}$/;
  return upiRegex.test(upi);
};

export const validateDateFormat = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

export const isValidAge = (dateOfBirth: string): boolean => {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= 13; // Minimum age 13
  }
  
  return age >= 13 && age <= 120; // Age between 13 and 120
};

export const validateImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};