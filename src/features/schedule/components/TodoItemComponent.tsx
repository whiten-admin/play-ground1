import React, { useRef, useState, useEffect } from 'react';
import Draggable, { DraggableEventHandler, DraggableData } from 'react-draggable';
import { TodoWithMeta, TodoDragEvent } from '../types/schedule';
import { calculateTodoPosition } from '../utils/todoDisplayUtils';
import TodoEditForm from './TodoEditForm';
import { EditingTodo } from '../hooks/useScheduleView';
import { IoSearchOutline } from 'react-icons/io5';
import { FaGoogle } from 'react-icons/fa';
import { useAuth } from '@/services/auth/hooks/useAuth';
import { getProjectMemberName } from '@/utils/memberUtils';

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
  const { todo, taskId, isNextTodo, priority, taskTitle, isExternal } = todoWithMeta;
  const nodeRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeOffset, setResizeOffset] = useState(0); // リサイズによる位置のオフセット
  const [dayOffset, setDayOffset] = useState<number | null>(null); // 日付の変更オフセット
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 }); // ドラッグ位置
  
  // 現在のユーザー情報を取得
  const { user } = useAuth();
  
  // メンバー名を取得（未アサインの場合は空文字）
  const memberName = todo.assigneeId ? getProjectMemberName(todo.assigneeId) : '';
  
  // 他のメンバーのTODOかどうかを判定
  const isOtherMembersTodo = todo.assigneeId && memberName && memberName !== '未アサイン';
  
  // メンバーの頭文字を取得
  const memberInitial = memberName && memberName !== '未アサイン' ? memberName.charAt(0) : '';
  
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
  
  // 期限切れかどうかを判定
  const now = new Date();
  const isOverdue = !todo.completed && endDateTime < now;

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
        } catch (error) {
          console.error('ドラッグ終了処理でエラー:', error);
        }
      }
    } else if (data.y !== 0 && onDragEnd) {
      // 同じ日内での移動（縦方向のみ）
      // 移動量を15分単位に丸める
      const quarterCount = Math.round(data.y / quarterHeight);
      // 分単位の変化量を計算（15分単位）
      const diffMinutes = quarterCount * 15;
      
      if (diffMinutes !== 0) {
        try {
          onDragEnd(todo.id, taskId, diffMinutes);
        } catch (error) {
          console.error('時間変更処理でエラー:', error);
        }
      }
    }
    
    // ドラッグ位置をリセット
    setDragPosition({ x: 0, y: 0 });
  };
  
  // リサイズ開始
  const handleResizeStart = () => {
    setIsResizing(true);
    setResizeOffset(0);
  };
  
  // リサイズ中
  const handleResize = (e: any, data: any) => {
    setResizeOffset(data.y);
  };
  
  // リサイズ終了
  const handleResizeStop = (e: any, data: any) => {
    setIsResizing(false);
    
    // 変更量を15分単位に丸める
    const quarterCount = Math.round(data.y / quarterHeight);
    const diffMinutes = quarterCount * 15;
    
    // 変更がある場合のみ通知
    if (diffMinutes !== 0 && onResizeEnd) {
      onResizeEnd(todo.id, taskId, diffMinutes);
    }
    
    // リサイズオフセットをリセット
    setResizeOffset(0);
  };
  
  // 詳細表示ボタンのクリックハンドラ
  const handleDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTodoClick(todoWithMeta);
  };
  
  // 時間をフォーマットする関数
  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // リサイズハンドルのスタイル
  const resizeHandleStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '6px',
    cursor: 'ns-resize',
    backgroundColor: 'transparent',
    zIndex: 10
  };

  return (
    <div className="todo-item pointer-events-auto relative" ref={nodeRef}>
      <Draggable
        nodeRef={nodeRef}
        // 外部予定の場合はドラッグ無効
        disabled={isExternal}
        axis="y"
        handle=".drag-handle"
        position={isDragging ? dragPosition : { x: 0, y: 0 }}
        grid={[5, quarterHeight / 2]}
        bounds={isDragging ? undefined : { top: -top, bottom: Infinity }}
        onStart={handleDragStart}
        onDrag={handleDrag}
        onStop={handleDragStop}
      >
        <div
          style={{ 
            position: 'absolute',
            top: `${top}px`,
            left: 0,
            width: '100%',
            height: `${currentHeight}px`,
            minHeight: `${quarterHeight}px`,
            zIndex: isDragging ? 50 : (isEditing ? 40 : (isResizing ? 30 : 20)),
            transform: isDragging ? 'scale(1.02)' : 'scale(1)',
            transition: isDragging ? 'none' : 'transform 0.2s',
          }}
          className={`${isDragging ? 'opacity-60' : 'opacity-100'}`}
        >
          <div
            className={`drag-handle cursor-${isExternal ? 'default' : 'move'} shadow border 
              ${isExternal ? 'bg-indigo-50 border-indigo-400' : 
                 todo.completed ? 'bg-gray-200 border-gray-300' : 
                 isOverdue ? 'bg-red-50 border-red-200' : 
                 isNextTodo ? 'bg-amber-50 border-amber-200' : 
                 'bg-white border-gray-200'
              } 
              ${todo.completed ? 'opacity-70' : 'opacity-100'} 
              ${isEditing ? 'ring-2 ring-blue-500' : ''} 
              ${selectedTodoId === todo.id ? 'ring-2 ring-blue-500' : ''}`}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '2px 4px',
              overflow: 'hidden',
              borderRadius: '4px',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              fontSize: '12px',
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {/* プロジェクト全体モード時にはプロジェクト名を表示 */}
            {todoWithMeta.isAllProjectsMode && todoWithMeta.projectTitle ? (
              <span className="text-[9px] text-blue-400 font-medium mr-1">
                [{todoWithMeta.projectTitle}]
              </span>
            ) : null}
            {/* タスク名とTODO */}
            <div className="flex flex-col justify-between h-full">
              <div>
                {!isExternal && (
                  <div className="text-[10px] text-gray-500 truncate mb-0.5">
                    {taskTitle}
                  </div>
                )}
                <div 
                  className={`text-xs font-medium truncate ${
                    todo.completed ? 'line-through text-gray-500' : (
                      isExternal ? 'text-indigo-700' : 
                      isOverdue ? 'text-red-700' :
                      isNextTodo ? 'text-amber-800' :
                      'text-gray-800'
                    )
                  }`} 
                  title={todo.text}
                >
                  {todo.text}
                </div>
              </div>
              
              {/* 時間表示 */}
              <div className="text-[10px] text-gray-600 mt-0.5">
                {formatTime(startDateTime)} - {formatTime(endDateTime)}
              </div>
            </div>
            
            {/* 外部予定の場合はGoogleアイコンを表示 */}
            {isExternal && (
              <div className="absolute bottom-0.5 right-0.5 text-xs text-[#4285F4]">
                <FaGoogle size={10} />
              </div>
            )}
            
            {/* 他メンバーの予定の場合は左上にメンバーの頭文字を丸く表示 */}
            {isOtherMembersTodo && memberInitial && (
              <div className="absolute top-0.5 left-0.5 w-4 h-4 flex items-center justify-center text-[10px] font-medium text-white bg-blue-500 rounded-full">
                {memberInitial}
              </div>
            )}
            
            {/* 編集中でない場合にのみ詳細ボタンを表示 */}
            {!isEditing && !isExternal && (
              <button
                className="absolute top-0.5 right-0.5 text-xs text-gray-400 hover:text-gray-600 bg-white bg-opacity-70 rounded-full p-0.5"
                onClick={handleDetailClick}
              >
                <IoSearchOutline size={10} />
              </button>
            )}
          </div>
          
          {/* リサイズハンドル (外部予定には表示しない) */}
          {!isEditing && !isExternal && (
            <Draggable
              nodeRef={resizeRef}
              axis="y"
              grid={[1, quarterHeight / 4]}
              position={{ x: 0, y: resizeOffset }}
              onStart={handleResizeStart}
              onDrag={handleResize}
              onStop={handleResizeStop}
              disabled={isDragging}
            >
              <div
                ref={resizeRef}
                style={resizeHandleStyle}
                className="resize-handle hover:bg-gray-200 hover:bg-opacity-50"
              >
                <div 
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: '2px',
                    width: '20px',
                    height: '2px',
                    backgroundColor: '#cbd5e0',
                    transform: 'translateX(-50%)',
                    borderRadius: '1px',
                  }}
                />
              </div>
            </Draggable>
          )}
        </div>
      </Draggable>
      
      {/* 編集フォーム (外部予定には表示しない) */}
      {isEditing && !isExternal && (
        <TodoEditForm
          todo={todo}
          startTime={editingTodo.startTime}
          endTime={editingTodo.endTime}
          onStartTimeChange={onStartTimeChange}
          onEndTimeChange={onEndTimeChange}
          onCancel={onCancelEdit}
          onSubmit={onUpdateTime}
        />
      )}
    </div>
  );
};

export default TodoItemComponent; 