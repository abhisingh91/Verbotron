"use client";
import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prompt = `
You are an AI that checks if a word matches a given criteria.  
- The word must be a **valid synonym or antonym** of the provided word, based on the specified type (synonym or antonym).
- It must accurately reflect one of its **standard dictionary meanings**.
- Reply **"1"** if the word meets the criteria, **"0"** if it fails.
`;

export default function WordVerse({ difficulty, gameType }) {
  const [currentWord, setCurrentWord] = useState("");
  const [displayedWord, setDisplayedWord] = useState("");
  const [type, setType] = useState(""); // "Synonym" or "Antonym"
  const [input, setInput] = useState("");
  const [options, setOptions] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serial, setSerial] = useState(1); // Starts at 1
  const [timer, setTimer] = useState(60);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isGameReady, setIsGameReady] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [words, setWords] = useState(null);
  const [remainingIndices, setRemainingIndices] = useState([]);
  const intervalRef = useRef(null);
  const chatRef = useRef(null);
  const initializedRef = useRef(false); // Prevents double init

  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  useEffect(() => {
    (async () => {
      try {
        const chat = await model.startChat({
          history: [{ role: "user", parts: [{ text: prompt }] }],
        });
        chatRef.current = chat;

        const testResponse = await chat.sendMessage(`Word: "happy" | Type: "Synonym" | Input: "joyful"`);
        const testReply = await testResponse.response.text().trim();
        if (testReply !== "1" && testReply !== "0") {
          console.error("Model test failed:", testReply);
          return;
        }

        const res = await fetch("/data/wordVerse.json");
        const fetchedWords = await res.json();
        setWords(fetchedWords[difficulty]);
        setRemainingIndices(fetchedWords[difficulty].map((_, i) => i));
        setIsGameReady(true);
      } catch (error) {
        console.error("Error initializing chat or fetching words:", error);
      }
    })();
  }, [difficulty]);

  useEffect(() => {
    if (words && isGameReady && !initializedRef.current) {
      setNextWord();
      initializedRef.current = true;
    }
  }, [isGameReady, words]);

  useEffect(() => {
    if (timer === 0) {
      setGameOver(true);
    } else if (isGameReady) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isGameReady, timer]);

  const setNextWord = () => {
    if (remainingIndices.length === 0) {
      setGameOver(true);
      return;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    const randomIndex = Math.floor(Math.random() * remainingIndices.length);
    const selectedIndex = remainingIndices[randomIndex];
    const newWordData = words[selectedIndex];
    const isSynonym = Math.random() < 0.5;
    setCurrentWord(newWordData.word);
    setType(isSynonym ? "Synonym" : "Antonym");
    setOptions(isSynonym ? newWordData.synonyms : newWordData.antonyms);
    setCorrectAnswer(isSynonym ? newWordData.synonymCorrect : newWordData.antonymCorrect);
    setRemainingIndices((prev) => {
      const newIndices = [...prev];
      newIndices[randomIndex] = newIndices[newIndices.length - 1];
      newIndices.pop();
      return newIndices;
    });
    setInput("");
    setResult(null);
    setDisplayedWord("");
    let index = 0;
    intervalRef.current = setInterval(() => {
      if (index < newWordData.word.length) {
        setDisplayedWord(newWordData.word.slice(0, index + 1));
        index++;
      } else {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setButtonDisabled(false);
      }
    }, 50);
  };

  const handleSubmit = async () => {
    if (!input.trim() || !chatRef.current || loading) return;
    setLoading(true);
    setButtonDisabled(true);

    try {
      const response = await chatRef.current.sendMessage(
        `Word: "${currentWord}" | Type: "${type}" | Input: "${input}"`
      );
      const aiReply = await response.response.text().trim();
      const isCorrect = aiReply === "1";
      setResult(isCorrect ? "correct" : "incorrect");
      if (isCorrect) setScore((prev) => prev + 1);
    } catch (error) {
      console.error("Error checking word:", error);
      setResult("error");
    }

    setLoading(false);
    setTimeout(() => {
      setSerial((prev) => prev + 1); // Increment here
      setNextWord();
    }, 600);
  };

  const handleOptionClick = (option) => {
    if (loading || result) return;
    setLoading(true);
    setInput(option);
    const isCorrect = option === correctAnswer;
    setResult(isCorrect ? "correct" : "incorrect");
    if (isCorrect) setScore((prev) => prev + 1);
    setLoading(false);
    setTimeout(() => {
      setSerial((prev) => prev + 1); // Increment here
      setNextWord();
    }, 600);
  };

  const handleReset = () => {
    setTimer(60);
    setSerial(1);
    setScore(0);
    setGameOver(false);
    setInput("");
    setResult(null);
    setCurrentWord("");
    setDisplayedWord("");
    setIsGameReady(false);
    setButtonDisabled(false);
    setWords(null);
    setRemainingIndices([]);
    initializedRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
    let delay = 0;
    intervalRef.current = setInterval(() => {
      delay += 500;
      if (delay >= 1500) { // 1.5s delay for loading animation
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        (async () => {
          try {
            const chat = await model.startChat({
              history: [{ role: "user", parts: [{ text: prompt }] }],
            });
            chatRef.current = chat;
            const res = await fetch("/data/wordVerse.json");
            const fetchedWords = await res.json();
            setWords(fetchedWords[difficulty]);
            setRemainingIndices(fetchedWords[difficulty].map((_, i) => i));
            setIsGameReady(true);
          } catch (error) {
            console.error("Error resetting chat or fetching words:", error);
          }
        })();
      }
    }, 500);
  };

  if (!isGameReady) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] w-full text-white">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex space-x-4">
            <div className="w-4 h-4 bg-green-400 clip-glyph animate-glyph-spin"></div>
            <div className="w-4 h-4 bg-green-500 clip-glyph animate-glyph-spin delay-200"></div>
            <div className="w-4 h-4 bg-green-600 clip-glyph animate-glyph-spin delay-400"></div>
          </div>
          <p className="text-lg text-gray-300 font-centauri">Warping...</p>
        </div>
      </div>
    );
  }

  if (gameOver) {
    const sentencesCompleted = serial - 1; // Adjusted for display
    const accuracy = sentencesCompleted > 0 ? ((score / sentencesCompleted) * 100).toFixed(1) : "0.0";

    return (
      <div className="flex flex-col h-[50vh] justify-center items-center w-[80%] md:w-2/5 text-white
      opacity-0 scale-90 animate-[fadeZoom_0.5s_ease-out_forwards]">
        <div className="relative flex flex-col items-center justify-center space-y-4 bg-opacity-10">
          {/* Title */}
          <h1
            className="text-xl md:text-[22px] xl:text-[24px] font-orbitron text-white tracking-wide"
            style={{ textShadow: "0 0 8px rgba(34, 197, 94, 0.5)" }}
          >
            Verse Warped!
          </h1>

          {/* Stats Panel */}
          <div
            className="bg-green-800 bg-opacity-20 border-2 border-green-900 rounded-lg p-6 w-[80vw] max-w-96 shadow-lg"
            style={{ transform: "rotateX(5deg)" }}
          >
            <p className="text-xl text-gray-300 font-mono">
              <span className="text-green-400">Final Score:</span> {score}
            </p>
            <p className="text-xl text-gray-300 font-mono">
              <span className="text-green-400">Rounds Warped:</span> {sentencesCompleted}
            </p>
            <p className="text-xl text-gray-300 font-mono">
              <span className="text-green-400">Accuracy:</span> {accuracy}%
            </p>
            <p className="text-xl text-gray-300 font-mono">
              <span className="text-green-400">Difficulty:</span>{" "}
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </p>
            <p className="text-xl text-gray-300 font-mono">
              <span className="text-green-400">Style:</span>{" "}
              {gameType.charAt(0).toUpperCase() + gameType.slice(1)}
            </p>
          </div>

          {/* Button */}
          <button
            onClick={handleReset}
            className="z-10 mt-4 px-8 py-2 bg-green-700 border-2 border-green-400 font-sans font-medium text-lg text-white rounded-md hover:bg-green-600 animate-pulse-slow"
          >
            Warp Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        /* Touch devices: Disable hover, apply active */
        @media (hover: none) {
          .option-btn:hover {
            border-color: #4b5563; /* border-gray-600 */
            box-shadow: none;
            background: none;
          }
          .option-btn:active {
            border-color: #0891b2; /* active:border-cyan-600 */
            box-shadow: 0 0 6px 2px rgba(59, 130, 246, 0.3); /* active:shadow */
          }
          .option-btn:focus {
            outline: none;
            border-color: #4b5563; /* border-gray-600 */
            box-shadow: none;
          }
        }
      `}</style>
      <div className="relative flex flex-col p-5 pt-0 bg-gray-950 bg-opacity-50 border-[2px] border-green-800 rounded-md w-[90%] md:w-3/4 lg:w-2/3 sm:max-w-[600px] md:max-w-[700px] items-center h-[410px] text-white">
        <div className="relative w-full bg-gray-800 h-1 mb-4">
          <div
            className="absolute top-0 left-0 h-1 bg-green-500 rounded"
            style={{ width: `${(timer / 60) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center w-full mb-4 px-2">
          <div className="px-4 py-1 bg-gray-800 bg-opacity-50 rounded-md border mr-10 border-gray-700 text-gray-300 text-lg">
            {serial}
          </div>
          <div
            className={`px-4 py-1 rounded-md border text-lg ${
              difficulty === "easy"
                ? "border-green-600 text-green-400 bg-green-900 bg-opacity-20"
                : difficulty === "medium"
                ? "border-yellow-600 text-yellow-400 bg-yellow-900 bg-opacity-20"
                : "border-red-600 text-red-400 bg-red-900 bg-opacity-20"
            }`}
          >
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </div>
          <div className="px-4 py-1 bg-gray-800 bg-opacity-50 rounded-md border border-gray-700 text-gray-300 text-lg">
            ⏳ {timer}s
          </div>
        </div>
        <div className="relative w-full min-h-[150px] bg-green-900 bg-opacity-30 border border-green-800 rounded-md flex items-center justify-center px-6 mb-6 text-center shadow-inner">
          <h1 className="text-[20px] md:text-[26px] font-mono font-medium text-green-300 tracking-wide">
            {displayedWord.split("").map((char, index) => (
              <span
                key={`${currentWord}-${char}-${index}`}
                className="inline-block typing-word"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {char}
              </span>
            ))}
          </h1>
          <div className="absolute top-2 text-green-200 text-sm md:text-lg font-mono">
            [{type}]
          </div>
        </div>
        {gameType === "input" ? (
          <>
            <input
              type="text"
              placeholder={`Enter a ${type.toLowerCase()}`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full p-3.5 md:p-4 text-[16px] md:text-xl border border-gray-600 bg-gray-800 text-gray-200 rounded-sm md:rounded-md mb-6 focus:outline-none focus:border-green-600 focus:shadow-[0_0_6px_1px_rgba(72,187,120,0.3)]"
            />
            {result || loading ? (
              <button
                onClick={handleSubmit}
                disabled={buttonDisabled}
                className={`w-2/5 p-2.5 md:p-3.5 text-xl border rounded-lg flex items-center justify-center ${
                  loading
                    ? "bg-gray-700 bg-opacity-50 border-green-900"
                    : result === "correct"
                    ? "approved-bg"
                    : result === "incorrect"
                    ? "rejected-bg"
                    : "bg-green-800 border-yellow-900 text-white hover:border-green-500 hover:shadow-[0_0_6px_1px_rgba(236,72,153,0.3)]"
                }`}
              >
                {loading
                  ? "Checking..."
                  : result === "correct"
                  ? "Correct"
                  : result === "incorrect"
                  ? "Incorrect"
                  : "Submit"}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={buttonDisabled}
                className="w-1/3 p-2.5 md:p-3.5 text-xl border border-yellow-900 bg-green-800 text-white rounded-lg hover:border-green-500 hover:shadow-[0_0_6px_1px_rgba(236,72,153,0.3)] transition-border-color transition-shadow duration-250"
              >
                Submit
              </button>
            )}
          </>
        ) : (
          <div className="grid grid-cols-2 gap-4 h-[150px]">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleOptionClick(option);
                }}
                disabled={loading || result}
                className={`option-btn p-2.5 md:p-3.5 lg:p-4 text-[16px] md:text-lg border min-w-[140px] sm:min-w-[200px] md:min-w-[240px] lg:min-w-[280px] 
                max-w-[280px] text-gray-200 ${
                  result && option === input
                    ? result === "correct"
                      ? "border-green-500 shadow-[0_0_6px_1px_rgba(34,197,94,0.4)] bg-wireframe-green"
                      : "border-red-600 shadow-[0_0_6px_1px_rgba(239,68,68,0.4)] bg-wireframe-red"
                    : "border-gray-600"
                } ${!result && "hover:border-green-600 hover:shadow-[0_0_6px_1px_rgba(72,187,120,0.3)] hover:bg-wireframe-verse"}`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}