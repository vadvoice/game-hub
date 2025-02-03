### **"Guess the Word" Game **  

This project will allow users to create a guessing game by setting a list of words. Once the game starts, players will try to guess the words, receiving hints along the way. The app will have a React frontend, a Node.js backend, and a MongoDB database. WebSockets will be used for real-time gameplay.  

---

### **Frontend (React)**  

1. **Game Setup (Before Starting the Game)**  
   - A user can create a new game by entering a list of words (e.g., ["apple", "banana", "grape"]).  
   - A "Start Game" button should begin the game.  

2. **Gameplay**  
   - The first word from the list is displayed as a hidden word (e.g., "_ _ _ _ _").  
   - Players type their guesses into an input field.  
   - If the guessed word matches, move to the next word.  
   - Provide hints (e.g., first letter, number of letters).  

3. **State Management**  
   - Use React state or Context API to manage game progress.  
   - Use Axios or fetch for HTTP requests.  

---

### **Backend (Node.js + Express + MongoDB + Socket.io)**  

1. **API Routes**  
   - **POST /game:** Create a new game with a list of words.  
   - **GET /game/:id:** Fetch the current game state (current word, guessed words, etc.).  
   - **POST /guess:** Validate a user's guess and update the game state if correct.  

2. **Database (MongoDB Schema Example)**  
   ```json
   {
     "gameId": "123abc",
     "words": ["apple", "banana", "grape"],
     "currentWordIndex": 0,
     "guessedWords": []
   }
   ```

3. **WebSocket Integration(optional)**  
   - When a player makes a correct guess, broadcast the new word to all users.  

---

### **Expected Outcomes**  
- A simple but fun word guessing game.
- Demonstrates the use of simple Node.js/Express server and MongoDB.
- Optional WebSockets usage