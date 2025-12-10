/**
 * API Route: /api/admin/customers
 * Get all customers (users with CUSTOMER role) with computed statistics
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq, desc, asc, gte, sql, and } from 'drizzle-orm';
import type { CustomerWithStats, CustomerStatus, StylistSummary } from '@/types';

// Calculate customer status based on visit patterns
function calculateCustomerStatus(
  totalVisits: number,
  lastVisitDate: Date | null,
  createdAt: Date,
): CustomerStatus {
  const now = new Date();
  const daysSinceLastVisit = lastVisitDate
    ? Math.floor((now.getTime() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const daysSinceRegistration = Math.floor(
    (now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24),
  );

  // New customer: registered within 30 days and 0-1 visits
  if (daysSinceRegistration <= 30 && totalVisits <= 1) {
    return 'NEW';
  }

  // Churned: no visit in 90+ days
  if (daysSinceLastVisit !== null && daysSinceLastVisit > 90) {
    return 'CHURNED';
  }

  // At risk: no visit in 45-90 days
  if (daysSinceLastVisit !== null && daysSinceLastVisit > 45) {
    return 'AT_RISK';
  }

  // Active: visited within 45 days
  return 'ACTIVE';
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);

    // Get query params for filtering
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') as CustomerStatus | 'all' | null;
    const sortBy = searchParams.get('sortBy') || 'lastVisitDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '25', 10);

    // Get all customers (users with CUSTOMER role)
    const customers = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        avatar: schema.users.avatar,
        authProvider: schema.users.authProvider,
        telegramId: schema.users.telegramId,
        whatsappPhone: schema.users.whatsappPhone,
        totalVisits: schema.users.totalVisits,
        lastVisitDate: schema.users.lastVisitDate,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.role, 'CUSTOMER'))
      .orderBy(desc(schema.users.lastVisitDate));

    // Get all appointments for these customers to compute next appointment and preferred stylist
    const customerIds = customers.map(c => c.id);

    const now = new Date();
    const appointments =
      customerIds.length > 0
        ? await db
            .select({
              id: schema.appointments.id,
              userId: schema.appointments.userId,
              date: schema.appointments.date,
              time: schema.appointments.time,
              categoryId: schema.appointments.categoryId,
              stylistId: schema.appointments.stylistId,
            })
            .from(schema.appointments)
            .where(sql`${schema.appointments.userId} IN ${customerIds}`)
        : [];

    // Get categories for appointment titles
    const categories = await db.select().from(schema.serviceCategories);

    // Get stylists for preferred stylist calculation
    const stylists = await db
      .select({
        id: schema.stylists.id,
        name: schema.stylists.name,
        email: schema.stylists.email,
      })
      .from(schema.stylists);

    // Build customer data with computed fields
    const customersWithStats: CustomerWithStats[] = customers.map(customer => {
      // Get customer's appointments
      const customerAppointments = appointments.filter(a => a.userId === customer.id);

      // Find next appointment (future appointments sorted by date)
      const futureAppointments = customerAppointments
        .filter(a => new Date(a.date) >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const nextAppointment = futureAppointments[0];
      const nextAppointmentData = nextAppointment
        ? {
            id: nextAppointment.id,
            date: new Date(nextAppointment.date),
            time: nextAppointment.time,
            categoryTitle: categories.find(c => c.id === nextAppointment.categoryId)?.title,
            stylistName: stylists.find(s => s.id === nextAppointment.stylistId)?.name,
          }
        : undefined;

      // Calculate preferred stylist (most frequently booked)
      const stylistCounts: Record<string, number> = {};
      customerAppointments.forEach(a => {
        if (a.stylistId) {
          stylistCounts[a.stylistId] = (stylistCounts[a.stylistId] || 0) + 1;
        }
      });

      let preferredStylist: StylistSummary | undefined;
      const mostFrequentStylistId = Object.entries(stylistCounts).sort(
        ([, a], [, b]) => b - a,
      )[0]?.[0];

      if (mostFrequentStylistId) {
        const stylist = stylists.find(s => s.id === mostFrequentStylistId);
        if (stylist) {
          preferredStylist = {
            id: stylist.id,
            name: stylist.name,
            email: stylist.email ?? undefined,
          };
        }
      }

      // Calculate status
      const status = calculateCustomerStatus(
        customer.totalVisits,
        customer.lastVisitDate,
        customer.createdAt,
      );

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        avatar: customer.avatar ?? undefined,
        authProvider: customer.authProvider as 'email' | 'whatsapp' | 'telegram' | undefined,
        telegramId: customer.telegramId ?? undefined,
        whatsappPhone: customer.whatsappPhone ?? undefined,
        totalVisits: customer.totalVisits,
        lastVisitDate: customer.lastVisitDate ?? undefined,
        createdAt: customer.createdAt,
        nextAppointment: nextAppointmentData,
        preferredStylist,
        status,
      };
    });

    // Apply search filter
    let filteredCustomers = customersWithStats;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCustomers = filteredCustomers.filter(
        c =>
          c.name.toLowerCase().includes(searchLower) ||
          c.email.toLowerCase().includes(searchLower) ||
          (c.whatsappPhone && c.whatsappPhone.includes(searchLower)),
      );
    }

    // Apply status filter
    if (status && status !== 'all') {
      filteredCustomers = filteredCustomers.filter(c => c.status === status);
    }

    // Sort
    filteredCustomers.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'totalVisits':
          comparison = a.totalVisits - b.totalVisits;
          break;
        case 'lastVisitDate':
          const aDate = a.lastVisitDate ? new Date(a.lastVisitDate).getTime() : 0;
          const bDate = b.lastVisitDate ? new Date(b.lastVisitDate).getTime() : 0;
          comparison = aDate - bDate;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Pagination
    const totalCount = filteredCustomers.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + pageSize);

    // Count by status for filter tabs
    const statusCounts = {
      all: customersWithStats.length,
      NEW: customersWithStats.filter(c => c.status === 'NEW').length,
      ACTIVE: customersWithStats.filter(c => c.status === 'ACTIVE').length,
      AT_RISK: customersWithStats.filter(c => c.status === 'AT_RISK').length,
      CHURNED: customersWithStats.filter(c => c.status === 'CHURNED').length,
    };

    return NextResponse.json({
      customers: paginatedCustomers,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
      statusCounts,
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch customers' },
      { status: 500 },
    );
  }
}
