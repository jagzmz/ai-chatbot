/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import type { Message } from "ai";
import cx from "classnames";
import { motion } from "framer-motion";

import { SparklesIcon } from "./icons";
import { Markdown } from "./markdown";
import { useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  Line,
  Bar,
  Area,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface ChartConfig {
  type: "line" | "bar" | "area" | "pie";
  title: string;
  xKey: string;
  yKeys: string[];
  description?: string;
  takeaway?: string;
  multipleLines?: boolean;
  measurementColumn?: string;
  lineCategories?: string[];
  colors?: Record<string, string>;
  legend?: boolean;
}

const getRandomColor = (index: number) => {
  const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF6F61", "#6A0572", "#FFC300", "#8338EC", "#3A86FF", "#FFD700", "#FF5733", "#C70039", "#900C3F", "#581845"];

  return colors[index % colors.length];
};

const RenderChart = ({ data, config }: { data: any; config: any }) => {
  const defaultColors = [
    getRandomColor(1),
    getRandomColor(2),
    getRandomColor(3),
    getRandomColor(4),
    getRandomColor(5),
  ];

  const getColor = (key: string, index: number) =>
    defaultColors[index % defaultColors.length];

  const formatNumber = (value: number | string) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
    }).format(numValue);
  };

  // Custom tooltip formatter that handles both value and name formatting
  const tooltipFormatter = (value: number | string, name: string) => {
    const formattedValue = formatNumber(value);
    const label = config.keyLabels?.[name] || name;
    return [formattedValue, label];
  };

  // Transform data if it's in the query result format
  const transformedData =
    config.type === "line" && Array.isArray(data)
      ? data.map((item: any) => ({
          [config.xKey]: item[config.xKey],
          ...config.yKeys.reduce((acc: any, key: string) => {
            acc[key] = parseFloat(item[key].replace(/[^0-9.-]+/g, ""));
            return acc;
          }, {}),
        }))
      : data;

    const displayComponent = () => {
        if (transformedData.length <= 1) return null;
        switch (config.type) {
            case "line":
              return (
                <LineChart data={transformedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey={config.xKey}
                    tickFormatter={(value) => {
                      if (typeof value === "string" && value.includes("-")) {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        });
                      }
                      return value;
                    }}
                  />
                  <YAxis
                    width={80}
                    tickFormatter={formatNumber}
                    allowDataOverflow={false}
                  />
                  <Tooltip
                    formatter={tooltipFormatter}
                    labelFormatter={(label) => {
                      if (typeof label === "string" && label.includes("-")) {
                        const date = new Date(label);
                        return date.toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        });
                      }
                      return label;
                    }}
                  />
                  {config.legend && <Legend />}
                  {config.yKeys.map((key: string, index: number) => {
                    return (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={getColor(key, index)}
                        name={config.keyLabels?.[key] || key}
                        strokeWidth={2}
                      />
                    );
                  })}
                </LineChart>
              );
              break;

            case "bar":
              return (
                <BarChart data={transformedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={config.xKey} />
                  <YAxis width={80} tickFormatter={formatNumber} />
                  <Tooltip formatter={tooltipFormatter} />
                  {config.yKeys.map((key: string, index: number) => {
                    return (
                      <Bar
                        key={key}
                        dataKey={key}
                        fill={getColor(key, index)}
                      />
                    );
                  })}
                </BarChart>
              );
              break;
            case "pie":
              // For pie charts, we typically use the first yKey as the value
              const valueKey = config.yKeys[0];
              const total = data.reduce(
                (sum: number, item: any) => sum + item[valueKey],
                0
              );

              // Transform data for pie chart
              const transformDataPie = (rawData: any) => {
                if (!rawData) return rawData;

                if (config.type === "pie") {
                  return rawData.map((item: any) => ({
                    name: item[config.xKey],
                    value: parseFloat(item[config.yKeys[0]]),
                  }));
                }

                // Return original data for other chart types
                return rawData;
              };

              const transformedDataPie = transformDataPie(data);

              const renderPieChart = () => {
                return (
                  <PieChart>
                    <Pie
                      data={transformedDataPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      label={({ name, value, percent }) => 
                        `${name}: ${formatNumber(value)} (${(percent * 100).toFixed(1)}%)`
                      }
                      labelLine={true}
                    >
                      {transformedData.map((_: any, index: number) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={defaultColors[index % defaultColors.length]}
                        />
                      ))}
                    </Pie>
                    {config.legend && <Legend />}
                    <Tooltip 
                      formatter={(value: number) => formatNumber(value)}
                    />
                  </PieChart>
                );
              };

              return renderPieChart();
              break;
            default:
              return <LineChart data={transformedData}></LineChart>;
          }
    }

    const DisplayComponent = displayComponent();

  return (
    <div className="w-full h-max">
      <h3 className="text-lg font-semibold mb-4">{config.title}</h3>
      <div style={{ width: '100%', height: '800px' }}>
        <ResponsiveContainer width="100%" height="100%">
          {DisplayComponent ? DisplayComponent : <div> No Data</div>}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const PreviewMessage = ({ message }: { message: Message }) => {
  
  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role={message.role}
    >
      <div
        className={cx(
          "group-data-[role=user]/message:bg-primary group-data-[role=user]/message:text-primary-foreground flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl"
        )}
      >
        {message.role === "assistant" && (
          <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
            <SparklesIcon size={14} />
          </div>
        )}

        <div className="flex flex-col gap-2 w-full">
          {message.content && (
            <div className="flex flex-col gap-4">
              <Markdown>{message.content}</Markdown>
            </div>
          )}

          {message.toolInvocations && message.toolInvocations.length > 0 && (
            <div className="flex flex-col gap-4">
              {message.toolInvocations.map((toolInvocation) => {
                const { toolName, toolCallId, state, args } = toolInvocation;
                if (state === "result") {
                  const { result } = toolInvocation;
                  return (
                    <div key={toolCallId}>
                      {toolName === "retrieveDataFromSystem" &&
                        args.isChartVisualization &&
                        result.queryResult &&
                        result.config && (
                          <RenderChart
                            data={result.queryResult}
                            config={result.config}
                          />
                        )}
                      {/* <pre className="text-muted-foreground text-sm mb-4 italic">
                        {JSON.stringify(
                          { result, args, toolName, state },
                          null,
                          2
                        )}
                      </pre> */}
                    </div>
                  );
                }
                return (
                  <div
                    key={toolCallId}
                    className={cx({
                      skeleton: ["getWeather"].includes(toolName),
                    })}
                  >
                    <pre className="text-muted-foreground text-sm mb-4 italic">
                      Retrieving data...
                    </pre>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const ThinkingMessage = () => {
  const role = "assistant";

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          "flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl",
          {
            "group-data-[role=user]/message:bg-muted": true,
          }
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Thinking...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
