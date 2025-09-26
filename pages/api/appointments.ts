/**
 * API Route: /api/appointments
 * 
 * This file would be a serverless function in a Next.js/Vercel environment.
 * It handles POST requests to create a new appointment.
 * 
 * NOTE: IN THIS SANDBOX ENVIRONMENT, THIS FILE IS FOR DEMONSTRATION ONLY
 * AND IS NOT ACTUALLY RUNNING ON A SERVER.
 */
import { bookNewAppointment } from '../../lib/database';
import { createCalendarEvent } from '../../lib/google';

// This is a mock handler. In Next.js, this would be `export default async function handler(req, res) { ... }`
export async function handlePost(requestBody: any) {
    if (!requestBody) {
        return { status: 400, body: { message: 'Bad Request: Missing request body.' } };
    }
    
    try {
        const { date, time, services, customerName, customerEmail } = requestBody;

        if (!date || !time || !services || !customerName || !customerEmail) {
            return { status: 400, body: { message: 'Missing required appointment data.' } };
        }
        
        const appointmentData = {
            date: new Date(date),
            time,
            services,
            customerName,
            customerEmail
        };

        const newAppointment = bookNewAppointment(appointmentData);

        // After successfully creating the appointment in our DB,
        // create a corresponding event in Google Calendar.
        // We do this asynchronously and don't wait for it to finish ('fire and forget')
        // so it doesn't slow down the response to the user.
        createCalendarEvent(newAppointment);

        return { status: 201, body: newAppointment };
    } catch (error: any) {
        return { status: 409, body: { message: error.message || 'An error occurred during booking.' } };
    }
}