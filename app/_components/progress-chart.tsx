'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, TooltipProps,
} from 'recharts'
import { formatTime, formatDate } from '@/lib/time'

type DataPoint = { date: string; timeMs: number; competitionName: string }

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as DataPoint
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-mono font-bold text-blue-700 text-base">{formatTime(d.timeMs)}</p>
      <p className="text-gray-700 mt-0.5">{d.competitionName}</p>
      <p className="text-gray-400 text-xs">{formatDate(d.date)}</p>
    </div>
  )
}

export function ProgressChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-44 text-gray-400 text-sm">
        Noch keine Wettkampfdaten für diese Auswahl.
      </div>
    )
  }

  const times   = data.map((d) => d.timeMs)
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  const pad     = Math.max((maxTime - minTime) * 0.15, 1000)

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) =>
            new Date(d).toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })
          }
          tick={{ fontSize: 11 }}
        />
        <YAxis
          domain={[minTime - pad, maxTime + pad]}
          reversed
          tickFormatter={(ms) => formatTime(ms)}
          tick={{ fontSize: 11 }}
          width={65}
        />
        <Tooltip content={<ChartTooltip />} />
        <Line
          type="monotone"
          dataKey="timeMs"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ fill: '#2563eb', r: 4 }}
          activeDot={{ r: 6, fill: '#1d4ed8' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
