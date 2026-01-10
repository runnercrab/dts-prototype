'use client'

import { useEffect, useRef } from 'react'
import { Chart, ChartData } from 'chart.js/auto'

export default function RadarScore({
  labels,
  asIsValues,
  toBeValues,
  labelAsIs = 'As-Is',
  labelToBe = 'To-Be',
}: {
  labels: string[]
  asIsValues: number[]
  toBeValues?: number[]
  labelAsIs?: string
  labelToBe?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    const datasets: any[] = [
      {
        label: labelAsIs,
        data: asIsValues,
        borderColor: 'rgba(37, 99, 235, 1)',
        backgroundColor: 'rgba(37, 99, 235, 0.12)',
        pointBackgroundColor: 'rgba(37, 99, 235, 1)',
        pointBorderColor: '#ffffff',
        pointHoverRadius: 5,
        borderWidth: 2,
      },
    ]

    if (toBeValues && toBeValues.length === asIsValues.length) {
      datasets.push({
        label: labelToBe,
        data: toBeValues,
        borderColor: 'rgba(99, 102, 241, 1)',
        backgroundColor: 'rgba(99, 102, 241, 0.10)',
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointBorderColor: '#ffffff',
        pointHoverRadius: 5,
        borderWidth: 2,
      })
    }

    const data: ChartData<'radar'> = {
      labels,
      datasets,
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
            angleLines: { color: 'rgba(226, 232, 240, 0.3)' },
            grid: { color: 'rgba(226, 232, 240, 0.5)' },
            pointLabels: {
              color: '#0f172a',
              font: { size: 12, weight: 600 },
            },
            ticks: {
              stepSize: 2,
              color: '#64748b',
              showLabelBackdrop: false,
              backdropColor: 'transparent',
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: '#0f172a',
              font: { size: 13, weight: 600 },
            },
          },
        },
      },
    })

    return () => chartRef.current?.destroy()
  }, [labels, asIsValues, toBeValues, labelAsIs, labelToBe])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-900">
          Radar de Madurez (0–10)
        </h2>
      </div>
      <div className="p-5">
        <div className="relative h-[320px] md:h-[440px]">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  )
}
