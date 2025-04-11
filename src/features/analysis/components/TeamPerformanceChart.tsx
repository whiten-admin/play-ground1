'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

// コンポーネント内でChart.jsを登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TeamPerformanceChart: React.FC = () => {
  // サンプルデータ
  const data = {
    labels: ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本'],
    datasets: [
      {
        label: '完了タスク数',
        data: [12, 8, 15, 9, 7, 11, 10],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: '進行中タスク数',
        data: [3, 5, 2, 4, 6, 3, 2],
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        stacked: false,
      },
      y: {
        stacked: false,
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="h-64">
      <Bar data={data} options={options} />
    </div>
  );
};

export default TeamPerformanceChart; 