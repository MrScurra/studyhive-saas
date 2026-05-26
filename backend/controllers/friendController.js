const firestoreService = require('../services/firestoreService')
const searchService = require('../services/searchService')

function getCurrentUserSummary(req) {
  return {
    id: req.user.id,
    uid: req.user.id,
    displayName: req.user.name,
    name: req.user.name,
    avatarUrl: req.user.avatar,
    avatar: req.user.avatar,
    email: req.user.email
  }
}

async function ensureCurrentUserProfile(req) {
  await firestoreService.saveUserProfile(req.user.id, getCurrentUserSummary(req))
}

async function getFriends(req, res, next) {
  try {
    await ensureCurrentUserProfile(req)

    console.log('[friends:list] loading friend data', {
      userId: req.user.id,
      userEmail: req.user.email
    })

    const [friends, requests] = await Promise.all([
      firestoreService.getFriends(req.user.id),
      firestoreService.getFriendRequests(req.user.id)
    ])

    console.log('[friends:list] loaded friend data', {
      userId: req.user.id,
      friendsCount: friends.length,
      incomingCount: requests.incoming.length,
      outgoingCount: requests.outgoing.length
    })

    return res.json({
      friends,
      requests
    })
  } catch (error) {
    if (firestoreService.isQuotaError(error)) {
      return res.json({
        friends: [],
        requests: { incoming: [], outgoing: [] },
        degraded: true,
        warning: 'Firestore quota exceeded; friend data is temporarily unavailable.'
      })
    }

    return next(error)
  }
}

async function searchUsers(req, res, next) {
  try {
    await ensureCurrentUserProfile(req)

    const query = String(req.query.q || '').trim()
    if (query.length < 2) {
      return res.json({ users: [] })
    }

    const users = await searchService.searchUsers(query, 12)
    const usersWithStatus = await Promise.all(users
      .filter((user) => user.id !== req.user.id)
      .map(async (user) => {
        const connection = await firestoreService.getConnectionStatus(req.user.id, user.id)
        return {
          ...user,
          connectionStatus: connection.status,
          connectionDirection: connection.direction,
          requestId: connection.requestId || null,
          friendshipId: connection.friendshipId || null
        }
      }))

    return res.json({ users: usersWithStatus })
  } catch (error) {
    return next(error)
  }
}

async function sendFriendRequest(req, res, next) {
  try {
    await ensureCurrentUserProfile(req)

    const toUserId = String(req.body.toUserId || '').trim()
    if (!toUserId) {
      return res.status(400).json({ error: 'Target user ID is required' })
    }

    console.log('[friends:request] incoming request creation', {
      fromUserId: req.user.id,
      fromEmail: req.user.email,
      toUserId
    })

    const targetUser = await firestoreService.getUserProfile(toUserId)
    if (!targetUser) {
      console.warn('[friends:request] target user was not found', {
        fromUserId: req.user.id,
        toUserId
      })
      return res.status(404).json({ error: 'User was not found' })
    }

    const request = await firestoreService.createFriendRequest(getCurrentUserSummary(req), targetUser)

    console.log('[friends:request] request service result', {
      requestId: request.id || request.requestId || null,
      fromUserId: request.fromUserId || req.user.id,
      toUserId: request.toUserId || toUserId,
      status: request.status,
      direction: request.direction || 'outgoing',
      alreadyExists: Boolean(request.alreadyExists)
    })

    if (request.status === 'pending' && !request.alreadyExists && request.direction !== 'incoming') {
      await firestoreService.createNotification(request.toUserId || toUserId, {
        fromUser: req.user.name,
        fromUserId: req.user.id,
        toUserId: request.toUserId || toUserId,
        avatar: req.user.avatar,
        message: `${req.user.name} sent you a friend request`,
        type: 'friend_request',
        requestId: request.id || request.requestId || null
      })
    } else if (request.status === 'pending') {
      await firestoreService.ensureFriendRequestNotifications(request.toUserId || toUserId)
    }

    return res.status(201).json({ request })
  } catch (error) {
    if (error.message === 'You cannot add yourself as a friend') {
      return res.status(400).json({ error: error.message })
    }

    return next(error)
  }
}

async function acceptFriendRequest(req, res, next) {
  try {
    console.log('[friends:accept] accept requested', {
      requestId: req.params.requestId,
      currentUserId: req.user.id
    })

    const request = await firestoreService.acceptFriendRequest(req.params.requestId, req.user.id)

    if (!request) {
      console.warn('[friends:accept] request was not found', {
        requestId: req.params.requestId,
        currentUserId: req.user.id
      })
      return res.status(404).json({ error: 'Friend request was not found' })
    }

    console.log('[friends:accept] request accepted', {
      requestId: request.id,
      fromUserId: request.fromUserId,
      toUserId: request.toUserId,
      friendshipId: request.friendshipId
    })

    await firestoreService.createNotification(request.fromUserId, {
      fromUser: req.user.name,
      avatar: req.user.avatar,
      message: `${req.user.name} accepted your friend request`,
      type: 'friend',
      requestId: request.id,
      friendshipId: request.friendshipId
    })

    return res.json({ request })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message })
    }

    return next(error)
  }
}

async function declineFriendRequest(req, res, next) {
  try {
    console.log('[friends:decline] decline requested', {
      requestId: req.params.requestId,
      currentUserId: req.user.id
    })

    const request = await firestoreService.declineFriendRequest(req.params.requestId, req.user.id)

    if (!request) {
      console.warn('[friends:decline] request was not found', {
        requestId: req.params.requestId,
        currentUserId: req.user.id
      })
      return res.status(404).json({ error: 'Friend request was not found' })
    }

    console.log('[friends:decline] request declined', {
      requestId: request.id,
      fromUserId: request.fromUserId,
      toUserId: request.toUserId
    })

    return res.json({ request })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message })
    }

    return next(error)
  }
}

async function unfriend(req, res, next) {
  try {
    const friendUserId = String(req.params.friendUserId || '').trim()

    if (!friendUserId) {
      return res.status(400).json({ error: 'Friend user ID is required' })
    }

    console.log('[friends:unfriend] unfriend requested', {
      currentUserId: req.user.id,
      friendUserId
    })

    const result = await firestoreService.unfriend(req.user.id, friendUserId)
    return res.json({ success: true, ...result })
  } catch (error) {
    if (error.message === 'A valid friend user ID is required') {
      return res.status(400).json({ error: error.message })
    }

    return next(error)
  }
}

module.exports = {
  getFriends,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  unfriend
}
