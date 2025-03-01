'use client';
import { useState, useEffect } from 'react';
import Title from './Title';

const GuessWord = () => {
  const [game, setGame] = useState(null);
  const [guess, setGuess] = useState('');
  const [message, setMessage] = useState('');
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    fetch('/api/game')
      .then(res => res.json())
      .then(data => {
        setGame(data)
      });
  }, []);

  // Get current word from game state
  const currentWord = game?.list[game.current - 1]?.word || '';

  // Create hidden version of word with underscores
  const hiddenWord = currentWord.split('').map((letter, index) =>
    index === 0 ? letter : '_' // Show first letter as hint
  ).join(' ');

  const hint = game?.list[game.current - 1]?.hint || '';
  const handleGuess = (e) => {
    e.preventDefault();
    if (guess.toLowerCase() === currentWord.toLowerCase()) {
      setMessage('Correct! Moving to next word...');
      setGame(prev => ({
        ...prev,
        current: prev.current + 1
      }));
      setGuess('');
    } else {
      setMessage('Try again!');
    }
  };

  return (
    <div className="w-full h-full border-none block">
      {game && (
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-mono"><Title text={`The game is: ${game.name}`} /></h1>
          <p className="text-sm text-gray-600">Topic: {game.list[game.current - 1]?.topic}</p>
          <div className="text-center">
            <p className="text-2xl font-mono">{hiddenWord}</p>
            <p className="text-sm mt-4">Hint: {showHint ? <Title text={hint} /> : <button className="text-blue-500 hover:text-blue-600" onClick={() => setShowHint(true)}>Show Hint</button>}</p>
          </div>
          <form onSubmit={handleGuess} className="flex gap-2">
            <input
              type="text"
              required
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              className="border p-2 rounded"
              placeholder="Type your guess"
            />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
              Guess
            </button>
          </form>
          {message && <p className="text-sm">{message}</p>}
        </div>
      )}
    </div>
  );
};

export default GuessWord;