import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

// API使用回数の管理
const API_USAGE_KEY = 'openai_api_usage';
const DAILY_LIMIT = 20;

interface ApiUsage {
  date: string;
  count: number;
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getApiUsage(): ApiUsage {
  // サーバーサイドレンダリング環境ではlocalStorageは使用できないため、
  // チェックを追加
  if (typeof window === 'undefined') {
    return { date: getTodayDate(), count: 0 };
  }

  const storedUsage = localStorage.getItem(API_USAGE_KEY);
  if (!storedUsage) {
    return { date: getTodayDate(), count: 0 };
  }

  const usage: ApiUsage = JSON.parse(storedUsage);
  if (usage.date !== getTodayDate()) {
    return { date: getTodayDate(), count: 0 };
  }

  return usage;
}

function incrementApiUsage(): void {
  // サーバーサイドレンダリング環境ではlocalStorageは使用できないため、
  // チェックを追加
  if (typeof window === 'undefined') {
    return;
  }

  const usage = getApiUsage();
  usage.count += 1;
  localStorage.setItem(API_USAGE_KEY, JSON.stringify(usage));
}

function checkApiLimit(): boolean {
  // サーバーサイドレンダリング環境では常に制限なしとする
  if (typeof window === 'undefined') {
    return true;
  }

  const usage = getApiUsage();
  return usage.count < DAILY_LIMIT;
}

export async function suggestTodos(
  taskTitle: string,
  taskDescription: string,
  currentTodos: string[]
) {
  if (!checkApiLimit()) {
    throw new Error(
      `1日のAPI使用回数制限（${DAILY_LIMIT}回）を超えました。明日までお待ちください。`
    );
  }

  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    throw new Error('OpenAI APIキーが設定されていません。');
  }

