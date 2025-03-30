import { Task, Todo, Project } from "@/types/task";

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
      
      // 着手予定日と期日の取得（タスクの日付がなければ現在の日付を使用）
      const startDate = new Date(task.startDate || new Date());
      const dueDate = new Date(task.endDate || task.startDate || new Date());
      
      // カレンダー表示用の日時を計算
      const calendarStartDateTime = new Date(startDate);
      calendarStartDateTime.setHours(9, 0, 0, 0);
      
      const calendarEndDateTime = new Date(calendarStartDateTime);
      calendarEndDateTime.setHours(calendarStartDateTime.getHours() + (todo.estimatedHours || 1));
      
      // TODOオブジェクトを作成
      return {
        id: todoId,
        text: todo.text,
        completed: false,
        startDate,
        calendarStartDateTime,
        calendarEndDateTime,
        estimatedHours: todo.estimatedHours || 1,
        actualHours: 0,
        assigneeId: ''
      };
    });

    // タスクオブジェクトを作成
    return {
      id: taskId,
      title: task.title,
      description: task.description || '',
      dueDate: new Date(task.endDate || task.startDate || new Date()),
      completedDateTime: undefined,
      todos,
      projectId
    };
  });
}

// デフォルトのTODOを作成
function createDefaultTodo(id: string, text: string, date: Date): Todo {
  return {
    id,
    text,
    completed: false,
    startDate: date,
    calendarStartDateTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0),
    calendarEndDateTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 0, 0),
    estimatedHours: 1,
    actualHours: 0,
    assigneeId: ''
  };
}

export function addTaskWithDefaultTodos(project: Project, title: string, description: string, dueDate: Date): Project {
  const taskId = `task-${Date.now()}`;
  
  // 期日を開始日の1週間後に設定
  const dueDateObj = dueDate || new Date(new Date().setDate(new Date().getDate() + 7));
  
  // 新規タスク作成
  const newTask: Task = {
    id: taskId,
    title,
    description,
    dueDate: dueDateObj,
    completedDateTime: undefined,
    todos: [],
    projectId: project.id
  };
  
  // TODOの追加
  newTask.todos.push(
    createDefaultTodo(`${taskId}-todo-1`, '開始', new Date()),
    createDefaultTodo(`${taskId}-todo-2`, '完了', dueDateObj)
  );
  
  // プロジェクトの複製を作成して新しいタスクを追加
  const updatedProject = {
    ...project,
    tasks: [...project.tasks, newTask]
  };
  
  return updatedProject;
} 