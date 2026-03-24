"use client";

import { apiClient } from "@/lib/api-client";
import { type DashboardApiResponse } from "@/lib/dashboard/types";
import { useCallback, useEffect, useState } from "react";

export function useDashboardStats() {
  const [data, setData] = useState<DashboardApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<DashboardApiResponse>("/api/dashboard");
      setData(response);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load dashboard";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardStats();
  }, [fetchDashboardStats]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardStats,
  };
}