  try {
    // TODOが0件の場合と、既存のTODOがある場合でプロンプトを変える
    const isNewTask = currentTodos.length === 0;
    const promptContent = isNewTask
      ? `タスク「${taskTitle}」の説明：${taskDescription}\n\nこのタスクを完了するために必要なTODOを洗い出して提案してください。タスクの内容に基づいて、論理的な順序で実施すべきことを８個以内でリストアップしてください。以下のJSONフォーマットで回答してください：\n\n{
  "suggestions": [
    {
      "text": "TODOの内容",
      "estimatedHours": 1.5
    }
  ]
}`
      : `タスク「${taskTitle}」の説明：${taskDescription}\n現在のTODO：${currentTodos.join(
          ', '
        )}\n\n追加で必要なTODOを2つまで提案してください。以下のJSONフォーマットで回答してください：\n\n{
  "suggestions": [
    {
      "text": "TODOの内容",
      "estimatedHours": 1.5
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: isNewTask
            ? 'タスクの内容から必要なTODOを漏れなく洗い出し、JSONフォーマットで返してください。'
            : 'タスクの内容から抜け漏れているTODOを提案し、JSONフォーマットで返してください。',
        },
        {
          role: 'user',
          content: promptContent,
        },
      ],
      response_format: { type: 'json_object' },
    });

    if (!completion.choices[0].message.content) {
      return [];
    }

    const result = JSON.parse(completion.choices[0].message.content);
    incrementApiUsage();
    return result.suggestions || [];
  } catch (error: any) {
    console.error('Error suggesting todos:', error);

    // エラーメッセージの判定
    if (error?.status === 429) {
      throw new Error(
        'OpenAI APIのリクエスト制限に達しました。しばらく待ってから再試行してください。'
      );
    } else if (error?.status === 401) {
      throw new Error('OpenAI APIキーが無効です。APIキーを確認してください。');
    } else {
      throw new Error('TODOの提案中にエラーが発生しました。');
    }
  }
}

export async function formatProjectInfo(projectText: string) {
  if (!checkApiLimit()) {
    throw new Error(
      `1日のAPI使用回数制限（${DAILY_LIMIT}回）を超えました。明日までお待ちください。`
    );
  }

  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    throw new Error('OpenAI APIキーが設定されていません。');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content:
            'あなたはプロジェクト情報を整理するアシスタントです。与えられたテキストからプロジェクト情報を抽出し、整形して返してください。',
        },
        {
          role: 'user',
          content: `以下のプロジェクト情報を整理して、マークダウン形式で返してください。
必ず以下のセクションを含めてください：
- プロジェクト名（# で始まるタイトル）
- プロジェクトコード（あれば）
- 期間（開始日と終了日）
- プロジェクト概要
- 目的
- 開発情報（開発手法、フェーズ、規模、予算など）
- ステークホルダー情報（クライアント、プロジェクトマネージャーなど）
- リスク・課題

情報が不足している場合は、そのセクションを空にしてください。

プロジェクト情報：
${projectText}`,
        },
      ],
    });

    if (!completion.choices[0].message.content) {
      throw new Error('応答が空です。');
    }

    incrementApiUsage();
    return completion.choices[0].message.content;
  } catch (error: any) {
    console.error('Error formatting project info:', error);

    // エラーメッセージの判定
    if (error?.status === 429) {
      throw new Error(
        'OpenAI APIのリクエスト制限に達しました。しばらく待ってから再試行してください。'
      );
    } else if (error?.status === 401) {
      throw new Error('OpenAI APIキーが無効です。APIキーを確認してください。');
    } else {
      throw new Error('プロジェクト情報の整形中にエラーが発生しました。');
    }
  }
}

export async function extractProjectInfoFromFile(
  fileContent: string,
  fileName: string
) {
  if (!checkApiLimit()) {
    throw new Error(
      `1日のAPI使用回数制限（${DAILY_LIMIT}回）を超えました。明日までお待ちください。`
    );
  }

  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    throw new Error('OpenAI APIキーが設定されていません。');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-16k',
      temperature: 0.3,
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content:
            'あなたはプロジェクト情報を抽出するアシスタントです。与えられたファイル内容からプロジェクト情報を抽出し、整形して返してください。',
        },
        {
          role: 'user',
          content: `以下は「${fileName}」というファイルの内容です。このファイルからプロジェクト情報を抽出し、マークダウン形式で返してください。
必ず以下のセクションを含めてください：
- プロジェクト名（# で始まるタイトル）
- プロジェクトコード（あれば）
- 期間（開始日と終了日）
- プロジェクト概要
- 目的
- 開発情報（開発手法、フェーズ、規模、予算など）
- ステークホルダー情報（クライアント、プロジェクトマネージャーなど）
- リスク・課題

情報が不足している場合は、そのセクションを空にしてください。

ファイル内容：
${fileContent}`,
        },
      ],
    });

    if (!completion.choices[0].message.content) {
      throw new Error('応答が空です。');
    }

    incrementApiUsage();
    return completion.choices[0].message.content;
  } catch (error: any) {
    console.error('Error extracting project info from file:', error);

    // エラーメッセージの判定
    if (error?.status === 429) {
      throw new Error(
        'OpenAI APIのリクエスト制限に達しました。しばらく待ってから再試行してください。'
      );
    } else if (error?.status === 401) {
      throw new Error('OpenAI APIキーが無効です。APIキーを確認してください。');
    } else {
      throw new Error('ファイルからの情報抽出中にエラーが発生しました。');
    }
  }
}

export async function generateProjectTasks(projectInfo: {
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
  phase?: string;
}) {
  if (!checkApiLimit()) {
    throw new Error(
      `1日のAPI使用回数制限（${DAILY_LIMIT}回）を超えました。明日までお待ちください。`
    );
  }

  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    throw new Error('OpenAI APIキーが設定されていません。');
  }

  // プロジェクトの開始日と終了日を取得
  let startDate =
    projectInfo.startDate || new Date().toISOString().split('T')[0];
  let endDate = projectInfo.endDate;

  // 終了日が設定されていない場合は、開始日から30日後を設定
  if (!endDate) {
    const end = new Date(startDate);
    end.setDate(end.getDate() + 30);
    endDate = end.toISOString().split('T')[0];
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content:
            'あなたはプロジェクト計画のエキスパートです。プロジェクト情報を元に、適切なタスクとTODOを生成してください。',
        },
        {
          role: 'user',
          content: `以下のプロジェクト情報を元に、プロジェクト期間内（${startDate}から${endDate}まで）のタスクとTODOを生成してください。
プロジェクト名: ${projectInfo.title}
説明: ${projectInfo.description}
フェーズ: ${projectInfo.phase || 'planning'}

タスクは期間内に均等に分散させ、各タスクには複数のTODOを含めてください。
優先度は0（低）、1（中）、2（高）で設定してください。

以下のJSON形式で返してください:

{
  "tasks": [
    {
      "title": "タスク名",
      "description": "タスクの説明",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "priority": 1,
      "todos": [
        {
          "text": "TODO内容",
          "estimatedHours": 2
        }
      ]
    }
  ]
}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    if (!completion.choices[0].message.content) {
      throw new Error('応答が空です。');
    }

    incrementApiUsage();
    return JSON.parse(completion.choices[0].message.content);
  } catch (error: any) {
    console.error('Error generating project tasks:', error);

    // エラーメッセージの判定
    if (error?.status === 429) {
      throw new Error(
        'OpenAI APIのリクエスト制限に達しました。しばらく待ってから再試行してください。'
      );
    } else if (error?.status === 401) {
      throw new Error('OpenAI APIキーが無効です。APIキーを確認してください。');
    } else {
      throw new Error(
        'タスク生成中にエラーが発生しました: ' +
          (error.message || '不明なエラー')
      );
    }
  }
}

