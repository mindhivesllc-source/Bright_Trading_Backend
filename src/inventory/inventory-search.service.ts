import {
  Injectable,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  Model,
} from 'mongoose';

import {
  Diamond,
  DiamondDocument,
} from './schemas/diamond.schema';

import {
  SearchInventoryDto,
} from './dto/search-inventory.dto';

function escapeRegex(
  value: string,
): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&',
  );
}

function createNumericBand(
  selectedBand?: string,
):
  | Record<string, number>
  | undefined {
  if (!selectedBand) {
    return undefined;
  }

  const normalized =
    selectedBand
      .trim()
      .toLowerCase();

  if (
    normalized.startsWith(
      'under ',
    )
  ) {
    const limit = Number(
      normalized.replace(
        'under ',
        '',
      ),
    );

    return Number.isFinite(limit)
      ? {
          $lt: limit,
        }
      : undefined;
  }

  if (
    normalized.startsWith(
      'over ',
    )
  ) {
    const limit = Number(
      normalized.replace(
        'over ',
        '',
      ),
    );

    return Number.isFinite(limit)
      ? {
          $gt: limit,
        }
      : undefined;
  }

  if (
    normalized.includes(' - ')
  ) {
    const [
      minimum,
      maximum,
    ] = normalized
      .split(' - ')
      .map(Number);

    if (
      Number.isFinite(minimum) &&
      Number.isFinite(maximum)
    ) {
      return {
        $gte: minimum,
        $lte: maximum,
      };
    }
  }

  return undefined;
}

function toFrontendDiamond(
  diamond: Record<string, any>,
) {
  return {
    id: diamond.stoneNo,
    stockId: diamond.stoneNo,

    certificateNumber:
      diamond.reportNo || '',

    availability:
      diamond.status,

    status:
      diamond.status,

    isAvailable:
      diamond.isAvailable,

    shape:
      diamond.shape,

    shapeCode:
      diamond.shapeCode,

    carat:
      diamond.carat,

    color:
      diamond.color,

    fancyColor:
      diamond.colorTinge,

    clarity:
      diamond.clarity,

    cut:
      diamond.cut,

    cutCode:
      diamond.cutCode,

    polish:
      diamond.polish,

    polishCode:
      diamond.polishCode,

    symmetry:
      diamond.symmetry,

    symmetryCode:
      diamond.symmetryCode,

    fluorescence:
      diamond.fluorescence,

    fluorescenceCode:
      diamond.fluorescenceCode,

    lab:
      diamond.lab,

    pricePerCarat:
      diamond.pricePerCarat,

    totalPrice:
      diamond.totalPrice,

    length:
      diamond.length,

    lengthMm:
      diamond.length,

    width:
      diamond.width,

    widthMm:
      diamond.width,

    depth:
      diamond.height,

    depthMm:
      diamond.height,

    table:
      diamond.tablePercent,

    tablePercent:
      diamond.tablePercent,

    totalDepth:
      diamond.depthPercent,

    depthPercent:
      diamond.depthPercent,

    ratio:
      diamond.ratio,

    lwRatio:
      diamond.ratio,

    measurements:
      diamond.dimension ||
      [
        diamond.length,
        diamond.width,
        diamond.height,
      ]
        .filter(
          (value) =>
            value !== null &&
            value !== undefined,
        )
        .join(' × '),

    location:
      diamond.location,

    certificateType:
      diamond.certificateType,

    imageUrl:
      diamond.imageUrl,

    image:
      diamond.imageUrl,

    videoUrl:
      diamond.videoUrl,

    video:
      diamond.videoUrl,

    certificateUrl:
      diamond.certificateUrl,

    certificate:
      diamond.certificateUrl,

    remark:
      diamond.remark,

    reportComment:
      diamond.reportComment,

    lastSyncDate:
      diamond.sourceLastSyncRaw,

    sourceLastSyncAt:
      diamond.sourceLastSyncAt,
  };
}

@Injectable()
export class InventorySearchService {
  constructor(
    @InjectModel(Diamond.name)
    private readonly diamondModel:
      Model<DiamondDocument>,
  ) {}

