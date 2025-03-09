import React from 'react'

export default function AdditionalTask() {
  const tasks = [
    { id: 1, text: 'タスクオプション1' },
    { id: 2, text: 'タスクオプション2' },
    { id: 3, text: 'タスクオプション3' },
  ]

  return (
    <div className="relative bg-white rounded-lg shadow p-6">
      {/* 開発中を示すマスク */}
      <div className="absolute inset-0 bg-gray-500/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
        <div className="bg-white/80 px-4 py-2 rounded-md">
          <span className="text-gray-800 font-medium">開発中...</span>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-4">追加タスクが発生してるかも、、？</h2>
      <div className="space-y-3 mb-4">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center justify-between">
            <span className="text-gray-800">{task.text}</span>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm">
              採用する
            </button>
          </div>
        ))}
      </div>
    </div>
  )
} 