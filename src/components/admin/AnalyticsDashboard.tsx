'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';

interface AnalyticsData {
  flaggedConversations: {
    total: number;
    resolved: number;
    avgResolutionTime: number; // in hours
    topReasons: Array<{ reason: string; count: number }>;
  };
  knowledgeBase: {
    totalQueries: number;
    successRate: number;
    topMissingQueries: string[];
    totalItems: number;
  };
  userSentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading) {
    return <LoadingSpinner message="Loading analytics..." />;
  }

  if (!data) {
    return <div className="text-center py-8 text-gray-500">No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Agent Analytics</h2>
        <select
          value={timeRange}
          onChange={e => setTimeRange(e.target.value as any)}
          className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Total Flagged Conversations
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {data.flaggedConversations.total}
            </div>
            <div className="text-sm text-green-600 mt-1">
              {data.flaggedConversations.resolved} resolved
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Avg Resolution Time
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {data.flaggedConversations.avgResolutionTime.toFixed(1)}h
            </div>
            <div className="text-sm text-gray-500 mt-1">Time to resolve flags</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              KB Success Rate
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {data.knowledgeBase.successRate}%
            </div>
            <div className="text-sm text-gray-500 mt-1">Questions answered</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Positive Sentiment
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {data.userSentiment.positive}
            </div>
            <div className="text-sm text-gray-500 mt-1">Happy customers</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Flag Reasons */}
      <Card>
        <CardHeader>
          <CardTitle>Top Escalation Reasons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.flaggedConversations.topReasons.map((reason, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">{reason.reason}</span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium">
                  {reason.count}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Missing KB Queries */}
      <Card>
        <CardHeader>
          <CardTitle>Top Unanswered Questions (Add to KB)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.knowledgeBase.topMissingQueries.map((query, index) => (
              <div
                key={index}
                className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
              >
                <p className="text-sm text-gray-800 dark:text-gray-200">&quot;{query}&quot;</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>User Sentiment Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-24 text-sm text-gray-600 dark:text-gray-400">Positive</div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full"
                  style={{
                    width: `${(data.userSentiment.positive / (data.userSentiment.positive + data.userSentiment.negative + data.userSentiment.neutral)) * 100}%`,
                  }}
                />
              </div>
              <div className="w-16 text-right text-sm font-medium">
                {data.userSentiment.positive}
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-24 text-sm text-gray-600 dark:text-gray-400">Neutral</div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div
                  className="bg-gray-400 h-4 rounded-full"
                  style={{
                    width: `${(data.userSentiment.neutral / (data.userSentiment.positive + data.userSentiment.negative + data.userSentiment.neutral)) * 100}%`,
                  }}
                />
              </div>
              <div className="w-16 text-right text-sm font-medium">
                {data.userSentiment.neutral}
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-24 text-sm text-gray-600 dark:text-gray-400">Negative</div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div
                  className="bg-red-500 h-4 rounded-full"
                  style={{
                    width: `${(data.userSentiment.negative / (data.userSentiment.positive + data.userSentiment.negative + data.userSentiment.neutral)) * 100}%`,
                  }}
                />
              </div>
              <div className="w-16 text-right text-sm font-medium">
                {data.userSentiment.negative}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
