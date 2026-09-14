'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, MapPin, ChevronDown } from 'lucide-react';

import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const categories = [
  'Event Equipment',
  'Electronics',
  'Photography',
  'Tools',
  'Musical Instruments',
  'Vehicles',
  'Sports Equipment',
  'Party Supplies',
];

export default function ListItemPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    dailyRate: '',
    location: '',
    description: '',
  });
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // TODO: Handle actual file upload
      console.log('Files selected:', files.length);
      // Mock: Add placeholder images
      const newImages = Array.from(files).map((file) => URL.createObjectURL(file));
      setSelectedImages([...selectedImages, ...newImages].slice(0, 5));
    }
  };

  const handleSubmit = () => {
    // TODO: Submit to API
    console.log('Publishing listing:', formData);
    router.push('/profile');
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-56">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-900" />
          </button>
          <h1 className="text-[17px] font-bold text-neutral-900">
            List an Item
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 pt-4 space-y-4">
        {/* Add Photos */}
        <div>
          <label className="block text-[12px] text-neutral-500 mb-2">
            Add Photos
          </label>
          <Card className="border-2 border-dashed border-neutral-300 bg-white overflow-hidden">
            <label className="flex flex-col items-center justify-center py-16 cursor-pointer hover:bg-neutral-50 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Camera className="w-10 h-10 text-primary-600 mb-2" strokeWidth={1.5} />
              <span className="text-primary-600 font-medium text-[14px] mb-1">
                + Add photos
              </span>
              <span className="text-neutral-400 text-[11px]">
                Up to 5 images, max 10MB each
              </span>
            </label>
          </Card>
          
          {/* Image Preview */}
          {selectedImages.length > 0 && (
            <div className="grid grid-cols-5 gap-2 mt-3">
              {selectedImages.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                  <img src={image} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Listing Title */}
        <div>
          <label className="block text-[12px] text-neutral-500 mb-2">
            Listing Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Professional Sound System & Mic"
            className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-[12px] text-neutral-500 mb-2">
            Category
          </label>
          <div className="relative">
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-[14px] text-neutral-900 appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
            >
              <option value="" className="text-neutral-400">Event Equipment</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>
        </div>

        {/* Daily Rate */}
        <div>
          <label className="block text-[12px] text-neutral-500 mb-2">
            Daily Rate
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-neutral-900 font-medium">
              ₦
            </span>
            <input
              type="text"
              value={formData.dailyRate}
              onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
              placeholder="15,000"
              className="w-full pl-8 pr-20 py-3 bg-white border border-neutral-200 rounded-xl text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-neutral-400">
              per day
            </span>
          </div>
        </div>

        {/* Pick-up Location */}
        <div>
          <label className="block text-[12px] text-neutral-500 mb-2">
            Pick-up Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-600" />
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ikeja GRA, Lagos"
              className="w-full pl-11 pr-4 py-3 bg-white border border-neutral-200 rounded-xl text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[12px] text-neutral-500 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your item, condition, what's included, etc."
            rows={4}
            className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-neutral-200 p-4 safe-area-bottom">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={handleSubmit}
        >
          Publish Listing
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
