// export type EasysoftRawDiamond = Record<string, unknown>;

// function cleanText(value: unknown): string {
//   if (value === null || value === undefined) {
//     return "";
//   }

//   return String(value)
//     .replace(/<br\s*\/?\s*>/gi, " ")
//     .replace(/\s+/g, " ")
//     .trim();
// }

// function toNumber(value: unknown): number {
//   const text = cleanText(value).replace(/,/g, "");
//   const number = Number(text);

//   return Number.isFinite(number) ? number : 0;
// }

// function normalizeShape(value: unknown): string {
//   const raw = cleanText(value);

//   if (!raw) {
//     return "";
//   }

//   const normalized = raw
//     .toLowerCase()
//     .replace(/[_-]+/g, " ")
//     .replace(/\s+/g, " ")
//     .trim();

//   const shapeMap: Record<string, string> = {
//     rd: "Round",
//     round: "Round",
//     ov: "Oval",
//     oval: "Oval",
//     em: "Emerald",
//     emerald: "Emerald",
//     ps: "Pear",
//     pear: "Pear",
//     marquise: "Marquise",
//     mq: "Marquise",
//     cushion: "Cushion",
//     cu: "Cushion",
//     radiant: "Radiant",
//     rad: "Radiant",
//     princess: "Princess",
//     pr: "Princess",
//     asscher: "Asscher",
//     as: "Asscher",
//     heart: "Heart",
//     ht: "Heart",
//   };

//   if (shapeMap[normalized]) {
//     return shapeMap[normalized];
//   }

//   return normalized
//     .split(" ")
//     .filter(Boolean)
//     .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
//     .join(" ");
// }

// function normalizeFinish(value: unknown): string {
//   const raw = cleanText(value);
//   const normalized = raw
//     .toUpperCase()
//     .replace(/[_-]+/g, " ")
//     .replace(/\s+/g, " ")
//     .trim();

//   const finishMap: Record<string, string> = {
//     ID: "Ideal",
//     IDEAL: "Ideal",
//     EX: "Excellent",
//     EXCELLENT: "Excellent",
//     VG: "Very Good",
//     "VERY GOOD": "Very Good",
//     VGOOD: "Very Good",
//     G: "Good",
//     GD: "Good",
//     GOOD: "Good",
//     F: "Fair",
//     FR: "Fair",
//     FAIR: "Fair",
//   };

//   return finishMap[normalized] || raw;
// }

// function normalizeFluorescence(value: unknown): string {
//   const raw = cleanText(value);
//   const normalized = raw
//     .toUpperCase()
//     .replace(/[_-]+/g, " ")
//     .replace(/\s+/g, " ")
//     .trim();

//   const fluorescenceMap: Record<string, string> = {
//     N: "None",
//     NO: "None",
//     NON: "None",
//     NONE: "None",
//     F: "Faint",
//     FNT: "Faint",
//     FAINT: "Faint",
//     SLT: "Slight",
//     SLIGHT: "Slight",
//     M: "Medium",
//     MED: "Medium",
//     MEDIUM: "Medium",
//     S: "Strong",
//     STG: "Strong",
//     STRONG: "Strong",
//     VST: "Very Strong",
//     "VERY STRONG": "Very Strong",
//     VSTRONG: "Very Strong",
//   };

//   return fluorescenceMap[normalized] || raw;
// }

// function isAvailableValue(value: unknown): boolean {
//   const normalized = cleanText(value).toUpperCase();

//   if (!normalized) {
//     return false;
//   }

//   const availableValues = new Set([
//     'G',
//     'A',
//     'AVAILABLE',
//     'IN STOCK',
//     'INSTOCK',
//     'GOODS',
//     'GOOD',
//   ]);

//   return availableValues.has(normalized);
// }

// function joinLocation(row: EasysoftRawDiamond): string {
//   return [row.City, row.State, row.Country]
//     .map(cleanText)
//     .filter(Boolean)
//     .join(", ");
// }

// function parseSourceDate(value: unknown): Date | null {
//   const text = cleanText(value);

//   if (!text) {
//     return null;
//   }

//   const parsed = new Date(text);

//   return Number.isNaN(parsed.getTime()) ? null : parsed;
// }

// export function mapEasysoftDiamond(row: EasysoftRawDiamond) {
//   const stoneNo = cleanText(row["Stock #"]);

//   if (!stoneNo) {
//     return null;
//   }

