import React from 'react'

export default function AdditionalTask() {
  const tasks = [
    { id: 1, text: 'タスクオプション1' },
    { id: 2, text: 'タスクオプション2' },
    { id: 3, text: 'タスクオプション3' },
  ]

  return (
    <div className="bg-white rounded-lg shadow p-6">
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