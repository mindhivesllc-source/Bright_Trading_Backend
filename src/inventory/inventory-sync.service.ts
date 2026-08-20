// import {
//   BadGatewayException,
//   ConflictException,
//   Injectable,
//   Logger,
// } from '@nestjs/common';

// import {
//   InjectModel,
// } from '@nestjs/mongoose';

// import {
//   Model,
// } from 'mongoose';

// import {
//   randomUUID,
// } from 'node:crypto';

// import {
//   parse,
// } from 'csv-parse';

// import {
//   Diamond,
//   DiamondDocument,
// } from './schemas/diamond.schema';

// import {
//   KiraService,
// } from './kira.service';

// import {
//   mapKiraCsvRow,
// } from './kira-diamond.mapper';

// type MappedDiamond =
//   NonNullable<
//     ReturnType<
//       typeof mapKiraCsvRow
//     >
//   >;

// @Injectable()
// export class InventorySyncService {
//   private readonly logger =
//     new Logger(
//       InventorySyncService.name,
//     );

//   private fullSyncRunning =
//     false;

//   private availabilitySyncRunning =
//     false;

//   private processedRecords = 0;

//   private lastFullSyncStartedAt:
//     Date | null = null;

//   private lastFullSyncCompletedAt:
//     Date | null = null;

//   private lastFullSyncError:
//     string | null = null;

//   private lastAvailabilitySyncAt:
//     Date | null = null;

//   private lastAvailabilitySyncError:
//     string | null = null;

//   constructor(
//     @InjectModel(Diamond.name)
//     private readonly diamondModel:
//       Model<DiamondDocument>,

//     private readonly kiraService:
//       KiraService,
//   ) {}

//   getStatus() {
//     return {
//       fullSyncRunning:
//         this.fullSyncRunning,

//       availabilitySyncRunning:
//         this.availabilitySyncRunning,

//       processedRecords:
//         this.processedRecords,

//       lastFullSyncStartedAt:
//         this.lastFullSyncStartedAt,

//       lastFullSyncCompletedAt:
//         this.lastFullSyncCompletedAt,

//       lastFullSyncError:
//         this.lastFullSyncError,

//       lastAvailabilitySyncAt:
//         this.lastAvailabilitySyncAt,

//       lastAvailabilitySyncError:
//         this.lastAvailabilitySyncError,
//     };
//   }

//   startFullSync() {
//     if (this.fullSyncRunning) {
//       throw new ConflictException(
//         'Full inventory synchronization is already running.',
//       );
//     }

//     void this.syncFullInventory()
//       .catch((error) => {
//         this.logger.error(
//           'Background full inventory synchronization failed.',
//           error instanceof Error
//             ? error.stack
//             : String(error),
//         );
//       });

//     return {
//       started: true,

//       message:
//         'Full Kira inventory synchronization started.',

//       statusEndpoint:
//         '/api/inventory/admin/sync/status',
//     };
//   }

//   startAvailabilitySync() {
//     if (
//       this.availabilitySyncRunning
//     ) {
//       throw new ConflictException(
//         'Availability synchronization is already running.',
//       );
//     }

//     void this.syncAvailability()
//       .catch((error) => {
//         this.logger.error(
//           'Background availability synchronization failed.',
//           error instanceof Error
//             ? error.stack
//             : String(error),
//         );
//       });

//     return {
//       started: true,

//       message:
//         'Kira availability synchronization started.',
//     };
//   }

//   async syncFullInventory() {
//     if (this.fullSyncRunning) {
//       throw new ConflictException(
//         'Full inventory synchronization is already running.',
//       );
//     }

//     this.fullSyncRunning = true;

//     this.processedRecords = 0;

//     this.lastFullSyncStartedAt =
//       new Date();

//     this.lastFullSyncError = null;

//     const runId = randomUUID();

//     try {
//       const csvStream =
//         await this.kiraService.downloadFullInventoryCsv();

//       const parser = csvStream.pipe(
//         parse({
//           columns: true,

//           bom: true,

//           trim: true,

//           skip_empty_lines: true,

//           relax_quotes: true,

//           relax_column_count:
//             true,
//         }),
//       );

//       let batch:
//         MappedDiamond[] = [];

//       const databaseBatchSize =
//         750;

//       for await (
//         const rawRow of parser
//       ) {
//         const mappedDiamond =
//           mapKiraCsvRow(
//             rawRow as Record<
//               string,
//               unknown
//             >,
//           );

//         if (!mappedDiamond) {
//           continue;
//         }

