// StudyHive Dashboard
// Main page controller for feed composer and dashboard feature panels.
const StudyHive = window.StudyHive = window.StudyHive || {};
const API_BASE_URL = (window.StudyHiveConfig?.apiBaseUrl || 'http://localhost:5000/api').replace(/\/$/, '');
const DEFAULT_CATEGORY_OPTIONS = [
    { value: 'General', text: 'General' }
];
const DEFAULT_CIRCLE_AVATAR = '👥';
const DEFAULT_PROFILE_AVATAR = './frontend/assets/profile-picture/default-profile-picture.webp';
const PRODUCTION_PROFILE_AVATAR_BASE_URL = 'https://studyhive-saas.onrender.com/api/profile/avatar/';
const PROFILE_AVATAR_PATH = '/api/profile/avatar/';
const ACTIVE_FRIEND_WINDOW_MS = 5 * 60 * 1000;
const ACTIVE_FRIEND_REFRESH_MS = 60 * 1000;
const ENABLE_PRESENCE = false;
const FRIENDS_CACHE_MS = 30 * 1000;
const TimestampUtils = window.StudyHiveTimestamps;

let firebaseAuth = null;
let firebaseOnAuthStateChanged = null;
let firebaseSignOut = null;
let firebaseEmailAuthProvider = null;
let firebaseReauthenticateWithCredential = null;
let firebaseUpdatePassword = null;
let firebaseDb = null;
let firebaseCollection = null;
let firebaseQuery = null;
let firebaseWhere = null;
let firebaseOrderBy = null;
let firebaseLimit = null;
let firebaseOnSnapshot = null;
let firebaseDoc = null;
let firebaseSetDoc = null;
let authGatekeeperUnsubscribe = null;

const currentUser = {
    name: 'Girly R.',
    avatar: DEFAULT_PROFILE_AVATAR
};

StudyHive.currentUser = currentUser;

const postContent = document.getElementById('postContent');
const postCategory = document.getElementById('postCategory');
const postFile = document.getElementById('postFile');
const attachDocumentBtn = document.getElementById('attachDocumentBtn');
const selectedFileName = document.getElementById('selectedFileName');
const publishPostBtn = document.getElementById('publishPostBtn');
const feed = document.querySelector('.feed');
const navItems = document.querySelectorAll('.nav-item[data-section]');
const dashboardSections = document.querySelectorAll('.dashboard-section[data-section]');
const globalSearch = document.getElementById('globalSearch');
const globalSearchInput = document.getElementById('globalSearchInput');
const globalSearchButton = document.getElementById('globalSearchButton');
const globalSearchResults = document.getElementById('globalSearchResults');
const globalSearchStatus = document.getElementById('globalSearchStatus');
const globalSearchContent = document.getElementById('globalSearchContent');
const searchProfileModal = document.getElementById('searchProfileModal');
const searchProfileAvatar = document.getElementById('searchProfileAvatar');
const searchProfileName = document.getElementById('searchProfileName');
const searchProfileMeta = document.getElementById('searchProfileMeta');
const searchProfileBio = document.getElementById('searchProfileBio');
const searchProfileAddFriendBtn = document.getElementById('searchProfileAddFriendBtn');
const searchProfileMessageBtn = document.getElementById('searchProfileMessageBtn');
const searchProfileUnfriendBtn = document.getElementById('searchProfileUnfriendBtn');
const closeSearchProfileButtons = document.querySelectorAll('[data-close-search-profile]');
const notificationBell = document.getElementById('notificationBell');
const notificationBadge = document.getElementById('notificationBadge');
const notificationsContainer = document.getElementById('notificationsContainer');
const notificationsDropdown = document.getElementById('notificationsDropdown');
const notificationsList = document.getElementById('notificationsList');
const notificationsEmpty = document.getElementById('notificationsEmpty');
const markAllReadBtn = document.getElementById('markAllReadBtn');
const clearNotificationsBtn = document.getElementById('clearNotificationsBtn');
const friendSearchInput = document.getElementById('friendSearchInput');
const friendSearchBtn = document.getElementById('friendSearchBtn');
const friendSearchResults = document.getElementById('friendSearchResults');
const friendRequestsPanel = document.getElementById('friendRequestsPanel');
const friendRequestsList = document.getElementById('friendRequestsList');
const friendsList = document.getElementById('friendsList');
const changePhotoBtn = document.getElementById('changePhotoBtn');
const avatarUpload = document.getElementById('avatarUpload');
const profileAvatarPreview = document.getElementById('profileAvatarPreview');
const profileEditForm = document.getElementById('profileEditForm');
const profileFullName = document.getElementById('profileFullName');
const profileDisplayName = document.getElementById('profileDisplayName');
const profileUsername = document.getElementById('profileUsername');
const profileBio = document.getElementById('profileBio');
const profileSchool = document.getElementById('profileSchool');
const profileCourse = document.getElementById('profileCourse');
const profileYearLevel = document.getElementById('profileYearLevel');
const skillsList = document.getElementById('skillsList');
const skillInput = document.getElementById('skillInput');
const addSkillBtn = document.getElementById('addSkillBtn');
const cancelProfileEditBtn = document.getElementById('cancelProfileEditBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const profileToast = document.getElementById('profileToast');
const headerAvatar = document.querySelector('.avatar');
const headerUserName = document.querySelector('.user-name');
const profileHeadingName = document.querySelector('.profile-heading h1');
const profileHeadingMeta = document.querySelector('.profile-heading p');
const profilePostsStat = document.getElementById('profilePostsStat');
const profileReviewersStat = document.getElementById('profileReviewersStat');
const profileCirclesStat = document.getElementById('profileCirclesStat');
const settingsAccordion = document.getElementById('settingsAccordion');
const settingsEmail = document.getElementById('settingsEmail');
const settingsCurrentPassword = document.getElementById('settingsCurrentPassword');
const settingsNewPassword = document.getElementById('settingsNewPassword');
const settingsConfirmPassword = document.getElementById('settingsConfirmPassword');
const settingsPasswordFields = document.querySelectorAll('[data-password-field]');
const settingsProviderMessage = document.getElementById('settingsProviderMessage');
const settingsDarkModeSwitch = document.getElementById('settingsDarkModeSwitch');
const settingsToggleButtons = document.querySelectorAll('.settings-toggle[data-toggle]:not(#settingsDarkModeSwitch)');
const themeColorSelect = document.getElementById('themeColorSelect');
const fontSizeSelect = document.getElementById('fontSizeSelect');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const dangerActionButtons = document.querySelectorAll('[data-danger-action]');
const dangerConfirmModal = document.getElementById('dangerConfirmModal');
const dangerModalTitle = document.getElementById('dangerModalTitle');
const dangerModalMessage = document.getElementById('dangerModalMessage');
const confirmDangerActionBtn = document.getElementById('confirmDangerActionBtn');
const closeModalButtons = document.querySelectorAll('[data-close-modal]');
const helpSearchInput = document.getElementById('helpSearchInput');
const faqItems = document.querySelectorAll('[data-faq-item]');
const faqEmptyState = document.getElementById('faqEmptyState');
const supportForm = document.getElementById('supportForm');
const supportSubject = document.getElementById('supportSubject');
const supportMessage = document.getElementById('supportMessage');
const sendSupportBtn = document.getElementById('sendSupportBtn');
const reportForm = document.getElementById('reportForm');
const reportCategory = document.getElementById('reportCategory');
const reportTitle = document.getElementById('reportTitle');
const reportDescription = document.getElementById('reportDescription');
const reportCharacterCounter = document.getElementById('reportCharacterCounter');
const screenshotDropZone = document.getElementById('screenshotDropZone');
const reportScreenshot = document.getElementById('reportScreenshot');
const uploadScreenshotBtn = document.getElementById('uploadScreenshotBtn');
const screenshotFileName = document.getElementById('screenshotFileName');
const submitReportBtn = document.getElementById('submitReportBtn');
const priorityOptions = document.querySelectorAll('.priority-option');
const recentReportList = document.querySelector('.recent-report-list');
const addMemberBtn = document.getElementById('addMemberBtn');
const leaveCircleBtn = document.getElementById('leaveCircleBtn');
const deleteCircleBtn = document.getElementById('deleteCircleBtn');

let activeSkills = ['Java', 'Networking', 'Math'];
let savedProfileData = {
    fullName: 'Girly Reyes',
    displayName: 'Girly R.',
    username: 'girlyr',
    bio: 'Computer Science student building cleaner reviewers, study maps, and late-night debugging rituals.',
    school: 'StudyHive University',
    course: 'BS Computer Science',
    yearLevel: '3rd Year',
    avatar: currentUser.avatar,
    skills: [...activeSkills]
};
let savedUserSettings = null;
let toastTimer;
let pendingDangerAction = '';
let pendingLeaveCircle = null;
let pendingDeleteCircle = null;
let selectedStudyCircleId = null;
let circleModalMode = 'create';
let inviteTargetCircle = null;
let circleModalReturnFocus = null;

async function loadFirebaseAuth() {
    if (firebaseAuth && firebaseOnAuthStateChanged && firebaseSignOut && firebaseDb && firebaseOrderBy && firebaseOnSnapshot && firebaseSetDoc && firebaseUpdatePassword) {
        return true;
    }

    try {
        const firebase = await import('./firebase-config.js');
        firebaseAuth = firebase.auth;
        firebaseOnAuthStateChanged = firebase.onAuthStateChanged;
        firebaseSignOut = firebase.signOut;
        firebaseEmailAuthProvider = firebase.EmailAuthProvider;
        firebaseReauthenticateWithCredential = firebase.reauthenticateWithCredential;
        firebaseUpdatePassword = firebase.updatePassword;
        firebaseDb = firebase.db;
        firebaseCollection = firebase.collection;
        firebaseQuery = firebase.query;
        firebaseWhere = firebase.where;
        firebaseOrderBy = firebase.orderBy;
        firebaseLimit = firebase.limit;
        firebaseOnSnapshot = firebase.onSnapshot;
        firebaseDoc = firebase.doc;
        firebaseSetDoc = firebase.setDoc;
        return true;
    } catch (error) {
        console.warn('Firebase auth did not load. Redirecting to login.', error);
        return false;
    }
}

async function initAuthGatekeeper() {
    const firebaseReady = await loadFirebaseAuth();

    if (!firebaseReady) {
        window.location.href = 'Login.html';
        return false;
    }

    return new Promise((resolve) => {
        if (typeof authGatekeeperUnsubscribe === 'function') {
            authGatekeeperUnsubscribe();
            authGatekeeperUnsubscribe = null;
        }

        authGatekeeperUnsubscribe = firebaseOnAuthStateChanged(firebaseAuth, (user) => {
            if (typeof authGatekeeperUnsubscribe === 'function') {
                authGatekeeperUnsubscribe();
                authGatekeeperUnsubscribe = null;
            }

            if (!user) {
                console.log('No user detected, redirecting to login...');
                window.location.href = 'Login.html';
                resolve(false);
                return;
            }

            console.log('User verified:', user.email);
            saveUserSession(user);
            updateHeaderFromCurrentUser();
            resolve(true);
        });
    });
}

// Study Circles Data & Management
const availableUsers = [
    'Ryan',
    'Larry Lim',
    'Charisse Garcia',
    'Emma',
    'John Smith',
    'Sarah Johnson',
    'Alex Chen',
    'Jordan Lee'
];

let studyCircles = [];
let joinedStudyCircles = [];
let pendingInvitations = [];
let selectedCircleMembers = [];
let acceptedFriends = [];
let loadedPosts = [];
let postAuthorProfileCache = new Map();
let userPresenceById = new Map();
let activeFriendsFromPresence = [];
let activeFriendsPresenceLoadedAt = 0;
let friendRequests = { incoming: [], outgoing: [] };
let friendDataLoaded = false;
let friendSearchTimer = null;
let friendsLoadedAt = 0;
let friendsLoadPromise = null;
let activeFriendSearchController = null;
let lastFriendSearchQuery = '';
let activeSearchProfileUser = null;
let avatarPreviewObjectUrl = '';

function resetFriendState() {
    acceptedFriends = [];
    friendRequests = { incoming: [], outgoing: [] };
    friendDataLoaded = false;
    inboxConversations = [];

    renderFriendRequests();
    renderFriendsList();
    renderActiveFriendsList();
    renderConversationList();
    renderMemberCheckboxes(document.getElementById('memberSearch')?.value || '');
    updateProfileStats();
}

// Get existing circles from localStorage or initialize with defaults
function getStudyCircles() {
    const stored = localStorage.getItem('studyhive-circles');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return [];
        }
    }
    return [];
}

function saveStudyCircles(circles) {
    localStorage.setItem('studyhive-circles', JSON.stringify(circles));
}

function getPendingInvitations() {
    const stored = localStorage.getItem('studyhive-pending-invitations');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return [];
        }
    }
    return [];
}

function savePendingInvitations(invitations) {
    localStorage.setItem('studyhive-pending-invitations', JSON.stringify(invitations));
}

function generateCircleId() {
    return 'circle-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function generateInviteLink(circleId) {
    return `studyhive.com/join/${circleId}`;
}

function createCircleSlug(name) {
    return String(name || 'circle')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'circle';
}

function normalizeCircleForUi(circle) {
    if (!circle || !circle.name) return null;

    const name = String(circle.name).trim();
    if (!name) return null;

    const id = circle.id || `circle-${createCircleSlug(name)}`;
    const rawMembers = Array.isArray(circle.members) ? circle.members : [];
    const members = [...new Set(rawMembers.map(member => String(member).trim()).filter(Boolean))];
    const hasExplicitMemberIds = circle.hasExplicitMemberIds === false
        ? false
        : Array.isArray(circle.memberIds);
    const rawMemberIds = hasExplicitMemberIds ? circle.memberIds : [];
    const memberIds = [...new Set(rawMemberIds.map(memberId => String(memberId).trim()).filter(Boolean))];
    return {
        id,
        name,
        description: String(circle.description || '').trim(),
        createdBy: circle.createdBy || currentUser.name,
        createdById: circle.createdById || '',
        members,
        memberIds,
        hasExplicitMemberIds,
        createdAt: circle.createdAt || new Date().toISOString(),
        inviteLink: circle.inviteLink || generateInviteLink(id),
        avatar: circle.avatar || DEFAULT_CIRCLE_AVATAR
    };
}

function mergeStudyCircles(...circleGroups) {
    return circleGroups.flat().reduce((merged, circle) => {
        const normalizedCircle = normalizeCircleForUi(circle);
        if (!normalizedCircle) return merged;

        const existingIndex = merged.findIndex(existingCircle =>
            existingCircle.id === normalizedCircle.id ||
            existingCircle.name.toLowerCase() === normalizedCircle.name.toLowerCase()
        );

        if (existingIndex === -1) {
            merged.push(normalizedCircle);
            return merged;
        }

        const existingCircle = merged[existingIndex];
        merged[existingIndex] = {
            ...existingCircle,
            ...normalizedCircle,
            hasExplicitMemberIds: existingCircle.hasExplicitMemberIds || normalizedCircle.hasExplicitMemberIds,
            members: [...new Set([...existingCircle.members, ...normalizedCircle.members])],
            memberIds: [...new Set([...(existingCircle.memberIds || []), ...(normalizedCircle.memberIds || [])])]
        };

        return merged;
    }, []);
}

function normalizeMembershipValue(value) {
    return String(value || '').trim().toLowerCase();
}

function getCurrentUserMembershipValues() {
    return new Set([
        getCurrentUserId(),
        currentUser.name,
        localStorage.getItem('userName'),
        localStorage.getItem('userFullName'),
        localStorage.getItem('userEmail')
    ].map(normalizeMembershipValue).filter(Boolean));
}

function getFriendName(friend = {}) {
    return friend.displayName || friend.name || friend.fullName || friend.username || friend.email || 'StudyHive User';
}

function getFriendPresence(friend = {}) {
    return userPresenceById.get(String(friend.id || friend.uid || friend.userId || '')) || null;
}

function normalizePresenceFriend(friend = {}) {
    return {
        ...friend,
        id: friend.id || friend.userId || friend.uid,
        displayName: friend.displayName || friend.name || friend.fullName || friend.presence?.displayName || 'StudyHive User',
        avatarUrl: getInboxProfileAvatarSource(friend.avatarUrl, friend.avatar, friend.presence?.avatarUrl)
    };
}

function isPresenceActive(presence = {}) {
    if (!presence || presence.active === false || presence.onlineVisible === false) return false;

    const lastActiveAt = getTimestampValueMillis(presence.lastActiveAt || presence.updatedAt);
    return Boolean(lastActiveAt && Date.now() - lastActiveAt <= ACTIVE_FRIEND_WINDOW_MS);
}

function getActiveFriends() {
    if (activeFriendsFromPresence.length > 0) {
        return activeFriendsFromPresence.map(normalizePresenceFriend);
    }

    return acceptedFriends.filter((friend) => isPresenceActive(getFriendPresence(friend)));
}

function renderActiveFriendsList() {
    const activeMembers = document.querySelector('.active-members');
    if (!activeMembers) return;

    activeMembers.innerHTML = '';

    const activeFriends = getActiveFriends();

    if (activeFriends.length === 0) {
        const message = acceptedFriends.length === 0
            ? 'Add friends to see who is active.'
            : 'No friends active right now.';
        activeMembers.appendChild(createTextElement('p', 'active-empty-state', message));
        return;
    }

    activeFriends.forEach((friend) => {
        const memberItem = document.createElement('div');
        memberItem.className = 'member-item';
        const statusDot = document.createElement('div');
        statusDot.className = 'status-dot';
        memberItem.append(statusDot, createTextElement('span', '', getFriendName(friend)));
        activeMembers.appendChild(memberItem);
    });
}

function isJoinedStudyCircle(circle) {
    if (!circle) return false;

    const currentUserId = normalizeMembershipValue(getCurrentUserId());
    const memberIdsAreAuthoritative = circle.hasExplicitMemberIds === true;
    const memberIds = Array.isArray(circle.memberIds)
        ? circle.memberIds.map(normalizeMembershipValue).filter(Boolean)
        : [];

    if (memberIdsAreAuthoritative) {
        return Boolean(currentUserId && memberIds.includes(currentUserId));
    }

    const createdById = normalizeMembershipValue(circle.createdById);
    if (currentUserId && createdById && createdById === currentUserId) {
        return true;
    }

    const currentUserValues = getCurrentUserMembershipValues();
    const members = Array.isArray(circle.members) ? circle.members : [];
    return members.some(member => currentUserValues.has(normalizeMembershipValue(member)));
}

function getJoinedStudyCircles(circles = studyCircles) {
    return mergeStudyCircles(circles).filter(isJoinedStudyCircle);
}

function isCurrentUserCircleAdmin(circle) {
    const currentUserId = normalizeMembershipValue(getCurrentUserId());
    if (!currentUserId || !circle) return false;

    const rawAdminIds = [
        circle.createdById,
        circle.ownerId,
        ...(Array.isArray(circle.adminIds) ? circle.adminIds : []),
        ...(Array.isArray(circle.adminUserIds) ? circle.adminUserIds : []),
        ...(Array.isArray(circle.admins)
            ? circle.admins.map(adminUser => (
                typeof adminUser === 'string'
                    ? adminUser
                    : adminUser?.id || adminUser?.uid || adminUser?.userId
            ))
            : [])
    ];

    return rawAdminIds.some(adminId => normalizeMembershipValue(adminId) === currentUserId);
}

function isCurrentUserCircleOwner(circle) {
    const currentUserId = normalizeMembershipValue(getCurrentUserId());
    if (!currentUserId || !circle) return false;

    return [circle.createdById, circle.ownerId]
        .some(ownerId => normalizeMembershipValue(ownerId) === currentUserId);
}

function syncStudyCircleViews(circles = studyCircles, { persist = false } = {}) {
    studyCircles = mergeStudyCircles(circles);
    joinedStudyCircles = getJoinedStudyCircles(studyCircles);

    if (persist) {
        saveStudyCircles(joinedStudyCircles);
    }

    populateCategorySelectDropdown(joinedStudyCircles);
    updateStudyCirclesList(joinedStudyCircles);
    renderMemberCheckboxes(document.getElementById('memberSearch')?.value || '');
    updateProfileStats();
    syncFriendConversations();
    applyRealtimeMessagesToConversations(realtimeMessagesCache);
}

function createCircleObject(name, description, memberIds) {
    const circleId = generateCircleId();
    return normalizeCircleForUi({
        id: circleId,
        name,
        description,
        createdBy: currentUser.name,
        createdById: getCurrentUserId(),
        members: [currentUser.name],
        memberIds: [getCurrentUserId()],
        createdAt: new Date().toISOString(),
        inviteLink: generateInviteLink(circleId),
        avatar: DEFAULT_CIRCLE_AVATAR
    });
}

function addCircle(name, description, memberIds) {
    const circle = createCircleObject(name, description, memberIds);
    syncStudyCircleViews([...studyCircles, circle], { persist: true });
    return circle;
}

// Fetch study circles from backend
async function fetchStudyCirclesFromBackend() {
    try {
        const response = await fetch(`${API_BASE_URL}/circles`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`GET /circles failed with ${response.status}`);
        }

        const backendCircles = await response.json();
        studyCircles = mergeStudyCircles(backendCircles);
        syncStudyCircleViews(studyCircles, { persist: true });
        return joinedStudyCircles;
    } catch (error) {
        console.error('Error fetching study circles:', error);
        syncStudyCircleViews(studyCircles);
    }
    return [];
}

function renderCategoryOptions(selectElement, circles = joinedStudyCircles, selectedValue = 'General') {
    if (!selectElement) return;

    const selectedCategory = selectedValue || selectElement.value || 'General';
    const joinedCircles = getJoinedStudyCircles(circles);
    const addedValues = new Set();
    selectElement.innerHTML = '';

    DEFAULT_CATEGORY_OPTIONS.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        selectElement.appendChild(opt);
        addedValues.add(option.value.toLowerCase());
    });

    if (joinedCircles.length > 0) {
        const separator = document.createElement('option');
        separator.disabled = true;
        separator.textContent = '--- My Study Circles ---';
        selectElement.appendChild(separator);

        joinedCircles.forEach(circle => {
            const optionValue = String(circle.name || '').trim();
            if (!optionValue || addedValues.has(optionValue.toLowerCase())) return;

            const opt = document.createElement('option');
            opt.value = optionValue;
            opt.textContent = `👥 ${optionValue}`;
            selectElement.appendChild(opt);
            addedValues.add(optionValue.toLowerCase());
        });
    }

    if ([...selectElement.options].some(option => option.value === selectedCategory)) {
        selectElement.value = selectedCategory;
    } else {
        selectElement.value = 'General';
    }
}

