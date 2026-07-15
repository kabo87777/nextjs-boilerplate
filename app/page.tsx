"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface Question {
  id?: number;
  text: string;
  isShown: boolean;
}

const matrixCharacters = [
  ["貪", "疑", "疑", "嗔", "慢", "疑", "疑", "癡", "慢", "嗔"],
  ["嗔", "癡", "嗔", "癡", "貪", "癡", "嗔", "嗔", "癡", "疑"],
  ["癡", "嗔", "癡", "貪", "癡", "嗔", "慢", "慢", "貪", "癡"],
  ["癡", "慢", "貪", "疑", "慢", "貪", "貪", "貪", "疑", "慢"],
  ["疑", "貪", "疑", "慢", "嗔", "疑", "癡", "疑", "嗔", "貪"],
  ["貪", "疑", "癡", "癡", "疑", "慢", "疑", "癡", "慢", "疑"],
  ["慢", "嗔", "貪", "貪", "嗔", "貪", "貪", "疑", "嗔", "嗔"],
  ["嗔", "癡", "慢", "嗔", "癡", "慢", "嗔", "慢", "癡", "貪"],
];

const rowLabels = ["A", "B", "C", "D", "E", "F", "G", "H"];
const colLabels = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

const colorOptions = [
  { value: "bg-white text-black border-gray-300" },
  { value: "bg-red-500 text-white border-red-600" },
  { value: "bg-yellow-400 text-black border-yellow-500" },
  { value: "bg-green-500 text-white border-green-600" },
  { value: "bg-blue-500 text-white border-blue-600" },
  { value: "bg-purple-500 text-white border-purple-600" },
  { value: "bg-orange-500 text-white border-orange-600" },
  { value: "bg-black text-white border-zinc-800" },
];

