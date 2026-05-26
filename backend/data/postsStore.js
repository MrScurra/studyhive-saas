// Temporary in-memory posts.
// This resets whenever the server restarts. Replace with a database later.
const posts = [
  {
    id: 'post-1',
    userId: 'seed-user-matt',
    content: "Hello everyone! I've curated my detailed review guide for the cellular division exam tomorrow morning. Hope this maps things out clearly for you. Good luck!",
    category: 'Biology 101',
    fileName: 'Bio_Cell_Division_Notes.pdf',
    fileSize: '2.4 MB',
    fileUrl: '',
    fileStoredName: '',
    fileOriginalName: 'Bio_Cell_Division_Notes.pdf',
    fileMimeType: 'application/pdf',
    attachment: null,
    userName: 'Matt Donovan',
    avatar: './frontend/assets/profile-picture/Matt Donovan.jpg',
    timestamp: '3h ago',
    createdAt: '2026-05-22T08:00:00.000Z',
    upvotes: 100,
    comments: 83,
    bookmarks: 0
  },
  {
    id: 'post-2',
    userId: 'seed-user-breezy',
    content: 'Just started a new study circle for Advanced Statistics. Looking for motivated members to join! We meet twice a week.',
    category: 'Advanced Statistics',
    fileName: '',
    fileSize: '',
    fileUrl: '',
    fileStoredName: '',
    fileOriginalName: '',
    fileMimeType: '',
    attachment: null,
    userName: 'Breezy Dela Cruz',
    avatar: './frontend/assets/profile-picture/Pokimane.jpg',
    timestamp: '7h ago',
    createdAt: '2026-05-22T04:00:00.000Z',
    upvotes: 45,
    comments: 12,
    bookmarks: 0
  }
]

module.exports = posts
