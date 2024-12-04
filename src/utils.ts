import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

export type DataByDate = { [day: string]: Date[] };

const regex = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/gm;
/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/gm;

dayjs.extend(minMax);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault(dayjs.tz.guess());

export const getValidMoment = (records: Date[]) => {
  if (records?.length === 0) return [];
  const validStart = dayjs.max([
    dayjs.min(records.map((d) => dayjs(d).tz('Asia/Ho_Chi_Minh')))!,
    dayjs(records[0]).set('hour', 8).set('minute', 30),
  ]);
  const validEnd = dayjs.min([
    dayjs.max(records.map((d) => dayjs(d).tz('Asia/Ho_Chi_Minh')))!,
    dayjs(records[0]).set('hour', 18).set('minute', 0),
  ]);

  return [validStart, validEnd];
};

export const getValidDuration = (dataByDate: DataByDate, key: string) => {
  if (dataByDate[key]?.length < 2) return 0;
  const [validStart, validTo] = getValidMoment(dataByDate[key]);
  if (!validTo.isAfter(validStart)) return 0;
  // Subtract 1 hour for lunch break
  const morningHour = dayjs(key)
    .set('hour', 12)
    .set('minute', 0)
    .diff(validStart, 'hour', true);
  const afternoonHour = validTo.diff(
    dayjs.max([validStart, dayjs(key).set('hour', 13).set('minute', 0)]),
    'hour',
    true
  );
  const validDuration = Math.max(morningHour, 0) + afternoonHour;
  return Math.min(validDuration, 8);
};

export const scan = (rawData: string) => {
  let m;
  const result = [];
  const resultByDay = {} as { [day: string]: Date[] };
  while ((m = regex.exec(rawData)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    const currentDay = dayjs(m[0]);
    const key = currentDay.format('YYYY-MM-DD');
    const currentDate = currentDay.toDate();
    result.push(currentDate);
    resultByDay[key] = [...(resultByDay[key] || []), currentDate];
  }
  return {
    result,
    resultByDay,
  };
};

export const analyze = (
  dataNeedAnalyze: { [day: string]: Date[] },
  ignoreDates: Date[]
) => {
  let lateCount = 0;
  let fullCount = 0;
  let smallerThan7 = 0;
  let from7To8 = 0;
  let data = {} as { [day: string]: number };
  const totalDays = Object.keys(dataNeedAnalyze).length;
  for (const key in dataNeedAnalyze) {
    const duration = getValidDuration(dataNeedAnalyze, key);
    data[key] = duration;

    // if day is in ignoreDates, count consider as full day
    if (ignoreDates.some((d) => dayjs(key).isSame(d, 'date'))) {
      fullCount++;
      continue;
    }

    if (duration < 8) {
      if (key !== dayjs().format('YYYY-MM-DD')) {
        lateCount++;
        if (duration < 7) {
          smallerThan7++;
        } else {
          from7To8++;
        }
      }
    } else {
      fullCount++;
    }
  }
  const latePercentage = (lateCount / (lateCount + fullCount)) * 100;
  return {
    lateCount,
    fullCount,
    totalDays,
    latePercentage,
    data,
    smallerThan7,
    from7To8,
  };
};

export const round = (num = 0) => Math.round(num * 100) / 100;

// get today leave time
export const getTodayLeaveTime = (dataByDate: DataByDate) => {
  const today = dayjs().format('YYYY-MM-DD');
  const records = dataByDate[today] || [];
  const [validStart] = getValidMoment(records);
  return dayjs.min([
    validStart?.add(9, 'hour'),
    dayjs().set('hour', 18).set('minute', 0),
  ]);
};
