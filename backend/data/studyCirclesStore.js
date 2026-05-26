// In-memory study circles store
// This resets whenever the server restarts. Replace with a database later.
const studyCircles = [
  {
    id: 'circle-1',
    name: 'Biology Study Squad',
    description: 'Preparing for Biology 101 exam',
    createdBy: 'Matt Donovan',
    members: ['Matt Donovan', 'Breezy Dela Cruz'],
    createdAt: '2026-05-20T10:00:00.000Z',
    inviteLink: 'studyhive.com/join/circle-1',
    avatar: '👥'
  },
  {
    id: 'circle-2',
    name: 'Calculus Masters',
    description: 'Advanced calculus problem solving',
    createdBy: 'Larry Lim',
    members: ['Larry Lim'],
    createdAt: '2026-05-21T14:00:00.000Z',
    inviteLink: 'studyhive.com/join/circle-2',
    avatar: '👥'
  }
]

module.exports = studyCircles
