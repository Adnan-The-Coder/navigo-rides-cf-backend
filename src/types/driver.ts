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

export interface UpdateDriverRequest extends Partial<CreateDriverRequest> {
  backgroundCheckStatus?: "pending" | "in_progress" | "approved" | "rejected";
  status?: "pending" | "under_review" | "approved" | "rejected" | "suspended" | "inactive";
  rejectionReason?: string;
  rating?: number;
  totalRides?: number;
  totalEarnings?: number;
  isOnline?: boolean;
}