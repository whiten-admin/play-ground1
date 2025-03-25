import { Task, Todo } from "@/types/task";

/**
 * 生成されたタスク情報をプロジェクトのTaskオブジェクトに変換する
 * @param generatedTasks 生成されたタスク情報
 * @param projectId プロジェクトID
 * @returns 変換されたTaskオブジェクトの配列
 */
export function convertGeneratedTasksToTaskObjects(
  generatedTasks: any,
  projectId: string
): Task[] {
  // generatedTasksが配列でない場合は空配列を返す
  if (!generatedTasks || !generatedTasks.tasks || !Array.isArray(generatedTasks.tasks)) {
    return [];
  }

  // 生成されたタスク情報をTaskオブジェクトに変換
  return generatedTasks.tasks.map((task: any) => {
    // タスクのIDを生成
    const taskId = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // タスクのTODOを変換
    const todos: Todo[] = task.todos.map((todo: any, index: number) => {
      // TODOのIDを生成
      const todoId = `todo-${taskId}-${index}`;
      
      // 開始日/終了日の取得（タスクの日付がなければ現在の日付を使用）
      const startDate = task.startDate || new Date().toISOString().split('T')[0];
      const endDate = task.endDate || startDate;
      
      // TODOオブジェクトを作成
      return {
        id: todoId,
        text: todo.text,
        completed: false,
        startDate,
        endDate,
        dueDate: new Date(endDate),
        estimatedHours: todo.estimatedHours || 1,
        assigneeIds: []
      };
    });

    // タスクオブジェクトを作成
    return {
      id: taskId,
      title: task.title,
      description: task.description || '',
      startDate: task.startDate || new Date().toISOString().split('T')[0],
      endDate: task.endDate || task.startDate || new Date().toISOString().split('T')[0],
      todos,
      priority: task.priority !== undefined ? task.priority : 1,
      assigneeIds: [],
      projectId
    };
  });
} 