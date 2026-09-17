'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// Mock data - will be replaced with API call
const mockConversations = [
  {
    id: '1',
    bookingId: 'booking-1',
    otherUser: {
      id: 'user-1',
      name: 'Segun A.',
      avatar: 'https://i.pravatar.cc/150?u=user1',
      status: 'online',
    },
    listing: {
      title: 'Party Canopy Tent',
      image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=100&h=100&fit=crop',
      dates: 'Oct 17 - Oct 19',
      price: 23500,
    },
    lastMessage: {
      text: 'It folds down into a carrying bag that is about 4 feet long...',
      timestamp: '09:47 AM',
      isRead: true,
      isFromMe: false,
    },
    bookingStatus: 'PENDING',
    unreadCount: 2,
  },
  {
    id: '2',
    bookingId: 'booking-2',
    otherUser: {
      id: 'user-2',
      name: 'Chioma B.',
      avatar: 'https://i.pravatar.cc/150?u=user2',
      status: 'offline',
    },
    listing: {
      title: 'Canon EOS R5 Camera',
      image: 'https://images.unsplash.com/photo-1606951687270-f2baf64f22bb?w=100&h=100&fit=crop',
      dates: 'Oct 20 - Oct 22',
      price: 50000,
    },
    lastMessage: {
      text: 'Thank you! Looking forward to it',
      timestamp: 'Yesterday',
      isRead: true,
      isFromMe: true,
    },
    bookingStatus: 'CONFIRMED',
    unreadCount: 0,
  },
];

export default function ChatsPage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-neutral-200 px-4 py-4">
        <h1 className="text-[18px] font-bold text-neutral-900">Chats</h1>
      </div>

      {/* Conversations List */}
      <div className="divide-y divide-neutral-100">
        {mockConversations.length > 0 ? (
          mockConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => router.push(`/chats/${conversation.id}`)}
              className="w-full p-4 hover:bg-neutral-50 transition-colors text-left"
            >
              {/* User Info */}
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <Image
                    src={conversation.otherUser.avatar}
                    alt={conversation.otherUser.name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                  {conversation.otherUser.status === 'online' && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-success-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-[15px] text-neutral-900">
                      {conversation.otherUser.name}
                    </h3>
                    <span className="text-[12px] text-neutral-400">
                      {conversation.lastMessage.timestamp}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] text-neutral-500 line-clamp-1 flex-1 mr-2">
                      {conversation.lastMessage.text}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <div className="w-5 h-5 bg-primary-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Listing Info */}
              <Card className="bg-neutral-50">
                <div className="flex items-center gap-3 p-2">
                  <Image
                    src={conversation.listing.image}
                    alt={conversation.listing.title}
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[13px] text-neutral-900 line-clamp-1">
                      {conversation.listing.title}
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      {conversation.listing.dates} • ₦{conversation.listing.price.toLocaleString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      conversation.bookingStatus === 'CONFIRMED'
                        ? 'success'
                        : conversation.bookingStatus === 'PENDING'
                        ? 'warning'
                        : 'default'
                    }
                    className="text-[10px] px-2 py-1"
                  >
                    {conversation.bookingStatus}
                  </Badge>
                </div>
              </Card>
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <p className="text-neutral-400 text-[14px] text-center">
              No conversations yet
            </p>
            <p className="text-neutral-400 text-[12px] text-center mt-2">
              Start renting to chat with owners
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
    </ProtectedRoute>
  );
}
