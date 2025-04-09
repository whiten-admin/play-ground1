'use client';

import React, { useState } from 'react';
import {
  isBefore,
  isToday,
  startOfDay,
} from 'date-fns';
import { Task, Todo } from '@/features/tasks/types/task';
import { useFilterContext } from '@/features/tasks/filters/FilterContext';
import { getProjectMemberName } from '@/utils/memberUtils';

interface TodayTodoProps {
  tasks: Task[];
  selectedTaskId: string | null;
  selectedTodoId: string | null;
  onTaskSelect: (taskId: string, todoId: string) => void;
  onTodoStatusChange: (taskId: string, todoId: string) => void;
  isExpanded?: boolean; // 初期状態で展開するかどうか
}

export default function TodayTodo({
  tasks,
  selectedTaskId,
  selectedTodoId,
  onTaskSelect,
  onTodoStatusChange,
  isExpanded = false, // デフォルトは折りたたみ状態
}: TodayTodoProps) {
  // アコーディオンの開閉状態を管理
  const [isTodayExpanded, setIsTodayExpanded] = useState(isExpanded);
  const [isOverdueExpanded, setIsOverdueExpanded] = useState(isExpanded);
  // 1日の最大工数（時間）
  const MAX_DAILY_HOURS = 8;
  
  // フィルタリングコンテキストを使用
  const { selectedUserIds, showUnassigned } = useFilterContext();

  // 全タスクからTODOを抽出し、親タスク情報と一緒にフラット化
  const allTodos = tasks.flatMap((task) =>
    task.todos.map((todo) => ({
      ...todo,
      taskId: task.id,
      taskTitle: task.title,
      assigneeId: todo.assigneeId || '',
    }))
  );
  
  // 担当者でフィルタリングする
  const filteredByAssigneeTodos = allTodos.filter((todo) => {
    // アサインされていないTODOを表示するかどうか
    if (showUnassigned && !todo.assigneeId) {
      return true;
    }
    
    // 選択されたユーザーのTODOを表示
    if (todo.assigneeId && selectedUserIds.includes(todo.assigneeId)) {
      return true;
    }
    
    return false;
  });

  // 今日が開始日のTODO
  const todaysTodos = filteredByAssigneeTodos.filter((todo) => {
    return isToday(todo.startDate);
  });

  // 過去の開始日で未完了のTODO（期限切れTODO）
  const overdueTodos = filteredByAssigneeTodos.filter((todo) => {
    const today = startOfDay(new Date());
    return isBefore(todo.startDate, today) && !todo.completed;
  });

  // 今日のTODOを完了状態でソート（未完了が先）
  const sortedTodaysTodos = [...todaysTodos].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return 0;
  });

  // 期限切れTODOも完了状態でソート（未完了が先）
  const sortedOverdueTodos = [...overdueTodos].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    // 日付が古い順
    return a.startDate.getTime() - b.startDate.getTime();
  });

  // 今日のTODOのうち、工数制限内のTODOリスト
  const todaysWithinTimeLimit = (() => {
    let totalHours = 0;
    const result = [];
    
    // まず未完了のTODOを処理
    for (const todo of sortedTodaysTodos) {
      if (!todo.completed) {
        if (totalHours + todo.estimatedHours <= MAX_DAILY_HOURS) {
          result.push(todo);
          totalHours += todo.estimatedHours;
        }
      }
    }
    
    // 完了済みのTODOは表示に含める（工数には含めない）
    for (const todo of sortedTodaysTodos) {
      if (todo.completed) {
        result.push(todo);
      }
    }
    
    return result;
  })();

  // 表示されない今日のTODOの情報
  const excludedTodaysTodos = sortedTodaysTodos.filter(
    todo => !todo.completed && !todaysWithinTimeLimit.some(t => t.id === todo.id)
  );
  const excludedTodaysHours = excludedTodaysTodos.reduce(
    (sum, todo) => sum + todo.estimatedHours, 
    0
  );
  
  // 今日のTODOの合計工数（未完了のみ）
  const includedTodaysHours = todaysWithinTimeLimit
    .filter(todo => !todo.completed)
    .reduce((sum, todo) => sum + todo.estimatedHours, 0);

  return (
    <div className="bg-white rounded-lg shadow p-2">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-base font-bold">今日のTODO</h2>
        <div className="flex items-center">
          <span className="text-xs mr-3 text-gray-600">
            {Math.round(includedTodaysHours * 10) / 10}h / {MAX_DAILY_HOURS}h
          </span>
          <button 
            onClick={() => setIsTodayExpanded(!isTodayExpanded)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
          >
            <span className="ml-1">{isTodayExpanded ? '▲' : '▼'}</span>
          </button>
        </div>
      </div>
      
      {/* NEXT TODOと今日のTODO */}
      <div className="space-y-1">
        {todaysWithinTimeLimit.length > 0 ? (
          todaysWithinTimeLimit.map((todo, index) => {
            // NEXT TODOは常に表示、その他は展開されている場合のみ表示
            const isNextTodo = index === 0 && !todo.completed;
            const shouldShow = isNextTodo || isTodayExpanded;
            if (!shouldShow) return null;
            
            return (
              <div
                key={todo.id}
                onClick={() => onTaskSelect(todo.taskId, todo.id)}
                className={`py-1 px-2 rounded-lg cursor-pointer transition-colors ${
                  selectedTaskId === todo.taskId && selectedTodoId === todo.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                } ${
                  todo.completed ? 'opacity-60 bg-gray-50' : ''
                } ${
                  isNextTodo ? 'border-l-4 border-l-amber-500 bg-amber-50' : ''
                }`}
              >
                {isNextTodo && (
                  <div className="mb-0.5">
                    <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">NEXT TODO</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs truncate max-w-[80%]">{todo.taskTitle}</span>
                </div>

                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className={`text-sm truncate max-w-[75%] ${
                      todo.completed ? 'line-through text-gray-500' : ''
                    }`}
                  >
                    {todo.text}
                  </span>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-600">
                      {Math.round(todo.estimatedHours * 10) / 10}h
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTodoStatusChange(todo.taskId, todo.id);
                      }}
                      className={`text-xs px-1 py-0.5 rounded ml-2 ${
                        todo.completed 
                          ? 'bg-gray-200 text-gray-600' 
                          : 'bg-white border border-green-500 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {todo.completed ? '完了済' : '完了'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-2 px-2 text-center">
            <p className="text-sm text-gray-400">該当するTODOがありません</p>
          </div>
        )}
      </div>
      
      {/* 今日のTODOが1件以上あり、展開されていない場合に表示するボタン */}
      {!isTodayExpanded && todaysWithinTimeLimit.length > 1 && (
        <div className="mt-1 text-center">
          <button 
            onClick={() => setIsTodayExpanded(true)}
            className="text-xs text-blue-500 hover:text-blue-700"
          >
            他 {todaysWithinTimeLimit.filter(t => !t.completed).length - 1} 件の今日のTODOを表示
          </button>
        </div>
      )}
      
      {/* 今日表示されないTODOの情報 */}
      {!isTodayExpanded && excludedTodaysTodos.length > 0 && (
        <div className="mt-1 text-center text-xs text-gray-500">
          <span className="text-orange-500 font-semibold"></span> 工数オーバーのTODO {excludedTodaysTodos.length} 件（合計 {Math.round(excludedTodaysHours * 10) / 10}h）
        </div>
      )}
      
      {/* 期限切れTODO */}
      {sortedOverdueTodos.length > 0 && (
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-sm font-bold text-red-500">期限切れTODO</h3>
            {sortedOverdueTodos.length > 1 && (
              <button 
                onClick={() => setIsOverdueExpanded(!isOverdueExpanded)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
              >
                <span className="ml-1">{isOverdueExpanded ? '▲' : '▼'}</span>
              </button>
            )}
          </div>
          <div className="space-y-1">
            {sortedOverdueTodos.map((todo, index) => {
              // 最初の期限切れTODOは常に表示、その他は展開されている場合のみ表示
              const shouldShow = index === 0 || isOverdueExpanded;
              if (!shouldShow) return null;
              
              return (
                <div
                  key={todo.id}
                  onClick={() => onTaskSelect(todo.taskId, todo.id)}
                  className={`py-1 px-2 rounded-lg cursor-pointer transition-colors border-l-4 border-l-red-500 bg-red-50 ${
                    selectedTaskId === todo.taskId && selectedTodoId === todo.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-red-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs truncate max-w-[80%]">{todo.taskTitle}</span>
                  </div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm truncate max-w-[75%]">{todo.text}</span>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-600">
                        {Math.round(todo.estimatedHours * 10) / 10}h
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTodoStatusChange(todo.taskId, todo.id);
                        }}
                        className={`text-xs px-1 py-0.5 rounded ml-2 ${
                          todo.completed 
                            ? 'bg-gray-200 text-gray-600' 
                            : 'bg-white border border-green-500 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {todo.completed ? '完了済' : '完了'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* 期限切れTODOが複数あり、展開されていない場合に表示するボタン */}
          {!isOverdueExpanded && sortedOverdueTodos.length > 1 && (
            <div className="mt-1 text-center">
              <button 
                onClick={() => setIsOverdueExpanded(true)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                他 {sortedOverdueTodos.length - 1} 件の期限切れTODOを表示
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
