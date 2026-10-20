import { type GeoRow } from '../../../shared/reelforge';
import { countryName, formatNumber, formatWatchTime } from '../platform';

type GeoTableProps = {
  title: string;
  rows: GeoRow[];
  mode: 'country' | 'city';
};

export default function GeoTable({ title, rows, mode }: GeoTableProps) {
  const maxViews = Math.max(1, ...rows.map((r) => r.views));
  return (
    <div className='rounded-sm border border-stroke bg-white px-5 pb-5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark'>
      <h4 className='mb-4 text-lg font-semibold text-black dark:text-white'>{title}</h4>
      {rows.length === 0 ? (
        <p className='py-8 text-center text-sm text-body dark:text-bodydark'>
          Pas encore de données géographiques.
        </p>
      ) : (
        <table className='w-full'>
          <thead>
            <tr className='text-left text-sm text-body dark:text-bodydark'>
              <th className='pb-2 font-medium'>{mode === 'country' ? 'Pays' : 'Ville'}</th>
              <th className='pb-2 text-right font-medium'>Vues</th>
              <th className='hidden pb-2 text-right font-medium sm:table-cell'>Watch time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.country}-${row.city}`} className='border-t border-stroke dark:border-strokedark'>
                <td className='py-2.5 pr-2'>
                  <div className='text-sm font-medium text-black dark:text-white'>
                    {mode === 'country' ? countryName(row.country) : row.city}
                    {mode === 'city' && (
                      <span className='ml-1.5 text-xs text-body dark:text-bodydark'>{countryName(row.country)}</span>
                    )}
                  </div>
                  <div className='mt-1 h-1.5 w-full max-w-[160px] rounded-full bg-gray-2 dark:bg-meta-4'>
                    <div
                      className='h-1.5 rounded-full bg-primary'
                      style={{ width: `${Math.max(4, (row.views / maxViews) * 100)}%` }}
                      aria-hidden='true'
                    />
                  </div>
                </td>
                <td className='py-2.5 text-right text-sm text-black dark:text-white'>{formatNumber(row.views)}</td>
                <td className='hidden py-2.5 text-right text-sm text-body dark:text-bodydark sm:table-cell'>
                  {row.watchTimeMinutes > 0 ? formatWatchTime(row.watchTimeMinutes) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
