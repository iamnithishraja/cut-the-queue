import { number, z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phoneNo: z.string().min(10),
  password: z.string().min(8),
});

export const deleteAccountSchema = z.object({ password: z.string().min(8), });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});


export const requestOtpSchema = z.object({
  number: z.string(),
});

export const submitOtpSchema = z.object({
  number: z.string(),
  otp: z.string(),
});

export const smsMessage = z.object({
  to: z.string(),
  content: z.string(),
});


export const calculateAmountSchema = z.array(
  z.object({
    id: z.string(),
    quantity: z.number().gt(0)
  })
);

export const forgotPasswordSchema = z.object({
  phoneNo: z.string().min(10)
});

export const verifyOtpAndResetPasswordSchema = z.object({
  phoneNo: z.string().min(10),
  password: z.string().min(8),
  confirmPassword: z.string().min(8)
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8)
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
export const getAllOrdersSchema = z.object({
  page:z.string()
});
export type SMSMessage = z.infer<typeof smsMessage>;