// Populate category-select dropdown with General plus joined study circles only.
function populateCategorySelectDropdown(circles = joinedStudyCircles) {
    renderCategoryOptions(document.getElementById('postCategory'), circles, postCategory?.value || 'General');
    populateEditPostCategorySelect();
}

function populateEditPostCategorySelect(selectedValue) {
    const editCategorySelect = document.getElementById('editPostCategory');
    if (!editCategorySelect) return;

    renderCategoryOptions(editCategorySelect, joinedStudyCircles, selectedValue || editCategorySelect.value || 'General');
}

function getCurrentUserRequestHeaders() {
    return getAuthHeaders();
}

// Send study circle creation to backend
async function sendCircleToBackend(name, description, memberIds) {
    try {
        const response = await fetch(`${API_BASE_URL}/circles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getCurrentUserRequestHeaders()
            },
            body: JSON.stringify({
                name,
                description,
                inviteeIds: memberIds
            })
        });

        const responseBody = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(responseBody.error || `POST /circles failed with ${response.status}`);
        }

        return normalizeCircleForUi(responseBody);
    } catch (error) {
        console.error('Error sending circle to backend:', error);
    }
    return null;
}

async function sendCircleInvitesToBackend(circleId, memberIds) {
    try {
        const response = await fetch(`${API_BASE_URL}/circles/${encodeURIComponent(circleId)}/invites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getCurrentUserRequestHeaders()
            },
            body: JSON.stringify({
                inviteeIds: memberIds
            })
        });

        const responseBody = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(responseBody.error || `POST /circles/${circleId}/invites failed with ${response.status}`);
        }

        return responseBody;
    } catch (error) {
        console.error('Error inviting study circle members:', error);
        showToast(error.message || 'Could not invite members');
        return null;
    }
}

function createInvitation(circleId, circleName, fromUser, toUser) {
    return {
        id: 'inv-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        circleId,
        circleName,
        fromUser,
        toUser,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
}

function addInvitations(circleId, circleName, fromUser, toUserList) {
    const newInvitations = toUserList.map(user =>
        createInvitation(circleId, circleName, fromUser, user)
    );
    pendingInvitations.push(...newInvitations);
    savePendingInvitations(pendingInvitations);
}

function acceptInvitation(invitationId) {
    const invitation = pendingInvitations.find(inv => inv.id === invitationId);
    if (!invitation) return false;

    pendingInvitations = pendingInvitations.filter(inv => inv.id !== invitationId);
    savePendingInvitations(pendingInvitations);
    return true;
}

function declineInvitation(invitationId) {
    pendingInvitations = pendingInvitations.filter(inv => inv.id !== invitationId);
    savePendingInvitations(pendingInvitations);
    return true;
}

function createTextElement(tagName, className, textContent) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = textContent;
    return element;
}

StudyHive.createTextElement = createTextElement;

function getCurrentUserId() {
    return localStorage.getItem('userId') || 'default-user';
}

function getDisplayName(user, fallbackName = '') {
    if (user?.displayName) return user.displayName;
    if (fallbackName) return fallbackName;
    if (user?.email) return user.email.split('@')[0];
    return 'StudyHive User';
}

function getProviderIds(user = firebaseAuth?.currentUser) {
    return (user?.providerData || [])
        .map((provider) => provider?.providerId)
        .filter(Boolean);
}

async function getCurrentSignInProvider(user = firebaseAuth?.currentUser) {
    if (!user) return '';

    try {
        const tokenResult = await user.getIdTokenResult();
        return tokenResult?.signInProvider
            || tokenResult?.claims?.firebase?.sign_in_provider
            || '';
    } catch (error) {
        console.warn('Could not resolve auth provider from ID token:', error);
        return '';
    }
}

async function applyAuthProviderSettings(user = firebaseAuth?.currentUser) {
    if (!settingsPasswordFields.length && !settingsProviderMessage) return;

    const providerIds = getProviderIds(user);
    const signInProvider = await getCurrentSignInProvider(user);
    const provider = signInProvider || providerIds[0] || 'password';
    const isGoogleManagedAccount = provider === 'google.com'
        || (!signInProvider && providerIds.includes('google.com') && !providerIds.includes('password'));

    localStorage.setItem('authProvider', provider);

    settingsPasswordFields.forEach((field) => {
        field.disabled = isGoogleManagedAccount;
        field.value = isGoogleManagedAccount ? '' : field.value;
    });

    if (settingsProviderMessage) {
        settingsProviderMessage.hidden = !isGoogleManagedAccount;
        settingsProviderMessage.textContent = 'This account is managed through Google Sign-In.';
    }
}

function saveUserSession(user) {
    const previousUserId = localStorage.getItem('userId');
    const displayName = getDisplayName(user, localStorage.getItem('userName') || '');
    const avatar = normalizeProfileAvatarSource(user.photoURL || localStorage.getItem('userAvatar') || DEFAULT_PROFILE_AVATAR);
    const providerIds = getProviderIds(user);

    if (previousUserId && previousUserId !== user.uid) {
        stopRealtimeListeners();
        resetFriendState();
        postAuthorProfileCache.clear();
    }

    if (previousUserId !== user.uid || !localStorage.getItem('studyhive-session-started-at')) {
        localStorage.setItem('studyhive-session-started-at', String(Date.now()));
    }

    localStorage.setItem('userId', user.uid);
    localStorage.setItem('userName', displayName);
    localStorage.setItem('userFullName', displayName);
    localStorage.setItem('userEmail', user.email || '');
    localStorage.setItem('userAvatar', avatar);
    localStorage.setItem('authProvider', providerIds[0] || 'password');

    currentUser.name = displayName;
    currentUser.avatar = avatar;
    cacheCurrentUserAuthorProfile({
        displayName,
        fullName: displayName,
        avatarUrl: avatar
    });

    if (window.PostInteractions && typeof window.PostInteractions.setUserInfo === 'function') {
        window.PostInteractions.setUserInfo(user.uid, displayName, avatar, user.email);
    }

    applyAuthProviderSettings(user);
}

function updateHeaderFromCurrentUser() {
    if (headerUserName) {
        headerUserName.textContent = currentUser.name;
    }

    if (headerAvatar) {
        headerAvatar.src = normalizeProfileAvatarSource(currentUser.avatar);
        headerAvatar.alt = currentUser.name;
    }
}

function isInlineImageSource(source) {
    return /^(data|blob):/i.test(String(source || ''));
}

function normalizeProfileAvatarSource(source) {
    const avatarSource = String(source || '').trim();

    if (!avatarSource) return avatarSource;

    try {
        const parsedUrl = new URL(avatarSource, window.location.href);
        const isLocalApi = (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1')
            && parsedUrl.port === '5000'
            && parsedUrl.pathname.startsWith(PROFILE_AVATAR_PATH);

        if (isLocalApi) {
            const filename = parsedUrl.pathname.slice(PROFILE_AVATAR_PATH.length);
            return `${PRODUCTION_PROFILE_AVATAR_BASE_URL}${filename}${parsedUrl.search}`;
        }
    } catch (error) {
        return avatarSource;
    }

    return avatarSource;
}

function getPersistableAvatarSource(source) {
    const avatarSource = normalizeProfileAvatarSource(source);
    return isInlineImageSource(avatarSource) ? '' : avatarSource;
}

function getAuthHeaders() {
    const avatarSource = localStorage.getItem('userAvatar') || currentUser.avatar;

    return {
        'x-user-id': getCurrentUserId(),
        'x-user-name': localStorage.getItem('userName') || localStorage.getItem('userFullName') || currentUser.name,
        'x-user-avatar': getPersistableAvatarSource(avatarSource) || DEFAULT_PROFILE_AVATAR,
        'x-user-email': localStorage.getItem('userEmail') || ''
    };
}

function getPostAuthorUserId(post = {}) {
    return String(post.userId || post.ownerId || post.createdById || post.uid || '').trim();
}

function isProfileCachePromise(value) {
    return value && typeof value.then === 'function';
}

function normalizeAuthorProfile(profile = {}, fallback = {}) {
    const displayName = String(
        profile.displayName
        || profile.nickname
        || profile.fullName
        || profile.realName
        || profile.name
        || fallback.displayName
        || fallback.name
        || ''
    ).trim();
    const fullName = String(profile.fullName || profile.realName || fallback.fullName || displayName || '').trim();
    const avatarUrl = normalizeProfileAvatarSource(
        profile.avatarUrl
        || profile.avatar
        || fallback.avatarUrl
        || fallback.avatar
        || DEFAULT_PROFILE_AVATAR
    );

    return {
        id: String(profile.id || profile.uid || fallback.id || '').trim(),
        uid: String(profile.uid || profile.id || fallback.uid || '').trim(),
        displayName: displayName || fullName || 'StudyHive User',
        fullName: fullName || displayName || 'StudyHive User',
        avatarUrl: avatarUrl || DEFAULT_PROFILE_AVATAR
    };
}

function cacheCurrentUserAuthorProfile(profile = {}) {
    const userId = getCurrentUserId();

    if (!userId) return null;

    const cachedProfile = normalizeAuthorProfile({
        ...profile,
        id: userId,
        uid: userId,
        displayName: profile.displayName || localStorage.getItem('userName') || currentUser.name,
        fullName: profile.fullName || localStorage.getItem('userFullName') || profile.displayName || currentUser.name,
        avatarUrl: profile.avatarUrl || profile.avatar || localStorage.getItem('userAvatar') || currentUser.avatar
    });

    postAuthorProfileCache.set(userId, cachedProfile);
    return cachedProfile;
}

function getCachedPostAuthorProfile(userId) {
    const cachedProfile = postAuthorProfileCache.get(String(userId || '').trim());
    return isProfileCachePromise(cachedProfile) ? null : cachedProfile;
}

function getFallbackPostAuthor(post = {}) {
    return {
        name: String(
            post.authorName
            || post.userName
            || post.author
            || post.createdBy
            || currentUser.name
            || 'StudyHive User'
        ).trim(),
        avatar: String(
            post.authorAvatar
            || post.avatar
            || post.avatarUrl
            || currentUser.avatar
            || DEFAULT_PROFILE_AVATAR
        ).trim()
    };
}

function getPostAuthorDisplay(post = {}) {
    const profile = getCachedPostAuthorProfile(getPostAuthorUserId(post));
    const fallback = getFallbackPostAuthor(post);

    return {
        name: profile?.displayName || profile?.fullName || fallback.name || 'StudyHive User',
        avatar: profile?.avatarUrl || profile?.avatar || fallback.avatar || DEFAULT_PROFILE_AVATAR
    };
}

function shouldFetchPostAuthorProfile(post = {}) {
    const userId = getPostAuthorUserId(post);
    return Boolean(userId) && !post.degraded && !userId.startsWith('seed-user-');
}

async function fetchPostAuthorProfile(post = {}) {
    const userId = getPostAuthorUserId(post);

    if (!userId) return null;

    const cachedProfile = postAuthorProfileCache.get(userId);
    if (cachedProfile !== undefined) {
        return cachedProfile;
    }

    if (userId === getCurrentUserId()) {
        return cacheCurrentUserAuthorProfile();
    }

    if (!shouldFetchPostAuthorProfile(post)) {
        postAuthorProfileCache.set(userId, null);
        return null;
    }

    const request = fetch(`${API_BASE_URL}/profile/${encodeURIComponent(userId)}`, {
        headers: getAuthHeaders()
    })
        .then(async (response) => {
            if (response.status === 404) return null;

            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.profile) return null;

            return normalizeAuthorProfile(data.profile, { id: userId, uid: userId });
        })
        .catch(() => null);

    postAuthorProfileCache.set(userId, request);
    const profile = await request;
    postAuthorProfileCache.set(userId, profile);
    return profile;
}

function applyPostAuthorProfile(post = {}) {
    const author = getPostAuthorDisplay(post);

    return {
        ...post,
        displayUserName: author.name,
        displayAvatar: author.avatar
    };
}

async function hydratePostsWithAuthorProfiles(posts = []) {
    const postList = Array.isArray(posts) ? posts : [];
    const profileRequests = new Map();

    postList.forEach((post) => {
        const userId = getPostAuthorUserId(post);

        if (userId && !profileRequests.has(userId) && shouldFetchPostAuthorProfile(post)) {
            profileRequests.set(userId, fetchPostAuthorProfile(post));
        }
    });

    await Promise.all(profileRequests.values());
    return postList.map(applyPostAuthorProfile);
}

function updateRenderedPostAuthorProfile(userId) {
    const profile = getCachedPostAuthorProfile(userId);

    if (!profile) return;

    const displayName = profile.displayName || profile.fullName || 'StudyHive User';
    const avatarUrl = profile.avatarUrl || DEFAULT_PROFILE_AVATAR;

    loadedPosts = loadedPosts.map((post) => {
        if (getPostAuthorUserId(post) !== String(userId)) return post;
        return applyPostAuthorProfile(post);
    });

    document.querySelectorAll('.post').forEach((postElement) => {
        if (postElement.dataset.ownerId !== String(userId)) return;

        const nameElement = postElement.querySelector('.post-user-name');
        const avatarElement = postElement.querySelector('.post-avatar');

        if (nameElement) nameElement.textContent = displayName;
        if (avatarElement) {
            avatarElement.src = avatarUrl;
            avatarElement.alt = displayName;
        }
    });

    document.querySelectorAll('.bookmarked-item').forEach((itemElement) => {
        if (itemElement.dataset.ownerId !== String(userId)) return;

        const nameElement = itemElement.querySelector('.bookmarked-item-title');
        const avatarElement = itemElement.querySelector('.post-avatar');

        if (nameElement) nameElement.textContent = displayName;
        if (avatarElement) {
            avatarElement.src = avatarUrl;
            avatarElement.alt = displayName;
        }
    });
}

async function getFirebaseAccountActionHeaders() {
    const headers = getAuthHeaders();
    const firebaseReady = await loadFirebaseAuth();
    const user = firebaseReady ? firebaseAuth.currentUser : null;

    if (!user) {
        throw new Error('Please sign in again before changing account access.');
    }

    headers.Authorization = `Bearer ${await user.getIdToken()}`;
    return headers;
}

function getFriendById(friendId) {
    return acceptedFriends.find(friend => String(friend.id) === String(friendId));
}

function getLocalConnectionStatus(userId) {
    const id = String(userId || '');

    const acceptedFriend = getFriendById(id);
    if (acceptedFriend) {
        return {
            status: 'accepted',
            direction: 'friend',
            friend: acceptedFriend,
            friendshipId: acceptedFriend.friendshipId || null
        };
    }

    const incoming = (friendRequests.incoming || []).find(request => String(request.fromUserId) === id);
    if (incoming) {
        return {
            status: incoming.status || 'pending',
            direction: 'incoming',
            requestId: incoming.id
        };
    }

    const outgoing = (friendRequests.outgoing || []).find(request => String(request.toUserId) === id);
    if (outgoing) {
        return {
            status: outgoing.status || 'pending',
            direction: 'outgoing',
            requestId: outgoing.id
        };
    }

    return { status: 'none', direction: 'none' };
}

function getFriendDisplayName(friendId) {
    const friend = getFriendById(friendId);
    return friend?.displayName || friend?.name || 'StudyHive User';
}

function getFriendMeta(friend) {
    const username = friend.username ? `@${friend.username}` : '';
    const email = friend.email || '';
    return username || email || 'Connected friend';
}

function getInitials(value = '') {
    const parts = String(value || 'StudyHive User').trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase() || 'SH';
}

function getInboxProfileAvatarSource(...sources) {
    for (const source of sources) {
        const avatarSource = normalizeProfileAvatarSource(source);

        if (avatarSource && isImageSearchAvatar(avatarSource)) {
            return avatarSource;
        }
    }

    return '';
}

function createInboxInitialsAvatar(className, name) {
    const avatar = createTextElement('div', className, getInitials(name));
    avatar.style.backgroundColor = getAvatarColor(name);
    avatar.style.display = 'flex';
    avatar.style.alignItems = 'center';
    avatar.style.justifyContent = 'center';
    return avatar;
}

function normalizeInboxFriend(friend = {}) {
    const displayName = friend.displayName || friend.name || friend.fullName || friend.username || friend.email || 'StudyHive User';
    const avatarUrl = getInboxProfileAvatarSource(friend.avatarUrl, friend.avatar, friend.photoURL);

    return {
        ...friend,
        id: friend.id || friend.userId || friend.uid,
        displayName,
        avatarUrl,
        avatar: avatarUrl || friend.avatar || ''
    };
}

function normalizeInboxFriendRequest(request = {}) {
    return {
        ...request,
        fromAvatar: getInboxProfileAvatarSource(request.fromAvatar),
        toAvatar: getInboxProfileAvatarSource(request.toAvatar)
    };
}

function buildFriendshipConversationId(friend) {
    const friendshipId = friend.friendshipId || [getCurrentUserId(), friend.id].sort().join('_');
    return `friend-${friendshipId}`;
}

function buildFriendConversation(friend) {
    const normalizedFriend = normalizeInboxFriend(friend);
    const displayName = normalizedFriend.displayName || normalizedFriend.name || 'StudyHive User';

    return {
        id: buildFriendshipConversationId(normalizedFriend),
        name: displayName,
        avatar: getInitials(displayName),
        avatarUrl: normalizedFriend.avatarUrl,
        preview: 'Start a conversation',
        members: [currentUser.name, displayName],
        memberUserIds: [normalizedFriend.id],
        friendId: normalizedFriend.id,
        isFriendConversation: true
    };
}

function buildStudyCircleConversationId(circle) {
    return `study-circle-${String(circle?.id || '').trim()}`;
}

function buildStudyCircleConversation(circle) {
    const currentUserId = getCurrentUserId();
    const circleName = circle.name || 'Study Circle';
    const memberIds = Array.isArray(circle.memberIds)
        ? circle.memberIds.map(memberId => String(memberId).trim()).filter(Boolean)
        : [];
    const participantIds = [...new Set([currentUserId, ...memberIds].filter(Boolean))];
    const memberUserIds = participantIds.filter(memberId => String(memberId) !== String(currentUserId));
    const members = [...new Set([
        currentUser.name,
        ...(Array.isArray(circle.members) ? circle.members : [])
    ].map(member => String(member || '').trim()).filter(Boolean))];

    return {
        id: buildStudyCircleConversationId(circle),
        name: circleName,
        avatar: circle.avatar || getInitials(circleName),
        preview: 'Study circle group chat',
        members: members.length > 0 ? members : ['Study circle members'],
        memberUserIds,
        participantIds,
        circleId: circle.id,
        conversationType: 'study_circle',
        isStudyCircleConversation: true
    };
}

function formatFileSize(bytes) {
    if (!bytes) return '';

    const kilobytes = bytes / 1024;

    if (kilobytes < 1024) {
        return `${kilobytes.toFixed(1)} KB`;
    }

    return `${(kilobytes / 1024).toFixed(1)} MB`;
}

function resolveAttachmentUrl(fileUrl) {
    if (!fileUrl) return '';

    if (/^https?:\/\//i.test(fileUrl)) {
        return fileUrl;
    }

    if (fileUrl.startsWith('/api/')) {
        return `${getApiOrigin()}${fileUrl}`;
    }

    return fileUrl;
}

function getApiOrigin() {
    try {
        return new URL(API_BASE_URL, window.location.href).origin;
    } catch (error) {
        return API_BASE_URL.replace(/\/api\/?$/i, '');
    }
}

function getPostAttachmentData(post) {
    const attachment = post.attachment || {};

    return {
        fileName: post.fileName || post.fileOriginalName || attachment.originalName || '',
        fileSize: post.fileSize || attachment.sizeFormatted || '',
        fileUrl: resolveAttachmentUrl(post.fileUrl || attachment.url || '')
    };
}

function createPostAttachment(fileName, fileSize, fileUrl = '') {
    if (!fileName) return null;

    const attachment = document.createElement(fileUrl ? 'a' : 'div');
    attachment.className = 'post-attachment';

    if (fileUrl) {
        attachment.href = resolveAttachmentUrl(fileUrl);
        attachment.download = fileName;
        attachment.target = '_blank';
        attachment.rel = 'noopener';
        attachment.title = `Download ${fileName}`;
    }

    attachment.append(
        createTextElement('span', 'attachment-icon', '📄'),
        createTextElement('span', 'attachment-name', fileName),
        createTextElement('span', 'attachment-size', fileSize ? `(${fileSize})` : '(local file)')
    );

    return attachment;
}

function createPostAttachmentMarkup(post) {
    const { fileName, fileSize, fileUrl } = getPostAttachmentData(post);

    if (!fileName) return '';

    const wrapper = document.createElement(fileUrl ? 'a' : 'div');
    wrapper.className = 'post-attachment saved-post-attachment';

    if (fileUrl) {
        wrapper.href = fileUrl;
        wrapper.download = fileName;
        wrapper.target = '_blank';
        wrapper.rel = 'noopener';
        wrapper.title = `Download ${fileName}`;
    }

    wrapper.append(
        createTextElement('span', 'attachment-icon', '📄'),
        createTextElement('span', 'attachment-name', fileName),
        createTextElement('span', 'attachment-size', fileSize ? `(${fileSize})` : '')
    );

    return wrapper.outerHTML;
}

