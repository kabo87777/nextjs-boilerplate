import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 定義題目結構
interface Question {
  text: string;
  isShown: boolean;
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'question.csv');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // 解析 CSV (假設格式：問題內容,是否已顯示)
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    const questions: Question[] = lines.map(line => {
      const [text, isShown] = line.split(',');
      return {
        text: text.trim(),
        isShown: isShown?.trim() === 'true'
      };
    });
    
    return NextResponse.json(questions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read questions' }, { status: 500 });
  }
}

// 若您需要同步狀態回 CSV，可實作 POST (此處僅提供框架)
export async function POST(request: Request) {
  // 這裡可以處理寫入 CSV 的邏輯
  return NextResponse.json({ success: true });
}
