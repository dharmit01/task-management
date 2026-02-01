import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IComment extends Document {
  taskId: Types.ObjectId;
  userId: Types.ObjectId;
  commentText: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task ID is required'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    commentText: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster comment retrieval by task
CommentSchema.index({ taskId: 1, createdAt: 1 });

const Comment: Model<IComment> = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
