import { Search, Star, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardImage } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function ComponentsShowcase() {
  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <h1 className="text-3xl font-bold">Component Showcase</h1>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </div>
          <Button variant="primary" fullWidth>Full Width Button</Button>
        </section>

        {/* Inputs */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Inputs</h2>
          <Input placeholder="Basic input" />
          <Input
            placeholder="Search..."
            leftIcon={<Search className="w-5 h-5" />}
          />
          <Input
            type="email"
            placeholder="Email"
            disabled
          />
        </section>

        {/* Badges */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Badges</h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Default</Badge>
            <Badge variant="success">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent>
                <h3 className="font-semibold mb-2">Basic Card</h3>
                <p className="text-neutral-600 text-sm">
                  This is a basic card without hover effect.
                </p>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent>
                <h3 className="font-semibold mb-2">Hover Card</h3>
                <p className="text-neutral-600 text-sm">
                  This card has a hover effect with shadow transition.
                </p>
              </CardContent>
            </Card>

            <Card hover>
              <CardImage>
                <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600" />
              </CardImage>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="success">
                    <ShieldCheck className="w-3 h-3" />
                    VERIFIED
                  </Badge>
                </div>
                <h3 className="font-semibold mb-2">Card with Image</h3>
                <div className="flex items-center justify-between">
                  <span className="text-primary-600 font-bold">₦8,500</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">4.9</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Colors */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="h-20 rounded-xl bg-primary-600 mb-2" />
              <p className="text-sm font-medium">Primary 600</p>
            </div>
            <div>
              <div className="h-20 rounded-xl bg-neutral-900 mb-2" />
              <p className="text-sm font-medium">Neutral 900</p>
            </div>
            <div>
              <div className="h-20 rounded-xl bg-success-500 mb-2" />
              <p className="text-sm font-medium">Success 500</p>
            </div>
            <div>
              <div className="h-20 rounded-xl bg-neutral-50 border-2 border-neutral-200 mb-2" />
              <p className="text-sm font-medium">Neutral 50</p>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Typography</h2>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Heading 1 - Bold 30px</h1>
            <h2 className="text-2xl font-bold">Heading 2 - Bold 24px</h2>
            <h3 className="text-xl font-semibold">Heading 3 - Semibold 20px</h3>
            <p className="text-base text-neutral-900">Body text - Regular 16px</p>
            <p className="text-sm text-neutral-600">Small text - Regular 14px</p>
            <p className="text-xs text-neutral-500">Extra small - Regular 12px</p>
          </div>
        </section>
      </div>
    </div>
  );
}
