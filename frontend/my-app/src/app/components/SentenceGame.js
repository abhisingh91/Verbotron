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
  const [usedSentences, setUsedSentences] = useState([]); // Track used sentences
  const [isDataFetched, setIsDataFetched] = useState(false); // Flag to prevent redundant fetch

  // Fetch sentences once when the component mounts
  useEffect(() => {
    const fetchSentences = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/sentences/${difficulty}`);
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

  // Select a random sentence from the remaining unused ones
  const getRandomSentence = (data) => {
    const remainingSentences = data.filter(sentence => !usedSentences.includes(sentence.sentence));
    
    if (remainingSentences.length === 0) {
      setGameOver(true); // No more unique sentences left
      return null;
    }

    return remainingSentences[Math.floor(Math.random() * remainingSentences.length)];
  };

  // Set the random sentence after fetching the data
  useEffect(() => {
    if (isDataFetched && sentences.length > 0 && !randomSentence) {
      setRandomSentence(getRandomSentence(sentences)); // Select the first random sentence after data is fetched
    }
  }, [isDataFetched, sentences, randomSentence]);

  // Handle the timer countdown
  useEffect(() => {
    if (timer === 0) {
      setGameOver(true);
    } else {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer]);

  // Handle option selection
  const handleSelect = (option) => {
    if (gameOver) return;

    setSelected(option);
    const correct = option === randomSentence.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setScore(score + 1);
    }

    // Mark the sentence as used
    setUsedSentences((prev) => [...prev, randomSentence.sentence]);

    // Select a new random sentence
    setTimeout(() => {
      setRandomSentence(getRandomSentence(sentences));
      setIsCorrect(null); // Reset correct/incorrect feedback
      setSelected(null); // Deselect the option
    }, 1000); // Ensure the new sentence is set after feedback
  };

  // Reset the game
  const handleReset = () => {
    setTimer(60);
    setScore(0);
    setGameOver(false);
    setUsedSentences([]); // Reset used sentences when the game restarts
    setSelected(null);
    setIsCorrect(null);
    setSentences([]); // Clear sentences if game is restarted
    setRandomSentence(null);
    setIsDataFetched(false); // Reset data fetch flag
  };

  if (!randomSentence) {
    return (
      <div className="flex justify-center items-center w-full bg-gray-800 text-white">
        <p className="text-2xl">Loading...</p>
      </div>
    );
  }
  // Render nothing if there's no random sentence or game is over
  if (gameOver) {
    return (
      <div className="flex flex-col justify-center items-center w-full text-2xl">
        <div className="flex flex-col items-center justify-start">
          <p className="mx-5 text-red-500">Game Over!</p>
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
        <p>Score: {score}</p>
      </div>

      <h1 className="text-3xl font-semibold mb-6 w-full text-center">{randomSentence.sentence.replace('__', '_____')}</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {randomSentence.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(option)}
            className={`p-4 text-xl bg-blue-500 text-white rounded-md ${selected === option ? (isCorrect ? 'bg-green-500' : 'bg-red-500') : ''}`}
          >
            {option}
          </button>
        ))}
      </div>
      <p className="text-xl font-medium mb-4">Hint: {randomSentence.hint}</p>
      {isCorrect !== null && (
        <p className={`mt-2 text-2xl ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
          {isCorrect ? 'Correct!' : 'Incorrect!!'}
        </p>
      )}
    </div>
  );
};

export default SentenceGame;
