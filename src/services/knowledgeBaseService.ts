import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateEmbedding, semanticSearch } from './vectorSearchService';

export interface QA {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  embedding?: number[];
}

/**
 * Search the knowledge base for relevant answers
 */
export const searchKnowledgeBase = async (query: string): Promise<string | null> => {
  const db = await getDb();
  const dbItems = await db.select().from(schema.knowledgeBase);

  if (dbItems.length === 0) return null;

  // Convert DB items to include embeddings
  const items = dbItems.map(item => ({
    id: item.id,
    question: item.question,
    answer: item.answer,
    tags: (item.tags as string[]) || [],
    embedding: item.embedding ? (item.embedding as unknown as number[]) : undefined,
  }));

  // Try vector search first
  const hasEmbeddings = items.some(item => item.embedding);
  if (hasEmbeddings) {
    const vectorResult = await semanticSearch(query, items, 0.7);
    if (vectorResult) {
      console.log(
        `[KB Search] Vector match: "${vectorResult.question}" (${vectorResult.score.toFixed(3)})`,
      );
      return vectorResult.answer;
    }
  }

  // Fallback to keyword search
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/).filter(w => w.length > 3);

  const exactMatch = items.find(
    item =>
      item.question.toLowerCase().includes(queryLower) ||
      queryLower.includes(item.question.toLowerCase()),
  );

  if (exactMatch) {
    console.log('[KB Search] Exact keyword match');
    return exactMatch.answer;
  }

  let bestMatch: QA | null = null;
  let maxMatches = 0;

  for (const item of items) {
    let matches = 0;
    const questionLower = item.question.toLowerCase();

    for (const word of keywords) {
      if (questionLower.includes(word)) {
        matches++;
      }
    }

    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = item;
    }
  }

  if (bestMatch && maxMatches > 0) {
    console.log('[KB Search] Keyword match');
    return bestMatch.answer;
  }

  return null;
};

/**
 * Add a new Q&A pair to the knowledge base
 */
export const addToKnowledgeBase = async (question: string, answer: string, tags: string[] = []) => {
  const db = await getDb();
  const embedding = await generateEmbedding(question);

  const result = await db
    .insert(schema.knowledgeBase)
    .values({
      question,
      answer,
      tags,
      embedding: embedding || undefined,
    })
    .returning();

  return result[0];
};

/**
 * Get all knowledge base items
 */
export const getAllKnowledgeBaseItems = async () => {
  const db = await getDb();
  return await db.select().from(schema.knowledgeBase).orderBy(desc(schema.knowledgeBase.createdAt));
};

/**
 * Update a knowledge base item
 */
export const updateKnowledgeBaseItem = async (
  id: string,
  data: { question?: string; answer?: string; tags?: string[] },
) => {
  const db = await getDb();

  let embedding: number[] | null | undefined = undefined;
  if (data.question) {
    embedding = await generateEmbedding(data.question);
  }

  const updateData: any = { ...data, updatedAt: new Date() };
  if (embedding !== undefined) {
    updateData.embedding = embedding;
  }

  const result = await db
    .update(schema.knowledgeBase)
    .set(updateData)
    .where(eq(schema.knowledgeBase.id, id))
    .returning();

  return result[0];
};

/**
 * Delete a knowledge base item
 */
export const deleteKnowledgeBaseItem = async (id: string) => {
  const db = await getDb();

  const result = await db
    .delete(schema.knowledgeBase)
    .where(eq(schema.knowledgeBase.id, id))
    .returning();

  return result[0];
};
