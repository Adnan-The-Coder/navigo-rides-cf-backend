export interface CreateUserRequest {
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  userType?: "customer" | "driver" | "parent" | "student" | "guardian";
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  isActive?: boolean;
  isVerified?: boolean;
}
