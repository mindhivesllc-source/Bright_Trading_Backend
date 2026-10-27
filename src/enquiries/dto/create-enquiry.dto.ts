import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateEnquiryDto {
  @IsIn(['quote', 'sourcing', 'contact'])
  type!: 'quote' | 'sourcing' | 'contact';

  // Defaults to 'app' so older app builds keep working.
  @IsOptional()
  @IsIn(['app', 'website'])
  source?: 'app' | 'website';

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  accountId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  message!: string;
}
