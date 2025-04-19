import { NextResponse } from 'next/server';
import { extractTasksFromMinutes } from '@/services/api/utils/openai';

// タスクのインターフェース定義
interface TaskData {
  name?: string;
  description?: string;
  dueDate?: string;
  estimatedHours?: number;
  todos?: string[];
  assignee?: string;
  [key: string]: any; // その他のプロパティも許容
}

export async function POST(request: Request) {
  try {
    // リクエストからデータを取得
    const { minutes } = await request.json();

    if (!minutes || typeof minutes !== 'string') {
      return NextResponse.json(
        { error: '議事録が提供されていないか、無効な形式です。' },
        { status: 400 }
      );
    }

    // OpenAI APIを使用してタスクを抽出
    const tasks = await extractTasksFromMinutes(minutes);

    // プロパティの欠損に対応するためにデフォルト値を設定
    const processedTasks = tasks.map((task: TaskData) => ({
      name: task.name || '名称未設定タスク',
      description: task.description || '',
      dueDate: task.dueDate || '',
      estimatedHours: task.estimatedHours || 0,
      todos: Array.isArray(task.todos) ? task.todos : [],
      assignee: task.assignee || ''
    }));

    // 成功レスポンスを返す
    return NextResponse.json({ tasks: processedTasks }, { status: 200 });
  } catch (error: any) {
    console.error('Error extracting tasks:', error);
    return NextResponse.json(
      { error: error.message || 'タスク抽出中にエラーが発生しました。' },
      { status: 500 }
    );
  }
} 