"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prompt = `
You are an AI that checks if a user’s word matches a clue based on its category.
- Categories are: "emotions" (must be a feeling), "actions" (must be a verb), "general" (other words except emotion or action).
- The clue is: "{clue}" (a simple rephrased definition).
- The user’s input is: "{input}".
- The category is: "{category}".
- Reply "1" if the input:
  - Matches the clue’s meaning or is a clear synonym based on standard English.
  - Fits the given category.
  - Is not a word directly used in the clue itself.
- Reply "0" otherwise.
- Use simple English rules, ignore case, and be very precise. Do not guess or use extra information.
`;

export default function VocabHit({ category }) { // Changed from difficulty
  const [clues, setClues] = useState([]);
  const [remainingIndices, setRemainingIndices] = useState([]);
  const [currentClue, setCurrentClue] = useState(null);
  const [input, setInput] = useState("");
  const [isCorrect, setIsCorrect] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [serialCount, setSerialCount] = useState(1);
  const [isGameReady, setIsGameReady] = useState(false);
  const initializedRef = useRef(false);
  const chatRef = useRef(null);
  const intervalRef = useRef(null);

  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Initialize Gemini and data
  useEffect(() => {
    const initialize = async () => {
      setIsGameReady(false);
      try {
        const chat = await model.startChat({
          history: [{ role: "user", parts: [{ text: prompt }] }],
        });
        chatRef.current = chat;
        
        const res = await fetch('/data/vocabHit.json');
        const vocabData = await res.json();
        const filteredClues = vocabData.filter((item) => item.category === category); // Changed from difficulty
        setClues(filteredClues);
        setRemainingIndices(filteredClues.map((_, i) => i));
        setTimeout(() => setIsGameReady(true), 1500);
      } catch (error) {
        console.error("Error initializing:", error);
      }
    };
    if (!initializedRef.current) {
      initialize();
      initializedRef.current = true;
    }
  }, [category]); // Changed from difficulty

  useEffect(() => {
    if (isGameReady && clues.length > 0 && !currentClue) {
      setNextClue();
    }
  }, [isGameReady, clues, currentClue]);

  // Timer
  useEffect(() => {
    if (timer === 0) {
      setGameOver(true);
    } else if (isGameReady) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer, isGameReady]);

  const setNextClue = () => {
    if (remainingIndices.length === 0) {
      setGameOver(true);
      return;
    }
    const idx = Math.floor(Math.random() * remainingIndices.length);
    const newClueIndex = remainingIndices[idx];
    setCurrentClue(clues[newClueIndex]);
    setRemainingIndices((prev) => prev.filter((i) => i !== newClueIndex));
    setInput("");
    setIsCorrect(null);
    setCorrectAnswer("");
  };

  const handleSubmit = async () => {
    if (!input.trim() || !chatRef.current || isCorrect !== null) return;
  
    const formattedPrompt = prompt
      .replace("{clue}", currentClue.clue)
      .replace("{input}", input)
      .replace("{category}", category); // Added category replacement
  
    try {
      const response = await chatRef.current.sendMessage(formattedPrompt);
      const aiReply = await response.response.text().trim();
      const isAnswerCorrect = aiReply === "1";
      setIsCorrect(isAnswerCorrect);
      setCorrectAnswer(currentClue.word);
  
      if (isAnswerCorrect) {
        setScore((prev) => prev + 1);
      }
  
      setTimeout(() => {
        setNextClue();
        setSerialCount((prev) => prev + 1);
      }, 1500);
    } catch (error) {
      console.error("Gemini error:", error);
      setIsCorrect(false);
      setCorrectAnswer(currentClue.word);
    }
  };

  const handleReset = () => {
    setTimer(60);
    setScore(0);
    setGameOver(false);
    setSerialCount(1);
    setInput("");
    setIsCorrect(null);
    setCorrectAnswer("");
    setCurrentClue(null);
    setIsGameReady(false);
    initializedRef.current = false;

    let delay = 0;
    intervalRef.current = setInterval(() => {
      delay += 500;
      if (delay >= 1500) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        const initialize = async () => {
          try {
            const chat = await model.startChat({
              history: [{ role: "user", parts: [{ text: prompt }] }],
            });
            chatRef.current = chat;
            
            const res = await fetch('/data/vocabHit.json');
            const vocabData = await res.json();
            const filteredClues = vocabData.filter((item) => item.category === category); // Changed from difficulty
            setClues(filteredClues);
            setRemainingIndices(filteredClues.map((_, i) => i));
            setIsGameReady(true);
          } catch (error) {
            console.error("Error resetting:", error);
          }
        };
        initialize();
      }
    }, 500);
  };

  if (!isGameReady) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] w-full text-white">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex space-x-4 relative">
            <div className="relative w-7 h-7">
              <div className="absolute inset-0 border-2 border-amber-500 rounded-full animate-[targetPulse_1.5s_infinite]"></div>
              <div className="absolute top-1/2 left-1/2 w-[0.2rem] h-[0.2rem] rounded-full bg-amber-400 transform -translate-x-1/2 -translate-y-1/2 animate-[lockZoom_1s_infinite]"></div>
            </div>
            <div className="relative w-7 h-7">
              <div className="absolute inset-0 border-2 border-amber-500 rounded-full animate-[targetPulse_1.5s_infinite_0.2s]"></div>
              <div className="absolute top-1/2 left-1/2 w-[0.2rem] h-[0.2rem] rounded-full bg-amber-400 transform -translate-x-1/2 -translate-y-1/2 animate-[lockZoom_1s_infinite_0.2s]"></div>
            </div>
            <div className="relative w-7 h-7">
              <div className="absolute inset-0 border-2 border-amber-500 rounded-full animate-[targetPulse_1.5s_infinite_0.4s]"></div>
              <div className="absolute top-1/2 left-1/2 w-[0.2rem] h-[0.2rem] rounded-full bg-amber-400 transform -translate-x-1/2 -translate-y-1/2 animate-[lockZoom_1s_infinite_0.4s]"></div>
            </div>
          </div>
          <p className="text-lg text-gray-300 font-centauri">Targeting...</p>
        </div>
      </div>
    );
  }

  if (gameOver) {
    const roundsCompleted = serialCount - 1;
    const accuracy = roundsCompleted > 0 ? ((score / roundsCompleted) * 100).toFixed(1) : "0.0";

    return (
      <div className="flex flex-col h-[50vh] justify-center items-center w-[80%] md:w-2/5 text-white">
        <h1
          className="text-xl md:text-[22px] xl:text-[24px] font-orbitron text-white tracking-wide mb-6"
          style={{ textShadow: "0 0 8px rgba(249, 115, 22, 0.5)" }}
        >
          Vocab Hit Complete!
        </h1>
        <div className="bg-amber-800 bg-opacity-20 border-2 border-amber-900 rounded-lg p-6 w-[80vw] max-w-96 shadow-lg">
          <p className="text-xl text-gray-300 font-mono">
            <span className="text-amber-400">Score:</span> {score}
          </p>
          <p className="text-xl text-gray-300 font-mono">
            <span className="text-amber-400">Rounds:</span> {roundsCompleted}
          </p>
          <p className="text-xl text-gray-300 font-mono">
            <span className="text-amber-400">Accuracy:</span> {accuracy}%
          </p>
          <p className="text-xl text-gray-300 font-mono">
            <span className="text-amber-400">Category:</span>{" "}
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </p>
        </div>
        <button
          onClick={handleReset}
          className="mt-6 px-8 py-2 bg-amber-700 border-amber-700 border-2 font-sans font-medium text-lg text-white rounded-md hover:bg-amber-600 animate-pulse-slow"
        >
          Hit Again
        </button>
      </div>
    );
  }

  return (
    <>
  <style jsx global>{`
    @keyframes spark {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.5); }
      100% { opacity: 0; transform: scale(1); }
    }
    @keyframes targetPulse {
      0% { transform: scale(0.8); opacity: 0.7; }
      50% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(0.8); opacity: 0.7; }
    }
  `}</style>
  <div className="relative flex flex-col p-5 pt-0 bg-gray-950 bg-opacity-50 border-[2px] border-amber-800 rounded-md w-[90%] md:w-3/4 lg:w-2/3 sm:max-w-[600px] md:max-w-[700px] items-center h-[410px] text-white">
    {/* Timer Bar */}
    <div className="relative w-full bg-gray-800 h-1 mb-4">
      <div
        className="absolute top-0 left-0 h-1 bg-amber-600 rounded"
        style={{ width: `${(timer / 60) * 100}%` }}
      ></div>
    </div>

    {/* Header */}
    <div className="flex justify-between items-center w-full mb-4 px-2">
      <div className="px-4 py-1 bg-gray-800 bg-opacity-50 rounded-md border border-gray-700 text-gray-300 text-lg">
        {serialCount}
      </div>
      <div
        className={`px-4 py-1 rounded-md border text-lg bg-opacity-20 ${
          category === "emotions" // Fixed typo: "emotion" → "emotions"
            ? "border-purple-600 text-purple-400 bg-purple-900"
            : category === "actions" // Fixed typo: "action" → "actions"
            ? "border-teal-600 text-teal-400 bg-teal-900"
            : "border-cyan-600 text-cyan-400 bg-cyan-900"
        }`}
      >
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </div>
      <div className="px-4 py-1 bg-gray-800 bg-opacity-50 rounded-md border border-gray-700 text-gray-300 text-lg">
        ⏳ {timer}s
      </div>
    </div>

    {/* Clue Panel */}
    <div className="relative w-full min-h-[150px] bg-amber-950 bg-opacity-30 border border-amber-800 rounded-md flex flex-col items-center justify-center px-6 mb-6 text-center shadow-inner">
      <motion.h1
        key={serialCount}
        className="text-[18px] md:text-[20px] lg:text-[24px] font-mono font-medium text-amber-300 tracking-wide overflow-hidden break-words leading-relaxed w-full"
      >
        {currentClue?.clue}
      </motion.h1>

      {/* Feedback Inside Panel */}
      {isCorrect !== null && (
        <motion.div
          className="flex flex-col items-center space-y-2 mt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }} // Quick and smooth
        >
          {isCorrect ? (
            <>
              <div
                className="bg-green-900 bg-opacity-80 border-2 border-green-500 rounded-lg px-4 py-2 shadow-[0_0_10px_rgba(34,197,94,0.7)]"
                style={{ textShadow: "0 0 5px rgba(34, 197, 94, 0.9)" }}
              >
                <p className="text-green-300 text-lg md:text-xl font-orbitron font-extrabold tracking-wider">
                  Hit!
                </p>
              </div>
              {[...Array(8)].map((_, i) => ( // Reduced sparks for performance
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-green-500 rounded-full"
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{
                    x: (Math.random() - 0.5) * 200, // Smaller spread
                    y: (Math.random() - 0.5) * 100,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.6, delay: i * 0.03 }} // Faster sparks
                />
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div
                className="bg-red-900 bg-opacity-80 border-2 border-red-500 rounded-lg px-4 py-2 shadow-[0_0_10px_rgba(239,68,68,0.7)]"
                style={{ textShadow: "0 0 5px rgba(239, 68, 68, 0.9)" }}
              >
                <p className="text-red-300 text-lg md:text-xl font-orbitron font-extrabold tracking-wider">
                  Miss!
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>

    {/* Input */}
    <div className="flex flex-col items-center w-full">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
        disabled={isCorrect !== null}
        className="w-full max-w-[400px] p-3.5 md:p-4 text-[16px] md:text-xl bg-gray-800 border border-amber-600 rounded-md text-gray-200 focus:outline-none focus:ring-0 focus:border-amber-500 mb-6"
        placeholder="Type the word..."
      />
      <button
        onClick={handleSubmit}
        disabled={isCorrect !== null}
        className="w-1/3 p-2.5 md:p-3.5 text-xl bg-amber-700 text-white rounded-md hover:bg-amber-600 disabled:bg-amber-900 disabled:cursor-not-allowed transition-all"
      >
        Submit
      </button>
    </div>
  </div>
</>
  );
}