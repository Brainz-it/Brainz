import { useMemo } from 'react';
import { ApexOptions } from 'apexcharts';
import ReactApexChart from 'react-apexcharts';
import { type PlatformTimeseries } from '../../../shared/reelforge';
import { platformColor, platformLabel } from '../platform';

type TimeseriesChartProps = {
  title: string;
  timeseries: PlatformTimeseries[];
  metric: 'views' | 'watchTimeMinutes';
  unitLabel: string;
  isDark: boolean;
};

// One measure per chart, one series per platform (fixed identity colors) —
// two measures of different scale get two charts, never a dual axis.
export default function TimeseriesChart({ title, timeseries, metric, unitLabel, isDark }: TimeseriesChartProps) {
  const series = useMemo(
    () =>
      timeseries.map((ts) => ({
        name: platformLabel(ts.platform),
        data: ts.points.map((p) => ({ x: p.date, y: Math.round(p[metric]) })),
      })),
    [timeseries, metric]
  );
  const colors = timeseries.map((ts) => platformColor(ts.platform, isDark));
  const textColor = isDark ? '#AEB7C0' : '#64748B';

  const options: ApexOptions = {
    chart: {
      fontFamily: 'Satoshi, sans-serif',
      type: 'area',
      height: 320,
      toolbar: { show: false },
      background: 'transparent',
      zoom: { enabled: false },
    },
    colors,
    legend: {
      show: series.length > 1,
      position: 'top',
      horizontalAlign: 'left',
      labels: { colors: textColor },
    },
    stroke: { width: 2, curve: 'smooth' },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.25, opacityTo: 0.02 } },
    dataLabels: { enabled: false },
    markers: { size: 0, hover: { size: 5 } },
    grid: {
      borderColor: isDark ? '#2E3A47' : '#E2E8F0',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
    },
    xaxis: {
      type: 'datetime',
      labels: { style: { colors: textColor } },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        style: { colors: textColor },
        formatter: (value: number) =>
          value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} k` : `${Math.round(value)}`,
      },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      shared: true,
      intersect: false,
      x: { format: 'dd MMM yyyy' },
      y: { formatter: (value: number) => `${new Intl.NumberFormat('fr-FR').format(value)} ${unitLabel}` },
    },
  };

  return (
    <div className='rounded-sm border border-stroke bg-white px-5 pb-5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark'>
      <h4 className='mb-2 text-lg font-semibold text-black dark:text-white'>{title}</h4>
      {series.length === 0 ? (
        <p className='py-16 text-center text-sm text-body dark:text-bodydark'>
          Aucune donnée sur la période : connectez une chaîne ou lancez une synchronisation.
        </p>
      ) : (
        <ReactApexChart options={options} series={series} type='area' height={320} />
      )}
    </div>
  );
}
