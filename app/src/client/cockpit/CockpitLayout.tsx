import { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import DarkModeSwitcher from '../admin/components/DarkModeSwitcher';

const tabs = [
  { to: '/cockpit', label: "Vue d'ensemble", exact: true },
  { to: '/cockpit/calendar', label: 'Calendrier' },
  { to: '/cockpit/channels', label: 'Chaînes' },
];

export default function CockpitLayout({ children }: { children: ReactNode }) {
  return (
    <div className='min-h-screen bg-whiten dark:bg-boxdark-2 dark:text-bodydark'>
      <header className='sticky top-0 z-10 border-b border-stroke bg-white dark:border-strokedark dark:bg-boxdark'>
        <div className='mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6 2xl:px-10'>
          <div className='flex items-center gap-3'>
            <Link to='/cockpit' className='text-title-sm font-bold text-black dark:text-white'>
              🎬 Reel Forge Cockpit
            </Link>
          </div>
          <nav className='flex items-center gap-1' aria-label='Navigation du cockpit'>
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                exact={tab.exact}
                className='rounded-md px-3 py-1.5 text-sm font-medium text-body hover:bg-gray-2 dark:text-bodydark dark:hover:bg-meta-4'
                activeClassName='bg-primary/10 !text-primary dark:bg-meta-4 dark:!text-white'
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
          <ul className='flex list-none items-center gap-4'>
            <DarkModeSwitcher />
            <li>
              <Link to='/account' className='text-sm text-body hover:text-primary dark:text-bodydark'>
                Mon compte
              </Link>
            </li>
          </ul>
        </div>
      </header>
      <main>
        <div className='mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10'>{children}</div>
      </main>
    </div>
  );
}
