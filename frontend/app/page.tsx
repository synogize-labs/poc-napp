"use client";

import { useState } from "react";
import HealthCheck from "./components/HealthCheck";

interface FeedbackResponse {
  original_text: string;
  sentiment: string;
  summary: string;
}

export default function Home() {
  const [feedback, setFeedback] = useState("");
  const [analysis, setAnalysis] = useState<FeedbackResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeFeedback = async () => {
    if (!feedback.trim()) {
      setError("Please enter some feedback to analyze");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const response = await fetch("http://localhost:8000/analyze-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: feedback }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze feedback"
      );
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return "text-green-600 bg-green-100";
      case "negative":
        return "text-red-600 bg-red-100";
      case "neutral":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Snowflake Native App POC
          </h1>
          <p className="text-xl text-gray-600">Feedback Analysis Tool</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Input Section */}
          <div className="mb-8">
            <label
              htmlFor="feedback"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Enter Customer Feedback
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter customer feedback here..."
              className="w-full h-32 px-3 py-2 border-2 border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-gray-900 placeholder-gray-500"
            />
            <button
              onClick={analyzeFeedback}
              disabled={loading}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Analyzing..." : "Analyze Feedback"}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Results Section */}
          {analysis && (
            <div className="border-t pt-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Analysis Results
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Original Text */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Original Feedback
                  </h3>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-gray-700">{analysis.original_text}</p>
                  </div>
                </div>

                {/* Sentiment */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Sentiment
                  </h3>
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(
                      analysis.sentiment
                    )}`}
                  >
                    {analysis.sentiment.charAt(0).toUpperCase() +
                      analysis.sentiment.slice(1)}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Summary
                </h3>
                <div className="p-4 bg-blue-50 rounded-md">
                  <p className="text-gray-700">{analysis.summary}</p>
                </div>
              </div>
            </div>
          )}

          {/* API Status */}
          <div className="mt-8 pt-6 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Backend Status:</span>
              <HealthCheck />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
