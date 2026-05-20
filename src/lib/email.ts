import { Resend } from "resend";
import crypto from "crypto";


const resend = new Resend(process.env.RESEND_API_KEY);



const FROM_EMAIL = "NextAuth <onboarding@resend.dev>";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";


export function generateVerificationToken() : {
  token:string;
  expires:Date;
}{
const token = crypto.randomBytes(32).toString("hex");
const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
return { token, expires };
}


export async function sendVerificationEmail(
  name:string,
  email: string,
   token: string):Promise <{ success: boolean; error?: string }> {
     const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
     try {
       const { error } = await resend.emails.send({
         from: FROM_EMAIL,
         to: email,
         subject: "Verify your email address",
         html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #111827; margin-bottom: 8px;">Hi ${name}, welcome!</h2>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Thanks for signing up. Please verify your email address to activate your account.
            This link expires in <strong>1 hour</strong>.
          </p>
          <a
            href="${verifyUrl}"
            style="
              display: inline-block;
              margin: 24px 0;
              padding: 12px 28px;
              background-color: #4f46e5;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
              font-size: 15px;
              font-weight: 600;
            "
          >
            Verify Email Address
          </a>
          <p style="color: #6b7280; font-size: 13px;">
            If you didn't create an account, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            Or copy this link into your browser:<br />
            <span style="color: #4f46e5;">${verifyUrl}</span>
          </p>
        </div>
      `,
       });

       if (error) {
         console.error("Error sending verification email:", error);
         return { success: false, error: "Failed to send verification email" };
       }

       return { success: true };
     } catch (err) {
       console.error("[sendVerificationEmail] Unexpected error:", err);
       return { success: false, error: "Failed to send verification email" };
     }
   }



   export async function sendWelcomeEmail(
    name:string,
    email:string
   ):Promise <void>{
     try {
       await resend.emails.send({
         from: FROM_EMAIL,
         to: email,
         subject: "Your account is verified",
         html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #111827;">You're all set, ${name}!</h2>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Your email has been verified. You can now log in and access your dashboard.
          </p>
          <a
            href="${APP_URL}/login"
            style="
              display: inline-block;
              margin: 24px 0;
              padding: 12px 28px;
              background-color: #4f46e5;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
              font-size: 15px;
              font-weight: 600;
            "
          >
            Go to Login
          </a>
        </div>
      `,
       });
     } catch (err) {
       // Welcome email failure is non-critical — user is already verified.
       // Log it but don't crash the request.
       console.error("[sendWelcomeEmail] Failed:", err);
     }
   }