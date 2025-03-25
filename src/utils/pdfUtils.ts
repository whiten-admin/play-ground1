/**
 * PDFファイルからテキストを抽出するユーティリティ
 * 注意: このシンプルな実装では、PDFが読み込めない場合でもプロジェクト作成ができるよう、エラーハンドリングを重視しています
 */

/**
 * PDFファイルからテキストを抽出する
 * @param file PDFファイル
 * @returns 抽出されたテキスト
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // PDFファイルのテキスト抽出には通常pdfjs-distなどのライブラリを使用しますが、
    // 簡易実装としてファイル名を返します
    if (file.type !== 'application/pdf') {
      throw new Error('PDFファイルではありません');
    }
    
    // 現実では以下のようにファイルを読み込み、PDFライブラリで処理します
    // 今回はファイル名から疑似的にテキストを生成
    return `プロジェクト名: ${file.name.replace(/\.pdf$/i, "").replace(/_/g, " ")}\n` +
      `説明: ${file.name}から抽出されたプロジェクト情報です。\n` +
      `この機能は本来はPDF解析ライブラリを使用して実装されます。`;
  } catch (error) {
    console.error('PDFからテキストの抽出に失敗しました:', error);
    throw new Error('PDFファイルの読み込みに失敗しました');
  }
}

/**
 * テキストからプロジェクト情報を抽出する
 * @param text 抽出元のテキスト
 * @returns プロジェクト情報（タイトルと説明）
 */
export function extractProjectInfoFromText(text: string): { title: string; description: string } {
  // テキストからタイトルを抽出（最初の行または「プロジェクト名:」の行）
  let title = '';
  let description = '';

  const lines = text.split('\n');
  
  // タイトルの抽出
  for (const line of lines) {
    if (line.trim()) {
      if (line.includes('プロジェクト名:') || line.includes('タイトル:') || line.includes('件名:')) {
        title = line.split(':')[1]?.trim() || line.trim();
        break;
      } else {
        // 何も見つからなければ最初の行をタイトルとして使用
        title = line.trim();
        break;
      }
    }
  }

  // 説明の抽出（「説明:」の行以降、または2行目以降の最大300文字）
  let descriptionStarted = false;
  let descriptionLines: string[] = [];

  for (const line of lines) {
    if (line.includes('説明:') || line.includes('概要:') || line.includes('内容:')) {
      descriptionStarted = true;
      const descPart = line.split(':')[1]?.trim();
      if (descPart) {
        descriptionLines.push(descPart);
      }
    } else if (descriptionStarted) {
      if (line.trim()) {
        descriptionLines.push(line.trim());
      }
    }
  }

  // 説明が見つからなければ、タイトル以外のテキストを使用
  if (descriptionLines.length === 0) {
    descriptionLines = lines.slice(1).filter(line => line.trim() && !line.includes(title));
  }

  // 説明を300文字に制限
  description = descriptionLines.join('\n').substring(0, 300);

  // デフォルト値の設定
  if (!title) {
    title = '新規プロジェクト';
  }

  if (!description) {
    description = 'プロジェクトの説明';
  }

  return { title, description };
} 