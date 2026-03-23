import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type TaskPriority = "Low" | "Medium" | "High" | "Critical";
export type TaskStatus =
  | "ToDo"
  | "In-Progress"
  | "Blocked"
  | "In-Review"
  | "Completed";

export interface IAuditLogEntry {
  actor: Types.ObjectId;
  action: string;
  field: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
}

export interface ITask extends Document {
  taskId: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  taskList: Types.ObjectId;
  priority: TaskPriority;
  assignedTo: Types.ObjectId[];
  status: TaskStatus;
  createdBy: Types.ObjectId;
  auditLog: IAuditLogEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    taskId: {
      type: String,
      unique: true,
      sparse: true, // allows existing docs without taskId until migration runs
      index: true,
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Task description is required"],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    taskList: {
      type: Schema.Types.ObjectId,
      ref: "TaskList",
      required: [true, "Task list is required"],
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
      required: true,
    },
    assignedTo: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ["ToDo", "In-Progress", "Blocked", "In-Review", "Completed"],
      default: "ToDo",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task must have a creator"],
    },
    auditLog: [
      {
        actor: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        action: {
          type: String,
          required: true,
        },
        field: {
          type: String,
          required: true,
        },
        oldValue: {
          type: Schema.Types.Mixed,
        },
        newValue: {
          type: Schema.Types.Mixed,
        },
        timestamp: {
          type: Date,
          default: Date.now,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ endDate: 1 });
TaskSchema.index({ priority: 1 });

const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);

export default Task;
