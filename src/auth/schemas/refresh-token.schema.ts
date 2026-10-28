import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

// One document per issued refresh token. The raw token is never stored,
// only its SHA-256 hash. Every rotation of a login session shares the
// same familyId, so a whole session can be revoked at once.
@Schema({
  collection: 'refresh_tokens',
  timestamps: { createdAt: true, updatedAt: false },
})
export class RefreshToken {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  tokenHash!: string;

  @Prop({ type: String, required: true, index: true })
  familyId!: string;

  // MongoDB removes the document once this date has passed.
  @Prop({ type: Date, required: true, expires: 0 })
  expiresAt!: Date;

  @Prop({ type: Date, default: null })
  revokedAt?: Date | null;

  // Hash of the token that replaced this one during rotation.
  @Prop({ type: String, default: null })
  replacedByHash?: string | null;

  @Prop({ type: String, maxlength: 200 })
  userAgent?: string;

  @Prop({ type: String })
  platform?: string;

  createdAt!: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
