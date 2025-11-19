import { prisma } from '@/lib/prisma';
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
 * Uses vector similarity search for semantic matching, falls back to keyword search
 */
export const searchKnowledgeBase = async (query: string): Promise<string | null> => {
  // Fetch all items from database
  const dbItems = await prisma.knowledgeBase.findMany();

  if (dbItems.length === 0) return null;

  // Convert DB items to include embeddings
  const items = dbItems.map(item => ({
    id: item.id,
    question: item.question,
    answer: item.answer,
    tags: item.tags,
    embedding: item.embedding ? (item.embedding as unknown as number[]) : undefined,
  }));

  // Try vector search first (if embeddings available)
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

  // Exact match check
  const exactMatch = items.find(
    item =>
      item.question.toLowerCase().includes(queryLower) ||
      queryLower.includes(item.question.toLowerCase()),
  );

  if (exactMatch) {
    console.log('[KB Search] Exact keyword match');
    return exactMatch.answer;
  }

  // Keyword matching
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

  // Threshold: at least 1 significant keyword match
  if (bestMatch && maxMatches > 0) {
    console.log('[KB Search] Keyword match');
    return bestMatch.answer;
  }

  return null;
};

/**
 * Add a new Q&A pair to the knowledge base
 * Automatically generates embedding for semantic search
 */
export const addToKnowledgeBase = async (question: string, answer: string, tags: string[] = []) => {
  // Generate embedding for the question
  const embedding = await generateEmbedding(question);

  return await prisma.knowledgeBase.create({
    data: {
      question,
      answer,
      tags,
      embedding: embedding || undefined,
    },
  });
};

/**
 * Get all knowledge base items
 */
export const getAllKnowledgeBaseItems = async () => {
  return await prisma.knowledgeBase.findMany({
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Update a knowledge base item
 * Regenerates embedding if question changes
 */
export const updateKnowledgeBaseItem = async (
  id: string,
  data: { question?: string; answer?: string; tags?: string[] },
) => {
  // If question is being updated, regenerate embedding
  let embedding: number[] | null | undefined = undefined;
  if (data.question) {
    embedding = await generateEmbedding(data.question);
  }

  const updateData: any = { ...data };
  if (embedding !== undefined) {
    updateData.embedding = embedding;
  }

  return await prisma.knowledgeBase.update({
    where: { id },
    data: updateData,
  });
};

/**
 * Delete a knowledge base item
 */
export const deleteKnowledgeBaseItem = async (id: string) => {
  return await prisma.knowledgeBase.delete({
    where: { id },
  });
};