function createPostActions({
    upvotes = 0,
    comments = 0,
    baseUpvotes = upvotes,
    upvoted = false,
    bookmarked = false,
    isOwner = false,
    postId = ''
} = {}) {
    const actions = document.createElement('div');
    actions.className = 'post-actions';

    const upvote = document.createElement('button');
    upvote.className = 'action-stat';
    upvote.type = 'button';
    upvote.dataset.baseCount = String(baseUpvotes);
    upvote.dataset.statusLoaded = 'true';
    upvote.dataset.upvoted = String(Boolean(upvoted));
    upvote.innerHTML = `<span>👍</span> Upvote <span class="count">(${upvotes})</span>`;
    upvote.classList.toggle('active', Boolean(upvoted));
    upvote.setAttribute('aria-pressed', String(Boolean(upvoted)));
    upvote.style.color = upvoted ? 'var(--primary-yellow)' : 'inherit';

    const insights = document.createElement('button');
    insights.className = 'action-stat';
    insights.type = 'button';
    insights.innerHTML = `<span>💬</span> Insights <span class="count">(${comments})</span>`;

    const bookmark = document.createElement('button');
    bookmark.className = 'action-stat';
    bookmark.type = 'button';
    bookmark.dataset.statusLoaded = 'true';
    bookmark.dataset.bookmarked = String(Boolean(bookmarked));
    bookmark.innerHTML = '<span>🔖</span> Bookmark';
    bookmark.classList.toggle('active', Boolean(bookmarked));
    bookmark.style.color = bookmarked ? 'var(--primary-yellow)' : 'inherit';

    actions.append(upvote, insights, bookmark);

    if (isOwner) {
        const ownerActions = document.createElement('div');
        ownerActions.className = 'post-owner-actions';

        const edit = document.createElement('button');
        edit.className = 'post-action-btn edit-btn';
        edit.type = 'button';
        edit.innerHTML = '✏️ Edit';
        edit.dataset.postId = postId;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'post-action-btn delete-btn';
        deleteBtn.type = 'button';
        deleteBtn.innerHTML = '🗑️ Delete';
        deleteBtn.dataset.postId = postId;

        ownerActions.append(edit, deleteBtn);
        actions.append(ownerActions);
    }

    return actions;
}

function createPostCard(post) {
    const {
        id,
        content,
        category = 'General',
        upvotes = 0,
        comments = 0,
        baseUpvotes = upvotes,
        upvoted = false,
        bookmarked = false,
        isOwner = false
    } = post;
    const ownerId = getPostAuthorUserId(post);
    const { name: userName, avatar: avatarUrl } = getPostAuthorDisplay(post);
    const timestamp = TimestampUtils.formatRelativeTimestamp(post.createdAt || post.timestamp);

    const article = document.createElement('article');
    article.className = 'post';
    article.dataset.postId = id || `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    article.dataset.ownerId = ownerId;

    const header = document.createElement('div');
    header.className = 'post-header';

    const user = document.createElement('div');
    user.className = 'post-user';

    const avatar = document.createElement('img');
    avatar.className = 'post-avatar';
    avatar.src = avatarUrl;
    avatar.alt = userName;

    const userInfo = document.createElement('div');
    userInfo.className = 'post-user-info';
    const meta = createTextElement('span', 'post-meta', 'posted in ');
    meta.append(createTextElement('strong', '', category), document.createTextNode(` • ${timestamp}`));
    userInfo.append(createTextElement('span', 'post-user-name', userName), meta);
    user.append(avatar, userInfo);
    header.append(user);

    article.append(
        header,
        createTextElement('p', 'post-content', content),
        createTextElement('span', 'category-label', category)
    );

    const { fileName, fileSize, fileUrl } = getPostAttachmentData(post);
    const attachment = createPostAttachment(fileName, fileSize, fileUrl);
    if (attachment) {
        article.append(attachment);
    }

    article.append(createPostActions({
        upvotes,
        comments,
        baseUpvotes,
        upvoted,
        bookmarked,
        isOwner,
        postId: article.dataset.postId
    }));
    return article;
}

function getPostFormData(uploadedFile = null) {
    const file = postFile.files[0];
    const fileName = uploadedFile?.originalName || file?.name || '';
    const fileSize = uploadedFile?.sizeFormatted || (file ? formatFileSize(file.size) : '');

    return {
        content: postContent.value.trim(),
        category: postCategory.value,
        fileName,
        fileSize,
        fileUrl: uploadedFile?.url || '',
        fileStoredName: uploadedFile?.filename || '',
        fileOriginalName: uploadedFile?.originalName || fileName,
        fileMimeType: uploadedFile?.mimeType || file?.type || '',
        fileSizeBytes: uploadedFile?.size || file?.size || 0,
        attachment: uploadedFile,
        userName: currentUser.name,
        avatar: currentUser.avatar
    };
}

function resetPostForm() {
    postContent.value = '';
    postCategory.value = 'General';
    postFile.value = '';
    selectedFileName.textContent = '';
    postContent.focus();
}

function refreshPostInteractions() {
    if (window.PostInteractions && typeof window.PostInteractions.init === 'function') {
        window.PostInteractions.init();
    }
    initPostOwnerActions();
}

function initPostOwnerActions() {
    console.log('🔧 Initializing post owner actions...');

    document.querySelectorAll('.edit-btn').forEach(btn => {
        if (btn.dataset.listenerReady === 'true') return;
        btn.dataset.listenerReady = 'true';
        btn.addEventListener('click', (e) => handleEditPost(e, btn));
        console.log('✅ Edit button listener attached:', btn.dataset.postId);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        if (btn.dataset.listenerReady === 'true') return;
        btn.dataset.listenerReady = 'true';
        btn.addEventListener('click', (e) => handleDeletePost(e, btn));
        console.log('✅ Delete button listener attached:', btn.dataset.postId);
    });
}

function handleEditPost(e, btn) {
    e.preventDefault();
    e.stopPropagation();

    const postId = btn.dataset.postId;
    console.log('📝 Edit clicked for post:', postId);

    const post = document.querySelector(`[data-post-id="${postId}"]`);

    if (!post) {
        console.error('❌ Post element not found:', postId);
        return;
    }

    const contentEl = post.querySelector('.post-content');
    const categoryEl = post.querySelector('.category-label');

    if (!contentEl || !categoryEl) {
        console.error('❌ Post content or category element not found');
        return;
    }

    console.log('📄 Content:', contentEl.textContent.substring(0, 50));
    console.log('📂 Category:', categoryEl.textContent);

    showEditPostModal(postId, contentEl.textContent, categoryEl.textContent);
}

function handleDeletePost(e, btn) {
    e.preventDefault();
    e.stopPropagation();

    const postId = btn.dataset.postId;
    console.log('🗑️ Delete clicked for post:', postId);

    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
        console.log('❌ Delete cancelled');
        return;
    }

    console.log('🔄 Calling deletePostRequest...');
    deletePostRequest(postId);
}

function showEditPostModal(postId, content, category) {
    console.log('🎨 Opening edit modal...');

    let modal = document.getElementById('editPostModal');

    if (!modal) {
        console.log('📦 Creating modal...');
        createEditPostModal();
        modal = document.getElementById('editPostModal');

        if (!modal) {
            console.error('❌ Modal creation failed');
            return;
        }
    }

    const editPostForm = document.getElementById('editPostForm');
    const editPostContent = document.getElementById('editPostContent');
    const editPostCategory = document.getElementById('editPostCategory');

    if (!editPostForm || !editPostContent || !editPostCategory) {
        console.error('❌ Modal elements not found');
        return;
    }

    editPostContent.value = content;
    populateEditPostCategorySelect(category);
    editPostForm.dataset.postId = postId;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    editPostContent.focus();

    console.log('✅ Modal opened for post:', postId);
}

function createEditPostModal() {
    const modal = document.createElement('div');
    modal.id = 'editPostModal';
    modal.className = 'modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Post</h2>
                <button type="button" class="modal-close" aria-label="Close modal">✕</button>
            </div>
            <form id="editPostForm" class="modal-form">
                <div class="form-group">
                    <label for="editPostContent">Content</label>
                    <textarea id="editPostContent" placeholder="What are you studying?" required></textarea>
                </div>
                <div class="form-group">
                    <label for="editPostCategory">Category</label>
                    <select id="editPostCategory"></select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary modal-cancel">Cancel</button>
                    <button type="submit" class="btn-primary">Save Changes</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.modal-cancel');
    const overlay = modal.querySelector('.modal-overlay');
    const form = modal.querySelector('#editPostForm');

    const closeModal = () => {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) {
            closeModal();
        }
    });

    form.addEventListener('submit', handleEditPostSubmit);
}

async function handleEditPostSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    const form = e.target;
    const postId = form.dataset.postId;
    const content = document.getElementById('editPostContent').value.trim();
    const category = document.getElementById('editPostCategory').value;

    console.log('💾 Submitting edit...', { postId, content: content.substring(0, 50), category });

    if (!content) {
        console.error('❌ Content is empty');
        alert('Post content is required');
        return;
    }

    try {
        const headers = getAuthHeaders();
        console.log('📤 Sending request with headers:', { userId: headers['x-user-id'], userName: headers['x-user-name'] });

        const response = await fetch(`${API_BASE_URL}/posts/${encodeURIComponent(postId)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify({ content, category })
        });

        console.log('📨 Response status:', response.status);
        const data = await response.json();
        console.log('📨 Response data:', data);

        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}: Could not update post`);
        }

        const postEl = document.querySelector(`[data-post-id="${postId}"]`);
        if (postEl) {
            postEl.querySelector('.post-content').textContent = content;
            postEl.querySelector('.category-label').textContent = category;
            console.log('✅ UI updated');
        } else {
            console.warn('⚠️ Post element not found for UI update');
        }

        loadedPosts = loadedPosts.map(post => String(post.id) === String(postId)
            ? { ...post, content, text: content, category }
            : post
        );

        const modal = document.getElementById('editPostModal');
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');

        showToast('Post updated successfully');
        console.log('✅ Post updated successfully');
    } catch (error) {
        console.error('❌ Update post failed:', error);
        showToast(`Could not update post: ${error.message}`);
    }
}

async function deletePostRequest(postId) {
    console.log('🔄 Deleting post:', postId);

    try {
        const headers = getAuthHeaders();
        console.log('📤 Sending DELETE request with headers:', { userId: headers['x-user-id'] });

        const response = await fetch(`${API_BASE_URL}/posts/${encodeURIComponent(postId)}`, {
            method: 'DELETE',
            headers
        });

        console.log('📨 Response status:', response.status);
        const data = await response.json();
        console.log('📨 Response data:', data);

        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}: Could not delete post`);
        }

        const postEl = document.querySelector(`[data-post-id="${postId}"]`);
        if (postEl) {
            postEl.remove();
            console.log('✅ Post element removed from DOM');
        } else {
            console.warn('⚠️ Post element not found in DOM');
        }

        loadedPosts = loadedPosts.filter(post => String(post.id) !== String(postId));
        updateProfileStats();

        showToast('Post deleted successfully');
        console.log('✅ Post deleted successfully');
    } catch (error) {
        console.error('❌ Delete post failed:', error);
        showToast(`Could not delete post: ${error.message}`);
    }
}

async function renderPosts(posts) {
    loadedPosts = await hydratePostsWithAuthorProfiles(posts);
    feed.innerHTML = '';
    if (loadedPosts.length === 0) {
        feed.appendChild(createTextElement('p', 'friend-empty-state', 'No posts yet.'));
    }
    loadedPosts.forEach((post) => {
        feed.appendChild(createPostCard(post));
    });
    refreshPostInteractions();
    updateProfileStats();
}

async function loadPosts() {
    try {
        feed.innerHTML = '';
        feed.appendChild(createTextElement('p', 'friend-empty-state', 'Loading posts...'));

        const response = await fetch(`${API_BASE_URL}/posts`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Could not load posts');
        }

        const data = await response.json();
        await renderPosts(data.posts || []);
    } catch (error) {
        console.error('Loading posts failed:', error);
        feed.innerHTML = '';
        feed.appendChild(createTextElement('p', 'friend-empty-state', 'Could not load posts right now.'));
        refreshPostInteractions();
    }
}

function updateRenderedBookmarkButton(postId, bookmarked) {
    document.querySelectorAll('.post').forEach((postElement) => {
        if (String(postElement.dataset.postId) !== String(postId)) return;

        const bookmarkButton = Array.from(postElement.querySelectorAll('.action-stat'))
            .find((button) => button.textContent.includes('Bookmark'));

        if (!bookmarkButton) return;

        bookmarkButton.dataset.statusLoaded = 'true';
        bookmarkButton.dataset.bookmarked = String(Boolean(bookmarked));
        bookmarkButton.classList.toggle('active', Boolean(bookmarked));
        bookmarkButton.setAttribute('aria-pressed', String(Boolean(bookmarked)));
        bookmarkButton.style.color = bookmarked ? 'var(--primary-yellow)' : 'inherit';
    });
}

function syncPostBookmarkState(postId, { bookmarked = false, count } = {}) {
    if (!postId) return;

    const nextBookmarked = Boolean(bookmarked);
    loadedPosts = loadedPosts.map((post) => {
        if (String(post.id) !== String(postId)) return post;

        return {
            ...post,
            bookmarked: nextBookmarked,
            bookmarks: count !== undefined && count !== null && Number.isFinite(Number(count)) ? Number(count) : post.bookmarks
        };
    });

    if (window.PostInteractions && typeof window.PostInteractions.syncBookmarkState === 'function') {
        window.PostInteractions.syncBookmarkState(postId, { bookmarked: nextBookmarked, count });
        return;
    }

    updateRenderedBookmarkButton(postId, nextBookmarked);
}

function syncPostBookmarkStatesFromPosts(posts = []) {
    posts.forEach((post) => {
        if (!post?.id || typeof post.bookmarked !== 'boolean') return;

        syncPostBookmarkState(post.id, {
            bookmarked: post.bookmarked,
            count: post.bookmarks
        });
    });
}

window.addEventListener('studyhive:bookmarkchange', (event) => {
    const detail = event.detail || {};
    syncPostBookmarkState(detail.postId, detail);
});

async function uploadPostFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/posts/upload`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || 'Could not upload file');
    }

    return data.file;
}

async function publishPost() {
    const selectedFile = postFile.files[0] || null;
    let uploadedFile = null;
    let postData = getPostFormData();

    if (!postData.content) {
        postContent.focus();
        return;
    }

    try {
        publishPostBtn.disabled = true;

        if (selectedFile) {
            publishPostBtn.textContent = 'Uploading...';
            uploadedFile = await uploadPostFile(selectedFile);
        }

        publishPostBtn.textContent = 'Publishing...';
        postData = getPostFormData(uploadedFile);

        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(postData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Could not publish post');
        }

        const [hydratedPost] = await hydratePostsWithAuthorProfiles([data.post]);

        loadedPosts = [
            hydratedPost,
            ...loadedPosts.filter(post => String(post.id) !== String(hydratedPost?.id))
        ].filter(Boolean);
        updateProfileStats();
        feed.prepend(createPostCard(hydratedPost));
        refreshPostInteractions();
        resetPostForm();
        showToast('Post published successfully');
    } catch (error) {
        console.error('Publishing post failed:', error);
        showToast('Could not publish post. Check that the backend is running.');
    } finally {
        publishPostBtn.disabled = false;
        publishPostBtn.textContent = 'Publish';
    }
}

function showDashboardSection(sectionName) {
    dashboardSections.forEach((section) => {
        const isActive = section.dataset.section === sectionName;
        section.hidden = !isActive;
        section.classList.toggle('active-section-view', isActive);
    });

    navItems.forEach((item) => {
        item.classList.toggle('active', item.dataset.section === sectionName);
    });

    if (sectionName === 'saved') {
        loadBookmarkedPosts();
    }

    if (sectionName === 'profile') {
        loadUserProfileFromBackend();
    }

    if (sectionName === 'settings') {
        loadUserSettingsFromBackend();
        applyAuthProviderSettings();
    }

    if (sectionName === 'report') {
        loadUserReportsFromBackend();
    }
}

StudyHive.showDashboardSection = showDashboardSection;

function showToast(message) {
    profileToast.textContent = message;
    profileToast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        profileToast.classList.remove('show');
    }, 2600);
}

StudyHive.showToast = showToast;

function getShortDisplayName(fullName) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) return parts[0] || 'StudyHive User';

    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

function updateProfileHeader(data) {
    const fullName = data.fullName || 'StudyHive User';
    const displayName = data.displayName || fullName;
    const avatar = normalizeProfileAvatarSource(data.avatar || DEFAULT_PROFILE_AVATAR);
    const username = data.username ? `@${data.username}` : '';
    const profileMetaParts = [
        username,
        fullName && fullName !== displayName ? fullName : '',
        data.course,
        data.yearLevel
    ].filter(Boolean);

    currentUser.name = displayName;
    currentUser.avatar = avatar;

    headerUserName.textContent = currentUser.name;
    headerAvatar.src = avatar;
    headerAvatar.alt = `${displayName} avatar`;
    if (avatarPreviewObjectUrl && avatar !== avatarPreviewObjectUrl) {
        URL.revokeObjectURL(avatarPreviewObjectUrl);
        avatarPreviewObjectUrl = '';
    }
    profileAvatarPreview.src = avatar;
    profileAvatarPreview.alt = `${displayName} profile photo`;
    profileHeadingName.textContent = displayName;
    profileHeadingMeta.textContent = profileMetaParts.join(' • ');
    updateProfileStats();
}

function getProfileDataFromBackend(profile) {
    const fullName = profile.fullName || profile.realName || profile.name || profile.displayName || savedProfileData.fullName;
    const displayName = profile.displayName || profile.nickname || fullName || savedProfileData.displayName;

    return {
        fullName,
        displayName,
        username: profile.username || savedProfileData.username,
        bio: profile.bio || '',
        school: profile.school || savedProfileData.school,
        course: profile.course || savedProfileData.course,
        yearLevel: profile.yearLevel || savedProfileData.yearLevel,
        avatar: normalizeProfileAvatarSource(profile.avatarUrl || profile.avatar || savedProfileData.avatar),
        skills: Array.isArray(profile.skills) ? profile.skills : [...savedProfileData.skills]
    };
}

function getProfileFormData() {
    const fullName = profileFullName.value.trim() || 'StudyHive User';
    const displayName = profileDisplayName.value.trim() || fullName;

    return {
        fullName,
        displayName,
        username: profileUsername.value.trim().replace(/^@+/, '') || 'studyhiveuser',
        bio: profileBio.value.trim(),
        school: profileSchool.value.trim(),
        course: profileCourse.value.trim(),
        yearLevel: profileYearLevel.value,
        avatar: profileAvatarPreview.src,
        skills: [...activeSkills]
    };
}

function isCurrentUserPost(post = {}) {
    if (post.isOwner === true) return true;

    const currentUserValues = getCurrentUserMembershipValues();
    const postOwnerValues = [
        post.userId,
        post.ownerId,
        post.createdById,
        post.uid,
        post.userEmail,
        post.email,
        post.userName,
        post.author,
        post.createdBy,
        post.displayName
    ].map(normalizeMembershipValue).filter(Boolean);

    return postOwnerValues.some(value => currentUserValues.has(value));
}

function setProfileStatValue(element, value) {
    if (!element) return;
    element.textContent = Number(value || 0).toLocaleString();
}

function updateProfileStats() {
    setProfileStatValue(profilePostsStat, loadedPosts.filter(isCurrentUserPost).length);
    setProfileStatValue(profileReviewersStat, acceptedFriends.length);
    setProfileStatValue(profileCirclesStat, joinedStudyCircles.length);
}

async function uploadProfileAvatar(file) {
    if (!file) return null;

    if (!String(file.type || '').startsWith('image/')) {
        throw new Error('Please choose an image file for your profile photo.');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || 'Could not upload profile photo');
    }

    return data.avatar;
}

function applyProfileFormData(data) {
    profileFullName.value = data.fullName;
    profileDisplayName.value = data.displayName || data.fullName;
    profileUsername.value = data.username;
    profileBio.value = data.bio;
    profileSchool.value = data.school;
    profileCourse.value = data.course;
    profileYearLevel.value = data.yearLevel;
    activeSkills = [...data.skills];
    updateProfileHeader(data);
    renderSkills();
}

function renderSkills() {
    skillsList.innerHTML = '';

    activeSkills.forEach((skill) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'skill-chip';
        chip.setAttribute('aria-label', `Remove ${skill}`);

        const text = createTextElement('span', '', skill);
        const remove = createTextElement('span', 'skill-chip-remove', '×');
        chip.append(text, remove);

        chip.addEventListener('click', () => {
            activeSkills = activeSkills.filter((item) => item !== skill);
            renderSkills();
        });

        skillsList.append(chip);
    });
}

function addSkill() {
    const skill = skillInput.value.trim();
    if (!skill) return;

    const duplicate = activeSkills.some((item) => item.toLowerCase() === skill.toLowerCase());
    if (!duplicate) {
        activeSkills.push(skill);
        renderSkills();
    }

    skillInput.value = '';
    skillInput.focus();
}

function initProfileEditor() {
    if (!profileEditForm) return;

    renderSkills();

    changePhotoBtn.addEventListener('click', () => avatarUpload.click());

    avatarUpload.addEventListener('change', () => {
        const file = avatarUpload.files[0];
        if (!file) return;

        if (avatarPreviewObjectUrl) {
            URL.revokeObjectURL(avatarPreviewObjectUrl);
        }

        avatarPreviewObjectUrl = URL.createObjectURL(file);
        profileAvatarPreview.src = avatarPreviewObjectUrl;
    });

    addSkillBtn.addEventListener('click', addSkill);

    skillInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            addSkill();
        }
    });

    cancelProfileEditBtn.addEventListener('click', () => {
        applyProfileFormData(savedProfileData);
        avatarUpload.value = '';
        showDashboardSection('feed');
    });

    // REPLACED: Live HTTP PUT Request Sync to Express Server Pipeline
    profileEditForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        // Gather the current text and data from the form inputs
        const nextProfileData = getProfileFormData();
        const selectedAvatarFile = avatarUpload.files[0] || null;

        // Trigger loading state animations on your button
        saveProfileBtn.classList.add('is-loading');
        saveProfileBtn.disabled = true;

        try {
            if (selectedAvatarFile) {
                const uploadedAvatar = await uploadProfileAvatar(selectedAvatarFile);
                nextProfileData.avatar = uploadedAvatar?.url || nextProfileData.avatar;
            }

            const response = await fetch(`${API_BASE_URL}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    displayName: nextProfileData.displayName,
                    fullName: nextProfileData.fullName,
                    bio: nextProfileData.bio,
                    avatarUrl: getPersistableAvatarSource(nextProfileData.avatar),
                    username: nextProfileData.username,
                    school: nextProfileData.school,
                    course: nextProfileData.course,
                    yearLevel: nextProfileData.yearLevel,
                    skills: nextProfileData.skills
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP Error ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.profile) {
                const savedProfile = getProfileDataFromBackend(data.profile);

                // Update local storage tracking vars safely with the server's returned ground-truth values
                localStorage.setItem('userFullName', data.profile.fullName || savedProfile.fullName);
                localStorage.setItem('userName', data.profile.displayName || savedProfile.displayName);
                localStorage.setItem('userAvatar', savedProfile.avatar);
                if (window.PostInteractions && typeof window.PostInteractions.setUserInfo === 'function') {
                    window.PostInteractions.setUserInfo(
                        getCurrentUserId(),
                        data.profile.displayName || savedProfile.displayName,
                        savedProfile.avatar,
                        localStorage.getItem('userEmail') || ''
                    );
                }
                
                // Keep your app memory objects in sync
                savedProfileData = savedProfile;
                applyProfileFormData(savedProfileData);
                cacheCurrentUserAuthorProfile({
                    displayName: savedProfileData.displayName,
                    fullName: savedProfileData.fullName,
                    avatarUrl: savedProfileData.avatar
                });
                updateRenderedPostAuthorProfile(getCurrentUserId());

                // Re-render user components, header states, and badges seamlessly
                avatarUpload.value = '';
                showToast('Profile Saved & Synchronized Successfully');
            }
        } catch (error) {
            console.error('CRITICAL: Backend profile synchronization routine failed:', error);
            showToast(error.message || 'Could not save changes to backend. Local cache retained.');
        } finally {
            // Reset ui interaction patterns cleanly
            saveProfileBtn.classList.remove('is-loading');
            saveProfileBtn.disabled = false;
        }
    });
}

