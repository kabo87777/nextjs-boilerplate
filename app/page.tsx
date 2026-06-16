"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface Question {
  text: string;
  isShown: boolean;
}

// 2. 依照圖片精確提取的 10x10 矩陣文字
const matrixCharacters = [
  ["貪", "疑", "疑", "嗔", "慢", "疑", "疑", "癡", "慢", "嗔"],
  ["嗔", "癡", "嗔", "癡", "貪", "癡", "嗔", "嗔", "癡", "疑"],
  ["癡", "嗔", "癡", "貪", "癡", "嗔", "慢", "慢", "貪", "癡"],
  ["癡", "慢", "貪", "疑", "慢", "貪", "貪", "貪", "疑", "慢"],
  ["疑", "貪", "疑", "慢", "嗔", "疑", "癡", "疑", "嗔", "貪"],
  ["貪", "疑", "癡", "癡", "疑", "慢", "疑", "癡", "慢", "疑"],
  ["慢", "嗔", "貪", "貪", "嗔", "貪", "貪", "疑", "嗔", "嗔"],
  ["嗔", "癡", "慢", "嗔", "癡", "慢", "嗔", "慢", "癡", "貪"],
  ["疑", "慢", "慢", "疑", "貪", "嗔", "癡", "貪", "貪", "慢"],
  ["慢", "貪", "嗔", "慢", "疑", "癡", "慢", "嗔", "疑", "癡"],
];

// 3. 可選的 8 種顏色定義
const colorOptions = [
  { name: "第一組", value: "bg-red-500 text-white border-red-600" },
  { name: "第二組", value: "bg-yellow-400 text-black border-yellow-500" },
  { name: "第三組", value: "bg-green-500 text-white border-green-600" },
  { name: "第四組", value: "bg-blue-500 text-white border-blue-600" },
  { name: "第五組", value: "bg-purple-500 text-white border-purple-600" },
  { name: "第六組", value: "bg-orange-500 text-white border-orange-600" },
  { name: "", value: "bg-white text-black border-gray-300" },
  { name: " ", value: "bg-black text-white border-zinc-800" },
];

