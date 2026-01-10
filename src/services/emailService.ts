/**
 * Email Service for transactional emails
 * Uses Resend API (https://resend.com)
 */

import { render } from '@react-email/render';
import BookingConfirmationEmail from '@/emails/BookingConfirmation';
import WelcomeEmail from '@/emails/Welcome';
import MagicLinkEmail from '@/emails/MagicLink';

interface EmailResult {
  success: boolean;
  error?: string;
}

interface AppointmentEmailData {
  customerName: string;
  customerEmail: string;
  appointmentId: string;
  serviceName: string;
  stylistName: string | null;
  date: string; // formatted date
  time: string;
  duration: number; // in minutes
}

/**
 * Send an email using Resend API
 */
async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('[Email] RESEND_API_KEY not configured');
    // In development, just log the email
    if (process.env.NODE_ENV === 'development') {
      console.log('[Email] Would send email:', {
        to: params.to,
        subject: params.subject,
        htmlLength: params.html.length,
      });
      return { success: true };
    }
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Signature Trims <noreply@signaturetrims.com>',
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Email] Resend API error:', error);
      return { success: false, error: 'Failed to send email' };
    }

    console.log('[Email] Sent email to:', params.to);
    return { success: true };
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return { success: false, error: 'Email service error' };
  }
}

/**
 * Send magic link login email
 */
interface AdminSettingsProps {
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
}

/**
 * Send magic link login email
 */
export async function sendMagicLinkEmail(
  email: string,
  token: string,
  name?: string,
  settings?: AdminSettingsProps,
): Promise<EmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://signaturetrims.com';
  const magicLink = `${baseUrl}/api/auth/magic-link/verify?token=${token}`;

  try {
    const html = await render(
      MagicLinkEmail({
        magicLink,
        customerName: name,
        businessName: settings?.businessName,
        businessAddress: settings?.businessAddress,
      }),
    );

    return sendEmail({
      to: email,
      subject: `Log in to ${settings?.businessName || 'Signature Trims'}`,
      html,
    });
  } catch (error) {
    console.error('[Email] Error rendering template:', error);
    return { success: false, error: 'Template render error' };
  }
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  data: AppointmentEmailData & { stylistAvatarUrl?: string },
  settings?: AdminSettingsProps,
): Promise<EmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://signaturetrims.com';
  const rescheduleUrl = `${baseUrl}/booking/reschedule?id=${data.appointmentId}`;
  const cancelUrl = `${baseUrl}/booking/cancel?id=${data.appointmentId}`;

  // Format duration
  const hours = Math.floor(data.duration / 60);
  const minutes = data.duration % 60;
  const durationStr =
    hours > 0 ? `${hours}h ${minutes > 0 ? `${minutes}min` : ''}` : `${minutes}min`;

  try {
    const html = await render(
      BookingConfirmationEmail({
        customerName: data.customerName,
        serviceName: data.serviceName,
        date: data.date,
        time: data.time,
        duration: durationStr,
        stylistName: data.stylistName || 'Any Available',
        stylistAvatarUrl: data.stylistAvatarUrl,
        appointmentId: data.appointmentId,
        rescheduleUrl,
        cancelUrl,
        baseUrl,
        businessName: settings?.businessName,
        businessAddress: settings?.businessAddress,
        businessPhone: settings?.businessPhone,
      }),
    );

    return sendEmail({
      to: data.customerEmail,
      subject: `Booking Confirmed - ${data.serviceName} on ${data.date}`,
      html,
    });
  } catch (error) {
    console.error('[Email] Error rendering template:', error);
    return { success: false, error: 'Template render error' };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  settings?: AdminSettingsProps,
): Promise<EmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://signaturetrims.com';
  const loginUrl = `${baseUrl}/login`;

  try {
    const html = await render(
      WelcomeEmail({
        customerName: name,
        loginUrl,
        businessName: settings?.businessName,
        businessAddress: settings?.businessAddress,
      }),
    );

    return sendEmail({
      to: email,
      subject: `Welcome to ${settings?.businessName || 'Signature Trims'}! 👋`,
      html,
    });
  } catch (error) {
    console.error('[Email] Error rendering template:', error);
    return { success: false, error: 'Template render error' };
  }
}
