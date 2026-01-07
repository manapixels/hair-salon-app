'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ServiceCategory, Service, ServiceAddon } from '@/types';
import {
  updateService,
  updateServiceCategory,
  createAddon,
  updateAddon,
  deleteAddon,
  deleteService,
} from '@/lib/actions/services';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

export default function ServicesSettings() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const activeCategoryRef = useRef(activeCategory);

  // Keep ref in sync with state
  useEffect(() => {
    activeCategoryRef.current = activeCategory;
  }, [activeCategory]);

  const fetchCategories = useCallback(async (preserveTab = false) => {
    const currentTab = activeCategoryRef.current; // Use ref to avoid dependency loop
    try {
      const response = await fetch('/api/services');
      const data = (await response.json()) as ServiceCategory[];
      setCategories(data);
      // Preserve tab position if requested and tab still exists
      if (preserveTab && currentTab && data.some(c => c.id === currentTab)) {
        // Tab is preserved - do nothing
      } else if (data.length > 0 && !activeCategoryRef.current) {
        setActiveCategory(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleServiceUpdate = async (serviceId: string, updates: Partial<Service>) => {
    try {
      await updateService(serviceId, updates);
      toast.success('Service updated successfully');
      fetchCategories(true); // Preserve tab position
    } catch (error) {
      console.error('Failed to update service:', error);
      toast.error('Failed to update service');
    }
  };

  const handleCategoryUpdate = async (categoryId: string, updates: Partial<ServiceCategory>) => {
    try {
      await updateServiceCategory(categoryId, updates);
      toast.success('Category updated successfully');
      fetchCategories(true); // Preserve tab position
    } catch (error) {
      console.error('Failed to update category:', error);
      toast.error('Failed to update category');
    }
  };

  const handleCreateAddon = async (
    serviceId: string,
    data: {
      name: string;
      price: string;
      basePrice: number;
      description?: string;
      duration?: number;
    },
  ) => {
    try {
      await createAddon({ serviceId, ...data });
      toast.success('Addon created successfully');
      fetchCategories(true); // Preserve tab position
    } catch (error) {
      console.error('Failed to create addon:', error);
      toast.error('Failed to create addon');
    }
  };

  const handleUpdateAddon = async (addonId: string, updates: Partial<ServiceAddon>) => {
    try {
      await updateAddon(addonId, updates);
      toast.success('Addon updated successfully');
      fetchCategories(true); // Preserve tab position
    } catch (error) {
      console.error('Failed to update addon:', error);
      toast.error('Failed to update addon');
    }
  };

  const handleDeleteAddon = async (addonId: string) => {
    if (!confirm('Are you sure you want to delete this addon?')) return;
    try {
      await deleteAddon(addonId);
      toast.success('Addon deleted successfully');
      fetchCategories(true); // Preserve tab position
    } catch (error) {
      console.error('Failed to delete addon:', error);
      toast.error('Failed to delete addon');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await deleteService(serviceId);
      toast.success('Service deleted successfully');
      fetchCategories(true);
    } catch (error) {
      console.error('Failed to delete service:', error);
      toast.error('Failed to delete service');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-1">Services & Pricing</h2>
        <p className="text-muted-foreground">Manage service details, pricing, and availability</p>
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
                  <CardContent className="space-y-6">
                    <ServiceForm
                      service={service}
                      onSave={updates => handleServiceUpdate(service.id, updates)}
                      onDelete={() => handleDeleteService(service.id)}
                    />

                    {/* Addons Section */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm text-gray-700">Addons / Variants</h4>
                        <AddAddonButton serviceId={service.id} onAdd={handleCreateAddon} />
                      </div>
                      {service.addons && service.addons.length > 0 ? (
                        <div className="space-y-2">
                          {service.addons.map(addon => (
                            <AddonRow
                              key={addon.id}
                              addon={addon}
                              onUpdate={handleUpdateAddon}
                              onDelete={handleDeleteAddon}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No addons configured</p>
                      )}
                    </div>
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
  onSave: (updates: Partial<ServiceCategory>) => Promise<void> | void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: category.title,
    description: category.description || '',
    priceRangeMin: category.priceRangeMin || 0,
    priceRangeMax: category.priceRangeMax || 0,
    estimatedDuration: category.estimatedDuration || 60,
    priceNote: category.priceNote || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
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

      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Category Settings'}
      </Button>
    </form>
  );
}

// Service Form Component
function ServiceForm({
  service,
  onSave,
  onDelete,
}: {
  service: Service;
  onSave: (updates: Partial<Service>) => Promise<void> | void;
  onDelete: () => Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
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

        <div className="flex justify-between gap-2 pt-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={isDeleting || isSaving}>
                {isDeleting ? 'Deleting...' : 'Delete Service'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the service and all its
                  addons from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={e => {
                    e.preventDefault();
                    handleDelete();
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button type="submit" disabled={isSaving || isDeleting}>
            {isSaving ? 'Saving...' : 'Save Service'}
          </Button>
        </div>
      </form>
    </>
  );
}

// Add Addon Button Component
function AddAddonButton({
  serviceId,
  onAdd,
}: {
  serviceId: string;
  onAdd: (
    serviceId: string,
    data: {
      name: string;
      price: string;
      basePrice: number;
      description?: string;
      duration?: number;
    },
  ) => Promise<void>;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    basePrice: 0,
    description: '',
    duration: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error('Name and price are required');
      return;
    }
    setIsSaving(true);
    try {
      await onAdd(serviceId, formData);
      setFormData({ name: '', price: '', basePrice: 0, description: '', duration: 0 });
      setIsAdding(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdding) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Add Addon
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 w-full bg-gray-50 p-3 rounded-md">
      <div className="w-[30%] space-y-1">
        <Label className="text-xs">Name</Label>
        <Input
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Men"
          className="h-8"
        />
      </div>
      <div className="flex-1 space-y-1">
        <Label className="text-xs">Description (Optional)</Label>
        <Input
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          placeholder="Short description"
          className="h-8"
        />
      </div>
      <div className="w-20 space-y-1">
        <Label className="text-xs">Price</Label>
        <Input
          value={formData.price}
          onChange={e => setFormData({ ...formData, price: e.target.value })}
          placeholder="$35"
          className="h-8"
        />
      </div>
      <div className="w-20 space-y-1">
        <Label className="text-xs">Base $</Label>
        <Input
          type="number"
          value={formData.basePrice}
          onChange={e => setFormData({ ...formData, basePrice: parseInt(e.target.value) || 0 })}
          className="h-8"
        />
      </div>
      <Button type="submit" size="sm" disabled={isSaving}>
        {isSaving ? '...' : 'Add'}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
        Cancel
      </Button>
    </form>
  );
}

// Addon Row Component
function AddonRow({
  addon,
  onUpdate,
  onDelete,
}: {
  addon: ServiceAddon;
  onUpdate: (addonId: string, updates: Partial<ServiceAddon>) => Promise<void>;
  onDelete: (addonId: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: addon.name,
    price: addon.price,
    basePrice: addon.basePrice,
    description: addon.description || '',
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(addon.id, formData);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
        <Input
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="h-8 w-[30%]"
        />
        <Input
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description"
          className="h-8 flex-1"
        />
        <Input
          value={formData.price}
          onChange={e => setFormData({ ...formData, price: e.target.value })}
          className="h-8 w-20"
        />
        <Input
          type="number"
          value={formData.basePrice}
          onChange={e => setFormData({ ...formData, basePrice: parseInt(e.target.value) || 0 })}
          className="h-8 w-16"
        />
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? '...' : 'Save'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-gray-50 p-2 rounded group">
      <div className="flex items-center gap-4">
        <span className="font-medium text-sm">{addon.name}</span>
        <span className="text-sm text-gray-600">{addon.price}</span>
        {addon.description && <span className="text-xs text-gray-500">{addon.description}</span>}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-red-500 hover:text-red-700"
          onClick={() => onDelete(addon.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
