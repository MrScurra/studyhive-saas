const admin = require('firebase-admin');

let db = null;

function getServiceAccountFromEnv() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    return JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
  }

  return require('../serviceAccountKey.json');
}

const isQuotaError = (error = {}) => {
  const message = String(error.message || error.details || '').toLowerCase();
  const code = String(error.code || error.status || '').toLowerCase();

  return code === '8'
    || code === 'resource-exhausted'
    || message.includes('resource_exhausted')
    || message.includes('resource exhausted')
    || message.includes('quota exceeded');
};

const initializeFirestore = () => {
  if (db) {
    return db;
  }

  try {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      // Use Application Default Credentials
      // For local development, you can set GOOGLE_APPLICATION_CREDENTIALS environment variable
      // pointing to your service account JSON file
      const serviceAccount = getServiceAccountFromEnv();

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id || 'study-collab-saas-js'
      });
    }

    db = admin.firestore();
    console.log('Firestore initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize Firestore:', error.message);
    throw error;
  }
};

const getFirestore = () => {
  if (!db) {
    return initializeFirestore();
  }
  return db;
};

const normalizeSearchText = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeSearchText).join(' ');
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9@._\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const buildSearchKeywords = (...values) => {
  const tokens = normalizeSearchText(values).split(' ').filter(Boolean);
  const keywords = new Set();

  tokens.forEach((token) => {
    keywords.add(token);

    for (let size = 2; size <= Math.min(token.length, 16); size += 1) {
      keywords.add(token.slice(0, size));
    }
  });

  return [...keywords].slice(0, 250);
};

const buildPostSearchFields = (post = {}) => ({
  searchText: normalizeSearchText([
    post.title,
    post.text,
    post.content,
    post.keywords,
    post.category,
    post.studyCircle,
    post.userName
  ]),
  searchKeywords: buildSearchKeywords(
    post.title,
    post.text,
    post.content,
    post.keywords,
    post.category,
    post.studyCircle,
    post.userName
  ),
  titleLower: normalizeSearchText(post.title || post.text || ''),
  contentLower: normalizeSearchText(post.content || post.text || ''),
  categoryLower: normalizeSearchText(post.category || post.studyCircle || ''),
  userNameLower: normalizeSearchText(post.userName || '')
});

const buildUserSearchFields = (user = {}) => ({
  searchText: normalizeSearchText([
    user.displayName,
    user.fullName,
    user.name,
    user.username,
    user.email,
    user.school,
    user.course,
    user.skills
  ]),
  searchKeywords: buildSearchKeywords(
    user.displayName,
    user.fullName,
    user.name,
    user.username,
    user.email,
    user.school,
    user.course,
    user.skills
  ),
  displayNameLower: normalizeSearchText(user.displayName || user.name || ''),
  fullNameLower: normalizeSearchText(user.fullName || user.displayName || user.name || ''),
  usernameLower: normalizeSearchText(user.username || '')
});

const buildStudyCircleSearchFields = (circle = {}) => ({
  searchText: normalizeSearchText([
    circle.name,
    circle.category,
    circle.topic,
    circle.description,
    circle.createdBy,
    circle.members
  ]),
  searchKeywords: buildSearchKeywords(
    circle.name,
    circle.category,
    circle.topic,
    circle.description,
    circle.createdBy,
    circle.members
  ),
  nameLower: normalizeSearchText(circle.name || ''),
  categoryLower: normalizeSearchText(circle.category || ''),
  topicLower: normalizeSearchText(circle.topic || circle.category || '')
});

const DEFAULT_AVATAR_URL = './frontend/assets/profile-picture/default-profile-picture.webp';

const getPersistableAvatarUrl = (value, fallback = DEFAULT_AVATAR_URL) => {
  const avatarUrl = String(value || fallback || DEFAULT_AVATAR_URL).trim();
  return /^(data|blob):/i.test(avatarUrl) ? DEFAULT_AVATAR_URL : avatarUrl;
};

const getTimestampMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  if (typeof value._seconds === 'number') return value._seconds * 1000;

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

// ==================== POSTS ====================

