// Temporary in-memory messages.
// This survives browser refreshes, but resets when the backend restarts.
const messages = [
  {
    id: 'msg-1',
    conversationId: '1',
    senderId: 'seed-user-ryan',
    author: 'Ryan',
    avatar: '',
    time: '9:30 AM',
    text: 'Good morning Everyone, has anyone compiled the overview for the lesson 2',
    timestamp: '2026-05-22T01:30:00.000Z'
  },
  {
    id: 'msg-2',
    conversationId: '1',
    senderId: 'seed-user-charisse',
    author: 'Charisse Garcia',
    avatar: '',
    time: '9:35 AM',
    text: 'Good morning! Yes, I did. I just published it to the group a couple hours ago.',
    timestamp: '2026-05-22T01:35:00.000Z'
  },
  {
    id: 'msg-3',
    conversationId: '1',
    senderId: 'seed-user-ryan',
    author: 'Ryan',
    avatar: '',
    time: '10:00 AM',
    text: "Let's review lesson 2 then after let's practice it by answering some questions I'll make.",
    timestamp: '2026-05-22T02:00:00.000Z'
  },
  {
    id: 'msg-4',
    conversationId: '2',
    senderId: 'seed-user-emma',
    author: 'Emma',
    avatar: '',
    time: '8:00 AM',
    text: 'Can you explain derivatives?',
    timestamp: '2026-05-22T00:00:00.000Z'
  },
  {
    id: 'msg-5',
    conversationId: '2',
    senderId: 'seed-user-john',
    author: 'John',
    avatar: '',
    time: '8:15 AM',
    text: 'Sure! Derivatives measure the rate of change...',
    timestamp: '2026-05-22T00:15:00.000Z'
  },
  {
    id: 'msg-6',
    conversationId: '3',
    senderId: 'seed-user-prof-smith',
    author: 'Prof. Smith',
    avatar: '',
    time: '2:00 PM',
    text: 'Next session is Thursday at 3 PM',
    timestamp: '2026-05-22T06:00:00.000Z'
  }
]

module.exports = messages
