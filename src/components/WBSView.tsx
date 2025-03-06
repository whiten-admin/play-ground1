'use client'

import { useState } from 'react'

interface Task {
  id: string
  title: string
  startDate: string
  endDate: string
  progress: number
  subtasks?: Task[]
}

export default function WBSView() {
  const [tasks] = useState<Task[]>([
    {
      id: '1',
      title: '要件定義',
      startDate: '2024-03-01',
      endDate: '2024-03-15',
      progress: 60,
      subtasks: [
        {
          id: '1-1',
          title: '基本要件の洗い出し',
          startDate: '2024-03-01',
          endDate: '2024-03-05',
          progress: 100,
        },
        {
          id: '1-2',
          title: 'ユーザーストーリーの作成',
          startDate: '2024-03-06',
          endDate: '2024-03-10',
          progress: 30,
        },
        {
          id: '1-3',
          title: '要件定義書のレビュー',
          startDate: '2024-03-11',
          endDate: '2024-03-15',
          progress: 0,
        },
      ],
    },
    {
      id: '2',
      title: '設計',
      startDate: '2024-03-16',
      endDate: '2024-03-30',
      progress: 0,
      subtasks: [
        {
          id: '2-1',
          title: 'システム構成図の作成',
          startDate: '2024-03-16',
          endDate: '2024-03-20',
          progress: 0,
        },
        {
          id: '2-2',
          title: 'データベース設計',
          startDate: '2024-03-21',
          endDate: '2024-03-25',
          progress: 0,
        },
        {
          id: '2-3',
          title: 'API設計',
          startDate: '2024-03-26',
          endDate: '2024-03-30',
          progress: 0,
        },
      ],
    },
  ])

  const getDaysBetween = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getDatePosition = (date: string) => {
    const startDate = new Date('2024-03-01')
    const currentDate = new Date(date)
    const diffTime = currentDate.getTime() - startDate.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1200px]">
        {/* ヘッダー */}
        <div className="flex border-b">
          <div className="w-64 p-4 font-bold">タスク</div>
          <div className="flex-1 grid grid-cols-[repeat(30,1fr)]">
            {Array.from({ length: 30 }, (_, i) => (
              <div key={i} className="p-2 text-center text-sm border-r">
                {i + 1}日
              </div>
            ))}
          </div>
        </div>

        {/* タスク行 */}
        {tasks.map((task) => (
          <div key={task.id}>
            {/* 親タスク */}
            <div className="flex border-b">
              <div className="w-64 p-4 font-medium">{task.title}</div>
              <div className="flex-1 relative">
                <div
                  className="absolute h-6 bg-blue-100 rounded"
                  style={{
                    left: `${(getDatePosition(task.startDate) - 1) * (100 / 30)}%`,
                    width: `${(getDaysBetween(task.startDate, task.endDate) + 1) * (100 / 30)}%`,
                  }}
                >
                  <div
                    className="h-full bg-blue-500 rounded"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* サブタスク */}
            {task.subtasks?.map((subtask) => (
              <div key={subtask.id} className="flex border-b">
                <div className="w-64 p-4 pl-8 text-gray-600">{subtask.title}</div>
                <div className="flex-1 relative">
                  <div
                    className="absolute h-6 bg-green-100 rounded"
                    style={{
                      left: `${(getDatePosition(subtask.startDate) - 1) * (100 / 30)}%`,
                      width: `${(getDaysBetween(subtask.startDate, subtask.endDate) + 1) * (100 / 30)}%`,
                    }}
                  >
                    <div
                      className="h-full bg-green-500 rounded"
                      style={{ width: `${subtask.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
} 