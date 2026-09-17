'use client';

import { usePathname, useRouter } from 'next/navigation';

import { Search, Camera, MessageCircle, UserCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

const navItems = [
  { id: 'browse', label: 'Browse', icon: Search, path: '/' },
  { id: 'list', label: 'List', icon: Camera, path: '/list-item' },
  { id: 'chats', label: 'Chats', icon: MessageCircle, path: '/chats' },
  { id: 'profile', label: 'Profile', icon: UserCircle, path: '/profile' },
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
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none px-6 pb-4">
      <nav className="mx-auto max-w-sm bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg shadow-neutral-900/10 border border-neutral-200/50 pointer-events-auto">
        <div className="flex items-center justify-around px-3 py-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className="flex flex-col items-center gap-1 px-2 py-1.5 transition-all duration-200 min-w-[55px]"
              >
                {/* Icon */}
                <Icon
                  className={cn(
                    'transition-all duration-200',
                    isActive ? 'w-6 h-6 text-primary-600' : 'w-6 h-6 text-neutral-800'
                  )}
                  strokeWidth={2}
                />
                
                {/* Label */}
                <span
                  className={cn(
                    'text-[9px] font-medium transition-all duration-200',
                    isActive ? 'text-primary-600' : 'text-neutral-800'
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
