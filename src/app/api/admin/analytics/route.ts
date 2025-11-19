import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '30d';

    // Calculate date range
    const now = new Date();
    const daysAgo = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Fetch flagged conversations analytics
    const allFlags = await prisma.flaggedConversation.findMany({
      where: {
        flaggedAt: {
          gte: startDate,
        },
      },
    });

    const resolvedFlags = allFlags.filter(f => f.isResolved);
    const totalFlags = allFlags.length;
    const resolvedCount = resolvedFlags.length;

    // Calculate average resolution time
    const resolutionTimes = resolvedFlags
      .filter(f => f.resolvedAt)
      .map(f => {
        const flaggedTime = f.flaggedAt.getTime();
        const resolvedTime = f.resolvedAt!.getTime();
        return (resolvedTime - flaggedTime) / (1000 * 60 * 60); // hours
      });

    const avgResolutionTime =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
        : 0;

    // Get top reasons for flagging
    const reasonCounts: Record<string, number> = {};
    allFlags.forEach(flag => {
      reasonCounts[flag.reason] = (reasonCounts[flag.reason] || 0) + 1;
    });

    const topReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Knowledge base analytics
    const totalKBItems = await prisma.knowledgeBase.count();

    // Extract top missing queries from flagged conversations
    const kbRelatedFlags = allFlags.filter(
      f =>
        f.reason.toLowerCase().includes('knowledge base') ||
        f.reason.toLowerCase().includes('not found'),
    );

    const topMissingQueries = kbRelatedFlags
      .map(f => {
        const match = f.reason.match(/"([^"]+)"/);
        return match ? match[1] : null;
      })
      .filter(Boolean)
      .slice(0, 5) as string[];

    // Mock sentiment data (in production, this would come from tracked sentiment logs)
    // You would store sentiment from messagingUserService.ts analyzeSentiment()
    const userSentiment = {
      positive: Math.floor(Math.random() * 50) + 30,
      negative: Math.floor(Math.random() * 10) + 2,
      neutral: Math.floor(Math.random() * 30) + 10,
    };

    // Mock KB success rate (would be calculated from actual query logs)
    const kbSuccessRate = totalKBItems > 0 ? 75 : 0;

    const analyticsData = {
      flaggedConversations: {
        total: totalFlags,
        resolved: resolvedCount,
        avgResolutionTime,
        topReasons,
      },
      knowledgeBase: {
        totalQueries: kbRelatedFlags.length,
        successRate: kbSuccessRate,
        topMissingQueries,
        totalItems: totalKBItems,
      },
      userSentiment,
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
