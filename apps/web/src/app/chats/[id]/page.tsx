'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Phone, Send } from 'lucide-react';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BottomNav } from '@/components/layout/BottomNav';

// Mock data - will be replaced with API call
const mockConversation = {
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
  bookingStatus: 'PENDING',
  messages: [
    {
      id: '1',
      text: 'Hi! I\'m interested in renting your canopy tent.',
      senderId: 'me',
      timestamp: '09:30 AM',
    },
    {
      id: '2',
      text: 'Hello! Great to hear from you. It\'s available for those dates.',
      senderId: 'user-1',
      timestamp: '09:32 AM',
    },
    {
      id: '3',
      text: 'Perfect! How easy is it to set up?',
      senderId: 'me',
      timestamp: '09:35 AM',
    },
    {
      id: '4',
      text: 'Very easy! Two people can set it up in about 15 minutes.',
      senderId: 'user-1',
      timestamp: '09:40 AM',
    },
    {
      id: '5',
      text: 'It folds down into a carrying bag that is about 4 feet long and I can help you load it.',
      senderId: 'user-1',
      timestamp: '09:47 AM',
    },
  ],
};

export default function ChatPage({ params: _params }: { params: { id: string } }) {
  const router = useRouter();
  const [messageText, setMessageText] = useState('');

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // TODO: Send message via API
      console.log('Sending message:', messageText);
      setMessageText('');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white flex flex-col pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => router.back()}
              className="p-1 -ml-1 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-700" />
            </button>
            <div className="relative">
              <Image
                src={mockConversation.otherUser.avatar}
                alt={mockConversation.otherUser.name}
                width={40}
                height={40}
                className="rounded-full"
              />
              {mockConversation.otherUser.status === 'online' && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-success-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[16px] font-semibold text-neutral-900 truncate">
                {mockConversation.otherUser.name}
              </h1>
              <p className="text-[12px] text-neutral-400">
                {mockConversation.otherUser.status === 'online' ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          <button className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <Phone className="w-5 h-5 text-neutral-700" />
          </button>
        </div>
      </div>

      {/* Booking Context Card */}
      <div className="px-4 pt-4 pb-2">
        <Card className="bg-neutral-50">
          <div className="flex items-center gap-3 p-3">
            <Image
              src={mockConversation.listing.image}
              alt={mockConversation.listing.title}
              width={56}
              height={56}
              className="rounded-lg"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-[14px] text-neutral-900 line-clamp-1 mb-1">
                {mockConversation.listing.title}
              </h4>
              <p className="text-[12px] text-neutral-500 mb-1">
                {mockConversation.listing.dates}
              </p>
              <p className="text-[13px] font-bold text-primary-600">
                ₦{mockConversation.listing.price.toLocaleString()}
              </p>
            </div>
            <Badge
              variant={
                mockConversation.bookingStatus === 'CONFIRMED'
                  ? 'success'
                  : mockConversation.bookingStatus === 'PENDING'
                  ? 'warning'
                  : 'default'
              }
              className="text-[10px] px-2 py-1"
            >
              {mockConversation.bookingStatus}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {mockConversation.messages.map((message) => {
          const isFromMe = message.senderId === 'me';
          return (
            <div
              key={message.id}
              className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] ${isFromMe ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    isFromMe
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-900'
                  }`}
                >
                  <p className="text-[14px] leading-relaxed">{message.text}</p>
                </div>
                <span className="text-[11px] text-neutral-400 mt-1 px-2">
                  {message.timestamp}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Message Input */}
      <div className="sticky bottom-16 bg-white border-t border-neutral-200 px-4 py-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-neutral-100 rounded-2xl px-4 py-2 min-h-[44px] flex items-center">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="w-full bg-transparent border-none outline-none text-[14px] text-neutral-900 placeholder:text-neutral-400"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            className="w-11 h-11 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 disabled:pointer-events-none transition-colors flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
    </ProtectedRoute>
  );
}