//         batch.push(
//           mappedDiamond,
//         );

//         if (
//           batch.length >=
//           databaseBatchSize
//         ) {
//           await this.saveFullBatch(
//             batch,
//             runId,
//           );

//           this.processedRecords +=
//             batch.length;

//           this.logger.log(
//             `Imported ${this.processedRecords} Kira diamonds`,
//           );

//           batch = [];
//         }
//       }

//       if (batch.length > 0) {
//         await this.saveFullBatch(
//           batch,
//           runId,
//         );

//         this.processedRecords +=
//           batch.length;
//       }

//       if (
//         this.processedRecords === 0
//       ) {
//         throw new BadGatewayException(
//           'The Kira CSV response contained no valid diamond records.',
//         );
//       }

//       this.lastFullSyncCompletedAt =
//         new Date();

//       this.logger.log(
//         `Full inventory synchronization completed: ${this.processedRecords} diamonds`,
//       );

//       /*
//        * Run a live availability refresh
//        * after importing all full details.
//        */
//  if (!this.availabilitySyncRunning) {
//   try {
//     await this.syncAvailability();
//   } catch (availabilityError) {
//     this.logger.error(
//       'Full data imported, but availability refresh failed.',
//       availabilityError instanceof Error
//         ? availabilityError.stack
//         : String(availabilityError),
//     );
//   }
// } else {
//   this.logger.warn(
//     'Availability synchronization is already running. Skipping duplicate availability refresh.',
//   );
// }

//       return {
//         success: true,
//         runId,

//         processedRecords:
//           this.processedRecords,

//         completedAt:
//           this.lastFullSyncCompletedAt,
//       };
//     } catch (error) {
//       this.lastFullSyncError =
//         error instanceof Error
//           ? error.message
//           : String(error);

//       throw error;
//     } finally {
//       this.fullSyncRunning =
//         false;
//     }
//   }

//   private async saveFullBatch(
//   diamonds: MappedDiamond[],
//   runId: string,
// ): Promise<void> {
//   if (!diamonds.length) {
//     return;
//   }

//   const now = new Date();

//   const operations = diamonds.map(
//     (diamond) => ({
//       updateOne: {
//         filter: {
//           stoneNo: diamond.stoneNo,
//         },

//         update: {
//           $set: {
//             ...diamond,

//             hasFullDetails: true,
//             detailSource: "FULL",

//             fullSyncRunId: runId,
//             lastSeenAt: now,
//           },
//         },

//         upsert: true,
//       },
//     }),
//   );

//   const result =
//     await this.diamondModel.bulkWrite(
//       operations,
//       {
//         ordered: false,
//       },
//     );

//   this.logger.log(
//     `Full batch: inserted ${result.upsertedCount}, matched ${result.matchedCount}, modified ${result.modifiedCount}`,
//   );
// }

//   async syncAvailability() {
//     if (
//       this.availabilitySyncRunning
//     ) {
//       throw new ConflictException(
//         'Availability synchronization is already running.',
//       );
//     }

//     this.availabilitySyncRunning =
//       true;

//     this.lastAvailabilitySyncError =
//       null;

//     const runId = randomUUID();

//     const checkedAt =
//       new Date();

//     try {
//       const response =
//         await this.kiraService
//           .getAvailableStockLimited();

//       const availableStoneMap =
//         new Map<
//           string,
//           string | undefined
//         >();

//       response.forEach((stone) => {
//         const stoneNo =
//           String(
//             stone.stoneNo || '',
//           ).trim();

//         if (!stoneNo) {
//           return;
//         }

//         availableStoneMap.set(
//           stoneNo,

//           stone.reportNo
//             ? String(
//                 stone.reportNo,
//               )
//             : undefined,
//         );
//       });

//       const availableStones =
//         Array.from(
//           availableStoneMap.entries(),
//         ).map(
//           ([
//             stoneNo,
//             reportNo,
//           ]) => ({
//             stoneNo,
//             reportNo,
//           }),
//         );

//       if (
//         availableStones.length === 0
//       ) {
//         throw new BadGatewayException(
//           'Kira returned an empty availability list. Existing availability was not changed.',
//         );
//       }

//       /*
//        * Safety check.
//        *
//        * Prevent a partial or corrupted response
//        * from marking nearly the entire database
//        * unavailable.
//        */
//       const currentAvailableCount =
//         await this.diamondModel
//           .countDocuments({
//             isAvailable: true,
//           })
//           .exec();

