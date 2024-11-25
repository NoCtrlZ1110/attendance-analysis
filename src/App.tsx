import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import './index.css';

import {
  Button,
  Code,
  Container,
  LoadingOverlay,
  MantineProvider,
  Progress,
  Table,
  Textarea,
  createTheme,
} from '@mantine/core';
import { analyze, getTodayLeaveTime, round, scan } from './utils';
import { useEffect, useState } from 'react';

import { Analysis } from './type';
import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import duration from 'dayjs/plugin/duration';
import { BarChart, DonutChart } from '@mantine/charts';
import GithubIcon from './assets/github-mark.svg';

dayjs.extend(minMax);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.tz.setDefault(dayjs.tz.guess());

const theme = createTheme({});

export default function App() {
  const [isLoading, setLoading] = useState(true);
  const [rawData, setRawData] = useState('');
  const [dataByDate, setDataByDate] = useState<{ [day: string]: Date[] }>({});
  const [data, setData] = useState<{ [day: string]: number }>();
  const [analysis, setAnalysis] = useState<Analysis>({});
  const dateKeys = Object.keys(dataByDate);
  const todayKey = dayjs().format('YYYY-MM-DD');
  const hasToday = dateKeys.includes(todayKey);
  const todayStartTime = dataByDate[todayKey]?.[0];
  const todayLeaveTime = getTodayLeaveTime(dataByDate);
  const [todayProgress, setTodayProgress] = useState(0);
  const [remainingTime, setRemainingTime] = useState('');

  const timeSeries = dateKeys.map((key) => ({
    date: key,
    duration: analysis.data?.[key],
    color:
      analysis.data?.[key] === 8
        ? 'green'
        : (analysis.data?.[key] ?? 0) > 7
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

  const calculateProgress = () => {
    setTodayProgress(
      (dayjs().diff(todayStartTime, 'minute') /
        dayjs(todayLeaveTime).diff(todayStartTime, 'minute')) *
        100
    );
  };

  useEffect(() => {
    main(rawData);
  }, [rawData]);

  useEffect(() => {
    calculateProgress();
    const interval = setInterval(() => {
      calculateProgress();
    }, 1000);
    return () => clearInterval(interval);
  }, [todayStartTime, todayLeaveTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      const remain = dayjs.duration(dayjs(todayLeaveTime).diff(dayjs()));
      if (remain.asSeconds() <= 0) {
        setRemainingTime('00:00:00');
        return;
      }
      setRemainingTime(remain.format('HH:mm:ss'));
    }, 1000);

    return () => clearInterval(interval);
  }, [todayLeaveTime]);

  return (
    <MantineProvider theme={theme}>
      <Container size='md'>
        <LoadingOverlay visible={isLoading} />
        <header
          style={{
            display: 'flex',
            justifyItems: 'space-between',
            alignItems: 'center',
          }}
        >
          <h1 style={{ marginRight: 'auto' }}>Attendance Analysis</h1>
          <a
            href='https://github.com/NoCtrlZ1110/attendance-analysis'
            target='_blank'
          >
            <img src={GithubIcon} width={30} />
          </a>
        </header>
        <div
          style={{
            display: 'flex',
            justifyItems: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ marginRight: 'auto' }}>Paste your logs here 👇</h2>
          <Button
            disabled={rawData === ''}
            color='red'
            onClick={() => {
              setRawData('');
            }}
          >
            Clear all
          </Button>
        </div>
        <Textarea
          value={rawData}
          onChange={(e) => setRawData(e.target.value)}
          autosize
          maxRows={10}
          autoFocus
        />
        {hasToday && (
          <div>
            <h2>Today</h2>
            <div
              style={{
                display: 'flex',
                marginBottom: '1em',
                justifyContent: 'space-between',
              }}
            >
              <div>
                Today, you can leave at{' '}
                <strong>{todayLeaveTime.format('DD/MM/YYYY - HH:mm')}</strong>
              </div>
              <div>
                {remainingTime && (
                  <>
                    <strong> {remainingTime}</strong> remaining
                  </>
                )}
              </div>
            </div>

            <Progress.Root size={100}>
              <Progress.Section
                aria-label='Uploading progress'
                value={todayProgress}
              >
                <Progress.Label>{round(todayProgress)}%</Progress.Label>
              </Progress.Section>
            </Progress.Root>
          </div>
        )}
        {dateKeys.length > 0 && (
          <>
            <h2 style={{ display: 'flex' }}>
              Analysis
              <span style={{ fontSize: 18, marginLeft: 'auto' }}>
                {dateKeys.length} days from <Code>{dateKeys[0]}</Code> to{' '}
                <Code>{dateKeys[dateKeys.length - 1]}</Code>
              </span>
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
            <div>
              <div
                style={{
                  fontSize: 20,
                  marginTop: '1em',
                  color:
                    analysis?.latePercentage > 20
                      ? 'red'
                      : analysis?.latePercentage > 15
                      ? '#fbda05'
                      : 'green',
                }}
              >
                Evaluate:{' '}
                {(() => {
                  if (analysis?.latePercentage === undefined) return '';
                  if (analysis.latePercentage >= 50) return 'Very bad';
                  if (analysis.latePercentage >= 30) return 'Very risky';
                  if (analysis.latePercentage >= 20) return 'Risky';
                  if (analysis.latePercentage > 15) return 'Good';
                  return 'Very good';
                })()}
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
