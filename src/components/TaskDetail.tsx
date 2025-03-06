'use client'

import React from 'react'

interface Task {
  id: string
  title: string
  description: string
  todos: { id: number; text: string; completed: boolean }[]
}

interface TaskDetailProps {
  selectedTask: Task | null
}

export default function TaskDetail({ selectedTask }: TaskDetailProps) {
  if (!selectedTask) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-full flex items-center justify-center">
        <p className="text-gray-500">タスクを選択してください</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <h2 className="text-xl font-bold text-gray-800 mb-4">[{selectedTask.title}]</h2>
      <p className="text-gray-600 mb-6">{selectedTask.description}</p>
      <div className="space-y-3">
        {selectedTask.todos.map((todo) => (
          <div key={todo.id} className="flex items-center">
            <input
              type="checkbox"
              checked={todo.completed}
              readOnly
              className="w-5 h-5 mr-3"
            />
            <span className={`text-gray-800 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
              {todo.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
} 