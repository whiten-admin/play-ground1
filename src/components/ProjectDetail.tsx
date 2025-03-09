import React from 'react'

export default function ProjectDetail() {
  return (
    <div className="bg-white rounded-lg shadow p-3 text-xs">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-gray-800">PJ詳細</h2>
        <span className="text-gray-600">20%</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">チーム構成</span>
          <span className="text-red-600">●</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">スコープ</span>
          <span className="text-green-600">●</span>
        </div>
      </div>
    </div>
  )
} 