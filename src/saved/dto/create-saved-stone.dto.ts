import { IsObject, IsString, Length } from 'class-validator';

export class CreateSavedStoneDto {
  @IsString()
  @Length(1, 100)
  stockId!: string;

  // Plain object; its keys are not whitelisted. Size is checked in
  // SavedService.
  @IsObject()
  snapshot!: Record<string, unknown>;
}
