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
name: string;

@Prop({
  required: true,
  trim: true,
})
firstName: string;

@Prop({
  required: true,
  trim: true,
})
lastName: string;

@Prop({
  required: true,
  unique: true,
  lowercase: true,
  trim: true,
})
email: string;

@Prop({
  required: true,
  select: false,
})
passwordHash: string;

@Prop({
  required: true,
  trim: true,
})
companyName: string;

@Prop({
  required: true,
  trim: true,
})
salesPerson: string;

@Prop({
  required: true,
  trim: true,
})
mobileNumber: string;

@Prop({
  default: '',
  trim: true,
})
address: string;

@Prop({
  default: '',
  trim: true,
})
state: string;

@Prop({
  default: '',
  trim: true,
})
city: string;

@Prop({
  default: '',
  trim: true,
})
zipCode: string;
}

export const UserSchema = SchemaFactory.createForClass(User);