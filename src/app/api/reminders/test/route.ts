import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/sessionMiddleware';
import { getUserAppointments } from '@/lib/database';
import { sendAppointmentReminder } from '@/services/reminderService';

export const POST = withAdminAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json();
    const { appointmentId, userId } = body;

    if (appointmentId) {
      // Test reminder for a specific appointment
      // For testing, we'll get user appointments and find the one to test
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID required when testing specific appointment' },
          { status: 400 },
        );
      }

      const userAppointments = await getUserAppointments(userId);
      const appointment = userAppointments.find(apt => apt.id === appointmentId);

      if (!appointment) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
      }

      // Add user data to appointment for testing
      const testAppointment = {
        ...appointment,
        user: {
          id: userId,
          name: appointment.customerName,
          email: appointment.customerEmail,
          authProvider: 'whatsapp' as const, // Default for testing
          telegramId: undefined,
          whatsappPhone: '+1234567890', // Test number for development
          role: 'CUSTOMER' as const,
          avatar: undefined,
        },
      };

      const result = await sendAppointmentReminder(testAppointment);

      return NextResponse.json({
        message: 'Test reminder sent',
        result,
        appointment: {
          id: appointment.id,
          customerName: appointment.customerName,
          date: appointment.date,
          time: appointment.time,
          services: appointment.services.map(s => s.name),
        },
      });
    } else {
      // Test reminder format without actually sending
      const mockAppointment = {
        id: 'test-123',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        time: '10:00',
        services: [
          { id: 1, name: "Men's Haircut", description: '', price: 25, duration: 30 },
          { id: 2, name: 'Beard Trim', description: '', price: 15, duration: 15 },
        ],
        stylistId: 'stylist-1',
        stylist: {
          id: 'stylist-1',
          name: 'Sarah Wilson',
          email: 'sarah@luxecuts.com',
        },
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        totalPrice: 40,
        totalDuration: 45,
        calendarEventId: null,
        userId: 'user-123',
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          authProvider: 'whatsapp' as const,
          telegramId: undefined,
          whatsappPhone: '+1234567890',
          role: 'CUSTOMER' as const,
          avatar: undefined,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Just return the formatted message without sending
      const { formatReminderMessage } = await import('@/services/reminderService');
      const message = formatReminderMessage(mockAppointment);

      return NextResponse.json({
        message: 'Test reminder format generated',
        formattedMessage: message,
        mockAppointment: {
          customerName: mockAppointment.customerName,
          date: mockAppointment.date,
          time: mockAppointment.time,
          services: mockAppointment.services.map(s => s.name),
          stylist: mockAppointment.stylist?.name,
        },
      });
    }
  } catch (error) {
    console.error('Error testing reminder:', error);
    return NextResponse.json(
      {
        error: 'Failed to test reminder',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
});
