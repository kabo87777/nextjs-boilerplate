import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

interface Question {
  text: string;
  isShown: boolean;
}

const CSV_PATH = path.join(process.cwd(), "public", "question.csv");

function parseCSV(content: string): Question[] {
  return content
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const lastComma = line.lastIndexOf(",");
      const text = line.slice(0, lastComma);
      const isShown = line.slice(lastComma + 1).trim().toLowerCase() === "true";
      return { text, isShown };
    });
}

function serializeCSV(questions: Question[]): string {
  return questions.map((q) => `${q.text},${q.isShown}`).join("\n") + "\n";
}

async function readQuestions(): Promise<Question[]> {
  const content = await fs.readFile(CSV_PATH, "utf-8");
  return parseCSV(content);
}

async function writeQuestions(questions: Question[]): Promise<void> {
  await fs.writeFile(CSV_PATH, serializeCSV(questions), "utf-8");
}

export async function GET() {
  try {
    const questions = await readQuestions();
    return NextResponse.json(questions);
  } catch {
    return NextResponse.json({ error: "Failed to read questions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { text } = (await request.json()) as { text?: string };

    if (!text) {
      return NextResponse.json({ error: "Question text is required" }, { status: 400 });
    }

    const questions = await readQuestions();
    const index = questions.findIndex((q) => q.text === text);

    if (index === -1) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    if (questions[index].isShown) {
      return NextResponse.json({ error: "Question already shown" }, { status: 409 });
    }

    questions[index] = { ...questions[index], isShown: true };
    await writeQuestions(questions);

    return NextResponse.json(questions[index]);
  } catch {
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}