function setAccordionCardState(card, expanded) {
    const trigger = card.querySelector('.settings-accordion-trigger');
    const panel = card.querySelector('.settings-accordion-panel');

    card.classList.toggle('active', expanded);
    trigger.setAttribute('aria-expanded', String(expanded));
    panel.hidden = !expanded;
}

function initSettingsAccordions() {
    if (!settingsAccordion) return;

    const cards = settingsAccordion.querySelectorAll('.settings-card');
    cards.forEach((card) => {
        const trigger = card.querySelector('.settings-accordion-trigger');

        trigger.addEventListener('click', () => {
            const shouldExpand = trigger.getAttribute('aria-expanded') !== 'true';

            cards.forEach((item) => setAccordionCardState(item, false));
            setAccordionCardState(card, shouldExpand);
        });
    });
}

function initSettingsToggles() {
    settingsToggleButtons.forEach((toggle) => {
        toggle.addEventListener('click', () => {
            const isActive = toggle.getAttribute('aria-pressed') === 'true';
            toggle.setAttribute('aria-pressed', String(!isActive));
        });
    });

    if (settingsDarkModeSwitch) {
        settingsDarkModeSwitch.addEventListener('click', () => {
            const isActive = settingsDarkModeSwitch.getAttribute('aria-pressed') === 'true';
            StudyHive.setDarkMode(!isActive);
        });
    }
}

function initSettingsSelectors() {
    if (themeColorSelect) {
        themeColorSelect.addEventListener('change', () => {
            document.documentElement.style.setProperty('--primary-yellow', themeColorSelect.value);
        });
    }

    if (fontSizeSelect) {
        document.body.dataset.fontSize = fontSizeSelect.value;

        fontSizeSelect.addEventListener('change', () => {
            document.body.dataset.fontSize = fontSizeSelect.value;
        });
    }
}

function getSettingsFormData() {
    const toggles = {};
    document.querySelectorAll('.settings-toggle[data-toggle]').forEach((toggle) => {
        toggles[toggle.dataset.toggle] = toggle.getAttribute('aria-pressed') === 'true';
    });

    return {
        account: {
            email: settingsEmail?.value.trim() || localStorage.getItem('userEmail') || ''
        },
        toggles,
        appearance: {
            themeColor: themeColorSelect?.value || '#f4b400',
            fontSize: fontSizeSelect?.value || 'normal'
        }
    };
}

function setSettingsToggle(toggleName, active) {
    const toggle = document.querySelector(`.settings-toggle[data-toggle="${toggleName}"]`);
    if (!toggle) return;

    toggle.setAttribute('aria-pressed', String(Boolean(active)));
}

function applyUserSettings(settings = {}) {
    savedUserSettings = settings;

    if (settingsEmail) {
        settingsEmail.value = settings.account?.email || localStorage.getItem('userEmail') || '';
    }

    Object.entries(settings.toggles || {}).forEach(([toggleName, active]) => {
        setSettingsToggle(toggleName, active);
    });

    if (themeColorSelect) {
        themeColorSelect.value = settings.appearance?.themeColor || themeColorSelect.value;
        document.documentElement.style.setProperty('--primary-yellow', themeColorSelect.value);
    }

    if (fontSizeSelect) {
        fontSizeSelect.value = settings.appearance?.fontSize || fontSizeSelect.value;
        document.body.dataset.fontSize = fontSizeSelect.value;
    }

    if (typeof settings.toggles?.['dark-mode'] === 'boolean' && StudyHive.setDarkMode) {
        StudyHive.setDarkMode(settings.toggles['dark-mode'], true);
    }

    if (ENABLE_PRESENCE) {
        syncPresenceState(true);
    }
}

function isCurrentUserOnlineVisible() {
    return savedUserSettings?.toggles?.['online-status'] !== false;
}

async function updateCurrentUserPresence(isActive = true) {
    if (!ENABLE_PRESENCE) return;

    const userId = getCurrentUserId();
    if (!userId || userId === 'default-user') return;

    const visible = isCurrentUserOnlineVisible();
    const shouldShowActive = Boolean(isActive && visible);

    try {
        const response = await fetch(`${API_BASE_URL}/presence`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({
                userId,
                displayName: currentUser.name,
                avatarUrl: currentUser.avatar,
                active: shouldShowActive,
                onlineVisible: visible
            }),
            keepalive: true
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || 'Presence update failed');
        }
    } catch (error) {
        console.error('Could not update user presence through backend:', error);

        if (!firebaseDb || !firebaseDoc || !firebaseSetDoc) return;

        try {
            await firebaseSetDoc(firebaseDoc(firebaseDb, 'userPresence', userId), {
                userId,
                displayName: currentUser.name,
                avatarUrl: currentUser.avatar,
                active: shouldShowActive,
                onlineVisible: visible,
                lastActiveAtMillis: Date.now(),
                lastActiveAt: Date.now(),
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (fallbackError) {
            console.error('Could not update user presence through Firestore fallback:', fallbackError);
        }
    }
}

async function loadActiveFriendsPresence({ force = false } = {}) {
    if (!ENABLE_PRESENCE) {
        activeFriendsFromPresence = [];
        userPresenceById = new Map();
        activeFriendsPresenceLoadedAt = Date.now();
        renderActiveFriendsList();
        return;
    }

    if (!force && activeFriendsPresenceLoadedAt && Date.now() - activeFriendsPresenceLoadedAt < ACTIVE_FRIEND_REFRESH_MS) {
        renderActiveFriendsList();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/presence/active-friends`, {
            headers: getAuthHeaders()
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || 'Could not load active friends');
        }

        activeFriendsFromPresence = Array.isArray(data.activeFriends) ? data.activeFriends : [];
        activeFriendsPresenceLoadedAt = Date.now();
        userPresenceById = new Map();
        activeFriendsFromPresence.forEach((friend) => {
            const friendId = String(friend.id || friend.userId || friend.uid || '');
            if (friendId) {
                userPresenceById.set(friendId, {
                    ...(friend.presence || {}),
                    userId: friendId,
                    active: true,
                    onlineVisible: true
                });
            }
        });

        renderActiveFriendsList();
    } catch (error) {
        console.error('Could not load active friends:', error);
        activeFriendsPresenceLoadedAt = Date.now();
        renderActiveFriendsList();
    }
}

async function syncPresenceState(isActive = true) {
    if (!ENABLE_PRESENCE) {
        activeFriendsFromPresence = [];
        userPresenceById = new Map();
        renderActiveFriendsList();
        return;
    }

    await updateCurrentUserPresence(isActive);

    if (isActive) {
        await loadActiveFriendsPresence();
    } else {
        activeFriendsFromPresence = [];
        userPresenceById = new Map();
        renderActiveFriendsList();
    }
}

async function loadUserSettingsFromBackend() {
    try {
        const response = await fetch(`${API_BASE_URL}/settings`, {
            headers: getAuthHeaders()
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Could not load settings');
        }

        if (data.settings) {
            applyUserSettings(data.settings);
        }
    } catch (error) {
        console.error('Loading user settings failed:', error);
    }
}

async function updateFirebasePasswordIfRequested() {
    if (!settingsCurrentPassword || !settingsNewPassword || !settingsConfirmPassword) return false;

    const currentPassword = settingsCurrentPassword.value;
    const newPassword = settingsNewPassword.value;
    const confirmPassword = settingsConfirmPassword.value;
    const hasPasswordInput = Boolean(currentPassword || newPassword || confirmPassword);

    if (!hasPasswordInput) {
        return false;
    }

    if (settingsCurrentPassword.disabled || settingsNewPassword.disabled || settingsConfirmPassword.disabled) {
        throw new Error('This account is managed through Google Sign-In.');
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('Fill in current password, new password, and confirm password.');
    }

    if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters.');
    }

    if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match.');
    }

    const firebaseReady = await loadFirebaseAuth();
    const user = firebaseReady ? firebaseAuth.currentUser : null;

    if (!user?.email) {
        throw new Error('Please sign in again before changing your password.');
    }

    const credential = firebaseEmailAuthProvider.credential(user.email, currentPassword);
    await firebaseReauthenticateWithCredential(user, credential);
    await firebaseUpdatePassword(user, newPassword);

    settingsCurrentPassword.value = '';
    settingsNewPassword.value = '';
    settingsConfirmPassword.value = '';
    return true;
}

function openDangerModal(action) {
    pendingDangerAction = action;
    const isDelete = action === 'delete account';

    dangerModalTitle.textContent = isDelete ? 'Delete account?' : 'Logout all devices?';
    dangerModalMessage.textContent = isDelete
        ? 'This permanently deletes your StudyHive account, profile, posts, messages, friendships, notifications, and study circle memberships. This cannot be undone.'
        : 'This revokes your Firebase sessions and signs out every active StudyHive session connected to your account, including this device.';
    confirmDangerActionBtn.textContent = isDelete ? 'Delete Account' : 'Sign Out Everywhere';
    confirmDangerActionBtn.style.backgroundColor = isDelete ? '#d32f2f' : '#c47f00';
    confirmDangerActionBtn.disabled = false;
    dangerConfirmModal.classList.add('open');
    dangerConfirmModal.setAttribute('aria-hidden', 'false');
    confirmDangerActionBtn.focus();
}

function closeDangerModal() {
    if (dangerConfirmModal) {
        dangerConfirmModal.classList.remove('open');
        dangerConfirmModal.style.display = '';
        dangerConfirmModal.setAttribute('aria-hidden', 'true');
    }

    pendingDangerAction = '';
    pendingLeaveCircle = null;
    pendingDeleteCircle = null;

    if (confirmDangerActionBtn) {
        confirmDangerActionBtn.disabled = false;
    }
}

function initDangerModal() {
    if (!dangerConfirmModal || !confirmDangerActionBtn) return;

    dangerActionButtons.forEach((button) => {
        button.addEventListener('click', () => openDangerModal(button.dataset.dangerAction));
    });

    closeModalButtons.forEach((button) => {
        button.addEventListener('click', closeDangerModal);
    });

    confirmDangerActionBtn.addEventListener('click', () => {
        if (pendingDangerAction === 'logout') {
            confirmLogout();
            return;
        }

        if (pendingDangerAction === 'logout devices') {
            confirmSignOutEverywhere();
            return;
        }

        if (pendingDangerAction === 'delete account') {
            confirmDeleteAccount();
            return;
        }

        if (pendingDangerAction === 'leave circle') {
            confirmLeaveStudyCircle();
            return;
        }

        if (pendingDangerAction === 'delete circle') {
            confirmDeleteStudyCircle();
            return;
        }

        closeDangerModal();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && dangerConfirmModal.classList.contains('open')) {
            closeDangerModal();
        }
    });
}

function initSaveSettings() {
    if (!saveSettingsBtn) return;

    saveSettingsBtn.addEventListener('click', async () => {
        saveSettingsBtn.classList.add('is-loading');
        saveSettingsBtn.disabled = true;

        try {
            const passwordChanged = await updateFirebasePasswordIfRequested();
            const response = await fetch(`${API_BASE_URL}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    settings: getSettingsFormData()
                })
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Could not save settings');
            }

            if (data.settings) {
                applyUserSettings(data.settings);
            }

            showToast(passwordChanged ? 'Settings saved and password updated' : 'Settings Saved Successfully');
        } catch (error) {
            console.error('Saving settings failed:', error);
            showToast(error.message || 'Could not save settings');
        } finally {
            saveSettingsBtn.classList.remove('is-loading');
            saveSettingsBtn.disabled = false;
        }
    });
}

function setFaqItemState(item, expanded) {
    const trigger = item.querySelector('.faq-question');

    item.classList.toggle('active', expanded);
    trigger.setAttribute('aria-expanded', String(expanded));
}

function filterFaqItems() {
    const query = helpSearchInput.value.trim().toLowerCase();
    let visibleCount = 0;
    let firstVisibleItem = null;

    faqItems.forEach((item) => {
        const matches = item.textContent.toLowerCase().includes(query);
        item.hidden = !matches;

        if (matches) {
            visibleCount += 1;
            firstVisibleItem ||= item;
            return;
        }

        setFaqItemState(item, false);
    });

    faqEmptyState.hidden = visibleCount > 0;

    const hasOpenVisibleItem = [...faqItems].some((item) => !item.hidden && item.classList.contains('active'));
    if (!hasOpenVisibleItem && firstVisibleItem) {
        setFaqItemState(firstVisibleItem, true);
    }
}

function initHelpSupport() {
    if (!supportForm) return;

    faqItems.forEach((item) => {
        const trigger = item.querySelector('.faq-question');

        trigger.addEventListener('click', () => {
            const shouldOpen = !item.classList.contains('active');
            faqItems.forEach((faqItem) => setFaqItemState(faqItem, false));
            setFaqItemState(item, shouldOpen);
        });
    });

    helpSearchInput.addEventListener('input', filterFaqItems);

    supportForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!supportSubject.value.trim()) {
            supportSubject.focus();
            return;
        }

        if (!supportMessage.value.trim()) {
            supportMessage.focus();
            return;
        }

        sendSupportBtn.classList.add('is-loading');
        sendSupportBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/support`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    subject: supportSubject.value.trim(),
                    message: supportMessage.value.trim()
                })
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Could not send support message');
            }

            supportForm.reset();
            showToast('Support message sent successfully');
        } catch (error) {
            console.error('Support message failed:', error);
            showToast(error.message || 'Could not send support message');
        } finally {
            sendSupportBtn.classList.remove('is-loading');
            sendSupportBtn.disabled = false;
        }
    });
}

function setReportFieldError(field, message) {
    const wrapper = field.closest('.report-field');
    const error = document.getElementById(`${field.id}Error`);

    wrapper.classList.toggle('has-error', Boolean(message));
    if (error) {
        error.textContent = message;
    }
}

function clearReportFieldError(field) {
    setReportFieldError(field, '');
}

function updateReportCharacterCounter() {
    reportCharacterCounter.textContent = `${reportDescription.value.length}/500`;
}

function handleScreenshotFile(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        screenshotFileName.textContent = '';
        reportScreenshot.value = '';
        showToast('Please upload an image screenshot');
        return;
    }

    screenshotFileName.textContent = file.name;
}

function resetReportFormState() {
    reportForm.reset();
    screenshotFileName.textContent = '';
    updateReportCharacterCounter();
    [reportCategory, reportTitle, reportDescription].forEach(clearReportFieldError);

    priorityOptions.forEach((option) => {
        const input = option.querySelector('input');
        const isMedium = input.value === 'Medium';
        input.checked = isMedium;
        option.classList.toggle('active', isMedium);
    });
}

function addRecentReport(report) {
    if (!recentReportList) return;

    const reportTitleText = typeof report === 'string' ? report : report.title;
    const statusText = typeof report === 'string' ? 'Pending' : (report.status || 'pending');
    const submittedDate = typeof report === 'string' || !report.createdAt
        ? 'Submitted just now'
        : `Submitted ${formatRelativeTime(report.createdAt)}`;
    const reportElement = document.createElement('article');
    reportElement.className = 'recent-report-item';

    const content = document.createElement('div');
    content.append(
        createTextElement('h3', '', reportTitleText || 'Problem report'),
        createTextElement('p', '', submittedDate)
    );

    const status = createTextElement('span', `status-badge ${String(statusText).toLowerCase()}`, statusText);
    reportElement.append(content, status);
    recentReportList.prepend(reportElement);
}

async function loadUserReportsFromBackend() {
    if (!recentReportList) return;

    try {
        const response = await fetch(`${API_BASE_URL}/reports`, {
            headers: getAuthHeaders()
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Could not load reports');
        }

        recentReportList.innerHTML = '';
        (data.reports || []).reverse().forEach(addRecentReport);
    } catch (error) {
        console.error('Loading problem reports failed:', error);
    }
}

function validateReportForm() {
    let isValid = true;

    if (!reportCategory.value) {
        setReportFieldError(reportCategory, 'Choose a problem category.');
        isValid = false;
    }

    if (!reportTitle.value.trim()) {
        setReportFieldError(reportTitle, 'Add a short problem title.');
        isValid = false;
    }

    if (reportDescription.value.trim().length < 20) {
        setReportFieldError(reportDescription, 'Describe the problem in at least 20 characters.');
        isValid = false;
    }

    return isValid;
}

function initReportProblem() {
    if (!reportForm) return;

    updateReportCharacterCounter();

    [reportCategory, reportTitle, reportDescription].forEach((field) => {
        field.addEventListener('input', () => clearReportFieldError(field));
        field.addEventListener('change', () => clearReportFieldError(field));
    });

    reportDescription.addEventListener('input', updateReportCharacterCounter);
    uploadScreenshotBtn.addEventListener('click', () => reportScreenshot.click());

    reportScreenshot.addEventListener('change', () => {
        handleScreenshotFile(reportScreenshot.files[0]);
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
        screenshotDropZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            screenshotDropZone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
        screenshotDropZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            screenshotDropZone.classList.remove('drag-over');
        });
    });

    screenshotDropZone.addEventListener('drop', (event) => {
        const file = event.dataTransfer.files[0];
        handleScreenshotFile(file);
    });

    priorityOptions.forEach((option) => {
        option.addEventListener('click', () => {
            priorityOptions.forEach((item) => item.classList.remove('active'));
            option.classList.add('active');
        });
    });

    reportForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!validateReportForm()) {
            return;
        }

        submitReportBtn.classList.add('is-loading');
        submitReportBtn.disabled = true;

        try {
            const selectedPriority = reportForm.querySelector('input[name="priority"]:checked')?.value || 'Medium';
            const response = await fetch(`${API_BASE_URL}/reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    category: reportCategory.value,
                    title: reportTitle.value.trim(),
                    reportText: reportDescription.value.trim(),
                    priority: selectedPriority,
                    screenshotFileName: reportScreenshot.files[0]?.name || ''
                })
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Could not submit report');
            }

            if (data.report) {
                addRecentReport(data.report);
            }

            resetReportFormState();
            showToast('Problem report submitted successfully');
        } catch (error) {
            console.error('Problem report failed:', error);
            showToast(error.message || 'Could not submit report');
        } finally {
            submitReportBtn.classList.remove('is-loading');
            submitReportBtn.disabled = false;
        }
    });

    loadUserReportsFromBackend();
}

function initPostComposer() {
    if (!attachDocumentBtn || !postFile || !publishPostBtn) {
        console.warn('Post composer elements were not found.');
        return;
    }

    if (attachDocumentBtn.dataset.ready === 'true') return;

    attachDocumentBtn.dataset.ready = 'true';
    publishPostBtn.dataset.ready = 'true';

    attachDocumentBtn.addEventListener('click', () => {
        postFile.click();
    });

    postFile.addEventListener('change', () => {
        if (selectedFileName) {
            selectedFileName.textContent = postFile.files[0]?.name || '';
        }
    });

    publishPostBtn.addEventListener('click', publishPost);
}

