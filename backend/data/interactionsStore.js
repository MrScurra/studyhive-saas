// Temporary in-memory storage.
// This resets whenever the server restarts. Replace with a database later.
const interactions = {
  upvotes: {},
  baseUpvoteCounts: {},
  bookmarks: {},
  comments: {}
}

module.exports = interactions
