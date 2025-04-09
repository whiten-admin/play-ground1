import React, { useRef, useState, useEffect } from 'react';
import Draggable, { DraggableEventHandler, DraggableData } from 'react-draggable';
import { TodoWithMeta, TodoDragEvent } from '../types/schedule';
import { TodoItem, ResizeHandle } from '../styles/scheduleStyles';
import { calculateTodoPosition } from '../utils/todoDisplayUtils';
import TodoEditForm from './TodoEditForm';
import { EditingTodo } from '../hooks/useScheduleView';
import { IoSearchOutline } from 'react-icons/io5';

interface TodoItemComponentProps {
  todoWithMeta: TodoWithMeta;
  selectedTodoId?: string | null;
  quarterHeight: number;
  editingTodo: EditingTodo | null;
  setEditingTodo: (todo: EditingTodo | null) => void;
  onTodoClick: (todo: TodoWithMeta) => void;
  onStartTimeChange: (newStartTime: string) => void;
  onEndTimeChange: (newEndTime: string) => void;
  onCancelEdit: () => void;
  onUpdateTime: () => void;
  onDragEnd?: (todoId: string, taskId: string, diffMinutes: number, newDate?: Date) => void;
  onResizeEnd?: (todoId: string, taskId: string, diffMinutes: number) => void;
  day?: Date; // ドラッグ元の日付情報
  weekDays?: Date[]; // 週の全日付（別日への移動に使用）
}

// 別のカラムへのドラッグを検出するためのデータ属性名
const DAY_DATA_ATTRIBUTE = 'data-day-index';

