import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
})

// API使用回数の管理
const API_USAGE_KEY = 'openai_api_usage'
const DAILY_LIMIT = 20

interface ApiUsage {
  date: string;
  count: number;
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

function getApiUsage(): ApiUsage {
  const storedUsage = localStorage.getItem(API_USAGE_KEY)
  if (!storedUsage) {
    return { date: getTodayDate(), count: 0 }
  }

  const usage: ApiUsage = JSON.parse(storedUsage)
  if (usage.date !== getTodayDate()) {
    return { date: getTodayDate(), count: 0 }
  }

  return usage
}

function incrementApiUsage(): void {
  const usage = getApiUsage()
  usage.count += 1
  localStorage.setItem(API_USAGE_KEY, JSON.stringify(usage))
}

function checkApiLimit(): boolean {
  const usage = getApiUsage()
  return usage.count < DAILY_LIMIT
}

export async function suggestTodos(taskTitle: string, taskDescription: string, currentTodos: string[]) {
  if (!checkApiLimit()) {
    throw new Error(`1日のAPI使用回数制限（${DAILY_LIMIT}回）を超えました。明日までお待ちください。`)
  }

  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    throw new Error('OpenAI APIキーが設定されていません。')
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: "タスクの内容から抜け漏れているTODOを提案し、JSONフォーマットで返してください。"
        },
        {
          role: "user",
          content: `タスク「${taskTitle}」の説明：${taskDescription}\n現在のTODO：${currentTodos.join(', ')}\n\n追加で必要なTODOを2つまで提案してください。以下のJSONフォーマットで回答してください：\n\n{
  "suggestions": [
    {
      "text": "TODOの内容",
      "estimatedHours": 1.5
    }
  ]
}`
        }
      ],
      response_format: { type: "json_object" }
    })

    if (!completion.choices[0].message.content) {
      return []
    }

    const result = JSON.parse(completion.choices[0].message.content)
    incrementApiUsage()
    return result.suggestions || []
  } catch (error: any) {
    console.error('Error suggesting todos:', error)
    
    // エラーメッセージの判定
    if (error?.status === 429) {
      throw new Error('OpenAI APIのリクエスト制限に達しました。しばらく待ってから再試行してください。')
    } else if (error?.status === 401) {
      throw new Error('OpenAI APIキーが無効です。APIキーを確認してください。')
    } else {
      throw new Error('TODOの提案中にエラーが発生しました。')
    }
  }
}

export async function formatProjectInfo(projectText: string) {
  if (!checkApiLimit()) {
    throw new Error(`1日のAPI使用回数制限（${DAILY_LIMIT}回）を超えました。明日までお待ちください。`)
  }

  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    throw new Error('OpenAI APIキーが設定されていません。')
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.3,
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content: "あなたはプロジェクト情報を整理するアシスタントです。与えられたテキストからプロジェクト情報を抽出し、整形して返してください。"
        },
        {
          role: "user",
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
${projectText}`
        }
      ]
    })

    if (!completion.choices[0].message.content) {
      throw new Error('応答が空です。')
    }

    incrementApiUsage()
    return completion.choices[0].message.content
  } catch (error: any) {
    console.error('Error formatting project info:', error)
    
    // エラーメッセージの判定
    if (error?.status === 429) {
      throw new Error('OpenAI APIのリクエスト制限に達しました。しばらく待ってから再試行してください。')
    } else if (error?.status === 401) {
      throw new Error('OpenAI APIキーが無効です。APIキーを確認してください。')
    } else {
      throw new Error('プロジェクト情報の整形中にエラーが発生しました。')
    }
  }
}

export async function extractProjectInfoFromFile(fileContent: string, fileName: string) {
  if (!checkApiLimit()) {
    throw new Error(`1日のAPI使用回数制限（${DAILY_LIMIT}回）を超えました。明日までお待ちください。`)
  }

  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    throw new Error('OpenAI APIキーが設定されていません。')
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      temperature: 0.3,
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: "あなたはプロジェクト情報を抽出するアシスタントです。与えられたファイル内容からプロジェクト情報を抽出し、整形して返してください。"
        },
        {
          role: "user",
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
${fileContent}`
        }
      ]
    })

    if (!completion.choices[0].message.content) {
      throw new Error('応答が空です。')
    }

    incrementApiUsage()
    return completion.choices[0].message.content
  } catch (error: any) {
    console.error('Error extracting project info from file:', error)
    
    // エラーメッセージの判定
    if (error?.status === 429) {
      throw new Error('OpenAI APIのリクエスト制限に達しました。しばらく待ってから再試行してください。')
    } else if (error?.status === 401) {
      throw new Error('OpenAI APIキーが無効です。APIキーを確認してください。')
    } else {
      throw new Error('ファイルからの情報抽出中にエラーが発生しました。')
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
    throw new Error(`1日のAPI使用回数制限（${DAILY_LIMIT}回）を超えました。明日までお待ちください。`)
  }

  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    throw new Error('OpenAI APIキーが設定されていません。')
  }

  // プロジェクトの開始日と終了日を取得
  let startDate = projectInfo.startDate || new Date().toISOString().split('T')[0];
  let endDate = projectInfo.endDate;
  
  // 終了日が設定されていない場合は、開始日から30日後を設定
  if (!endDate) {
    const end = new Date(startDate);
    end.setDate(end.getDate() + 30);
    endDate = end.toISOString().split('T')[0];
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: "あなたはプロジェクト計画のエキスパートです。プロジェクト情報を元に、適切なタスクとTODOを生成してください。"
        },
        {
          role: "user",
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
}`
        }
      ],
      response_format: { type: "json_object" }
    })

    if (!completion.choices[0].message.content) {
      throw new Error('応答が空です。')
    }

    incrementApiUsage()
    return JSON.parse(completion.choices[0].message.content)
  } catch (error: any) {
    console.error('Error generating project tasks:', error)
    
    // エラーメッセージの判定
    if (error?.status === 429) {
      throw new Error('OpenAI APIのリクエスト制限に達しました。しばらく待ってから再試行してください。')
    } else if (error?.status === 401) {
      throw new Error('OpenAI APIキーが無効です。APIキーを確認してください。')
    } else {
      throw new Error('タスク生成中にエラーが発生しました: ' + (error.message || '不明なエラー'))
    }
  }
} 