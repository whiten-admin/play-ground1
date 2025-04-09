import React from 'react';
import { TodoGroup as TodoGroupType, TodoWithMeta } from '../types/schedule';
import TodoItemComponent from './TodoItemComponent';
import { EditingTodo } from '../hooks/useScheduleView';

interface TodoGroupProps {
  todoGroups: TodoGroupType[];
  selectedTodoId?: string | null;
  quarterHeight: number;
  editingTodo: EditingTodo | null;
  setEditingTodo: (editingTodo: EditingTodo | null) => void;
  onTodoClick: (todo: TodoWithMeta) => void;
  onStartTimeChange: (newStartTime: string) => void;
  onEndTimeChange: (newEndTime: string) => void;
  onCancelEdit: () => void;
  onUpdateTime: () => void;
  onDragEnd?: (todoId: string, taskId: string, diffMinutes: number, newDate?: Date) => void;
  onResizeEnd?: (todoId: string, taskId: string, diffMinutes: number) => void;
  day?: Date; // 日付情報
  weekDays?: Date[]; // 週の全日付配列
}

const TodoGroup: React.FC<TodoGroupProps> = ({
  todoGroups,
  selectedTodoId,
  quarterHeight,
  editingTodo,
  setEditingTodo,
  onTodoClick,
  onStartTimeChange,
  onEndTimeChange,
  onCancelEdit,
  onUpdateTime,
  onDragEnd,
  onResizeEnd,
  day,
  weekDays
}) => {  
  return (
    <>
      {todoGroups.map((group, groupIndex) => (
        <div
          key={`group-${groupIndex}`}
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 1 }}
        >
          {group.todos.map((todoWithMeta: TodoWithMeta, todoIndex: number) => {
            // 各TODOの幅と位置を計算
            const todoWidth = 100 / group.todos.length;
            const todoLeft = (todoIndex / group.todos.length) * 100;
            
            return (
              <div 
                key={`${todoWithMeta.todo.id}-${todoWithMeta.taskId}`}
                style={{
                  position: 'absolute',
                  left: `${todoLeft}%`,
                  width: `${todoWidth}%`,
                  height: '100%'
                }}
              >
                <TodoItemComponent
                  todoWithMeta={todoWithMeta}
                  selectedTodoId={selectedTodoId}
                  quarterHeight={quarterHeight}
                  editingTodo={editingTodo}
                  setEditingTodo={setEditingTodo}
                  onTodoClick={onTodoClick}
                  onStartTimeChange={onStartTimeChange}
                  onEndTimeChange={onEndTimeChange}
                  onCancelEdit={onCancelEdit}
                  onUpdateTime={onUpdateTime}
                  onDragEnd={onDragEnd}
                  onResizeEnd={onResizeEnd}
                  day={day}
                  weekDays={weekDays}
                />
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
};

export default TodoGroup; 