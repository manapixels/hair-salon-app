/**
 * Vector Search Service for Knowledge Base
 *
 * Uses Gemini embeddings API for semantic search.
 * For production at scale, consider Vertex AI Vector Search or pgvector.
 */

import { GoogleGenAI } from '@google/genai';

const API_KEY = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (typeof window === 'undefined' && API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

/**
 * Generate embedding vector for text
 * @param text - Text to embed
 * @returns Embedding vector (768 dimensions for text-embedding-004)
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!ai) {
    console.error('Gemini AI not initialized');
    return null;
  }

  try {
    const result = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: text,
    });

    return result.embeddings?.[0]?.values || null;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param a - First vector
 * @param b - Second vector
 * @returns Similarity score between -1 and 1 (higher is more similar)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);

  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Search knowledge base using semantic similarity
 * @param query - User query
 * @param items - Knowledge base items with embeddings
 * @param threshold - Minimum similarity threshold (0-1)
 * @returns Best matching item or null
 */
export async function semanticSearch(
  query: string,
  items: Array<{ question: string; answer: string; embedding?: number[] }>,
  threshold: number = 0.7,
): Promise<{ question: string; answer: string; score: number } | null> {
  if (!items || items.length === 0) return null;

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);
  if (!queryEmbedding) {
    console.error('Failed to generate query embedding');
    return null;
  }

  let bestMatch: { question: string; answer: string; score: number } | null = null;
  let bestScore = threshold;

  for (const item of items) {
    if (!item.embedding) {
      // Skip items without embeddings (fallback to keyword search)
      continue;
    }

    const score = cosineSimilarity(queryEmbedding, item.embedding);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        question: item.question,
        answer: item.answer,
        score,
      };
    }
  }

  if (bestMatch) {
    console.log(
      `[Vector Search] Found match: "${bestMatch.question}" (score: ${bestMatch.score.toFixed(3)})`,
    );
  }

  return bestMatch;
}

/**
 * Batch generate embeddings for multiple texts
 * @param texts - Array of texts to embed
 * @returns Array of embeddings (or null for failures)
 */
export async function batchGenerateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
  const embeddings: (number[] | null)[] = [];

  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    embeddings.push(embedding);

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return embeddings;
}
