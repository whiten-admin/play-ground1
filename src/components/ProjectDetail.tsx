import React from 'react'

export default function ProjectDetail() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">PJ詳細の入力</h2>
        <span className="text-sm text-gray-600">進捗度：20%</span>
      </div>
      <p className="text-gray-600 mb-6">入力すればするほど提案内容がよくなるよ！</p>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-800">チーム構成</span>
          <span className="text-sm text-red-600">未入力</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-800">プロジェクトスコープ</span>
          <span className="text-sm text-green-600">入力済み</span>
        </div>
      </div>
    </div>
  )
} 