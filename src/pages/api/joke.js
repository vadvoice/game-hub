import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Define valid emoji reactions
const VALID_REACTIONS = ['🔥', '😂', '❤️', '👍', '😡'];

// Helper function to get vote counts for a joke
async function getVoteCounts(jokeId) {
  // TODO: Implement database connection
  // For now, return null to use the default counts
  return null;
}

// Helper function to store a vote
async function storeVote(jokeId, emoji) {
  // TODO: Implement database connection
  // For now, this is a no-op function
  return;
}

export default async function handler(request) {
  if (request.method === 'GET') {
    const response = await fetch('https://teehee.dev/api/joke');
    const data = await response.json();

    // Fetch vote counts for this joke (you'll need to implement this)
    const votesCounts = await getVoteCounts(data.id);

    return NextResponse.json({
      ...data,
      availableVotes: VALID_REACTIONS,
      votes: votesCounts || VALID_REACTIONS.reduce((acc, emoji) => ({
        ...acc,
        [emoji]: 0
      }), {})
    });
  }

  if (request.method === 'POST') {
    try {
      const { jokeId, emoji } = await request.json();

      // Validate emoji
      if (!VALID_REACTIONS.includes(emoji)) {
        return NextResponse.json(
          { error: 'Invalid emoji reaction' },
          { status: 400 }
        );
      }

      // Store the vote (you'll need to implement this)
      await storeVote(jokeId, emoji);

      // Return updated vote counts
      const updatedVotes = await getVoteCounts(jokeId);

      return NextResponse.json({ votes: updatedVotes });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to process vote' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
