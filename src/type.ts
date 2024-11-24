export type Analysis = {
  lateCount?: number;
  fullCount?: number;
  data?: { [day: string]: number };
  totalDays?: number;
  latePercentage?: number;
  smallerThan7?: number;
  from7To8?: number;
};
