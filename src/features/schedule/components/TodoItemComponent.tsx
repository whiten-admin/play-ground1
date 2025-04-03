import React, { useRef, useState } from 'react';
import Draggable, { DraggableEventHandler } from 'react-draggable';
import { TodoWithMeta } from '../types/schedule';
import { TodoItem, ResizeHandle } from '../styles/scheduleStyles';
import { calculateTodoPosition } from '../utils/todoDisplayUtils';
import TodoEditForm from './TodoEditForm';
import { EditingTodo } from '../hooks/useScheduleView';

interface TodoItemComponentProps {
  todoWithMeta: TodoWithMeta;
  selectedTodoId?: string | null;
  quarterHeight: number;
  editingTodo: EditingTodo | null;
  onTodoClick: (todo: TodoWithMeta) => void;
  onStartTimeChange: (newStartTime: string) => void;
  onEndTimeChange: (newEndTime: string) => void;
  onCancelEdit: () => void;
  onUpdateTime: () => void;
  onDragEnd?: (todoId: string, taskId: string, diffMinutes: number) => void;
  onResizeEnd?: (todoId: string, taskId: string, diffMinutes: number) => void;
}

const TodoItemComponent: React.FC<TodoItemComponentProps> = ({
  todoWithMeta,
  selectedTodoId,
  quarterHeight,
  editingTodo,
  onTodoClick,
  onStartTimeChange,
  onEndTimeChange,
  onCancelEdit,
  onUpdateTime,
  onDragEnd,
  onResizeEnd
}) => {
  const { todo, taskId, isNextTodo, priority } = todoWithMeta;
  const nodeRef = useRef(null);
  const resizeRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  if (!todo.calendarStartDateTime || !todo.calendarEndDateTime) return null;
  
  const { top, height } = calculateTodoPosition(todoWithMeta, quarterHeight);
  const isEditing = editingTodo?.todo.id === todo.id;
  
  const startDateTime = new Date(todo.calendarStartDateTime);
  const endDateTime = new Date(todo.calendarEndDateTime);
  
  // ドラッグ開始時
  const handleDragStart = () => {
    setIsDragging(true);
  };
  
  // ドラッグ終了時
  const handleDragStop = (e: any, data: any) => {
    setIsDragging(false);
    
    if (Math.abs(data.y) < 4) return; // 微小な移動は無視
    
    // 移動量を15分単位に丸める
    const quarterCount = Math.round(data.y / quarterHeight);
    if (quarterCount === 0) return; // 移動なしの場合は何もしない
    
    // 分単位の変化量を計算（15分単位）
    const diffMinutes = quarterCount * 15;
    
    // ドラッグ終了時のコールバック（休憩時間を含めて処理）
    if (onDragEnd) {
      onDragEnd(todo.id, taskId, diffMinutes);
    }
  };
  
  // リサイズ開始時
  const handleResizeStart: DraggableEventHandler = (e, data) => {
    e.stopPropagation();
    setIsResizing(true);
  };
  
  // リサイズ終了時
  const handleResizeStop = (e: any, data: any) => {
    setIsResizing(false);
    
    if (Math.abs(data.y) < 4) return; // 微小な移動は無視
    
    // 移動量を15分単位に丸める
    const quarterCount = Math.round(data.y / quarterHeight);
    if (quarterCount === 0) return; // 移動なしの場合は何もしない
    
    // 分単位の変化量を計算
    const diffMinutes = quarterCount * 15;
    
    // リサイズ終了時のコールバック
    if (onResizeEnd) {
      onResizeEnd(todo.id, taskId, diffMinutes);
    }
  };
  
  return (
    <React.Fragment>
      <Draggable
        nodeRef={nodeRef}
        axis="y"
        grid={[1, quarterHeight]}
        position={{ x: 0, y: 0 }}
        bounds={{
          top: -500, // 上方向に最大500px（カレンダー全体の時間帯のほとんどをカバー）
          bottom: 900 // 下方向に最大900px
        }}
        onStart={handleDragStart}
        onStop={handleDragStop}
        disabled={isEditing || isResizing}
      >
        <div ref={nodeRef} style={{ position: 'absolute', top, width: '100%', zIndex: isDragging ? 100 : 1 }}>
          <TodoItem
            className="todo-item"
            top={0}
            height={height}
            isSelected={selectedTodoId === todo.id}
            isCompleted={todo.completed}
            isNextTodo={isNextTodo}
            priority={priority || 0}
            isDragging={isDragging}
            onClick={(e) => {
              if (!isDragging && !isResizing) {
                e.stopPropagation();
                onTodoClick(todoWithMeta);
              }
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
            <div style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {todo.text}
            </div>
            
            {/* リサイズハンドル */}
            <Draggable
              nodeRef={resizeRef}
              axis="y"
              grid={[1, quarterHeight]}
              bounds={{ 
                top: quarterHeight, // 最低15分の長さは確保
                bottom: 900 // 下方向に最大900px
              }}
              onStart={handleResizeStart}
              onStop={handleResizeStop}
              disabled={isEditing || isDragging}
            >
              <ResizeHandle ref={resizeRef} />
            </Draggable>
          </TodoItem>
        </div>
      </Draggable>
      
      {isEditing && editingTodo && (
        <TodoEditForm
          editingTodo={editingTodo}
          top={top}
          height={height}
          onStartTimeChange={onStartTimeChange}
          onEndTimeChange={onEndTimeChange}
          onCancel={onCancelEdit}
          onUpdate={onUpdateTime}
        />
      )}
    </React.Fragment>
  );
};

export default TodoItemComponent; 