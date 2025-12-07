/**
 * API Route: /api/upload/avatar
 * Handles avatar image uploads for stylists using Cloudflare R2
 */
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: NextRequest) {
  try {
    // Check for R2 configuration
    if (
      !process.env.R2_ACCOUNT_ID ||
      !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY ||
      !process.env.R2_BUCKET_NAME
    ) {
      console.error('R2 configuration missing');
      return NextResponse.json({ message: 'Storage configuration error' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'File too large. Maximum size is 5MB.' },
        { status: 400 },
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `avatars/avatar_${timestamp}_${randomString}.${extension}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Construct the public URL
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
    });
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to upload avatar' },
      { status: 500 },
    );
  }
}
