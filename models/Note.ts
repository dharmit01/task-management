import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface INote extends Document {
  title: string;
  content: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Note content is required'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Note must have a creator'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
NoteSchema.index({ createdBy: 1, updatedAt: -1 });

const Note: Model<INote> = mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);

export default Note;
