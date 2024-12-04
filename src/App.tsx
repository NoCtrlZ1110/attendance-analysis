import { useEffect, useState } from 'react';

import dayjs from 'dayjs';

import utc from 'dayjs/plugin/utc';
import minMax from 'dayjs/plugin/minMax';
import { Calendar } from '@mantine/dates';
import timezone from 'dayjs/plugin/timezone';
import duration from 'dayjs/plugin/duration';
import { BarChart, DonutChart } from '@mantine/charts';
import {
  Button,
  Code,
  Container,
  createTheme,
  Divider,
  List,
  LoadingOverlay,
  MantineProvider,
  Progress,
  Table,
  Textarea,
} from '@mantine/core';

import { Analysis } from './type';
import GithubIcon from './assets/github-mark.svg';
import { analyze, getTodayLeaveTime, round, scan } from './utils';

import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/dates/styles.css';

import './index.css';

dayjs.extend(minMax);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.tz.setDefault(dayjs.tz.guess());

const theme = createTheme({});
const RAW_DATA_KEY = 'rawData';
const IGNORE_DATES_KEY = 'ignoreDates';

export default function App() {
  const [isLoading, setLoading] = useState(true);
  const [rawData, setRawData] = useState(
    localStorage.getItem(RAW_DATA_KEY) || ''
  );
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
  const [ignoreDates, setIgnoreDates] = useState<Date[]>(
    JSON.parse(localStorage.getItem(IGNORE_DATES_KEY) || '[]') || []
  );

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

  const main = (raw: string, isShowLoading = true) => {
    if (isShowLoading) {
      setLoading(true);
    }
    const { resultByDay } = scan(raw);

    setTimeout(() => {
      setLoading(false);
    }, 500);
    const result = analyze(resultByDay, ignoreDates);
    setAnalysis(result);
    setDataByDate(resultByDay);
    setData(data);
  };

  const calculateProgress = () => {
    setTodayProgress(
      Math.min(
        (dayjs().diff(todayStartTime, 'minute') /
          dayjs(todayLeaveTime).diff(todayStartTime, 'minute')) *
          100,
        100
      )
    );
  };

  const handleSelectIgnoreDate = (date: Date) => {
    const isSelected = ignoreDates.some((s) => dayjs(date).isSame(s, 'date'));
    if (isSelected) {
      setIgnoreDates((current) =>
        current.filter((d) => !dayjs(d).isSame(date, 'date'))
      );
    } else {
      setIgnoreDates((current) => [...current, date]);
    }
  };

  useEffect(() => {
    main(rawData, false);
    localStorage.setItem(IGNORE_DATES_KEY, JSON.stringify(ignoreDates));
  }, [ignoreDates]);

  useEffect(() => {
    main(rawData);
    localStorage.setItem('rawData', rawData);
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
      <Container
        size='md'
        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
      >
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
            color: '#d4380d',
            background: '#fff2e8',
            borderColor: '#ffbb96',
            padding: '0.5em 1em',
            borderRadius: '0.25em',
          }}
        >
          ⚠️ DISCLAIMER: Data from the tool is for reference only, not official
          HR data, and may differ from reality. ⚠️
        </div>
        <div
          style={{
            display: 'flex',
            gap: '2em',
          }}
        >
          <div
            style={{
              flexGrow: 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h2 style={{ marginRight: 'auto' }}>Paste your logs here 👇</h2>
              <Button
                disabled={rawData === ''}
                color='red'
                onClick={() => {
                  setRawData('');
                }}
              >
                Reset <RemoveIcon style={{ marginLeft: '0.5em' }} />
              </Button>
            </div>
            <Textarea
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              autosize
              maxRows={15}
              autoFocus
            />
            {!rawData && (
              <div>
                <h2>Guideline</h2>
                <ul>
                  <li>Step 1: Go to HR Attendance Bot chat on Slack</li>
                  <li>
                    Step 2: Scroll to get older messages and copy all logs
                  </li>
                  <li>
                    Step 3: Back to the tool interface and paste content into
                    the text area
                  </li>
                  <li>Done ✅</li>
                </ul>
                <img
                  src='https://lh3.googleusercontent.com/z4Arq8zdehq02PF43FNEAJCJ0lKrSOxpqMJyFtHcXyqYnFSOAj9se-QwGpaLMy_a_hQKvV6XvPrTkBZOA2ss9yM-P8sbLLg=rw-w0'
                  alt=''
                  style={{
                    maxWidth: '100%',
                  }}
                />
              </div>
            )}
          </div>
          <div>
            <h2 style={{ textAlign: 'center' }}>Ignore dates 🗓️</h2>
            <div style={{ maxWidth: 250, fontSize: '0.75em' }}>
              Ignore days you have requested for leave, late arrivals, early
              departures, etc. An ignored day will be counted as a full day
            </div>
            <Calendar
              getDayProps={(date) => ({
                selected: ignoreDates.some((s) =>
                  dayjs(date).isSame(s, 'date')
                ),
                onClick: () => handleSelectIgnoreDate(date),
              })}
            />
          </div>
        </div>
        {ignoreDates.length > 0 && (
          <>
            <Divider style={{ marginTop: '1em' }} />
            <div>
              <h3>Ignored dates</h3>
              <List>
                {ignoreDates.map((date, index) => (
                  <List.Item key={index}>
                    <div
                      style={{
                        display: 'inline-block',
                        width: 75,
                      }}
                    >
                      {dayjs(date).format('DD/MM/YYYY')}
                    </div>
                    <div
                      style={{
                        display: 'inline-block',
                        color: 'red',
                        cursor: 'pointer',
                        marginLeft: '1em',
                      }}
                      onClick={() => {
                        setIgnoreDates((current) =>
                          current.filter((d) => !dayjs(d).isSame(date, 'date'))
                        );
                      }}
                    >
                      <BackspaceIcon style={{ paddingTop: '0.25em' }} />
                    </div>
                  </List.Item>
                ))}
              </List>
            </div>
          </>
        )}
        {rawData && <Divider style={{ marginTop: '1em' }} />}
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
                    <strong> {remainingTime}</strong> remaining to go home
                  </>
                )}
              </div>
            </div>
            <div style={{ marginBottom: '1em' }}>Today progress 👇</div>
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
                      analysis?.latePercentage! > 20
                        ? 'red'
                        : analysis?.latePercentage! > 15
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
                    analysis?.latePercentage! > 20
                      ? 'red'
                      : analysis?.latePercentage! > 15
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
                    value: analysis?.fullCount!,
                    color: 'teal.6',
                    name: 'Full',
                  },
                  {
                    value: analysis?.smallerThan7!,
                    color: 'red.6',
                    name: '< 7 hours',
                  },
                  {
                    value: analysis?.from7To8!,
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
                            : analysis.data?.[key]! > 7
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
        <div style={{ padding: '1em' }} />
        <footer
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 'auto',
            padding: '1em',
          }}
        >
          <a href='#' title='page counter' style={{ marginRight: '1em' }}>
            <img
              src='https://counter6.optistats.ovh/private/freecounterstat.php?c=a4sgglx4nkf9cctfk3usbf7kwshbg1cd'
              title='page counter'
              alt='page counter'
            />
          </a>
          <a
            className='github-button'
            href='https://github.com/NoCtrlZ1110/attendance-analysis'
            data-color-scheme='no-preference: light; light: light; dark: dark;'
            data-icon='octicon-star'
            data-size='large'
            data-show-count='true'
            aria-label='Star NoCtrlZ1110/attendance-analysis on GitHub'
          >
            Star
          </a>
        </footer>
      </Container>
    </MantineProvider>
  );
}

