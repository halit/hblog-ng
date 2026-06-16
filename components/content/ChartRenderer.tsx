'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  AlertTriangle,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Activity,
  Download,
  CheckCircle,
  Copy,
} from 'lucide-react';
import BlockHeader from '@/components/ui/BlockHeader';
import html2canvas from 'html2canvas';
import { BRAND_COLORS, CHART_PALETTE } from '@/config/theme';

interface ChartRendererProps {
  data: string;
  type?: string;
  /** Key used for the X-axis */
  xKey?: string;
  /** Keys for Y-axis data series */
  yKeys?: string[] | string;
  title?: string;
  height?: number;
  colors?: string[];
  stacked?: boolean;
}

const DEFAULT_PALETTE = Array.from(CHART_PALETTE);

// Separated Tooltip Component for cleaner code
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    color: string;
    name: string;
    value: string | number;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0f14] border border-gray-800 p-2 rounded shadow-xl z-50 bg-opacity-95 backdrop-blur-sm">
        <p className="text-gray-300 font-mono mb-1 text-xs">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5 text-xs mt-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-400">{entry.name}:</span>
            <span className="text-white font-bold font-mono">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Helper to parse prop values from string (Markdown attributes) to appropriate types
const parsePropValue = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();

  // Boolean
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // Number
  if (!isNaN(Number(trimmed)) && trimmed !== '') return Number(trimmed);

  // Object / Array (JSON-like)
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      // Try strict JSON first
      return JSON.parse(trimmed);
    } catch {
      // Try relaxed JSON (add quotes to keys)
      try {
        const relaxed = trimmed
          .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3') // Quote keys
          .replace(/'/g, '"'); // Replace single quotes with double quotes
        return JSON.parse(relaxed);
      } catch {
        return value;
      }
    }
  }

  return value;
};

// Helper to parse raw data (JSON or CSV)
const parseChartData = (rawData: string): Record<string, string | number>[] | null => {
  try {
    const trimmed = rawData.trim();

    // Try JSON first
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const json = JSON.parse(trimmed);
        return Array.isArray(json) ? json : json.data || [];
      } catch (e) {
        console.warn('Failed to parse JSON chart data', e);
        return [];
      }
    }

    // Try CSV
    // Assume first row is header
    const lines = trimmed.split('\n').filter((l) => l.trim());
    if (lines.length < 2) return [];

    const separator = lines[0].includes('\t') ? '\t' : lines[0].includes(',') ? ',' : ' ';
    const headers = lines[0].split(separator).map((h) => h.trim().replace(/^"|"$/g, ''));

    return lines.slice(1).map((line) => {
      const values = line.split(separator).map((v) => v.trim().replace(/^"|"$/g, ''));
      const obj: Record<string, string | number> = {};
      headers.forEach((header, i) => {
        const val = values[i];
        // Try to convert to number
        const num = parseFloat(val);
        obj[header] = !isNaN(num) && val.match(/^-?\d*(\.\d+)?$/) ? num : val;
      });
      return obj;
    });
  } catch (e) {
    console.error('Failed to parse chart data', e);
    return null;
  }
};

