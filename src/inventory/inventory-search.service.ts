// import {
//   Injectable,
// } from '@nestjs/common';

// import {
//   InjectModel,
// } from '@nestjs/mongoose';

// import {
//   Model,
// } from 'mongoose';

// import {
//   Diamond,
//   DiamondDocument,
// } from './schemas/diamond.schema';

// import {
//   SearchInventoryDto,
// } from './dto/search-inventory.dto';

// function escapeRegex(
//   value: string,
// ): string {
//   return value.replace(
//     /[.*+?^${}()|[\]\\]/g,
//     '\\$&',
//   );
// }

// function createNumericBand(
//   selectedBand?: string,
// ):
//   | Record<string, number>
//   | undefined {
//   if (!selectedBand) {
//     return undefined;
//   }

//   const normalized =
//     selectedBand
//       .trim()
//       .toLowerCase();

//   if (
//     normalized.startsWith(
//       'under ',
//     )
//   ) {
//     const limit = Number(
//       normalized.replace(
//         'under ',
//         '',
//       ),
//     );

//     return Number.isFinite(limit)
//       ? {
//           $lt: limit,
//         }
//       : undefined;
//   }

//   if (
//     normalized.startsWith(
//       'over ',
//     )
//   ) {
//     const limit = Number(
//       normalized.replace(
//         'over ',
//         '',
//       ),
//     );

//     return Number.isFinite(limit)
//       ? {
//           $gt: limit,
//         }
//       : undefined;
//   }

//   if (
//     normalized.includes(' - ')
//   ) {
//     const [
//       minimum,
//       maximum,
//     ] = normalized
//       .split(' - ')
//       .map(Number);

//     if (
//       Number.isFinite(minimum) &&
//       Number.isFinite(maximum)
//     ) {
//       return {
//         $gte: minimum,
//         $lte: maximum,
//       };
//     }
//   }

//   return undefined;
// }

// function toFrontendDiamond(
//   diamond: Record<string, any>,
// ) {
//   return {
//     id: diamond.stoneNo,
//     stockId: diamond.stoneNo,

//     certificateNumber:
//       diamond.reportNo || '',

//     availability:
//       diamond.status,

//     status:
//       diamond.status,

//     isAvailable:
//       diamond.isAvailable,

//     shape:
//       diamond.shape,

//     shapeCode:
//       diamond.shapeCode,

//     carat:
//       diamond.carat,

//     color:
//       diamond.color,

//     fancyColor:
//       diamond.colorTinge,

//     clarity:
//       diamond.clarity,

//     cut:
//       diamond.cut,

//     cutCode:
//       diamond.cutCode,

//     polish:
//       diamond.polish,

//     polishCode:
//       diamond.polishCode,

//     symmetry:
//       diamond.symmetry,

//     symmetryCode:
//       diamond.symmetryCode,

//     fluorescence:
//       diamond.fluorescence,

//     fluorescenceCode:
//       diamond.fluorescenceCode,

//     lab:
//       diamond.lab,

//     pricePerCarat:
//       diamond.pricePerCarat,

//     totalPrice:
//       diamond.totalPrice,

//     length:
//       diamond.length,

//     lengthMm:
//       diamond.length,

//     width:
//       diamond.width,

//     widthMm:
//       diamond.width,

//     depth:
//       diamond.height,

//     depthMm:
//       diamond.height,

//     table:
//       diamond.tablePercent,

//     tablePercent:
//       diamond.tablePercent,

//     totalDepth:
//       diamond.depthPercent,

//     depthPercent:
//       diamond.depthPercent,

//     ratio:
//       diamond.ratio,

//     lwRatio:
//       diamond.ratio,

//     measurements:
//       diamond.dimension ||
//       [
//         diamond.length,
//         diamond.width,
//         diamond.height,
//       ]
//         .filter(
//           (value) =>
//             value !== null &&
//             value !== undefined,
//         )
//         .join(' × '),

//     location:
//       diamond.location,

//     certificateType:
//       diamond.certificateType,

//     imageUrl:
//       diamond.imageUrl,

//     image:
//       diamond.imageUrl,

//     videoUrl:
//       diamond.videoUrl,

//     video:
//       diamond.videoUrl,

//     certificateUrl:
//       diamond.certificateUrl,

