import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
})

export async function suggestTodos(taskTitle: string, taskDescription: string, currentTodos: string[]) {
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
    return result.suggestions || []
  } catch (error: any) {
    console.error('Error suggesting todos:', error)
    
    // エラーメッセージの判定
    if (error?.status === 429) {
      throw new Error('APIリクエストの制限に達しました。しばらく待ってから再度お試しください。')
    } else if (error?.status === 401) {
      throw new Error('APIキーが無効です。APIキーを確認してください。')
    } else {
      throw new Error('TODOの提案中にエラーが発生しました。')
    }
  }
} 