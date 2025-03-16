'use client'

import React, { useState, useEffect } from 'react'
import { IoAdd, IoTrash, IoPencil, IoSave, IoClose, IoBulb, IoList, IoGrid, IoBarChart } from 'react-icons/io5'
import { Task, Todo } from '@/types/task'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { suggestTodos } from '@/utils/openai'
import KanbanView from './KanbanView'
import WBSView from './WBSView'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

type ViewMode = 'list' | 'kanban' | 'gantt'

interface TaskDetailProps {
  selectedTask: Task | null
  onTaskUpdate?: (updatedTask: Task) => void
  tasks: Task[]
  onTaskSelect: (taskId: string) => void
}

interface EditState {
  title: boolean
  description: boolean
  todos: { [key: string]: boolean }
}

// APIの使用回数を取得する関数をインポート
const API_USAGE_KEY = 'openai_api_usage'
const DAILY_LIMIT = 20

function getApiUsageCount(): number {
  const storedUsage = localStorage.getItem(API_USAGE_KEY)
  if (!storedUsage) return 0

  const usage = JSON.parse(storedUsage)
  if (usage.date !== new Date().toISOString().split('T')[0]) return 0

  return usage.count
}

interface ViewModeButton {
  id: ViewMode
  icon: JSX.Element
  label: string
}