export default function MatrixPage() {
  const [gridColors, setGridColors] = useState<string[][]>(
    Array(10).fill(null).map(() => Array(10).fill("bg-white text-black border-gray-300"))
  );

  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);

  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  
  const [activeModal, setActiveModal] = useState<"menu" | "question" | null>(null);
  const [currentQuestionText, setCurrentQuestionText] = useState<string>("");

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    setSelectedCell({ row: rowIndex, col: colIndex });
    setActiveModal("menu");
  };

  const handleColorSelect = (colorClass: string) => {
    if (selectedCell) {
      const { row, col } = selectedCell;
      const newGridColors = [...gridColors];
      newGridColors[row][col] = colorClass;
      setGridColors(newGridColors);
      closeModal();
    }
  };

  useEffect(() => {
    fetch("/api/questions")
      .then((res) => res.json())
      .then((data: Question[]) => setQuestions(data))
      .catch(() => setQuestions([]))
      .finally(() => setQuestionsLoading(false));
  }, []);

  const handleDrawQuestion = async () => {
    const availableQuestions = questions.filter((q) => !q.isShown);

    if (availableQuestions.length === 0) {
      setCurrentQuestionText("所有問題皆已抽完！");
      setActiveModal("question");
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const pickedQuestion = availableQuestions[randomIndex];

    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.text === pickedQuestion.text ? { ...q, isShown: true } : q
      )
    );
    setCurrentQuestionText(pickedQuestion.text);
    setActiveModal("question");

    try {
      await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pickedQuestion.text }),
      });
    } catch {
      setQuestions((prevQuestions) =>
        prevQuestions.map((q) =>
          q.text === pickedQuestion.text ? { ...q, isShown: false } : q
        )
      );
    }
  };

  const closeModal = () => {
    setSelectedCell(null);
    setActiveModal(null);
  };

  return (
    <main className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full flex flex-col items-center">
        
        {/* 頂部：地表圖片 (保留) */}
        <div className="w-full relative h-16 mb-2 rounded-t-lg overflow-hidden shadow-md">
           <Image 
             src="/ground.png"
             alt="地表" 
             fill
             className="object-cover" 
             priority
           />
        </div>

        {/* 中間主體：左右純黑石頭 + 中間 10x10 矩陣 */}
        <div className="w-full flex items-stretch gap-2">
          
          {/* 左側：石頭 (改為純黑背景 bg-black，並加上灰白色文字) */}
          <div className="w-12 bg-black flex items-center justify-center rounded-l-lg shadow-inner border border-zinc-800 flex-shrink-0">
            <span className="writing-mode-vertical text-center font-bold tracking-widest text-zinc-400 text-sm select-none [writing-mode:vertical-lr]">
              
            </span>
          </div>

          {/* 核心 10x10 網格 */}
          <div className="flex-1 bg-zinc-800 p-4 rounded-md border border-zinc-700 shadow-xl grid grid-cols-10 gap-1.5 aspect-square max-h-[65vh]">
            {matrixCharacters.map((row, rowIndex) =>
              row.map((char, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  className={`w-full h-full flex items-center justify-center font-bold text-base md:text-xl rounded transition-all duration-200 border transform active:scale-95 shadow-sm ${gridColors[rowIndex][colIndex]}`}
                >
                  {char}
                </button>
              ))
            )}
          </div>

          {/* 右側：石頭 (改為純黑背景 bg-black，並加上灰白色文字) */}
          <div className="w-12 bg-black flex items-center justify-center rounded-r-lg shadow-inner border border-zinc-800 flex-shrink-0">
            <span className="writing-mode-vertical text-center font-bold tracking-widest text-zinc-400 text-sm select-none [writing-mode:vertical-lr]">
              
            </span>
          </div>
        </div>

        {/* 底部：鑽石終點圖片 (保留) */}
        <div className="w-full relative h-16 mt-2 rounded-b-lg overflow-hidden shadow-md">
           <Image 
             src="/diamond.png"
             loading="eager"
             alt="鑽石" 
             fill
             className="object-cover" 
           />
        </div>

        {/* 目前題目狀態計數 */}
        <div className="mt-4 text-xs text-zinc-500">
          {questionsLoading
            ? "載入問題庫中..."
            : `目前問題庫進度：已抽取 ${questions.filter((q) => q.isShown).length} 題 / 總計 ${questions.length} 題`}
        </div>
      </div>

      {/* 彈窗 1：功能選擇選單 */}
      {activeModal === "menu" && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-zinc-800 border border-zinc-700 p-6 rounded-xl max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-center mb-4 text-zinc-100">
              請選擇操作位置：({selectedCell?.row ? selectedCell.row + 1 : 1}, {selectedCell?.col ? selectedCell.col + 1 : 1})
            </h3>
            
            <button
              onClick={handleDrawQuestion}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-lg font-bold mb-5 transition-colors shadow-md"
            >
              ❓ 隨機抽取問題
            </button>

            <div className="border-t border-zinc-700 pt-4">
              <p className="text-sm text-zinc-400 mb-2 font-medium">🎨 變更格子顏色：</p>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleColorSelect(color.value)}
                    className={`h-10 text-xs font-bold rounded border ${color.value} flex items-center justify-center hover:opacity-90 active:scale-95 transition-transform`}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={closeModal}
              className="w-full mt-5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 py-2 rounded-lg text-sm transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 彈窗 2：顯示抽到的隨機問題 */}
      {activeModal === "question" && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-800 border-2 border-cyan-500 p-6 rounded-xl max-w-md w-full shadow-2xl text-center">
            <div className="text-cyan-400 text-4xl mb-3">💡</div>
            <h3 className="text-xl font-bold mb-4 text-cyan-300">心靈探索提問</h3>
            <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-700 text-lg leading-relaxed text-zinc-200 mb-6">
              {currentQuestionText}
            </div>
            <button
              onClick={() => setActiveModal("menu")} 
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-md"
            >
              確認並關閉問題
            </button>
          </div>
        </div>
      )}
    </main>
  );
}