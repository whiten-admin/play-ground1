'use client'

import React from 'react'

interface Task {
  id: string
  title: string
  description: string
  todos: { id: string; text: string; completed: boolean }[]
  isNew?: boolean
}

interface TodayTodoProps {
  tasks: Task[]
  selectedTaskId: string | null
  onTaskSelect: (taskId: string) => void
}

export default function TodayTodo({ tasks, selectedTaskId, onTaskSelect }: TodayTodoProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">今日のTODO</h2>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onTaskSelect(task.id)}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              selectedTaskId === task.id
                ? 'bg-blue-50 border border-blue-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{task.title}</h3>
              {task.isNew && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  NEW
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>完了: {task.todos.filter(t => t.completed).length}/{task.todos.length}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-right">
        <a href="#" className="text-blue-500 hover:text-blue-600 text-sm">
          カレンダーで確認 →
        </a>
      </div>
    </div>
  )
} 