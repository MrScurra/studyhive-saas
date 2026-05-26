function addCurrentUser(req, res, next) {
  const defaultAvatar = './frontend/assets/profile-picture/default-profile-picture.webp'

  req.user = {
    id: req.headers['x-user-id'] || 'default-user',
    name: req.headers['x-user-name'] || 'StudyHive User',
    avatar: req.headers['x-user-avatar'] || defaultAvatar,
    email: req.headers['x-user-email'] || 'user@studyhive.local'
  }

  req.userId = req.user.id
  next()
}

module.exports = addCurrentUser
