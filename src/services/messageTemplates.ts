/**
 * Type-safe user and appointment data that can handle both Date objects and serialized strings
 */
type UserData = {
  name: string;
  lastVisitDate?: Date | string | null;
};

type AppointmentData = {
  services: any;
};

/**
 * Generate feedback request message (4h after appointment)
 */
export function generateFeedbackRequestMessage(
  user: UserData,
  appointment: AppointmentData,
): string {
  const serviceNames = (appointment.services as any[]).map(s => s.name).join(', ');

  return `Hi ${user.name}! How was your ${serviceNames} today?

We'd love to hear your feedback! 💬`;
}

/**
 * Generate inline keyboard for Telegram feedback (3 simple options)
 */
export function generateFeedbackKeyboard(appointmentId: string) {
  return {
    inline_keyboard: [
      [
        { text: '😞 Not Great', callback_data: `feedback:${appointmentId}:1` },
        { text: '👌 Okay', callback_data: `feedback:${appointmentId}:3` },
        { text: '🤩 Amazing!', callback_data: `feedback:${appointmentId}:5` },
      ],
    ],
  };
}

/**
 * Generate rebooking nudge message (4+ weeks after last visit)
 */
export function generateRebookingNudgeMessage(
  user: UserData,
  lastAppointment: AppointmentData,
): string {
  const serviceNames = (lastAppointment.services as any[]).map(s => s.name).join(', ');
  const weeksSince = user.lastVisitDate
    ? Math.floor((Date.now() - new Date(user.lastVisitDate).getTime()) / (7 * 24 * 60 * 60 * 1000))
    : 0;

  return `Hi ${user.name}! It's been ${weeksSince} weeks since your last ${serviceNames}.

Time for a refresh? Most clients rebook every 4-6 weeks for best results.

Tap below to book your next appointment! 📅`;
}

/**
 * Generate win-back message (8+ weeks inactive)
 */
export function generateWinBackMessage(user: UserData): string {
  const weeksSince = user.lastVisitDate
    ? Math.floor((Date.now() - new Date(user.lastVisitDate).getTime()) / (7 * 24 * 60 * 60 * 1000))
    : 0;

  return `We miss you, ${user.name}! It's been ${weeksSince} weeks since we saw you at Signature Trims.

Your chair is waiting. 💈

Book your next appointment and let us help you look your best!`;
}
