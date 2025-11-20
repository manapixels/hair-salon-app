import React from 'react';
import { Service } from '@/types';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Clock, Tag } from '@/lib/icons';
import Link from 'next/link';

interface ServiceCardProps {
  service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle className="text-xl font-serif">{service.name}</CardTitle>
            {service.subtitle && <p className="text-sm text-gray-500 mt-1">{service.subtitle}</p>}
          </div>
          <div className="text-lg font-semibold text-stone-900 whitespace-nowrap">
            {service.price}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1">
          {service.description && (
            <p className="text-gray-600 mb-4 leading-relaxed">{service.description}</p>
          )}

          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1.5" />
              {service.duration} mins
            </div>
            {service.tags && service.tags.length > 0 && (
              <div className="flex items-center gap-2">
                {service.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {service.addons && service.addons.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Available Add-ons
              </p>
              <ul className="space-y-1">
                {service.addons.map(addon => (
                  <li key={addon.id} className="text-sm text-gray-600 flex justify-between">
                    <span>{addon.name}</span>
                    <span className="text-gray-400">{addon.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link href="/?book=true" passHref legacyBehavior>
            <Button className="w-full" variant="solid">
              Book Now
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
