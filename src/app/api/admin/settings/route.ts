/**
 * API Route: /api/admin/settings
 * Handles getting and updating admin settings.
 */
import {
  getAdminSettings,
  updateAdminSettings as dbUpdateAdminSettings,
} from '../../../../lib/database';

// GET /api/admin/settings
export async function handleGet() {
  try {
    const settings = getAdminSettings();
    return { status: 200, body: settings };
  } catch (error: any) {
    return { status: 500, body: { message: error.message } };
  }
}

// POST /api/admin/settings
export async function handlePost(requestBody: any) {
  if (!requestBody) {
    return { status: 400, body: { message: 'Bad Request: Missing request body.' } };
  }
  try {
    const updatedSettings = dbUpdateAdminSettings(requestBody);
    return { status: 200, body: updatedSettings };
  } catch (error: any) {
    return { status: 500, body: { message: error.message } };
  }
}
