"use client";

import { useState, useEffect } from "react";

interface HealthStatus {
  status: string;
  service: string;
}

export default function HealthCheck() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch("http://localhost:8000/health");
        if (response.ok) {
          const data = await response.json();
          setHealthStatus(data);
        } else {
          setError("Backend health check failed");
        }
      } catch {
        setError("Cannot connect to backend");
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-600">Checking backend...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-sm text-red-600">{error}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      <span className="text-sm text-gray-600">
        {healthStatus?.service || "Backend"} -{" "}
        {healthStatus?.status || "Connected"}
      </span>
    </div>
  );
}