const savePosts = async (posts) => {
  const firestore = getFirestore();
  const batch = firestore.batch();

  for (const post of posts) {
    const postRef = firestore.collection('posts').doc(post.id);
    batch.set(postRef, {
      ...post,
      ...buildPostSearchFields(post),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  await batch.commit();
};

const savePost = async (post) => {
  const firestore = getFirestore();
  const postRef = firestore.collection('posts').doc(post.id);

  await postRef.set({
    ...post,
    ...buildPostSearchFields(post),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return post;
};

const getPosts = async () => {
  const firestore = getFirestore();
  const snapshot = await firestore
    .collection('posts')
    .orderBy('createdAt', 'desc')
    .get();

  const posts = [];
  snapshot.forEach((doc) => {
    posts.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return posts;
};

const getPost = async (postId) => {
  const firestore = getFirestore();
  const doc = await firestore.collection('posts').doc(postId).get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data()
  };
};

const updatePost = async (postId, updates) => {
  const firestore = getFirestore();
  const postRef = firestore.collection('posts').doc(postId);
  const existingPost = await getPost(postId);
  const updatedSearchPost = {
    ...(existingPost || {}),
    ...updates
  };

  await postRef.update({
    ...updates,
    ...buildPostSearchFields(updatedSearchPost),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return getPost(postId);
};

const deletePost = async (postId) => {
  const firestore = getFirestore();
  await firestore.collection('posts').doc(postId).delete();
};

// ==================== UPVOTES ====================

const addUpvote = async (postId, userId) => {
  const firestore = getFirestore();
  const upvoteRef = firestore.collection('upvotes').doc(`${postId}_${userId}`);

  await upvoteRef.set({
    postId,
    userId,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
};

const removeUpvote = async (postId, userId) => {
  const firestore = getFirestore();
  await firestore.collection('upvotes').doc(`${postId}_${userId}`).delete();
};

const getUpvotes = async (postId) => {
  const firestore = getFirestore();
  const snapshot = await firestore
    .collection('upvotes')
    .where('postId', '==', postId)
    .get();

  const upvotes = [];
  snapshot.forEach((doc) => {
    upvotes.push(doc.data().userId);
  });

  return upvotes;
};

const getUpvoteCount = async (postId) => {
  const upvotes = await getUpvotes(postId);
  return upvotes.length;
};

const hasUserUpvoted = async (postId, userId) => {
  const firestore = getFirestore();
  const doc = await firestore.collection('upvotes').doc(`${postId}_${userId}`).get();
  return doc.exists;
};

// ==================== COMMENTS ====================

const addComment = async (postId, comment) => {
  const firestore = getFirestore();
  const commentRef = firestore.collection('comments').doc();

  await commentRef.set({
    ...comment,
    postId,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    id: commentRef.id,
    ...comment
  };
};

const getComments = async (postId) => {
  const firestore = getFirestore();
  const snapshot = await firestore
    .collection('comments')
    .where('postId', '==', postId)
    .orderBy('createdAt', 'asc')
    .get();

  const comments = [];
  snapshot.forEach((doc) => {
    comments.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return comments;
};

const getCommentCount = async (postId) => {
  const comments = await getComments(postId);
  return comments.length;
};

// ==================== BOOKMARKS ====================

const addBookmark = async (postId, userId) => {
  const firestore = getFirestore();
  const bookmarkRef = firestore.collection('bookmarks').doc(`${postId}_${userId}`);

  await bookmarkRef.set({
    postId,
    userId,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
};

const removeBookmark = async (postId, userId) => {
  const firestore = getFirestore();
  await firestore.collection('bookmarks').doc(`${postId}_${userId}`).delete();
};

const getBookmarks = async (postId) => {
  const firestore = getFirestore();
  const snapshot = await firestore
    .collection('bookmarks')
    .where('postId', '==', postId)
    .get();

  const bookmarks = [];
  snapshot.forEach((doc) => {
    bookmarks.push(doc.data().userId);
  });

  return bookmarks;
};

const getBookmarkCount = async (postId) => {
  const bookmarks = await getBookmarks(postId);
  return bookmarks.length;
};

const hasUserBookmarked = async (postId, userId) => {
  const firestore = getFirestore();
  const doc = await firestore.collection('bookmarks').doc(`${postId}_${userId}`).get();
  return doc.exists;
};

// ==================== MESSAGES ====================

const serializeMessage = (doc) => ({
  id: doc.id,
  ...doc.data()
});

const saveMessage = async (message) => {
  const firestore = getFirestore();
  const messageId = String(message?.id || '').trim();

  if (!messageId) {
    throw new Error('Message ID is required');
  }

  await firestore.collection('messages').doc(messageId).set({
    ...message,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return message;
};

const getMessagesForUser = async (userId, conversationId = '') => {
  const firestore = getFirestore();
  const id = cleanUserId(userId);

  if (!id) {
    return [];
  }

  const snapshot = await firestore
    .collection('messages')
    .where('participantIds', 'array-contains', id)
    .get();

  const messages = [];
  snapshot.forEach((doc) => {
    const message = serializeMessage(doc);
    if (!conversationId || String(message.conversationId) === String(conversationId)) {
      messages.push(message);
    }
  });

  return messages.sort((a, b) => getTimestampMillis(a.createdAt || a.timestamp) - getTimestampMillis(b.createdAt || b.timestamp));
};

// ==================== USERS ====================

const saveUserProfile = async (userId, user = {}) => {
  const firestore = getFirestore();
  const id = String(userId || user.id || user.uid || user.email || '').trim();

  if (!id) {
    throw new Error('User ID is required');
  }

  const userRef = firestore.collection('users').doc(id);
  const existingDoc = await userRef.get();
  const existingProfile = existingDoc.exists ? existingDoc.data() : {};
  const hasExplicitFullName = Object.prototype.hasOwnProperty.call(user, 'fullName')
    || Object.prototype.hasOwnProperty.call(user, 'realName');
  const explicitFullName = String(user.fullName || user.realName || '').trim();
  const fullName = hasExplicitFullName
    ? explicitFullName || existingProfile.fullName || user.name || user.displayName || 'StudyHive User'
    : existingProfile.fullName || existingProfile.realName || user.name || user.displayName || 'StudyHive User';
  const displayName = user.displayName || user.nickname || existingProfile.displayName || fullName;
  const avatarSource = user.avatarUrl || user.avatar || existingProfile.avatarUrl || existingProfile.avatar;

  const userProfile = {
    ...user,
    id,
    uid: user.uid || id,
    displayName,
    fullName,
    avatarUrl: getPersistableAvatarUrl(avatarSource)
  };

  await userRef.set({
    ...userProfile,
    ...buildUserSearchFields(userProfile),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return userProfile;
};

const getUserProfile = async (userId) => {
  const firestore = getFirestore();
  const id = String(userId || '').trim();

  if (!id) {
    return null;
  }

  const doc = await firestore.collection('users').doc(id).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  const fullName = data.fullName || data.realName || data.name || data.displayName || 'StudyHive User';
  const displayName = data.displayName || data.nickname || fullName;

  return {
    ...data,
    id: doc.id,
    uid: data.uid || doc.id,
    displayName,
    fullName
  };
};

// ==================== USER SETTINGS / SUPPORT / REPORTS ====================

const DEFAULT_USER_SETTINGS = {
  account: {
    email: ''
  },
  toggles: {
    '2fa': false,
    'public-profile': true,
    'online-status': true,
    'direct-messages': true,
    'dark-mode': false
  },
  appearance: {
    themeColor: '#f4b400',
    fontSize: 'normal'
  }
};

const sanitizeUserSettingsToggles = (toggles = {}) => {
  return Object.keys(DEFAULT_USER_SETTINGS.toggles).reduce((cleanToggles, toggleName) => {
    cleanToggles[toggleName] = typeof toggles[toggleName] === 'boolean'
      ? toggles[toggleName]
      : DEFAULT_USER_SETTINGS.toggles[toggleName];
    return cleanToggles;
  }, {});
};

const getUserSettings = async (userId, fallback = {}) => {
  const firestore = getFirestore();
  const id = cleanUserId(userId);

  if (!id) {
    throw new Error('User ID is required');
  }

  const doc = await firestore.collection('userSettings').doc(id).get();
  const storedSettings = doc.exists ? doc.data() : {};

  return {
    ...DEFAULT_USER_SETTINGS,
    ...storedSettings,
    userId: id,
    account: {
      ...DEFAULT_USER_SETTINGS.account,
      ...(storedSettings.account || {}),
      email: storedSettings.account?.email || fallback.email || ''
    },
    toggles: sanitizeUserSettingsToggles(storedSettings.toggles || {}),
    appearance: {
      ...DEFAULT_USER_SETTINGS.appearance,
      ...(storedSettings.appearance || {})
    }
  };
};

const saveUserSettings = async (userId, settings = {}, fallback = {}) => {
  const firestore = getFirestore();
  const id = cleanUserId(userId);

  if (!id) {
    throw new Error('User ID is required');
  }

  const cleanSettings = {
    userId: id,
    account: {
      email: String(settings.account?.email || fallback.email || '').trim()
    },
    toggles: sanitizeUserSettingsToggles(settings.toggles || {}),
    appearance: {
      themeColor: String(settings.appearance?.themeColor || DEFAULT_USER_SETTINGS.appearance.themeColor).trim(),
      fontSize: String(settings.appearance?.fontSize || DEFAULT_USER_SETTINGS.appearance.fontSize).trim()
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await firestore.collection('userSettings').doc(id).set(cleanSettings, { merge: true });

  return getUserSettings(id, fallback);
};

// ==================== PRESENCE ====================

const updateUserPresence = async (user = {}, presence = {}) => {
  const firestore = getFirestore();
  const current = getUserSummary(user);

  if (!current.id) {
    throw new Error('User ID is required');
  }

  const settings = await getUserSettings(current.id, {
    email: current.email
  }).catch(() => DEFAULT_USER_SETTINGS);
  const onlineVisible = settings.toggles?.['online-status'] !== false && presence.onlineVisible !== false;
  const active = Boolean(presence.active && onlineVisible);
  const lastActiveAtMillis = Date.now();

  const presenceDoc = {
    userId: current.id,
    displayName: current.displayName,
    username: current.username || '',
    avatarUrl: current.avatarUrl,
    active,
    onlineVisible,
    lastActiveAtMillis,
    lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await firestore.collection('userPresence').doc(current.id).set(presenceDoc, { merge: true });

  return {
    ...presenceDoc,
    lastActiveAt: lastActiveAtMillis,
    updatedAt: lastActiveAtMillis
  };
};

const getActiveFriendPresence = async (userId, activeWindowMs = 5 * 60 * 1000) => {
  const firestore = getFirestore();
  const id = cleanUserId(userId);

  if (!id) {
    throw new Error('User ID is required');
  }

  const friends = await getFriends(id);
  const cutoff = Date.now() - Number(activeWindowMs || 0);
  const presenceDocs = await Promise.all(
    friends.map((friend) => firestore.collection('userPresence').doc(cleanUserId(friend.id)).get())
  );
  const friendById = new Map(friends.map((friend) => [cleanUserId(friend.id), friend]));

  return presenceDocs
    .filter((doc) => doc.exists)
    .map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
    .filter((presence) => {
      const lastActiveAt = Number(presence.lastActiveAtMillis || getTimestampMillis(presence.lastActiveAt || presence.updatedAt));
      return presence.active !== false
        && presence.onlineVisible !== false
        && lastActiveAt >= cutoff
        && friendById.has(cleanUserId(presence.userId || presence.id));
    })
    .map((presence) => {
      const friend = friendById.get(cleanUserId(presence.userId || presence.id)) || {};
      return {
        ...friend,
        presence: {
          ...presence,
          lastActiveAt: presence.lastActiveAtMillis || getTimestampMillis(presence.lastActiveAt || presence.updatedAt)
        }
      };
    });
};

const createSupportMessage = async (user = {}, messageData = {}) => {
  const firestore = getFirestore();
  const current = getUserSummary(user);
  const subject = String(messageData.subject || '').trim();
  const message = String(messageData.message || '').trim();

  if (!current.id) {
    throw new Error('User ID is required');
  }

  if (!subject || !message) {
    throw new Error('Subject and message are required');
  }

  const supportRef = firestore.collection('supportMessages').doc();
  const supportMessage = {
    userId: current.id,
    userEmail: current.email || '',
    userName: current.displayName,
    subject,
    message,
    status: 'open',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await supportRef.set(supportMessage);

  return {
    id: supportRef.id,
    ...supportMessage
  };
};

const createProblemReport = async (user = {}, reportData = {}) => {
  const firestore = getFirestore();
  const current = getUserSummary(user);
  const title = String(reportData.title || '').trim();
  const category = String(reportData.category || '').trim();
  const reportText = String(reportData.reportText || reportData.description || '').trim();

  if (!current.id) {
    throw new Error('User ID is required');
  }

  if (!category || !title || !reportText) {
    throw new Error('Category, title, and report text are required');
  }

  const reportRef = firestore.collection('problemReports').doc();
  const report = {
    userId: current.id,
    userEmail: current.email || '',
    userName: current.displayName,
    category,
    title,
    reportText,
    priority: String(reportData.priority || 'Medium').trim(),
    screenshotFileName: String(reportData.screenshotFileName || '').trim(),
    status: 'pending',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await reportRef.set(report);

  return {
    id: reportRef.id,
    ...report
  };
};

const getProblemReportsForUser = async (userId, limit = 10) => {
  const firestore = getFirestore();
  const id = cleanUserId(userId);

  if (!id) {
    return [];
  }

  const snapshot = await firestore
    .collection('problemReports')
    .where('userId', '==', id)
    .get();

  const reports = [];
  snapshot.forEach((doc) => {
    reports.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return reports
    .sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt))
    .slice(0, limit);
};

// ==================== FRIENDS ====================

const cleanUserId = (value) => String(value || '').trim();

const buildFriendshipId = (userIdA, userIdB) => {
  const ids = [cleanUserId(userIdA), cleanUserId(userIdB)].sort();
  return `${ids[0]}_${ids[1]}`;
};

const buildFriendRequestId = (fromUserId, toUserId) => {
  return `${cleanUserId(fromUserId)}_${cleanUserId(toUserId)}`;
};

const getUserSummary = (user = {}) => {
  const id = cleanUserId(user.id || user.uid || user.userId);

  return {
    id,
    uid: user.uid || id,
    displayName: user.displayName || user.fullName || user.name || 'StudyHive User',
    username: user.username || '',
    email: user.email || '',
    avatarUrl: getPersistableAvatarUrl(user.avatarUrl || user.avatar)
  };
};

const sortByCreatedAtDesc = (items) => {
  return items.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
};

const serializeFriendRequest = (doc) => ({
  id: doc.id,
  ...doc.data()
});

const getConnectionStatus = async (currentUserId, targetUserId) => {
  const firestore = getFirestore();
  const currentId = cleanUserId(currentUserId);
  const targetId = cleanUserId(targetUserId);

  if (!currentId || !targetId) {
    return { status: 'none', direction: 'none' };
  }

  if (currentId === targetId) {
    return { status: 'self', direction: 'self' };
  }

  const friendshipDoc = await firestore.collection('friendships').doc(buildFriendshipId(currentId, targetId)).get();
  if (friendshipDoc.exists) {
    console.log('[firestore:connection] accepted friendship found', {
      currentUserId: currentId,
      targetUserId: targetId,
      friendshipId: friendshipDoc.id
    });

    return { status: 'accepted', direction: 'friend', friendshipId: friendshipDoc.id };
  }

  const incomingDoc = await firestore.collection('friendRequests').doc(buildFriendRequestId(targetId, currentId)).get();
  if (incomingDoc.exists) {
    const request = incomingDoc.data();
    if ((request.status || 'pending') === 'pending') {
      console.log('[firestore:connection] incoming pending request found', {
        currentUserId: currentId,
        targetUserId: targetId,
        requestId: incomingDoc.id
      });

      return {
        status: 'pending',
        direction: 'incoming',
        requestId: incomingDoc.id
      };
    }
  }

  const outgoingDoc = await firestore.collection('friendRequests').doc(buildFriendRequestId(currentId, targetId)).get();
  if (outgoingDoc.exists) {
    const request = outgoingDoc.data();
    if ((request.status || 'pending') === 'pending') {
      console.log('[firestore:connection] outgoing pending request found', {
        currentUserId: currentId,
        targetUserId: targetId,
        requestId: outgoingDoc.id
      });

      return {
        status: 'pending',
        direction: 'outgoing',
        requestId: outgoingDoc.id
      };
    }
  }

  return { status: 'none', direction: 'none' };
};

const areFriends = async (userIdA, userIdB) => {
  const firestore = getFirestore();
  const idA = cleanUserId(userIdA);
  const idB = cleanUserId(userIdB);

  if (!idA || !idB || idA === idB) {
    return false;
  }

  const doc = await firestore.collection('friendships').doc(buildFriendshipId(idA, idB)).get();
  return doc.exists;
};

const createFriendRequest = async (fromUser, toUser) => {
  const firestore = getFirestore();
  const from = getUserSummary(fromUser);
  const to = getUserSummary(toUser);

  console.log('[firestore:friendRequests] create requested', {
    fromUserId: from.id,
    toUserId: to.id
  });

  if (!from.id || !to.id) {
    throw new Error('Both users are required');
  }

  if (from.id === to.id) {
    throw new Error('You cannot add yourself as a friend');
  }

  const connection = await getConnectionStatus(from.id, to.id);
  if (connection.status === 'accepted' || connection.status === 'pending') {
    console.log('[firestore:friendRequests] existing connection found', {
      fromUserId: from.id,
      toUserId: to.id,
      status: connection.status,
      direction: connection.direction,
      requestId: connection.requestId || null,
      friendshipId: connection.friendshipId || null
    });

    return {
      ...connection,
      requestId: connection.requestId || null,
      alreadyExists: true
    };
  }

  const requestId = buildFriendRequestId(from.id, to.id);
  const requestRef = firestore.collection('friendRequests').doc(requestId);
  const request = {
    fromUserId: from.id,
    toUserId: to.id,
    fromName: from.displayName,
    fromUsername: from.username,
    fromAvatar: from.avatarUrl,
    toName: to.displayName,
    toUsername: to.username,
    toAvatar: to.avatarUrl,
    status: 'pending',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await requestRef.set({
    ...request,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('[firestore:friendRequests] pending request stored', {
    requestId,
    fromUserId: request.fromUserId,
    toUserId: request.toUserId,
    collection: 'friendRequests'
  });

  return {
    id: requestId,
    ...request,
    alreadyExists: false
  };
};

const getFriendRequests = async (userId) => {
  const firestore = getFirestore();
  const id = cleanUserId(userId);

  if (!id) {
    return { incoming: [], outgoing: [] };
  }

  const [incomingSnapshot, outgoingSnapshot] = await Promise.all([
    firestore.collection('friendRequests').where('toUserId', '==', id).get(),
    firestore.collection('friendRequests').where('fromUserId', '==', id).get()
  ]);

  const incoming = [];
  const outgoing = [];

  incomingSnapshot.forEach((doc) => {
    const request = serializeFriendRequest(doc);
    if (request.status === 'pending') {
      incoming.push(request);
    }
  });

  outgoingSnapshot.forEach((doc) => {
    const request = serializeFriendRequest(doc);
    if (request.status === 'pending') {
      outgoing.push(request);
    }
  });

  return {
    incoming: sortByCreatedAtDesc(incoming),
    outgoing: sortByCreatedAtDesc(outgoing)
  };
};

const acceptFriendRequest = async (requestId, currentUserId) => {
  const firestore = getFirestore();
  const id = cleanUserId(requestId);
  const currentId = cleanUserId(currentUserId);

  console.log('[firestore:friendRequests] accept lookup', {
    requestId: id,
    currentUserId: currentId
  });

  if (!id || !currentId) {
    throw new Error('Request ID and current user are required');
  }

  const requestRef = firestore.collection('friendRequests').doc(id);
  const requestDoc = await requestRef.get();

  if (!requestDoc.exists) {
    return null;
  }

  const request = requestDoc.data();
  console.log('[firestore:friendRequests] accept found request', {
    requestId: id,
    fromUserId: request.fromUserId,
    toUserId: request.toUserId,
    status: request.status || 'pending'
  });

  if (request.toUserId !== currentId) {
    const error = new Error('Only the receiving user can accept this request');
    error.status = 403;
    throw error;
  }

  const friendshipId = buildFriendshipId(request.fromUserId, request.toUserId);
  const friendshipRef = firestore.collection('friendships').doc(friendshipId);

  if (request.status === 'accepted') {
    return {
      id,
      ...request,
      status: 'accepted',
      friendshipId
    };
  }

  if (request.status && request.status !== 'pending') {
    const error = new Error('This friend request is no longer pending');
    error.status = 409;
    throw error;
  }

  const users = [
    getUserSummary({
      id: request.fromUserId,
      displayName: request.fromName,
      username: request.fromUsername,
      avatarUrl: request.fromAvatar
    }),
    getUserSummary({
      id: request.toUserId,
      displayName: request.toName,
      username: request.toUsername,
      avatarUrl: request.toAvatar
    })
  ];

  const batch = firestore.batch();
  batch.update(requestRef, {
    status: 'accepted',
    acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  batch.delete(firestore.collection('friendRequests').doc(buildFriendRequestId(request.toUserId, request.fromUserId)));
  batch.set(friendshipRef, {
    id: friendshipId,
    userIds: [request.fromUserId, request.toUserId],
    users,
    requestId: id,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  await batch.commit();

  console.log('[firestore:friendships] friendship stored', {
    friendshipId,
    requestId: id,
    userIds: [request.fromUserId, request.toUserId],
    collection: 'friendships'
  });

  return {
    id,
    ...request,
    status: 'accepted',
    friendshipId
  };
};

const declineFriendRequest = async (requestId, currentUserId) => {
  const firestore = getFirestore();
  const id = cleanUserId(requestId);
  const currentId = cleanUserId(currentUserId);

  if (!id || !currentId) {
    throw new Error('Request ID and current user are required');
  }

  const requestRef = firestore.collection('friendRequests').doc(id);
  const requestDoc = await requestRef.get();

  if (!requestDoc.exists) {
    return null;
  }

  const request = requestDoc.data();
  if (request.toUserId !== currentId) {
    const error = new Error('Only the receiving user can decline this request');
    error.status = 403;
    throw error;
  }

  if (request.status === 'declined') {
    return {
      id,
      ...request,
      status: 'declined'
    };
  }

  if (request.status && request.status !== 'pending') {
    const error = new Error('This friend request is no longer pending');
    error.status = 409;
    throw error;
  }

  await requestRef.update({
    status: 'declined',
    declinedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    id,
    ...request,
    status: 'declined'
  };
};

const getFriends = async (userId) => {
  const firestore = getFirestore();
  const id = cleanUserId(userId);

  console.log('[firestore:friends] list lookup', {
    userId: id,
    collection: 'friendships'
  });

  if (!id) {
    return [];
  }

  const snapshot = await firestore
    .collection('friendships')
    .where('userIds', 'array-contains', id)
    .get();

  const friends = [];
  snapshot.forEach((doc) => {
    const friendship = doc.data();
    const otherUser = (friendship.users || []).find((user) => user.id !== id);
    const otherUserId = (friendship.userIds || []).find((friendId) => friendId !== id);

    if (!otherUser && !otherUserId) return;

    friends.push({
      ...(otherUser || { id: otherUserId, displayName: 'StudyHive User' }),
      friendshipId: doc.id,
      status: 'accepted',
      connectedAt: friendship.createdAt
    });
  });

  console.log('[firestore:friends] list result', {
    userId: id,
    friendsCount: friends.length
  });

  return friends.sort((a, b) => {
    return String(a.displayName || '').localeCompare(String(b.displayName || ''));
  });
};

const unfriend = async (currentUserId, friendUserId) => {
  const firestore = getFirestore();
  const currentId = cleanUserId(currentUserId);
  const friendId = cleanUserId(friendUserId);

  if (!currentId || !friendId || currentId === friendId) {
    throw new Error('A valid friend user ID is required');
  }

  const batch = firestore.batch();
  batch.delete(firestore.collection('friendships').doc(buildFriendshipId(currentId, friendId)));
  batch.delete(firestore.collection('friendRequests').doc(buildFriendRequestId(currentId, friendId)));
  batch.delete(firestore.collection('friendRequests').doc(buildFriendRequestId(friendId, currentId)));

  await batch.commit();

  return { friendUserId: friendId };
};

// ==================== STUDY CIRCLES ====================

const buildStudyCircleInviteId = (circleId, toUserId) => {
  return `${String(circleId || '').trim()}_${cleanUserId(toUserId)}`.replace(/\//g, '_');
};

const saveStudyCircle = async (circle) => {
  const firestore = getFirestore();
  const circleId = String(circle?.id || '').trim();

  if (!circleId) {
    throw new Error('Study circle ID is required');
  }

  await firestore.collection('studyCircles').doc(circleId).set({
    ...circle,
    ...buildStudyCircleSearchFields(circle),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return circle;
};

const getStudyCircle = async (circleId) => {
  const firestore = getFirestore();
  const id = String(circleId || '').trim();

  if (!id) {
    return null;
  }

  const doc = await firestore.collection('studyCircles').doc(id).get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data()
  };
};

const getStudyCircles = async () => {
  const firestore = getFirestore();
  const snapshot = await firestore.collection('studyCircles').get();
  const circles = [];

  snapshot.forEach((doc) => {
    circles.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return circles.sort((a, b) => {
    return getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt);
  });
};

const getStudyCirclesForUser = async (userId) => {
  const firestore = getFirestore();
  const id = cleanUserId(userId);

  if (!id || id === 'default-user') {
    return getStudyCircles();
  }

  const snapshot = await firestore
    .collection('studyCircles')
    .where('memberIds', 'array-contains', id)
    .get();
  const circles = [];

  snapshot.forEach((doc) => {
    circles.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return circles.sort((a, b) => {
    return getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt);
  });
};

const updateStudyCircleInviteNotifications = async (inviteId, status) => {
  const firestore = getFirestore();
  const snapshot = await firestore
    .collection('notifications')
    .where('inviteId', '==', String(inviteId || '').trim())
    .get();

  if (snapshot.empty) {
    return;
  }

  const batch = firestore.batch();
  snapshot.forEach((doc) => {
    batch.update(doc.ref, {
      read: true,
      studyCircleInviteStatus: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  await batch.commit();
};

const createStudyCircleInvite = async (circle, fromUser, toUserId) => {
  const firestore = getFirestore();
  const from = getUserSummary(fromUser);
  const receiverUserId = cleanUserId(toUserId);
  const circleId = String(circle?.id || '').trim();

  if (!circleId || !circle?.name) {
    throw new Error('Study circle is required');
  }

  if (!from.id || !receiverUserId) {
    throw new Error('Both users are required');
  }

  if (from.id === receiverUserId) {
    throw new Error('You cannot invite yourself to a study circle');
  }

  if ((circle.memberIds || []).map(cleanUserId).includes(receiverUserId)) {
    return {
      id: buildStudyCircleInviteId(circleId, receiverUserId),
      circleId,
      circleName: circle.name,
      fromUserId: from.id,
      toUserId: receiverUserId,
      status: 'accepted',
      alreadyMember: true
    };
  }

  const inviteId = buildStudyCircleInviteId(circleId, receiverUserId);
  const inviteRef = firestore.collection('studyCircleInvites').doc(inviteId);
  const existingInviteDoc = await inviteRef.get();

  if (existingInviteDoc.exists) {
    const existingInvite = existingInviteDoc.data();
    const existingStatus = existingInvite.status || 'pending';

    if (existingStatus === 'pending') {
      return {
        id: inviteId,
        ...existingInvite,
        alreadyExists: true
      };
    }
  }

  const invite = {
    circleId,
    circleName: circle.name,
    fromUserId: from.id,
    toUserId: receiverUserId,
    status: 'pending',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await inviteRef.set({
    ...invite,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: false });

  await createNotification(receiverUserId, {
    fromUser: from.displayName,
    fromUserId: from.id,
    toUserId: receiverUserId,
    avatar: from.avatarUrl,
    message: `${from.displayName} invited you to join ${circle.name}`,
    type: 'study_circle_invite',
    inviteId,
    circleId,
    circleName: circle.name,
    studyCircleInviteStatus: 'pending'
  });

  return {
    id: inviteId,
    ...invite,
    status: 'pending'
  };
};

const createStudyCircleInvites = async (circle, fromUser, toUserIds = []) => {
  const inviteeIds = [...new Set((Array.isArray(toUserIds) ? toUserIds : [])
    .map(cleanUserId)
    .filter(Boolean))]
    .filter((toUserId) => toUserId !== cleanUserId(fromUser?.id || fromUser?.uid || fromUser?.userId));

  const invites = [];

  for (const toUserId of inviteeIds) {
    invites.push(await createStudyCircleInvite(circle, fromUser, toUserId));
  }

  return invites;
};

const getStudyCircleAdminIds = (circle = {}) => {
  const rawAdminIds = [
    circle.createdById,
    circle.ownerId,
    ...(Array.isArray(circle.adminIds) ? circle.adminIds : []),
    ...(Array.isArray(circle.adminUserIds) ? circle.adminUserIds : []),
    ...(Array.isArray(circle.admins)
      ? circle.admins.map((adminUser) => (
        typeof adminUser === 'string'
          ? adminUser
          : adminUser?.id || adminUser?.uid || adminUser?.userId
      ))
      : [])
  ];

  return new Set(rawAdminIds.map(cleanUserId).filter(Boolean));
};

const leaveStudyCircle = async (circleId, currentUser = {}) => {
  const firestore = getFirestore();
  const id = String(circleId || '').trim();
  const current = getUserSummary(currentUser);

  if (!id || !current.id) {
    throw new Error('Study circle and current user are required');
  }

  const circleRef = firestore.collection('studyCircles').doc(id);
  const circleDoc = await circleRef.get();

  if (!circleDoc.exists) {
    return null;
  }

  const circle = {
    id: circleDoc.id,
    ...circleDoc.data()
  };
  const memberIds = (circle.memberIds || []).map(cleanUserId).filter(Boolean);

  if (!memberIds.includes(current.id)) {
    const error = new Error('You are not a member of this study circle');
    error.status = 403;
    throw error;
  }

  if (getStudyCircleAdminIds(circle).has(current.id)) {
    const error = new Error('Creators and admins cannot leave until ownership or admin responsibilities are transferred');
    error.status = 403;
    throw error;
  }

  const currentNameValues = new Set([
    current.displayName,
    current.name,
    current.fullName,
    current.email
  ].map(normalizeSearchText).filter(Boolean));
  const nextMemberIds = memberIds.filter((memberId) => memberId !== current.id);
  const nextMembers = (circle.members || []).filter((member) => {
    const normalizedMember = normalizeSearchText(member);
    return !normalizedMember || !currentNameValues.has(normalizedMember);
  });
  const updatedCircle = {
    ...circle,
    members: nextMembers,
    memberIds: nextMemberIds
  };

  await circleRef.update({
    members: nextMembers,
    memberIds: nextMemberIds,
    ...buildStudyCircleSearchFields(updatedCircle),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return updatedCircle;
};

const isStudyCircleOwner = (circle = {}, userId) => {
  const currentId = cleanUserId(userId);
  const ownerIds = [
    circle.createdById,
    circle.ownerId
  ].map(cleanUserId).filter(Boolean);

  return Boolean(currentId && ownerIds.includes(currentId));
};

const deleteStudyCircle = async (circleId, currentUser = {}) => {
  const firestore = getFirestore();
  const id = String(circleId || '').trim();
  const current = getUserSummary(currentUser);

  if (!id || !current.id) {
    throw new Error('Study circle and current user are required');
  }

  const circleRef = firestore.collection('studyCircles').doc(id);
  const circleDoc = await circleRef.get();

  if (!circleDoc.exists) {
    return null;
  }

  const circle = {
    id: circleDoc.id,
    ...circleDoc.data()
  };

  if (!isStudyCircleOwner(circle, current.id)) {
    const error = new Error('Only the study circle owner can delete this group');
    error.status = 403;
    throw error;
  }

  const [invitesSnapshot, notificationsSnapshot] = await Promise.all([
    firestore.collection('studyCircleInvites').where('circleId', '==', id).get(),
    firestore.collection('notifications').where('circleId', '==', id).get()
  ]);

  const docsToDelete = [
    circleRef,
    ...invitesSnapshot.docs.map((doc) => doc.ref),
    ...notificationsSnapshot.docs
      .filter((doc) => String(doc.data().type || '') === 'study_circle_invite')
      .map((doc) => doc.ref)
  ];

  let batch = firestore.batch();
  let operationCount = 0;
  let deletedCount = 0;

  for (const docRef of docsToDelete) {
    batch.delete(docRef);
    operationCount += 1;
    deletedCount += 1;

    if (operationCount >= 450) {
      await batch.commit();
      batch = firestore.batch();
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
  }

  return {
    circle,
    deletedCount,
    deletedInviteCount: invitesSnapshot.size,
    deletedNotificationCount: notificationsSnapshot.docs.filter((doc) => String(doc.data().type || '') === 'study_circle_invite').length
  };
};

const acceptStudyCircleInvite = async (inviteId, currentUser = {}) => {
  const firestore = getFirestore();
  const id = String(inviteId || '').trim();
  const current = getUserSummary(currentUser);

  if (!id || !current.id) {
    throw new Error('Invite ID and current user are required');
  }

  const inviteRef = firestore.collection('studyCircleInvites').doc(id);
  const inviteDoc = await inviteRef.get();

  if (!inviteDoc.exists) {
    return null;
  }

  const invite = inviteDoc.data();

  if (invite.toUserId !== current.id) {
    const error = new Error('Only the invited user can accept this study circle invitation');
    error.status = 403;
    throw error;
  }

  if (invite.status === 'accepted') {
    return {
      id,
      ...invite,
      status: 'accepted'
    };
  }

  if (invite.status && invite.status !== 'pending') {
    const error = new Error('This study circle invitation is no longer pending');
    error.status = 409;
    throw error;
  }

  const circleRef = firestore.collection('studyCircles').doc(invite.circleId);
  const circleDoc = await circleRef.get();

  if (!circleDoc.exists) {
    const error = new Error('Study circle was not found');
    error.status = 404;
    throw error;
  }

  const circle = {
    id: circleDoc.id,
    ...circleDoc.data()
  };
  const members = [...new Set([...(circle.members || []), current.displayName].filter(Boolean))];
  const memberIds = [...new Set([...(circle.memberIds || []), current.id].filter(Boolean))];
  const updatedCircle = {
    ...circle,
    members,
    memberIds
  };

  const batch = firestore.batch();
  batch.update(inviteRef, {
    status: 'accepted',
    acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  batch.update(circleRef, {
    members,
    memberIds,
    ...buildStudyCircleSearchFields(updatedCircle),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await batch.commit();
  await updateStudyCircleInviteNotifications(id, 'accepted');

  return {
    id,
    ...invite,
    status: 'accepted',
    circle: updatedCircle
  };
};

const declineStudyCircleInvite = async (inviteId, currentUserId) => {
  const firestore = getFirestore();
  const id = String(inviteId || '').trim();
  const currentId = cleanUserId(currentUserId);

  if (!id || !currentId) {
    throw new Error('Invite ID and current user are required');
  }

  const inviteRef = firestore.collection('studyCircleInvites').doc(id);
  const inviteDoc = await inviteRef.get();

  if (!inviteDoc.exists) {
    return null;
  }

  const invite = inviteDoc.data();

  if (invite.toUserId !== currentId) {
    const error = new Error('Only the invited user can decline this study circle invitation');
    error.status = 403;
    throw error;
  }

  if (invite.status === 'declined') {
    return {
      id,
      ...invite,
      status: 'declined'
    };
  }

  if (invite.status && invite.status !== 'pending') {
    const error = new Error('This study circle invitation is no longer pending');
    error.status = 409;
    throw error;
  }

  await inviteRef.update({
    status: 'declined',
    declinedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  await updateStudyCircleInviteNotifications(id, 'declined');

  return {
    id,
    ...invite,
    status: 'declined'
  };
};

// ==================== NOTIFICATIONS ====================

const MUTED_NOTIFICATION_TYPES = new Set(['upvote', 'bookmark']);
const FRIEND_REQUEST_NOTIFICATION_REPAIR_INTERVAL_MS = 5 * 60 * 1000;
const friendRequestNotificationRepairAt = new Map();

const shouldShowNotification = (notification = {}) => {
  return !MUTED_NOTIFICATION_TYPES.has(String(notification.type || '').toLowerCase());
};

const createNotification = async (userId, notification) => {
  const firestore = getFirestore();
  const receiverUserId = cleanUserId(userId);

  if (!receiverUserId) {
    throw new Error('Notification user ID is required');
  }

  const notificationsRef = firestore.collection('notifications').doc();

  await notificationsRef.set({
    ...notification,
    userId: receiverUserId,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('Notification created', {
    type: notification.type || 'notification',
    receiverUserId,
    requestId: notification.requestId || null,
    collection: 'notifications'
  });

  return {
    id: notificationsRef.id,
    ...notification,
    userId: receiverUserId,
    read: false
  };
};

const isFriendRequestNotification = (notification = {}) => {
  const type = String(notification.type || '').toLowerCase();
  const message = String(notification.message || '').toLowerCase();

  return type === 'friend_request'
    || (type === 'friend' && message.includes('sent you a friend request'));
};

const ensureFriendRequestNotifications = async (userId) => {
  const firestore = getFirestore();
  const id = cleanUserId(userId);

  if (!id) {
    return 0;
  }

  const [incomingSnapshot, notificationSnapshot] = await Promise.all([
    firestore.collection('friendRequests').where('toUserId', '==', id).get(),
    firestore.collection('notifications').where('userId', '==', id).get()
  ]);

  const existingRequestNotificationIds = new Set();
  notificationSnapshot.forEach((doc) => {
    const notification = doc.data();
    if (isFriendRequestNotification(notification) && notification.requestId) {
      existingRequestNotificationIds.add(String(notification.requestId));
    }
  });

  const batch = firestore.batch();
  let createdCount = 0;

  incomingSnapshot.forEach((doc) => {
    const request = doc.data();

    if (request.status !== 'pending' || request.notificationClearedAt || existingRequestNotificationIds.has(doc.id)) {
      return;
    }

    const notificationRef = firestore.collection('notifications').doc();
    batch.set(notificationRef, {
      userId: id,
      fromUser: request.fromName || 'StudyHive User',
      fromUserId: request.fromUserId || '',
      toUserId: id,
      avatar: request.fromAvatar || './frontend/assets/profile-picture/default-profile-picture.webp',
      message: `${request.fromName || 'StudyHive User'} sent you a friend request`,
      type: 'friend_request',
      requestId: doc.id,
      read: false,
      createdAt: request.createdAt || admin.firestore.FieldValue.serverTimestamp()
    });
    createdCount += 1;
  });

  if (createdCount > 0) {
    await batch.commit();
    console.log('Missing friend request notifications repaired', {
      receiverUserId: id,
      createdCount
    });
  }

  return createdCount;
};

const maybeEnsureFriendRequestNotifications = async (userId) => {
  const id = cleanUserId(userId);

  if (!id) {
    return 0;
  }

  const lastRepairAt = friendRequestNotificationRepairAt.get(id) || 0;
  if (Date.now() - lastRepairAt < FRIEND_REQUEST_NOTIFICATION_REPAIR_INTERVAL_MS) {
    return 0;
  }

  friendRequestNotificationRepairAt.set(id, Date.now());

  try {
    return await ensureFriendRequestNotifications(id);
  } catch (error) {
    if (isQuotaError(error)) {
      throw error;
    }

    console.warn('Could not repair friend request notifications:', error.message);
    return 0;
  }
};

const getNotifications = async (userId, limit = 50) => {
  const firestore = getFirestore();
  const id = cleanUserId(userId);

  await maybeEnsureFriendRequestNotifications(id);

  const snapshot = await firestore
    .collection('notifications')
    .where('userId', '==', id)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  const notifications = [];
  snapshot.forEach((doc) => {
    const notification = {
      id: doc.id,
      ...doc.data()
    };

    if (shouldShowNotification(notification)) {
      notifications.push(notification);
    }
  });

  return notifications;
};

const markNotificationAsRead = async (notificationId) => {
  const firestore = getFirestore();
  await firestore.collection('notifications').doc(notificationId).update({
    read: true
  });
};

const markAllNotificationsAsRead = async (userId) => {
  const firestore = getFirestore();
  const id = cleanUserId(userId);

  const snapshot = await firestore
    .collection('notifications')
    .where('userId', '==', id)
    .where('read', '==', false)
    .get();

  const batch = firestore.batch();
  snapshot.forEach((doc) => {
    batch.update(doc.ref, { read: true });
  });

  await batch.commit();
};

const clearNotificationsForUser = async (userId) => {
  const firestore = getFirestore();
  const id = cleanUserId(userId);

  if (!id) {
    throw new Error('User ID is required');
  }

  const [notificationsSnapshot, incomingRequestsSnapshot] = await Promise.all([
    firestore.collection('notifications').where('userId', '==', id).get(),
    firestore.collection('friendRequests').where('toUserId', '==', id).get()
  ]);

  let batch = firestore.batch();
  let operationCount = 0;
  let deletedCount = 0;
  let dismissedFriendRequestCount = 0;

  const commitIfNeeded = async (force = false) => {
    if (operationCount === 0 || (!force && operationCount < 450)) {
      return;
    }

    await batch.commit();
    batch = firestore.batch();
    operationCount = 0;
  };

  for (const notificationDoc of notificationsSnapshot.docs) {
    batch.delete(notificationDoc.ref);
    operationCount += 1;
    deletedCount += 1;
    await commitIfNeeded();
  }

  for (const requestDoc of incomingRequestsSnapshot.docs) {
    const request = requestDoc.data();

    if (request.status !== 'pending') {
      continue;
    }

    batch.update(requestDoc.ref, {
      notificationClearedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    operationCount += 1;
    dismissedFriendRequestCount += 1;
    await commitIfNeeded();
  }

  await commitIfNeeded(true);

  console.log('Notifications cleared', {
    userId: id,
    deletedCount,
    dismissedFriendRequestCount
  });

  return {
    deletedCount,
    dismissedFriendRequestCount
  };
};

const getUnreadNotificationCount = async (userId) => {
  const firestore = getFirestore();
  const id = cleanUserId(userId);

  await maybeEnsureFriendRequestNotifications(id);

  const snapshot = await firestore
    .collection('notifications')
    .where('userId', '==', id)
    .where('read', '==', false)
    .get();

  let unreadCount = 0;

  snapshot.forEach((doc) => {
    if (shouldShowNotification(doc.data())) {
      unreadCount += 1;
    }
  });

  return unreadCount;
};

const deleteNotification = async (notificationId) => {
  const firestore = getFirestore();
  await firestore.collection('notifications').doc(notificationId).delete();
};

// ==================== ACCOUNT / SESSION MANAGEMENT ====================

const getFirebaseAuth = () => {
  initializeFirestore();
  return admin.auth();
};

const addDocRefsToMap = (refMap, docs = []) => {
  docs.forEach((doc) => {
    refMap.set(doc.ref.path, doc.ref);
  });
};

const getDocsByField = async (firestore, collectionName, fieldName, operator, value) => {
  if (!value) return [];
  const snapshot = await firestore.collection(collectionName).where(fieldName, operator, value).get();
  return snapshot.docs;
};

const commitBatchOperations = async (operations = []) => {
  let batch = getFirestore().batch();
  let operationCount = 0;
  let completedCount = 0;

  const commitIfNeeded = async (force = false) => {
    if (operationCount === 0 || (!force && operationCount < 450)) {
      return;
    }

    await batch.commit();
    batch = getFirestore().batch();
    operationCount = 0;
  };

  for (const operation of operations) {
    if (!operation?.ref || !operation.type) continue;

    if (operation.type === 'delete') {
      batch.delete(operation.ref);
    } else if (operation.type === 'update') {
      batch.update(operation.ref, operation.data || {});
    } else if (operation.type === 'set') {
      batch.set(operation.ref, operation.data || {}, operation.options || {});
    } else {
      continue;
    }

    operationCount += 1;
    completedCount += 1;
    await commitIfNeeded();
  }

  await commitIfNeeded(true);
  return completedCount;
};

const revokeUserSessions = async (userId, metadata = {}) => {
  const firestore = getFirestore();
  const id = cleanUserId(userId);

  if (!id) {
    throw new Error('User ID is required');
  }

  let authUserFound = true;

  try {
    await getFirebaseAuth().revokeRefreshTokens(id);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      authUserFound = false;
    } else {
      throw error;
    }
  }

  await firestore.collection('userSessions').doc(id).set({
    userId: id,
    signOutEverywhereAt: admin.firestore.FieldValue.serverTimestamp(),
    revokedAtMillis: Date.now(),
    reason: metadata.reason || 'sign_out_everywhere',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return {
    userId: id,
    authUserFound
  };
};

const getAccountDeletionNameValues = (user = {}) => {
  return new Set([
    user.displayName,
    user.fullName,
    user.name,
    user.email,
    user.username
  ].map(normalizeSearchText).filter(Boolean));
};

const removeDeletedUserFromStudyCircle = (circle = {}, deletedUser = {}) => {
  const deletedUserId = cleanUserId(deletedUser.id || deletedUser.uid || deletedUser.userId);
  const deletedNameValues = getAccountDeletionNameValues(deletedUser);
  const memberIds = Array.isArray(circle.memberIds) ? circle.memberIds.map(cleanUserId).filter(Boolean) : [];
  const members = Array.isArray(circle.members) ? circle.members : [];
  const nextMemberIds = memberIds.filter((memberId) => memberId !== deletedUserId);
  const nextMembers = members.filter((member) => {
    const normalizedMember = normalizeSearchText(member);
    return !normalizedMember || !deletedNameValues.has(normalizedMember);
  });

  const filterIds = (values = []) => values
    .map(cleanUserId)
    .filter((value) => value && value !== deletedUserId);

  const nextAdminIds = filterIds(circle.adminIds || []);
  const nextAdminUserIds = filterIds(circle.adminUserIds || []);
  const nextAdmins = Array.isArray(circle.admins)
    ? circle.admins.filter((adminUser) => {
      const adminId = cleanUserId(
        typeof adminUser === 'string'
          ? adminUser
          : adminUser?.id || adminUser?.uid || adminUser?.userId
      );
      const adminName = normalizeSearchText(
        typeof adminUser === 'string'
          ? adminUser
          : adminUser?.displayName || adminUser?.name || adminUser?.email
      );

      return adminId !== deletedUserId && (!adminName || !deletedNameValues.has(adminName));
    })
    : [];

  const hasRemainingMembers = nextMemberIds.length > 0 || nextMembers.length > 0;
  const ownerNeedsTransfer = [circle.createdById, circle.ownerId].map(cleanUserId).includes(deletedUserId);
  const nextOwnerId = nextMemberIds[0] || '';
  const nextOwnerName = nextMembers[0] || 'StudyHive User';

  if (!hasRemainingMembers) {
    return {
      deleteCircle: true,
      updates: {}
    };
  }

  const updatedCircle = {
    ...circle,
    members: nextMembers,
    memberIds: nextMemberIds,
    adminIds: nextAdminIds,
    adminUserIds: nextAdminUserIds,
    admins: nextAdmins
  };

  if (ownerNeedsTransfer) {
    updatedCircle.ownerId = nextOwnerId;
    updatedCircle.createdById = nextOwnerId;
    updatedCircle.createdBy = nextOwnerName;
    updatedCircle.previousOwnerId = deletedUserId;
  }

  return {
    deleteCircle: false,
    updates: {
      members: updatedCircle.members,
      memberIds: updatedCircle.memberIds,
      adminIds: updatedCircle.adminIds,
      adminUserIds: updatedCircle.adminUserIds,
      admins: updatedCircle.admins,
      ownerId: updatedCircle.ownerId || '',
      createdById: updatedCircle.createdById || '',
      createdBy: updatedCircle.createdBy || nextOwnerName,
      previousOwnerId: updatedCircle.previousOwnerId || circle.previousOwnerId || '',
      ...buildStudyCircleSearchFields(updatedCircle),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
  };
};

const deleteFirebaseAuthUser = async (userId) => {
  const id = cleanUserId(userId);

  if (!id) {
    throw new Error('User ID is required');
  }

  try {
    await getFirebaseAuth().deleteUser(id);
    return { userId: id, deleted: true };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return { userId: id, deleted: false, alreadyDeleted: true };
    }

    throw error;
  }
};

const deleteAccountData = async (userId, user = {}) => {
  const firestore = getFirestore();
  const id = cleanUserId(userId);

  if (!id) {
    throw new Error('User ID is required');
  }

  const profile = await getUserProfile(id).catch(() => null);
  const deletedUser = getUserSummary({
    ...(profile || {}),
    ...user,
    id,
    uid: id
  });
  const deleteRefs = new Map();
  const updateOperations = [];
  const deletedPostIds = new Set();

  const addDeleteDocs = (docs = []) => addDocRefsToMap(deleteRefs, docs);

  deleteRefs.set(`users/${id}`, firestore.collection('users').doc(id));
  deleteRefs.set(`userSettings/${id}`, firestore.collection('userSettings').doc(id));

  const postDocs = [
    ...await getDocsByField(firestore, 'posts', 'userId', '==', id),
    ...await getDocsByField(firestore, 'posts', 'ownerId', '==', id),
    ...await getDocsByField(firestore, 'posts', 'createdById', '==', id),
    ...await getDocsByField(firestore, 'posts', 'userEmail', '==', deletedUser.email)
  ];

  postDocs.forEach((doc) => deletedPostIds.add(doc.id));
  addDeleteDocs(postDocs);

  addDeleteDocs(await getDocsByField(firestore, 'comments', 'userId', '==', id));
  addDeleteDocs(await getDocsByField(firestore, 'comments', 'userEmail', '==', deletedUser.email));
  addDeleteDocs(await getDocsByField(firestore, 'upvotes', 'userId', '==', id));
  addDeleteDocs(await getDocsByField(firestore, 'bookmarks', 'userId', '==', id));

  for (const postId of deletedPostIds) {
    addDeleteDocs(await getDocsByField(firestore, 'comments', 'postId', '==', postId));
    addDeleteDocs(await getDocsByField(firestore, 'upvotes', 'postId', '==', postId));
    addDeleteDocs(await getDocsByField(firestore, 'bookmarks', 'postId', '==', postId));
    addDeleteDocs(await getDocsByField(firestore, 'notifications', 'postId', '==', postId));
  }

  addDeleteDocs(await getDocsByField(firestore, 'notifications', 'userId', '==', id));
  addDeleteDocs(await getDocsByField(firestore, 'notifications', 'fromUserId', '==', id));
  addDeleteDocs(await getDocsByField(firestore, 'notifications', 'toUserId', '==', id));
  addDeleteDocs(await getDocsByField(firestore, 'friendships', 'userIds', 'array-contains', id));
  addDeleteDocs(await getDocsByField(firestore, 'friendRequests', 'fromUserId', '==', id));
  addDeleteDocs(await getDocsByField(firestore, 'friendRequests', 'toUserId', '==', id));
  addDeleteDocs(await getDocsByField(firestore, 'messages', 'participantIds', 'array-contains', id));
  addDeleteDocs(await getDocsByField(firestore, 'studyCircleInvites', 'fromUserId', '==', id));
  addDeleteDocs(await getDocsByField(firestore, 'studyCircleInvites', 'toUserId', '==', id));
  addDeleteDocs(await getDocsByField(firestore, 'supportMessages', 'userId', '==', id));
  addDeleteDocs(await getDocsByField(firestore, 'problemReports', 'userId', '==', id));

  const circleDocsByPath = new Map();
  [
    ...await getDocsByField(firestore, 'studyCircles', 'memberIds', 'array-contains', id),
    ...await getDocsByField(firestore, 'studyCircles', 'createdById', '==', id),
    ...await getDocsByField(firestore, 'studyCircles', 'ownerId', '==', id)
  ].forEach((doc) => {
    circleDocsByPath.set(doc.ref.path, doc);
  });

  for (const circleDoc of circleDocsByPath.values()) {
    const circle = {
      id: circleDoc.id,
      ...circleDoc.data()
    };
    const cleanup = removeDeletedUserFromStudyCircle(circle, deletedUser);

    if (cleanup.deleteCircle) {
      deleteRefs.set(circleDoc.ref.path, circleDoc.ref);
      addDeleteDocs(await getDocsByField(firestore, 'studyCircleInvites', 'circleId', '==', circleDoc.id));
      addDeleteDocs(await getDocsByField(firestore, 'notifications', 'circleId', '==', circleDoc.id));
    } else {
      updateOperations.push({
        type: 'update',
        ref: circleDoc.ref,
        data: cleanup.updates
      });
    }
  }

  updateOperations.push({
    type: 'set',
    ref: firestore.collection('userSessions').doc(id),
    data: {
      userId: id,
      deleted: true,
      accountDeletedAt: admin.firestore.FieldValue.serverTimestamp(),
      signOutEverywhereAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    options: { merge: true }
  });

  const deleteOperations = [...deleteRefs.values()].map((ref) => ({ type: 'delete', ref }));
  const updatedCount = await commitBatchOperations(updateOperations);
  const deletedCount = await commitBatchOperations(deleteOperations);

  return {
    userId: id,
    avatarUrl: profile?.avatarUrl || user.avatarUrl || user.avatar || '',
    deletedPostCount: deletedPostIds.size,
    deletedDocumentCount: deletedCount,
    updatedDocumentCount: updatedCount
  };
};

module.exports = {
  initializeFirestore,
  getFirestore,
  isQuotaError,
  // Posts
  savePosts,
  savePost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  // Upvotes
  addUpvote,
  removeUpvote,
  getUpvotes,
  getUpvoteCount,
  hasUserUpvoted,
  // Comments
  addComment,
  getComments,
  getCommentCount,
  // Bookmarks
  addBookmark,
  removeBookmark,
  getBookmarks,
  getBookmarkCount,
  hasUserBookmarked,
  // Messages
  saveMessage,
  getMessagesForUser,
  // Users
  saveUserProfile,
  getUserProfile,
  // User settings / support / reports
  getUserSettings,
  saveUserSettings,
  updateUserPresence,
  getActiveFriendPresence,
  createSupportMessage,
  createProblemReport,
  getProblemReportsForUser,
  // Friends
  getConnectionStatus,
  areFriends,
  createFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  getFriends,
  unfriend,
  // Study Circles
  saveStudyCircle,
  getStudyCircle,
  getStudyCircles,
  getStudyCirclesForUser,
  createStudyCircleInvites,
  leaveStudyCircle,
  deleteStudyCircle,
  acceptStudyCircleInvite,
  declineStudyCircleInvite,
  // Notifications
  createNotification,
  ensureFriendRequestNotifications,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotificationsForUser,
  getUnreadNotificationCount,
  deleteNotification,
  // Account/session management
  revokeUserSessions,
  deleteAccountData,
  deleteFirebaseAuthUser
};