//       if (
//         currentAvailableCount >
//           1000 &&
//         availableStones.length <
//           currentAvailableCount *
//             0.2
//       ) {
//         throw new BadGatewayException(
//           `Kira returned a suspiciously small availability list (${availableStones.length}). Existing availability was not changed.`,
//         );
//       }

//       const databaseBatchSize =
//         1000;

//       for (
//         let index = 0;
//         index <
//         availableStones.length;
//         index +=
//           databaseBatchSize
//       ) {
//         const batch =
//           availableStones.slice(
//             index,
//             index +
//               databaseBatchSize,
//           );

//        const operations =
//   batch.map((stone) => ({
//     updateOne: {
//       filter: {
//         stoneNo: stone.stoneNo,
//       },

//       update: {
//         /*
//          * These fields update BOTH
//          * complete and incomplete stones.
//          */
//         $set: {
//           ...(stone.reportNo
//             ? {
//                 reportNo:
//                   stone.reportNo,
//               }
//             : {}),

//           status: "AVAILABLE",

//           isAvailable: true,

//           availabilitySyncRunId:
//             runId,

//           lastAvailabilityCheckedAt:
//             checkedAt,
//         },

//         /*
//          * These values are used ONLY when
//          * MongoDB creates a new document.
//          *
//          * Therefore an existing FULL diamond
//          * will never be downgraded to LIMITED.
//          */
//         $setOnInsert: {
//           hasFullDetails: false,

//           detailSource: "LIMITED",
//         },
//       },

//       /*
//        * IMPORTANT:
//        * Create StoneNo-only documents when
//        * they don't exist yet.
//        */
//       upsert: true,
//     },
//   }));

//         await this.diamondModel
//           .bulkWrite(
//             operations,
//             {
//               ordered: false,
//             },
//           );
//       }

//       /*
//        * Only run this after successfully
//        * processing the complete response.
//        */
//       const unavailableResult =
//         await this.diamondModel
//           .updateMany(
//             {
//               isAvailable: true,

//               availabilitySyncRunId: {
//                 $ne: runId,
//               },
//             },

//             {
//               $set: {
//                 status:
//                   'NOT AVAILABLE',

//                 isAvailable:
//                   false,

//                 lastAvailabilityCheckedAt:
//                   checkedAt,
//               },
//             },
//           )
//           .exec();

//       this.lastAvailabilitySyncAt =
//         checkedAt;

//       this.logger.log(
//         `Availability synchronization completed: ${availableStones.length} available, ${unavailableResult.modifiedCount} marked unavailable`,
//       );

//       return {
//         success: true,
//         runId,

//         availableRecords:
//           availableStones.length,

//         markedUnavailable:
//           unavailableResult
//             .modifiedCount,
//       };
//     } catch (error) {
//       this.lastAvailabilitySyncError =
//         error instanceof Error
//           ? error.message
//           : String(error);

//       throw error;
//     } finally {
//       this.availabilitySyncRunning =
//         false;
//     }
//   }
// }






import {
  BadGatewayException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  Model,
} from 'mongoose';

import {
  randomUUID,
} from 'node:crypto';

import {
  parse,
} from 'csv-parse';

import {
  Diamond,
  DiamondDocument,
} from './schemas/diamond.schema';

import {
  KiraService,
} from './kira.service';

import {
  EasysoftService,
} from './easysoft.service';

import {
  mapKiraCsvRow,
} from './kira-diamond.mapper';

import {
  mapEasysoftDiamond,
} from './easysoft-diamond.mapper';

import {
  buildEasysoftRunId,
  buildKiraManagedFilter,
  buildStaleEasysoftFilter,
} from './easysoft-sync.util';

type SyncDiamond = {
  stoneNo: string;
  reportNo?: string;
  status?: string;
  isAvailable?: boolean;
  [key: string]: unknown;
};

@Injectable()
export class InventorySyncService {
  private readonly logger =
    new Logger(
      InventorySyncService.name,
    );

  private fullSyncRunning =
    false;

  private availabilitySyncRunning =
    false;

  private processedRecords = 0;
  private kiraProcessedRecords = 0;
  private easysoftProcessedRecords = 0;

  private lastFullSyncStartedAt:
    Date | null = null;

  private lastFullSyncCompletedAt:
    Date | null = null;

  private lastFullSyncError:
    string | null = null;

  private lastAvailabilitySyncAt:
    Date | null = null;

  private lastAvailabilitySyncError:
    string | null = null;

