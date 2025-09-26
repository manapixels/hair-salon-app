/**
 * API Route: /api/availability
 *
 * This file would be a serverless function in a Next.js/Vercel environment.
 * It handles GET requests to fetch available slots for a given date.
 *
 * NOTE: IN THIS SANDBOX ENVIRONMENT, THIS FILE IS FOR DEMONSTRATION ONLY
 * AND IS NOT ACTUALLY RUNNING ON A SERVER.
 */
import { getAvailability } from '../../../lib/database';

// This is a mock handler. In Next.js, this would be `export default async function handler(req, res) { ... }`
export async function handleGet(requestQuery: { date?: string }) {
  const { date } = requestQuery;

  if (!date) {
    return { status: 400, body: { message: 'Date query parameter is required.' } };
  }

  try {
    const slots = getAvailability(new Date(date));
    return { status: 200, body: slots };
  } catch (error: any) {
    return { status: 500, body: { message: 'Failed to get availability.', error: error.message } };
  }
}
