// TODO: use a real db
const mockGame = {
  name: "animals",
  guessed: 1,
  current: 1,
  list: [
    { word: "elephant", id: 1, hint: "good memory" },
    { word: "giraffe", id: 2, hint: "long neck" },
    { word: "lion", id: 3, hint: "king of the jungle" },
  ],
};

export default function handler(req, res) {
  if (req.method === "GET") {
    res.status(200).json(mockGame);
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