async function loadBookmarkedPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/posts`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Could not load posts');
        }

        const data = await response.json();
        const posts = data.posts || [];
        syncPostBookmarkStatesFromPosts(posts);
        const bookmarkedPosts = posts.filter(post => post.bookmarked === true);
        renderBookmarkedPosts(await hydratePostsWithAuthorProfiles(bookmarkedPosts));
    } catch (error) {
        console.error('Loading bookmarked posts failed:', error);
        renderBookmarkedPosts([]);
    }
}

function renderBookmarkedPosts(bookmarkedPosts) {
    const bookmarkedItemsList = document.getElementById('bookmarkedItemsList');
    const savedEmptyState = document.getElementById('savedEmptyState');

    if (!bookmarkedItemsList) return;

    bookmarkedItemsList.innerHTML = '';

    if (bookmarkedPosts.length === 0) {
        savedEmptyState.hidden = false;
        return;
    }

    savedEmptyState.hidden = true;

    bookmarkedPosts.forEach((post) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'bookmarked-item';
        itemElement.dataset.postId = post.id;
        itemElement.dataset.ownerId = getPostAuthorUserId(post);

        const attachmentHTML = createPostAttachmentMarkup(post);
        const { name: userName, avatar: avatarUrl } = getPostAuthorDisplay(post);

        itemElement.innerHTML = `
            <div class="bookmarked-item-header">
                <img src="${avatarUrl}" alt="${userName}" class="post-avatar">
                <div class="bookmarked-item-info">
                    <div class="bookmarked-item-title">${userName}</div>
                    <div class="bookmarked-item-meta">posted in <strong>${post.category}</strong></div>
                </div>
            </div>
            <div class="bookmarked-item-content">
                <p class="post-content">${post.content}</p>
                ${attachmentHTML}
                <div class="post-stats" style="display: flex; gap: 1rem; margin-bottom: 1rem; font-size: 0.9rem;">
                    <span>👍 ${post.upvotes}</span>
                    <span>💬 ${post.comments}</span>
                </div>
                <div class="bookmarked-item-actions">
                    <button class="bookmark-remove-btn" type="button" data-post-id="${post.id}">
                        ✕ Remove Bookmark
                    </button>
                </div>
            </div>
        `;

        const removeBtn = itemElement.querySelector('.bookmark-remove-btn');
        removeBtn.addEventListener('click', () => {
            handleRemoveBookmarkFromSaved(post.id, itemElement);
        });

        bookmarkedItemsList.appendChild(itemElement);
    });
}

async function handleRemoveBookmarkFromSaved(postId, itemElement) {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${encodeURIComponent(postId)}/bookmark`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || 'Could not remove bookmark');
        }

        if (data.bookmarked !== false) {
            throw new Error('Bookmark was not removed');
        }

        syncPostBookmarkState(postId, {
            bookmarked: false,
            count: data.count
        });
        itemElement.remove();
        const bookmarkedItemsList = document.getElementById('bookmarkedItemsList');
        const savedEmptyState = document.getElementById('savedEmptyState');

        if (bookmarkedItemsList.children.length === 0) {
            savedEmptyState.hidden = false;
        }

        showToast('Bookmark removed');
    } catch (error) {
        console.error('Remove bookmark failed:', error);
        showToast('Could not remove bookmark');
    }
}

function populateSavedSection() {
    loadBookmarkedPosts();
}

let selectedConversationId = null;
let conversationMessages = {};
let inboxConversations = [];

function getVisibleConversations() {
    return inboxConversations;
}

function syncFriendConversations() {
    const friendConversations = acceptedFriends.map(buildFriendConversation);
    const circleConversations = joinedStudyCircles.map(buildStudyCircleConversation);
    inboxConversations = [...friendConversations, ...circleConversations];

    inboxConversations.forEach((conversation) => {
        if (!conversationMessages[String(conversation.id)]) {
            setConversationMessages(conversation.id, []);
        }
    });

    const conversationStillVisible = inboxConversations.some((conversation) =>
        String(conversation.id) === String(selectedConversationId)
    );

    if (selectedConversationId && !conversationStillVisible) {
        selectedConversationId = null;
    }
}

function createFriendAvatar(src, name) {
    const avatarSrc = getInboxProfileAvatarSource(src);

    if (!avatarSrc) {
        return createInboxInitialsAvatar('friend-avatar', name || 'StudyHive friend');
    }

    const avatar = document.createElement('img');
    avatar.className = 'friend-avatar';
    avatar.src = avatarSrc;
    avatar.alt = name || 'StudyHive friend';
    avatar.addEventListener('error', () => {
        avatar.replaceWith(createInboxInitialsAvatar('friend-avatar', name || 'StudyHive friend'));
    });
    return avatar;
}

function createFriendCopy(name, meta) {
    const copy = document.createElement('div');
    copy.className = 'friend-copy';
    copy.append(
        createTextElement('p', 'friend-name', name || 'StudyHive User'),
        createTextElement('p', 'friend-meta', meta || 'StudyHive member')
    );
    return copy;
}

function createFriendActionButton(label, { secondary = false, disabled = false } = {}) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `friend-action-btn ${secondary ? 'secondary' : ''}`.trim();
    button.textContent = label;
    button.disabled = disabled;
    return button;
}

function getFriendSearchAction(user) {
    if (user.connectionStatus === 'accepted') {
        return { label: 'Accepted', disabled: true, secondary: true };
    }

    if (user.connectionStatus === 'pending' && user.connectionDirection === 'incoming') {
        return { label: 'Accept', action: () => acceptFriendRequest(user.requestId) };
    }

    if (user.connectionStatus === 'pending') {
        return { label: 'Pending', disabled: true, secondary: true };
    }

    return { label: 'Add Friend', action: () => sendFriendRequest(user.id) };
}

function renderFriendSearchResults(users = []) {
    if (!friendSearchResults) return;

    friendSearchResults.innerHTML = '';

    if (users.length === 0) {
        friendSearchResults.appendChild(createTextElement('p', 'friend-empty-state', 'No users found.'));
        return;
    }

    users.forEach((user) => {
        const item = document.createElement('div');
        item.className = 'friend-result-item';

        const action = getFriendSearchAction(user);
        const button = createFriendActionButton(action.label, action);
        if (action.action) {
            button.addEventListener('click', action.action);
        }

        item.append(
            createFriendAvatar(user.avatar, user.title),
            createFriendCopy(user.title, user.subtitle),
            button
        );
        friendSearchResults.appendChild(item);
    });
}

function renderFriendRequests() {
    if (!friendRequestsPanel || !friendRequestsList) return;

    const incoming = friendRequests.incoming || [];
    friendRequestsPanel.hidden = incoming.length === 0;
    friendRequestsList.innerHTML = '';

    incoming.forEach((request) => {
        const item = document.createElement('div');
        item.className = 'friend-request-item';

        const actions = document.createElement('div');
        actions.className = 'friend-request-actions';

        const acceptButton = createFriendActionButton('Accept');
        const declineButton = createFriendActionButton('Decline', { secondary: true });

        acceptButton.addEventListener('click', () => acceptFriendRequest(request.id));
        declineButton.addEventListener('click', () => declineFriendRequest(request.id));

        actions.append(acceptButton, declineButton);
        item.append(
            createFriendAvatar(request.fromAvatar, request.fromName),
            createFriendCopy(request.fromName, request.fromUsername ? `@${request.fromUsername}` : 'Pending request'),
            actions
        );

        friendRequestsList.appendChild(item);
    });
}

function renderFriendsList() {
    if (!friendsList) return;

    friendsList.innerHTML = '';

    if (acceptedFriends.length === 0) {
        friendsList.appendChild(createTextElement('p', 'friend-empty-state', 'Add friends to message them or invite them to circles.'));
        return;
    }

    acceptedFriends.forEach((friend) => {
        const item = document.createElement('div');
        item.className = 'friend-list-item';

        const actions = document.createElement('div');
        actions.className = 'friend-list-actions';

        const messageButton = createFriendActionButton('Message', { secondary: true });
        messageButton.addEventListener('click', () => {
            const conversation = buildFriendConversation(friend);
            selectConversation(conversation.id);
        });

        const unfriendButton = createFriendActionButton('Unfriend', { secondary: true });
        unfriendButton.addEventListener('click', () => {
            const displayName = friend.displayName || friend.name || 'this friend';
            if (confirm(`Remove ${displayName} from your friends?`)) {
                unfriendUser(friend.id);
            }
        });

        actions.append(messageButton, unfriendButton);

        item.append(
            createFriendAvatar(friend.avatarUrl, friend.displayName),
            createFriendCopy(friend.displayName, getFriendMeta(friend)),
            actions
        );

        friendsList.appendChild(item);
    });
}

async function loadFriends({ force = false } = {}) {
    if (friendsLoadPromise) {
        return friendsLoadPromise;
    }

    const hasFreshFriends = friendDataLoaded
        && friendsLoadedAt
        && Date.now() - friendsLoadedAt < FRIENDS_CACHE_MS;

    if (!force && hasFreshFriends) {
        renderFriendRequests();
        renderFriendsList();
        renderActiveFriendsList();
        renderConversationList();
        renderMessageThread();
        renderMemberCheckboxes(document.getElementById('memberSearch')?.value || '');
        updateProfileStats();
        return acceptedFriends;
    }

    friendsLoadPromise = (async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/friends`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Could not load friends');
            }

            const data = await response.json();
            acceptedFriends = Array.isArray(data.friends) ? data.friends.map(normalizeInboxFriend) : [];
            friendRequests = data.requests || { incoming: [], outgoing: [] };
            friendRequests.incoming = Array.isArray(friendRequests.incoming)
                ? friendRequests.incoming.map(normalizeInboxFriendRequest)
                : [];
            friendRequests.outgoing = Array.isArray(friendRequests.outgoing)
                ? friendRequests.outgoing.map(normalizeInboxFriendRequest)
                : [];
            friendDataLoaded = true;
            friendsLoadedAt = Date.now();

            syncFriendConversations();
            renderFriendRequests();
            renderFriendsList();
            renderActiveFriendsList();
            renderConversationList();
            renderMessageThread();
            renderMemberCheckboxes(document.getElementById('memberSearch')?.value || '');
            updateProfileStats();

            if (ENABLE_PRESENCE) {
                loadActiveFriendsPresence();
            }

            return acceptedFriends;
        } catch (error) {
            console.error('Failed to load friends:', error);
            return acceptedFriends;
        } finally {
            friendsLoadPromise = null;
        }
    })();

    return friendsLoadPromise;
}

async function searchFriends({ force = false } = {}) {
    const query = friendSearchInput?.value.trim() || '';
    if (!friendSearchResults) return;

    if (query.length < 2) {
        if (activeFriendSearchController) {
            activeFriendSearchController.abort();
            activeFriendSearchController = null;
        }
        friendSearchResults.innerHTML = '';
        lastFriendSearchQuery = '';
        return;
    }

    if (!force && query === lastFriendSearchQuery && friendSearchResults.children.length > 0) {
        return;
    }

    if (activeFriendSearchController) {
        activeFriendSearchController.abort();
    }

    activeFriendSearchController = new AbortController();
    const friendSearchController = activeFriendSearchController;
    lastFriendSearchQuery = query;

    friendSearchResults.innerHTML = '';
    friendSearchResults.appendChild(createTextElement('p', 'friend-empty-state', 'Searching...'));

    try {
        const response = await fetch(`${API_BASE_URL}/friends/search?q=${encodeURIComponent(query)}`, {
            headers: getAuthHeaders(),
            signal: friendSearchController.signal
        });

        if (!response.ok) {
            throw new Error('Friend search failed');
        }

        const data = await response.json();
        renderFriendSearchResults(data.users || []);
    } catch (error) {
        if (error.name === 'AbortError') return;

        console.error('Friend search failed:', error);
        friendSearchResults.innerHTML = '';
        friendSearchResults.appendChild(createTextElement('p', 'friend-empty-state', 'Friend search is unavailable right now.'));
    } finally {
        if (activeFriendSearchController === friendSearchController) {
            activeFriendSearchController = null;
        }
    }
}

async function sendFriendRequest(toUserId) {
    try {
        const response = await fetch(`${API_BASE_URL}/friends/requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ toUserId })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Could not send friend request');
        }

        showToast('Friend request sent');
        await loadFriends({ force: true });
        await searchFriends({ force: true });
        updateSearchProfileActions();
    } catch (error) {
        console.error('Friend request failed:', error);
        showToast(error.message || 'Could not send friend request');
    }
}

async function acceptFriendRequest(requestId) {
    if (!requestId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/friends/requests/${encodeURIComponent(requestId)}/accept`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Could not accept request');
        }

        showToast('Friend request accepted');
        await loadFriends({ force: true });
        await searchFriends({ force: true });
        updateSearchProfileActions();
    } catch (error) {
        console.error('Accept friend request failed:', error);
        showToast(error.message || 'Could not accept request');
    }
}

async function acceptFriendRequestFromNotification(notificationId, requestId, itemElement) {
    if (!requestId || !notificationId) return;

    setNotificationActionButtonsDisabled(itemElement, true);

    try {
        const response = await fetch(`${API_BASE_URL}/friends/requests/${encodeURIComponent(requestId)}/accept`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Could not accept request');
        }

        await markNotificationAsRead(notificationId);
        finishFriendRequestNotificationAction(itemElement);
        await updateNotificationBadge();
        showToast('Friend request accepted');
        await loadFriends({ force: true });
        await loadNotifications();
        await searchFriends({ force: true });
        updateSearchProfileActions();
    } catch (error) {
        console.error('Accept friend request failed:', error);
        setNotificationActionButtonsDisabled(itemElement, false);
        showToast(error.message || 'Could not accept request');
    }
}

async function declineFriendRequest(requestId) {
    if (!requestId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/friends/requests/${encodeURIComponent(requestId)}/decline`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Could not decline request');
        }

        showToast('Friend request declined');
        await loadFriends({ force: true });
        await searchFriends({ force: true });
        updateSearchProfileActions();
    } catch (error) {
        console.error('Decline friend request failed:', error);
        showToast(error.message || 'Could not decline request');
    }
}

async function declineFriendRequestFromNotification(notificationId, requestId, itemElement) {
    if (!requestId || !notificationId) return;

    setNotificationActionButtonsDisabled(itemElement, true);

    try {
        const response = await fetch(`${API_BASE_URL}/friends/requests/${encodeURIComponent(requestId)}/decline`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Could not decline request');
        }

        await markNotificationAsRead(notificationId);
        finishFriendRequestNotificationAction(itemElement);
        await updateNotificationBadge();
        showToast('Friend request declined');
        await loadFriends({ force: true });
        await loadNotifications();
        await searchFriends({ force: true });
        updateSearchProfileActions();
    } catch (error) {
        console.error('Decline friend request failed:', error);
        setNotificationActionButtonsDisabled(itemElement, false);
        showToast(error.message || 'Could not decline request');
    }
}

async function acceptStudyCircleInviteFromNotification(notificationId, inviteId, itemElement) {
    if (!inviteId || !notificationId) return;

    setNotificationActionButtonsDisabled(itemElement, true);

    try {
        const response = await fetch(`${API_BASE_URL}/circles/invites/${encodeURIComponent(inviteId)}/accept`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Could not accept study circle invitation');
        }

        await markNotificationAsRead(notificationId);
        finishFriendRequestNotificationAction(itemElement);
        await fetchStudyCirclesFromBackend();
        await updateNotificationBadge();
        await loadNotifications();
        showToast('Study circle invitation accepted');
    } catch (error) {
        console.error('Accept study circle invitation failed:', error);
        setNotificationActionButtonsDisabled(itemElement, false);
        showToast(error.message || 'Could not accept study circle invitation');
    }
}

async function declineStudyCircleInviteFromNotification(notificationId, inviteId, itemElement) {
    if (!inviteId || !notificationId) return;

    setNotificationActionButtonsDisabled(itemElement, true);

    try {
        const response = await fetch(`${API_BASE_URL}/circles/invites/${encodeURIComponent(inviteId)}/decline`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Could not decline study circle invitation');
        }

        await markNotificationAsRead(notificationId);
        finishFriendRequestNotificationAction(itemElement);
        await updateNotificationBadge();
        await loadNotifications();
        showToast('Study circle invitation declined');
    } catch (error) {
        console.error('Decline study circle invitation failed:', error);
        setNotificationActionButtonsDisabled(itemElement, false);
        showToast(error.message || 'Could not decline study circle invitation');
    }
}

async function unfriendUser(friendUserId) {
    if (!friendUserId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/friends/${encodeURIComponent(friendUserId)}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Could not remove friend');
        }

        showToast('Friend removed');
        await loadFriends({ force: true });
        await searchFriends({ force: true });
        updateSearchProfileActions();
    } catch (error) {
        console.error('Unfriend failed:', error);
        showToast(error.message || 'Could not remove friend');
    }
}

function initFriendsPanel() {
    if (!friendSearchInput || !friendSearchBtn || friendSearchInput.dataset.ready === 'true') return;

    friendSearchInput.dataset.ready = 'true';

    friendSearchInput.addEventListener('input', () => {
        clearTimeout(friendSearchTimer);
        friendSearchTimer = setTimeout(searchFriends, 300);
    });

    friendSearchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            clearTimeout(friendSearchTimer);
            searchFriends();
        }
    });

    friendSearchBtn.addEventListener('click', () => {
        clearTimeout(friendSearchTimer);
        searchFriends();
        friendSearchInput.focus();
    });
}

function formatTime(date = new Date()) {
    return TimestampUtils.formatManilaTime(date);
}

function extractMessagesResponse(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.messages)) return data.messages;
    return [];
}

function getConversationMessages(conversationId) {
    return conversationMessages[String(conversationId)] || conversationMessages[conversationId] || [];
}

function getMessageTimestampMillis(message = {}) {
    const value = message.createdAt || message.timestamp;
    const millis = TimestampUtils.getTimestampMillis(value);
    return Number.isNaN(millis) ? 0 : millis;
}

function getMessageDisplayTime(message = {}) {
    return TimestampUtils.formatManilaTime(message.createdAt || message.timestamp) || message.time || '';
}

function sortMessagesByTimestamp(messages = []) {
    return [...messages].sort((a, b) => getMessageTimestampMillis(a) - getMessageTimestampMillis(b));
}

function dedupeMessagesById(messages = []) {
    const messagesById = new Map();

    messages.forEach((message) => {
        if (!message?.id) return;
        messagesById.set(String(message.id), message);
    });

    return sortMessagesByTimestamp([...messagesById.values()]);
}

function mergeMessagesById(existingMessages = [], incomingMessages = []) {
    return dedupeMessagesById([...existingMessages, ...incomingMessages]);
}

function setConversationMessages(conversationId, messages) {
    conversationMessages[String(conversationId)] = dedupeMessagesById(messages);
}

function escapeHtml(value) {
    const element = document.createElement('div');
    element.textContent = String(value ?? '');
    return element.innerHTML;
}

function getConversationPreview(conversation) {
    const messages = getConversationMessages(conversation.id);
    const latestMessage = messages[messages.length - 1];

    if (!latestMessage) {
        return conversation.preview;
    }

    return `${latestMessage.author}: ${latestMessage.text}`;
}

function isMessageFromCurrentUser(message = {}) {
    const currentUserId = getCurrentUserId();
    const senderId = String(message.senderId || message.userId || message.fromUserId || '');

    if (senderId && currentUserId && senderId === String(currentUserId)) {
        return true;
    }

    const author = String(message.author || '').trim();
    const currentNames = [
        'You',
        currentUser.name,
        localStorage.getItem('userFullName'),
        localStorage.getItem('userName')
    ].filter(Boolean).map((name) => String(name).trim());

    return Boolean(author && currentNames.includes(author));
}

function getConversationFriend(conversation = {}) {
    if (conversation.friendId) {
        return getFriendById(conversation.friendId);
    }

    return null;
}

function getMessageSenderId(message = {}) {
    return String(message.senderId || message.userId || message.fromUserId || '').trim();
}

function getMessageSenderFriend(message = {}, conversation = {}) {
    const senderId = getMessageSenderId(message);

    if (senderId) {
        const senderFriend = getFriendById(senderId);
        if (senderFriend) return senderFriend;
    }

    return getConversationFriend(conversation);
}

function getMessageAvatarSource(message = {}, conversation = {}, isOwn = false) {
    if (isOwn) {
        return getInboxProfileAvatarSource(
            localStorage.getItem('userAvatar'),
            currentUser.avatar,
            message.avatar
        );
    }

    const senderFriend = getMessageSenderFriend(message, conversation);
    return getInboxProfileAvatarSource(
        senderFriend?.avatarUrl,
        senderFriend?.avatar,
        message.avatar,
        conversation.isFriendConversation ? conversation.avatarUrl : ''
    );
}

function getAvatarColor(value = '') {
    const author = String(value || 'StudyHive User');
    const avatarColors = ['#42a5f5', '#66bb6a', '#ab47bc', '#ec407a', '#ff9800'];
    return avatarColors[Math.abs(author.charCodeAt(0)) % avatarColors.length];
}

function createMessageAvatarElement(author, avatarSrc) {
    const normalizedAvatarSrc = getInboxProfileAvatarSource(avatarSrc);

    if (normalizedAvatarSrc) {
        const avatar = document.createElement('img');
        avatar.className = 'message-avatar';
        avatar.src = normalizedAvatarSrc;
        avatar.alt = `${author} avatar`;
        avatar.addEventListener('error', () => {
            avatar.replaceWith(createInboxInitialsAvatar('message-avatar', author));
        });
        return avatar;
    }

    return createInboxInitialsAvatar('message-avatar', author);
}

function updateConversationMessagesFromList(messages) {
    getVisibleConversations().forEach((conversation) => {
        setConversationMessages(conversation.id, messages.filter((message) =>
            String(message.conversationId) === String(conversation.id)
        ));
    });
}

async function loadAllMessagesFromBackend() {
    if (isRealtimeListenerActive('messages')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/messages`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Could not load messages');
        }

        const data = await response.json();
        updateConversationMessagesFromList(extractMessagesResponse(data));
        renderConversationList();

        if (selectedConversationId) {
            renderMessageThread();
        }
    } catch (error) {
        console.error('Failed to load inbox messages:', error);
    }
}

function renderConversationList() {
    const conversationsList = document.getElementById('conversationsList');
    if (!conversationsList) return;

    conversationsList.innerHTML = '';

    const conversations = getVisibleConversations();

    if (conversations.length === 0) {
        conversationsList.appendChild(createTextElement('p', 'friend-empty-state', 'Add friends or join study circles to start a conversation.'));
        return;
    }

    conversations.forEach((conversation) => {
        const convElement = document.createElement('div');
        convElement.className = `conversation-item ${String(selectedConversationId) === String(conversation.id) ? 'active' : ''}`;
        const conversationAvatarSrc = getInboxProfileAvatarSource(conversation.avatarUrl);

        const avatar = document.createElement('div');
        avatar.className = `conversation-avatar ${conversationAvatarSrc ? 'has-image' : ''}`.trim();

        if (conversationAvatarSrc) {
            const avatarImage = document.createElement('img');
            avatarImage.className = 'conversation-avatar-img';
            avatarImage.src = conversationAvatarSrc;
            avatarImage.alt = `${conversation.name}'s avatar`;
            avatarImage.addEventListener('error', () => {
                avatar.classList.remove('has-image');
                avatarImage.remove();
                avatar.textContent = conversation.avatar || getInitials(conversation.name);
            });
            avatar.appendChild(avatarImage);
        } else {
            avatar.textContent = conversation.avatar || getInitials(conversation.name);
        }

        const info = document.createElement('div');
        info.className = 'conversation-info';
        info.append(
            createTextElement('p', 'conversation-name', conversation.name),
            createTextElement('p', 'conversation-preview', getConversationPreview(conversation))
        );

        convElement.append(avatar, info);

        convElement.addEventListener('click', () => {
            selectConversation(conversation.id);
        });

        conversationsList.appendChild(convElement);
    });
}

