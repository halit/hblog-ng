---
id: chart-examples
title: Chart Capabilities Demo
description: Demonstrating the new charting capabilities using Recharts and D3 concepts.
date: 2025-11-30
---

# Chart Capabilities

This post demonstrates the new charting capabilities integrated into the blog engine. We use `recharts` under the hood to render interactive, responsive charts directly from Markdown code blocks.

## Cyber Threat Intelligence

### Attack Vectors Distribution

Visualizing the most common attack vectors observed in the last quarter.

```chart type="pie" title="Q4 2025 Attack Vectors" height="400"
vector,percentage
Phishing,35
Ransomware,25
DDoS,15
SQL Injection,10
Zero-Day Exploits,8
Insider Threat,7
```

### Malware Campaign Timeline

Tracking the activity of known APT groups over a week.

```chart type="area" title="APT Activity Levels" stacked="true" xKey="day"
day,APT28,Lazarus,Equation Group
Mon,120,80,45
Tue,150,90,60
Wed,180,70,55
Thu,200,110,80
Fri,160,130,70
Sat,90,50,30
Sun,60,40,20
```

### Incident Response Metrics

Comparing Mean Time to Detect (MTTD) and Mean Time to Respond (MTTR) across different severity levels.

```chart type="bar" title="MTTD vs MTTR (Hours)" xKey="severity" yKeys="MTTD,MTTR"
severity,MTTD,MTTR
Critical,0.5,2
High,4,8
Medium,24,48
Low,72,120
```

## External Data (CSV File)

You can load data from an external CSV file. This is great for large datasets like server logs or scan results.

```chart type="area" title="User Growth" xKey="date"
assets/charts/demo-data.csv
```

## Advanced Customization

This chart demonstrates passing advanced attributes to the underlying Recharts library. We are rotating X-axis labels, customizing the grid, and changing bar layout.

```chart type="bar" title="Vulnerability Severity Counts" xKey="name" layout="vertical" height="500" xAxis_type="number" yAxis_type="category" cartesianGrid_strokeDasharray="5 5" margin="{top:20,right:30,left:20,bottom:5}"
name,critical,high,medium,low
Web Servers,5,12,45,120
Database Clusters,2,8,20,50
Internal Workstations,0,5,150,300
Cloud Infrastructure,1,15,30,80
IoT Devices,10,25,60,200
```

## Usage

To use this feature, create a code block with the language `chart` and provide attributes like `type`, `title`, `xKey` (optional, defaults to first column), etc.

Supported types:

- `bar` (default)
- `line`
- `area`
- `pie`

Attributes:

- `type="bar|line|area|pie"`
- `title="My Chart Title"`
- `xKey="name"` (The key to use for X-axis labels)
- `yKeys="val1,val2"` (Comma-separated keys for values, optional - defaults to all other numeric keys)
- `stacked="true"` (For bar and area charts)
- `height="400"` (Height in pixels)
- **External Data**: Just put the path to the CSV/JSON file as the content of the block (e.g., `assets/data.csv`).
- **Advanced**: Pass any Recharts prop directly or namespaced:
  - `layout="vertical"` (for BarChart)
  - `margin="{top:10,left:0}"`
  - `xAxis_angle="-45"` (Passed to XAxis)
  - `yAxis_domain="[0, 'auto']"` (Passed to YAxis)
  - `cartesianGrid_stroke="#333"` (Passed to CartesianGrid)
  - `tooltip_cursor="false"`
