export type Analysis = {
  lateCount?: number;
  fullCount?: number;
  data?: { [day: string]: number };
  totalDays?: number;
  latePercentage?: number;
};