export async function estimateTodoHours(
  todoText: string,
  taskTitle: string,
  taskDescription: string
) {
  if (!checkApiLimit()) {
    throw new Error(
      `1日のAPI使用回数制限（${DAILY_LIMIT}回）を超えました。明日までお待ちください。`
    );
  }

  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    throw new Error('OpenAI APIキーが設定されていません。');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content:
            'あなたはプロジェクト管理のエキスパートです。TODOの内容を分析して、適切な工数見積もりと根拠を提供してください。',
        },
        {
          role: 'user',
          content: `以下のタスクとTODOについて、適切な工数見積もり（時間単位）と根拠を提供してください。

タスク: ${taskTitle}
タスク説明: ${taskDescription}
TODO: ${todoText}

工数見積もりの根拠も含めて、以下のJSON形式で返してください:

{
  "estimatedHours": 2.5,
  "reasoning": "このTODOの工数見積もりの根拠..."
}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    if (!completion.choices[0].message.content) {
      throw new Error('応答が空です。');
    }

    incrementApiUsage();
    return JSON.parse(completion.choices[0].message.content);
  } catch (error: any) {
    console.error('Error estimating todo hours:', error);

    // エラーメッセージの判定
    if (error?.status === 429) {
      throw new Error(
        'OpenAI APIのリクエスト制限に達しました。しばらく待ってから再試行してください。'
      );
    } else if (error?.status === 401) {
      throw new Error('OpenAI APIキーが無効です。APIキーを確認してください。');
    } else {
      throw new Error(
        '工数見積もり中にエラーが発生しました: ' +
          (error.message || '不明なエラー')
      );
    }
  }
}

export async function suggestProjectTasks(projectData: {
  title: string;
  description: string;
  currentTasks: string[];
}) {
  if (!checkApiLimit()) {
    throw new Error(
      `1日のAPI使用回数制限（${DAILY_LIMIT}回）を超えました。明日までお待ちください。`
    );
  }

  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    throw new Error('OpenAI APIキーが設定されていません。');
  }

  try {
    const promptContent = `
プロジェクト名: ${projectData.title}
プロジェクト説明: ${projectData.description}
現在のタスク: ${projectData.currentTasks.join(', ')}

上記のプロジェクト情報を分析し、このプロジェクトで追加すべき重要なタスクを5つ提案してください。
各タスクには、タスク名、簡潔な説明、およびこのタスクが必要である理由を含めてください。
現在のタスクと重複せず、プロジェクトの成功に貢献する新しいタスクを提案してください。

以下のJSONフォーマットで回答してください：

{
  "suggestions": [
    {
      "title": "タスク名",
      "description": "タスクの説明",
      "reason": "このタスクが必要な理由"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: 'あなたはプロジェクト管理のエキスパートです。プロジェクト情報に基づいた最適なタスク提案をJSONフォーマットで提供してください。',
        },
        {
          role: 'user',
          content: promptContent,
        },
      ],
      response_format: { type: 'json_object' },
    });

    if (!completion.choices[0].message.content) {
      throw new Error('応答が空です。');
    }

    incrementApiUsage();
    const result = JSON.parse(completion.choices[0].message.content);
    return result.suggestions || [];
  } catch (error: any) {
    console.error('Error suggesting project tasks:', error);

    // エラーメッセージの判定
    if (error?.status === 429) {
      throw new Error(
        'OpenAI APIのリクエスト制限に達しました。しばらく待ってから再試行してください。'
      );
    } else if (error?.status === 401) {
      throw new Error('OpenAI APIキーが無効です。APIキーを確認してください。');
    } else {
      throw new Error(
        'タスク提案中にエラーが発生しました: ' +
          (error.message || '不明なエラー')
      );
    }
  }
}

