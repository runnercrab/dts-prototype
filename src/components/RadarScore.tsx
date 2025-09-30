'use client'

import { useEffect, useRef } from 'react'
import { Chart, ChartData } from 'chart.js/auto' // auto-registra todo

export default function RadarScore({
  labels,
  values,
}: {
  labels: string[]
  values: number[]
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    const data: ChartData<'radar'> = {
      labels,
      datasets: [
        {
          label: 'DTS',
          data: values,
          borderColor: 'rgba(16,185,129,1)',      // emerald-500
          backgroundColor: 'rgba(16,185,129,0.15)',
          pointBackgroundColor: 'rgba(16,185,129,1)',
          pointBorderColor: '#0f172a',            // slate-900
          pointHoverRadius: 5,
          borderWidth: 2,
        },
      ],
    }

    chartRef.current?.destroy()
    chartRef.current = new Chart(ctx, {
      type: 'radar',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            min: 0,
            max: 10,
            angleLines: { color: 'rgba(255,255,255,0.08)' },
            grid: { color: 'rgba(255,255,255,0.08)' },
            pointLabels: { color: '#d4d4d4', font: { size: 12 } },
            ticks: {
              stepSize: 2,
              color: '#a3a3a3',
              // 👇 quita el fondo blanco de los números
              showLabelBackdrop: false,
              backdropColor: 'transparent',
            },
          },
        },
        plugins: {
          legend: { labels: { color: '#e5e5e5' } },
        },
      },
    })

    return () => chartRef.current?.destroy()
  }, [labels, values])

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="mb-3">Radar de Madurez (0–10)</h2>
        <div className="relative h-[360px] md:h-[520px]">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  )
}
