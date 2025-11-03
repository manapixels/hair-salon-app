import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';
import { sendAppointmentReminders } from '@/inngest/appointmentReminders';
import { sendFeedbackRequests } from '@/inngest/feedback';
import { sendRebookingReminders } from '@/inngest/rebooking';
import { sendWinBackCampaigns } from '@/inngest/winback';
import { autoCompleteAppointments } from '@/inngest/autoCompleteAppointments';
import { syncAppointmentsToCalendar } from '@/inngest/syncCalendar';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendAppointmentReminders,
    autoCompleteAppointments,
    sendFeedbackRequests,
    sendRebookingReminders,
    sendWinBackCampaigns,
    syncAppointmentsToCalendar,
  ],
});
