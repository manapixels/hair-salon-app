# Avatar Storage Migration to Cloudflare R2

## Goal Description

Migrate the storage of avatar images from the local `public/uploads` directory to Cloudflare R2. This ensures statelessness for the application (important for serverless/edge deployments) and utilizes a dedicated object storage solution.

## User Review Required

> [!IMPORTANT]
> You will need to provide the following Cloudflare R2 credentials in your `.env.local` file:
>
> - `R2_ACCOUNT_ID`
> - `R2_ACCESS_KEY_ID`
> - `R2_SECRET_ACCESS_KEY`
> - `R2_BUCKET_NAME`
> - `R2_PUBLIC_URL` (The public domain for your bucket, e.g., https://pub-xxxxxxxx.r2.dev or your custom domain)

> [!NOTE]
> This change only affects _new_ uploads. Existing avatars in the `public/uploads` folder will need to be manually migrated if you want to keep them, or they will eventually be lost if the persistent disk is wiped (in serverless environments).

## Proposed Changes

### Dependencies

- Install `@aws-sdk/client-s3`

### Configuration

#### [MODIFY] [next.config.js](file:///c:/Users/Admin/Downloads/Dev/hair-salon-app/next.config.js)

- Add the R2 public domain to `images.remotePatterns` or `images.domains` to allow Next.js `Image` component to optimize these external images.

### API Routes

#### [MODIFY] [src/app/api/upload/avatar/route.ts](file:///c:/Users/Admin/Downloads/Dev/hair-salon-app/src/app/api/upload/avatar/route.ts)

- Remove filesystem operations (`fs/promises`).
- Initialize `S3Client` with Cloudflare endpoint and credentials.
- Implement `PutObjectCommand` to upload the file buffer to R2.
- Return the absolute URL of the uploaded file.

## Verification Plan

### Manual Verification

1.  Configure `.env.local` with valid R2 credentials.
2.  Start the dev server (`npm run dev`).
3.  Navigate to the Admin Dashboard -> Stylists.
4.  Edit a stylist or create a new one.
5.  Upload a new avatar image.
6.  Verify that the upload succeeds and the image is displayed correctly (the URL should potentially change to the R2 domain).
7.  Check the Cloudflare R2 dashboard (if accessible) to confirm the file exists.
