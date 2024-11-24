import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import './index.css';

import {
  Container,
  LoadingOverlay,
  MantineProvider,
  Table,
  Textarea,
  createTheme,
} from '@mantine/core';
import { analyze, round, scan } from './utils';
import { useEffect, useState } from 'react';

import { Analysis } from './type';
// import { SAMPLE_LOG } from './constant';
import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import timezone from 'dayjs/plugin/timezone';
import { useDisclosure } from '@mantine/hooks';
import utc from 'dayjs/plugin/utc';
import { BarChart, DonutChart, LineChart } from '@mantine/charts';

dayjs.extend(minMax);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault(dayjs.tz.guess());

const theme = createTheme({});

export default function App() {
  const [isLoading, setLoading] = useState(true);
  const [rawData, setRawData] = useState([]);
  const [dataByDate, setDataByDate] = useState<{ [day: string]: Date[] }>({});
  const [data, setData] = useState<{ [day: string]: number }>();
  const [analysis, setAnalysis] = useState<Analysis>({});
  const dateKeys = Object.keys(dataByDate);
  const [visible, { toggle }] = useDisclosure(true);
  const timeSeries = dateKeys.map((key) => ({
    date: key,
    duration: analysis.data?.[key],
    color:
      analysis.data?.[key] === 8
        ? 'green'
        : analysis.data?.[key] > 7
        ? 'yellow'
        : 'red',
  }));

  const main = (raw: string) => {
    setLoading(true);
    const { resultByDay } = scan(raw);
    setTimeout(() => {
      setLoading(false);
    }, 500);
    const result = analyze(resultByDay);
    setAnalysis(result);
    setDataByDate(resultByDay);
    setData(data);
  };

  useEffect(() => {
    main(rawData);
  }, [rawData]);

  return (
    <MantineProvider theme={theme}>
      <Container size='md'>
        <LoadingOverlay visible={isLoading} />
        <h1>Attendance Analysis</h1>

        <h2>Paste your logs here 👇</h2>
        <Textarea
          value={rawData}
          onChange={(e) => setRawData(e.target.value)}
          autosize
          maxRows={10}
          autoFocus
        />
        {dateKeys.length > 0 && (
          <>
            <h2>
              Analysis ({dateKeys.length} days from {dateKeys[0]} to{' '}
              {dateKeys[dateKeys.length - 1]})
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '12px' }}>Total days</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {analysis?.totalDays}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px' }}>Full count</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {analysis?.fullCount}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px' }}>Late count</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {analysis?.lateCount}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px' }}>Late percentage</div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color:
                      analysis?.latePercentage > 20
                        ? 'red'
                        : analysis?.latePercentage > 15
                        ? '#fbda05'
                        : 'green',
                  }}
                >
                  {round(analysis?.latePercentage)}%
                </div>
              </div>
            </div>
            <h2>Details</h2>
            <div style={{ display: 'flex' }}>
              <BarChart
                h={300}
                data={timeSeries}
                dataKey='date'
                series={[
                  { name: 'duration', color: 'indigo.6', label: 'Duration' },
                ]}
              />
              <DonutChart
                data={[
                  {
                    value: analysis?.fullCount,
                    color: 'teal.6',
                    name: 'Full',
                  },
                  {
                    value: analysis?.smallerThan7,
                    color: 'red.6',
                    name: '< 7 hours',
                  },
                  {
                    value: analysis?.from7To8,
                    color: 'yellow.6',
                    name: '>=7 hours',
                  },
                ]}
                paddingAngle={10}
                withLabelsLine
                labelsType='value'
                withLabels
              />
            </div>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>STT</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Duration</Table.Th>
                  <Table.Th>Records</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {Object.keys(dataByDate)
                  .reverse()
                  .map((key, index) => (
                    <Table.Tr
                      key={key}
                      style={{
                        color: analysis.data?.[key] === 8 ? 'green' : '',
                        backgroundColor:
                          analysis.data?.[key] === 8
                            ? ''
                            : analysis.data?.[key] > 7
                            ? '#f8e5b460'
                            : '#f8bfb45f',
                      }}
                    >
                      <Table.Td>
                        <strong>{index + 1}</strong>
                      </Table.Td>
                      <Table.Td>
                        <strong>{key}</strong>
                      </Table.Td>
                      <Table.Td>
                        <strong>{round(analysis.data?.[key])}</strong>
                      </Table.Td>
                      <Table.Td>
                        {dataByDate[key].map((d, index) => (
                          <div key={index}>
                            {dayjs(d).format('DD/MM/YYYY - HH:mm')}
                          </div>
                        ))}
                      </Table.Td>
                    </Table.Tr>
                  ))}
              </Table.Tbody>
            </Table>
          </>
        )}
      </Container>
    </MantineProvider>
  );
}
