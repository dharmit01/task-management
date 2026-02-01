import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type LeaveType = 'full' | 'half';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface ILeave extends Document {
  applicant: Types.ObjectId;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: LeaveStatus;
  approvedBy?: Types.ObjectId;
  rejectionReason?: string;
  leaveDays: number;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema = new Schema<ILeave>(
  {
    applicant: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Applicant is required'],
    },
    leaveType: {
      type: String,
      enum: ['full', 'half'],
      default: 'full',
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      minlength: [10, 'Reason must be at least 10 characters'],
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
    },
    leaveDays: {
      type: Number,
      required: [true, 'Leave days count is required'],
      min: [0.5, 'Minimum leave duration is 0.5 days'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
LeaveSchema.index({ applicant: 1, status: 1 });
LeaveSchema.index({ startDate: 1, endDate: 1 });
LeaveSchema.index({ status: 1, createdAt: -1 });

// Validation: End date must be >= start date
LeaveSchema.path('endDate').validate(function (value) {
  return value >= this.startDate;
}, 'End date must be on or after start date');

const Leave: Model<ILeave> = mongoose.models.Leave || mongoose.model<ILeave>('Leave', LeaveSchema);

export default Leave;
