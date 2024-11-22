import { useEffect, useState } from 'react';
import './index.css';
import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { SAMPLE_LOG } from './constant';
import { analyze, getValidDuration, round, scan } from './utils';
import { Analysis } from './type';

dayjs.extend(minMax);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault(dayjs.tz.guess());

export default function App() {
  const [rawData, setRawData] = useState(SAMPLE_LOG);
  const [dataByDate, setDataByDate] = useState<{ [day: string]: Date[] }>({});
  const [data, setData] = useState<{ [day: string]: number }>();
  const [analysis, setAnalysis] = useState<Analysis>();
  const dateKeys = Object.keys(dataByDate);

  const main = (raw: string) => {
    const { resultByDay } = scan(raw);
    const result = analyze(resultByDay);
    setAnalysis(result);
    setDataByDate(resultByDay);
    setData(data);
  };

  useEffect(() => {
    main(rawData);
  }, [rawData]);

  return (
    <div className='App'>
      <h1>Attendance Analysis</h1>
      <h2>Paste your logs here</h2>
      <textarea value={rawData} onChange={(e) => setRawData(e.target.value)} />
      <h2>Analysis</h2>
      <div>
        <div>Full count: {analysis?.fullCount}</div>
        <div>Late count: {analysis?.lateCount}</div>
        <div>Total days: {analysis?.totalDays}</div>
        <div>Late percentage: {round(analysis?.latePercentage)}%</div>
      </div>
      <h2>Details</h2>

      {Object.keys(dataByDate).map((key) => (
        <div key={key} style={{ marginBottom: '1em' }}>
          <div style={{ marginBottom: '0.5em' }}>
            <strong>
              {key} ({round(getValidDuration(dataByDate, key))}h)
            </strong>
          </div>
          <div>
            {dataByDate[key].map((d) => (
              <div>{dayjs(d).format('DD/MM/YYYY - HH:mm')}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
