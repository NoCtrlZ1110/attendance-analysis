import '@mantine/core/styles.css';
import './index.css';

import {
  Container,
  LoadingOverlay,
  MantineProvider,
  Table,
  Textarea,
  createTheme,
} from '@mantine/core';
import { analyze, getValidDuration, round, scan } from './utils';
import { useEffect, useState } from 'react';

import { Analysis } from './type';
import { LineChart } from '@mantine/charts';
import { SAMPLE_LOG } from './constant';
import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import timezone from 'dayjs/plugin/timezone';
import { useDisclosure } from '@mantine/hooks';
import utc from 'dayjs/plugin/utc';

dayjs.extend(minMax);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault(dayjs.tz.guess());

const theme = createTheme({});

export default function App() {
  const [isLoading, setLoading] = useState(true);
  const [rawData, setRawData] = useState(SAMPLE_LOG);
  const [dataByDate, setDataByDate] = useState<{ [day: string]: Date[] }>({});
  const [data, setData] = useState<{ [day: string]: number }>();
  const [analysis, setAnalysis] = useState<Analysis>({});
  const dateKeys = Object.keys(dataByDate);
  const [visible, { toggle }] = useDisclosure(true);
  const timeSeries = dateKeys.map((key) => ({
    date: key,
    duration: analysis.data?.[key],
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

        <h2>Paste your logs here</h2>
        <Textarea
          value={rawData}
          onChange={(e) => setRawData(e.target.value)}
          autosize
          maxRows={10}
        />
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
                    ? 'yellow'
                    : 'green',
              }}
            >
              {round(analysis?.latePercentage)}%
            </div>
          </div>
        </div>
        <h2>Details</h2>

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
            {Object.keys(dataByDate).map((key, index) => (
              <Table.Tr
                key={key}
                style={{
                  color:
                    analysis.data?.[key] === 8
                      ? 'green'
                      : analysis.data?.[key] > 7
                      ? '#df9a3a'
                      : 'red',
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
      </Container>
    </MantineProvider>
  );
}
