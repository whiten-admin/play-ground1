'use client'

import React, { useEffect, useState, useRef } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Task, Todo } from '@/features/tasks/types/task'
import { BUSINESS_HOURS } from '@/utils/constants/constants'
import { useFilterContext } from '@/features/tasks/filters/FilterContext'
import { filterTodosForDisplay } from '../utils/scheduleTodoUtils'
import { TodoWithMeta, WeekViewProps } from '../types/schedule'
import styled from '@emotion/styled'

interface WeeklyScheduleDndProps {
  weekDays: Date[]
  timeSlots: number[]
  tasks: Task[]
  selectedTodoId?: string | null
  onTaskSelect: (taskId: string, todoId?: string) => void
  onTodoUpdate?: (todoId: string, taskId: string, newDate: Date, isPlannedDate?: boolean, endDate?: Date) => void
  onCalendarClick: (e: React.MouseEvent<HTMLDivElement>, day: Date, hour: number) => void
  isCreatingTodo: boolean
  newTodoDate: Date | null
  newTodoTaskId: string | null
  newTodoText: string
  newTodoEstimatedHours: number
  onNewTodoTaskIdChange: (taskId: string) => void
  onNewTodoTextChange: (text: string) => void
  onNewTodoEstimatedHoursChange: (hours: number) => void
  onCancelCreateTodo: () => void
  onCreateTodo: (taskId: string) => void
}

interface StyledTodoItemProps {
  top: number;
  height: number;
  isSelected: boolean;
  isCompleted: boolean;
  isNextTodo: boolean;
  priority: number;
}

const TodoItem = styled.div<StyledTodoItemProps>`
  position: absolute;
  left: 0;
  right: 0;
  top: ${(props: StyledTodoItemProps) => props.top}px;
  height: ${(props: StyledTodoItemProps) => props.height}px;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow: hidden;
  background-color: ${(props: StyledTodoItemProps) =>
    props.isCompleted
      ? '#e0e0e0'
      : props.isNextTodo
      ? '#e3f2fd'
      : props.priority === 2
      ? '#fff3e0'
      : props.priority === 1
      ? '#f3e5f5'
      : '#f5f5f5'};
  border: ${(props: StyledTodoItemProps) =>
    props.isSelected
      ? '2px solid #1976d2'
      : props.isCompleted
      ? '1px solid #9e9e9e'
      : props.isNextTodo
      ? '1px solid #2196f3'
      : props.priority === 2
      ? '1px solid #ff9800'
      : props.priority === 1
      ? '1px solid #9c27b0'
      : '1px solid #bdbdbd'};
  opacity: ${(props: StyledTodoItemProps) => (props.isCompleted ? 0.7 : 1)};
  z-index: ${(props: StyledTodoItemProps) => (props.isSelected ? 2 : 1)};
  pointer-events: auto;
  box-sizing: border-box;
  margin: 0 1px;
`;

const TodoContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  gap: 0;
  height: 100%;
  pointer-events: none;
  width: 100%;
`;

const TimeEditForm = styled.div`
  position: absolute;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 240px;
  max-width: 300px;
  pointer-events: auto;
