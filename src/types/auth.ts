export interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
  errors?: { field: string; message: string }[];
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  isEmailVerified: boolean;
  createdAt: Date;
}

export interface AuthRespone {
  user: SafeUser;
  accessToken: string;
}
