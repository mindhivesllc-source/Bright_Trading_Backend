const SHAPE_MAP:
  Record<string, string> = {
  RB: 'Round',
  RD: 'Round',
  ROUND: 'Round',

  OV: 'Oval',
  OVAL: 'Oval',

  MQ: 'Marquise',
  MARQUISE: 'Marquise',

  PS: 'Pear',
  PE: 'Pear',
  PEAR: 'Pear',

  CU: 'Cushion',
  CUSHION: 'Cushion',

  EM: 'Emerald',
  EC: 'Emerald',
  EMERALD: 'Emerald',

  RA: 'Radiant',
  RAD: 'Radiant',
  RADIANT: 'Radiant',

  PR: 'Princess',
  PRINCESS: 'Princess',

  AS: 'Asscher',
  ASSCHER: 'Asscher',

  HT: 'Heart',
  HEART: 'Heart',
};

const GRADE_MAP:
  Record<string, string> = {
  ID: 'Ideal',
  IDEAL: 'Ideal',

  EX: 'Excellent',
  EXCELLENT: 'Excellent',

  VG: 'Very Good',
  VGOOD: 'Very Good',
  'VERY GOOD': 'Very Good',

  GD: 'Good',
  G: 'Good',
  GOOD: 'Good',

  FR: 'Fair',
  F: 'Fair',
  FAIR: 'Fair',
};

const FLUORESCENCE_MAP:
  Record<string, string> = {
  NON: 'None',
  NONE: 'None',

  FNT: 'Faint',
  FAINT: 'Faint',

  MED: 'Medium',
  MEDIUM: 'Medium',

  STG: 'Strong',
  STRONG: 'Strong',

  VST: 'Very Strong',
  'VERY STRONG': 'Very Strong',
};

function cleanText(
  value: unknown,
): string | undefined {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return undefined;
  }

  return String(value)
    .trim()
    .replaceAll('&amp;', '&');
}

function upperText(
  value: unknown,
): string {
  return String(value ?? '')
    .trim()
    .toUpperCase();
}

function toNumber(
  value: unknown,
): number | undefined {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : undefined;
}

function parseKiraDate(
  value: unknown,
): Date | undefined {
  const rawValue = cleanText(value);

  if (!rawValue) {
    return undefined;
  }

  /*
   * First try JavaScript-supported formats,
   * including CSV values such as:
   * 04/30/2026 17:45
   */
  const nativeDate = new Date(rawValue);

  if (
    !Number.isNaN(
      nativeDate.getTime(),
    )
  ) {
    return nativeDate;
  }

  /*
   * Fallback for DD/MM/YYYY values such as:
   * 30/03/2026
   */
  const match = rawValue.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/,
  );

  if (!match) {
    return undefined;
  }

  const [
    ,
    first,
    second,
    year,
    hour = '0',
    minute = '0',
  ] = match;

  const firstNumber =
    Number(first);

  const secondNumber =
    Number(second);

  let day: number;
  let month: number;

  if (firstNumber > 12) {
    day = firstNumber;
    month = secondNumber;
  } else if (
    secondNumber > 12
  ) {
    month = firstNumber;
    day = secondNumber;
  } else {
    /*
     * Ambiguous dates default to DD/MM/YYYY.
     */
    day = firstNumber;
    month = secondNumber;
  }

  const parsedDate = new Date(
    Number(year),
    month - 1,
    day,
    Number(hour),
    Number(minute),
  );

  return Number.isNaN(
    parsedDate.getTime(),
  )
    ? undefined
    : parsedDate;
}

export function mapKiraCsvRow(
  row: Record<string, unknown>,
) {
  const stoneNo =
    cleanText(row.StoneNo);

  if (!stoneNo) {
    return null;
  }

  const status =
    upperText(row.Status);

  const shapeCode =
    upperText(row.Shp);

  const cutCode =
    upperText(row.Cut);

  const polishCode =
    upperText(row.Pol);

  const symmetryCode =
    upperText(row.Sym);

  const fluorescenceCode =
    upperText(row.Flr);

  return {
    stoneNo,

    reportNo:
      cleanText(row.RepNo),

    srNo:
      toNumber(row.SrNo),

    status,

    isAvailable:
      status === 'AVAILABLE',

    shapeCode,

    shape:
      SHAPE_MAP[shapeCode] ||
      shapeCode ||
      undefined,

    carat:
      toNumber(row.Cts),

    color:
      cleanText(row.Col),

    colorTinge:
      cleanText(row.ColTinge),

    clarity:
      cleanText(row.Clr),

    cutCode,

    cut:
      GRADE_MAP[cutCode] ||
      cutCode ||
      undefined,

    polishCode,

    polish:
      GRADE_MAP[polishCode] ||
      polishCode ||
      undefined,

    symmetryCode,

    symmetry:
      GRADE_MAP[symmetryCode] ||
      symmetryCode ||
      undefined,

    fluorescenceCode,

    fluorescence:
      FLUORESCENCE_MAP[
        fluorescenceCode
      ] ||
      fluorescenceCode ||
      undefined,

    lab:
      cleanText(row.Lab),

    rapPrice:
      toNumber(row.Rap),

    discount:
      toNumber(row.Disc),

    pricePerCarat:
      toNumber(row.Price),

    totalPrice:
      toNumber(row.Amt),

    length:
      toNumber(row.Max),

    width:
      toNumber(row.Min),

    height:
      toNumber(row.Hgt),

    tablePercent:
      toNumber(row.Tbl),

    depthPercent:
      toNumber(row.TD),

    ratio:
      toNumber(row.LW),

    girdle:
      cleanText(row.Girdle),

    girdlePercent:
      toNumber(row.GirdlePer),

    crownAngle:
      toNumber(row.CA),

    crownHeight:
      toNumber(row.CH),

    pavilionAngle:
      toNumber(row.PA),

    pavilionDepth:
      toNumber(row.PD),

    culet:
      cleanText(row.Culet),

    kts:
      cleanText(row.KTS),

    location:
      cleanText(row.Loc),

    heartsAndArrows:
      cleanText(row.HAndA),

    luster:
      cleanText(row.Luster),

    remark:
      cleanText(row.Remark),

    blackInCenter:
      cleanText(row.BIC),

    blackInSide:
      cleanText(row.BIS),

    whiteInCenter:
      cleanText(row.WIC),

    laserInscription:
      cleanText(row.LI),

    certificateDateRaw:
      cleanText(row.CertDate),

    certificateType:
      cleanText(row.CertType),

    reportComment:
      cleanText(
        row.ReportComment,
      ),

    sourceLastSyncRaw:
      cleanText(
        row.lastSyncDate,
      ),

    sourceLastSyncAt:
      parseKiraDate(
        row.lastSyncDate,
      ),

    videoUrl:
      cleanText(row.video),

    certificateUrl:
      cleanText(
        row.certificate,
      ),

    imageUrl:
      cleanText(row.daylight),

    heartUrl:
      cleanText(row.heart),

    arrowUrl:
      cleanText(row.arrow),

    plottingUrl:
      cleanText(row.plotting),

    dimension:
      cleanText(row.dimension),

    raw: row,
  };
}