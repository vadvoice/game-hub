### **Real-Time Joke Voting App**  

App that allows users to vote on daily jokes using emojis. Users can fetch random jokes and vote on them using emoji reactions. The app features a React frontend and a Next.js API backend.

---

### **Frontend (React)**  
1. **Display Joke with Votes:**  
   - Show a random joke (question and answer format)
   - Display available emoji reactions with their current vote counts
   - Include a "Next Joke" button to fetch new jokes

2. **Voting Mechanism:**  
   - Clicking on an emoji should cast a vote for the current joke
   - The UI should reflect the updated vote count instantly
   - Each joke maintains its own set of vote counts

3. **User Interface:**  
   - Clean, modern design with gradient background
      - TIP: to speed up your work you can use ready-made component libraries
         - https://daisyui.com/
         - https://tailwindcss.com/
   - [OPTIONAL] Responsive layout that works on all devices

4. **State Management:**  
   - Use React state to manage jokes and votes
      - [OPTIONAL] React Contenxt API
   - Use fetch API for HTTP requests to interact with the backend

---

### **Backend (API)**  
0. **Data Source and Storage:**
   - Fetch random jokes from external API: https://teehee.dev/api/joke
   - Store fetched jokes in database for persistence
      - MongoDB [https://www.mongodb.com/]
   - Database schema:
      - Collection: jokes
      - Document structure: See format defined in section #2 below

1. **API Routes:**  
   - **GET /api/joke:** Fetch a random joke with its vote counts
   - **POST /api/joke:** Submit a vote for the current joke
   
2. **Data Structure:**  
   ```json
   {
     "id": "unique_joke_id",
     "question": "Why did the developer go broke?",
     "answer": "Because he used up all his cache!",
     "votes": [
         {
            "value": 10,
            "label":  "😂"
         },
         {
            "value": 5,
            "label":  "👍"
         },
         {
            "value": 3,
            "label":  "❤️"
         }
     ],
     "availableVotes": ["😂", "👍", "❤️"]
   }
   ```

3. **Features:**
   - Maintain vote counts per joke
   - Support multiple emoji reactions per joke
   - Validate incoming votes

---

### **Expected Outcomes**  
- An entertaining joke-voting experience
- Seamless joke navigation with vote persistence
- Clean and intuitive user interface
- Responsive design that works across devices


### **Demo | Ref
- [The game](https://guess-the-word-ochre.vercel.app/vote-game)