function renderMessageThread() {
    const threadContent = document.getElementById('threadContent');
    const threadEmptyState = document.getElementById('threadEmptyState');
    const threadGroupName = document.getElementById('threadGroupName');
    const threadMembers = document.getElementById('threadMembers');
    const messagesList = document.getElementById('messagesList');

    if (!selectedConversationId) {
        threadContent.hidden = true;
        threadEmptyState.hidden = true;
        return;
    }

    const conversation = getVisibleConversations().find((c) =>
        String(c.id) === String(selectedConversationId)
    );
    if (!conversation) return;

    threadEmptyState.hidden = true;
    threadContent.hidden = false;

    threadGroupName.textContent = conversation.name;
    threadMembers.innerHTML = '';

    const members = Array.isArray(conversation.members) && conversation.members.length > 0
        ? conversation.members
        : ['StudyHive members'];

    members.forEach((member) => {
        const memberElement = document.createElement('span');
        memberElement.className = 'thread-member';
        const statusDot = document.createElement('span');
        statusDot.className = 'member-status-dot';
        memberElement.append(statusDot, document.createTextNode(` ${member}`));
        threadMembers.appendChild(memberElement);
    });

    messagesList.innerHTML = '';

    const messages = getConversationMessages(selectedConversationId);
    messages.forEach((message) => {
        const messageElement = document.createElement('div');
        const isOwn = isMessageFromCurrentUser(message);
        const author = isOwn ? (currentUser.name || 'You') : (message.author || 'StudyHive User');
        const avatarSrc = getMessageAvatarSource(message, conversation, isOwn);
        messageElement.className = `message ${isOwn ? 'own' : 'other'}`;

        const avatar = createMessageAvatarElement(author, avatarSrc);
        const content = document.createElement('div');
        content.className = 'message-content';

        const meta = document.createElement('div');
        meta.className = 'message-meta';
        meta.append(
            createTextElement('span', 'message-author', author),
            createTextElement('span', 'message-time', getMessageDisplayTime(message))
        );

        const text = createTextElement('div', 'message-text', message.text || '');

        content.append(meta, text);
        messageElement.append(avatar, content);

        messagesList.appendChild(messageElement);
    });

    messagesList.scrollTop = messagesList.scrollHeight;
}

async function selectConversation(conversationId) {
    selectedConversationId = String(conversationId);
    renderConversationList();

    if (isRealtimeListenerActive('messages') && realtimeMessagesLoaded) {
        renderMessageThread();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/messages?conversationId=${encodeURIComponent(selectedConversationId)}`, {
            headers: getAuthHeaders()
        });
        if (response.ok) {
            const data = await response.json();
            setConversationMessages(selectedConversationId, extractMessagesResponse(data));
            renderMessageThread();
        }
    } catch (error) {
        console.error('Failed to load messages:', error);
        renderMessageThread();
    }
}

async function handleSendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput || !selectedConversationId) return;

    const messageText = messageInput.value.trim();
    if (!messageText) return;

    try {
        const conversation = getVisibleConversations().find((c) =>
            String(c.id) === String(selectedConversationId)
        );

        const response = await fetch(`${API_BASE_URL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({
                conversationId: String(selectedConversationId),
                conversationName: conversation?.name || 'a conversation',
                conversationType: conversation?.conversationType || 'friend',
                circleId: conversation?.circleId || '',
                recipientIds: conversation?.memberUserIds || [],
                participantIds: conversation?.participantIds || [],
                text: messageText
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) throw new Error(data.error || 'Failed to send message');

        const newMessage = data.message || data;
        
        setConversationMessages(selectedConversationId, [
            ...getConversationMessages(selectedConversationId),
            newMessage
        ]);
        messageInput.value = '';
        renderConversationList();
        renderMessageThread();
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Could not send message. Please try again.');
    }
}

function initInboxSection() {
    const inboxSection = document.getElementById('inboxSection');

    if (inboxSection?.dataset.ready === 'true') {
        loadFriends();
        return;
    }

    if (inboxSection) {
        inboxSection.dataset.ready = 'true';
    }

    initFriendsPanel();
    renderConversationList();
    renderPendingInvitations();
    loadFriends();

    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const messageInput = document.getElementById('messageInput');

    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', handleSendMessage);
    }

    if (messageInput) {
        messageInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSendMessage();
            }
        });
    }

    // Re-render invitations when inbox section is viewed
    if (inboxSection) {
        const observer = new MutationObserver(() => {
            if (!inboxSection.hidden) {
                renderPendingInvitations();
                loadFriends();
            }
        });
        observer.observe(inboxSection, { attributes: true });
    }
}

function renderPendingInvitations() {
    const pendingInvitationsContainer = document.getElementById('pendingInvitations');
    const pendingInvitationsList = document.getElementById('pendingInvitationsList');

    if (!pendingInvitationsContainer || !pendingInvitationsList) return;

    pendingInvitations = getPendingInvitations();

    if (pendingInvitations.length === 0) {
        pendingInvitationsContainer.hidden = true;
        return;
    }

    pendingInvitationsContainer.hidden = false;
    pendingInvitationsList.innerHTML = '';

    pendingInvitations.forEach(invitation => {
        const item = document.createElement('div');
        item.className = 'pending-invitation-item';

        item.innerHTML = `
            <div class="invitation-content">
                <div class="invitation-from">From ${invitation.fromUser}</div>
                <div class="invitation-circle-name">${invitation.circleName}</div>
            </div>
            <div class="invitation-actions">
                <button type="button" class="btn-accept" data-invitation-id="${invitation.id}">Accept</button>
                <button type="button" class="btn-decline" data-invitation-id="${invitation.id}">Decline</button>
            </div>
        `;

        const acceptBtn = item.querySelector('.btn-accept');
        const declineBtn = item.querySelector('.btn-decline');

        acceptBtn.addEventListener('click', () => {
            handleAcceptInvitation(invitation.id, invitation.circleId, invitation.circleName);
        });

        declineBtn.addEventListener('click', () => {
            handleDeclineInvitation(invitation.id);
        });

        pendingInvitationsList.appendChild(item);
    });
}

function handleAcceptInvitation(invitationId, circleId, circleName) {
    acceptInvitation(invitationId);
    showToast(`Invitation for ${circleName} accepted`);
    syncStudyCircleViews(studyCircles, { persist: true });
    renderPendingInvitations();
}

function handleDeclineInvitation(invitationId) {
    declineInvitation(invitationId);
    showToast('✗ Invitation declined');
    renderPendingInvitations();
}

// Create Study Circle Modal Functions
function initCreateCircleModal() {
    const createCircleModal = document.getElementById('createCircleModal');
    const newCircleBtn = document.querySelector('.new-circle-btn');
    const createCircleForm = document.getElementById('createCircleForm');
    const circleName = document.getElementById('circleName');
    const circleDescription = document.getElementById('circleDescription');
    const memberSearch = document.getElementById('memberSearch');
    const memberCheckboxList = document.getElementById('memberCheckboxList');
    const selectedMembers = document.getElementById('selectedMembers');
    const descriptionCounter = document.getElementById('descriptionCounter');
    const cancelCircleBtn = document.getElementById('cancelCircleBtn');
    const closeButtons = document.querySelectorAll('[data-close-circle-modal]');
    const doneBtn = document.getElementById('doneBtn');

    selectedCircleMembers = [];

    // Open modal
    if (newCircleBtn) {
        newCircleBtn.addEventListener('click', () => openCreateCircleModal({
            mode: 'create',
            returnFocus: newCircleBtn
        }));
    }

    // Close modal handlers
    closeButtons.forEach(btn => {
        if (btn === doneBtn) return;
        btn.addEventListener('click', closeCreateCircleModal);
    });

    if (doneBtn) {
        doneBtn.addEventListener('click', () => {
            closeCreateCircleModal({ resetToForm: true });
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && createCircleModal.classList.contains('active')) {
            closeCreateCircleModal();
        }
    });

    // Form submission
    if (createCircleForm) {
        createCircleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCircleModalSubmit();
        });
    }

    // Character counter for description
    if (circleDescription) {
        circleDescription.addEventListener('input', () => {
            descriptionCounter.textContent = `${circleDescription.value.length}/200`;
        });
    }

    // Member search and checkbox list
    if (memberSearch) {
        memberSearch.addEventListener('input', filterAndRenderMembers);
    }

    renderMemberCheckboxes();
}

function setCircleModalMode(mode = 'create', circle = null) {
    circleModalMode = mode;
    inviteTargetCircle = mode === 'invite' ? circle : null;

    const title = document.getElementById('createCircleTitle');
    const circleName = document.getElementById('circleName');
    const circleDescription = document.getElementById('circleDescription');
    const circleNameGroup = circleName?.closest('.form-group');
    const circleDescriptionGroup = circleDescription?.closest('.form-group');
    const memberSearchLabel = document.querySelector('label[for="memberSearch"]');
    const submitButton = document.querySelector('#createCircleForm button[type="submit"]');
    const circleNameError = document.getElementById('circleNameError');

    if (circleNameError) circleNameError.textContent = '';

    if (mode === 'invite') {
        if (title) title.textContent = 'Invite Members';
        if (circleNameGroup) circleNameGroup.hidden = true;
        if (circleDescriptionGroup) circleDescriptionGroup.hidden = true;
        if (circleName) {
            circleName.required = false;
            circleName.value = circle?.name || '';
        }
        if (circleDescription) circleDescription.value = '';
        if (memberSearchLabel) memberSearchLabel.textContent = `Invite Friends to ${circle?.name || 'Study Circle'}`;
        if (submitButton) submitButton.textContent = 'Send Invites';
        return;
    }

    if (title) title.textContent = 'Create Study Circle';
    if (circleNameGroup) circleNameGroup.hidden = false;
    if (circleDescriptionGroup) circleDescriptionGroup.hidden = false;
    if (circleName) circleName.required = true;
    if (memberSearchLabel) memberSearchLabel.textContent = 'Invite Friends';
    if (submitButton) submitButton.textContent = 'Create Circle';
}

function openCreateCircleModal({ mode = 'create', circle = null, returnFocus = null } = {}) {
    const modal = document.getElementById('createCircleModal');
    const form = document.getElementById('createCircleForm');
    const formContainer = document.querySelector('.create-circle-form-container');
    const memberSearch = document.getElementById('memberSearch');

    circleModalReturnFocus = returnFocus;
    selectedCircleMembers = [];
    const selectedMembersDisplay = document.getElementById('selectedMembers');
    if (selectedMembersDisplay) {
        selectedMembersDisplay.innerHTML = '';
    }

    form.reset();
    document.getElementById('descriptionCounter').textContent = '0/200';
    document.getElementById('inviteLinkGroup').hidden = true;
    setCircleModalMode(mode, circle);
    if (memberSearch) memberSearch.value = '';
    renderMemberCheckboxes();

    formContainer.hidden = false;

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    if (mode === 'invite') {
        memberSearch?.focus();
    } else {
        document.getElementById('circleName')?.focus();
    }
}

function closeCreateCircleModal({ resetToForm = false } = {}) {
    const modal = document.getElementById('createCircleModal');
    const newCircleBtn = document.querySelector('.new-circle-btn');
    const form = document.getElementById('createCircleForm');
    const formContainer = document.querySelector('.create-circle-form-container');

    if (modal.contains(document.activeElement)) {
        document.activeElement.blur();
    }

    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');

    if (resetToForm) {
        form?.reset();
        if (formContainer) formContainer.hidden = false;
        selectedCircleMembers = [];
        setCircleModalMode('create');
        renderSelectedMembers();
    } else {
        setCircleModalMode('create');
    }

    if (circleModalReturnFocus && typeof circleModalReturnFocus.focus === 'function') {
        circleModalReturnFocus.focus();
    } else if (newCircleBtn) {
        newCircleBtn.focus();
    }

    circleModalReturnFocus = null;
}

function renderMemberCheckboxes(filter = '') {
    const memberCheckboxList = document.getElementById('memberCheckboxList');
    if (!memberCheckboxList) return;

    memberCheckboxList.innerHTML = '';

    const normalizedFilter = filter.trim().toLowerCase();
    const acceptedMemberIds = new Set(
        circleModalMode === 'invite' && inviteTargetCircle && Array.isArray(inviteTargetCircle.memberIds)
            ? inviteTargetCircle.memberIds.map(memberId => String(memberId))
            : []
    );
    const eligibleFriends = acceptedFriends.filter(friend => !acceptedMemberIds.has(String(friend.id)));
    const filtered = eligibleFriends.filter(friend =>
        `${friend.displayName || ''} ${friend.username || ''} ${friend.email || ''}`.toLowerCase().includes(normalizedFilter)
    );

    if (filtered.length === 0) {
        const emptyText = acceptedFriends.length === 0
            ? 'Add friends before inviting members.'
            : eligibleFriends.length === 0
                ? 'All friends are already accepted members of this circle.'
            : 'No friends match this search.';
        memberCheckboxList.appendChild(createTextElement('p', 'friend-empty-state', emptyText));
        return;
    }

    filtered.forEach(friend => {
        const friendId = String(friend.id);
        const friendName = friend.displayName || 'StudyHive User';
        const item = document.createElement('div');
        item.className = 'member-checkbox-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `member-${friendId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
        checkbox.value = friendId;
        checkbox.checked = selectedCircleMembers.includes(friendId);

        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = friendName;

        checkbox.addEventListener('change', (e) => {
            if (e.target.checked && !selectedCircleMembers.includes(friendId)) {
                selectedCircleMembers.push(friendId);
            } else {
                selectedCircleMembers = selectedCircleMembers.filter(memberId => memberId !== friendId);
            }
            renderSelectedMembers();
        });

        item.append(checkbox, label);
        memberCheckboxList.appendChild(item);
    });
}

function filterAndRenderMembers() {
    const memberSearch = document.getElementById('memberSearch');
    if (!memberSearch) return;
    renderMemberCheckboxes(memberSearch.value);
}

function renderSelectedMembers() {
    const selectedMembersDisplay = document.getElementById('selectedMembers');
    if (!selectedMembersDisplay) return;

    selectedMembersDisplay.innerHTML = '';

    selectedCircleMembers.forEach(memberId => {
        const chip = document.createElement('div');
        chip.className = 'member-chip';

        const text = document.createElement('span');
        text.textContent = getFriendDisplayName(memberId);

        const remove = document.createElement('span');
        remove.className = 'member-chip-remove';
        remove.textContent = '✕';
        remove.style.cursor = 'pointer';

        remove.addEventListener('click', () => {
            selectedCircleMembers = selectedCircleMembers.filter(id => id !== memberId);
            renderSelectedMembers();
            renderMemberCheckboxes(document.getElementById('memberSearch')?.value || '');
        });

        chip.append(text, remove);
        selectedMembersDisplay.appendChild(chip);
    });
}

function validateCircleForm() {
    const circleName = document.getElementById('circleName');
    const circleNameError = document.getElementById('circleNameError');

    circleNameError.textContent = '';

    if (!circleName.value.trim()) {
        circleNameError.textContent = 'Circle name is required';
        return false;
    }

    if (circleName.value.trim().length < 3) {
        circleNameError.textContent = 'Circle name must be at least 3 characters';
        return false;
    }

    return true;
}

function handleCircleModalSubmit() {
    if (circleModalMode === 'invite') {
        handleInviteCircleMembers();
        return;
    }

    handleCreateCircle();
}

async function handleCreateCircle() {
    if (!validateCircleForm()) return;

    const circleName = document.getElementById('circleName').value.trim();
    const circleDescription = document.getElementById('circleDescription').value.trim();
    const submitButton = document.querySelector('#createCircleForm button[type="submit"]');

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Creating...';
    }

    const backendCircle = await sendCircleToBackend(circleName, circleDescription, selectedCircleMembers);

    if (!backendCircle) {
        showToast('Could not save study circle. Check that the backend is running.');

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Create Circle';
        }

        return;
    }

    const circle = backendCircle;
    syncStudyCircleViews([...studyCircles, backendCircle], { persist: true });

    // Close the modal and show the existing toast instead of an inline success panel.
    showCircleCreatedSuccess(circle);

    // Update sidebar
    updateStudyCirclesList();

    // Update inbox with invitations
    updateInboxWithPendingInvitations();

    if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Create Circle';
    }
}

function showCircleInvitesSentSuccess(circle, invitations = []) {
    const inviteLinkGroup = document.getElementById('inviteLinkGroup');
    const pendingInvites = invitations.filter(invitation =>
        String(invitation.status || 'pending').toLowerCase() === 'pending' && !invitation.alreadyExists
    );
    const existingInvites = invitations.filter(invitation => invitation.alreadyExists);
    const alreadyMembers = invitations.filter(invitation => invitation.alreadyMember);
    let message = `Invites sent for ${circle.name}`;

    if (pendingInvites.length > 0) {
        message = `${pendingInvites.length} friend${pendingInvites.length !== 1 ? 's' : ''} invited to ${circle.name}.`;
    } else if (existingInvites.length > 0) {
        message = 'Those friends already have pending invitations.';
    } else if (alreadyMembers.length > 0) {
        message = 'Those friends are already members of this study circle.';
    }

    if (inviteLinkGroup) inviteLinkGroup.hidden = true;
    closeCreateCircleModal({ resetToForm: true });
    showToast(message);
}

async function handleInviteCircleMembers() {
    const circle = inviteTargetCircle || getSelectedStudyCircle();
    const submitButton = document.querySelector('#createCircleForm button[type="submit"]');

    if (!circle || !isJoinedStudyCircle(circle)) {
        showToast('Select a joined study circle before inviting members.');
        return;
    }

    if (selectedCircleMembers.length === 0) {
        showToast('Select at least one friend to invite.');
        return;
    }

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
    }

    const result = await sendCircleInvitesToBackend(circle.id, selectedCircleMembers);

    if (!result) {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Send Invites';
        }
        return;
    }

    selectedCircleMembers = [];
    renderSelectedMembers();
    renderMemberCheckboxes(document.getElementById('memberSearch')?.value || '');
    showCircleInvitesSentSuccess(circle, result.invitations || []);

    if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Send Invites';
    }
}

function showCircleCreatedSuccess(circle) {
    const inviteLinkGroup = document.getElementById('inviteLinkGroup');
    const inviteMessage = selectedCircleMembers.length > 0
        ? `${selectedCircleMembers.length} friend${selectedCircleMembers.length !== 1 ? 's' : ''} invited`
        : 'You can invite friends later.';

    if (inviteLinkGroup) inviteLinkGroup.hidden = true;
    closeCreateCircleModal({ resetToForm: true });
    showToast(`Study circle "${circle.name}" created successfully! ${inviteMessage}`);
}

function createCircleIconElement(circle = {}) {
    const icon = document.createElement('div');
    icon.className = 'circle-icon';
    icon.textContent = circle.avatar || DEFAULT_CIRCLE_AVATAR;
    return icon;
}

function updateStudyCirclesList(circles = joinedStudyCircles) {
    // Update the right sidebar with new circles
    const visibleCircles = getJoinedStudyCircles(circles);
    const circlesList = document.querySelector('.circles-list');

    if (!circlesList) return;

    circlesList.innerHTML = '';

    visibleCircles.forEach(circle => {
        const circleItem = document.createElement('div');
        circleItem.className = 'circle-item';
        circleItem.dataset.circleId = circle.id;
        circleItem.append(
            createCircleIconElement(circle),
            createTextElement('span', 'circle-name', circle.name)
        );

        circleItem.addEventListener('click', () => {
            selectCircleForMemberDisplay(circle);
        });

        circlesList.appendChild(circleItem);
    });

    if (selectedStudyCircleId) {
        const selectedCircle = visibleCircles.find(circle => String(circle.id) === String(selectedStudyCircleId));

        if (selectedCircle) {
            selectCircleForMemberDisplay(selectedCircle);
        } else {
            clearSelectedCircleForMemberDisplay();
        }
    }
}

function selectCircleForMemberDisplay(circle) {
    selectedStudyCircleId = circle.id;

    renderActiveFriendsList();
    updateAddMemberButton(circle);
    updateLeaveCircleButton(circle);
    updateDeleteCircleButton(circle);
}

function clearSelectedCircleForMemberDisplay() {
    selectedStudyCircleId = null;

    const activeMembers = document.querySelector('.active-members');
    if (activeMembers) {
        renderActiveFriendsList();
    }

    updateLeaveCircleButton(null);
    updateDeleteCircleButton(null);
    updateAddMemberButton(null);
}

function updateAddMemberButton(circle) {
    if (!addMemberBtn) return;

    // Only show if current user is the creator/owner of the circle
    const canInvite = Boolean(circle && isCurrentUserCircleOwner(circle));
    addMemberBtn.hidden = !canInvite;
    addMemberBtn.disabled = false;
    addMemberBtn.textContent = 'Add Member';
    addMemberBtn.title = canInvite ? 'Invite accepted friends to this study circle.' : '';
    addMemberBtn.dataset.circleId = circle?.id || '';
}

function updateLeaveCircleButton(circle) {
    if (!leaveCircleBtn) return;

    const canSeeButton = Boolean(circle && isJoinedStudyCircle(circle));
    leaveCircleBtn.hidden = !canSeeButton;
    leaveCircleBtn.disabled = false;
    leaveCircleBtn.textContent = 'Leave Circle';
    leaveCircleBtn.title = '';
    leaveCircleBtn.dataset.circleId = circle?.id || '';

    if (!canSeeButton) {
        return;
    }

    if (isCurrentUserCircleAdmin(circle)) {
        leaveCircleBtn.disabled = true;
        leaveCircleBtn.title = 'Creators and admins cannot leave until ownership or admin responsibilities are transferred.';
    }
}

