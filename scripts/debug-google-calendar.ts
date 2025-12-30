/**
 * Debug script to check Google Calendar integration status for stylists
 */
import 'dotenv/config';
import * as fs from 'fs';
import { getDb } from '../src/db';
import * as schema from '../src/db/schema';
import { eq, desc } from 'drizzle-orm';

const output: string[] = [];
function log(msg: string) {
  console.log(msg);
  output.push(msg);
}

async function main() {
  const db = await getDb();

  log('=== Checking Stylists Google Calendar Status ===\n');

  // Get all stylists with their Google token info
  const stylists = await db
    .select({
      id: schema.stylists.id,
      name: schema.stylists.name,
      email: schema.stylists.email,
      userId: schema.stylists.userId,
      googleEmail: schema.stylists.googleEmail,
      googleCalendarId: schema.stylists.googleCalendarId,
      googleAccessToken: schema.stylists.googleAccessToken,
      googleRefreshToken: schema.stylists.googleRefreshToken,
      googleTokenExpiry: schema.stylists.googleTokenExpiry,
    })
    .from(schema.stylists);

  for (const stylist of stylists) {
    log(`Stylist: ${stylist.name} (ID: ${stylist.id})`);
    log(`  Email: ${stylist.email || 'N/A'}`);
    log(`  User ID: ${stylist.userId || 'NOT LINKED'}`);
    log(`  Google Email: ${stylist.googleEmail || 'NOT CONNECTED'}`);
    log(`  Has Access Token: ${!!stylist.googleAccessToken}`);
    log(`  Has Refresh Token: ${!!stylist.googleRefreshToken}`);
    log(`  Token Expiry: ${stylist.googleTokenExpiry || 'N/A'}`);
    log(`  Calendar ID: ${stylist.googleCalendarId || 'N/A'}`);
    log('');
  }

  // Check if there's a user with the WhatsApp email
  log('\n=== Checking User with WhatsApp email ===\n');
  const users = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      whatsappPhone: schema.users.whatsappPhone,
    })
    .from(schema.users)
    .where(eq(schema.users.email, '6591263421@whatsapp.local'));

  if (users.length === 0) {
    log('No user found with email: 6591263421@whatsapp.local');
  } else {
    for (const user of users) {
      log(`User: ${user.name} (ID: ${user.id})`);
      log(`  Email: ${user.email}`);
      log(`  Role: ${user.role}`);
      log(`  WhatsApp: ${user.whatsappPhone || 'N/A'}`);

      // Check if this user is linked to a stylist
      const linkedStylist = stylists.find(s => s.userId === user.id);
      if (linkedStylist) {
        log(`  Linked to Stylist: ${linkedStylist.name} (ID: ${linkedStylist.id})`);
        log(`  Stylist has Google: ${!!linkedStylist.googleRefreshToken}`);
      } else {
        log(`  NOT linked to any stylist`);
      }
    }
  }

  // Check recent appointments
  log('\n=== Checking Recent Appointments (last 10) ===\n');
  const recentAppointments = await db
    .select({
      id: schema.appointments.id,
      customerName: schema.appointments.customerName,
      customerEmail: schema.appointments.customerEmail,
      stylistId: schema.appointments.stylistId,
      date: schema.appointments.date,
      time: schema.appointments.time,
      calendarEventId: schema.appointments.calendarEventId,
      createdAt: schema.appointments.createdAt,
    })
    .from(schema.appointments)
    .orderBy(desc(schema.appointments.createdAt))
    .limit(10);

  for (const apt of recentAppointments) {
    const stylist = stylists.find(s => s.id === apt.stylistId);
    log(`Appointment ${apt.id}:`);
    log(`  Customer: ${apt.customerName} (${apt.customerEmail})`);
    log(`  Date: ${apt.date?.toISOString().split('T')[0]} at ${apt.time}`);
    log(`  Stylist: ${stylist?.name || 'NONE'} (ID: ${apt.stylistId || 'NONE'})`);
    log(`  Stylist has Google: ${stylist ? !!stylist.googleRefreshToken : 'N/A'}`);
    log(`  Calendar Event: ${apt.calendarEventId || 'NOT SYNCED'}`);
    log('');
  }

  // Write output to file
  fs.writeFileSync('debug-output.txt', output.join('\n'));
  log('\nOutput written to debug-output.txt');

  process.exit(0);
}

main().catch(console.error);
