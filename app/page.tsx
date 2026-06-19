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

// 3. 簡化後的顏色定義 (純 Tailwind Class 字串)
const colorOptions = [
  "bg-red-500 text-white border-red-600",
  "bg-yellow-400 text-black border-yellow-500",
  "bg-green-500 text-white border-green-600",
  "bg-blue-500 text-white border-blue-600",
  "bg-purple-500 text-white border-purple-600",
  "bg-orange-500 text-white border-orange-600",
  "bg-white text-black border-gray-300", // 清除 (預設)
  "bg-black text-white border-zinc-800", // 黑石
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
        
        {/* 頂部：地表圖片 */}
        <div className="w-full relative h-16 mb-2 rounded-t-lg overflow-hidden shadow-md">
           <div className="absolute inset-0 bg-zinc-700"></div>
           <Image 
             src="/ground.png"
             alt="地表" 
             fill
             className="object-cover" 
             priority
           />
        </div>

        {/* 中間主體：左右純黑石頭 + 中間矩陣 */}
        <div className="w-full flex items-stretch gap-2">
          
          {/* 左側：石頭 */}
          <div className="w-8 md:w-12 bg-black flex items-center justify-center rounded-l-lg shadow-inner border border-zinc-800 flex-shrink-0"></div>

          {/* 核心網格區塊 - 加入 A-J 與 1-10 標示 */}
          <div className="flex-1 bg-zinc-800 p-4 rounded-md border border-zinc-700 shadow-xl flex flex-col aspect-square max-h-[65vh]">
            
            <div className="grid grid-cols-[auto_repeat(10,minmax(0,1fr))] grid-rows-[auto_repeat(10,minmax(0,1fr))] gap-1 md:gap-1.5 w-full h-full">
              
              {/* 左上角空白佔位 */}
              <div className="w-5 md:w-6 h-5 md:h-6"></div>

              {/* 頂部欄位標籤 (1 ~ 10) */}
              {[...Array(10)].map((_, colIndex) => (
                <div key={`header-col-${colIndex}`} className="flex items-end justify-center pb-1 text-zinc-400 font-mono text-xs md:text-sm font-bold select-none">
                  {colIndex + 1}
                </div>
              ))}

              {/* 內容列：左側行標籤 (A ~ J) + 矩陣按鈕 */}
              {matrixCharacters.map((row, rowIndex) => (
                <React.Fragment key={`row-group-${rowIndex}`}>
                  
                  {/* 左側列標籤 (A ~ J) */}
                  <div className="flex items-center justify-end pr-1 md:pr-2 text-zinc-400 font-mono text-xs md:text-sm font-bold select-none">
                    {String.fromCharCode(65 + rowIndex)}
                  </div>

                  {/* 矩陣按鈕 */}
                  {row.map((char, colIndex) => (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      className={`w-full h-full flex items-center justify-center font-bold text-base md:text-xl rounded transition-all duration-200 border transform active:scale-95 shadow-sm ${gridColors[rowIndex][colIndex]}`}
                    >
                      {char}
                    </button>
                  ))}

                </React.Fragment>
              ))}
            </div>

          </div>

          {/* 右側：石頭 */}
          <div className="w-8 md:w-12 bg-black flex items-center justify-center rounded-r-lg shadow-inner border border-zinc-800 flex-shrink-0"></div>
        </div>

        {/* 底部：鑽石終點圖片 */}
        <div className="w-full relative h-16 mt-2 rounded-b-lg overflow-hidden shadow-md">
           <div className="absolute inset-0 bg-cyan-900"></div>
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
              請選擇操作位置：({selectedCell ? String.fromCharCode(65 + selectedCell.row) : "A"}, {selectedCell ? selectedCell.col + 1 : 1})
            </h3>
            
            <button
              onClick={handleDrawQuestion}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-lg font-bold mb-5 transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <span>❓</span> 隨機抽取問題
            </button>

            <div className="border-t border-zinc-700 pt-4">
              <p className="text-sm text-zinc-400 mb-3 font-medium text-center">🎨 變更格子顏色</p>
              
              {/* 修改為純顏色色塊 (Swatches) */}
              <div className="grid grid-cols-4 gap-3">
                {colorOptions.map((colorClass, index) => (
                  <button
                    key={colorClass}
                    onClick={() => handleColorSelect(colorClass)}
                    title={index === 6 ? "清除" : index === 7 ? "黑石" : `顏色 ${index + 1}`}
                    className={`h-12 w-full rounded-md border-2 shadow-sm hover:scale-105 active:scale-95 transition-all ${colorClass} ${index === 6 ? 'relative' : ''}`}
                  >
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={closeModal}
              className="w-full mt-6 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 py-2.5 rounded-lg text-sm transition-colors"
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