function updateDeleteCircleButton(circle) {
    if (!deleteCircleBtn) return;

    const canDelete = Boolean(circle && isJoinedStudyCircle(circle) && isCurrentUserCircleOwner(circle));
    deleteCircleBtn.hidden = !canDelete;
    deleteCircleBtn.disabled = false;
    deleteCircleBtn.textContent = 'Delete Group';
    deleteCircleBtn.title = canDelete ? 'Permanently delete this study circle for all members.' : '';
    deleteCircleBtn.dataset.circleId = circle?.id || '';
}

function getSelectedStudyCircle() {
    return joinedStudyCircles.find(circle => String(circle.id) === String(selectedStudyCircleId))
        || studyCircles.find(circle => String(circle.id) === String(selectedStudyCircleId))
        || null;
}

function openAddMemberModal(circle) {
    if (!circle || !isJoinedStudyCircle(circle)) {
        showToast('Select a study circle before inviting members.');
        return;
    }

    openCreateCircleModal({
        mode: 'invite',
        circle,
        returnFocus: addMemberBtn
    });
}

function openLeaveCircleConfirmation(circle) {
    if (!circle || !isJoinedStudyCircle(circle)) return;

    if (isCurrentUserCircleAdmin(circle)) {
        showToast('Creators and admins cannot leave until ownership is transferred.');
        return;
    }

    pendingDangerAction = 'leave circle';
    pendingLeaveCircle = circle;

    if (!dangerConfirmModal || !dangerModalTitle || !dangerModalMessage || !confirmDangerActionBtn) {
        const confirmed = window.confirm(`Leave ${circle.name}?`);
        if (confirmed) {
            confirmLeaveStudyCircle();
        }
        return;
    }

    dangerModalTitle.textContent = 'Leave study circle?';
    dangerModalMessage.textContent = `You will be removed from ${circle.name}. It will disappear from your sidebar and post category list.`;
    confirmDangerActionBtn.textContent = 'Leave Circle';
    confirmDangerActionBtn.style.backgroundColor = '#d32f2f';
    confirmDangerActionBtn.disabled = false;

    dangerConfirmModal.classList.add('open');
    dangerConfirmModal.setAttribute('aria-hidden', 'false');
    confirmDangerActionBtn.focus();
}

function openDeleteCircleConfirmation(circle) {
    if (!circle || !isJoinedStudyCircle(circle)) return;

    if (!isCurrentUserCircleOwner(circle)) {
        showToast('Only the study circle owner can delete this group.');
        return;
    }

    pendingDangerAction = 'delete circle';
    pendingDeleteCircle = circle;

    if (!dangerConfirmModal || !dangerModalTitle || !dangerModalMessage || !confirmDangerActionBtn) {
        const confirmed = window.confirm(`Delete ${circle.name}? This cannot be undone.`);
        if (confirmed) {
            confirmDeleteStudyCircle();
        }
        return;
    }

    dangerModalTitle.textContent = 'Delete study circle?';
    dangerModalMessage.textContent = `This will permanently delete ${circle.name} for all members and remove pending invitations. This cannot be undone.`;
    confirmDangerActionBtn.textContent = 'Delete Group';
    confirmDangerActionBtn.style.backgroundColor = '#d32f2f';
    confirmDangerActionBtn.disabled = false;

    dangerConfirmModal.classList.add('open');
    dangerConfirmModal.setAttribute('aria-hidden', 'false');
    confirmDangerActionBtn.focus();
}

function replaceStudyCircleInState(updatedCircle) {
    if (!updatedCircle) return;

    const normalizedCircle = normalizeCircleForUi(updatedCircle);
    if (!normalizedCircle) return;

    const nextCircles = studyCircles.some(circle => String(circle.id) === String(normalizedCircle.id))
        ? studyCircles.map(circle => String(circle.id) === String(normalizedCircle.id) ? normalizedCircle : circle)
        : [...studyCircles, normalizedCircle];

    syncStudyCircleViews(nextCircles, { persist: true });
}

function removeStudyCircleFromState(circleId) {
    const nextCircles = studyCircles.filter(circle => String(circle.id) !== String(circleId));
    syncStudyCircleViews(nextCircles, { persist: true });
}

async function confirmDeleteStudyCircle() {
    const circle = pendingDeleteCircle;
    if (!circle) return;

    if (confirmDangerActionBtn) {
        confirmDangerActionBtn.disabled = true;
        confirmDangerActionBtn.textContent = 'Deleting...';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/circles/${encodeURIComponent(circle.id)}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || 'Could not delete study circle');
        }

        selectedStudyCircleId = null;
        removeStudyCircleFromState(circle.id);
        clearSelectedCircleForMemberDisplay();
        await fetchStudyCirclesFromBackend();
        renderMemberCheckboxes(document.getElementById('memberSearch')?.value || '');
        closeDangerModal();
        showToast(`Deleted ${circle.name}`);
    } catch (error) {
        console.error('Delete study circle failed:', error);
        showToast(error.message || 'Could not delete study circle');

        if (confirmDangerActionBtn) {
            confirmDangerActionBtn.disabled = false;
            confirmDangerActionBtn.textContent = 'Delete Group';
        }
    }
}

