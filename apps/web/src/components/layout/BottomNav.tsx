'use client';

import { usePathname, useRouter } from 'next/navigation';

import { Home, PlusSquare, MessageSquare, User } from 'lucide-react';

import { cn } from '@/lib/utils';

const navItems = [
  { id: 'browse', label: 'Browse', icon: Home, path: '/' },
  { id: 'list', label: 'List Item', icon: PlusSquare, path: '/list-item' },
  { id: 'chats', label: 'Chats', icon: MessageSquare, path: '/chats' },
  { id: 'profile', label: 'My profile', icon: User, path: '/profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Determine active tab based on current path
  const getActiveTab = () => {
    if (pathname === '/') return 'browse';
    if (pathname.startsWith('/bookings')) return 'bookings';
    if (pathname.startsWith('/list-item')) return 'list';
    if (pathname.startsWith('/chats')) return 'chats';
    if (pathname.startsWith('/profile')) return 'profile';
    return 'browse';
  };

  const activeTab = getActiveTab();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50">
      <div className="flex items-center justify-around px-3 py-3 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center gap-1.5 min-w-[70px] transition-all"
            >
              <div className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center transition-colors',
                isActive ? 'bg-primary-600' : 'bg-transparent'
              )}>
                <Icon
                  className={cn(
                    'w-6 h-6 transition-colors',
                    isActive ? 'text-white stroke-[2.5]' : 'text-neutral-400 stroke-[2]'
                  )}
                />
              </div>
              <span className={cn(
                'text-[11px] font-medium transition-colors',
                isActive ? 'text-primary-600' : 'text-neutral-400'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Home Indicator - iOS style */}
      <div className="h-1 bg-neutral-300 rounded-full mx-auto w-28 mb-1" />
    </nav>
  );
}
