### **"Guess the Word" Game**

A word guessing game where players try to guess predefined words with hints. The app features a React frontend and a Next.js API backend.

---

### **Frontend (React)**
1. **Game Display:**
   - Show the current word as hidden characters (e.g., "_ _ _ _ _")
   - Display hint for the current word
   - Show game progress (current word number / total words)
   - Include a hint system showing the first letter

2. **Guessing Mechanism:**
   - Input field for players to type their guesses
   - Submit button to validate guesses
   - Instant feedback on correct/incorrect guesses
   - Automatic progression to next word on correct guess

3. **User Interface:**
   - Clean, modern design with gradient background
      - TIP: to speed up your work you can use ready-made component libraries
         - https://daisyui.com/
         - https://tailwindcss.com/
   - [OPTIONAL] Responsive layout that works on all devices

4. **State Management:**
   - Use React state to manage game progress and guesses
      - [OPTIONAL] React Context API
   - Use fetch API for HTTP requests to interact with the backend

---

### **Backend (API)**
1. **Data Storage:**
   - Store word lists in MongoDB database
   - Each game maintains its own word list and progress
   - Database schema: See format defined in section #3 below

2. **API Routes:**
   - **POST /api/game:** Create a new game with word list
   - **GET /api/game/:id:** Fetch current game state
   - **POST /api/guess:** Submit and validate a guess

3. **Data Structure:**
   ```json
   {
     "gameId": "unique_game_id",
     "name": "Animals",
     "list": [
       {
         "word": "elephant",
         "hint": "Large gray mammal"
       },
       {
         "word": "giraffe",
         "hint": "Long-necked African animal"
       }
     ],
     "current": 1,
     "completed": []
   }
   ```

4. **Features:**
   - Track game progress
   - Validate guesses
   - Store multiple word lists
   - Provide hints system

---

### **Expected Outcomes**
- An engaging word guessing experience
- Smooth progression through word list
- Clean and intuitive user interface
- Responsive design that works across devices