"use client";

import { useState, useEffect } from "react";

interface HealthStatus {
  status: string;
  service: string;
}

interface DatabaseStatus {
  connected: boolean;
  message: string;
  user: string;
  role: string;
  tables?: Array<{
    name: string;
    schema: string;
    columns: Array<{
      name: string;
      type: string;
      nullable: string;
    }>;
    column_error?: string;
  }>;
}

interface ConsumersTableStatus {
  connected: boolean;
  message: string;
  user: string;
  role: string;
  reference_type?: "single_valued" | "multi_valued" | "none" | "error";
  reference_id?: string;
  total_tables?: number;
  tables_info?: Array<{
    reference_id: string;
    row_count: number;
    columns: string[];
    sample_data: Array<Record<string, string | number | boolean | null>>;
    accessible: boolean;
    error?: string;
  }>;
  error?: string;
}

interface FeedbackResponse {
  original_text: string;
  sentiment: string;
  summary: string;
}

interface FeedbackHistoryItem {
  id: number;
  customer_feedback: string;
  sentiment: string;
  summary: string;
  created_at: string;
}

interface FeedbackHistoryTableStatus {
  connected: boolean;
  message: string;
  row_count: number;
  columns: Array<{
    name: string;
    type: string;
    nullable: string;
  }>;
  sample_data: FeedbackHistoryItem[];
  error?: string;
}

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [consumersTableStatus, setConsumersTableStatus] =
    useState<ConsumersTableStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackText, setFeedbackText] = useState("");
  const [analysis, setAnalysis] = useState<FeedbackResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackHistoryStatus, setFeedbackHistoryStatus] =
    useState<FeedbackHistoryTableStatus | null>(null);

  useEffect(() => {
    checkHealth();
    checkDatabaseStatus();
    checkConsumersTableStatus();
    checkFeedbackHistoryTableStatus();
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
    } catch {
      setError("Cannot connect to backend");
    } finally {
      setIsLoading(false);
    }
  };

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch("/api/test-db-connection");
      if (response.ok) {
        const data = await response.json();
        setDbStatus(data);
      } else {
        setDbStatus({
          connected: false,
          message: "Failed to get database status",
          user: "",
          role: "",
          tables: [],
        });
      }
    } catch {
      setDbStatus({
        connected: false,
        message: "Cannot connect to database",
        user: "",
        role: "",
        tables: [],
      });
    }
  };

  const checkConsumersTableStatus = async () => {
    try {
      const response = await fetch("/api/test-consumer-table");
      if (response.ok) {
        const data = await response.json();
        setConsumersTableStatus(data);
      } else {
        setConsumersTableStatus({
          connected: false,
          message: "Failed to get consumers table status",
          user: "",
          role: "",
        });
      }
    } catch {
      setConsumersTableStatus({
        connected: false,
        message: "Cannot connect to consumers table",
        user: "",
        role: "",
      });
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
        setFeedbackText("");
        checkFeedbackHistoryTableStatus();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to analyze feedback");
      }
    } catch {
      setError("Failed to connect to backend");
    } finally {
      setAnalyzing(false);
    }
  };

  const checkFeedbackHistoryTableStatus = async () => {
    try {
      const response = await fetch("/api/test-feedback-history-table");
      if (response.ok) {
        const data = await response.json();
        setFeedbackHistoryStatus(data);
      } else {
        setFeedbackHistoryStatus({
          connected: false,
          message: "Failed to get feedback history table status",
          row_count: 0,
          columns: [],
          sample_data: [],
        });
      }
    } catch {
      setFeedbackHistoryStatus({
        connected: false,
        message: "Cannot connect to feedback history table",
        row_count: 0,
        columns: [],
        sample_data: [],
      });
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
          <p className="text-gray-600">
            Feedback Analyzer with Snowpark Database Connection
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
            {error}
          </div>
        )}

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            System Status
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Backend Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    healthStatus?.status === "healthy"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                ></span>
                <span className="text-sm font-medium text-gray-700">
                  Backend
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-900">
                  {healthStatus?.status || "unknown"}
                </div>
                <button
                  onClick={checkHealth}
                  disabled={isLoading}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Database Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    dbStatus?.connected ? "bg-green-500" : "bg-red-500"
                  }`}
                ></span>
                <span className="text-sm font-medium text-gray-700">
                  Database
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-900">
                  {dbStatus?.connected ? "Connected" : "Disconnected"}
                </div>
                <button
                  onClick={checkDatabaseStatus}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Consumers Table Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    consumersTableStatus?.connected
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                ></span>
                <span className="text-sm font-medium text-gray-700">
                  Consumers Table
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-900">
                  {consumersTableStatus?.connected
                    ? consumersTableStatus.reference_type === "multi_valued"
                      ? `Multi (${consumersTableStatus.total_tables || 0})`
                      : "Connected"
                    : "Disconnected"}
                </div>
                <button
                  onClick={checkConsumersTableStatus}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Test
                </button>
              </div>
            </div>
          </div>

          {/* Database Details */}
          {dbStatus && (
            <div className="p-3 bg-blue-50 rounded-md">
              <div className="text-sm text-gray-700 space-y-1">
                <div>
                  <strong>Message:</strong> {dbStatus.message}
                </div>
                {dbStatus.user && (
                  <div>
                    <strong>User:</strong> {dbStatus.user}
                  </div>
                )}
                {dbStatus.role && (
                  <div>
                    <strong>Role:</strong> {dbStatus.role}
                  </div>
                )}
                {dbStatus.tables && dbStatus.tables.length > 0 && (
                  <div className="mt-3">
                    <strong>Database Tables ({dbStatus.tables.length}):</strong>
                    <div className="mt-2 space-y-2">
                      {dbStatus.tables.map((table, index) => (
                        <div
                          key={index}
                          className="border-l-2 border-blue-300 pl-3"
                        >
                          <div className="font-medium text-blue-800">
                            {table.schema}.{table.name}
                          </div>
                          {table.columns && table.columns.length > 0 && (
                            <div className="mt-1 text-xs text-gray-600">
                              <strong>Columns:</strong>
                              <div className="grid grid-cols-3 gap-2 mt-1">
                                {table.columns.map((col, colIndex) => (
                                  <div
                                    key={colIndex}
                                    className="bg-white p-1 rounded border"
                                  >
                                    <div className="font-mono text-xs">
                                      {col.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {col.type}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {table.column_error && (
                            <div className="text-xs text-red-600 mt-1">
                              Error loading columns: {table.column_error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Consumers Table Details */}
                {consumersTableStatus && (
                  <div className="p-3 bg-green-50 rounded-md mt-4">
                    <div className="text-sm text-gray-700 space-y-1">
                      <div>
                        <strong>Message:</strong> {consumersTableStatus.message}
                      </div>

                      {/* Tables info - works for both single and multi tables */}
                      {consumersTableStatus.tables_info &&
                        consumersTableStatus.tables_info.length > 0 && (
                          <div className="mt-3">
                            <strong>
                              Consumer Tables (
                              {consumersTableStatus.tables_info.length}):
                            </strong>

                            <div className="mt-2 space-y-2">
                              {consumersTableStatus.tables_info.map(
                                (table, index) => (
                                  <div
                                    key={index}
                                    className="border-l-2 border-green-300 pl-3"
                                  >
                                    <div className="font-medium text-green-800">
                                      Table {index + 1} (ID:{" "}
                                      {table.reference_id})
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      <strong>Rows:</strong>{" "}
                                      {table.row_count.toLocaleString()} |
                                      <strong>Columns:</strong>{" "}
                                      {table.columns.length} |
                                      <strong>Status:</strong>{" "}
                                      {table.accessible
                                        ? "Accessible"
                                        : "Error"}
                                    </div>
                                    {table.error && (
                                      <div className="text-xs text-red-600 mt-1">
                                        Error: {table.error}
                                      </div>
                                    )}
                                    {table.sample_data &&
                                      table.sample_data.length > 0 && (
                                        <div className="mt-1">
                                          <strong>Sample Data:</strong>
                                          <div className="mt-1 overflow-x-auto">
                                            <table className="min-w-full text-xs border border-gray-300">
                                              <thead className="bg-gray-100">
                                                <tr>
                                                  {Object.keys(
                                                    table.sample_data[0]
                                                  ).map((key) => (
                                                    <th
                                                      key={key}
                                                      className="border border-gray-300 px-1 py-1 text-left"
                                                    >
                                                      {key}
                                                    </th>
                                                  ))}
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {table.sample_data
                                                  .slice(0, 3)
                                                  .map((row, rowIndex) => (
                                                    <tr key={rowIndex}>
                                                      {Object.values(row).map(
                                                        (value, colIndex) => (
                                                          <td
                                                            key={colIndex}
                                                            className="border border-gray-300 px-1 py-1"
                                                          >
                                                            {String(value)}
                                                          </td>
                                                        )
                                                      )}
                                                    </tr>
                                                  ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {consumersTableStatus.error && (
                        <div className="text-red-600 mt-1">
                          <strong>Error:</strong> {consumersTableStatus.error}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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

        {/* Feedback History */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Feedback History
          </h2>

          <div className="space-y-4">
            {/* Feedback History Table Status */}
            {feedbackHistoryStatus && (
              <div className="p-3 bg-blue-50 rounded-md">
                <div className="text-sm text-gray-700 space-y-1">
                  <div>
                    <strong>Message:</strong> {feedbackHistoryStatus.message}
                  </div>
                  {feedbackHistoryStatus.row_count > 0 && (
                    <div>
                      <strong>Row Count:</strong>{" "}
                      {feedbackHistoryStatus.row_count.toLocaleString()}
                    </div>
                  )}
                  {feedbackHistoryStatus.columns &&
                    feedbackHistoryStatus.columns.length > 0 && (
                      <div className="mt-2">
                        <strong>Columns:</strong>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          {feedbackHistoryStatus.columns.map((col, index) => (
                            <div
                              key={index}
                              className="bg-white p-1 rounded border"
                            >
                              <div className="font-mono text-xs">
                                {col.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {col.type}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  {feedbackHistoryStatus.sample_data &&
                    feedbackHistoryStatus.sample_data.length > 0 && (
                      <div className="mt-2">
                        <strong>Sample Data (first 5 rows):</strong>
                        <div className="mt-1 overflow-x-auto">
                          <table className="min-w-full text-xs border border-gray-300">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border border-gray-300 px-2 py-1 text-left">
                                  ID
                                </th>
                                <th className="border border-gray-300 px-2 py-1 text-left">
                                  Feedback
                                </th>
                                <th className="border border-gray-300 px-2 py-1 text-left">
                                  Sentiment
                                </th>
                                <th className="border border-gray-300 px-2 py-1 text-left">
                                  Summary
                                </th>
                                <th className="border border-gray-300 px-2 py-1 text-left">
                                  Timestamp
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {feedbackHistoryStatus.sample_data.map(
                                (row, index) => (
                                  <tr key={index}>
                                    <td className="border border-gray-300 px-2 py-1">
                                      {row.id}
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1">
                                      {row.customer_feedback}
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1">
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                        {row.sentiment}
                                      </span>
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1">
                                      {row.summary}
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1">
                                      {new Date(
                                        row.created_at
                                      ).toLocaleString()}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  {feedbackHistoryStatus.error && (
                    <div className="text-red-600 mt-1">
                      <strong>Error:</strong> {feedbackHistoryStatus.error}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
