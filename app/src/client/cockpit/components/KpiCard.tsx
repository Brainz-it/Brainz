import { ReactNode } from 'react';

type KpiCardProps = {
  label: string;
  value: string;
  delta?: string | null;
  deltaLabel?: string;
  footer?: string;
  icon?: ReactNode;
  isLoading?: boolean;
};

export default function KpiCard({ label, value, delta, deltaLabel, footer, icon, isLoading }: KpiCardProps) {
  const deltaPositive = delta?.startsWith('+');
  return (
    <div className='rounded-sm border border-stroke bg-white px-6 py-5 shadow-default dark:border-strokedark dark:bg-boxdark'>
      <div className='flex items-start justify-between'>
        <div>
          <span className='text-sm font-medium text-body dark:text-bodydark'>{label}</span>
          <h3 className='mt-1.5 text-title-md font-bold text-black dark:text-white'>
            {isLoading ? '…' : value}
          </h3>
        </div>
        {icon && (
          <div className='flex h-11 w-11 items-center justify-center rounded-full bg-meta-2 text-primary dark:bg-meta-4'>
            {icon}
          </div>
        )}
      </div>
      {delta && (
        <p className='mt-2 text-sm text-body dark:text-bodydark'>
          <span className={deltaPositive ? 'font-medium text-meta-3' : 'font-medium text-meta-1'}>
            {deltaPositive ? '↑' : '↓'} {delta}
          </span>{' '}
          {deltaLabel ?? 'vs période précédente'}
        </p>
      )}
      {footer && !delta && <p className='mt-2 text-sm text-body dark:text-bodydark'>{footer}</p>}
    </div>
  );
}
