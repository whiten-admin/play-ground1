import { Task, Todo } from '@/types/task';
import { differenceInDays, isBefore, isAfter, format } from 'date-fns';

interface ScheduleDiff {
  taskId: string;
  taskTitle: string;
  todoId: string;
  todoTitle: string;
  oldDate: string;
  newDate: string;
}

interface ScheduleDiffViewProps {
  changes: ScheduleDiff[];
  onApprove: () => void;
  onCancel: () => void;
  tasks: Task[];
}

export default function ScheduleDiffView({ changes, onApprove, onCancel, tasks }: ScheduleDiffViewProps) {
  // 現在の日付を取得
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 表示対象のTODOを取得
  const getDisplayTodos = () => {
    const displayTodos: Array<{
      taskId: string;
      taskTitle: string;
      todoId: string;
      todoTitle: string;
      oldDate: string;
      newDate: string;
      hasChange: boolean;
    }> = [];

    if (!tasks) {
      return displayTodos;
    }

    tasks.forEach(task => {
      task.todos.forEach(todo => {
        // 過去分または完了済みのTODOを除外
        const todoDate = todo.plannedStartDate 
          ? new Date(todo.plannedStartDate)
          : new Date(todo.startDate);
        
        // 日付を0時0分0秒に設定して比較
        todoDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isBefore(todoDate, today) || todo.completed) {
          return;
        }

        // 変更があるかどうかを確認
        const change = changes.find(c => c.todoId === todo.id);
        if (change) {
          displayTodos.push({
            ...change,
            hasChange: true
          });
        } else {
          const hasChange = Boolean(todo.plannedStartDate && 
            format(new Date(todo.plannedStartDate), 'yyyy-MM-dd') !== format(new Date(todo.startDate), 'yyyy-MM-dd'));
          
          displayTodos.push({
            taskId: task.id,
            taskTitle: task.title,
            todoId: todo.id,
            todoTitle: todo.text,
            oldDate: format(new Date(todo.startDate), 'yyyy-MM-dd'),
            newDate: todo.plannedStartDate 
              ? format(new Date(todo.plannedStartDate), 'yyyy-MM-dd')
              : format(new Date(todo.startDate), 'yyyy-MM-dd'),
            hasChange
          });
        }
      });
    });

    return displayTodos;
  };

  const displayTodos = getDisplayTodos();

  // カレンダーの表示範囲を計算
  const getCalendarRange = () => {
    const dates = displayTodos.map(todo => ({
      old: new Date(todo.oldDate),
      new: new Date(todo.newDate)
    }));

    const minDate = new Date(Math.min(...dates.map(date => Math.min(date.old.getTime(), date.new.getTime()))));
    const maxDate = new Date(Math.max(...dates.map(date => Math.max(date.old.getTime(), date.new.getTime()))));

    // 前後1週間の余裕を持たせる
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);

    return {
      startDate: minDate,
      endDate: maxDate,
      totalDays: Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
    };
  };

  const calendarRange = getCalendarRange();

  // 日付をフォーマットする関数
  const formatDate = (date: Date) => {
    return date.getDate().toString();
  };

  // 月を取得する関数
  const getMonth = (date: Date) => {
    return date.getMonth() + 1;
  };

  // 指定された日が月の1日かどうかを判定する関数
  const isFirstDayOfMonth = (date: Date) => {
    return date.getDate() === 1;
  };

  // 指定された日数分の日付配列を生成
  const getDates = () => {
    const dates = [];
    const currentDate = new Date(calendarRange.startDate);
    
    while (currentDate <= calendarRange.endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  // 差分バーコンポーネント
  const DiffBar = ({ todo, isNew }: { todo: typeof displayTodos[0]; isNew: boolean }) => {
    const date = isNew ? new Date(todo.newDate) : new Date(todo.oldDate);
    const startDiff = differenceInDays(date, calendarRange.startDate);
    const width = `${(1 / calendarRange.totalDays) * 100}%`;
    const left = `${(startDiff / calendarRange.totalDays) * 100}%`;

    return (
      <div
        className={`absolute h-4 rounded ${
          todo.hasChange
            ? isNew
              ? 'bg-green-500'
              : 'bg-red-500'
            : 'bg-gray-300'
        }`}
        style={{
          width,
          left,
        }}
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">スケジュール変更内容の確認</h3>
        
        {/* 凡例 */}
        <div className="mb-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>変更前</span>
            <div className="w-4 h-4 bg-green-500 rounded ml-4"></div>
            <span>変更後</span>
            <div className="w-4 h-4 bg-gray-300 rounded ml-4"></div>
            <span>変更なし</span>
          </div>
        </div>

        {/* カレンダーヘッダー */}
        <div className="mb-4">
          <div className="grid" style={{ gridTemplateColumns: `48px repeat(${calendarRange.totalDays}, minmax(30px, 1fr))` }}>
            <div className="border-l border-t border-b"></div>
            {getDates().map((date, i) => (
              <div key={i} className="border-l border-t border-b text-center relative">
                {isFirstDayOfMonth(date) && (
                  <div className="absolute -top-4 left-0 right-0 text-xs text-gray-500">
                    {getMonth(date)}月
                  </div>
                )}
                <div className="py-1 text-xs">
                  {formatDate(date)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ガントチャート表示 */}
        <div className="relative">
          {/* タスク名とバー */}
          <div className="space-y-4">
            {(() => {
              // 親タスクごとにグループ化
              const groupedTodos = displayTodos.reduce((acc, todo) => {
                if (!acc[todo.taskId]) {
                  acc[todo.taskId] = {
                    taskId: todo.taskId,
                    taskTitle: todo.taskTitle,
                    todos: []
                  };
                }
                acc[todo.taskId].todos.push(todo);
                return acc;
              }, {} as Record<string, { taskId: string; taskTitle: string; todos: typeof displayTodos }>);

              return Object.values(groupedTodos).map((group) => (
                <div key={group.taskId}>
                  {/* 親タスク名 */}
                  <div className="relative h-8">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-48 text-sm truncate border-r border-b bg-gray-100">
                      <div className="truncate">{group.taskTitle}</div>
                    </div>
                  </div>
                  {/* 子タスク */}
                  {group.todos.map((todo) => (
                    <div key={todo.todoId}>
                      <div className="relative h-8">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-48 text-sm truncate border-r border-b">
                          <div className="truncate pl-4">{todo.todoTitle}</div>
                        </div>
                        <div className="ml-48 relative border-b h-8">
                          {/* 変更前 */}
                          <div className="absolute inset-0 h-4 top-0">
                            <DiffBar todo={todo} isNew={false} />
                          </div>
                          {/* 変更後 */}
                          <div className="absolute inset-0 h-4 top-4">
                            <DiffBar todo={todo} isNew={true} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            キャンセル
          </button>
          <button
            onClick={onApprove}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            変更を適用
          </button>
        </div>
      </div>
    </div>
  );
} 