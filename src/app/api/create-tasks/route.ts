import { NextResponse } from 'next/server';

// 実際のタスク作成処理はここで実装
// タスクをデータベースに保存する処理やタスク管理システムと連携する処理を追加

export async function POST(request: Request) {
  try {
    // リクエストからタスクデータを取得
    const { tasks } = await request.json();

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: 'タスクが提供されていないか、無効な形式です。' },
        { status: 400 }
      );
    }

    // 実際のプロジェクトではここでタスクをデータベースに保存する処理を実装
    // 例: const createdTasks = await saveTasksToDatabase(tasks);
    
    // 開発用のモック処理
    const createdTasks = tasks.map((task, index) => ({
      ...task,
      id: `task-${Date.now()}-${index}`, // 実際のプロジェクトでは自動生成されるIDに置き換え
      createdAt: new Date().toISOString(),
    }));

    // 成功レスポンスを返す
    return NextResponse.json(
      { 
        message: 'タスクが正常に作成されました。',
        tasks: createdTasks 
      }, 
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating tasks:', error);
    return NextResponse.json(
      { error: error.message || 'タスク作成中にエラーが発生しました。' },
      { status: 500 }
    );
  }
}