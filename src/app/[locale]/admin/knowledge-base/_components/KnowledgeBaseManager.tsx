'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { toast } from 'sonner';
import { Delete, Plus } from '@/lib/icons';
import { useTranslations } from 'next-intl';

interface KBItem {
  id: string;
  question: string;
  answer: string;
  tags: string[];
}

export default function KnowledgeBaseManager() {
  const t = useTranslations('Admin.KnowledgeBase');
  const [items, setItems] = useState<KBItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newTags, setNewTags] = useState('');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/knowledge-base');
        if (response.ok) {
          const data = (await response.json()) as KBItem[];
          setItems(data);
        } else {
          toast.error(t('toasts.loadError'));
        }
      } catch (error) {
        toast.error(t('toasts.loadError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [t]);

  const handleAdd = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.error(t('toasts.requiredFields'));
      return;
    }

    try {
      const response = await fetch('/api/admin/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newQuestion,
          answer: newAnswer,
          tags: newTags
            .split(',')
            .map(t => t.trim())
            .filter(Boolean),
        }),
      });

      if (response.ok) {
        toast.success(t('toasts.addSuccess'));
        setNewQuestion('');
        setNewAnswer('');
        setNewTags('');
        setIsAdding(false);
        fetchItems();
      } else {
        toast.error(t('toasts.addError'));
      }
    } catch (error) {
      toast.error(t('toasts.addError'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      const response = await fetch(`/api/admin/knowledge-base?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(t('toasts.deleteSuccess'));
        setItems(items.filter(item => item.id !== id));
      } else {
        toast.error(t('toasts.deleteError'));
      }
    } catch (error) {
      toast.error(t('toasts.deleteError'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center">
        <Button onClick={() => setIsAdding(!isAdding)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('addNew')}
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>{t('addNewDialogTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('questionLabel')}</label>
              <Input
                value={newQuestion}
                onChange={(e: any) => setNewQuestion(e.target.value)}
                placeholder={t('questionPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('answerLabel')}</label>
              <textarea
                className="w-full p-2 border rounded-md"
                rows={4}
                value={newAnswer}
                onChange={e => setNewAnswer(e.target.value)}
                placeholder={t('answerPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('tagsLabel')}</label>
              <Input
                value={newTags}
                onChange={(e: any) => setNewTags(e.target.value)}
                placeholder={t('tagsPlaceholder')}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleAdd}>{t('save')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid gap-4">
          {items.map(item => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{item.question}</h3>
                    <p className="text-gray-600">{item.answer}</p>
                    <div className="flex gap-2 mt-2">
                      {item.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                      <Delete className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">{t('emptyState')}</div>
          )}
        </div>
      )}
    </div>
  );
}
