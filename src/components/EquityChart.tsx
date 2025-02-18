import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Format large numbers with commas (e.g., 20000 => "20,000")
const formatNumber = (value: number) => {
  return value.toLocaleString();
};

// Format date (month/day) for the X-axis label
const formatDate = (dateString: string) => {
  const dateObj = new Date(dateString);
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

// Format full date/time (e.g., "Jan 21, 2025, 2:05 PM") for the tooltip
const formatDateTime = (dateString: string) => {
  const dateObj = new Date(dateString);
  return dateObj.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// A custom X-axis tick that only renders a label if it's set in the data
const CustomXAxisTick = (props: any) => {
  const { x, y, index, chartData } = props;
  const label = chartData && chartData[index] ? chartData[index].xLabel : "";

  // If there's no label (duplicate date), don't render text
  if (!label) return null;

  return (
    <text
      x={x}
      y={y + 5}
      textAnchor="end"
      fill="#666"
      fontSize={12}
      // Rotate each label -45 degrees to avoid overlap
      transform={`rotate(-45, ${x}, ${y})`}
    >
      {label}
    </text>
  );
};

const EquityChart = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Calculate the current time in seconds and 30 days ago in seconds
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

    // Build the URL to get the last 30 days
    const url = `https://wf3-fastapi.wealthfarming.org/dapp/timeseries/timestamp-equity?start_timestamp=${thirtyDaysAgo}&end_timestamp=${now}&is_test=true`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        const { timestamp, equity_sum } = data.data;

        // 1) Build an array of points, each with a full ISO date and equity
        const rawData = timestamp.map((ts: number, index: number) => ({
          fullDate: new Date(ts * 1000).toISOString(),
          equity: equity_sum[index],
        }));

        // 2) Sort by date
        const sortedData = rawData.sort(
          (a: any, b: any) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
        );

        // 3) Group by calendar day and count the number of data points per day
        const dayCountMap: Record<string, number> = {};
        sortedData.forEach((item: any) => {
          const dayKey = new Date(item.fullDate).toLocaleDateString("en-US");
          dayCountMap[dayKey] = (dayCountMap[dayKey] || 0) + 1;
        });

        // 4) Filter out any data points that belong to days with 5 or fewer data points
        const filteredData = sortedData.filter((item: any) => {
          const dayKey = new Date(item.fullDate).toLocaleDateString("en-US");
          return dayCountMap[dayKey] > 5;
        });

        // 5) Mark which points should get an X-axis label (first occurrence per day)
        let lastDay = "";
        const processedData = filteredData.map((item: any) => {
          const dayStr = formatDate(item.fullDate); // e.g., "Jan 21"
          const xLabel = dayStr !== lastDay ? dayStr : "";
          lastDay = dayStr;
          return {
            ...item,
            xLabel, // for the custom X-axis tick
          };
        });

        // 6) Finally, set the chart data
        setChartData(processedData);

        setLoading(false);
      })
      .catch((err: Error) => {
        console.error("Error fetching data:", err);
        setError(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading chart data...</div>;
  if (error) return <div>Error loading chart data</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equity Time Series</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" />

            {/* Force a tick for every data point and rotate labels */}
            <XAxis
              dataKey="fullDate"
              tick={(props) => <CustomXAxisTick {...props} chartData={chartData} />}
              interval={0}
              height={60}
            />

            <YAxis
              domain={["dataMin", "dataMax"]}
              tickFormatter={(value) => formatNumber(value)}
              tick={{ fontSize: 12 }}
            />

            <Tooltip
              labelFormatter={(label) => `Date: ${formatDateTime(label)}`}
              formatter={(value: number) => formatNumber(value)}
            />

            <Line
              type="monotone"
              dataKey="equity"
              stroke="#8884d8"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default EquityChart;