export default function MatrixPage() {
  const [gridColors, setGridColors] = useState<string[][]>(
    Array(8).fill(null).map(() => Array(10).fill("bg-white text-black border-gray-300"))
  );

  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [activeModal, setActiveModal] = useState<"menu" | "question" | null>(null);
  const [currentQuestionText, setCurrentQuestionText] = useState<string>("");

  const [mainTime, setMainTime] = useState(90 * 60);
  const [isMainRunning, setIsMainRunning] = useState(false);
  const [questionTime, setQuestionTime] = useState(30);
  const [isQuestionRunning, setIsQuestionRunning] = useState(false);

  useEffect(() => {
    fetch("/api/questions")
      .then((res) => res.json())
      .then((data: Question[]) => {
        const formattedData = data.map((q, index) => ({ ...q, id: index }));
        setQuestions(formattedData);
      })
      .finally(() => setQuestionsLoading(false));
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMainRunning && mainTime > 0) interval = setInterval(() => setMainTime(p => p - 1), 1000);
    return () => clearInterval(interval);
  }, [isMainRunning, mainTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeModal === "question" && isQuestionRunning && questionTime > 0) {
      interval = setInterval(() => setQuestionTime(p => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [activeModal, isQuestionRunning, questionTime]);

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  const handleCellClick = (r: number, c: number) => { setSelectedCell({ row: r, col: c }); setActiveModal("menu"); };
  
  const handleColorSelect = (colorClass: string) => {
    if (selectedCell) {
      const { row, col } = selectedCell;
      const newColors = [...gridColors];
      newColors[row][col] = colorClass;
      setGridColors(newColors);
      closeModal();
    }
  };

  const handleDrawQuestion = () => {
    const available = questions.filter((q) => !q.isShown);
    if (available.length === 0) {
      setCurrentQuestionText("所有問題皆已抽完！");
      setQuestionTime(0);
      setActiveModal("question");
      return;
    }
    const picked = available[Math.floor(Math.random() * available.length)];
    setQuestions(prev => prev.map(q => q.id === picked.id ? { ...q, isShown: true } : q));
    setCurrentQuestionText(picked.text);
    setQuestionTime(30);
    setIsQuestionRunning(false);
    setActiveModal("question");
  };

  const closeModal = () => { setSelectedCell(null); setActiveModal(null); };

  return (
    <main className="h-screen w-screen bg-zinc-950 text-white flex p-4 gap-4 overflow-hidden">
      <aside className="w-80 h-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col items-center flex-shrink-0">
        <h2 className="text-2xl font-bold text-zinc-400 mb-6 border-b border-zinc-700 pb-2 w-full text-center">活動時間</h2>
        <div className={`text-7xl font-black font-mono mb-8 ${mainTime <= 300 ? 'text-red-500' : 'text-cyan-400'}`}>
          {formatTime(mainTime)}
        </div>
        <div className="flex flex-col gap-4 w-full">
          <button onClick={() => setIsMainRunning(!isMainRunning)} className={`w-full py-5 text-2xl font-bold rounded-lg ${isMainRunning ? "bg-amber-600" : "bg-green-600"}`}>
            {isMainRunning ? "暫停計時 ⏸" : "開始計時 ▶"}
          </button>
          <button onClick={() => { setIsMainRunning(false); setMainTime(90 * 60); }} className="w-full py-4 text-xl font-bold bg-zinc-800 hover:bg-zinc-700 rounded-lg">重置 90 分鐘</button>
        </div>
        <p className="mt-auto text-zinc-500">
          {questionsLoading ? "載入中..." : `進度：${questions.filter((q) => q.isShown).length} / ${questions.length} 題`}
        </p>
      </aside>

      <section className="flex-1 h-full flex flex-col">
        <div className="w-full h-full flex flex-col">
          <div className="w-full relative h-[8%] min-h-[60px] mb-2 rounded-t-lg overflow-hidden flex-shrink-0">
            <Image src="/ground.png" alt="地表" fill className="object-cover" />
          </div>
          <div className="w-full flex-1 flex items-stretch gap-2 min-h-0">
            <div className="w-20 bg-black flex items-center justify-center rounded-l-lg border border-zinc-800">
              <span className="[writing-mode:vertical-lr] font-bold text-xl text-zinc-400"> </span>
            </div>
            <div className="flex-1 h-full bg-zinc-800/80 p-4 rounded-md border border-zinc-700 flex flex-col gap-2 overflow-hidden">
              <div className="flex ml-12 mb-2">{colLabels.map(l => <div key={l} className="flex-1 text-center font-black text-4xl text-yellow-400">{l}</div>)}</div>
              <div className="flex-1 flex flex-col gap-2 min-h-0">
                {matrixCharacters.map((row, r) => (
                  <div key={r} className="flex-1 flex gap-2">
                    <div className="w-12 flex items-center justify-center font-black text-4xl text-yellow-400">{rowLabels[r]}</div>
                    {row.map((char, c) => (
                      <button key={`${r}-${c}`} onClick={() => handleCellClick(r, c)} className={`flex-1 font-bold text-4xl rounded border ${gridColors[r][c]}`}>{char}</button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="w-20 bg-black flex items-center justify-center rounded-r-lg border border-zinc-800">
              <span className="[writing-mode:vertical-lr] font-bold text-xl text-zinc-400"> </span>
            </div>
          </div>
          <div className="w-full relative h-[8%] min-h-[60px] mt-2 rounded-b-lg overflow-hidden flex-shrink-0">
            <Image src="/diamond.png" alt="鑽石" fill className="object-cover" />
          </div>
        </div>
      </section>

      {activeModal === "menu" && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-800 p-8 rounded-2xl max-w-md w-full">
            <h3 className="text-3xl font-black text-center mb-6 text-white">{rowLabels[selectedCell?.row ?? 0]}{colLabels[selectedCell?.col ?? 0]}</h3>
            <button onClick={handleDrawQuestion} className="w-full bg-cyan-600 py-5 rounded-xl text-2xl font-black mb-8">❓ 抽取問題</button>
            <div className="grid grid-cols-4 gap-3">
              {colorOptions.map((c) => (
                <button key={c.value} onClick={() => handleColorSelect(c.value)} className={`h-14 rounded-lg border-2 ${c.value}`} />
              ))}
            </div>
            <button onClick={closeModal} className="w-full mt-8 bg-zinc-700 py-4 rounded-xl text-xl font-bold">關閉選單</button>
          </div>
        </div>
      )}

      {activeModal === "question" && (
        <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center p-8 z-[100] gap-8">
          {currentQuestionText !== "所有問題皆已抽完！" && (
            <div className="flex flex-col items-center gap-4 mt-8">
              <div className={`text-8xl font-black font-mono text-red-500 bg-red-950/50 border-4 border-red-500/50 px-10 py-4 rounded-3xl min-w-[350px] text-center`}>
                {questionTime > 0 ? questionTime : "時間到"}
              </div>
              {questionTime > 0 && (
                <button onClick={() => setIsQuestionRunning(!isQuestionRunning)} className={`px-8 py-3 rounded-full text-2xl font-bold ${isQuestionRunning ? "bg-amber-600" : "bg-green-600"}`}>
                  {isQuestionRunning ? "⏸ 暫停" : "▶ 開始倒數"}
                </button>
              )}
            </div>
          )}
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[80vw]">
            <h1 className="text-[5vw] leading-tight font-black text-center text-white p-10 bg-zinc-900 border-4 border-cyan-500 rounded-3xl w-full">{currentQuestionText}</h1>
          </div>
          <button onClick={() => setActiveModal("menu")} className="mb-10 bg-cyan-600 px-16 py-6 rounded-2xl text-4xl font-black">回答完畢</button>
        </div>
      )}
    </main>
  );
}
