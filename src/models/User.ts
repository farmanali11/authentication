import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

// ─── 1. TypeScript Interface ──────────────────────────────────────
// This describes the shape of a User document in TypeScript.
// IUserDocument extends mongoose's Document so we get all the
// built-in Mongoose methods (save, deleteOne, etc.) typed for free.
// ─────────────────────────────────────────────────────────────────
export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  isEmailVerified: boolean;
  emailVerificationToken: string | null;
  emailVerificationExpires: Date | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;

  // Instance method — we define this on the schema below
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// ─── 2. Mongoose Schema ───────────────────────────────────────────
// The schema is the blueprint. It defines field types, validations,
// defaults, and indexes at the database level.
// ─────────────────────────────────────────────────────────────────
const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true, // strips leading/trailing whitespace
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      // unique: true creates a MongoDB index — fast lookups, enforces
      // uniqueness at the DB level (not just application level).
      unique: true,
      lowercase: true, // always store emails in lowercase
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        "Please enter a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      // select: false means this field is EXCLUDED by default from
      // query results. You must explicitly ask for it with .select("+password")
      // This prevents accidentally leaking hashed passwords in API responses.
      select: false,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      default: null,
      select: false, // also hidden by default
    },

    emailVerificationExpires: {
      type: Date,
      default: null,
      select: false,
    },

    // ── Password reset fields ──────────────────────────────────
    // Same pattern as email verification — a one-time token with
    // an expiry. Stored select: false so they never leak in queries.
    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
      select: false,
    },

    role: {
      type: String,
      enum: {
        values: ["user", "admin"],
        message: "Role must be either user or admin",
      },
      default: "user",
    },
  },
  {
    // timestamps: true automatically adds createdAt and updatedAt fields
    // and keeps updatedAt in sync on every save(). No manual management needed.
    timestamps: true,
  },
);

// ─── 3. Pre-save Hook ─────────────────────────────────────────────
// This middleware runs BEFORE every .save() call.
// We hash the password here instead of in the route handler because:
//   - It's automatic — you can never forget to hash it
//   - It runs on password changes too (isModified check below)
//   - Single responsibility — the model owns its own security concern
// ─────────────────────────────────────────────────────────────────
UserSchema.pre<IUserDocument>("save", async function () {
  // Only hash if the password field was actually changed.
  // Without this check, every profile update (name, email, etc.)
  // would re-hash an already-hashed password — corrupting it.
  if (!this.isModified("password")) return;

  // Salt rounds = 12. Each round doubles the hashing time.
  // 12 rounds ≈ 300ms on a modern CPU — slow enough to frustrate
  // brute-force attacks, fast enough for normal use.
  this.password = await bcrypt.hash(this.password, 12);
});

// ─── 4. Instance Method ───────────────────────────────────────────
// comparePassword is called on a user document instance:
//   const isValid = await user.comparePassword("typedPassword")
//
// bcrypt.compare() safely compares a plain string against a hash
// without ever decrypting the hash (bcrypt is one-way).
// ─────────────────────────────────────────────────────────────────
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── 5. Model Export ─────────────────────────────────────────────
// Why the mongoose.models.User check?
//
// In Next.js development, hot-reload re-runs this file on every save.
// Without the check, Mongoose throws "Cannot overwrite `User` model
// once compiled." The check reuses the already-compiled model if it
// exists, and only creates it fresh on first load.
// ─────────────────────────────────────────────────────────────────
const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

export default User;
