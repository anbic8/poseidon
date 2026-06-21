'use client'

import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, TooltipProps,
} from 'recharts'
import { formatTime, formatDate } from '@/lib/time'

type DataPoint = { date: string; timeMs: number; competitionName: string }

function useIsDark() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const update = () => setDark(document.documentElement.classList.contains('dark'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return dark
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as DataPoint
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-mono font-bold text-blue-700 dark:text-blue-400 text-base">{formatTime(d.timeMs)}</p>
      <p className="text-gray-700 dark:text-slate-300 mt-0.5">{d.competitionName}</p>
      <p className="text-gray-400 dark:text-slate-500 text-xs">{formatDate(d.date)}</p>
    </div>
  )
}

export function ProgressChart({ data }: { data: DataPoint[] }) {
  const dark = useIsDark()

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-44 text-gray-400 dark:text-slate-500 text-sm">
        Noch keine Wettkampfdaten für diese Auswahl.
      </div>
    )
  }

  const times   = data.map((d) => d.timeMs)
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  const pad     = Math.max((maxTime - minTime) * 0.15, 1000)

  const gridColor  = dark ? '#334155' : '#f0f0f0'
  const axisColor  = dark ? '#64748b' : '#9ca3af'
  const lineColor  = dark ? '#60a5fa' : '#2563eb'
  const dotColor   = dark ? '#60a5fa' : '#2563eb'

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => new Date(d).toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })}
          tick={{ fontSize: 11, fill: axisColor }}
        />
        <YAxis
          domain={[minTime - pad, maxTime + pad]}
          reversed
          tickFormatter={(ms) => formatTime(ms)}
          tick={{ fontSize: 11, fill: axisColor }}
          width={65}
        />
        <Tooltip content={<ChartTooltip />} />
        <Line
          type="monotone"
          dataKey="timeMs"
          stroke={lineColor}
          strokeWidth={2}
          dot={{ fill: dotColor, r: 4 }}
          activeDot={{ r: 6, fill: dotColor }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
