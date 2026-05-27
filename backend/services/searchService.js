const firestoreService = require('./firestoreService')
const defaultStudyCircles = require('../data/studyCirclesStore')

const DEFAULT_LIMIT = 6
const FALLBACK_LIMIT = 24
let defaultCirclesSeedChecked = false

function normalizeSearchText(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeSearchText).join(' ')
  }

  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9@._\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getSearchTokens(query) {
  return normalizeSearchText(query).split(' ').filter(Boolean)
}

function getFieldValue(data, field) {
  return field.split('.').reduce((value, key) => value?.[key], data)
}

function getSearchHaystack(data, fields) {
  return normalizeSearchText(fields.map((field) => getFieldValue(data, field)).filter(Boolean))
}

function matchesQuery(data, fields, tokens) {
  if (tokens.length === 0) return false

  const haystack = getSearchHaystack(data, fields)
  return tokens.every((token) => haystack.includes(token))
}

function getRank(data, fields, query, tokens) {
  const normalizedQuery = normalizeSearchText(query)
  const haystack = getSearchHaystack(data, fields)
  let score = 0

  if (haystack.startsWith(normalizedQuery)) score += 30
  if (haystack.includes(normalizedQuery)) score += 12

  tokens.forEach((token) => {
    if (haystack.split(' ').some((word) => word.startsWith(token))) score += 6
    if (haystack.includes(token)) score += 2
  })

  return score
}

function extractIndexLink(error) {
  const message = error?.message || ''
  const match = message.match(/https:\/\/console\.firebase\.google\.com\/[^\s]+/)
  return match?.[0] || ''
}

function logIndexHint(label, error) {
  const link = extractIndexLink(error)

  if (link) {
    console.warn(`Firestore search index needed for ${label}: ${link}`)
    return
  }

  if (error?.code === 9 || /index/i.test(error?.message || '')) {
    console.warn(`Firestore search index needed for ${label}:`, error.message)
  }
}

async function addQueryResults(records, label, query) {
  try {
    const snapshot = await query.get()
    snapshot.forEach((doc) => {
      if (!records.has(doc.id)) {
        records.set(doc.id, { id: doc.id, data: doc.data() })
      }
    })
  } catch (error) {
    logIndexHint(label, error)
  }
}

async function searchCollection(config, queryText, limit = DEFAULT_LIMIT) {
  const query = String(queryText || '').trim()
  const tokens = getSearchTokens(query)

  if (!query || query.length < 2 || tokens.length === 0) {
    return []
  }

  const firestore = firestoreService.getFirestore()
  const collection = firestore.collection(config.collection)
  const records = new Map()

  if (config.keywordField && tokens[0]) {
    await addQueryResults(
      records,
      `${config.collection}.${config.keywordField}`,
      collection.where(config.keywordField, 'array-contains', tokens[0]).limit(FALLBACK_LIMIT)
    )
  }

  for (const field of config.prefixFields || []) {
    const fieldQuery = field.normalized ? normalizeSearchText(query) : query
    if (!fieldQuery) continue

    await addQueryResults(
      records,
      `${config.collection}.${field.name}`,
      collection.orderBy(field.name).startAt(fieldQuery).endAt(`${fieldQuery}\uf8ff`).limit(FALLBACK_LIMIT)
    )
  }

  if (records.size < limit * 2) {
    await addQueryResults(
      records,
      config.collection,
      collection.limit(FALLBACK_LIMIT)
    )
  }

  return [...records.values()]
    .filter((record) => matchesQuery(record.data, config.searchFields, tokens))
    .sort((a, b) => getRank(b.data, config.searchFields, query, tokens) - getRank(a.data, config.searchFields, query, tokens))
    .slice(0, limit)
    .map((record) => config.mapResult(record.id, record.data))
}

