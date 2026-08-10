import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  lastName: string;

 @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  name: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @Length(8, 128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message:
      'Password must contain at least one letter and one number.',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  companyName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  salesPerson: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9+\-()\s]{7,20}$/, {
    message: 'Mobile number is invalid.',
  })
  mobileNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;
}