  constructor(
    @InjectModel(Diamond.name)
    private readonly diamondModel:
      Model<DiamondDocument>,

    private readonly kiraService:
      KiraService,

    private readonly easysoftService:
      EasysoftService,
  ) {}

  getStatus() {
    return {
      fullSyncRunning:
        this.fullSyncRunning,

      availabilitySyncRunning:
        this.availabilitySyncRunning,

      processedRecords:
        this.processedRecords,

      kiraProcessedRecords:
        this.kiraProcessedRecords,

      easysoftProcessedRecords:
        this.easysoftProcessedRecords,

      easysoftEnabled:
        this.easysoftService.isEnabled(),

      lastFullSyncStartedAt:
        this.lastFullSyncStartedAt,

      lastFullSyncCompletedAt:
        this.lastFullSyncCompletedAt,

      lastFullSyncError:
        this.lastFullSyncError,

      lastAvailabilitySyncAt:
        this.lastAvailabilitySyncAt,

      lastAvailabilitySyncError:
        this.lastAvailabilitySyncError,
    };
  }

  startFullSync() {
    if (this.fullSyncRunning) {
      throw new ConflictException(
        'Full inventory synchronization is already running.',
      );
    }

    void this.syncFullInventory()
      .catch((error) => {
        this.logger.error(
          'Background full inventory synchronization failed.',
          error instanceof Error
            ? error.stack
            : String(error),
        );
      });

    return {
      started: true,

      message:
        this.easysoftService.isEnabled()
          ? 'Full Kira + Easysoft inventory synchronization started.'
          : 'Full Kira inventory synchronization started. Easysoft sync is disabled.',

      statusEndpoint:
        '/api/inventory/admin/sync/status',
    };
  }

  startAvailabilitySync() {
    if (
      this.availabilitySyncRunning
    ) {
      throw new ConflictException(
        'Availability synchronization is already running.',
      );
    }

    void this.syncAvailability()
      .catch((error) => {
        this.logger.error(
          'Background availability synchronization failed.',
          error instanceof Error
            ? error.stack
            : String(error),
        );
      });

    return {
      started: true,

      message:
        'Kira availability synchronization started.',
    };
  }

  async syncFullInventory() {
    if (this.fullSyncRunning) {
      throw new ConflictException(
        'Full inventory synchronization is already running.',
      );
    }

    this.fullSyncRunning = true;
    this.processedRecords = 0;
    this.kiraProcessedRecords = 0;
    this.easysoftProcessedRecords = 0;

    this.lastFullSyncStartedAt =
      new Date();

    this.lastFullSyncError = null;

    const runId = randomUUID();

    try {
      /* ==================================================
         1. KIRA FULL INVENTORY
      ================================================== */

      this.kiraProcessedRecords =
        await this.syncKiraFullInventory(
          runId,
        );

      this.processedRecords +=
        this.kiraProcessedRecords;

      /* ==================================================
         2. EASYSOFT FULL INVENTORY
      ================================================== */

      if (
        this.easysoftService.isEnabled()
      ) {
        this.easysoftProcessedRecords =
          await this.syncEasysoftFullInventory(
            runId,
          );

        this.processedRecords +=
          this.easysoftProcessedRecords;
      }

      if (
        this.processedRecords === 0
      ) {
        throw new BadGatewayException(
          'No valid diamond records were imported from any inventory source.',
        );
      }

      this.lastFullSyncCompletedAt =
        new Date();

      this.logger.log(
        `Full inventory synchronization completed: ${this.processedRecords} total diamonds (${this.kiraProcessedRecords} Kira, ${this.easysoftProcessedRecords} Easysoft)`,
      );

      /* ==================================================
         3. KIRA LIVE AVAILABILITY

         Easysoft records are excluded inside syncAvailability
         by the easysoft:* fullSyncRunId prefix.
      ================================================== */

      if (!this.availabilitySyncRunning) {
        try {
          await this.syncAvailability();
        } catch (availabilityError) {
          this.logger.error(
            'Full data imported, but Kira availability refresh failed.',
            availabilityError instanceof Error
              ? availabilityError.stack
              : String(availabilityError),
          );
        }
      } else {
        this.logger.warn(
          'Availability synchronization is already running. Skipping duplicate availability refresh.',
        );
      }

      return {
        success: true,
        runId,

        processedRecords:
          this.processedRecords,

        kiraProcessedRecords:
          this.kiraProcessedRecords,

        easysoftProcessedRecords:
          this.easysoftProcessedRecords,

        completedAt:
          this.lastFullSyncCompletedAt,
      };
    } catch (error) {
      this.lastFullSyncError =
        error instanceof Error
          ? error.message
          : String(error);

      throw error;
    } finally {
      this.fullSyncRunning =
        false;
    }
  }

