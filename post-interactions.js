/**
 * StudyHive Post Interactions
 * Backend-integrated upvote, bookmark, and insights/comments
 * Vanilla JavaScript with fallback to localStorage
 */

const PostInteractions = (() => {
  // ========================================
  // CONFIG & STATE
  // ========================================

  const API_BASE_URL = (window.StudyHiveConfig?.apiBaseUrl || 'http://localhost:5000/api').replace(/\/$/, '')
  const DEFAULT_PROFILE_AVATAR = './frontend/assets/profile-picture/default-profile-picture.webp'
  const PRODUCTION_PROFILE_AVATAR_BASE_URL = 'https://studyhive-saas.onrender.com/api/profile/avatar/'
  const PROFILE_AVATAR_PATH = '/api/profile/avatar/'
  const STORAGE_KEYS = {
    upvotes: 'studyhive_upvotes',
    bookmarks: 'studyhive_bookmarks',
    comments: 'studyhive_comments'
  }

  let isOnline = navigator.onLine
  let upvoteDelegationReady = false
  let insightsDelegationReady = false

  // Monitor connection status
  window.addEventListener('online', () => { isOnline = true })
  window.addEventListener('offline', () => { isOnline = false })

  function getPostId(element) {
      if (!element) {
          console.error('Post element not found');
          return null;
      }

      const post = element.closest('.post');
      
      if (!post) {
          console.error('Post container not found');
          return null;
      }

      return post.dataset.postId;
  }

  const getStorage = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key)) || {}
    } catch (e) {
      console.error(`Error reading ${key}:`, e)
      return {}
    }
  }

  const setStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (e) {
      console.error(`Error writing ${key}:`, e)
    }
  }

  const getCurrentUserId = () => {
    return localStorage.getItem('userId') || 'default-user'
  }

  const getCurrentUserName = () => {
    return localStorage.getItem('userFullName') || localStorage.getItem('userName') || 'You';
  };

  const getCurrentUserAvatar = () => {
    return normalizeProfileAvatarSource(localStorage.getItem('userAvatar') || DEFAULT_PROFILE_AVATAR);
  };

  function normalizeProfileAvatarSource(source) {
    const avatarSource = String(source || '').trim()

    if (!avatarSource) return avatarSource

    try {
      const parsedUrl = new URL(avatarSource, window.location.href)
      const isLocalApi = (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1')
        && parsedUrl.port === '5000'
        && parsedUrl.pathname.startsWith(PROFILE_AVATAR_PATH)

      if (isLocalApi) {
        const filename = parsedUrl.pathname.slice(PROFILE_AVATAR_PATH.length)
        return `${PRODUCTION_PROFILE_AVATAR_BASE_URL}${filename}${parsedUrl.search}`
      }
    } catch (error) {
      return avatarSource
    }

    return avatarSource
  }

  const getCurrentUserEmail = () => {
    return localStorage.getItem('userEmail') || 'user@studyhive.local';
  };

  const getAuthHeaders = () => {
    return {
      'x-user-id': getCurrentUserId(),
      'x-user-name': getCurrentUserName(),
      'x-user-avatar': getCurrentUserAvatar(),
      'x-user-email': getCurrentUserEmail()
    }
  }

  const formatCommentTimestamp = (timestamp) => {
    return window.StudyHiveTimestamps?.formatRelativeTimestamp(timestamp) || 'Just now';
  }

  // ========================================
  // UPVOTE FUNCTIONALITY
  // ========================================

  const isUpvoteButton = (button) => {
    return button && button.classList.contains('action-stat') && button.textContent.includes('Upvote')
  }

  const getVisibleCount = (button) => {
    const countSpan = button.querySelector('.count')

    if (!countSpan) {
      return 0
    }

    return parseInt(countSpan.textContent.match(/\d+/)?.[0], 10) || 0
  }

  const getBaseUpvoteCount = (button) => {
    if (!button.dataset.baseCount) {
      button.dataset.baseCount = String(getVisibleCount(button))
    }

    return Number(button.dataset.baseCount) || 0
  }

  const initUpvoteButtons = () => {
    document.querySelectorAll('.post .action-stat').forEach((button) => {
      if (isUpvoteButton(button)) {
        button.type = 'button'
        button.setAttribute('aria-pressed', 'false')
        getBaseUpvoteCount(button)

        if (button.dataset.statusLoaded === 'true') {
          updateUpvoteUI(button, {
            upvoted: button.dataset.upvoted === 'true',
            count: getVisibleCount(button)
          })
        } else {
          loadUpvoteStatus(button)
        }
      }
    })

    if (upvoteDelegationReady) return
    upvoteDelegationReady = true

    document.addEventListener('click', (event) => {
      const button = event.target.closest('.post .action-stat')

      if (!isUpvoteButton(button)) return

      handleUpvote(event)
    })
  }

  const loadUpvoteStatus = async (button) => {
    const postId = getPostId(button)

    if (!postId) return

    try {
      const baseCount = getBaseUpvoteCount(button)
      const response = await fetch(`${API_BASE_URL}/posts/${encodeURIComponent(postId)}/upvotes?baseCount=${baseCount}`, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Could not load upvote status')
      }

      const data = await response.json()
      updateUpvoteUI(button, data)
    } catch (error) {
      console.warn('Upvote status was not loaded:', error)
    }
  }

  const handleUpvote = async (e) => {
    e.preventDefault()

    const button = e.target.closest('.post .action-stat')
    const postId = getPostId(button)

    if (!postId || button.disabled) return

    try {
      button.disabled = true

      const response = await fetch(`${API_BASE_URL}/posts/${encodeURIComponent(postId)}/upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          baseCount: getBaseUpvoteCount(button)
        })
      })

      if (!response.ok) {
        throw new Error('Could not save upvote')
      }

      const data = await response.json()
      updateUpvoteUI(button, data)
    } catch (error) {
      console.error('Upvote failed:', error)
    } finally {
      button.disabled = false
    }
  }

  const updateUpvoteUI = (button, data) => {
    const countSpan = button.querySelector('.count')
    const upvoted = Boolean(data.upvoted)

    if (countSpan && typeof data.count === 'number') {
      countSpan.textContent = `(${data.count})`
      button.dataset.baseCount = String(data.count)
    }

    button.dataset.statusLoaded = 'true'
    button.dataset.upvoted = String(upvoted)
    button.classList.toggle('active', upvoted)
    button.setAttribute('aria-pressed', String(upvoted))
    button.style.color = upvoted ? 'var(--primary-yellow)' : 'inherit'
  }

  // ========================================
  // BOOKMARK FUNCTIONALITY
  // ========================================

  const isBookmarkButton = (button) => {
    return button && button.classList.contains('action-stat') && button.textContent.includes('Bookmark')
  }

  const syncBookmarkState = (postId, data = {}) => {
    if (!postId) return

    document.querySelectorAll('.post').forEach((postElement) => {
      if (String(postElement.dataset.postId) !== String(postId)) return

      postElement.querySelectorAll('.action-stat').forEach((button) => {
        if (isBookmarkButton(button)) {
          updateBookmarkUI(button, data)
        }
      })
    })
  }

  const initBookmarkButtons = () => {
    document.querySelectorAll('.post .action-stat').forEach((btn) => {
      if (isBookmarkButton(btn)) {
        if (btn.dataset.bookmarkReady === 'true') return

        btn.dataset.bookmarkReady = 'true'
        btn.addEventListener('click', handleBookmark);

        if (btn.dataset.statusLoaded === 'true') {
          updateBookmarkUI(btn, {
            bookmarked: btn.dataset.bookmarked === 'true'
          });
        } else {
          loadBookmarkStatus(btn);
        }
      }
    });
  };

  const loadBookmarkStatus = async (button) => {
    const postId = getPostId(button);

    if (!postId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/posts/${encodeURIComponent(postId)}/bookmarks`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Could not load bookmark status');
      }

      const data = await response.json();
      updateBookmarkUI(button, data);
    } catch (error) {
      console.warn('Bookmark status was not loaded:', error);
    }
  };

  const handleBookmark = async (e) => {
    e.preventDefault();
    
    const button = e.currentTarget;
    const postId = getPostId(button);

    if (!postId || button.disabled) return;

    try {
      button.disabled = true;

      const response = await fetch(`${API_BASE_URL}/posts/${encodeURIComponent(postId)}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        throw new Error('Could not save bookmark');
      }

      const data = await response.json();
      updateBookmarkUI(button, data);
      window.dispatchEvent(new CustomEvent('studyhive:bookmarkchange', {
        detail: {
          postId,
          bookmarked: Boolean(data.bookmarked),
          count: data.count
        }
      }));
    } catch (error) {
      console.error('Bookmark failed:', error);
    } finally {
      button.disabled = false;
    }
  };

  const updateBookmarkUI = (button, data = {}) => {
    button.dataset.statusLoaded = 'true';
    button.dataset.bookmarked = String(Boolean(data.bookmarked));

    if (data.bookmarked) {
      button.classList.add('active');
      button.style.color = 'var(--primary-yellow)';
    } else {
      button.classList.remove('active');
      button.style.color = 'inherit';
    }

    button.setAttribute('aria-pressed', String(Boolean(data.bookmarked)));
  };

  // ========================================
  // INSIGHTS / INLINE COMMENTS
  // ========================================

  const initInsightsButtons = () => {
    document.querySelectorAll('.post').forEach((post) => {
      const button = getInsightsButton(post);

      if (button) {
        button.type = 'button';
        button.setAttribute('aria-expanded', 'false');
        updateInsightCount(post);
      }
    });

    if (insightsDelegationReady) return;
    insightsDelegationReady = true;

    document.addEventListener('click', (event) => {
      const button = event.target.closest('.post .action-stat');

      if (!isInsightsButton(button)) return;

      handleInsightsClick(event);
    });
  };

  const handleInsightsClick = (e) => {
    e.preventDefault();

    const button = e.target.closest('.post .action-stat');
    const post = button.closest('.post');
    const panel = getOrCreateInsightsPanel(post);
    const shouldOpen = panel.hidden;

    panel.hidden = !shouldOpen;
    button.classList.toggle('active', shouldOpen);
    button.setAttribute('aria-expanded', String(shouldOpen));

    if (shouldOpen) {
      renderInlineComments(post, panel);
      panel.querySelector('.insights-comment-input').focus();
    }
  };

  const isInsightsButton = (button) => {
    return button && button.classList.contains('action-stat') && button.textContent.includes('Insights');
  };

  const getInsightsButton = (post) => {
    return Array.from(post.querySelectorAll('.action-stat')).find(isInsightsButton);
  };

  const getCommentsForPost = async (postId) => {
    const response = await fetch(`${API_BASE_URL}/posts/${encodeURIComponent(postId)}/comments`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Could not load comments');
    }

    return response.json();
  };

  const getOrCreateInsightsPanel = (post) => {
    let panel = post.querySelector('.inline-insights-panel');

    if (panel) return panel;

    panel = document.createElement('div');
    panel.className = 'inline-insights-panel';
    panel.hidden = true;
    panel.innerHTML = `
      <div class="inline-insights-header">
        <div>
          <span class="inline-insights-kicker">Insights</span>
          <h3>Comments</h3>
        </div>
      </div>
      <div class="inline-insights-list"></div>
      <div class="inline-insights-form">
        <img src="${getCurrentUserAvatar()}" alt="${getCurrentUserName()}" class="inline-insights-avatar">
        <input type="text" class="insights-comment-input" placeholder="Write a comment...">
        <button type="button" class="insights-comment-btn">Post</button>
      </div>
    `;

    const input = panel.querySelector('.insights-comment-input');
    const submitBtn = panel.querySelector('.insights-comment-btn');

    submitBtn.addEventListener('click', () => submitComment(post, panel));
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitComment(post, panel);
      }
    });

    post.querySelector('.post-actions').insertAdjacentElement('afterend', panel);

    return panel;
  };

  const renderInlineComments = async (post, panel) => {
    const postId = getPostId(post);
    const commentsList = panel.querySelector('.inline-insights-list');

    commentsList.innerHTML = '';

    let data;

    try {
      data = await getCommentsForPost(postId);
    } catch (error) {
      console.error('Loading comments failed:', error);
      data = { count: 0, comments: [] };
    }

    const postComments = data.comments || [];
    panel.dataset.commentCount = String(data.count || postComments.length);

    if (postComments.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'insights-empty';
      empty.textContent = 'No comments yet.';
      commentsList.appendChild(empty);
    } else {
      postComments.forEach((comment, index) => {
        commentsList.appendChild(createCommentElement(comment, index));
      });
    }

    updateInsightCount(post);
  };

  const submitComment = async (post, panel) => {
    const input = panel.querySelector('.insights-comment-input');
    const text = input.value.trim();

    if (!text) return;

    const postId = getPostId(post);
    const submitBtn = panel.querySelector('.insights-comment-btn');

    try {
      submitBtn.disabled = true;

      const response = await fetch(`${API_BASE_URL}/posts/${encodeURIComponent(postId)}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          text,
          author: getCurrentUserName(),
          avatar: getCurrentUserAvatar()
        })
      });

      if (!response.ok) {
        throw new Error('Could not post comment');
      }

      input.value = '';
      await renderInlineComments(post, panel);
      input.focus();
    } catch (error) {
      console.error('Comment failed:', error);
    } finally {
      submitBtn.disabled = false;
    }
  };

  const updateInsightCount = (post) => {
    const postId = getPostId(post);
    const button = getInsightsButton(post);

    if (!button) return;

    const countSpan = button.querySelector('.count');
    if (!countSpan) return;

    if (!button.dataset.baseCount) {
      button.dataset.baseCount = String(parseInt(countSpan.textContent.match(/\d+/)?.[0], 10) || 0);
    }

    const panel = post.querySelector('.inline-insights-panel');
    const hasLoadedCount = panel && Object.prototype.hasOwnProperty.call(panel.dataset, 'commentCount');
    const total = hasLoadedCount
      ? Number(panel.dataset.commentCount || 0)
      : Number(button.dataset.baseCount || 0);

    button.dataset.baseCount = String(total);
    countSpan.textContent = `(${total})`;
  };

  const createCommentElement = (comment, index) => {
    const el = document.createElement('div');
    el.className = 'insights-comment';

    const avatar = document.createElement('img');
    avatar.src = comment.avatar;
    avatar.alt = comment.author;
    avatar.className = 'insights-comment-avatar';

    const content = document.createElement('div');
    content.className = 'insights-comment-content';

    const header = document.createElement('div');
    header.className = 'insights-comment-header';

    const author = document.createElement('span');
    author.className = 'insights-comment-author';
    author.textContent = comment.author;

    const time = document.createElement('span');
    time.className = 'insights-comment-time';
    time.textContent = formatCommentTimestamp(comment.createdAt || comment.timestamp);

    const text = document.createElement('p');
    text.className = 'insights-comment-text';
    text.textContent = comment.text;

    header.append(author, time);
    content.append(header, text);
    el.append(avatar, content);

    return el;
  };

  // ========================================
  // PUBLIC API
  // ========================================

  return {
    init: () => {
      console.log('✅ Initializing Post Interactions...')
      console.log('📡 Backend URL:', API_BASE_URL)
      console.log('🌐 Online:', isOnline)

      initUpvoteButtons()
      initBookmarkButtons()
      initInsightsButtons()

      console.log('✅ Post interactions ready!')
    },

    // Set user info
    setUserInfo: (userId, fullName, avatar, email) => {
      localStorage.setItem('userId', userId)
      localStorage.setItem('userFullName', fullName)
      localStorage.setItem('userAvatar', normalizeProfileAvatarSource(avatar))
      localStorage.setItem('userEmail', email || 'user@studyhive.local')
    },

    // For debugging
    getUpvotes: () => getStorage(STORAGE_KEYS.upvotes),
    getBookmarks: () => getStorage(STORAGE_KEYS.bookmarks),
    getComments: () => getStorage(STORAGE_KEYS.comments),
    syncBookmarkState,
    clearAll: () => {
      localStorage.removeItem(STORAGE_KEYS.upvotes)
      localStorage.removeItem(STORAGE_KEYS.bookmarks)
      localStorage.removeItem(STORAGE_KEYS.comments)
      location.reload()
    },
    getStatus: () => ({
      online: isOnline,
      apiUrl: API_BASE_URL,
      userId: getCurrentUserId()
    })
  }
})()

window.PostInteractions = PostInteractions

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  PostInteractions.init()
})
