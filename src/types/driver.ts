export interface CreateDriverRequest {
  user_uuid: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  licenseImageUrl: string;
  aadharNumber: string;
  aadharImageUrl: string;
  panNumber?: string;
  panImageUrl?: string;
  policeVerificationCertUrl?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankAccountHolderName?: string;
  upiId?: string;
}

export interface UpdateDriverRequest extends Omit<Partial<CreateDriverRequest>, 'panNumber' | 'panImageUrl' | 'policeVerificationCertUrl' | 'bankAccountNumber' | 'bankIfscCode' | 'bankAccountHolderName' | 'upiId'> {
  // Identity documents (allowing explicit null for database updates)
  panNumber?: string | null;
  panImageUrl?: string | null;
  policeVerificationCertUrl?: string | null;
  
  // Status and verification
  backgroundCheckStatus?: "pending" | "in_progress" | "approved" | "rejected";
  status?: "pending" | "under_review" | "approved" | "rejected" | "suspended" | "inactive";
  rejectionReason?: string | null;
  
  // Banking information (allowing explicit null for database updates)
  bankAccountNumber?: string | null;
  bankIfscCode?: string | null;
  bankAccountHolderName?: string | null;
  upiId?: string | null;
  
  // Performance metrics
  rating?: number;
  totalRides?: number;
  totalEarnings?: number;
  
  // Online status
  isOnline?: boolean;
}