  private async syncKiraFullInventory(
    runId: string,
  ): Promise<number> {
    const csvStream =
      await this.kiraService.downloadFullInventoryCsv();

    const parser = csvStream.pipe(
      parse({
        columns: true,
        bom: true,
        trim: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true,
      }),
    );

    let batch: SyncDiamond[] = [];
    let processed = 0;

    const databaseBatchSize = 750;

    for await (
      const rawRow of parser
    ) {
      const mappedDiamond =
        mapKiraCsvRow(
          rawRow as Record<
            string,
            unknown
          >,
        );

      if (!mappedDiamond) {
        continue;
      }

      batch.push(
        mappedDiamond as SyncDiamond,
      );

      if (
        batch.length >=
        databaseBatchSize
      ) {
        await this.saveFullBatch(
          batch,
          runId,
        );

        processed += batch.length;

        this.logger.log(
          `Imported ${processed} Kira diamonds`,
        );

        batch = [];
      }
    }

    if (batch.length > 0) {
      await this.saveFullBatch(
        batch,
        runId,
      );

      processed += batch.length;
    }

    if (processed === 0) {
      throw new BadGatewayException(
        'The Kira CSV response contained no valid diamond records.',
      );
    }

    return processed;
  }

  private async syncEasysoftFullInventory(
    parentRunId: string,
  ): Promise<number> {
    const rawRecords =
      await this.easysoftService.getDiamondList();

    if (rawRecords.length === 0) {
      throw new BadGatewayException(
        'Easysoft returned an empty inventory list. Existing Easysoft records were not changed.',
      );
    }

    const easysoftRunId =
      buildEasysoftRunId(
        parentRunId,
      );

    const currentEasysoftCount =
      await this.diamondModel
        .countDocuments({
          fullSyncRunId: {
            $regex: /^easysoft:/,
          },
        })
        .exec();

    let batch: SyncDiamond[] = [];
    let processed = 0;

    const databaseBatchSize = 750;

    for (const rawRow of rawRecords) {
      const mappedDiamond =
        mapEasysoftDiamond(rawRow);

      if (!mappedDiamond) {
        continue;
      }

      batch.push(
        mappedDiamond as SyncDiamond,
      );

      if (
        batch.length >=
        databaseBatchSize
      ) {
        await this.saveFullBatch(
          batch,
          easysoftRunId,
        );

        processed += batch.length;

        this.logger.log(
          `Imported ${processed} Easysoft diamonds`,
        );

        batch = [];
      }
    }

    if (batch.length > 0) {
      await this.saveFullBatch(
        batch,
        easysoftRunId,
      );

      processed += batch.length;
    }

    if (processed === 0) {
      throw new BadGatewayException(
        'The Easysoft response contained no valid diamond records.',
      );
    }

    /*
     * Safety guard before changing old Easysoft rows.
     * If a normally large feed suddenly returns less than 20%,
     * do not mark the missing rows unavailable.
     */
    const suspiciouslySmall =
      currentEasysoftCount > 100 &&
      processed < currentEasysoftCount * 0.2;

    if (suspiciouslySmall) {
      this.logger.warn(
        `Easysoft returned only ${processed} records while ${currentEasysoftCount} Easysoft records already exist. Old Easysoft availability was not changed.`,
      );

      return processed;
    }

    const staleEasysoftResult =
      await this.diamondModel
        .updateMany(
          {
            isAvailable: true,
            ...buildStaleEasysoftFilter(
              easysoftRunId,
            ),
          },
          {
            $set: {
              status:
                'NOT AVAILABLE',
              isAvailable: false,
              lastAvailabilityCheckedAt:
                new Date(),
            },
          },
        )
        .exec();

    this.logger.log(
      `Easysoft synchronization completed: ${processed} imported, ${staleEasysoftResult.modifiedCount} old Easysoft records marked unavailable`,
    );

    return processed;
  }

