// TODO: use a real db
const mockGame = {
  name: "general",
  guessed: 1,
  current: 1,
  list: [
    { word: "elephant", id: 1, hint: "good memory", topic: "animals" },
    { word: "giraffe", id: 2, hint: "long neck", topic: "animals" },
    { word: "lion", id: 3, hint: "king of the jungle", topic: "animals" },
    { word: "pizza", id: 4, hint: "Italian circular dish", topic: "food" },
    { word: "sushi", id: 5, hint: "Japanese rice rolls", topic: "food" },
    { word: "pasta", id: 6, hint: "Italian noodles", topic: "food" },
    { word: "paris", id: 7, hint: "city of love", topic: "cities" },
    { word: "tokyo", id: 8, hint: "Japan's capital", topic: "cities" },
    { word: "london", id: 9, hint: "Big Ben's home", topic: "cities" },
    { word: "guitar", id: 10, hint: "six strings", topic: "music" },
    { word: "piano", id: 11, hint: "88 keys", topic: "music" },
    { word: "drums", id: 12, hint: "percussion instrument", topic: "music" },
    { word: "soccer", id: 13, hint: "popular ball sport", topic: "sports" },
    { word: "tennis", id: 14, hint: "racket sport", topic: "sports" },
    { word: "swimming", id: 15, hint: "water sport", topic: "sports" }
  ],
};

export default function handler(req, res) {
  if (req.method === "GET") {
    const shuffledList = mockGame.list.sort(() => Math.random() - 0.5);
    const game = { ...mockGame, list: shuffledList };
    res.status(200).json(game);
  } else if (req.method === "POST") {
    const { gameId, guessed, current, list } = req.body;
    const game = { gameId, guessed, current, list };
    // TODO: store game in db
    res.status(201).json({ message: "Saved game progress", game });
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
