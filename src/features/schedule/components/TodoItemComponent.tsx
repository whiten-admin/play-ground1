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
  const [resizeOffset, setResizeOffset] = useState(0); // リサイズによる位置のオフセット
  
  if (!todo.calendarStartDateTime || !todo.calendarEndDateTime) return null;
  
  const { top, height } = calculateTodoPosition(todoWithMeta, quarterHeight);
  const isEditing = editingTodo?.todo.id === todo.id;
  
  // リサイズ中はその分の位置調整を行う
  const currentHeight = height + resizeOffset;
  
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
    setResizeOffset(0); // リサイズ開始時にオフセットをリセット
  };
  
  // リサイズ中
  const handleResize: DraggableEventHandler = (e, data) => {
    // リサイズによる高さの変更をリアルタイムで反映
    setResizeOffset(data.y);
  };
  
  // リサイズ終了時
  const handleResizeStop = (e: any, data: any) => {
    setIsResizing(false);
    setResizeOffset(0); // リサイズ終了時にオフセットをリセット
    
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
  
  // 最小高さ（15分）
  const minHeight = quarterHeight;
  
  // 上方向への縮小のための最大値（現在の高さから最小高さを引いた値の負数）
  const topBound = -(height - minHeight);
  
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
        disabled={isResizing} // 編集中でもドラッグ可能にする
      >
        <div ref={nodeRef} style={{ position: 'absolute', top, width: '100%', zIndex: isDragging ? 100 : 1 }}>
          <TodoItem
            className="todo-item"
            top={0}
            height={currentHeight} // リサイズ中の高さを反映
            isSelected={selectedTodoId === todo.id}
            isCompleted={todo.completed}
            isNextTodo={isNextTodo}
            priority={priority || 0}
            isDragging={isDragging}
            isResizing={isResizing} // リサイズ中のスタイル用
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
                top: topBound, // 上方向には高さ-最小高さまで
                bottom: 900 // 下方向に最大900px
              }}
              onStart={handleResizeStart}
              onDrag={handleResize} // ドラッグ中の処理を追加
              onStop={handleResizeStop}
              disabled={isDragging} // ドラッグ中はリサイズ不可
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
          height={currentHeight} // リサイズ中の高さを反映
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