//     certificate:
//       diamond.certificateUrl,

//     remark:
//       diamond.remark,

//     reportComment:
//       diamond.reportComment,

//     lastSyncDate:
//       diamond.sourceLastSyncRaw,

//     sourceLastSyncAt:
//       diamond.sourceLastSyncAt,
//   };
// }

// @Injectable()
// export class InventorySearchService {
//   constructor(
//     @InjectModel(Diamond.name)
//     private readonly diamondModel:
//       Model<DiamondDocument>,
//   ) {}

//   async search(
//     dto: SearchInventoryDto,
//   ) {
//     const page = Math.max(
//       1,
//       Number(dto.page) || 1,
//     );

//     const pageSize = Math.min(
//       200,
//       Math.max(
//         1,
//         Number(dto.pageSize) ||
//           100,
//       ),
//     );

//     const query:
//       Record<string, any> = {
//       isAvailable: true,
//     };

//     if (dto.shapes?.length) {
//       query.shape = {
//         $in: dto.shapes,
//       };
//     }

//     if (dto.colors?.length) {
//       query.color = {
//         $in: dto.colors,
//       };
//     }

//     if (
//       dto.fancyColors?.length
//     ) {
//       query.colorTinge = {
//         $in:
//           dto.fancyColors.map(
//             (color) =>
//               new RegExp(
//                 escapeRegex(color),
//                 'i',
//               ),
//           ),
//       };
//     }

//     if (
//       dto.clarities?.length
//     ) {
//       query.clarity = {
//         $in: dto.clarities,
//       };
//     }

//     if (
//       dto.fluorescences
//         ?.length
//     ) {
//       query.fluorescence = {
//         $in:
//           dto.fluorescences,
//       };
//     }

//     if (dto.lab) {
//       query.lab = dto.lab;
//     }

//     if (
//       dto.certificateType
//     ) {
//       query.certificateType =
//         dto.certificateType;
//     }

//     if (
//       dto.availability &&
//       dto.availability
//         .toLowerCase() !==
//         'available'
//     ) {
//       delete query.isAvailable;

//       query.status =
//         dto.availability
//           .trim()
//           .toUpperCase();
//     }

//     const smartOption =
//       dto.smartOptions?.[0];

//     if (
//       smartOption === 'IDX'
//     ) {
//       query.cut = 'Ideal';

//       query.polish =
//         'Excellent';

//       query.symmetry =
//         'Excellent';
//     } else if (
//       smartOption === '3EX'
//     ) {
//       query.cut =
//         'Excellent';

//       query.polish =
//         'Excellent';

//       query.symmetry =
//         'Excellent';
//     } else if (
//       smartOption === '3VG+'
//     ) {
//       const acceptedGrades = [
//         'Very Good',
//         'Excellent',
//         'Ideal',
//       ];

//       query.cut = {
//         $in: acceptedGrades,
//       };

//       query.polish = {
//         $in: acceptedGrades,
//       };

//       query.symmetry = {
//         $in: acceptedGrades,
//       };
//     } else if (
//       smartOption ===
//       'New Arrivals'
//     ) {
//       const sevenDaysAgo =
//         new Date(
//           Date.now() -
//             7 *
//               24 *
//               60 *
//               60 *
//               1000,
//         );

//       query.sourceLastSyncAt = {
//         $gte: sevenDaysAgo,
//       };
//     } else {
//       if (dto.cuts?.length) {
//         query.cut = {
//           $in: dto.cuts,
//         };
//       }

//       if (dto.polish) {
//         query.polish =
//           dto.polish;
//       }

//       if (dto.symmetry) {
//         query.symmetry =
//           dto.symmetry;
//       }
//     }

//     if (
//       dto.minCarat !==
//         undefined ||
//       dto.maxCarat !==
//         undefined
//     ) {
//       query.carat = {};

//       if (
//         dto.minCarat !==
//         undefined
//       ) {
//         query.carat.$gte =
//           dto.minCarat;
//       }

//       if (
//         dto.maxCarat !==
//         undefined
//       ) {
//         query.carat.$lte =
//           dto.maxCarat;
//       }
//     }

//     if (
//       dto.minPrice !==
//         undefined ||
//       dto.maxPrice !==
//         undefined
//     ) {
//       query.totalPrice = {};