  async search(
    dto: SearchInventoryDto,
  ) {
    const page = Math.max(
      1,
      Number(dto.page) || 1,
    );

    const pageSize = Math.min(
      200,
      Math.max(
        1,
        Number(dto.pageSize) ||
          100,
      ),
    );

    const query:
      Record<string, any> = {
      isAvailable: true,
    };

    if (dto.shapes?.length) {
      query.shape = {
        $in: dto.shapes,
      };
    }

    if (dto.colors?.length) {
      query.color = {
        $in: dto.colors,
      };
    }

    if (
      dto.fancyColors?.length
    ) {
      query.colorTinge = {
        $in:
          dto.fancyColors.map(
            (color) =>
              new RegExp(
                escapeRegex(color),
                'i',
              ),
          ),
      };
    }

    if (
      dto.clarities?.length
    ) {
      query.clarity = {
        $in: dto.clarities,
      };
    }

    if (
      dto.fluorescences
        ?.length
    ) {
      query.fluorescence = {
        $in:
          dto.fluorescences,
      };
    }

    if (dto.lab) {
      query.lab = dto.lab;
    }

    if (
      dto.certificateType
    ) {
      query.certificateType =
        dto.certificateType;
    }

    if (
      dto.availability &&
      dto.availability
        .toLowerCase() !==
        'available'
    ) {
      delete query.isAvailable;

      query.status =
        dto.availability
          .trim()
          .toUpperCase();
    }

    const smartOption =
      dto.smartOptions?.[0];

    if (
      smartOption === 'IDX'
    ) {
      query.cut = 'Ideal';

      query.polish =
        'Excellent';

      query.symmetry =
        'Excellent';
    } else if (
      smartOption === '3EX'
    ) {
      query.cut =
        'Excellent';

      query.polish =
        'Excellent';

      query.symmetry =
        'Excellent';
    } else if (
      smartOption === '3VG+'
    ) {
      const acceptedGrades = [
        'Very Good',
        'Excellent',
        'Ideal',
      ];

      query.cut = {
        $in: acceptedGrades,
      };

      query.polish = {
        $in: acceptedGrades,
      };

      query.symmetry = {
        $in: acceptedGrades,
      };
    } else if (
      smartOption ===
      'New Arrivals'
    ) {
      const sevenDaysAgo =
        new Date(
          Date.now() -
            7 *
              24 *
              60 *
              60 *
              1000,
        );

      query.sourceLastSyncAt = {
        $gte: sevenDaysAgo,
      };
    } else {
      if (dto.cuts?.length) {
        query.cut = {
          $in: dto.cuts,
        };
      }

      if (dto.polish) {
        query.polish =
          dto.polish;
      }

      if (dto.symmetry) {
        query.symmetry =
          dto.symmetry;
      }
    }

    if (
      dto.minCarat !==
        undefined ||
      dto.maxCarat !==
        undefined
    ) {
      query.carat = {};

      if (
        dto.minCarat !==
        undefined
      ) {
        query.carat.$gte =
          dto.minCarat;
      }

      if (
        dto.maxCarat !==
        undefined
      ) {
        query.carat.$lte =
          dto.maxCarat;
      }
    }

    if (
      dto.minPrice !==
        undefined ||
      dto.maxPrice !==
        undefined
    ) {
      query.totalPrice = {};

      if (
        dto.minPrice !==
        undefined
      ) {
        query.totalPrice.$gte =
          dto.minPrice;
      }

      if (
        dto.maxPrice !==
        undefined
      ) {
        query.totalPrice.$lte =
          dto.maxPrice;
      }
    }

    const lengthBand =
      createNumericBand(
        dto.length,
      );

    if (lengthBand) {
      query.length =
        lengthBand;
    }

    const widthBand =
      createNumericBand(
        dto.width,
      );

    if (widthBand) {
      query.width = widthBand;
    }

    const ratioBand =
      createNumericBand(
        dto.lwRatio,
      );

    if (ratioBand) {
      query.ratio = ratioBand;
    }

    const totalDepthBand =
      createNumericBand(
        dto.totalDepth,
      );

    if (totalDepthBand) {
      query.depthPercent =
        totalDepthBand;
    }

    const tableBand =
      createNumericBand(
        dto.table,
      );

    if (tableBand) {
      query.tablePercent =
        tableBand;
    }

    const depthBand =
      createNumericBand(
        dto.depth,
      );

    if (depthBand) {
      query.height = depthBand;
    }

    if (dto.search?.trim()) {
      const searchPattern =
        new RegExp(
          escapeRegex(
            dto.search.trim(),
          ),
          'i',
        );

      query.$or = [
        {
          stoneNo:
            searchPattern,
        },

        {
          reportNo:
            searchPattern,
        },

        {
          shape:
            searchPattern,
        },

        {
          color:
            searchPattern,
        },

        {
          clarity:
            searchPattern,
        },
      ];
    }

    const sortMap:
      Record<
        string,
        Record<string, 1 | -1>
      > = {
      featured: {
        carat: 1,
        stoneNo: 1,
      },

      'price-low': {
        totalPrice: 1,
        stoneNo: 1,
      },

      'price-high': {
        totalPrice: -1,
        stoneNo: 1,
      },

      'carat-low': {
        carat: 1,
        stoneNo: 1,
      },

      'carat-high': {
        carat: -1,
        stoneNo: 1,
      },
    };

    const sort =
      sortMap[
        dto.sort || 'featured'
      ];

    const [
      databaseDiamonds,
      totalRecords,
    ] = await Promise.all([
      this.diamondModel
        .find(query)
        .sort(sort)
        .skip(
          (page - 1) *
            pageSize,
        )
        .limit(pageSize)
        .select({
          __v: 0,
          raw: 0,

          fullSyncRunId: 0,

          availabilitySyncRunId:
            0,
        })
        .lean()
        .exec(),

      this.diamondModel
        .countDocuments(query)
        .exec(),
    ]);

    const diamonds =
      databaseDiamonds.map(
        toFrontendDiamond,
      );

    return {
      diamonds,

      page,
      pageSize,

      totalRecords,

      totalPages:
        Math.ceil(
          totalRecords /
            pageSize,
        ),

      hasMore:
        page * pageSize <
        totalRecords,
    };
  }
}