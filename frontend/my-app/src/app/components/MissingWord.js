'use client';

import { useState, useEffect } from 'react';

export default function MissingWord({ difficulty }) {
  const [sentences, setSentences] = useState([]); // Store all sentences
  const [remainingIndices, setRemainingIndices] = useState([]); // Track unused sentence indices
  const [randomSentence, setRandomSentence] = useState(null);
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [serialCount, setSerialCount] = useState(1); // For serial count
  const [isDataFetched, setIsDataFetched] = useState(false); // Flag to prevent redundant fetch
  const [isGameReady, setIsGameReady] = useState(false); // Start timer only when loading completes

  // Fetch sentences once when the component mounts
  useEffect(() => {
    const fetchSentences = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sentences/${difficulty}`);
        const data = await response.json();
        if (data.length > 0) {
          setSentences(data); // Store all sentences
          setRemainingIndices(data.map((_, index) => index)); // Initialize remaining indices
          setIsDataFetched(true); // Set the flag to true after data is fetched
          setIsGameReady(true); // Mark game as ready
        }
      } catch (error) {
        console.error('Error fetching sentences:', error);
      }
    };

    if (!isDataFetched) {
      fetchSentences();
    }
  }, [difficulty, isDataFetched]);

  // Floating AI text effect

  // Select a random sentence from the remaining unused indices
  const getRandomSentence = () => {
    if (remainingIndices.length === 0) {
      setGameOver(true);
      return null;
    }
  
    const randomIndex = Math.floor(Math.random() * remainingIndices.length);
    const selectedIndex = remainingIndices[randomIndex];
  
    // Swap selected with last, then pop (O(1) removal)
    setRemainingIndices((prev) => {
      const newIndices = [...prev];
      newIndices[randomIndex] = newIndices[newIndices.length - 1];
      newIndices.pop();
      return newIndices;
    });
  
    return sentences[selectedIndex];
  };  

  // Set the random sentence after fetching the data
  useEffect(() => {
    if (isDataFetched && sentences.length > 0 && !randomSentence) {
      setRandomSentence(getRandomSentence()); // Select the first random sentence after data is fetched
    }
  }, [isDataFetched, sentences, randomSentence]);

  // Handle the timer countdown
  useEffect(() => {
    if (timer === 0) {
      setGameOver(true);
    } else if (isGameReady) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000); // Adjust interval for smoother countdown

      return () => clearInterval(interval); // Clear interval on component unmount
    }
  }, [isGameReady, timer]);

  // Handle option selection
  const handleSelect = (option) => {
    if (gameOver || selected) return; // Prevent multiple clicks

    setSelected(option);
    const correct = option === randomSentence.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setScore(score + 1);
    }

    // Select a new random sentence after feedback
    setTimeout(() => {
      setRandomSentence(getRandomSentence());
      setIsCorrect(null); // Reset correct/incorrect feedback
      setSelected(null); // Deselect the option
      setSerialCount((prev) => prev + 1); // Increment serial count
    }, 600); // Ensure the new sentence is set after feedback
  };

  // Reset the game
  const handleReset = () => {
    setTimer(60);
    setScore(0);
    setGameOver(false);
    setSerialCount(1); // Reset serial count
    setSelected(null);
    setIsCorrect(null);
    setSentences([]); // Clear sentences if game is restarted
    setRandomSentence(null);
    setIsDataFetched(false); // Reset data fetch flag
    setIsGameReady(false); // Reset game ready state
  };

  if (!randomSentence && !gameOver) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] w-full text-white">
        <div className="text-4xl flex flex-col items-center justify-center space-y-4">
          <div className="flex space-x-3">
            <div className="w-4 h-4 bg-cyan-400 rounded-full animate-bounce"></div>
            <div className="w-4 h-4 bg-cyan-500 rounded-full animate-bounce200"></div>
            <div className="w-4 h-4 bg-cyan-600 rounded-full animate-bounce400"></div>
          </div>
        </div>
        <p className="text-lg text-gray-300 font-centauri pt-2">Scanning...</p>
      </div>
    );
  }

  if (gameOver) {
    const roundsCompleted = serialCount;
    const accuracy = roundsCompleted > 0 ? ((score / roundsCompleted) * 100).toFixed(1) : "0.0";
  
    return (
      <div className="flex flex-col h-[50vh] justify-center items-center w-[80%] md:w-2/5 text-white">
        <div className="relative flex flex-col items-center justify-center space-y-6 bg-opacity-10">
          {/* Title */}
          <h1
            className="text-xl md:text-[22px] xl:text-[24px] font-orbitron text-white tracking-wide"
            style={{ textShadow: "0 0 8px rgba(34, 211, 238, 0.5)" }}
          >
            Decoding Done!
          </h1>
  
          {/* Stats Panel */}
          <div
            className="bg-cyan-800 bg-opacity-20 border-2 border-cyan-900 rounded-lg p-6 w-[80vw] max-w-96 shadow-lg"
            style={{ transform: "rotateX(5deg)" }}
          >
            <p className="text-xl text-gray-300 font-mono">
              <span className="text-cyan-400">Final Score:</span> {score}
            </p>
            <p className="text-xl text-gray-300 font-mono">
              <span className="text-cyan-400">Rounds Decoded:</span> {roundsCompleted}
            </p>
            <p className="text-xl text-gray-300 font-mono">
              <span className="text-cyan-400">Accuracy:</span> {accuracy}%
            </p>
            <p className="text-xl text-gray-300 font-mono">
              <span className="text-cyan-400">Difficulty:</span>{" "}
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </p>
          </div>
  
          {/* Button */}
          <button
            onClick={handleReset}
            className="z-10 mt-4 px-8 py-2 bg-cyan-700 border-blue-700 border-2 font-sans font-medium text-lg text-white rounded-md hover:bg-cyan-600 animate-pulse-slow"
          >
            Decode Again
          </button>
  
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col p-5 pt-0 bg-gray-950 bg-opacity-50 border-[2px] border-cyan-800 rounded-md w-[90%] md:w-3/4 lg:w-2/3 sm:max-w-[600px] md:max-w-[700px] items-center h-[425px] text-white ">
      <div className="relative w-full bg-gray-800 h-1 mb-4">
        <div
          className="absolute top-0 left-0 h-1 bg-blue-800 rounded"
          style={{ width: `${(timer / 60) * 100}%` }}
        ></div>
      </div>
      <div className="flex justify-between items-center w-full mb-4 px-2">
        <div className="flex items-center space-x-4">
          <div className="px-4 py-1 bg-gray-800 bg-opacity-50 rounded-md border mr-10 border-gray-700 text-gray-300 text-lg">
            {serialCount}
          </div>
          {/* <div className="px-4 py-1 bg-gray-800 bg-opacity-50 rounded-md border border-gray-700 text-gray-300 text-lg">
            Score: {score}
          </div> */}
        </div>

        <div className={`px-4 py-1 rounded-md border text-lg 
                        ${difficulty === 'easy' ? 'border-green-600 text-green-400 bg-green-900 bg-opacity-20' 
                        : difficulty === 'medium' ? 'border-yellow-600 text-yellow-400 bg-yellow-900 bg-opacity-20' 
                        : 'border-red-600 text-red-400 bg-red-900 bg-opacity-20'}`}>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </div>

        <div className="px-4 py-1 bg-gray-800 bg-opacity-50 rounded-md border border-gray-700 text-gray-300 text-lg">
          ⏳ {timer}s
        </div>
      </div>
      <div className="relative w-full min-h-[150px] bg-cyan-950 bg-opacity-30 border border-cyan-800 rounded-md flex items-center justify-center px-6 mb-6 text-center shadow-inner">
        <h1 key={serialCount} className="text-[18px] md:text-[20px] lg:text-[24px] font-mono font-medium text-cyan-300 tracking-wide overflow-hidden break-words leading-relaxed">
          {randomSentence.sentence.replace('__', '_____').split(' ').map((word, index) => (
            <span 
              key={index} 
              className="typing-word inline-block"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {word}&nbsp;
            </span>
          ))}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 h-[150px]">
        {randomSentence.options.map((option, index) => (
          <button
          key={index}
          onClick={() => handleSelect(option)}
          disabled={selected}
          className={`relative p-4 text-xl border min-w-[160px] sm:min-w-[200px] md:min-w-[240px] lg:min-w-[280px] 
            max-w-[280px] text-gray-200 transition-border-color transition-shadow duration-200 
                      ${selected === option 
                        ? (isCorrect 
                            ? 'border-green-500 shadow-[0_0_6px_1px_rgba(34,197,94,0.4)] bg-wireframe-green'  
                            : 'border-red-600 shadow-[0_0_6px_1px_rgba(239,68,68,0.4)] bg-wireframe-red') 
                        : 'border-gray-600'}  
                      ${!selected && 'hover:border-cyan-600 hover:shadow-[0_0_6px_1px_rgba(59,130,246,0.3)] hover:bg-wireframe'}  
                      focus:outline-none focus:ring-0 focus:border-transparent
                      active:border-cyan-600 active:shadow-[0_0_6px_2px_rgba(59,130,246,0.3)]`} // Add active state styles
          aria-label={`Option ${index + 1}: ${option}`}
        >
          {option}
        </button>
        ))}
      </div>
    </div>
  );
};

