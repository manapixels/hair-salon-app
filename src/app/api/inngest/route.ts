import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';
import { sendAppointmentReminders } from '@/inngest/appointmentReminders';
import { autoCompleteAppointments } from '@/inngest/autoCompleteAppointments';
import { syncAppointmentsToCalendar } from '@/inngest/syncCalendar';
import { proactiveAgent } from '@/inngest/proactiveAgent';
import { customerSuggestions } from '@/inngest/customerSuggestions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendAppointmentReminders,
    autoCompleteAppointments,
    syncAppointmentsToCalendar,
    proactiveAgent,
    customerSuggestions,
  ],
});
