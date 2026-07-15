"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface Question {
  text: string;
  isShown: boolean;
}

// 1. 更新為 8 列 x 10 行 的矩陣
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

// 顏色定義
const colorOptions = [
  { name: "白色", value: "bg-white text-black border-gray-300" },
  { name: "紅色", value: "bg-red-500 text-white border-red-600" },
  { name: "黃色", value: "bg-yellow-400 text-black border-yellow-500" },
  { name: "綠色", value: "bg-green-500 text-white border-green-600" },
  { name: "藍色", value: "bg-blue-500 text-white border-blue-600" },
  { name: "紫色", value: "bg-purple-500 text-white border-purple-600" },
  { name: "橘色", value: "bg-orange-500 text-white border-orange-600" },
  { name: "黑色", value: "bg-black text-white border-zinc-800" },
];

export default function MatrixPage() {
  // 網格狀態 (8x10)
  const [gridColors, setGridColors] = useState<string[][]>(
    Array(8).fill(null).map(() => Array(10).fill("bg-white text-black border-gray-300"))
  );

  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);

  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [activeModal, setActiveModal] = useState<"menu" | "question" | null>(null);
  const [currentQuestionText, setCurrentQuestionText] = useState<string>("");

  // ====== 計時器狀態 ======
  // 1. 活動總計時 (90分鐘 = 5400秒)
  const [mainTime, setMainTime] = useState(90 * 60);
  const [isMainRunning, setIsMainRunning] = useState(false);

  // 2. 題目倒數計時 (30秒)
  const [questionTime, setQuestionTime] = useState(30);
  const [isQuestionRunning, setIsQuestionRunning] = useState(false);

  // 取得問題資料
  useEffect(() => {
    fetch("/api/questions")
      .then((res) => res.json())
      .then((data: Question[]) => setQuestions(data))
      .catch(() => setQuestions([]))
      .finally(() => setQuestionsLoading(false));
  }, []);

  // 主計時器邏輯
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMainRunning && mainTime > 0) {
      interval = setInterval(() => setMainTime((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isMainRunning, mainTime]);

  // 題目 30 秒計時器邏輯
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeModal === "question" && isQuestionRunning && questionTime > 0) {
      interval = setInterval(() => setQuestionTime((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [activeModal, isQuestionRunning, questionTime]);

  // 格式化時間 (MM:SS)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

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

  const handleDrawQuestion = async () => {
    const availableQuestions = questions.filter((q) => !q.isShown);

    if (availableQuestions.length === 0) {
      setCurrentQuestionText("所有問題皆已抽完！");
      setQuestionTime(0);
      setIsQuestionRunning(false);
      setActiveModal("question");
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const pickedQuestion = availableQuestions[randomIndex];

    // 更新前端狀態
    setQuestions((prev) =>
      prev.map((q) => (q.text === pickedQuestion.text ? { ...q, isShown: true } : q))
    );
    
    // 設定題目與重置30秒狀態
    setCurrentQuestionText(pickedQuestion.text);
    setQuestionTime(30);
    setIsQuestionRunning(false); // 確保每次抽題都是等待開始的狀態
    setActiveModal("question");

    // 同步到後端 API
    try {
      await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pickedQuestion.text }),
      });
    } catch {
      // 失敗則復原狀態
      setQuestions((prev) =>
        prev.map((q) => (q.text === pickedQuestion.text ? { ...q, isShown: false } : q))
      );
    }
  };

  const closeModal = () => {
    setSelectedCell(null);
    setActiveModal(null);
  };

  return (
    // 【修改點】改為 h-screen w-screen，強制填滿且不出現卷軸
    <main className="h-screen w-screen bg-zinc-950 text-white flex p-4 gap-4 overflow-hidden">
      
      {/* ====== 左側：控制面板 & 總計時器 ====== */}
      {/* 【修改點】加上 h-full 讓側邊欄頂天立地 */}
      <aside className="w-64 md:w-72 lg:w-80 h-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-start items-center shadow-2xl flex-shrink-0">
        <h2 className="text-xl md:text-2xl font-bold text-zinc-400 mb-6 tracking-widest border-b border-zinc-700 pb-2 w-full text-center">
          活動時間
        </h2>
        
        <div className={`text-6xl md:text-7xl font-black font-mono mb-8 tracking-wider ${mainTime <= 300 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
          {formatTime(mainTime)}
        </div>

        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={() => setIsMainRunning(!isMainRunning)}
            className={`w-full py-5 text-2xl font-bold rounded-lg transition-all ${
              isMainRunning 
              ? "bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(217,119,6,0.5)]" 
              : "bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_rgba(22,163,7,0.5)]"
            }`}
          >
            {isMainRunning ? "暫停計時 ⏸" : "開始計時 ▶"}
          </button>
          
          <button
            onClick={() => {
              setIsMainRunning(false);
              setMainTime(90 * 60);
            }}
            className="w-full py-4 text-xl font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-all"
          >
            重置 90 分鐘
          </button>
        </div>

        <div className="mt-auto w-full pt-6 border-t border-zinc-800">
          <p className="text-base text-zinc-500 text-center">
            {questionsLoading
              ? "載入題庫中..."
              : `目前進度：${questions.filter((q) => q.isShown).length} / ${questions.length} 題`}
          </p>
        </div>
      </aside>

      {/* ====== 右側：主體矩陣版面 ====== */}
      {/* 【修改點】改為 h-full 讓右邊填滿整個高度，並移除 min-w 限制讓他有彈性 */}
      <section className="flex-1 h-full flex flex-col">
        {/* 【修改點】移除 max-w-[1400px]，加上 h-full 讓容器徹底向外撐開 */}
        <div className="w-full h-full flex flex-col">
          
          {/* 頂部：地表圖片 */}
          {/* 【修改點】高度改成 h-[8%]，隨螢幕高度動態調整 */}
          <div className="w-full relative h-[8%] min-h-[60px] max-h-[120px] mb-2 rounded-t-lg overflow-hidden shadow-md flex-shrink-0">
            <Image src="/ground.png" alt="地表" fill className="object-cover" priority />
          </div>

          {/* 【修改點】加上 flex-1 與 min-h-0，這層是讓內部網格能完美伸縮的關鍵 */}
          <div className="w-full flex-1 flex items-stretch gap-2 min-h-0">
            
            {/* 左側：純黑石頭 */}
            <div className="w-16 md:w-20 bg-black flex items-center justify-center rounded-l-lg shadow-inner border border-zinc-800 flex-shrink-0">
              <span className="writing-mode-vertical text-center font-bold tracking-widest text-zinc-400 text-xl select-none [writing-mode:vertical-lr]">
                最堅硬的石頭
              </span>
            </div>

            {/* 核心區域：包含標籤與 8x10 網格 */}
            <div className="flex-1 h-full bg-zinc-800/80 p-2 md:p-4 rounded-md border border-zinc-700 shadow-xl flex flex-col gap-2 overflow-hidden">
              
              {/* 橫向編號：1 到 10 */}
              <div className="flex ml-8 md:ml-12 mb-1 flex-shrink-0">
                {colLabels.map((label) => (
                  <div key={`col-${label}`} className="flex-1 text-center font-black text-3xl md:text-5xl text-yellow-400 drop-shadow-md">
                    {label}
                  </div>
                ))}
              </div>

              {/* 網格與縱向編號 */}
              <div className="flex-1 flex flex-col gap-1.5 md:gap-2 min-h-0">
                {matrixCharacters.map((row, rowIndex) => (
                  <div key={`row-${rowIndex}`} className="flex-1 flex items-stretch gap-1.5 md:gap-2">
                    
                    {/* 縱向編號：A 到 H */}
                    <div className="w-8 md:w-12 flex items-center justify-center font-black text-3xl md:text-5xl text-yellow-400 drop-shadow-md flex-shrink-0">
                      {rowLabels[rowIndex]}
                    </div>

                    {/* 當列的 10 個按鈕 */}
                    {/* 【修改點】移除了按鈕的 min-h-[70px]，讓它完全依靠 flex-1 自動均分伸展 */}
                    {row.map((char, colIndex) => (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        className={`flex-1 flex items-center justify-center font-bold text-3xl md:text-4xl rounded transition-all duration-200 border transform hover:scale-105 active:scale-95 shadow-sm ${gridColors[rowIndex][colIndex]}`}
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* 右側：純黑石頭 */}
            <div className="w-16 md:w-20 bg-black flex items-center justify-center rounded-r-lg shadow-inner border border-zinc-800 flex-shrink-0">
              <span className="writing-mode-vertical text-center font-bold tracking-widest text-zinc-400 text-xl select-none [writing-mode:vertical-lr]">
                最堅硬的石頭
              </span>
            </div>
          </div>

          {/* 底部：鑽石圖片 */}
          {/* 【修改點】高度改成 h-[8%]，隨螢幕高度動態調整 */}
          <div className="w-full relative h-[8%] min-h-[60px] max-h-[120px] mt-2 rounded-b-lg overflow-hidden shadow-md flex-shrink-0">
            <Image src="/diamond.png" alt="鑽石" fill className="object-cover" />
          </div>

        </div>
      </section>

      {/* ====== 彈窗 1：功能選擇選單 ====== */}
      {activeModal === "menu" && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-800 border border-zinc-600 p-8 rounded-2xl max-w-md w-full shadow-[0_0_30px_rgba(0,0,0,0.8)]">
            <h3 className="text-3xl font-black text-center mb-6 text-white bg-zinc-900 py-3 rounded-lg border border-zinc-700">
              目標：{rowLabels[selectedCell?.row ?? 0]}{colLabels[selectedCell?.col ?? 0]}
            </h3>
            
            <button
              onClick={handleDrawQuestion}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-5 rounded-xl text-2xl font-black mb-8 transition-colors shadow-lg"
            >
              ❓ 抽取問題
            </button>

            <div className="border-t-2 border-zinc-700 pt-6">
              <p className="text-lg text-zinc-300 mb-4 font-bold text-center">🎨 變更格子顏色</p>
              <div className="grid grid-cols-4 gap-3">
                {colorOptions.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleColorSelect(color.value)}
                    className={`h-14 rounded-lg border-2 ${color.value} flex items-center justify-center hover:opacity-80 active:scale-90 transition-transform shadow-md`}
                    aria-label={color.name}
                  ></button>
                ))}
              </div>
            </div>

            <button
              onClick={closeModal}
              className="w-full mt-8 bg-zinc-700 hover:bg-zinc-600 text-white py-4 rounded-xl text-xl font-bold transition-colors"
            >
              關閉選單
            </button>
          </div>
        </div>
      )}

      {/* ====== 彈窗 2：滿版題目顯示 & 30秒倒數 ====== */}
      {activeModal === "question" && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-8 z-[100] gap-8">
          
          {/* 30 秒倒數計時器容器 */}
          {currentQuestionText !== "所有問題皆已抽完！" && (
            <div className="flex flex-col items-center gap-4 mt-8">
              <div className={`text-8xl font-black text-red-500 bg-red-950/50 border-4 border-red-500/50 px-10 py-4 rounded-3xl shadow-[0_0_40px_rgba(239,68,68,0.4)] min-w-[350px] text-center ${questionTime > 0 ? 'font-mono' : 'tracking-widest'}`}>
                {questionTime > 0 ? questionTime : "時間到"}
              </div>
              
              {/* 開始/暫停倒數按鈕 (時間歸零前皆可操作) */}
              {questionTime > 0 && (
                <button
                  onClick={() => setIsQuestionRunning(!isQuestionRunning)}
                  className={`px-8 py-3 rounded-full text-2xl font-bold transition-all shadow-lg ${
                    isQuestionRunning 
                    ? "bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(217,119,6,0.5)]" 
                    : "bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_rgba(22,163,7,0.5)]"
                  }`}
                >
                  {isQuestionRunning ? "⏸ 暫停倒數" : "▶ 開始 30 秒倒數"}
                </button>
              )}
            </div>
          )}

          {/* 題目主體 (四面邊框 border-4) */}
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[80vw]">
            <h1 className="text-5xl md:text-[5vw] leading-tight font-black text-center text-white drop-shadow-[0_5px_15px_rgba(0,0,0,1)] px-12 py-10 bg-zinc-900/80 border-4 border-cyan-500 rounded-3xl w-full break-words">
              {currentQuestionText}
            </h1>
          </div>

          <button
            onClick={() => setActiveModal("menu")} 
            className="mb-10 bg-cyan-600 hover:bg-cyan-500 text-white px-16 py-6 rounded-2xl text-4xl font-black transition-all shadow-[0_10px_25px_rgba(8,145,178,0.5)] hover:scale-105 active:scale-95"
          >
            我回答完畢了！
          </button>
        </div>
      )}
    </main>
  );
}
