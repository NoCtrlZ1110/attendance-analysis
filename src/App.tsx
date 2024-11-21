import { useEffect, useState } from 'react';
import './index.css';
import dayjs, { Date } from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(minMax);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault(dayjs.tz.guess());

const regex = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/gm;
/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/gm;

export default function App() {
  const [data, setData] = useState<Date[]>([]);
  const [dataByDate, setDataByDate] = useState<{ [day: string]: Date[] }>({});

  const getValidDuration = (key: string) => {
    if (dataByDate[key]?.length < 2) return 0;
    const validStart = dayjs.max([
      dayjs.min([...dataByDate[key]])!,
      dayjs(key).set('hour', 8).set('minute', 30),
    ]);
    console.log(`validStart[${key}]`, validStart.toLocaleString('vi-VN'));

    const validTo = dayjs.min([
      dayjs.min([...dataByDate[key]])!,
      dayjs(key).set('hour', 18).set('minute', 0),
    ]);

    console.log(`validTo[${key}]`, validTo.toLocaleString('vi-VN'));

    console.log(validStart.toDate());
    console.log(validTo.toDate());
    console.log(validStart.diff(validTo, 'hour'));
    return validStart.diff(validTo, 'hour', true);
  };

  const scan = (rawData: string) => {
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

    console.log(resultByDay);
    setData(result);
    setDataByDate(resultByDay);
  };

  return (
    <div className='App'>
      <h1>Attendance Analysis</h1>
      <h2>Paste your logs here</h2>
      <textarea onChange={(e) => scan(e.target.value)}></textarea>
      {Object.keys(dataByDate).map((key) => (
        <div key={key}>
          <div>
            {key} ({getValidDuration(key)})
          </div>
          <div>
            {dataByDate[key].map((d) => (
              <div>{d.toISOString()}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
