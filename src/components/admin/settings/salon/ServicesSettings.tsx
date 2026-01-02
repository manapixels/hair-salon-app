'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ServiceCategory, Service } from '@/types';
import { updateService, updateServiceCategory } from '@/lib/actions/services';
import { toast } from 'sonner';

export default function ServicesSettings() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/services');
      const data = (await response.json()) as ServiceCategory[];
      setCategories(data);
      if (data.length > 0) setActiveCategory(data[0].id);
    } catch (error) {
      console.error('Failed to fetch services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceUpdate = async (serviceId: string, updates: Partial<Service>) => {
    try {
      await updateService(serviceId, updates);
      toast.success('Service updated successfully');
      fetchCategories(); // Refresh data
    } catch (error) {
      console.error('Failed to update service:', error);
      toast.error('Failed to update service');
    }
  };

  const handleCategoryUpdate = async (categoryId: string, updates: Partial<ServiceCategory>) => {
    try {
      await updateServiceCategory(categoryId, updates);
      toast.success('Category updated successfully');
      fetchCategories(); // Refresh data
    } catch (error) {
      console.error('Failed to update category:', error);
      toast.error('Failed to update category');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Services & Pricing</h2>
        <p className="text-muted-foreground mt-1">
          Manage service details, pricing, and availability
        </p>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList
          className="grid w-full"
          style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}
        >
          {categories.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.shortTitle || cat.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.id} value={category.id} className="space-y-6">
            {/* Category Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>{category.title} - Category Settings</CardTitle>
                <CardDescription>
                  Overall settings for the {category.title} category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryForm
                  category={category}
                  onSave={updates => handleCategoryUpdate(category.id, updates)}
                />
              </CardContent>
            </Card>

            {/* Individual Services */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Services in this category</h3>
              {category.items.map(service => (
                <Card key={service.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{service.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ServiceForm
                      service={service}
                      onSave={updates => handleServiceUpdate(service.id, updates)}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// Category Form Component
function CategoryForm({
  category,
  onSave,
}: {
  category: ServiceCategory;
  onSave: (updates: Partial<ServiceCategory>) => void;
}) {
  const [formData, setFormData] = useState({
    title: category.title,
    description: category.description || '',
    priceRangeMin: category.priceRangeMin || 0,
    priceRangeMax: category.priceRangeMax || 0,
    estimatedDuration: category.estimatedDuration || 60,
    priceNote: category.priceNote || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Category Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
          <Input
            id="estimatedDuration"
            type="number"
            value={formData.estimatedDuration}
            onChange={e =>
              setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priceMin">Price Range Min ($)</Label>
          <Input
            id="priceMin"
            type="number"
            value={formData.priceRangeMin}
            onChange={e => setFormData({ ...formData, priceRangeMin: parseInt(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priceMax">Price Range Max ($)</Label>
          <Input
            id="priceMax"
            type="number"
            value={formData.priceRangeMax}
            onChange={e => setFormData({ ...formData, priceRangeMax: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priceNote">Price Note (shown in booking)</Label>
        <Input
          id="priceNote"
          value={formData.priceNote}
          onChange={e => setFormData({ ...formData, priceNote: e.target.value })}
          placeholder="e.g., From $20 (price varies by gender/age)"
        />
      </div>

      <Button type="submit">Save Category Settings</Button>
    </form>
  );
}

// Service Form Component
function ServiceForm({
  service,
  onSave,
}: {
  service: Service;
  onSave: (updates: Partial<Service>) => void;
}) {
  const [formData, setFormData] = useState({
    name: service.name,
    description: service.description || '',
    price: service.price,
    basePrice: service.basePrice,
    maxPrice: service.maxPrice || 0,
    duration: service.duration,
    processingWaitTime: service.processingWaitTime || 0,
    processingDuration: service.processingDuration || 0,
    isActive: service.isActive,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Service Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Display Price</Label>
          <Input
            id="price"
            value={formData.price}
            onChange={e => setFormData({ ...formData, price: e.target.value })}
            placeholder="e.g., $80-100"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="basePrice">Base Price ($)</Label>
          <Input
            id="basePrice"
            type="number"
            value={formData.basePrice}
            onChange={e => setFormData({ ...formData, basePrice: parseInt(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxPrice">Max Price ($)</Label>
          <Input
            id="maxPrice"
            type="number"
            value={formData.maxPrice}
            onChange={e => setFormData({ ...formData, maxPrice: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration}
            onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="isActive">Status</Label>
          <select
            id="isActive"
            value={formData.isActive ? 'active' : 'inactive'}
            onChange={e => setFormData({ ...formData, isActive: e.target.value === 'active' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Concurrent Scheduling Fields */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
        <div className="space-y-2">
          <Label htmlFor="processingWaitTime">Processing Wait Time (min)</Label>
          <Input
            id="processingWaitTime"
            type="number"
            value={formData.processingWaitTime}
            onChange={e =>
              setFormData({ ...formData, processingWaitTime: parseInt(e.target.value) || 0 })
            }
          />
          <p className="text-xs text-muted-foreground">
            Time from start until the stylist is free (e.g., application time)
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="processingDuration">Gap Duration (min)</Label>
          <Input
            id="processingDuration"
            type="number"
            value={formData.processingDuration}
            onChange={e =>
              setFormData({ ...formData, processingDuration: parseInt(e.target.value) || 0 })
            }
          />
          <p className="text-xs text-muted-foreground">
            Duration stylist is free to take other clients
          </p>
        </div>
      </div>

      <Button type="submit">Save Service</Button>
    </form>
  );
}