const BackspaceIcon = (props: any) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='24'
    height='24'
    viewBox='0 0 24 24'
    fill='currentColor'
    className='icon icon-tabler icons-tabler-filled icon-tabler-backspace'
    {...props}
  >
    <path stroke='none' d='M0 0h24v24H0z' fill='none' />
    <path d='M20 5a2 2 0 0 1 1.995 1.85l.005 .15v10a2 2 0 0 1 -1.85 1.995l-.15 .005h-11a1 1 0 0 1 -.608 -.206l-.1 -.087l-5.037 -5.04c-.809 -.904 -.847 -2.25 -.083 -3.23l.12 -.144l5 -5a1 1 0 0 1 .577 -.284l.131 -.009h11zm-7.489 4.14a1 1 0 0 0 -1.301 1.473l.083 .094l1.292 1.293l-1.292 1.293l-.083 .094a1 1 0 0 0 1.403 1.403l.094 -.083l1.293 -1.292l1.293 1.292l.094 .083a1 1 0 0 0 1.403 -1.403l-.083 -.094l-1.292 -1.293l1.292 -1.293l.083 -.094a1 1 0 0 0 -1.403 -1.403l-.094 .083l-1.293 1.292l-1.293 -1.292l-.094 -.083l-.102 -.07z' />
  </svg>
);

const RemoveIcon = (props: any) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='24'
    height='24'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    stroke-width='2'
    stroke-linecap='round'
    stroke-linejoin='round'
    className='icon icon-tabler icons-tabler-outline icon-tabler-database-x'
    {...props}
  >
    <path stroke='none' d='M0 0h24v24H0z' fill='none' />
    <path d='M4 6c0 1.657 3.582 3 8 3s8 -1.343 8 -3s-3.582 -3 -8 -3s-8 1.343 -8 3' />
    <path d='M4 6v6c0 1.657 3.582 3 8 3c.537 0 1.062 -.02 1.57 -.058' />
    <path d='M20 13.5v-7.5' />
    <path d='M4 12v6c0 1.657 3.582 3 8 3c.384 0 .762 -.01 1.132 -.03' />
    <path d='M22 22l-5 -5' />
    <path d='M17 22l5 -5' />
  </svg>
);