async function confirmLeaveStudyCircle() {
    const circle = pendingLeaveCircle;
    if (!circle) return;

    if (confirmDangerActionBtn) {
        confirmDangerActionBtn.disabled = true;
        confirmDangerActionBtn.textContent = 'Leaving...';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/circles/${encodeURIComponent(circle.id)}/members/me`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || 'Could not leave study circle');
        }

        selectedStudyCircleId = null;
        replaceStudyCircleInState(data.circle);
        clearSelectedCircleForMemberDisplay();
        await fetchStudyCirclesFromBackend();
        renderMemberCheckboxes(document.getElementById('memberSearch')?.value || '');
        closeDangerModal();
        showToast(`Left ${circle.name}`);
    } catch (error) {
        console.error('Leave study circle failed:', error);
        showToast(error.message || 'Could not leave study circle');

        if (confirmDangerActionBtn) {
            confirmDangerActionBtn.disabled = false;
            confirmDangerActionBtn.textContent = 'Leave Circle';
        }
    }
}

function initLeaveCircleButton() {
    if (!leaveCircleBtn || leaveCircleBtn.dataset.ready === 'true') return;

    leaveCircleBtn.dataset.ready = 'true';
    leaveCircleBtn.addEventListener('click', () => {
        openLeaveCircleConfirmation(getSelectedStudyCircle());
    });
}

function initAddMemberButton() {
    if (!addMemberBtn || addMemberBtn.dataset.ready === 'true') return;

    addMemberBtn.dataset.ready = 'true';
    addMemberBtn.addEventListener('click', () => {
        openAddMemberModal(getSelectedStudyCircle());
    });
}

function initDeleteCircleButton() {
    if (!deleteCircleBtn || deleteCircleBtn.dataset.ready === 'true') return;

    deleteCircleBtn.dataset.ready = 'true';
    deleteCircleBtn.addEventListener('click', () => {
        openDeleteCircleConfirmation(getSelectedStudyCircle());
    });
}

function updateInboxWithPendingInvitations() {
    // Update inbox to show pending invitations
    // This will be called when switching to inbox section
}

// ========================================
// GLOBAL SEARCH
// ========================================

const SEARCH_DEBOUNCE_MS = 600;
const SEARCH_MIN_CHARS = 2;
let searchDebounceTimer = null;
let activeSearchController = null;
let lastGlobalSearchQuery = '';
let lastGlobalSearchCompleted = false;
let searchHighlightTimer = null;

function setSearchDropdownOpen(isOpen) {
    if (!globalSearchResults || !globalSearchInput) return;

    globalSearchResults.hidden = !isOpen;
    globalSearchInput.setAttribute('aria-expanded', String(isOpen));
}

function setSearchStatus(message, { loading = false } = {}) {
    if (!globalSearchStatus) return;

    globalSearchStatus.hidden = !message;
    globalSearchStatus.textContent = message || '';
    globalSearchStatus.classList.toggle('is-loading', loading);
}

function clearSearchResults() {
    if (globalSearchContent) {
        globalSearchContent.innerHTML = '';
    }
}

function closeSearchDropdown() {
    setSearchDropdownOpen(false);
}

function isImageSearchAvatar(value = '') {
    return /^(https?:|data:image|blob:|\.\/|\/|frontend\/)/i.test(String(value));
}

function createSearchResultMedia(result, fallbackIcon) {
    const value = result.avatar || fallbackIcon;

    if (isImageSearchAvatar(value)) {
        const image = document.createElement('img');
        image.className = 'search-result-avatar';
        image.src = normalizeProfileAvatarSource(value);
        image.alt = result.title || 'Search result';
        return image;
    }

    const icon = document.createElement('span');
    icon.className = 'search-result-icon';
    icon.textContent = value || fallbackIcon;
    return icon;
}

function createSearchResultItem(result, fallbackIcon) {
    const item = document.createElement('button');
    item.className = 'search-result-item';
    item.type = 'button';
    item.setAttribute('role', 'option');

    const text = document.createElement('div');
    text.className = 'search-result-text';

    const title = document.createElement('div');
    title.className = 'search-result-title';
    title.textContent = result.title || result.name || 'Untitled';

    const subtitle = document.createElement('div');
    subtitle.className = 'search-result-subtitle';
    subtitle.textContent = result.subtitle || '';

    text.append(title, subtitle);

    if (result.description) {
        const description = document.createElement('div');
        description.className = 'search-result-description';
        description.textContent = result.description;
        text.appendChild(description);
    }

    item.append(createSearchResultMedia(result, fallbackIcon), text);
    item.addEventListener('click', () => handleSearchResultClick(result));

    return item;
}

function renderSearchSection(title, items, fallbackIcon) {
    if (!items || items.length === 0) return null;

    const section = document.createElement('section');
    section.className = 'search-results-section';

    const heading = document.createElement('div');
    heading.className = 'search-section-title';
    heading.textContent = title;

    section.appendChild(heading);
    items.forEach((item) => {
        section.appendChild(createSearchResultItem(item, fallbackIcon));
    });

    return section;
}

function renderSearchResults(results, query) {
    clearSearchResults();
    setSearchStatus('');

    const sections = [
        renderSearchSection('Posts', results.posts, '📝'),
        renderSearchSection('Users', results.users, '👤'),
        renderSearchSection('Study Circles', results.circles, '👥')
    ].filter(Boolean);

    if (sections.length === 0) {
        setSearchStatus(`No results for "${query}"`);
        return;
    }

    sections.forEach((section) => globalSearchContent.appendChild(section));
}

function findPostElement(postId) {
    return [...document.querySelectorAll('.post')].find((post) => post.dataset.postId === postId);
}

function findCircleElement(circleId) {
    return [...document.querySelectorAll('.circle-item')].find((circle) => circle.dataset.circleId === circleId);
}

function highlightSearchTarget(element) {
    if (!element) return;

    document.querySelectorAll('.search-result-focus').forEach((target) => {
        target.classList.remove('search-result-focus');
    });

    element.classList.add('search-result-focus');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    clearTimeout(searchHighlightTimer);
    searchHighlightTimer = setTimeout(() => {
        element.classList.remove('search-result-focus');
    }, 2400);
}

async function openSearchPostResult(result) {
    const postId = result.postId || result.id;
    showDashboardSection('feed');

    let postElement = findPostElement(postId);

    if (!postElement) {
        await loadPosts();
        postElement = findPostElement(postId);
    }

    if (postElement) {
        highlightSearchTarget(postElement);
        return;
    }

    showToast('Post found, but it is not loaded in the feed yet.');
}

function closeSearchProfileModal() {
    if (!searchProfileModal) return;

    searchProfileModal.hidden = true;
    searchProfileModal.setAttribute('aria-hidden', 'true');
    activeSearchProfileUser = null;
}

function setSearchProfileButton(button, { hidden = false, text = '', disabled = false } = {}) {
    if (!button) return;

    button.hidden = hidden;
    button.disabled = disabled;
    if (text) {
        button.textContent = text;
    }
}

function updateSearchProfileActions() {
    if (!activeSearchProfileUser) return;

    const userId = activeSearchProfileUser.id;
    const connection = getLocalConnectionStatus(userId);
    const hasUserId = Boolean(userId);
    const isCurrentUser = String(userId) === String(getCurrentUserId());

    console.log('[search-profile] resolved friend action', {
        currentUserId: getCurrentUserId(),
        profileUserId: userId,
        status: connection.status,
        direction: connection.direction,
        requestId: connection.requestId || null,
        friendDataLoaded
    });

    if (!hasUserId || isCurrentUser) {
        setSearchProfileButton(searchProfileAddFriendBtn, { hidden: true });
        setSearchProfileButton(searchProfileMessageBtn, { hidden: true });
        setSearchProfileButton(searchProfileUnfriendBtn, { hidden: true });
        return;
    }

    if (connection.status === 'accepted') {
        setSearchProfileButton(searchProfileAddFriendBtn, { hidden: true });
        setSearchProfileButton(searchProfileMessageBtn, { hidden: false, text: 'Message', disabled: false });
        setSearchProfileButton(searchProfileUnfriendBtn, { hidden: false, text: 'Unfriend', disabled: false });
        return;
    }

    setSearchProfileButton(searchProfileMessageBtn, { hidden: true });
    setSearchProfileButton(searchProfileUnfriendBtn, { hidden: true });

    if (connection.status === 'pending' && connection.direction === 'incoming') {
        setSearchProfileButton(searchProfileAddFriendBtn, { hidden: false, text: 'Accept Request', disabled: false });
        return;
    }

    if (connection.status === 'pending') {
        setSearchProfileButton(searchProfileAddFriendBtn, { hidden: false, text: 'Pending', disabled: true });
        return;
    }

    setSearchProfileButton(searchProfileAddFriendBtn, { hidden: false, text: 'Add Friend', disabled: false });
}

async function handleSearchProfileAddFriend() {
    if (!activeSearchProfileUser) return;

    const connection = getLocalConnectionStatus(activeSearchProfileUser.id);

    if (connection.status === 'pending' && connection.direction === 'incoming') {
        await acceptFriendRequest(connection.requestId);
        return;
    }

    if (connection.status !== 'accepted' && connection.status !== 'pending') {
        await sendFriendRequest(activeSearchProfileUser.id);
    }
}

function handleSearchProfileMessage() {
    if (!activeSearchProfileUser) return;

    const connection = getLocalConnectionStatus(activeSearchProfileUser.id);
    if (connection.status !== 'accepted') return;

    const friend = connection.friend || getFriendById(activeSearchProfileUser.id);
    if (!friend) return;

    closeSearchProfileModal();
    showDashboardSection('inbox');
    selectConversation(buildFriendConversation(friend).id);
}

async function handleSearchProfileUnfriend() {
    if (!activeSearchProfileUser) return;

    const shouldUnfriend = confirm(`Remove ${activeSearchProfileUser.title || 'this user'} from your friends?`);
    if (!shouldUnfriend) return;

    await unfriendUser(activeSearchProfileUser.id);
}

async function openSearchUserResult(result) {
    if (!searchProfileModal || !searchProfileAvatar || !searchProfileName || !searchProfileMeta || !searchProfileBio) {
        showToast(`Opened ${result.title || 'user'} profile`);
        return;
    }

    activeSearchProfileUser = {
        id: result.id || result.userId || result.uid,
        title: result.title || result.name || 'StudyHive User',
        subtitle: result.subtitle || result.username || 'StudyHive member',
        description: result.description || '',
        avatar: normalizeProfileAvatarSource(result.avatar || DEFAULT_PROFILE_AVATAR)
    };

    searchProfileAvatar.src = activeSearchProfileUser.avatar;
    searchProfileAvatar.alt = activeSearchProfileUser.title;
    searchProfileName.textContent = activeSearchProfileUser.title;
    searchProfileMeta.textContent = activeSearchProfileUser.subtitle;
    searchProfileBio.textContent = activeSearchProfileUser.description;
    setSearchProfileButton(searchProfileAddFriendBtn, { hidden: false, text: 'Loading...', disabled: true });
    setSearchProfileButton(searchProfileMessageBtn, { hidden: true });
    setSearchProfileButton(searchProfileUnfriendBtn, { hidden: true });

    searchProfileModal.hidden = false;
    searchProfileModal.setAttribute('aria-hidden', 'false');
    searchProfileModal.querySelector('.search-profile-close')?.focus();

    await loadFriends();
    updateSearchProfileActions();
}

function openSearchCircleResult(result) {
    const circle = normalizeCircleForUi({
        id: result.id,
        name: result.name || result.title,
        description: result.description || result.subtitle,
        members: result.members || [],
        createdBy: result.createdBy || '',
        inviteLink: result.inviteLink || '',
        avatar: result.avatar || DEFAULT_CIRCLE_AVATAR
    });

    if (!circle) return;

    syncStudyCircleViews([...studyCircles, circle], { persist: true });
    selectCircleForMemberDisplay(circle);
    highlightSearchTarget(findCircleElement(circle.id));
    showToast(`Opened ${circle.name}`);
}

function handleSearchResultClick(result) {
    closeSearchDropdown();

    if (result.type === 'post') {
        openSearchPostResult(result);
        return;
    }

    if (result.type === 'user') {
        openSearchUserResult(result);
        return;
    }

    if (result.type === 'circle') {
        openSearchCircleResult(result);
    }
}

async function runGlobalSearch(query) {
    const searchQuery = String(query || '').trim();

    if (searchQuery.length < SEARCH_MIN_CHARS) {
        if (activeSearchController) {
            activeSearchController.abort();
            activeSearchController = null;
        }
        clearSearchResults();
        setSearchStatus('');
        closeSearchDropdown();
        lastGlobalSearchQuery = '';
        lastGlobalSearchCompleted = false;
        return;
    }

    if (searchQuery === lastGlobalSearchQuery && lastGlobalSearchCompleted) {
        setSearchDropdownOpen(true);
        return;
    }

    if (activeSearchController) {
        activeSearchController.abort();
    }

    activeSearchController = new AbortController();
    const searchController = activeSearchController;
    lastGlobalSearchQuery = searchQuery;
    lastGlobalSearchCompleted = false;
    setSearchDropdownOpen(true);
    clearSearchResults();
    setSearchStatus('Searching...', { loading: true });

    try {
        const response = await fetch(`${API_BASE_URL}/search/all?q=${encodeURIComponent(searchQuery)}`, {
            headers: getAuthHeaders(),
            signal: searchController.signal
        });

        if (!response.ok) {
            throw new Error('Search failed');
        }

        const results = await response.json();

        if (globalSearchInput.value.trim() !== searchQuery) {
            return;
        }

        renderSearchResults(results, searchQuery);
        lastGlobalSearchCompleted = true;
    } catch (error) {
        if (error.name === 'AbortError') return;

        console.error('Search failed:', error);
        clearSearchResults();
        setSearchStatus('Search is unavailable right now.');
    } finally {
        if (activeSearchController === searchController) {
            activeSearchController = null;
        }
    }
}

function queueGlobalSearch() {
    clearTimeout(searchDebounceTimer);

    searchDebounceTimer = setTimeout(() => {
        runGlobalSearch(globalSearchInput.value);
    }, SEARCH_DEBOUNCE_MS);
}

function initGlobalSearch() {
    if (!globalSearch || !globalSearchInput || !globalSearchButton || !globalSearchResults) return;
    if (globalSearch.dataset.ready === 'true') return;

    globalSearch.dataset.ready = 'true';
    closeSearchDropdown();

    globalSearchInput.addEventListener('input', queueGlobalSearch);
    globalSearchInput.addEventListener('focus', () => {
        if (globalSearchInput.value.trim()) {
            setSearchDropdownOpen(true);
        }
    });
    globalSearchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeSearchDropdown();
            globalSearchInput.blur();
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            clearTimeout(searchDebounceTimer);
            runGlobalSearch(globalSearchInput.value);
        }
    });

    globalSearchButton.addEventListener('click', () => {
        clearTimeout(searchDebounceTimer);
        runGlobalSearch(globalSearchInput.value);
        globalSearchInput.focus();
    });

    document.addEventListener('click', (event) => {
        if (!globalSearch.contains(event.target)) {
            closeSearchDropdown();
        }
    });
}

function initSearchProfileModal() {
    if (!searchProfileModal) return;

    closeSearchProfileButtons.forEach((button) => {
        button.addEventListener('click', closeSearchProfileModal);
    });

    searchProfileAddFriendBtn?.addEventListener('click', handleSearchProfileAddFriend);
    searchProfileMessageBtn?.addEventListener('click', handleSearchProfileMessage);
    searchProfileUnfriendBtn?.addEventListener('click', handleSearchProfileUnfriend);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !searchProfileModal.hidden) {
            closeSearchProfileModal();
        }
    });
}

// ========================================
// FIRESTORE REALTIME UPDATES
// ========================================

const realtimeUnsubscribers = {
    notifications: null,
    incomingFriendRequests: null,
    outgoingFriendRequests: null,
    messages: null
};
const realtimeListenerOwners = {};
let realtimeUserId = null;
let realtimeLifecycleEventsBound = false;
let realtimeFriendRefreshTimer = null;
let realtimeMessagesCache = [];
let realtimeMessagesLoaded = false;
let realtimeNotificationsLoaded = false;
const MUTED_NOTIFICATION_TYPES = new Set(['upvote', 'bookmark']);

function getActiveRealtimeListenerKeys() {
    return Object.entries(realtimeUnsubscribers)
        .filter(([, unsubscribe]) => typeof unsubscribe === 'function')
        .map(([key]) => key);
}

function logActiveRealtimeListenerCount(action, key = '') {
    const activeKeys = getActiveRealtimeListenerKeys();
    console.log('[firestore:listeners]', {
        action,
        key,
        activeCount: activeKeys.length,
        activeKeys
    });
}

function isRealtimeListenerActive(key) {
    return typeof realtimeUnsubscribers[key] === 'function';
}

function hasRealtimeListenerForUser(key, userId) {
    return isRealtimeListenerActive(key) && realtimeListenerOwners[key] === userId;
}

function registerRealtimeListener(key, userId, unsubscribe) {
    if (typeof unsubscribe !== 'function') return false;

    if (hasRealtimeListenerForUser(key, userId)) {
        unsubscribe();
        logActiveRealtimeListenerCount('duplicate-skipped', key);
        return false;
    }

    if (isRealtimeListenerActive(key)) {
        realtimeUnsubscribers[key]();
    }

    realtimeUnsubscribers[key] = unsubscribe;
    realtimeListenerOwners[key] = userId;
    logActiveRealtimeListenerCount('started', key);
    return true;
}

function unsubscribeRealtimeListener(key) {
    const hadListener = typeof realtimeUnsubscribers[key] === 'function';

    if (hadListener) {
        try {
            realtimeUnsubscribers[key]();
        } catch (error) {
            console.warn(`Could not unsubscribe realtime listener "${key}":`, error);
        }
    }

    realtimeUnsubscribers[key] = null;
    delete realtimeListenerOwners[key];

    if (hadListener) {
        logActiveRealtimeListenerCount('stopped', key);
    }
}

function isRealtimeReady() {
    return Boolean(
        firebaseDb
        && firebaseCollection
        && firebaseQuery
        && firebaseWhere
        && firebaseOrderBy
        && firebaseLimit
        && firebaseDoc
        && firebaseSetDoc
        && firebaseOnSnapshot
    );
}

function getTimestampValueMillis(value) {
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.toDate === 'function') return value.toDate().getTime();
    if (typeof value.seconds === 'number') return (value.seconds * 1000) + Math.floor((value.nanoseconds || 0) / 1000000);
    if (typeof value._seconds === 'number') return (value._seconds * 1000) + Math.floor((value._nanoseconds || 0) / 1000000);

    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
}

function setNotificationBadgeCount(count) {
    if (!notificationBadge) return;

    if (count > 0) {
        notificationBadge.textContent = count > 99 ? '99+' : count;
        notificationBadge.style.display = 'flex';
    } else {
        notificationBadge.style.display = 'none';
    }
}

function stopRealtimeListeners() {
    Object.keys(realtimeUnsubscribers).forEach((key) => {
        unsubscribeRealtimeListener(key);
    });

    if (realtimeFriendRefreshTimer) {
        clearTimeout(realtimeFriendRefreshTimer);
        realtimeFriendRefreshTimer = null;
    }

    realtimeUserId = null;
    userPresenceById = new Map();
    activeFriendsFromPresence = [];
    realtimeMessagesCache = [];
    realtimeMessagesLoaded = false;
    realtimeNotificationsLoaded = false;
}

function bindRealtimeLifecycleEvents() {
    if (realtimeLifecycleEventsBound) return;
    realtimeLifecycleEventsBound = true;

    window.addEventListener('pagehide', stopRealtimeListeners);
    window.addEventListener('beforeunload', stopRealtimeListeners);
    window.addEventListener('pageshow', () => {
        if (getCurrentUserId() && isRealtimeReady()) {
            startRealtimeListeners();
        }
    });
}

function getSnapshotItems(snapshot) {
    return snapshot.docs.map((snapshotDoc) => ({
        id: snapshotDoc.id,
        ...snapshotDoc.data()
    }));
}

function shouldDisplayNotification(notification = {}) {
    return !MUTED_NOTIFICATION_TYPES.has(String(notification.type || '').toLowerCase());
}

function startNotificationRealtimeListener(userId) {
    if (hasRealtimeListenerForUser('notifications', userId)) return;

    const notificationsQuery = firebaseQuery(
        firebaseCollection(firebaseDb, 'notifications'),
        firebaseWhere('userId', '==', userId),
        firebaseOrderBy('createdAt', 'desc'),
        firebaseLimit(50)
    );

    // Keeps the existing notification dropdown and badge in sync with Firestore.
    const unsubscribe = firebaseOnSnapshot(notificationsQuery, (snapshot) => {
        console.log('[realtime:notifications] snapshot received', {
            userId,
            size: snapshot.size,
            changes: snapshot.docChanges().map((change) => {
                const data = change.doc.data();

                return {
                    changeType: change.type,
                    notificationId: change.doc.id,
                    notificationType: data.type || 'notification',
                    notificationUserId: data.userId,
                    read: Boolean(data.read)
                };
            })
        });

        const notifications = getSnapshotItems(snapshot)
            .filter(shouldDisplayNotification)
            .sort((a, b) => parseNotificationTimestamp(b.createdAt) - parseNotificationTimestamp(a.createdAt));

        realtimeNotificationsLoaded = true;
        displayNotifications(notifications);
        setNotificationBadgeCount(notifications.filter((notification) => !notification.read).length);
    }, (error) => {
        console.error('Realtime notifications failed; fetch fallback is still active:', error);
    });

    registerRealtimeListener('notifications', userId, unsubscribe);
}

function scheduleRealtimeFriendRefresh() {
    clearTimeout(realtimeFriendRefreshTimer);

    realtimeFriendRefreshTimer = setTimeout(async () => {
        await loadFriends({ force: true });
        applyRealtimeMessagesToConversations(realtimeMessagesCache);

        if (friendSearchInput?.value.trim().length >= 2) {
            await searchFriends({ force: true });
        }

        updateSearchProfileActions();
    }, 150);
}

function startFriendRealtimeListeners(userId) {
    const friendRequestCollection = firebaseCollection(firebaseDb, 'friendRequests');

    // Incoming requests drive the Friend Requests panel and Accept Request states.
    if (!hasRealtimeListenerForUser('incomingFriendRequests', userId)) {
        registerRealtimeListener(
            'incomingFriendRequests',
            userId,
            firebaseOnSnapshot(
                firebaseQuery(friendRequestCollection, firebaseWhere('toUserId', '==', userId)),
                scheduleRealtimeFriendRefresh,
                (error) => console.error('Realtime incoming friend requests failed; fetch fallback is still active:', error)
            )
        );
    }

    // Outgoing requests drive Pending states in search/profile actions.
    if (!hasRealtimeListenerForUser('outgoingFriendRequests', userId)) {
        registerRealtimeListener(
            'outgoingFriendRequests',
            userId,
            firebaseOnSnapshot(
                firebaseQuery(friendRequestCollection, firebaseWhere('fromUserId', '==', userId)),
                scheduleRealtimeFriendRefresh,
                (error) => console.error('Realtime outgoing friend requests failed; fetch fallback is still active:', error)
            )
        );
    }
}

function applyRealtimeMessagesToConversations(realtimeMessages) {
    getVisibleConversations().forEach((conversation) => {
        const conversationMessagesFromSnapshot = realtimeMessages.filter((message) =>
            String(message.conversationId) === String(conversation.id)
        );

        setConversationMessages(
            conversation.id,
            mergeMessagesById(getConversationMessages(conversation.id), conversationMessagesFromSnapshot)
        );
    });

    renderConversationList();

    if (selectedConversationId) {
        renderMessageThread();
    }
}

function startMessageRealtimeListener(userId) {
    if (hasRealtimeListenerForUser('messages', userId)) return;

    const messagesQuery = firebaseQuery(
        firebaseCollection(firebaseDb, 'messages'),
        firebaseWhere('participantIds', 'array-contains', userId),
        firebaseLimit(200)
    );

    // Merges Firestore message snapshots into the existing inbox state by message id.
    const unsubscribe = firebaseOnSnapshot(messagesQuery, (snapshot) => {
        realtimeMessagesCache = getSnapshotItems(snapshot);
        realtimeMessagesLoaded = true;
        applyRealtimeMessagesToConversations(realtimeMessagesCache);
    }, (error) => {
        console.error('Realtime messages failed; fetch fallback is still active:', error);
    });

    registerRealtimeListener('messages', userId, unsubscribe);
}

function startRealtimeListeners() {
    const userId = getCurrentUserId();

    if (!userId || !isRealtimeReady()) return;
    if (realtimeUserId === userId) {
        logActiveRealtimeListenerCount('already-running', 'all');
        return;
    }

    stopRealtimeListeners();
    realtimeUserId = userId;
    bindRealtimeLifecycleEvents();

    startNotificationRealtimeListener(userId);
    startFriendRealtimeListeners(userId);
    startMessageRealtimeListener(userId);
    logActiveRealtimeListenerCount('ready', 'all');
}

// ========================================
// LOGOUT FUNCTIONALITY
// ========================================

function initLogout() {
    const logoutButton = document.querySelector('.profile-menu-logout')

    if (!logoutButton || logoutButton.dataset.ready === 'true') return

    logoutButton.dataset.ready = 'true'
    logoutButton.addEventListener('click', handleLogout)
}

function handleLogout(e) {
    e.preventDefault()

    // Show confirmation modal
    const title = 'Confirm Logout'
    const message = 'Are you sure you want to log out? You\'ll need to sign in again to access your account.'

    showLogoutConfirmation(title, message)
}

function showLogoutConfirmation(title, message) {
    if (!dangerConfirmModal || !dangerModalTitle || !dangerModalMessage || !confirmDangerActionBtn) {
        confirmLogout();
        return;
    }

    pendingDangerAction = 'logout';
    dangerModalTitle.textContent = title;
    dangerModalMessage.textContent = message;
    confirmDangerActionBtn.textContent = 'Log Out';
    confirmDangerActionBtn.style.backgroundColor = '#d32f2f';

    dangerConfirmModal.classList.add('open');
    dangerConfirmModal.setAttribute('aria-hidden', 'false');
    confirmDangerActionBtn.focus();
}

function clearSessionAndRedirect() {
    stopRealtimeListeners();
    postAuthorProfileCache.clear();
    if (typeof authGatekeeperUnsubscribe === 'function') {
        authGatekeeperUnsubscribe();
        authGatekeeperUnsubscribe = null;
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'Login.html';
}

async function signOutFirebaseAndRedirect() {
    const firebaseReady = await loadFirebaseAuth();

    if (!firebaseReady) {
        clearSessionAndRedirect();
        return;
    }

    try {
        await updateCurrentUserPresence(false);
        await firebaseSignOut(firebaseAuth);
    } catch (error) {
        console.error('Logout error:', error);
    }

    clearSessionAndRedirect();
}

async function confirmLogout() {
    await signOutFirebaseAndRedirect();
}

async function confirmSignOutEverywhere() {
    if (!confirmDangerActionBtn) return;

    confirmDangerActionBtn.disabled = true;
    confirmDangerActionBtn.textContent = 'Signing out...';

    try {
        const response = await fetch(`${API_BASE_URL}/account/sign-out-everywhere`, {
            method: 'POST',
            headers: await getFirebaseAccountActionHeaders()
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || 'Could not sign out everywhere');
        }

        showToast('Signed out everywhere');
        await signOutFirebaseAndRedirect();
    } catch (error) {
        console.error('Sign out everywhere failed:', error);
        showToast(error.message || 'Could not sign out everywhere');
        confirmDangerActionBtn.disabled = false;
        confirmDangerActionBtn.textContent = 'Sign Out Everywhere';
    }
}

async function confirmDeleteAccount() {
    if (!confirmDangerActionBtn) return;

    const confirmation = window.prompt('This permanently deletes your StudyHive account. Type DELETE to continue.');

    if (confirmation !== 'DELETE') {
        showToast('Account deletion canceled');
        closeDangerModal();
        return;
    }

    confirmDangerActionBtn.disabled = true;
    confirmDangerActionBtn.textContent = 'Deleting...';

    try {
        const response = await fetch(`${API_BASE_URL}/account`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...await getFirebaseAccountActionHeaders()
            },
            body: JSON.stringify({ confirmation })
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || 'Could not delete account');
        }

        showToast('Account deleted');
        await signOutFirebaseAndRedirect();
    } catch (error) {
        console.error('Delete account failed:', error);
        showToast(error.message || 'Could not delete account');
        confirmDangerActionBtn.disabled = false;
        confirmDangerActionBtn.textContent = 'Delete Account';
    }
}

// NEW ADDITION: Pull persistent state from Express server registry maps on document startup
async function loadUserProfileFromBackend() {
    try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Could not pull persistent backend profile variables.');
        const data = await response.json();

        if (data.success && data.profile) {
            savedProfileData = getProfileDataFromBackend(data.profile);
            localStorage.setItem('userFullName', savedProfileData.fullName);
            localStorage.setItem('userName', savedProfileData.displayName);
            localStorage.setItem('userAvatar', savedProfileData.avatar);
            if (window.PostInteractions && typeof window.PostInteractions.setUserInfo === 'function') {
                window.PostInteractions.setUserInfo(
                    getCurrentUserId(),
                    savedProfileData.displayName,
                    savedProfileData.avatar,
                    localStorage.getItem('userEmail') || ''
                );
            }

            // Reapply current profile variables straight into the form layouts and rendering pipelines
            applyProfileFormData(savedProfileData);
            cacheCurrentUserAuthorProfile({
                displayName: savedProfileData.displayName,
                fullName: savedProfileData.fullName,
                avatarUrl: savedProfileData.avatar
            });
            updateRenderedPostAuthorProfile(getCurrentUserId());
        }
    } catch (error) {
        console.error('Warning: Active connection to profile controller was dropped fallback onto static memory models:', error);
    }
}

// ==================== NOTIFICATIONS ====================

function formatNotificationType(type) {
    const normalizedType = String(type || 'notification').replace(/_/g, ' ');
    return normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1);
}

function isFriendRequestNotification(notification) {
    const type = String(notification?.type || '').toLowerCase();

    if (type === 'friend_request') return true;

    const isLegacyFriendRequest = type === 'friend'
        && Boolean(notification?.requestId)
        && String(notification?.message || '').toLowerCase().includes('sent you a friend request');

    return isLegacyFriendRequest;
}

function isStudyCircleInviteNotification(notification) {
    return String(notification?.type || '').toLowerCase() === 'study_circle_invite'
        && Boolean(notification?.inviteId);
}

function isPendingIncomingFriendRequest(requestId) {
    if (!requestId) return false;
    if (!friendDataLoaded) return true;

    return (friendRequests.incoming || []).some((request) => {
        return String(request.id || request.requestId) === String(requestId);
    });
}

function shouldShowFriendRequestActions(notification) {
    return isFriendRequestNotification(notification)
        && Boolean(notification.requestId)
        && isPendingIncomingFriendRequest(notification.requestId);
}

function shouldShowStudyCircleInviteActions(notification) {
    if (!isStudyCircleInviteNotification(notification)) return false;

    const inviteStatus = String(
        notification.studyCircleInviteStatus
        || notification.inviteStatus
        || notification.status
        || 'pending'
    ).toLowerCase();

    return inviteStatus === 'pending';
}

function setNotificationActionButtonsDisabled(itemElement, disabled) {
    itemElement.querySelectorAll('.notification-action-btn').forEach((button) => {
        button.disabled = disabled;
    });
    itemElement.classList.toggle('action-completed', disabled);
}

function finishFriendRequestNotificationAction(itemElement) {
    itemElement.classList.add('action-completed');
    itemElement.classList.remove('unread');
    itemElement.querySelector('.notification-message')?.classList.remove('unread');
}

function createNotificationActionButton(className, textContent, onClick) {
    const button = document.createElement('button');
    button.className = `notification-action-btn ${className}`;
    button.type = 'button';
    button.textContent = textContent;
    button.addEventListener('click', (event) => {
        event.stopPropagation();
        onClick();
    });
    return button;
}

function parseNotificationTimestamp(timestamp) {
    return TimestampUtils.parseTimestamp(timestamp) || new Date();
}

function formatRelativeTime(timestamp) {
    return TimestampUtils.formatRelativeTimestamp(timestamp);
}

function renderNotificationItem(notification) {
    const item = document.createElement('div');
    item.className = `notification-item ${notification.read ? '' : 'unread'}`;
    item.dataset.notificationId = notification.id;

    const avatar = document.createElement('img');
    avatar.className = 'notification-avatar';
    avatar.src = normalizeProfileAvatarSource(notification.avatar || DEFAULT_PROFILE_AVATAR);
    avatar.alt = notification.fromUser || 'User';

    const content = document.createElement('div');
    content.className = 'notification-content';

    const message = document.createElement('div');
    message.className = `notification-message ${notification.read ? '' : 'unread'}`;
    message.textContent = notification.message;

    const meta = document.createElement('div');
    meta.className = 'notification-meta';

    const timestamp = document.createElement('span');
    timestamp.className = 'notification-timestamp';
    timestamp.textContent = formatRelativeTime(notification.createdAt);

    const badge = document.createElement('span');
    badge.className = `notification-type-badge ${notification.type || 'default'}`;
    badge.textContent = formatNotificationType(notification.type);

    meta.append(timestamp, badge);
    content.append(message, meta);

    if (shouldShowFriendRequestActions(notification)) {
        const actions = document.createElement('div');
        actions.className = 'notification-actions';

        const acceptBtn = createNotificationActionButton('accept', 'Accept', () => {
            acceptFriendRequestFromNotification(notification.id, notification.requestId, item);
        });

        const declineBtn = createNotificationActionButton('decline', 'Decline', () => {
            declineFriendRequestFromNotification(notification.id, notification.requestId, item);
        });

        actions.append(acceptBtn, declineBtn);
        content.append(actions);
    } else if (shouldShowStudyCircleInviteActions(notification)) {
        const actions = document.createElement('div');
        actions.className = 'notification-actions';

        const acceptBtn = createNotificationActionButton('accept', 'Accept Study Circle', () => {
            acceptStudyCircleInviteFromNotification(notification.id, notification.inviteId, item);
        });

        const declineBtn = createNotificationActionButton('decline', 'Decline', () => {
            declineStudyCircleInviteFromNotification(notification.id, notification.inviteId, item);
        });

        actions.append(acceptBtn, declineBtn);
        content.append(actions);
    } else {
        item.addEventListener('click', async () => {
            if (!notification.read) {
                await markNotificationAsRead(notification.id);
                item.classList.remove('unread');
                message.classList.remove('unread');
                updateNotificationBadge();
            }
        });
    }

    item.append(avatar, content);
    return item;
}

function displayNotifications(notifications) {
    notificationsList.innerHTML = '';
    const visibleNotifications = (notifications || []).filter(shouldDisplayNotification);

    if (visibleNotifications.length === 0) {
        notificationsEmpty.style.display = 'block';
        return;
    }

    notificationsEmpty.style.display = 'none';
    visibleNotifications.forEach(notification => {
        notificationsList.appendChild(renderNotificationItem(notification));
    });
}

async function loadNotifications() {
    try {
        if (!getCurrentUserId()) return;
        if (isRealtimeListenerActive('notifications') && realtimeNotificationsLoaded) return;

        if (!friendDataLoaded) {
            await loadFriends();
        }

        const response = await fetch(`${API_BASE_URL}/notifications`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Could not load notifications');

        const data = await response.json();
        const notifications = data.notifications || [];
        displayNotifications(notifications);
        setNotificationBadgeCount(notifications.filter((notification) => !notification.read).length);
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

async function updateNotificationBadge() {
    try {
        if (!getCurrentUserId()) return;
        if (isRealtimeListenerActive('notifications') && realtimeNotificationsLoaded) return;

        const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Could not get unread count');

        const data = await response.json();
        const count = data.unreadCount || 0;

        setNotificationBadgeCount(count);
    } catch (error) {
        console.error('Error updating badge:', error);
    }
}

async function markNotificationAsRead(notificationId) {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Could not mark as read');
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

async function markAllNotificationsAsRead() {
    try {
        if (!getCurrentUserId()) return;

        const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Could not mark all as read');

        await loadNotifications();
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
}

async function clearNotifications() {
    try {
        if (!getCurrentUserId()) return;

        if (clearNotificationsBtn) {
            clearNotificationsBtn.disabled = true;
        }

        const response = await fetch(`${API_BASE_URL}/notifications`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Could not clear notifications');

        displayNotifications([]);
        setNotificationBadgeCount(0);
        showToast('Notifications cleared');
        await loadNotifications();
    } catch (error) {
        console.error('Error clearing notifications:', error);
        showToast('Could not clear notifications');
    } finally {
        if (clearNotificationsBtn) {
            clearNotificationsBtn.disabled = false;
        }
    }
}

function setNotificationsDropdownOpen(isOpen) {
    notificationsDropdown.classList.toggle('open', isOpen);
    notificationBell.setAttribute('aria-expanded', String(isOpen));
    notificationsDropdown.setAttribute('aria-hidden', String(!isOpen));

    if (isOpen) {
        loadNotifications();
    }
}

function initNotificationPanel() {
    if (!notificationBell || !notificationsDropdown || !notificationsContainer) return;
    if (notificationsContainer.dataset.ready === 'true') return;

    notificationsContainer.dataset.ready = 'true';
    setNotificationsDropdownOpen(false);

    // Toggle dropdown on bell click
    notificationBell.addEventListener('click', (e) => {
        e.stopPropagation();
        setNotificationsDropdownOpen(!notificationsDropdown.classList.contains('open'));
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!notificationsContainer.contains(e.target)) {
            setNotificationsDropdownOpen(false);
        }
    });

    // Mark all as read button
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
    }

    if (clearNotificationsBtn) {
        clearNotificationsBtn.addEventListener('click', clearNotifications);
    }

    if (!isRealtimeListenerActive('notifications')) {
        updateNotificationBadge();
    }
}


async function initDashboard() {
    initPostComposer();
    const isAuthenticated = await initAuthGatekeeper();

    if (!isAuthenticated) return;

    await loadUserProfileFromBackend();

    studyCircles = mergeStudyCircles(getStudyCircles());
    pendingInvitations = getPendingInvitations();
    syncStudyCircleViews(studyCircles);

    loadPosts();

    if (StudyHive.initUserMenu) {
        StudyHive.initUserMenu();
    }

    if (StudyHive.initSidebarNavigation) {
        StudyHive.initSidebarNavigation();
    }

    populateSavedSection();
    initInboxSection();
    initCreateCircleModal();
    initAddMemberButton();
    initLeaveCircleButton();
    initDeleteCircleButton();

    // Fetch study circles from backend and populate dropdown
    fetchStudyCirclesFromBackend();

    initProfileEditor();
    initSettingsAccordions();
    initSettingsToggles();
    initSettingsSelectors();
    await applyAuthProviderSettings();
    await loadUserSettingsFromBackend();
    initDangerModal();
    initSaveSettings();
    initHelpSupport();
    initReportProblem();
    initLogout();
    initGlobalSearch();
    initSearchProfileModal();
    startRealtimeListeners();
    initNotificationPanel();
}

initDashboard();