//       if (
//         dto.minPrice !==
//         undefined
//       ) {
//         query.totalPrice.$gte =
//           dto.minPrice;
//       }

//       if (
//         dto.maxPrice !==
//         undefined
//       ) {
//         query.totalPrice.$lte =
//           dto.maxPrice;
//       }
//     }

//     const lengthBand =
//       createNumericBand(
//         dto.length,
//       );

//     if (lengthBand) {
//       query.length =
//         lengthBand;
//     }

//     const widthBand =
//       createNumericBand(
//         dto.width,
//       );

//     if (widthBand) {
//       query.width = widthBand;
//     }

//     const ratioBand =
//       createNumericBand(
//         dto.lwRatio,
//       );

//     if (ratioBand) {
//       query.ratio = ratioBand;
//     }

//     const totalDepthBand =
//       createNumericBand(
//         dto.totalDepth,
//       );

//     if (totalDepthBand) {
//       query.depthPercent =
//         totalDepthBand;
//     }

//     const tableBand =
//       createNumericBand(
//         dto.table,
//       );

//     if (tableBand) {
//       query.tablePercent =
//         tableBand;
//     }

//     const depthBand =
//       createNumericBand(
//         dto.depth,
//       );

//     if (depthBand) {
//       query.height = depthBand;
//     }

//     if (dto.search?.trim()) {
//       const searchPattern =
//         new RegExp(
//           escapeRegex(
//             dto.search.trim(),
//           ),
//           'i',
//         );

//       query.$or = [
//         {
//           stoneNo:
//             searchPattern,
//         },

//         {
//           reportNo:
//             searchPattern,
//         },

//         {
//           shape:
//             searchPattern,
//         },

//         {
//           color:
//             searchPattern,
//         },

//         {
//           clarity:
//             searchPattern,
//         },
//       ];
//     }

//     const sortMap:
//       Record<
//         string,
//         Record<string, 1 | -1>
//       > = {
//       featured: {
//         carat: 1,
//         stoneNo: 1,
//       },

//       'price-low': {
//         totalPrice: 1,
//         stoneNo: 1,
//       },

//       'price-high': {
//         totalPrice: -1,
//         stoneNo: 1,
//       },

//       'carat-low': {
//         carat: 1,
//         stoneNo: 1,
//       },

//       'carat-high': {
//         carat: -1,
//         stoneNo: 1,
//       },
//     };

//     const sort =
//       sortMap[
//         dto.sort || 'featured'
//       ];

//     const [
//       databaseDiamonds,
//       totalRecords,
//     ] = await Promise.all([
//       this.diamondModel
//         .find(query)
//         .sort(sort)
//         .skip(
//           (page - 1) *
//             pageSize,
//         )
//         .limit(pageSize)
//         .select({
//           __v: 0,
//           raw: 0,

//           fullSyncRunId: 0,

//           availabilitySyncRunId:
//             0,
//         })
//         .lean()
//         .exec(),

//       this.diamondModel
//         .countDocuments(query)
//         .exec(),
//     ]);

//     const diamonds =
//       databaseDiamonds.map(
//         toFrontendDiamond,
//       );

//     return {
//       diamonds,

//       page,
//       pageSize,

//       totalRecords,

//       totalPages:
//         Math.ceil(
//           totalRecords /
//             pageSize,
//         ),

//       hasMore:
//         page * pageSize <
//         totalRecords,
//     };
//   }
// }



import {
  Injectable,
} from '@nestjs/common';

import {
  ConfigService,
} from '@nestjs/config';

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
  EASYSOFT_DB_CONNECTION,
  KIRA_DB_CONNECTION,
} from '../database/database.constants';

import {
  SearchInventoryDto,
} from './dto/search-inventory.dto';

