'use client';

import { useTaskContext } from '@/contexts/TaskContext';
import { useEffect, useRef } from 'react';

export default function WBSView() {
  const { tasks } = useTaskContext();
  const containerRef = useRef<HTMLDivElement>(null);

  const getDaysBetween = (startDate: Date, endDate: Date) => {
    return Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const getDatePosition = (date: Date) => {
    const startDate = new Date('2025-03-01'); // 基準日
    return getDaysBetween(startDate, date);
  };

  // 今日の日付の位置を計算
  const today = new Date();
  const todayPosition = getDatePosition(today);

  // コンポーネントがマウントされた時に、今日の日付が左端に来るようにスクロール
  useEffect(() => {
    if (containerRef.current) {
      const columnWidth = containerRef.current.scrollWidth / 30; // 1日分の幅
      const scrollPosition = (todayPosition - 4) * columnWidth; // 4日分左に余裕を持たせる
      containerRef.current.scrollLeft = scrollPosition;
    }
  }, [todayPosition]);

  return (
    <div className="overflow-x-auto relative" ref={containerRef}>
      <div className="min-w-[1200px]">
        {/* ヘッダー */}
        <div className="flex border-b">
          <div className="w-60 p-4 font-bold sticky left-0 bg-white z-10">タスク</div>
          <div className="flex-1 grid grid-cols-[repeat(30,1fr)] border-l relative">
            {/* 過去の日付のオーバーレイ */}
            <div
              className="absolute top-0 left-0 h-full bg-gray-100/50"
              style={{
                width: `${(todayPosition - 1) * (100 / 30)}%`,
                zIndex: 1
              }}
            />
            {/* 今日の日付の縦線 */}
            <div
              className="absolute top-0 h-full w-px bg-red-500"
              style={{
                left: `${(todayPosition - 1) * (100 / 30)}%`,
                zIndex: 2
              }}
            />
            {Array.from({ length: 30 }, (_, i) => (
              <div key={i} className="p-2 text-center text-sm border-r">
                {i + 1}日
              </div>
            ))}
          </div>
        </div>

        {/* タスク一覧 */}
        {tasks.map((task) => {
          // 小タスクの開始日・終了日
          const taskStartDate = new Date(
            Math.min(
              ...task.todos.map((todo) => new Date(todo.startDate).getTime())
            )
          );
          const taskEndDate = new Date(
            Math.max(
              ...task.todos.map((todo) => new Date(todo.endDate).getTime())
            )
          );

          // 親タスクのガントバー位置と幅
          const taskStartPos = getDatePosition(taskStartDate);
          const taskEndPos = getDatePosition(taskEndDate);
          const taskWidth = (taskEndPos - taskStartPos + 1) * (100 / 30);

          // 親タスクの進捗率を計算
          const totalEstimatedHours = task.todos.reduce(
            (sum, todo) => sum + todo.estimatedHours,
            0
          );
          const completedHours = task.todos.reduce(
            (sum, todo) => sum + (todo.completed ? todo.estimatedHours : 0),
            0
          );
          const progress =
            totalEstimatedHours > 0
              ? (completedHours / totalEstimatedHours) * 100
              : 0;

          return (
            <div key={task.id} className="border-b">
              {/* 親タスク */}
              <div className="flex bg-gray-100 border-b">
                <div className="w-60 p-4 font-medium sticky left-0 bg-gray-100 z-10">
                  {task.title}
                  <span className="text-xs text-gray-500 ml-2">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="flex-1 relative">
                  {/* 過去の日付のオーバーレイ */}
                  <div
                    className="absolute top-0 left-0 h-full bg-gray-100/50"
                    style={{
                      width: `${(todayPosition - 1) * (100 / 30)}%`,
                      zIndex: 1
                    }}
                  />
                  {/* 今日の日付の縦線 */}
                  <div
                    className="absolute top-0 h-full w-px bg-red-500"
                    style={{
                      left: `${(todayPosition - 1) * (100 / 30)}%`,
                      zIndex: 2
                    }}
                  />
                  {/* 親タスクの進捗バー */}
                  <div
                    className="absolute h-6 bg-gray-300 rounded"
                    style={{
                      left: `${(taskStartPos - 1) * (100 / 30)}%`,
                      width: `${taskWidth}%`,
                      zIndex: 0
                    }}
                  >
                    <div
                      className="h-full bg-green-500 rounded"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 小タスク（todo） */}
              {task.todos.map((todo) => {
                const startDate = new Date(todo.startDate);
                const endDate = new Date(todo.endDate);

                const startPos = getDatePosition(startDate);
                const endPos = getDatePosition(endDate);
                const todoWidth = (endPos - startPos + 1) * (100 / 30);

                return (
                  <div key={todo.id} className="flex border-b">
                    <div className="w-60 p-4 text-sm sticky left-0 bg-white z-10">{todo.text}</div>
                    <div className="flex-1 relative">
                      {/* 過去の日付のオーバーレイ */}
                      <div
                        className="absolute top-0 left-0 h-full bg-gray-100/50"
                        style={{
                          width: `${(todayPosition - 1) * (100 / 30)}%`,
                          zIndex: 1
                        }}
                      />
                      {/* 今日の日付の縦線 */}
                      <div
                        className="absolute top-0 h-full w-px bg-red-500"
                        style={{
                          left: `${(todayPosition - 1) * (100 / 30)}%`,
                          zIndex: 2
                        }}
                      />
                      {/* 小タスクの進捗バー */}
                      <div
                        className="absolute h-6 bg-blue-100 rounded"
                        style={{
                          left: `${(startPos - 1) * (100 / 30)}%`,
                          width: `${todoWidth}%`,
                          zIndex: 0
                        }}
                      >
                        <div
                          className="h-full bg-blue-500 rounded"
                          style={{
                            width: `${todo.completed ? 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
