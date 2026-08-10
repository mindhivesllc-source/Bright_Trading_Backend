import {
  Type,
} from 'class-transformer';

import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class SearchInventoryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  shapes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fancyColors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  clarities?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cuts?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fluorescences?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  smartOptions?: string[];

  @IsOptional()
  @IsString()
  polish?: string;

  @IsOptional()
  @IsString()
  symmetry?: string;

  @IsOptional()
  @IsString()
  lab?: string;

  @IsOptional()
  @IsString()
  availability?: string;

  @IsOptional()
  @IsString()
  certificateType?: string;

  @IsOptional()
  @IsString()
  length?: string;

  @IsOptional()
  @IsString()
  width?: string;

  @IsOptional()
  @IsString()
  lwRatio?: string;

  @IsOptional()
  @IsString()
  totalDepth?: string;

  @IsOptional()
  @IsString()
  table?: string;

  @IsOptional()
  @IsString()
  depth?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minCarat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxCarat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsIn([
    'featured',
    'price-low',
    'price-high',
    'carat-low',
    'carat-high',
  ])
  sort?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize = 100;
}