import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Model, Types } from 'mongoose';

import { SearchInventoryDto } from '../inventory/dto/search-inventory.dto';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { CreateSavedStoneDto } from './dto/create-saved-stone.dto';
import {
  SavedSearch,
  SavedSearchDocument,
} from './schemas/saved-search.schema';
import {
  SavedStone,
  SavedStoneDocument,
} from './schemas/saved-stone.schema';

export const MAX_SAVED_STONES = 500;
export const MAX_SAVED_SEARCHES = 50;

// Upper bound for a stored snapshot or filter object, in JSON characters.
const MAX_OBJECT_JSON_LENGTH = 20_000;

function assertSize(value: unknown, field: string): void {
  if (JSON.stringify(value).length > MAX_OBJECT_JSON_LENGTH) {
    throw new BadRequestException(`${field} is too large.`);
  }
}

@Injectable()
export class SavedService {
  constructor(
    @InjectModel(SavedStone.name)
    private readonly savedStoneModel: Model<SavedStoneDocument>,

    @InjectModel(SavedSearch.name)
    private readonly savedSearchModel: Model<SavedSearchDocument>,
  ) {}

  async listStones(userId: string) {
    const stones = await this.savedStoneModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return { items: stones.map((stone) => this.toStoneView(stone)) };
  }

  // Saving an already saved stone refreshes its snapshot and keeps
  // the original createdAt.
  async saveStone(userId: string, dto: CreateSavedStoneDto) {
    assertSize(dto.snapshot, 'snapshot');

    const ownerId = new Types.ObjectId(userId);
    const stockId = dto.stockId.trim();

    const existing = await this.savedStoneModel
      .exists({ userId: ownerId, stockId })
      .exec();

    if (!existing) {
      const count = await this.savedStoneModel
        .countDocuments({ userId: ownerId })
        .exec();

      if (count >= MAX_SAVED_STONES) {
        throw new ConflictException(
          `You can save at most ${MAX_SAVED_STONES} stones.`,
        );
      }
    }

    const stone = await this.savedStoneModel
      .findOneAndUpdate(
        { userId: ownerId, stockId },
        {
          $set: { snapshot: dto.snapshot },
          $setOnInsert: { userId: ownerId, stockId },
        },
        { upsert: true, new: true, lean: true },
      )
      .exec();

    return this.toStoneView(stone!);
  }

  async removeStone(userId: string, stockId: string): Promise<void> {
    await this.savedStoneModel
      .deleteOne({ userId: new Types.ObjectId(userId), stockId })
      .exec();
  }

  async listSearches(userId: string) {
    const searches = await this.savedSearchModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return { items: searches.map((search) => this.toSearchView(search)) };
  }

  async createSearch(userId: string, dto: CreateSavedSearchDto) {
    assertSize(dto.filters, 'filters');
    await this.assertValidFilters(dto.filters);

    const ownerId = new Types.ObjectId(userId);

    const count = await this.savedSearchModel
      .countDocuments({ userId: ownerId })
      .exec();

    if (count >= MAX_SAVED_SEARCHES) {
      throw new ConflictException(
        `You can save at most ${MAX_SAVED_SEARCHES} searches.`,
      );
    }

    const search = await this.savedSearchModel.create({
      userId: ownerId,
      name: dto.name,
      filters: dto.filters,
    });

    return this.toSearchView(search.toObject());
  }

  async removeSearch(userId: string, id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      return;
    }

    await this.savedSearchModel
      .deleteOne({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();
  }

  async deleteAllForUser(userId: string): Promise<void> {
    const ownerId = new Types.ObjectId(userId);

    await Promise.all([
      this.savedStoneModel.deleteMany({ userId: ownerId }).exec(),
      this.savedSearchModel.deleteMany({ userId: ownerId }).exec(),
    ]);
  }

  // A saved search must be replayable against POST /inventory/search,
  // so it is held to the same rules as that endpoint.
  private async assertValidFilters(
    filters: Record<string, unknown>,
  ): Promise<void> {
    const errors = await validate(
      plainToInstance(SearchInventoryDto, filters),
      { whitelist: true, forbidNonWhitelisted: true },
    );

    if (errors.length) {
      const messages = errors.flatMap((error) =>
        Object.values(error.constraints ?? {}).map(
          (message) => `filters.${message}`,
        ),
      );

      throw new BadRequestException(messages);
    }
  }

  private toStoneView(stone: {
    stockId: string;
    snapshot: Record<string, unknown>;
    createdAt: Date;
  }) {
    return {
      stockId: stone.stockId,
      snapshot: stone.snapshot,
      createdAt: stone.createdAt,
    };
  }

  private toSearchView(search: {
    _id: Types.ObjectId;
    name: string;
    filters: Record<string, unknown>;
    createdAt: Date;
    lastRunAt?: Date;
    lastCount?: number;
  }) {
    return {
      id: search._id.toString(),
      name: search.name,
      filters: search.filters,
      createdAt: search.createdAt,
      lastRunAt: search.lastRunAt ?? null,
      lastCount: search.lastCount ?? null,
    };
  }
}
