// import {
//   Prop,
//   Schema,
//   SchemaFactory,
// } from '@nestjs/mongoose';

// import {
//   HydratedDocument,
//   SchemaTypes,
// } from 'mongoose';

// export type DiamondDocument =
//   HydratedDocument<Diamond>;

// @Schema({
//   collection: 'diamonds',
//   timestamps: true,
// })
// export class Diamond {
//   @Prop({
//     required: true,
//     unique: true,
//     index: true,
//     trim: true,
//   })
//   stoneNo!: string;

//   @Prop({
//     index: true,
//     trim: true,
//   })
//   reportNo?: string;

// @Prop({
//   default: false,
//   index: true,
// })
// hasFullDetails!: boolean;

// @Prop({
//   enum: ["FULL", "LIMITED"],
//   default: "LIMITED",
//   index: true,
// })
// detailSource!: string;

//   @Prop({
//     type: Number,
//   })
//   srNo?: number;

//   @Prop({
//     index: true,
//   })
//   status?: string;

//   @Prop({
//     default: false,
//     index: true,
//   })
//   isAvailable!: boolean;

//   @Prop()
//   shapeCode?: string;

//   @Prop({
//     index: true,
//   })
//   shape?: string;

//   @Prop({
//     type: Number,
//     index: true,
//   })
//   carat?: number;

//   @Prop({
//     index: true,
//   })
//   color?: string;

//   @Prop()
//   colorTinge?: string;

//   @Prop({
//     index: true,
//   })
//   clarity?: string;

//   @Prop()
//   cutCode?: string;

//   @Prop({
//     index: true,
//   })
//   cut?: string;

//   @Prop()
//   polishCode?: string;

//   @Prop({
//     index: true,
//   })
//   polish?: string;

//   @Prop()
//   symmetryCode?: string;

//   @Prop({
//     index: true,
//   })
//   symmetry?: string;

//   @Prop()
//   fluorescenceCode?: string;

//   @Prop({
//     index: true,
//   })
//   fluorescence?: string;

//   @Prop({
//     index: true,
//   })
//   lab?: string;

//   @Prop({
//     type: Number,
//   })
//   rapPrice?: number;

//   @Prop({
//     type: Number,
//   })
//   discount?: number;

//   @Prop({
//     type: Number,
//     index: true,
//   })
//   pricePerCarat?: number;

//   @Prop({
//     type: Number,
//     index: true,
//   })
//   totalPrice?: number;

//   @Prop({
//     type: Number,
//   })
//   length?: number;

//   @Prop({
//     type: Number,
//   })
//   width?: number;

//   @Prop({
//     type: Number,
//   })
//   height?: number;

//   @Prop({
//     type: Number,
//   })
//   tablePercent?: number;

//   @Prop({
//     type: Number,
//   })
//   depthPercent?: number;

//   @Prop({
//     type: Number,
//   })
//   ratio?: number;

//   @Prop()
//   girdle?: string;

//   @Prop({
//     type: Number,
//   })
//   girdlePercent?: number;

//   @Prop({
//     type: Number,
//   })
//   crownAngle?: number;

//   @Prop({
//     type: Number,
//   })
//   crownHeight?: number;

//   @Prop({
//     type: Number,
//   })
//   pavilionAngle?: number;

//   @Prop({
//     type: Number,
//   })
//   pavilionDepth?: number;

//   @Prop()
//   culet?: string;

//   @Prop()
//   kts?: string;

//   @Prop()
//   location?: string;

//   @Prop()
//   heartsAndArrows?: string;

//   @Prop()
//   luster?: string;

//   @Prop()
//   remark?: string;

//   @Prop()
//   blackInCenter?: string;

//   @Prop()
//   blackInSide?: string;

//   @Prop()
//   whiteInCenter?: string;

//   @Prop()
//   laserInscription?: string;

//   @Prop()
//   certificateType?: string;

//   @Prop()
//   certificateDateRaw?: string;

//   @Prop()
//   reportComment?: string;

//   @Prop()
//   sourceLastSyncRaw?: string;

//   @Prop({
//     type: Date,
//     index: true,
//   })
//   sourceLastSyncAt?: Date;

//   @Prop()
//   videoUrl?: string;

//   @Prop()
//   certificateUrl?: string;

//   @Prop()
//   imageUrl?: string;

//   @Prop()
//   heartUrl?: string;

//   @Prop()
//   arrowUrl?: string;

//   @Prop()
//   plottingUrl?: string;

//   @Prop()
//   dimension?: string;

//   /*
//    * Identifies the last complete CSV
//    * synchronization that included this stone.
//    */
//   @Prop({
//     index: true,
//   })
//   fullSyncRunId?: string;

//   /*
//    * Identifies the last availability
//    * synchronization that included this stone.
//    */
//   @Prop({
//     index: true,
//   })
//   availabilitySyncRunId?: string;

//   @Prop({
//     type: Date,
//   })
//   lastSeenAt?: Date;

//   @Prop({
//     type: Date,
//   })
//   lastAvailabilityCheckedAt?: Date;

//   /*
//    * Keeps the complete original Kira row.
//    * It is stored in MongoDB but excluded
//    * from normal search responses.
//    */
//   @Prop({
//     type: SchemaTypes.Mixed,
//   })
//   raw?: Record<string, unknown>;
// }

// export const DiamondSchema =
//   SchemaFactory.createForClass(Diamond);

// /*
//  * Indexes for common searches.
//  */
// DiamondSchema.index({
//   isAvailable: 1,
//   shape: 1,
//   carat: 1,
//   stoneNo: 1,
// });

// DiamondSchema.index({
//   isAvailable: 1,
//   color: 1,
//   clarity: 1,
//   lab: 1,
// });

// DiamondSchema.index({
//   isAvailable: 1,
//   cut: 1,
//   polish: 1,
//   symmetry: 1,
// });

// DiamondSchema.index({
//   isAvailable: 1,
//   fluorescence: 1,
//   carat: 1,
// });

// DiamondSchema.index({
//   isAvailable: 1,
//   totalPrice: 1,
// });

// DiamondSchema.index({
//   isAvailable: 1,
//   sourceLastSyncAt: -1,
// });