`;

export default function WeeklyScheduleDnd({
  weekDays,
  timeSlots,
  tasks,
  selectedTodoId,
  onTaskSelect,
  onTodoUpdate,
  onCalendarClick,
  isCreatingTodo,
  newTodoDate,
  newTodoTaskId,
  newTodoText,
  newTodoEstimatedHours,
  onNewTodoTaskIdChange,
  onNewTodoTextChange,
  onNewTodoEstimatedHoursChange,
  onCancelCreateTodo,
  onCreateTodo
}: WeeklyScheduleDndProps) {
  const [mounted, setMounted] = useState(false)
  const [editingTodo, setEditingTodo] = useState<{
    todo: Todo;
    taskId: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  const { selectedUserIds, showUnassigned } = useFilterContext()
  const [todos, setTodos] = useState<Map<string, TodoWithMeta[]>>(new Map())
  
  const hourHeight = 48; // 1時間の高さ（px）
  const quarterHeight = hourHeight / 4; // 15分の高さ（px）

  // 時間を小数点に変換（例: 9:15 → 9.25）
  const getTimeInDecimal = (date: Date): number => {
    return date.getHours() + (date.getMinutes() / 60);
  };

  // tasksが変更されたときにtodosを再計算
  useEffect(() => {
    const initialTodos = filterTodosForDisplay(tasks, selectedUserIds, showUnassigned)
    setTodos(initialTodos)
  }, [tasks, selectedUserIds, showUnassigned]) // フィルター条件が変更されたときも再計算

  // selectedTodoIdが変更されたときにコンソールログに出力
  useEffect(() => {
    if (selectedTodoId) {
      console.log('WeeklyScheduleDnd - 選択されたTODO:', selectedTodoId)
    }
  }, [selectedTodoId])

  // マウント状態の管理
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="relative">
        {timeSlots.map((hour) => (
          <div 
            key={hour} 
            className="grid" 
            style={{ gridTemplateColumns: `3rem repeat(${weekDays.length}, 1fr)` }}
          >
            <div className="h-12 text-xs text-right pr-1 pt-1 text-gray-500 w-12">
              {`${hour}:00`}
            </div>
            {weekDays.map((_, dayIndex) => (
              <div
                key={dayIndex}
                className="h-12 border-t border-l relative"
              />
            ))}
          </div>
        ))}
      </div>
    )
  }

  // 時間オプションを生成する関数
  const generateTimeOptions = () => {
    const options: string[] = [];
    for (let hour = BUSINESS_HOURS.START_HOUR; hour <= BUSINESS_HOURS.END_HOUR; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour >= BUSINESS_HOURS.BREAK_START && hour < BUSINESS_HOURS.BREAK_END) {
          continue;
        }
        options.push(
          `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        );
      }
    }
    return options;
  };

  // 時間更新を処理する関数
  const handleTimeUpdate = () => {
    if (!editingTodo || !onTodoUpdate) return;

    const { todo, taskId, startTime, endTime } = editingTodo;
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const updatedStartDateTime = new Date(todo.calendarStartDateTime);
    updatedStartDateTime.setHours(startHour, startMinute, 0, 0);

    const updatedEndDateTime = new Date(todo.calendarEndDateTime);
    updatedEndDateTime.setHours(endHour, endMinute, 0, 0);

    // TODOを更新
    const updatedTodo: Todo = {
      ...todo,
      calendarStartDateTime: updatedStartDateTime,
      calendarEndDateTime: updatedEndDateTime,
      estimatedHours: (endHour + endMinute / 60) - (startHour + startMinute / 60),
    };

    console.log('更新するTODO:', updatedTodo);
    // 開始時間と終了時間の両方を更新するために、第5引数に終了時間を渡す
    onTodoUpdate(updatedTodo.id, taskId, updatedStartDateTime, false, updatedEndDateTime);
    setEditingTodo(null);
  };

  const renderTodosForHour = (hour: number, todosForDay: TodoWithMeta[]) => {
    const hourHeight = 48;
    const quarterHeight = hourHeight / 4;

    // その時間帯に表示すべきTODOを抽出
    const todosForHour = todosForDay.filter(todoWithMeta => {
      const { todo } = todoWithMeta;
      if (!todo.calendarStartDateTime || !todo.calendarEndDateTime) return false;

      const startDateTime = new Date(todo.calendarStartDateTime);
      const endDateTime = new Date(todo.calendarEndDateTime);
      const todoStartHour = startDateTime.getHours();

      // その時間帯が開始時間と一致する場合のみ表示
      return todoStartHour === hour;
    });

    // 重なりがあるTODOをグループ化
    const todoGroups: TodoWithMeta[][] = [];
    todosForHour.forEach(todo => {
      let added = false;
      for (const group of todoGroups) {
        // 重複チェック - 時間が重なっているかどうか
        const hasOverlap = group.some(existingTodo => {
          const start1 = new Date(todo.todo.calendarStartDateTime!).getTime();
          const end1 = new Date(todo.todo.calendarEndDateTime!).getTime();
          const start2 = new Date(existingTodo.todo.calendarStartDateTime!).getTime();
          const end2 = new Date(existingTodo.todo.calendarEndDateTime!).getTime();
          
          // 時間が重なっている場合はtrue
          return (start1 < end2 || end1 > start2);
        });
        
        // 重複がない場合のみ、このグループに追加
        if (!hasOverlap) {
          group.push(todo);
          added = true;
          break;
        }
      }
      if (!added) {
        // 新しいグループを作成
        todoGroups.push([todo]);
      }
    });

    return (
      <TodoContainer>
        {todoGroups.map((group, groupIndex) => (
          <div
            key={groupIndex}
            style={{
              flex: 1,
              position: 'relative',
              height: '100%',
              minWidth: `${100 / todoGroups.length}%`,
              maxWidth: `${100 / todoGroups.length}%`,
            }}
          >
            {group.map(todoWithMeta => {
              const { todo, isNextTodo, priority, taskId } = todoWithMeta;
              if (!todo.calendarStartDateTime || !todo.calendarEndDateTime) return null;

              const startDateTime = new Date(todo.calendarStartDateTime);
              const endDateTime = new Date(todo.calendarEndDateTime);
              const startMinutes = startDateTime.getMinutes();
              const endMinutes = endDateTime.getMinutes();
              const startHour = startDateTime.getHours();
              const endHour = endDateTime.getHours();

              const top = Math.floor(startMinutes / 15) * quarterHeight;
              const totalMinutes = (endHour - startHour) * 60 + (endMinutes - startMinutes);
              const height = Math.ceil(totalMinutes / 15) * quarterHeight;

              const isEditing = editingTodo?.todo.id === todo.id;

              return (
                <React.Fragment key={todo.id}>
                  <TodoItem
                    className="todo-item"
                    top={top}
                    height={height}
                    isSelected={selectedTodoId === todo.id}
                    isCompleted={todo.completed}
                    isNextTodo={isNextTodo}
                    priority={priority || 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskSelect(taskId, todo.id);
                      setEditingTodo({
                        todo,
                        taskId,
                        startTime: `${startDateTime.getHours().toString().padStart(2, '0')}:${startDateTime.getMinutes().toString().padStart(2, '0')}`,
                        endTime: `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`
                      });
                    }}
                  >
                    <div style={{ fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {`${startDateTime.getHours().toString().padStart(2, '0')}:${startDateTime
                        .getMinutes()
                        .toString()
                        .padStart(2, '0')} - ${endDateTime
                        .getHours()
                        .toString()
                        .padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`}
                    </div>
                    <div style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{todo.text}</div>
                  </TodoItem>
                  {isEditing && (
                    <TimeEditForm
                      style={{
                        position: 'absolute',
                        top: `${top + height}px`,
                        left: '100%',
                        marginLeft: '8px',
                        zIndex: 1000
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                    >
                      <div 
                        className="text-sm font-medium mb-2 pb-2 border-b border-gray-200" 
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                          wordBreak: 'break-word', 
                          maxHeight: '60px', 
                          overflowY: 'auto' 
                        }}
                      >
                        {todo.text}
                      </div>
                      <div className="flex gap-2 items-center mb-2" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={editingTodo.startTime}
                          onChange={(e) => {
                            e.stopPropagation();
                            const newStartTime = e.target.value;
                            if (newStartTime >= editingTodo.endTime) {
                              const [hour, minute] = newStartTime.split(':').map(Number);
                              const newEndHour = hour + 1;
                              if (newEndHour <= BUSINESS_HOURS.END_HOUR) {
                                setEditingTodo({
                                  ...editingTodo,
                                  startTime: newStartTime,
                                  endTime: `${newEndHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                                });
                              }
                            } else {
                              setEditingTodo({
                                ...editingTodo,
                                startTime: newStartTime
                              });
                            }
                          }}
                          className="text-sm p-1 border rounded"
                        >
                          {generateTimeOptions().map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                        <span className="text-sm">-</span>
                        <select
                          value={editingTodo.endTime}
                          onChange={(e) => {
                            e.stopPropagation();
                            const newEndTime = e.target.value;
                            if (newEndTime <= editingTodo.startTime) {
                              const [hour, minute] = newEndTime.split(':').map(Number);
                              const newStartHour = Math.max(BUSINESS_HOURS.START_HOUR, hour - 1);
                              setEditingTodo({
                                ...editingTodo,
                                startTime: `${newStartHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
                                endTime: newEndTime
                              });
                            } else {
                              setEditingTodo({
                                ...editingTodo,
                                endTime: newEndTime
                              });
                            }
                          }}
                          className="text-sm p-1 border rounded"
                        >
                          {generateTimeOptions().map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTodo(null);
                          }}
                          className="text-sm px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTimeUpdate();
                          }}
                          className="text-sm px-2 py-1 bg-blue-500 text-white hover:bg-blue-600 rounded"
                        >
                          更新
                        </button>
                      </div>
                    </TimeEditForm>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        ))}
      </TodoContainer>
    );
  };

  return (
    <div className="relative">
      {timeSlots.map((hour) => (
        <div 
          key={hour} 
          className="grid" 
          style={{ gridTemplateColumns: `3rem repeat(${weekDays.length}, 1fr)` }}
        >
          <div className="h-12 text-xs text-right pr-1 pt-1 text-gray-500 w-12">
            {`${hour}:00`}
          </div>
          {weekDays.map((day, dayIndex) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const todosForDay = todos.get(dateKey) || []

            return (
              <div
                key={`${format(day, 'yyyy-MM-dd')}-${hour}`}
                className={`h-12 border-t border-l relative ${
                  hour === BUSINESS_HOURS.BREAK_START ? 'bg-gray-100 opacity-80' : ''
                }`}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('.todo-item')) {
                    e.stopPropagation();
                    return;
                  }
                  onCalendarClick(e, day, hour);
                }}
              >
                {/* 15分単位の区切り線 */}
                {[1, 2, 3].map((quarter) => (
                  <div
                    key={quarter}
                    className="absolute w-full border-t border-gray-100"
                    style={{ top: `${quarterHeight * quarter}px` }}
                  />
                ))}

                {hour === BUSINESS_HOURS.BREAK_START && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 font-medium z-20">
                    休憩
                  </div>
                )}

                {renderTodosForHour(hour, todosForDay)}
              </div>
            )
          })}
        </div>
      ))}

      {/* TODO作成モーダル */}
      {isCreatingTodo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">新しいTODOを作成</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日付
                </label>
                <div className="text-sm text-gray-600">
                  {newTodoDate ? format(newTodoDate, 'yyyy年M月d日 (E) HH:mm', { locale: ja }) : ''}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タスク
                </label>
                <select
                  value={newTodoTaskId || ''}
                  onChange={(e) => onNewTodoTaskIdChange(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">タスクを選択</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TODO名
                </label>
                <input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => onNewTodoTextChange(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="TODOの名前を入力"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  見積もり工数（時間）
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={newTodoEstimatedHours}
                  onChange={(e) => onNewTodoEstimatedHoursChange(Number(e.target.value))}
                  className="w-full p-2 border rounded-md"
                  placeholder="見積もり工数を入力"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={onCancelCreateTodo}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                キャンセル
              </button>
              <button
                onClick={() => newTodoTaskId && onCreateTodo(newTodoTaskId)}
                disabled={!newTodoTaskId || !newTodoText.trim()}
                className="px-4 py-2 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 