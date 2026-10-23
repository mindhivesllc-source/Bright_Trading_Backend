import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type SavedSearchDocument = HydratedDocument<SavedSearch>;

@Schema({
  collection: 'saved_searches',
  timestamps: { createdAt: true, updatedAt: false },
  minimize: false,
})
export class SavedSearch {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 1, maxlength: 60 })
  name!: string;

  // The same object the app sends to POST /inventory/search.
  @Prop({ type: SchemaTypes.Mixed, default: {} })
  filters!: Record<string, unknown>;

  @Prop({ type: Date })
  lastRunAt?: Date;

  @Prop({ type: Number })
  lastCount?: number;

  createdAt!: Date;
}

export const SavedSearchSchema = SchemaFactory.createForClass(SavedSearch);

SavedSearchSchema.index({ userId: 1, createdAt: -1 });
