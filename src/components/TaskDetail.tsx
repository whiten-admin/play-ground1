'use client'

import React, { useState } from 'react'
import { IoAdd, IoTrash, IoPencil, IoSave, IoClose } from 'react-icons/io5'

interface Todo {
  id: string
  text: string
  completed: boolean
}

interface Task {
  id: string
  title: string
  description: string
  todos: Todo[]
  isNew?: boolean
}

interface TaskDetailProps {
  selectedTask: Task | null
  onTaskUpdate?: (updatedTask: Task) => void
}

interface EditState {
  title: boolean
  description: boolean
  todos: { [key: string]: boolean }
}

export default function TaskDetail({ selectedTask, onTaskUpdate }: TaskDetailProps) {
  const [editState, setEditState] = useState<EditState>({
    title: false,
    description: false,
    todos: {}
  })
  const [editedTask, setEditedTask] = useState<Task | null>(null)
  const [newTodoText, setNewTodoText] = useState('')

  // 編集モードの切り替え
  const toggleEdit = (field: 'title' | 'description' | string, isEditingTodo: boolean = false) => {
    if (!selectedTask) return

    if (!editedTask) {
      setEditedTask(selectedTask)
    }

    setEditState(prev => {
      if (isEditingTodo) {
        return {
          ...prev,
          todos: {
            ...prev.todos,
            [field]: !prev.todos[field]
          }
        }
      }
      return {
        ...prev,
        [field]: !prev[field as keyof EditState]
      }
    })
  }

  // 変更の保存
  const handleSave = (field: 'title' | 'description' | string, isEditingTodo: boolean = false) => {
    if (editedTask && onTaskUpdate) {
      onTaskUpdate(editedTask)
    }
    toggleEdit(field, isEditingTodo)
  }

  // 変更のキャンセル
  const handleCancel = (field: 'title' | 'description' | string, isEditingTodo: boolean = false) => {
    setEditedTask(selectedTask)
    toggleEdit(field, isEditingTodo)
  }

  // タイトルの更新
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editedTask) {
      setEditedTask({ ...editedTask, title: e.target.value })
    }
  }

  // 概要の更新
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (editedTask) {
      setEditedTask({ ...editedTask, description: e.target.value })
    }
  }

  // TODOの完了状態の更新
  const handleTodoStatusChange = (todoId: string) => {
    if (editedTask) {
      const updatedTodos = editedTask.todos.map(todo =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      )
      setEditedTask({ ...editedTask, todos: updatedTodos })
      onTaskUpdate?.(editedTask)
    }
  }

  // TODOの内容の更新
  const handleTodoTextChange = (todoId: string, newText: string) => {
    if (editedTask) {
      const updatedTodos = editedTask.todos.map(todo =>
        todo.id === todoId ? { ...todo, text: newText } : todo
      )
      setEditedTask({ ...editedTask, todos: updatedTodos })
    }
  }

  // 新しいTODOの追加
  const handleAddTodo = () => {
    if (editedTask && newTodoText.trim()) {
      const newTodo: Todo = {
        id: `todo-${Date.now()}`,
        text: newTodoText.trim(),
        completed: false
      }
      const updatedTask = {
        ...editedTask,
        todos: [...editedTask.todos, newTodo]
      }
      setEditedTask(updatedTask)
      onTaskUpdate?.(updatedTask)
      setNewTodoText('')
    }
  }

  // TODOの削除
  const handleDeleteTodo = (todoId: string) => {
    if (editedTask) {
      const todoToDelete = editedTask.todos.find(todo => todo.id === todoId)
      if (!todoToDelete) return

      if (window.confirm(`「${todoToDelete.text}」を削除してもよろしいですか？`)) {
        const updatedTask = {
          ...editedTask,
          todos: editedTask.todos.filter(todo => todo.id !== todoId)
        }
        setEditedTask(updatedTask)
        onTaskUpdate?.(updatedTask)
      }
    }
  }

  if (!selectedTask) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-full flex items-center justify-center">
        <p className="text-gray-500">タスクを選択してください</p>
      </div>
    )
  }

  const taskToDisplay = editedTask || selectedTask

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <div className="flex justify-between items-center mb-4 group">
        <div className="flex-1 flex items-center gap-2">
          {editState.title ? (
            <>
              <input
                type="text"
                value={taskToDisplay.title}
                onChange={handleTitleChange}
                className="text-xl font-bold text-gray-800 w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={() => handleSave('title')}
                className="p-1 text-green-600 hover:text-green-700"
              >
                <IoSave className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleCancel('title')}
                className="p-1 text-red-600 hover:text-red-700"
              >
                <IoClose className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-800">{taskToDisplay.title}</h2>
              <button
                onClick={() => toggleEdit('title')}
                className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-600"
              >
                <IoPencil className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mb-4 group">
        {editState.description ? (
          <div className="flex gap-2">
            <textarea
              value={taskToDisplay.description}
              onChange={handleDescriptionChange}
              className="w-full h-24 p-2 text-gray-600 border rounded-md focus:border-blue-500 focus:outline-none"
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleSave('description')}
                className="p-1 text-green-600 hover:text-green-700"
              >
                <IoSave className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleCancel('description')}
                className="p-1 text-red-600 hover:text-red-700"
              >
                <IoClose className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <p className="flex-1 text-gray-600 whitespace-pre-wrap">{taskToDisplay.description}</p>
            <button
              onClick={() => toggleEdit('description')}
              className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-600 self-start"
            >
              <IoPencil className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {taskToDisplay.todos.map((todo) => (
          <div key={todo.id} className="flex items-center group">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleTodoStatusChange(todo.id)}
              className="w-5 h-5 mr-3"
            />
            {editState.todos[todo.id] ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={todo.text}
                  onChange={(e) => handleTodoTextChange(todo.id, e.target.value)}
                  className="flex-1 text-gray-800 border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={() => handleSave(todo.id, true)}
                  className="p-1 text-green-600 hover:text-green-700"
                >
                  <IoSave className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleCancel(todo.id, true)}
                  className="p-1 text-red-600 hover:text-red-700"
                >
                  <IoClose className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-center gap-2">
                <span className={`flex-1 text-gray-800 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                  {todo.text}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => toggleEdit(todo.id, true)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <IoPencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="p-1 text-red-500 hover:text-red-600"
                  >
                    <IoTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="flex items-center mt-4">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder="新しいTODOを追加"
            className="flex-1 p-2 border rounded-md focus:border-blue-500 focus:outline-none"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddTodo()
              }
            }}
          />
          <button
            onClick={handleAddTodo}
            className="ml-2 p-2 text-blue-500 hover:text-blue-600"
          >
            <IoAdd className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
} 