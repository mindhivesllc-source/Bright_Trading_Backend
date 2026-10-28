import { IsObject, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSavedSearchDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 60)
  name!: string;

  // Validated against SearchInventoryDto in SavedService.
  @IsObject()
  filters!: Record<string, unknown>;
}
