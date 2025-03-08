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
    <div className="bg-white rounded-lg shadow p-3">
      <h2 className="text-base font-bold mb-2">今日のTODO</h2>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onTaskSelect(task.id)}
            className={`p-2 rounded-lg cursor-pointer transition-colors ${
              selectedTaskId === task.id
                ? 'bg-blue-50 border border-blue-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-sm">{task.title}</h3>
              {task.isNew && (
                <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                  NEW
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>完了: {task.todos.filter(t => t.completed).length}/{task.todos.length}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-right">
        <a href="#" className="text-blue-500 hover:text-blue-600 text-xs">
          カレンダーで確認 →
        </a>
      </div>
    </div>
  )
} 