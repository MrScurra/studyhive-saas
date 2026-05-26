const searchService = require('../services/searchService')
const firestoreService = require('../services/firestoreService')

function getSearchQuery(req) {
  return String(req.query.q || '').trim()
}

function sendSearchResponse(res, key, query, results) {
  return res.json({
    query,
    [key]: results
  })
}

function sendDegradedSearchResponse(res, key, query) {
  return res.json({
    query,
    [key]: [],
    degraded: true,
    warning: 'Firestore quota exceeded; search results are temporarily unavailable.'
  })
}

async function searchPosts(req, res, next) {
  try {
    const query = getSearchQuery(req)
    const posts = await searchService.searchPosts(query)
    return sendSearchResponse(res, 'posts', query, posts)
  } catch (error) {
    if (firestoreService.isQuotaError(error)) {
      return sendDegradedSearchResponse(res, 'posts', getSearchQuery(req))
    }

    return next(error)
  }
}

async function searchUsers(req, res, next) {
  try {
    const query = getSearchQuery(req)
    const users = await searchService.searchUsers(query)
    return sendSearchResponse(res, 'users', query, users)
  } catch (error) {
    if (firestoreService.isQuotaError(error)) {
      return sendDegradedSearchResponse(res, 'users', getSearchQuery(req))
    }

    return next(error)
  }
}

async function searchCircles(req, res, next) {
  try {
    const query = getSearchQuery(req)
    const circles = await searchService.searchCircles(query)
    return sendSearchResponse(res, 'circles', query, circles)
  } catch (error) {
    if (firestoreService.isQuotaError(error)) {
      return sendDegradedSearchResponse(res, 'circles', getSearchQuery(req))
    }

    return next(error)
  }
}

async function searchAll(req, res, next) {
  try {
    const query = getSearchQuery(req)
    const results = await searchService.searchAll(query)
    return res.json(results)
  } catch (error) {
    if (firestoreService.isQuotaError(error)) {
      return res.json({
        query: getSearchQuery(req),
        posts: [],
        users: [],
        circles: [],
        degraded: true,
        warning: 'Firestore quota exceeded; search results are temporarily unavailable.'
      })
    }

    return next(error)
  }
}

module.exports = {
  searchPosts,
  searchUsers,
  searchCircles,
  searchAll
}
