import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ITaskList extends Document {
  name: string;
  description?: string;
  color: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskListSchema = new Schema<ITaskList>(
  {
    name: {
      type: String,
      required: [true, 'Task list name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: '#3b82f6', // blue-500
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task list must have a creator'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
TaskListSchema.index({ name: 1 });

const TaskList: Model<ITaskList> =
  mongoose.models.TaskList || mongoose.model<ITaskList>('TaskList', TaskListSchema);

export default TaskList;
