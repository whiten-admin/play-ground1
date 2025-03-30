/**
 * ファイルからテキスト内容を抽出するユーティリティ関数
 */

/**
 * ファイルの内容をテキストとして読み込む
 * @param file アップロードされたファイル
 * @returns テキスト内容のPromise
 */
export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('ファイルの読み込みに失敗しました。'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('ファイルの読み込み中にエラーが発生しました。'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * PDFファイルからテキストを抽出する
 * @param file PDFファイル
 * @returns 抽出されたテキスト内容のPromise
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  throw new Error('PDFファイルの処理は現在実装中です。');
}

/**
 * Wordファイル(.doc, .docx)からテキストを抽出する
 * @param file Wordファイル
 * @returns 抽出されたテキスト内容のPromise
 */
export async function extractTextFromWord(file: File): Promise<string> {
  throw new Error('Wordファイルの処理は現在実装中です。');
}

/**
 * サポートされているファイル形式かどうかをチェック
 * @param fileName ファイル名
 * @returns サポートされている場合はtrue
 */
export function isSupportedFileType(fileName: string): boolean {
  const supportedExtensions = ['.txt', '.md'];
  const extension = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  return supportedExtensions.includes(extension);
}

/**
 * ファイルの種類に応じてテキスト内容を抽出する
 * @param file アップロードされたファイル
 * @returns 抽出されたテキスト内容のPromise
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  
  if (!isSupportedFileType(fileName)) {
    throw new Error('サポートされていないファイル形式です。');
  }
  
  return readFileAsText(file);
} 