  private async saveFullBatch(
    diamonds: SyncDiamond[],
    runId: string,
  ): Promise<void> {
    if (!diamonds.length) {
      return;
    }

    const now = new Date();

    const operations = diamonds.map(
      (diamond) => ({
        updateOne: {
          filter: {
            stoneNo:
              diamond.stoneNo,
          },

          update: {
            $set: {
              ...diamond,

              hasFullDetails: true,
              detailSource: 'FULL',

              fullSyncRunId:
                runId,

              lastSeenAt:
                now,
            },
          },

          upsert: true,
        },
      }),
    );

    const result =
      await this.diamondModel.bulkWrite(
        operations,
        {
          ordered: false,
        },
      );

    this.logger.log(
      `Full batch: inserted ${result.upsertedCount}, matched ${result.matchedCount}, modified ${result.modifiedCount}`,
    );
  }

  async syncAvailability() {
    if (
      this.availabilitySyncRunning
    ) {
      throw new ConflictException(
        'Availability synchronization is already running.',
      );
    }

    this.availabilitySyncRunning =
      true;

    this.lastAvailabilitySyncError =
      null;

    const runId = randomUUID();
    const checkedAt = new Date();

    try {
      const response =
        await this.kiraService
          .getAvailableStockLimited();

      const availableStoneMap =
        new Map<
          string,
          string | undefined
        >();

      response.forEach((stone) => {
        const stoneNo =
          String(
            stone.stoneNo || '',
          ).trim();

        if (!stoneNo) {
          return;
        }

        availableStoneMap.set(
          stoneNo,
          stone.reportNo
            ? String(
                stone.reportNo,
              )
            : undefined,
        );
      });

      const availableStones =
        Array.from(
          availableStoneMap.entries(),
        ).map(
          ([
            stoneNo,
            reportNo,
          ]) => ({
            stoneNo,
            reportNo,
          }),
        );

      if (
        availableStones.length === 0
      ) {
        throw new BadGatewayException(
          'Kira returned an empty availability list. Existing availability was not changed.',
        );
      }

      /*
       * IMPORTANT:
       * Count only Kira-managed rows.
       * Easysoft rows have fullSyncRunId beginning with easysoft:.
       */
      const currentAvailableCount =
        await this.diamondModel
          .countDocuments({
            isAvailable: true,
            ...buildKiraManagedFilter(),
          })
          .exec();

      if (
        currentAvailableCount >
          1000 &&
        availableStones.length <
          currentAvailableCount *
            0.2
      ) {
        throw new BadGatewayException(
          `Kira returned a suspiciously small availability list (${availableStones.length}). Existing Kira availability was not changed.`,
        );
      }

      const databaseBatchSize =
        1000;

      for (
        let index = 0;
        index <
        availableStones.length;
        index +=
          databaseBatchSize
      ) {
        const batch =
          availableStones.slice(
            index,
            index +
              databaseBatchSize,
          );

        const operations =
          batch.map((stone) => ({
            updateOne: {
              filter: {
                stoneNo:
                  stone.stoneNo,
              },

              update: {
                $set: {
                  ...(stone.reportNo
                    ? {
                        reportNo:
                          stone.reportNo,
                      }
                    : {}),

                  status:
                    'AVAILABLE',

                  isAvailable:
                    true,

                  availabilitySyncRunId:
                    runId,

                  lastAvailabilityCheckedAt:
                    checkedAt,
                },

                $setOnInsert: {
                  hasFullDetails:
                    false,

                  detailSource:
                    'LIMITED',
                },
              },

              upsert: true,
            },
          }));

        await this.diamondModel
          .bulkWrite(
            operations,
            {
              ordered: false,
            },
          );
      }

      /*
       * IMPORTANT:
       * Easysoft records are excluded here.
       * Otherwise the Kira availability list would mark every
       * Easysoft-only diamond NOT AVAILABLE.
       */
      const unavailableResult =
        await this.diamondModel
          .updateMany(
            {
              isAvailable: true,

              availabilitySyncRunId: {
                $ne: runId,
              },

              ...buildKiraManagedFilter(),
            },
            {
              $set: {
                status:
                  'NOT AVAILABLE',

                isAvailable:
                  false,

                lastAvailabilityCheckedAt:
                  checkedAt,
              },
            },
          )
          .exec();

      this.lastAvailabilitySyncAt =
        checkedAt;

      this.logger.log(
        `Kira availability synchronization completed: ${availableStones.length} available, ${unavailableResult.modifiedCount} Kira records marked unavailable`,
      );

      return {
        success: true,
        runId,

        availableRecords:
          availableStones.length,

        markedUnavailable:
          unavailableResult.modifiedCount,
      };
    } catch (error) {
      this.lastAvailabilitySyncError =
        error instanceof Error
          ? error.message
          : String(error);

      throw error;
    } finally {
      this.availabilitySyncRunning =
        false;
    }
  }
}