function compareBySort(
  sort: Record<string, 1 | -1>,
) {
  return (
    a: Record<string, any>,
    b: Record<string, any>,
  ): number => {
    for (const [field, direction] of Object.entries(sort)) {
      const aValue = a[field];
      const bValue = b[field];

      if (aValue === bValue) {
        continue;
      }

      if (aValue === undefined) {
        return 1;
      }

      if (bValue === undefined) {
        return -1;
      }

      return aValue > bValue
        ? direction
        : -direction;
    }

    return 0;
  };
}

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

    return Number.isFinite(
      limit,
    )
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

    return Number.isFinite(
      limit,
    )
      ? {
          $gt: limit,
        }
      : undefined;
  }

  if (
    normalized.includes(
      ' - ',
    )
  ) {
    const [
      minimum,
      maximum,
    ] = normalized
      .split(' - ')
      .map(Number);

    if (
      Number.isFinite(
        minimum,
      ) &&
      Number.isFinite(
        maximum,
      )
    ) {
      return {
        $gte: minimum,
        $lte: maximum,
      };
    }
  }

  return undefined;
}

/*
 * =====================================================
 * CERTIFICATE URL
 * =====================================================
 *
 * Only Kira certificate URLs are replaced.
 *
 * Easysoft / IGI / other supplier certificate URLs
 * continue working normally.
 */
function createCertificateUrl(
  diamond: Record<
    string,
    any
  >,

  publicApiBaseUrl: string,
): string {
  const originalUrl =
    String(
      diamond.certificateUrl ||
        '',
    ).trim();

  const reportNo =
    String(
      diamond.reportNo ||
        '',
    ).trim();

  if (
    !originalUrl ||
    !reportNo
  ) {
    return originalUrl;
  }

  /*
   * Determine whether this URL belongs
   * specifically to Kira.
   */
  let isKiraUrl = false;

  try {
    const parsedUrl =
      new URL(
        originalUrl,
      );

    const hostname =
      parsedUrl.hostname
        .toLowerCase();

    isKiraUrl =
      hostname ===
        'api.kiradiam.com' ||
      hostname.endsWith(
        '.kiradiam.com',
      );
  } catch {
    /*
     * If the stored URL is malformed,
     * preserve it instead of modifying it.
     */
    return originalUrl;
  }

  /*
   * Easysoft or another supplier:
   * keep their normal certificate URL.
   */
  if (!isKiraUrl) {
    return originalUrl;
  }

  /*
   * Kira:
   * replace supplier URL with OUR API.
   */
  const certificatePath =
    `/api/inventory/certificate/${encodeURIComponent(
      reportNo,
    )}`;

  if (
    publicApiBaseUrl
  ) {
    return (
      publicApiBaseUrl +
      certificatePath
    );
  }

  return certificatePath;
}

