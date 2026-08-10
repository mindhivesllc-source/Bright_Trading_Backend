import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
} from 'mongoose';

export type UserDocument =
  HydratedDocument<User>;

@Schema({
  timestamps: true,
})
export class User {
 @Prop({
  required: true,
  trim: true,
})
name: string | undefined;

@Prop({
  required: true,
  trim: true,
})
firstName: string | undefined;

@Prop({
  required: true,
  trim: true,
})
lastName: string | undefined;

@Prop({
  required: true,
  unique: true,
  lowercase: true,
  trim: true,
})
email: string | undefined;

@Prop({
  required: true,
  select: false,
})
passwordHash: string | undefined;

@Prop({
  required: true,
  trim: true,
})
companyName: string | undefined;

@Prop({
  required: true,
  trim: true,
})
salesPerson: string | undefined;

@Prop({
  required: true,
  trim: true,
})
mobileNumber: string | undefined;

@Prop({
  default: '',
  trim: true,
})
address: string | undefined;

@Prop({
  default: '',
  trim: true,
})
state: string | undefined;

@Prop({
  default: '',
  trim: true,
})
city: string | undefined;

@Prop({
  default: '',
  trim: true,
})
zipCode: string | undefined;
}

export const UserSchema = SchemaFactory.createForClass(User);