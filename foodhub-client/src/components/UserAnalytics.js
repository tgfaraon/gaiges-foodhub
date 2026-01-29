import { useState, useEffect } from "react";
import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function UserAnalytics({ token }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const effectiveToken =
          token || localStorage.getItem("token") || sessionStorage.getItem("token");

        if (!effectiveToken) throw new Error("No token available");

        const res = await fetch(`${apiUrl}/api/admin/analytics`, {
          headers: { Authorization: `Bearer ${effectiveToken}` },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to load analytics: ${text}`);
        }

        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        console.error("❌ Error loading analytics:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [token]);

  if (loading) return <p>Loading analytics...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!analytics) return <p>No analytics data available.</p>;

  const chartData = {
    labels: ["Total Users", "Active Users", "Lessons Completed"],
    datasets: [
      {
        label: "Food Hub Analytics",
        data: [
          analytics.totalUsers,
          analytics.activeUsers,
          analytics.lessonsCompleted,
        ],
        backgroundColor: ["#4caf50", "#2196f3", "#ff9800"],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "User Analytics Overview" },
    },
  };

  return (
    <div className="user-analytics">
      <h2>User Analytics</h2>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
}