const TodoItemComponent: React.FC<TodoItemComponentProps> = ({
  todoWithMeta,
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
  weekDays = []
}) => {
  const { todo, taskId, isNextTodo, priority } = todoWithMeta;
  const nodeRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeOffset, setResizeOffset] = useState(0); // リサイズによる位置のオフセット
  const [dayOffset, setDayOffset] = useState<number | null>(null); // 日付の変更オフセット
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 }); // ドラッグ位置
  
  // 表示するTODOの日付列インデックスを計算（ドラッグ元）
  const findDayIndex = () => {
    if (!day || !weekDays || weekDays.length === 0) return null;
    
    return weekDays.findIndex(weekDay => 
      weekDay.getFullYear() === day.getFullYear() && 
      weekDay.getMonth() === day.getMonth() && 
      weekDay.getDate() === day.getDate()
    );
  };
  
  const originalDayIndex = findDayIndex();
  
  if (!todo.calendarStartDateTime || !todo.calendarEndDateTime) return null;
  
  const { top, height } = calculateTodoPosition(todoWithMeta, quarterHeight);
  const isEditing = editingTodo?.todo.id === todo.id;
  
  // リサイズ中はその分の位置調整を行う
  const currentHeight = height + resizeOffset;
  
  const startDateTime = new Date(todo.calendarStartDateTime);
  const endDateTime = new Date(todo.calendarEndDateTime);

  // 異なる日への移動を検出
  const detectDayChange = (clientX: number): number | null => {
    if (!weekDays || weekDays.length === 0) return null;
    
    // カレンダーの各日のカラム要素を取得
    const columns = document.querySelectorAll(`[data-day-index]`);
    if (columns.length === 0) {
      console.warn('No columns with data-day-index found');
      return null;
    }
    
    // マウス位置から現在のカラムを特定
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const rect = column.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) {
        const dayIndex = parseInt(column.getAttribute('data-day-index') || '0');
        
        // 自分の元の日付列との差分を検出（違う列の場合のみ値を返す）
        if (originalDayIndex !== null && dayIndex !== originalDayIndex) {
          return dayIndex;
        }
      }
    }
    
    return null;
  };
  
  // 列の位置情報を取得（スナップ用）
  const getColumnPositions = () => {
    const positions: { index: number, left: number, width: number }[] = [];
    const columns = document.querySelectorAll(`[data-day-index]`);
    
    columns.forEach(column => {
      const dayIndex = parseInt(column.getAttribute('data-day-index') || '0');
      const rect = column.getBoundingClientRect();
      positions.push({
        index: dayIndex,
        left: rect.left,
        width: rect.width
      });
    });
    
    return positions;
  };
  
  // ドラッグ開始時
  const handleDragStart = () => {
    setIsDragging(true);
    setDayOffset(null);
    setDragPosition({ x: 0, y: 0 });
  };
  
  // ドラッグ中
  const handleDrag: DraggableEventHandler = (e, data) => {
    // MouseEventからclientXを取得
    let clientX = 0;
    
    // イベントオブジェクトをanyにキャストして処理
    const event = e as any;
    
    if (event.clientX) {
      clientX = event.clientX;
    } else if (event.touches && event.touches[0] && event.touches[0].clientX) {
      clientX = event.touches[0].clientX;
    } else {
      return;
    }
    
    // 現在ドラッグ中のカーソル位置から日付変更を検出
    const newDayIndex = detectDayChange(clientX);
    
    // 別の日付列にドラッグされた場合だけdayOffsetを設定
    if (newDayIndex !== dayOffset) {
      // 日付が変わったときだけ更新（パフォーマンス向上）
      setDayOffset(newDayIndex);
    }
    
    // ドラッグ位置を更新
    setDragPosition({ x: data.x, y: data.y });
  };
  
  // ドラッグ終了時
  const handleDragStop: DraggableEventHandler = (e, data) => {
    setIsDragging(false);
    
    // 日付変更がある場合
    if (dayOffset !== null && weekDays && weekDays.length > dayOffset) {
      // 移動量を15分単位に丸める
      const quarterCount = Math.round(data.y / quarterHeight);
      // 分単位の変化量を計算（15分単位）
      const diffMinutes = quarterCount * 15;
      
      // ドラッグ終了時のコールバック
      if (onDragEnd) {
        // 新しい日付を取得
        const newDate = new Date(weekDays[dayOffset]);
        
        // 年月日だけ抽出して比較（時間は含めない）
        const originalDate = day ? 
          `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}` : '';
        const targetDate = 
          `${newDate.getFullYear()}-${newDate.getMonth()}-${newDate.getDate()}`;
        
        // 本当に日付が変わったかチェック
        const isDateChanged = originalDate !== targetDate;
        
        // ブラウザのコンソールにも出力（デバッグ用）
        console.log('日付変更検証:', {
          todoId: todo.id,
          taskId,
          diffMinutes,
          元の日付: day ? day.toLocaleDateString() : '不明',
          新しい日付: newDate.toLocaleDateString(),
          元の日付コード: originalDate,
          新しい日付コード: targetDate,
          日付変更あり: isDateChanged
        });
        
        // 実行
        try {
          onDragEnd(todo.id, taskId, diffMinutes, newDate);
          console.log('onDragEnd実行完了');
        } catch (error) {
          console.error('onDragEnd実行エラー:', error);
        }
      }
    } else if (Math.abs(data.y) >= 4) {
      // 日付変更がなく、垂直方向に一定以上動いた場合
      const quarterCount = Math.round(data.y / quarterHeight);
      const diffMinutes = quarterCount * 15;
      
      if (onDragEnd) {
        try {
          onDragEnd(todo.id, taskId, diffMinutes);
          console.log('onDragEnd実行完了 (日付変更なし)');
        } catch (error) {
          console.error('onDragEnd実行エラー (日付変更なし):', error);
        }
      }
    }
    
    // 状態をリセット
    setDayOffset(null);
    setDragPosition({ x: 0, y: 0 });
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

  // 詳細アイコンクリック時のハンドラー
  const handleDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // タスク詳細を開くために、タスクとTODOを選択
    onTodoClick(todoWithMeta);
  };
  
  return (
    <React.Fragment>
      <Draggable
        nodeRef={nodeRef}
        axis="both" // 両方向の移動を許可
        grid={[1, quarterHeight]} // Y方向は15分単位にスナップ
        defaultPosition={{ x: 0, y: 0 }}
        onStart={handleDragStart}
        onDrag={handleDrag}
        onStop={handleDragStop}
        disabled={isResizing} // 編集中でもドラッグ可能にする
      >
        <div ref={nodeRef} style={{ 
          position: 'absolute', 
          top, 
          width: '100%', 
          zIndex: isDragging ? 100 : 1,
          opacity: isDragging && dayOffset !== null ? 0.5 : 1, // 別の日付列にいる時だけ半透明に
          transform: isDragging && dayOffset !== null ? 'scale(1.02)' : 'scale(1)', // 別の日付列にいる時は少し拡大
          transition: isDragging ? 'none' : 'opacity 0.2s, transform 0.2s' // ドラッグ中以外はアニメーション
        }}>
          <TodoItem
            className="todo-item"
            top={0}
            height={currentHeight} // リサイズ中の高さを反映
            isSelected={selectedTodoId === todo.id}
            isCompleted={todo.completed || false}
            isNextTodo={isNextTodo || false}
            priority={priority || 0}
            isDragging={isDragging}
            isResizing={isResizing} // リサイズ中のスタイル用
            isMovingToNewDay={isDragging && dayOffset !== null} // 新しい日付に移動中かのフラグ
          >
            <div>
              <div className="flex justify-between items-start">
                <div style={{ fontSize: '10px', color: 'gray', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                  {todoWithMeta.taskTitle}
                </div>
                <div 
                  className="detail-icon ml-1 cursor-pointer hover:bg-gray-100 rounded-full p-1" 
                  onClick={handleDetailClick}
                  style={{ color: '#3b82f6', flexShrink: 0 }}
                  title="詳細を表示"
                >
                  <IoSearchOutline size={16} />
                </div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {todo.text}
              </div>
            </div>
            <div style={{ fontSize: '10px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
              {`${startDateTime.getHours().toString().padStart(2, '0')}:${startDateTime
                .getMinutes()
                .toString()
                .padStart(2, '0')} - ${endDateTime
                .getHours()
                .toString()
                .padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`}
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