//   const reportNo = cleanText(row["Certificate #"]);
//   const shapeRaw = cleanText(row.Shape);
//   const cutRaw = cleanText(row["Cut Grade"]);
//   const polishRaw = cleanText(row.Polish);
//   const symmetryRaw = cleanText(row.Symmetry);
//   const fluorescenceRaw = cleanText(row["Fluorescence Intensity"]);

//   const length = toNumber(row["Measurements Length"]);
//   const width = toNumber(row["Measurements Width"]);
//   const height = toNumber(row["Measurements Depth"]);
//   const ratio =
//     length > 0 && width > 0 ? Number((length / width).toFixed(4)) : 0;

//   const isAvailable = true;

//   const sourceLastSyncRaw =
//     cleanText(row["Certificate Updated At"]) || cleanText(row["Arrival Date"]);

//   const sourceLastSyncAt = parseSourceDate(sourceLastSyncRaw);

//   const fancyParts = [
//     cleanText(row["Fancy Color Intensity"]),
//     cleanText(row["Fancy Color"]),
//     cleanText(row["Fancy Color Overtone"]),
//   ].filter(Boolean);

//   return {
//     stoneNo,
//     reportNo,

//     status: "AVAILABLE",
//     isAvailable: true,

//     shape: normalizeShape(shapeRaw),
//     shapeCode: shapeRaw,

//     carat: toNumber(row.Weight),

//     color: cleanText(row.Color),
//     colorTinge: fancyParts.join(" "),
//     clarity: cleanText(row.Clarity),

//     cut: normalizeFinish(cutRaw),
//     cutCode: cutRaw,

//     polish: normalizeFinish(polishRaw),
//     polishCode: polishRaw,

//     symmetry: normalizeFinish(symmetryRaw),
//     symmetryCode: symmetryRaw,

//     fluorescence: normalizeFluorescence(fluorescenceRaw),
//     fluorescenceCode: fluorescenceRaw,

//     lab: cleanText(row.Lab),
//     certificateType: cleanText(row.Lab),

//     pricePerCarat: toNumber(row.Price),
//     totalPrice: toNumber(row["Total Price"]),

//     length,
//     width,
//     height,
//     ratio,

//     depthPercent: toNumber(row["Depth Percent"]),
//     tablePercent: toNumber(row["Table Percent"]),

//     dimension: cleanText(row.Measurements),

//     location: joinLocation(row),

//     imageUrl: cleanText(row["Image Link"]) || cleanText(row["Image Link 2"]),

//     videoUrl: cleanText(row["Video Link"]),
//     certificateUrl: cleanText(row["Certificate Url"]),

//     remark: cleanText(row["Member Comments"]) || cleanText(row["Cert Comment"]),

//     reportComment: cleanText(row["Cert Comment"]),

//     sourceLastSyncRaw,
//     sourceLastSyncAt,

//     growthType: cleanText(row["Growth Type"]),

//     raw: row,
//   };
// }



export type EasysoftRawDiamond =
  Record<string, unknown>;