export default function TaskDetail({ selectedTask, onTaskUpdate, tasks, onTaskSelect }: TaskDetailProps) {
  const [editState, setEditState] = useState<EditState>({
    title: false,
    description: false,
    todos: {}
  })
  const [editedTask, setEditedTask] = useState<Task | null>(null)
  const [newTodoText, setNewTodoText] = useState('')
  const [isSuggestingTodos, setIsSuggestingTodos] = useState(false)
  const [suggestedTodos, setSuggestedTodos] = useState<{ text: string; estimatedHours: number }[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [viewModeButtons, setViewModeButtons] = useState<ViewModeButton[]>([
    { id: 'list', icon: <IoList className="w-5 h-5" />, label: 'リスト形式' },
    { id: 'kanban', icon: <IoGrid className="w-5 h-5" />, label: 'カンバン形式' },
    { id: 'gantt', icon: <IoBarChart className="w-5 h-5" />, label: 'ガントチャート' }
  ])

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
      const updatedTask = { ...editedTask, todos: updatedTodos }
      setEditedTask(updatedTask)
      onTaskUpdate?.(updatedTask)
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
      const today = new Date()
      const formattedDate = today.toISOString().split('T')[0] // YYYY-MM-DD形式
      
      const newTodo: Todo = {
        id: `todo-${Date.now()}`,
        text: newTodoText.trim(),
        completed: false,
        startDate: formattedDate,
        endDate: formattedDate,
        dueDate: new Date(),
        estimatedHours: 0 // デフォルトの見積もり工数を0時間に設定
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

  // 進捗率を計算する関数
  const calculateProgress = (todos: Todo[]) => {
    if (todos.length === 0) return 0
    const totalHours = todos.reduce((sum, todo) => sum + todo.estimatedHours, 0)
    const completedHours = todos
      .filter(todo => todo.completed)
      .reduce((sum, todo) => sum + todo.estimatedHours, 0)
    return Math.round((completedHours / totalHours) * 100)
  }

  // TODOの見積もり工数の更新
  const handleEstimatedHoursChange = (todoId: string, hours: number) => {
    if (editedTask) {
      const updatedTodos = editedTask.todos.map(todo =>
        todo.id === todoId ? { ...todo, estimatedHours: hours } : todo
      )
      setEditedTask({ ...editedTask, todos: updatedTodos })
    }
  }

  // ドラッグ終了時の処理
  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(viewModeButtons)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setViewModeButtons(items)
    // 左端のボタンをデフォルトとして localStorage に保存
    localStorage.setItem('defaultViewMode', items[0].id)
  }

  // コンポーネントマウント時にデフォルト表示を適用
  useEffect(() => {
    const defaultMode = localStorage.getItem('defaultViewMode') as ViewMode
    if (defaultMode) {
      setViewMode(defaultMode)
    }
  }, [])

  // タスク一覧表示のレンダリング
  const renderTaskList = () => {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">タスク一覧</h2>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="viewModeButtons" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex gap-1"
                >
                  {viewModeButtons.map((button, index) => (
                    <Draggable key={button.id} draggableId={button.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="relative"
                        >
                          <button
                            onClick={() => setViewMode(button.id)}
                            className={`p-2 rounded ${
                              viewMode === button.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            } ${index === 0 ? 'border-2 border-gray-300' : ''}`}
                            title={button.label}
                          >
                            {button.icon}
                          </button>
                          {index === 0 && (
                            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                              <span className="text-xs text-gray-500">Default</span>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <div className="flex-1 overflow-y-auto">
          {viewMode === 'list' && (
            <div className="space-y-4 pr-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskSelect(task.id)}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{task.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-500">
                      進捗率: {calculateProgress(task.todos)}%
                    </div>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${calculateProgress(task.todos)}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    TODO: {task.todos.length}件
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'kanban' && (
            <KanbanView tasks={tasks} onTaskSelect={onTaskSelect} />
          )}

          {viewMode === 'gantt' && (
            <WBSView />
          )}
        </div>
      </div>
    )
  }

  if (!selectedTask) {
    return renderTaskList()
  }

  const taskToDisplay = editedTask || selectedTask

  // TODOの提案を取得
  const handleSuggestTodos = async () => {
    if (!taskToDisplay) return

    try {
      setIsSuggestingTodos(true)
      setErrorMessage(null)
      const suggestions = await suggestTodos(
        taskToDisplay.title,
        taskToDisplay.description,
        taskToDisplay.todos.map(todo => todo.text)
      )
      setSuggestedTodos(suggestions)
    } catch (error) {
      console.error('Error getting todo suggestions:', error)
      setErrorMessage(error instanceof Error ? error.message : 'TODOの提案中にエラーが発生しました。')
      setSuggestedTodos([])
    } finally {
      setIsSuggestingTodos(false)
    }
  }

  // 提案されたTODOを追加
  const handleAddSuggestedTodo = (suggestion: { text: string; estimatedHours: number }) => {
    if (!editedTask && selectedTask) {
      setEditedTask(selectedTask)
    }

    const taskToUpdate = editedTask || selectedTask
    if (taskToUpdate) {
      const today = new Date()
      const formattedDate = today.toISOString().split('T')[0] // YYYY-MM-DD形式
      
      const newTodo: Todo = {
        id: `todo-${Date.now()}`,
        text: suggestion.text,
        completed: false,
        startDate: formattedDate,
        endDate: formattedDate,
        dueDate: new Date(),
        estimatedHours: suggestion.estimatedHours
      }
      const updatedTask = {
        ...taskToUpdate,
        todos: [...taskToUpdate.todos, newTodo]
      }
      setEditedTask(updatedTask)
      onTaskUpdate?.(updatedTask)

      // 追加したTODOを提案リストから削除
      setSuggestedTodos(prev => prev.filter(todo => todo.text !== suggestion.text))
    }
  }

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
              <button
                onClick={() => onTaskSelect('')}
                className="p-1 text-gray-500 hover:text-gray-700 mr-2"
              >
                ← 一覧へ戻る
              </button>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800">{taskToDisplay.title}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <div className="text-sm text-gray-500">
                    進捗率: {calculateProgress(taskToDisplay.todos)}%
                  </div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${calculateProgress(taskToDisplay.todos)}%` }}
                    />
                  </div>
                </div>
              </div>
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
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={todo.text}
                    onChange={(e) => handleTodoTextChange(todo.id, e.target.value)}
                    className="w-full text-gray-800 border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500">見積もり工数:</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={todo.estimatedHours}
                      onChange={(e) => handleEstimatedHoursChange(todo.id, parseFloat(e.target.value) || 0)}
                      className="w-20 text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                    />
                    <span className="text-sm text-gray-500">時間</span>
                  </div>
                </div>
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
                <div className="flex-1">
                  <span className={`text-gray-800 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                    {todo.text}
                  </span>
                  <div className="text-xs text-gray-500 mt-1 space-y-1">
                    <div>期日: {format(todo.dueDate, 'yyyy年M月d日', { locale: ja })}</div>
                    <div>見積もり工数: {todo.estimatedHours}時間</div>
                  </div>
                </div>
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
          <button
            onClick={handleSuggestTodos}
            disabled={isSuggestingTodos}
            className={`ml-2 p-2 ${
              isSuggestingTodos 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-yellow-500 hover:text-yellow-600'
            }`}
            title={`AIにTODOを提案してもらう (本日の使用回数: ${getApiUsageCount()}/${DAILY_LIMIT}回)`}
          >
            <IoBulb className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <div className="text-sm text-red-600">
              {errorMessage}
            </div>
          </div>
        )}

        {suggestedTodos.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <IoBulb className="w-4 h-4" />
              AIからのTODO提案
            </h4>
            <div className="space-y-2">
              {suggestedTodos.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white p-2 rounded border border-yellow-200"
                >
                  <div className="flex-1">
                    <div className="text-sm text-gray-800">{suggestion.text}</div>
                    <div className="text-xs text-gray-500">
                      見積もり工数: {suggestion.estimatedHours}時間
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddSuggestedTodo(suggestion)}
                    className="ml-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    title="このTODOを採用"
                  >
                    採用
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 