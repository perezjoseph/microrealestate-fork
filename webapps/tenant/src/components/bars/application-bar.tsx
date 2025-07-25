import getServerEnv from '@/utils/env/server';
import { MainNav } from '@/components/bars/main-nav';
import { ThemeToggle } from '@microrealestate/commonui/components/ThemeToggle';
import UserMenu from './user-menu';

export default function ApplicationBar() {
  return (
    <nav className="container flex h-16 items-center justify-between p-0 pl-4">
      <MainNav appName={getServerEnv('APP_NAME') || ''} />
      <div className="flex items-center gap-2">
        <ThemeToggle size="sm" />
        <UserMenu />
      </div>
    </nav>
  );
}
