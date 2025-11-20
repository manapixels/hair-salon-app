'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { TextField } from '@/components/ui/TextField';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { toast } from 'sonner';
import { Delete, Edit, Plus } from '@/lib/icons';

interface KBItem {
  id: string;
  question: string;
  answer: string;
  tags: string[];
}

export default function KnowledgeBaseManager() {
  const [items, setItems] = useState<KBItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newTags, setNewTags] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/knowledge-base');
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      } else {
        toast.error('Failed to load knowledge base');
      }
    } catch (error) {
      toast.error('Error loading knowledge base');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.error('Question and Answer are required');
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
        toast.success('Item added successfully');
        setNewQuestion('');
        setNewAnswer('');
        setNewTags('');
        setIsAdding(false);
        fetchItems();
      } else {
        toast.error('Failed to add item');
      }
    } catch (error) {
      toast.error('Error adding item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/admin/knowledge-base?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Item deleted');
        setItems(items.filter(item => item.id !== id));
      } else {
        toast.error('Failed to delete item');
      }
    } catch (error) {
      toast.error('Error deleting item');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Knowledge Base</h2>
        <Button onClick={() => setIsAdding(!isAdding)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Q&A</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Question</label>
              <TextField
                value={newQuestion}
                onChange={(e: any) => setNewQuestion(e.target.value)}
                placeholder="e.g., What is your cancellation policy?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Answer</label>
              <textarea
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                rows={4}
                value={newAnswer}
                onChange={e => setNewAnswer(e.target.value)}
                placeholder="The answer the AI should give..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
              <TextField
                value={newTags}
                onChange={(e: any) => setNewTags(e.target.value)}
                placeholder="policy, booking, general"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd}>Save</Button>
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
                    <p className="text-gray-600 dark:text-gray-300">{item.answer}</p>
                    <div className="flex gap-2 mt-2">
                      {item.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs"
                        >
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
            <div className="text-center py-8 text-gray-500">
              No items in knowledge base. Add one to get started!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
