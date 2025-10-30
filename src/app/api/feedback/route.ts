/**
 * API Route: /api/feedback
 *
 * Handles customer feedback submission from retention messages
 */
import { NextRequest, NextResponse } from 'next/server';
import { createFeedback } from '@/services/retentionService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, userId, rating, comment } = body;

    // Validate required fields
    if (!appointmentId || !userId || !rating) {
      return NextResponse.json(
        { message: 'Missing required fields: appointmentId, userId, and rating are required' },
        { status: 400 },
      );
    }

    // Validate rating is between 1-5
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: 'Rating must be a number between 1 and 5' },
        { status: 400 },
      );
    }

    // Create feedback record and mark appointment
    await createFeedback({
      appointmentId,
      userId,
      rating,
      comment,
    });

    return NextResponse.json(
      {
        message: 'Feedback received successfully',
        rating,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to submit feedback' },
      { status: 500 },
    );
  }
}
