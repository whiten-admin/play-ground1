'use client';

import { useTaskContext } from '@/contexts/TaskContext';

export default function WBSView() {
  const { tasks } = useTaskContext();

  const getDaysBetween = (startDate: Date, endDate: Date) => {
    return Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const getDatePosition = (date: Date) => {
    const startDate = new Date('2025-03-01'); // 基準日
    return getDaysBetween(startDate, date);
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1200px]">
        {/* ヘッダー */}
        <div className="flex border-b">
          <div className="w-64 p-4 font-bold">タスク</div>
          <div className="flex-1 grid grid-cols-[repeat(30,1fr)] border-l">
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
                <div className="w-64 p-4 font-medium">
                  {task.title}
                  <span className="text-xs text-gray-500 ml-2">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="flex-1 relative">
                  {/* 親タスクの進捗バー */}
                  <div
                    className="absolute h-6 bg-gray-300 rounded"
                    style={{
                      left: `${(taskStartPos - 1) * (100 / 30)}%`,
                      width: `${taskWidth}%`,
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
                    {/* 小タスク名 */}
                    <div className="w-64 p-4 text-sm">{todo.text}</div>

                    {/* 小タスクの進捗バー */}
                    <div className="flex-1 relative">
                      <div
                        className="absolute h-6 bg-blue-100 rounded"
                        style={{
                          left: `${(startPos - 1) * (100 / 30)}%`,
                          width: `${todoWidth}%`,
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