const ChartRenderer: React.FC<ChartRendererProps> = ({
  data: rawData,
  type = 'bar',
  xKey = 'name',
  yKeys,
  title,
  height: initialHeight = 400,
  colors = DEFAULT_PALETTE,
  stacked: initialStacked = false,
  ...rest
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);
  const [fetchedData, setFetchedData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Process props that might come as strings from Markdown
  const { height, stacked, processedRest } = useMemo(() => {
    const h = parsePropValue(initialHeight);
    const s = parsePropValue(initialStacked);
    const pr: Record<string, unknown> = {};

    Object.entries(rest).forEach(([key, value]) => {
      pr[key] = parsePropValue(value);
    });

    return {
      height: typeof h === 'number' ? h : 400,
      stacked: !!s,
      processedRest: pr,
    };
  }, [initialHeight, initialStacked, rest]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if the data is a URL/path or raw content
  const isExternalFile = useMemo(() => {
    const trimmed = rawData.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) return false;
    if (trimmed.includes('\n')) return false;
    return trimmed.match(/\.(csv|json)$/i) || trimmed.startsWith('/') || trimmed.startsWith('http');
  }, [rawData]);

  // Fetch external data
  useEffect(() => {
    if (isExternalFile) {
      const fetchData = async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
          let url = rawData.trim();
          if (!url.startsWith('http') && !url.startsWith('/')) {
            url = '/' + url;
          }

          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to load chart data: ${res.statusText}`);
          const text = await res.text();
          setFetchedData(text);
        } catch (e) {
          console.error('Chart data fetch error:', e);
          setFetchError(e instanceof Error ? e.message : 'Failed to fetch data');
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    } else {
      setFetchedData(null);
    }
  }, [isExternalFile, rawData]);

  const activeData = fetchedData || rawData;

  const handleCopyImage = async () => {
    if (!chartContainerRef.current || copying) return;

    try {
      setCopying(true);

      const canvas = await html2canvas(chartContainerRef.current, {
        backgroundColor: '#0a0f14',
        scale: 2,
        logging: false,
        useCORS: true,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('.recharts-responsive-container');
          if (clonedElement instanceof HTMLElement) {
            clonedElement.style.fontFamily = '"JetBrains Mono", monospace';
          }
        },
      });

      const finalCanvas = document.createElement('canvas');
      const scale = 2;
      const headerHeight = 32 * scale;
      const padding = 16 * scale;

      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height + headerHeight;

      const ctx = finalCanvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get 2d context');

      // Background
      ctx.fillStyle = '#101725';
      ctx.fillRect(0, 0, finalCanvas.width, headerHeight);

      // Border
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(0, headerHeight);
      ctx.lineTo(finalCanvas.width, headerHeight);
      ctx.stroke();

      // Source URL
      const sourceUrl = `Source: ${window.location.href}`;
      ctx.font = `${12 * scale}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#9ca3af';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(sourceUrl, padding, headerHeight / 2);

      // Chart
      ctx.drawImage(canvas, 0, headerHeight);

      finalCanvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setTimeout(() => setCopying(false), 2000);
        } catch (err) {
          console.error('Failed to copy image to clipboard', err);
          setCopying(false);
        }
      });
    } catch (err) {
      console.error('Failed to generate image from chart', err);
      setCopying(false);
    }
  };

  const handleDownloadData = () => {
    if (!activeData) return;
    const blob = new Blob([activeData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chart-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const { chartProps, componentProps } = useMemo(() => {
    const cProps: Record<string, unknown> = {};
    const compProps: Record<string, Record<string, unknown>> = {
      xAxis: {},
      yAxis: {},
      cartesianGrid: {},
      tooltip: {},
      legend: {},
      brush: {},
      referenceLine: {},
    };

    Object.entries(processedRest).forEach(([key, value]) => {
      const separator = key.includes('-') ? '-' : key.includes('_') ? '_' : null;

      if (separator) {
        const [prefix, ...suffixParts] = key.split(separator);
        const suffix = suffixParts.join(separator);
        const normalizedPrefix = Object.keys(compProps).find(
          (k) => k.toLowerCase() === prefix.toLowerCase(),
        );

        if (normalizedPrefix) {
          compProps[normalizedPrefix][suffix] = value;
          return;
        }
      }
      cProps[key] = value;
    });

    return { chartProps: cProps, componentProps: compProps };
  }, [processedRest]);

  const parsedData = useMemo<Record<string, string | number>[]>(() => {
    if (isLoading || fetchError) return [];
    if (!activeData) return [];
    return parseChartData(activeData) || [];
  }, [activeData, isLoading, fetchError]);

  const dataKeys = useMemo(() => Object.keys(parsedData[0] || {}), [parsedData]);
  const actualXKey = useMemo(
    () => (xKey && dataKeys.includes(xKey) ? xKey : dataKeys[0]),
    [xKey, dataKeys],
  );

  const actualYKeys = useMemo(() => {
    if (yKeys) {
      if (Array.isArray(yKeys)) return yKeys;
      if (typeof yKeys === 'string') {
        return yKeys
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean);
      }
    }
    return dataKeys.filter((k) => k !== actualXKey);
  }, [yKeys, dataKeys, actualXKey]);

  if (isLoading) {
    return (
      <div className="relative group my-8">
        <div className="bg-[#0a0f14] border border-gray-800 rounded-lg overflow-hidden shadow-xl p-12 flex justify-center items-center">
          <div className="flex flex-col items-center gap-2 text-gray-500 animate-pulse">
            <Activity size={24} />
            <span className="font-mono text-xs">Loading chart data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError || !parsedData) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 p-4 rounded flex items-center gap-3 text-red-500 my-8">
        <AlertTriangle size={20} />
        <span>
          {fetchError || 'Failed to parse chart data. Please check format (JSON or CSV).'}
        </span>
      </div>
    );
  }

  if (parsedData.length === 0) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/50 p-4 rounded flex items-center gap-3 text-yellow-500 my-8">
        <AlertTriangle size={20} />
        <span>No data found to render chart.</span>
      </div>
    );
  }

  const getChartIcon = () => {
    switch (type.toLowerCase()) {
      case 'line':
        return LineChartIcon;
      case 'area':
        return Activity;
      case 'pie':
        return PieChartIcon;
      case 'bar':
      default:
        return BarChartIcon;
    }
  };

  const renderChart = () => {
    const commonProps = {
      data: parsedData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
      ...chartProps,
    };

    const isVertical = chartProps.layout === 'vertical';

    const axisCommon = {
      stroke: BRAND_COLORS.text,
      tick: { fill: BRAND_COLORS.text, fontSize: 12 },
      tickLine: { stroke: BRAND_COLORS.grid },
    };

    switch (type.toLowerCase()) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={BRAND_COLORS.grid}
              vertical={isVertical}
              horizontal={!isVertical}
              {...componentProps.cartesianGrid}
            />
            <XAxis
              dataKey={isVertical ? undefined : actualXKey}
              type={isVertical ? 'number' : 'category'}
              {...axisCommon}
              {...componentProps.xAxis}
            />
            <YAxis
              dataKey={isVertical ? actualXKey : undefined}
              type={isVertical ? 'category' : 'number'}
              {...axisCommon}
              {...componentProps.yAxis}
            />
            <Tooltip content={<CustomTooltip />} {...componentProps.tooltip} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} {...componentProps.legend} />
            {actualYKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={3}
                dot={{ r: 4, fill: '#0a0f14', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: colors[index % colors.length] }}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={BRAND_COLORS.grid}
              vertical={isVertical}
              horizontal={!isVertical}
              {...componentProps.cartesianGrid}
            />
            <XAxis
              dataKey={isVertical ? undefined : actualXKey}
              type={isVertical ? 'number' : 'category'}
              {...axisCommon}
              {...componentProps.xAxis}
            />
            <YAxis
              dataKey={isVertical ? actualXKey : undefined}
              type={isVertical ? 'category' : 'number'}
              {...axisCommon}
              {...componentProps.yAxis}
            />
            <Tooltip content={<CustomTooltip />} {...componentProps.tooltip} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} {...componentProps.legend} />
            {actualYKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId={stacked ? '1' : undefined}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.2}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        // For pie chart, we usually want one value key and the xKey as label
        const valueKey = actualYKeys[0];
        return (
          <PieChart {...commonProps}>
            <Pie
              data={parsedData}
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="70%"
              paddingAngle={5}
              dataKey={valueKey}
              nameKey={actualXKey}
              label={({ cx, cy, midAngle, outerRadius, percent }) => {
                if (!percent || percent < 0.05) return null;
                const RADIAN = Math.PI / 180;
                const radius = outerRadius * 1.2;
                const currentMidAngle = midAngle || 0;
                const x = cx + radius * Math.cos(-currentMidAngle * RADIAN);
                const y = cy + radius * Math.sin(-currentMidAngle * RADIAN);

                return (
                  <text
                    x={x}
                    y={y}
                    fill="white"
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    fontSize={12}
                    className="font-mono"
                  >
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
              {...chartProps}
            >
              {parsedData.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                  stroke="#0a0f14"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} {...componentProps.tooltip} />
            <Legend {...componentProps.legend} />
          </PieChart>
        );

      case 'bar':
      default:
        return (
          <BarChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={BRAND_COLORS.grid}
              vertical={isVertical}
              horizontal={!isVertical}
              {...componentProps.cartesianGrid}
            />
            <XAxis
              dataKey={isVertical ? undefined : actualXKey}
              type={isVertical ? 'number' : 'category'}
              {...axisCommon}
              {...componentProps.xAxis}
            />
            <YAxis
              dataKey={isVertical ? actualXKey : undefined}
              type={isVertical ? 'category' : 'number'}
              {...axisCommon}
              {...componentProps.yAxis}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: '#ffffff0a' }}
              {...componentProps.tooltip}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} {...componentProps.legend} />
            {actualYKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                stackId={stacked ? 'a' : undefined}
                fill={colors[index % colors.length]}
                radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );
    }
  };

  return (
    <div className="relative group my-8">
      <div
        className="bg-[#0a0f14] border border-gray-800 rounded-lg overflow-hidden shadow-xl focus:outline-none outline-none active:outline-none"
        tabIndex={-1}
      >
        <BlockHeader
          title={title || `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`}
          icon={getChartIcon()}
          rightElement={
            <div className="flex gap-2">
              {isExternalFile && (
                <button
                  onClick={handleDownloadData}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono border border-gray-700 flex items-center gap-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                  title="Download CSV"
                >
                  <Download size={12} />
                  <span>CSV</span>
                </button>
              )}
              <button
                onClick={handleCopyImage}
                disabled={copying}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono border border-gray-700 flex items-center gap-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 focus:outline-none"
              >
                {copying ? <CheckCircle size={12} className="text-defense" /> : <Copy size={12} />}
                {copying ? 'Copied' : 'Copy Image'}
              </button>
            </div>
          }
        />
        <div ref={chartContainerRef} className="p-2 sm:p-4 bg-[#0a0f14]" style={{ width: '100%' }}>
          {mounted ? (
            <ResponsiveContainer width="100%" height={height} minWidth={0}>
              {renderChart()}
            </ResponsiveContainer>
          ) : (
            <div
              className="flex items-center justify-center text-gray-500 text-xs font-mono"
              style={{ height }}
            >
              Loading chart...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartRenderer;
