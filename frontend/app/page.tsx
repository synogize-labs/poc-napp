"use client";

import { useState, useEffect } from "react";

interface HealthStatus {
  status: string;
  service: string;
}

interface FeedbackResponse {
  original_text: string;
  sentiment: string;
  summary: string;
}

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackText, setFeedbackText] = useState("");
  const [analysis, setAnalysis] = useState<FeedbackResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/health");
      if (response.ok) {
        const data = await response.json();
        setHealthStatus(data);
      } else {
        setError("Backend is not responding");
      }
    } catch (err) {
      setError("Cannot connect to backend");
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeFeedback = async () => {
    if (!feedbackText.trim()) return;

    try {
      setAnalyzing(true);
      setError(null);
      const response = await fetch("/api/analyze-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: feedbackText }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to analyze feedback");
      }
    } catch (err) {
      setError("Failed to connect to backend");
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy":
        return "text-green-600 bg-green-100";
      case "unhealthy":
        return "text-red-600 bg-red-100";
      default:
        return "text-yellow-600 bg-yellow-100";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Snowflake Native App POC
          </h1>
          <p className="text-gray-600">Feedback Analyzer Backend Monitor</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
            {error}
          </div>
        )}

        {/* Feedback Analyzer */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Feedback Analyzer
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="feedback"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Enter customer feedback:
              </label>
              <textarea
                id="feedback"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Enter customer feedback here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                rows={4}
              />
            </div>

            <button
              onClick={analyzeFeedback}
              disabled={!feedbackText.trim() || analyzing}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? "Analyzing..." : "Analyze Feedback"}
            </button>

            {analysis && (
              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Analysis Results:
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">
                      Original Text:
                    </span>
                    <p className="text-gray-600 mt-1">
                      {analysis.original_text}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Sentiment:
                    </span>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                        analysis.sentiment === "positive"
                          ? "bg-green-100 text-green-800"
                          : analysis.sentiment === "negative"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {analysis.sentiment}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Summary:</span>
                    <p className="text-gray-600 mt-1">{analysis.summary}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Backend Status */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 text-xs text-gray-500">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                <span>Checking backend...</span>
              </>
            ) : healthStatus ? (
              <>
                <span
                  className={`w-2 h-2 rounded-full ${
                    healthStatus.status === "healthy"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                ></span>
                <span>Backend: {healthStatus.status}</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                <span>Backend: unknown</span>
              </>
            )}
            <button
              onClick={checkHealth}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              ↻
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
