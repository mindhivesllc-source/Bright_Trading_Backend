import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type SavedStoneDocument = HydratedDocument<SavedStone>;

@Schema({
  collection: 'saved_stones',
  timestamps: { createdAt: true, updatedAt: false },
  minimize: false,
})
export class SavedStone {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  stockId!: string;

  // Card data as the app rendered it when the stone was saved.
  @Prop({ type: SchemaTypes.Mixed, default: {} })
  snapshot!: Record<string, unknown>;

  createdAt!: Date;
}

export const SavedStoneSchema = SchemaFactory.createForClass(SavedStone);

SavedStoneSchema.index({ userId: 1, stockId: 1 }, { unique: true });
SavedStoneSchema.index({ userId: 1, createdAt: -1 });