export async function suggestTaskTodos(taskData: {
  title: string;
  description: string;
}) {
  if (!checkApiLimit()) {
    throw new Error(
      `1日のAPI使用回数制限（${DAILY_LIMIT}回）を超えました。明日までお待ちください。`
    );
  }

  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    throw new Error('OpenAI APIキーが設定されていません。');
  }

  try {
    const promptContent = `
タスク名: ${taskData.title}
タスク説明: ${taskData.description}

上記のタスクを完了するために必要なTODOアイテムを5つまで提案してください。
各TODOには、タイトル、簡潔な説明、および予想される工数（時間単位）を含めてください。
TODOは論理的な順序で提案し、タスク完了に必要な具体的なステップを示してください。

以下のJSONフォーマットで回答してください：

{
  "todos": [
    {
      "title": "TODO名",
      "description": "TODOの説明",
      "estimatedHours": 2.5
    }
  ],
  "totalEstimatedHours": 12.5
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: 'あなたはプロジェクト管理のエキスパートです。タスクに必要なTODOを具体的かつ効率的に提案してください。',
        },
        {
          role: 'user',
          content: promptContent,
        },
      ],
      response_format: { type: 'json_object' },
    });

    if (!completion.choices[0].message.content) {
      throw new Error('応答が空です。');
    }

    incrementApiUsage();
    const result = JSON.parse(completion.choices[0].message.content);
    return {
      todos: result.todos || [],
      totalEstimatedHours: result.totalEstimatedHours || 0
    };
  } catch (error: any) {
    console.error('Error suggesting task todos:', error);

    // エラーメッセージの判定
    if (error?.status === 429) {
      throw new Error(
        'OpenAI APIのリクエスト制限に達しました。しばらく待ってから再試行してください。'
      );
    } else if (error?.status === 401) {
      throw new Error('OpenAI APIキーが無効です。APIキーを確認してください。');
    } else {
      throw new Error(
        'TODO提案中にエラーが発生しました: ' +
          (error.message || '不明なエラー')
      );
    }
  }
}

export async function extractTasksFromMinutes(minutesText: string) {
  if (!checkApiLimit()) {
    throw new Error(
      `1日のAPI使用回数制限（${DAILY_LIMIT}回）を超えました。明日までお待ちください。`
    );
  }

  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    throw new Error('OpenAI APIキーが設定されていません。');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-16k',
      temperature: 0.3,
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content:
            'あなたは議事録からタスクを抽出するアシスタントです。議事録から宿題事項やタスクを抽出して、適切な形式で返してください。必ず有効なJSON形式で返してください。',
        },
        {
          role: 'user',
          content: `以下の議事録から、宿題事項やタスクを抽出してください。議事録を分析して、明確に定義されたタスク、アクションアイテム、または担当者に割り当てられた作業を特定してください。
必ず以下のJSONフォーマットで回答してください。他の文章は含めず、純粋なJSONのみを返してください：

{
  "tasks": [
    {
      "name": "タスク名",
      "description": "タスクの詳細説明",
      "dueDate": "YYYY-MM-DD形式の期日（言及があれば）",
      "estimatedHours": 見積工数（数値、言及があれば）,
      "todos": ["必要なTODO項目1", "必要なTODO項目2"],
      "assignee": "担当者名（言及があれば）"
    }
  ]
}

議事録：
${minutesText}`,
        },
      ],
    });

    if (!completion.choices[0].message.content) {
      throw new Error('応答が空です。');
    }

    try {
      // JSONとして解析する前に、余計な文字列を取り除く処理を追加
      const content = completion.choices[0].message.content.trim();
      // バッククォートやマークダウンコードブロックを削除する処理
      const jsonStr = content
        .replace(/^```json\s*/, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim();
      
      const result = JSON.parse(jsonStr);
      incrementApiUsage();
      return result.tasks || [];
    } catch (jsonError) {
      console.error('JSON解析エラー:', jsonError, '受信内容:', completion.choices[0].message.content);
      throw new Error('APIレスポンスのJSON解析に失敗しました。');
    }
  } catch (error: any) {
    console.error('Error extracting tasks from minutes:', error);

    // エラーメッセージの判定
    if (error?.status === 429) {
      throw new Error(
        'OpenAI APIのリクエスト制限に達しました。しばらく待ってから再試行してください。'
      );
    } else if (error?.status === 401) {
      throw new Error('OpenAI APIキーが無効です。APIキーを確認してください。');
    } else {
      throw new Error('議事録からのタスク抽出中にエラーが発生しました。');
    }
  }
}