function toFrontendDiamond(
  diamond: Record<
    string,
    any
  >,

  publicApiBaseUrl: string,
) {
  const certificateUrl =
    createCertificateUrl(
      diamond,
      publicApiBaseUrl,
    );

  return {
    id:
      diamond.stoneNo,

    stockId:
      diamond.stoneNo,

    certificateNumber:
      diamond.reportNo ||
      '',

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
            value !==
              null &&
            value !==
              undefined,
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

    /*
     * IMPORTANT:
     * Frontend now gets our proxy URL
     * for Kira certificates.
     */
    certificateUrl,

    certificate:
      certificateUrl,

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
  private readonly publicApiBaseUrl:
    string;

  constructor(
    @InjectModel(Diamond.name, KIRA_DB_CONNECTION)
    private readonly kiraDiamondModel:
      Model<DiamondDocument>,

    @InjectModel(Diamond.name, EASYSOFT_DB_CONNECTION)
    private readonly easysoftDiamondModel:
      Model<DiamondDocument>,

    private readonly configService:
      ConfigService,
  ) {
    /*
     * PUBLIC_API_BASE_URL is recommended.
     *
     * BRIGHT_BASE_URL is supported as a
     * fallback if you already use it.
     */
    this.publicApiBaseUrl =
      (
        this.configService.get<string>(
          'PUBLIC_API_BASE_URL',
        ) ||
        this.configService.get<string>(
          'BRIGHT_BASE_URL',
        ) ||
        ''
      )
        .trim()
        .replace(
          /\/+$/,
          '',
        );
  }

  async search(
    dto: SearchInventoryDto,
  ) {
    const page =
      Math.max(
        1,
        Number(dto.page) ||
          1,
      );

    const pageSize =
      Math.min(
        200,
        Math.max(
          1,
          Number(
            dto.pageSize,
          ) || 100,
        ),
      );

    const query:
      Record<
        string,
        any
      > = {
      isAvailable: true,
    };

    if (
      dto.shapes
        ?.length
    ) {
      query.shape = {
        $in:
          dto.shapes,
      };
    }

    if (
      dto.colors
        ?.length
    ) {
      query.color = {
        $in:
          dto.colors,
      };
    }

    if (
      dto.fancyColors
        ?.length
    ) {
      query.colorTinge = {
        $in:
          dto.fancyColors.map(
            (color) =>
              new RegExp(
                escapeRegex(
                  color,
                ),
                'i',
              ),
          ),
      };
    }

    if (
      dto.clarities
        ?.length
    ) {
      query.clarity = {
        $in:
          dto.clarities,
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
      query.lab =
        dto.lab;
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
      delete query
        .isAvailable;

      query.status =
        dto.availability
          .trim()
          .toUpperCase();
    }

    const smartOption =
      dto.smartOptions?.[0];

    if (
      smartOption ===
      'IDX'
    ) {
      query.cut =
        'Ideal';

      query.polish =
        'Excellent';

      query.symmetry =
        'Excellent';
    } else if (
      smartOption ===
      '3EX'
    ) {
      query.cut =
        'Excellent';

      query.polish =
        'Excellent';

      query.symmetry =
        'Excellent';
    } else if (
      smartOption ===
      '3VG+'
    ) {
      const acceptedGrades =
        [
          'Very Good',
          'Excellent',
          'Ideal',
        ];

      query.cut = {
        $in:
          acceptedGrades,
      };

      query.polish = {
        $in:
          acceptedGrades,
      };

      query.symmetry = {
        $in:
          acceptedGrades,
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

      query.sourceLastSyncAt =
        {
          $gte:
            sevenDaysAgo,
        };
    } else {
      if (
        dto.cuts
          ?.length
      ) {
        query.cut = {
          $in:
            dto.cuts,
        };
      }

      if (
        dto.polish
      ) {
        query.polish =
          dto.polish;
      }

      if (
        dto.symmetry
      ) {
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
      query.carat =
        {};

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
      query.totalPrice =
        {};

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
      query.width =
        widthBand;
    }

    const ratioBand =
      createNumericBand(
        dto.lwRatio,
      );

    if (ratioBand) {
      query.ratio =
        ratioBand;
    }

    const totalDepthBand =
      createNumericBand(
        dto.totalDepth,
      );

    if (
      totalDepthBand
    ) {
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
      query.height =
        depthBand;
    }

    if (
      dto.search
        ?.trim()
    ) {
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
        Record<
          string,
          1 | -1
        >
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
        dto.sort ||
          'featured'
      ];

    /*
     * Kira and Easysoft diamonds live in separate MongoDB
     * connections/collections, so a single DB-level sort+skip+limit
     * query cannot span both. Each source is asked for enough
     * documents to cover the requested page, the two result sets
     * are merged and re-sorted in memory, then sliced to the page.
     */
    const mergeLimit =
      page * pageSize;

    const projection = {
      __v: 0,
      raw: 0,

      fullSyncRunId: 0,

      availabilitySyncRunId: 0,
    };

    const [
      kiraDiamonds,
      kiraTotal,
      easysoftDiamonds,
      easysoftTotal,
    ] =
      await Promise.all(
        [
          this.kiraDiamondModel
            .find(query)
            .sort(sort)
            .limit(mergeLimit)
            .select(projection)
            .lean()
            .exec(),

          this.kiraDiamondModel
            .countDocuments(query)
            .exec(),

          this.easysoftDiamondModel
            .find(query)
            .sort(sort)
            .limit(mergeLimit)
            .select(projection)
            .lean()
            .exec(),

          this.easysoftDiamondModel
            .countDocuments(query)
            .exec(),
        ],
      );

    const totalRecords =
      kiraTotal + easysoftTotal;

    const databaseDiamonds =
      [
        ...kiraDiamonds,
        ...easysoftDiamonds,
      ]
        .sort(compareBySort(sort))
        .slice(
          (page - 1) * pageSize,
          (page - 1) * pageSize + pageSize,
        );

    const diamonds =
      databaseDiamonds.map(
        (diamond) =>
          toFrontendDiamond(
            diamond,
            this.publicApiBaseUrl,
          ),
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
        page *
          pageSize <
        totalRecords,
    };
  }
}