'use client'

import React, { useState, useEffect } from 'react'
import { format, addDays, startOfWeek, isSameDay, addHours, isBefore, isToday, parse } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Task } from '@/types/task'
import { IoChevronBack, IoChevronForward } from 'react-icons/io5'
import dynamic from 'next/dynamic'

const DndContext = dynamic(
  () => import('./WeeklyScheduleDnd').then(mod => mod.default),
  { ssr: false }
)

interface WeeklyScheduleProps {
  tasks: Task[]
  onTaskSelect: (taskId: string) => void
  onTodoUpdate: (todoId: string, taskId: string, newDate: Date) => void
}

interface TodoWithMeta {
  todo: {
    id: string
    text: string
    completed: boolean
    dueDate: Date
    estimatedHours: number
    startTime?: number
  }
  taskId: string
  taskTitle: string
}

export default function WeeklySchedule({ tasks, onTaskSelect, onTodoUpdate }: WeeklyScheduleProps) {
  const [isClient, setIsClient] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showWeekend, setShowWeekend] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 週の開始日を取得（月曜始まり）
  const startDate = startOfWeek(currentDate, { locale: ja })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i))
  const displayDays = showWeekend ? weekDays : weekDays.slice(1, 6)

  // 時間帯の設定（9:00-18:00）
  const timeSlots = Array.from({ length: 10 }, (_, i) => i + 9)

  // 前の週へ
  const previousWeek = () => {
    setCurrentDate(prev => addDays(prev, -7))
  }

  // 次の週へ
  const nextWeek = () => {
    setCurrentDate(prev => addDays(prev, 7))
  }

  // 今週へ
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // TODOをカレンダーに配置するための処理
  const scheduleTodos = () => {
    // 全タスクのTODOを日付でグループ化
    const todosByDate = new Map<string, TodoWithMeta[]>()

    tasks.forEach(task => {
      task.todos.forEach(todo => {
        const dateKey = format(todo.dueDate, 'yyyy-MM-dd')
        if (!todosByDate.has(dateKey)) {
          todosByDate.set(dateKey, [])
        }
        todosByDate.get(dateKey)?.push({
          todo: {
            ...todo,
            startTime: 9 // デフォルト値を設定
          },
          taskId: task.id,
          taskTitle: task.title
        })
      })
    })

    // 各日付のTODOを時間で並べ替え
    todosByDate.forEach((todos, dateKey) => {
      todos.sort((a, b) => {
        if (isBefore(a.todo.dueDate, b.todo.dueDate)) return -1
        if (isBefore(b.todo.dueDate, a.todo.dueDate)) return 1
        return 0
      })

      // TODOに時間を割り当て
      let currentTime = 9 // 9:00から開始
      todos.forEach(({ todo }) => {
        // 既に過去の時間の場合、現在時刻に更新
        const now = new Date()
        if (currentTime < now.getHours()) {
          currentTime = now.getHours()
        }

        // 終了時間が18時を超えないように調整
        if (currentTime + todo.estimatedHours > 18) {
          currentTime = 18 - todo.estimatedHours
        }

        todo.startTime = currentTime
        currentTime += todo.estimatedHours
      })
    })

    return todosByDate
  }

  const todoSchedule = scheduleTodos()

  if (!isClient) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">週間スケジュール</h2>
          <div className="flex items-center gap-2">
            <button className="p-1 hover:bg-gray-100 rounded">
              <IoChevronBack className="w-5 h-5" />
            </button>
            <button className="px-2 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
              今週
            </button>
            <button className="p-1 hover:bg-gray-100 rounded">
              <IoChevronForward className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* ローディング表示 */}
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 mb-4"></div>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold">週間スケジュール</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={previousWeek}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <IoChevronBack className="w-5 h-5" />
          </button>
          <button
            onClick={goToToday}
            className="px-2 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
          >
            今週
          </button>
          <button
            onClick={nextWeek}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <IoChevronForward className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-end mb-2">
        <button
          onClick={() => setShowWeekend(!showWeekend)}
          className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
        >
          {showWeekend ? '土日を非表示' : '土日を表示'}
          <span className="text-xs">
            {showWeekend ? '▼' : '▶'}
          </span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <div className={showWeekend ? "min-w-[800px]" : "min-w-[600px]"}>
          {/* 曜日ヘッダー */}
          <div 
            className="grid border-b" 
            style={{ 
              gridTemplateColumns: `3rem repeat(${displayDays.length}, 1fr)` 
            }}
          >
            <div className="h-8 w-12" />
            {displayDays.map((day, index) => (
              <div
                key={index}
                className={`text-center py-1 text-xs font-medium border-l ${
                  isToday(day) ? 'bg-blue-50' : ''
                }`}
              >
                {format(day, 'M/d (E)', { locale: ja })}
              </div>
            ))}
          </div>

          <DndContext
            weekDays={displayDays}
            timeSlots={timeSlots}
            tasks={tasks}
            onTaskSelect={onTaskSelect}
            onTodoUpdate={onTodoUpdate}
          />
        </div>
      </div>
    </div>
  )
} 