'use client';

import { useState, useEffect } from 'react';
import Title from './Title';
import Spinner from './Spinner';

const VoteGame = () => {
  const [joke, setJoke] = useState(null);
  const [, setVotes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);

  const fetchJoke = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/joke');
      const data = await response.json();
      setJoke(data);
      setVotes(data.votes || {});
    } catch (error) {
      console.error('Failed to fetch joke:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (emoji) => {
    try {
      const response = await fetch('/api/joke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jokeId: joke.id,
          emoji,
        }),
      });
      const data = await response.json();
      setVotes(data.votes);
    } catch (error) {
      console.error('Failed to submit vote:', error);
    }
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  useEffect(() => {
    fetchJoke();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <Spinner />
    </div>;
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 h-screen">
      <h1 className="text-2xl font-bold mb-8 text-white">Vote for the best joke of the day!</h1>

      {joke && (
        <div className="flex flex-col items-center justify-center gap-4 max-w-md w-full">
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-lg w-full border border-white/20">
            <p className="text-lg font-medium mb-4">{joke.question}</p>
            {showAnswer && <Title text={joke.answer} />}
            <button onClick={toggleAnswer} className="text-sm text-blue-500 hover:text-blue-600">
              {showAnswer ? 'Hide Answer' : 'Show Answer'}
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {joke.availableVotes.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleVote(emoji)}
                className="flex flex-col items-center p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-sm mt-1 text-white">{joke.votes[emoji] || 0}</span>
              </button>
            ))}
          </div>

          <button
            onClick={fetchJoke}
            className="mt-8 px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all transform hover:scale-105 backdrop-blur-sm border border-white/20"
          >
            Next Joke
          </button>
        </div>
      )}
    </div>
  );
};

export default VoteGame;