function truncateText(value, maxLength = 96) {
  const text = String(value || '').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trim()}...`
}

function getTimestampMillis(value) {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value.seconds === 'number') return value.seconds * 1000
  if (typeof value._seconds === 'number') return value._seconds * 1000

  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

function dedupeUsersByEmail(users, limit) {
  const usersByKey = new Map()

  users.forEach((user) => {
    const key = normalizeSearchText(user.email || user.id)
    const existing = usersByKey.get(key)

    if (!existing || getTimestampMillis(user.updatedAt) > getTimestampMillis(existing.updatedAt)) {
      usersByKey.set(key, user)
    }
  })

  return [...usersByKey.values()].slice(0, limit).map(({ updatedAt, ...user }) => user)
}

async function searchPosts(query, limit = DEFAULT_LIMIT) {
  return searchCollection({
    collection: 'posts',
    keywordField: 'searchKeywords',
    prefixFields: [
      { name: 'contentLower', normalized: true },
      { name: 'categoryLower', normalized: true },
      { name: 'titleLower', normalized: true }
    ],
    searchFields: [
      'title',
      'text',
      'content',
      'keywords',
      'category',
      'studyCircle',
      'userName',
      'searchText'
    ],
    mapResult: (id, post) => ({
      id,
      type: 'post',
      title: truncateText(post.title || post.text || post.content || 'Untitled post', 82),
      subtitle: `Posted in ${post.category || post.studyCircle || 'General'}${post.userName ? ` by ${post.userName}` : ''}`,
      description: truncateText(post.content || post.text || ''),
      avatar: post.avatar || './frontend/assets/profile-picture/default-profile-picture.webp',
      postId: id,
      category: post.category || post.studyCircle || 'General'
    })
  }, query, limit)
}

async function searchUsers(query, limit = DEFAULT_LIMIT) {
  const users = await searchCollection({
    collection: 'users',
    keywordField: 'searchKeywords',
    prefixFields: [
      { name: 'displayNameLower', normalized: true },
      { name: 'fullNameLower', normalized: true },
      { name: 'usernameLower', normalized: true }
    ],
    searchFields: [
      'displayName',
      'fullName',
      'name',
      'username',
      'email',
      'school',
      'course',
      'searchText'
    ],
    mapResult: (id, user) => {
      const username = user.username ? `@${user.username}` : user.email || ''
      const subtitleParts = [username, user.school, user.course].filter(Boolean)

      return {
        id,
        uid: user.uid || user.id || id,
        type: 'user',
        title: user.displayName || user.fullName || user.name || user.username || 'StudyHive User',
        subtitle: subtitleParts.join(' • ') || 'StudyHive member',
        description: truncateText(user.bio || ''),
        avatar: user.avatarUrl || user.avatar || './frontend/assets/profile-picture/default-profile-picture.webp',
        username: user.username || '',
        email: user.email || '',
        updatedAt: user.updatedAt || user.createdAt || null
      }
    }
  }, query, Math.max(limit * 3, limit))

  return dedupeUsersByEmail(users, limit)
}

async function searchCircles(query, limit = DEFAULT_LIMIT) {
  if (!defaultCirclesSeedChecked) {
    defaultCirclesSeedChecked = true
    const existingCircles = await firestoreService.getStudyCircles()

    if (existingCircles.length === 0) {
      await Promise.all(defaultStudyCircles.map((circle) => firestoreService.saveStudyCircle(circle)))
    }
  }

  return searchCollection({
    collection: 'studyCircles',
    keywordField: 'searchKeywords',
    prefixFields: [
      { name: 'nameLower', normalized: true },
      { name: 'categoryLower', normalized: true },
      { name: 'topicLower', normalized: true }
    ],
    searchFields: [
      'name',
      'category',
      'topic',
      'description',
      'createdBy',
      'members',
      'searchText'
    ],
    mapResult: (id, circle) => ({
      id,
      type: 'circle',
      title: circle.name || 'Study Circle',
      subtitle: circle.category || circle.topic || circle.description || `${Array.isArray(circle.members) ? circle.members.length : 0} members`,
      description: truncateText(circle.description || ''),
      avatar: circle.avatar || '👥',
      name: circle.name || '',
      members: Array.isArray(circle.members) ? circle.members : [],
      createdBy: circle.createdBy || '',
      inviteLink: circle.inviteLink || ''
    })
  }, query, limit)
}

async function searchAll(query) {
  const [posts, users, circles] = await Promise.all([
    searchPosts(query),
    searchUsers(query),
    searchCircles(query)
  ])

  return { query: String(query || '').trim(), posts, users, circles }
}

module.exports = {
  searchPosts,
  searchUsers,
  searchCircles,
  searchAll
}