function cleanText(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(
      /<br\s*\/?\s*>/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function toNumber(
  value: unknown,
): number {
  const text = cleanText(
    value,
  ).replace(/,/g, "");

  const number =
    Number(text);

  return Number.isFinite(
    number,
  )
    ? number
    : 0;
}

function normalizeShape(
  value: unknown,
): string {
  const raw =
    cleanText(value);

  if (!raw) {
    return "";
  }

  const normalized =
    raw
      .toLowerCase()
      .replace(
        /[_-]+/g,
        " ",
      )
      .replace(
        /\s+/g,
        " ",
      )
      .trim();

  const shapeMap:
    Record<string, string> = {
    rd: "Round",
    round: "Round",

    ov: "Oval",
    oval: "Oval",

    em: "Emerald",
    emerald: "Emerald",

    ps: "Pear",
    pear: "Pear",

    marquise:
      "Marquise",
    mq: "Marquise",

    cushion:
      "Cushion",
    cu: "Cushion",

    radiant:
      "Radiant",
    rad: "Radiant",

    princess:
      "Princess",
    pr: "Princess",

    asscher:
      "Asscher",
    as: "Asscher",

    heart: "Heart",
    ht: "Heart",
  };

  if (
    shapeMap[
      normalized
    ]
  ) {
    return shapeMap[
      normalized
    ];
  }

  /*
   * Keeps exotic Easysoft
   * shapes instead of dropping them.
   *
   * Example:
   * HEPTAGONAL MODIFIED STEP
   * ->
   * Heptagonal Modified Step
   */
  return normalized
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function normalizeFinish(
  value: unknown,
): string {
  const raw =
    cleanText(value);

  const normalized =
    raw
      .toUpperCase()
      .replace(
        /[_-]+/g,
        " ",
      )
      .replace(
        /\s+/g,
        " ",
      )
      .trim();

  const finishMap:
    Record<string, string> = {
    ID: "Ideal",
    IDEAL: "Ideal",

    EX: "Excellent",
    EXCELLENT:
      "Excellent",

    VG: "Very Good",
    "VERY GOOD":
      "Very Good",
    VGOOD:
      "Very Good",

    G: "Good",
    GD: "Good",
    GOOD: "Good",

    F: "Fair",
    FR: "Fair",
    FAIR: "Fair",
  };

  return (
    finishMap[
      normalized
    ] || raw
  );
}

function normalizeFluorescence(
  value: unknown,
): string {
  const raw =
    cleanText(value);

  const normalized =
    raw
      .toUpperCase()
      .replace(
        /[_-]+/g,
        " ",
      )
      .replace(
        /\s+/g,
        " ",
      )
      .trim();

  const fluorescenceMap:
    Record<string, string> = {
    N: "None",
    NO: "None",
    NON: "None",
    NONE: "None",

    F: "Faint",
    FNT: "Faint",
    FAINT: "Faint",

    SLT: "Slight",
    SLIGHT: "Slight",

    M: "Medium",
    MED: "Medium",
    MEDIUM:
      "Medium",

    S: "Strong",
    STG: "Strong",
    STRONG: "Strong",

    VST:
      "Very Strong",
    "VERY STRONG":
      "Very Strong",
    VSTRONG:
      "Very Strong",
  };

  return (
    fluorescenceMap[
      normalized
    ] || raw
  );
}

function joinLocation(
  row: EasysoftRawDiamond,
): string {
  return [
    row.City,
    row.State,
    row.Country,
  ]
    .map(cleanText)
    .filter(Boolean)
    .join(", ");
}

function parseSourceDate(
  value: unknown,
): Date | null {
  const text =
    cleanText(value);

  if (!text) {
    return null;
  }

  const parsed =
    new Date(text);

  return Number.isNaN(
    parsed.getTime(),
  )
    ? null
    : parsed;
}

export function mapEasysoftDiamond(
  row: EasysoftRawDiamond,
) {
  /*
   * ==========================================
   * IDENTIFICATION
   * ==========================================
   */

  const stoneNo =
    cleanText(
      row["Stock #"],
    );

  if (!stoneNo) {
    return null;
  }

  const reportNo =
    cleanText(
      row[
        "Certificate #"
      ],
    );

  /*
   * ==========================================
   * RAW GRADING VALUES
   * ==========================================
   */

  const shapeRaw =
    cleanText(
      row.Shape,
    );

  const cutRaw =
    cleanText(
      row[
        "Cut Grade"
      ],
    );

  const polishRaw =
    cleanText(
      row.Polish,
    );

  const symmetryRaw =
    cleanText(
      row.Symmetry,
    );

  const fluorescenceRaw =
    cleanText(
      row[
        "Fluorescence Intensity"
      ],
    );

  /*
   * ==========================================
   * MEASUREMENTS
   * ==========================================
   */

  const length =
    toNumber(
      row[
        "Measurements Length"
      ],
    );

  const width =
    toNumber(
      row[
        "Measurements Width"
      ],
    );

  const height =
    toNumber(
      row[
        "Measurements Depth"
      ],
    );

  const ratio =
    length > 0 &&
    width > 0
      ? Number(
          (
            length /
            width
          ).toFixed(
            4,
          ),
        )
      : 0;

  /*
   * ==========================================
   * COLOR
   * ==========================================
   */

  const colorRaw =
    cleanText(
      row.Color,
    );

  const fancyParts =
    [
      cleanText(
        row[
          "Fancy Color Intensity"
        ],
      ),

      cleanText(
        row[
          "Fancy Color"
        ],
      ),

      cleanText(
        row[
          "Fancy Color Overtone"
        ],
      ),
    ].filter(
      Boolean,
    );

  /*
   * Some Easysoft records put the complete
   * fancy color in the normal Color field:
   *
   * "FANCY VIVID PINK"
   *
   * while the dedicated Fancy Color fields
   * are empty.
   */
  const fancyColorFallback =
    /^FANCY\b/i.test(
      colorRaw,
    )
      ? colorRaw
      : "";

  const colorTinge =
    fancyParts.length >
    0
      ? fancyParts.join(
          " ",
        )
      : fancyColorFallback;

  /*
   * ==========================================
   * SOURCE DATE
   * ==========================================
   */

  const sourceLastSyncRaw =
    cleanText(
      row[
        "Certificate Updated At"
      ],
    ) ||
    cleanText(
      row[
        "Arrival Date"
      ],
    );

  const sourceLastSyncAt =
    parseSourceDate(
      sourceLastSyncRaw,
    );

  /*
   * ==========================================
   * AVAILABILITY
   * ==========================================
   *
   * Easysoft's diamond-list represents the
   * supplier's current inventory.
   *
   * Easysoft commonly returns:
   *
   * Availability: "NA"
   *
   * That value must NOT mean unavailable.
   *
   * InventorySyncService later marks stones
   * missing from a future feed unavailable
   * using fullSyncRunId.
   */

  return {
    stoneNo,

    reportNo,

    status:
      "AVAILABLE",

    isAvailable:
      true,

    /*
     * ========================================
     * BASIC DIAMOND DATA
     * ========================================
     */

    shape:
      normalizeShape(
        shapeRaw,
      ),

    shapeCode:
      shapeRaw,

    carat:
      toNumber(
        row.Weight,
      ),

    color:
      colorRaw,

    colorTinge,

    clarity:
      cleanText(
        row.Clarity,
      ),

    /*
     * ========================================
     * FINISH
     * ========================================
     */

    cut:
      normalizeFinish(
        cutRaw,
      ),

    cutCode:
      cutRaw,

    polish:
      normalizeFinish(
        polishRaw,
      ),

    polishCode:
      polishRaw,

    symmetry:
      normalizeFinish(
        symmetryRaw,
      ),

    symmetryCode:
      symmetryRaw,

    /*
     * ========================================
     * FLUORESCENCE
     * ========================================
     */

    fluorescence:
      normalizeFluorescence(
        fluorescenceRaw,
      ),

    fluorescenceCode:
      fluorescenceRaw,

    /*
     * ========================================
     * CERTIFICATION
     * ========================================
     */

    lab:
      cleanText(
        row.Lab,
      ),

    certificateType:
      cleanText(
        row.Lab,
      ),

    /*
     * ========================================
     * PRICE
     * ========================================
     */

    pricePerCarat:
      toNumber(
        row.Price,
      ),

    totalPrice:
      toNumber(
        row[
          "Total Price"
        ],
      ),

    /*
     * ========================================
     * MEASUREMENTS
     * ========================================
     */

    length,

    width,

    height,

    ratio,

    depthPercent:
      toNumber(
        row[
          "Depth Percent"
        ],
      ),

    tablePercent:
      toNumber(
        row[
          "Table Percent"
        ],
      ),

    dimension:
      cleanText(
        row.Measurements,
      ),

    /*
     * ========================================
     * LOCATION
     * ========================================
     */

    location:
      joinLocation(
        row,
      ),

    /*
     * ========================================
     * MEDIA
     * ========================================
     */

    imageUrl:
      cleanText(
        row[
          "Image Link"
        ],
      ) ||
      cleanText(
        row[
          "Image Link 2"
        ],
      ),

    videoUrl:
      cleanText(
        row[
          "Video Link"
        ],
      ),

    certificateUrl:
      cleanText(
        row[
          "Certificate Url"
        ],
      ),

    /*
     * ========================================
     * COMMENTS
     * ========================================
     */

    remark:
      cleanText(
        row[
          "Member Comments"
        ],
      ) ||
      cleanText(
        row[
          "Cert Comment"
        ],
      ),

    reportComment:
      cleanText(
        row[
          "Cert Comment"
        ],
      ),

    /*
     * ========================================
     * SOURCE INFO
     * ========================================
     */

    sourceLastSyncRaw,

    sourceLastSyncAt,

    growthType:
      cleanText(
        row[
          "Growth Type"
        ],
      ),

    /*
     * Kept for debugging/storage.
     * InventorySearchService removes it
     * from frontend responses.
     */
    raw: row,
  };
}