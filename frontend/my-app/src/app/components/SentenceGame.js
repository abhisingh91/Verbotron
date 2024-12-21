'use client';

import { useState, useEffect } from 'react';

const SentenceGame = ({ difficulty }) => {
  const [sentences, setSentences] = useState([]); // Store all sentences
  const [randomSentence, setRandomSentence] = useState(null);
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [usedIndices, setUsedIndices] = useState([]); // Track used indices of sentences
  const [serialCount, setSerialCount] = useState(1); // For serial count
  const [isDataFetched, setIsDataFetched] = useState(false); // Flag to prevent redundant fetch

  // Fetch sentences once when the component mounts
  useEffect(() => {
    const fetchSentences = async () => {
      try {
        console.log(process.env.API_URL);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sentences/${difficulty}`);
        const data = await response.json();

        if (data.length > 0) {
          setSentences(data); // Store all sentences in state
          setIsDataFetched(true); // Set the flag to true after data is fetched
        }
      } catch (error) {
        console.error('Error fetching sentences:', error);
      }
    };

    if (!isDataFetched) {
      fetchSentences();
    }
  }, [difficulty, isDataFetched]);

  // Select a random sentence from the remaining unused ones based on index
  const getRandomSentence = () => {
    const remainingIndices = sentences
      .map((_, index) => index)
      .filter((index) => !usedIndices.includes(index));

    if (remainingIndices.length === 0) {
      setGameOver(true); // No more unique sentences left
      return null;
    }

    const randomIndex = remainingIndices[Math.floor(Math.random() * remainingIndices.length)];
    setUsedIndices((prev) => [...prev, randomIndex]); // Mark this index as used
    return sentences[randomIndex];
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
    } else {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 800);

      return () => clearInterval(interval);
    }
  }, [timer]);

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
    }, 800); // Ensure the new sentence is set after feedback
  };

  // Reset the game
  const handleReset = () => {
    setTimer(60);
    setScore(0);
    setGameOver(false);
    setUsedIndices([]); // Reset used sentences when the game restarts
    setSerialCount(1); // Reset serial count
    setSelected(null);
    setIsCorrect(null);
    setSentences([]); // Clear sentences if game is restarted
    setRandomSentence(null);
    setIsDataFetched(false); // Reset data fetch flag
  };

  if (!randomSentence && !gameOver) {
    return (
      <div className="flex h-1/2 justify-center items-center w-full bg-gray-800 text-white">
        <p className="text-2xl">Loading...</p>
      </div>
    );
  }

  // Render nothing if there's no random sentence or game is over
  if (gameOver) {
    return (
      <div className="flex flex-col h-1/2 justify-center items-center w-full text-2xl">
        <div className="flex flex-col items-center justify-start">
          <p className="mx-5 mb-2 text-cyan-500 text-3xl">Game Over!</p>
          <p className="mx-5 text-white">Your final score is: {score}</p>
        </div>
        <button onClick={handleReset} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-md">
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-start w-1/2 items-center h-screen bg-gray-800 text-white">
      <div className="flex justify-between w-full text-2xl mb-6 px-10">
        <p>Time Left: {timer}s</p>
        <p className={`text-xl ${difficulty === 'easy' ? 'text-green-500' : difficulty === 'medium' ? 'text-yellow-500' : 'text-red-500'}`}>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </p>
        <p>Score: {score}</p>
      </div>

      <h1 className="text-3xl font-semibold mb-6 w-full text-center">
        {serialCount}. {randomSentence.sentence.replace('__', '_____')}
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {randomSentence.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(option)}
            disabled={selected} // Disable buttons after one is selected
            className={`p-4 text-xl bg-blue-500 text-white rounded-md ${selected === option ? (isCorrect ? 'bg-green-500' : 'bg-red-500') : ''}`}
          >
            {option}
          </button>
        ))}
      </div>
      <p className="text-xl font-medium mb-4 w-full text-center"><i>Hint: {randomSentence.hint}</i></p>
      {isCorrect !== null && (
        <p className={`mt-1 text-2xl ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
          {isCorrect ? 'Correct!' : 'Incorrect!!'}
        </p>
      )}
    </div>
  );
};

export default SentenceGame;
