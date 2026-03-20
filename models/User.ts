import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  username: string;
  email?: string;
  password: string;
  role: "Admin" | "Manager" | "Member";
  isActive: boolean;
  managerId?: Types.ObjectId;
  annualLeaveBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
    },
    email: {
      type: String,
      required: false,
      unique: false,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["Admin", "Manager", "Member"],
      default: "Member",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    annualLeaveBalance: {
      type: Number,
      default: 15,
      min: [0, "Leave balance cannot be negative"],
    },
  },
  {
    timestamps: true,
  },
);

// Validation: Prevent Managers/Admins from having a managerId
UserSchema.pre("save", function () {
  if ((this.role === "Manager" || this.role === "Admin") && this.managerId) {
    const error = new Error(
      "Managers and Admins cannot be assigned to another Manager",
    );
    throw error;
  }
});

// Pre-save hook: Handle task deallocation when member is reassigned
UserSchema.pre("save", async function () {
  if (this.isModified("managerId") && !this.isNew && this.role === "Member") {
    try {
      // Import Task model dynamically to avoid circular dependency
      const Task = (await import("./Task")).default;
      const oldManagerId = (this as any)._original?.managerId;

      if (oldManagerId) {
        // Find all tasks created by old manager where this user is assigned
        const tasks = await Task.find({
          createdBy: oldManagerId,
          assignedTo: { $in: [this._id] },
        });

        // Remove this user from those tasks and add audit log
        for (const task of tasks) {
          task.assignedTo = task.assignedTo.filter(
            (id: Types.ObjectId) => id.toString() !== this._id.toString(),
          );

          // Add audit log entry
          task.auditLog.push({
            actor: oldManagerId,
            action: "Assignee Removed",
            field: "assignedTo",
            oldValue: this._id.toString(),
            newValue: null,
            timestamp: new Date(),
          });

          await task.save();
        }
      }
    } catch (error) {
      console.error(
        "Error deallocating tasks during member reassignment:",
        error,
      );
    }
  }
});

// Store original values before modification for comparison
UserSchema.pre("save", function () {
  if (!this.isNew) {
    (this as any)._original = this.toObject();
  }
});

// Prevent model recompilation in Next.js development
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
