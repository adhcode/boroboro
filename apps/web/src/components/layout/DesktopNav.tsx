'use client';

import { useRouter } from 'next/navigation';
import { Camera, LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export function DesktopNav() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-transparent">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => router.push('/')} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-primary-600 font-bold text-[18px]">B</span>
            </div>
            <span className="text-[20px] font-bold text-white drop-shadow-lg">Boroboro</span>
          </button>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {/* User Name */}
                <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/30">
                  <UserIcon className="w-4 h-4 text-white" />
                  <span className="text-[14px] text-white font-medium">
                    {user.firstName} {user.lastName}
                  </span>
                </div>

                {/* List an Item Button */}
                <Button 
                  size="md" 
                  onClick={() => router.push('/list-item')}
                  className="bg-coral-500 hover:bg-coral-600 text-white font-semibold shadow-xl flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" strokeWidth={2} />
                  List an Item
                </Button>

                {/* Logout Button */}
                <Button 
                  variant="outline" 
                  size="md"
                  onClick={handleLogout}
                  className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="md"
                  onClick={() => router.push('/auth/signin')}
                  className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
                >
                  Sign In or Register
                </Button>
                <Button 
                  size="md" 
                  onClick={() => router.push('/list-item')}
                  className="bg-coral-500 hover:bg-coral-600 text-white font-semibold shadow-xl flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" strokeWidth={2} />
                  List an Item
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
