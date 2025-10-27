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
          borderColor: 'rgba(37, 99, 235, 1)',      // azul corporativo #2563eb
          backgroundColor: 'rgba(37, 99, 235, 0.15)', // azul corporativo con transparencia
          pointBackgroundColor: 'rgba(37, 99, 235, 1)', // azul corporativo
          pointBorderColor: '#ffffff',               // blanco para contraste
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
            angleLines: { color: 'rgba(226, 232, 240, 0.3)' }, // líneas más visibles en tema claro
            grid: { color: 'rgba(226, 232, 240, 0.5)' },       // grid más visible
            pointLabels: { 
              color: '#0f172a',  // texto oscuro para tema claro
              font: { size: 12, weight: 600 } 
            },
            ticks: {
              stepSize: 2,
              color: '#64748b',  // texto gris para tema claro
              showLabelBackdrop: false,
              backdropColor: 'transparent',
            },
          },
        },
        plugins: {
          legend: { 
            labels: { 
              color: '#0f172a',  // texto oscuro para tema claro
              font: { size: 13, weight: 600 }
            } 
          },
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