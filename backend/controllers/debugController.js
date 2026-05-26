const interactions = require('../data/interactionsStore')

function getInteractions(req, res) {
  res.json({
    upvotesCount: Object.keys(interactions.upvotes).length,
    bookmarksCount: Object.keys(interactions.bookmarks).length,
    commentsCount: Object.keys(interactions.comments).length,
    interactions
  })
}

module.exports = {
  getInteractions
}
