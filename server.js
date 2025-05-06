const express = require('express')
const path = require('path')
const { read, write } = require('./utils/db')
const { hashPassword, verifyPassword } = require('./utils/crypto')

const app = express()
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

function auth(req, res, next) {
  const { username, password } = req.body
  const users = read('users.json')
  const user = users.find(u => u.username === username)
  if (!user || !verifyPassword(password, user)) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }
  req.user = user
  next()
}

app.post('/register', (req, res) => {
  const { username, password, role } = req.body
  if (!['viewer', 'blogger'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' })
  }
  const users = read('users.json')
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'User exists' })
  }
  const { salt, hash } = hashPassword(password)
  users.push({ username, salt, hash, role })
  write('users.json', users)
  res.json({ message: 'User registered' })
})

app.post('/login', auth, (req, res) => {
  res.json({ message: `Logged in as ${req.user.role}` })
})

app.get('/posts', (req, res) => {
  res.json(read('posts.json'))
})

app.post('/posts', auth, (req, res) => {
  if (req.user.role !== 'blogger') {
    return res.status(403).json({ message: 'Only bloggers can create posts' })
  }
  const posts = read('posts.json')
  const newPost = {
    id: Date.now(),
    title: req.body.title,
    content: req.body.content,
    author: req.user.username
  }
  posts.push(newPost)
  write('posts.json', posts)
  res.json(newPost)
})

app.put('/posts/:id', auth, (req, res) => {
  const posts = read('posts.json')
  const post = posts.find(p => p.id == req.params.id)
  if (!post) return res.status(404).json({ message: 'Post not found' })
  if (post.author !== req.user.username) {
    return res.status(403).json({ message: 'Cannot edit' })
  }
  post.title = req.body.title
  post.content = req.body.content
  write('posts.json', posts)
  res.json(post)
})

// Ability to Delete Posts
app.delete('/posts/:id', auth, (req, res) => {
  const posts = read('posts.json')
  const idx = posts.findIndex(p => p.id == req.params.id)
  if (idx === -1) {
    return res.status(404).json({ message: 'Post not found' })
  }
  const post = posts[idx]
  // if (post.author !== req.user.username) {
  //   return res.status(403).json({ message: 'Cannot delete this post' })
  // }

  // Admins may delete any post, bloggers only their own
  if (req.user.role !== 'admin' && post.author !== req.user.username) {
    return res.status(403).json({ message: 'Cannot delete this post' })
  }
  posts.splice(idx, 1)
  write('posts.json', posts)
  res.json({ message: 'Post deleted' })
})

// DELETE /comments/:commentId
app.delete('/comments/:commentId', auth, (req, res) => {
  const comments = read('comments.json')
  const idx = comments.findIndex(c => c.id == req.params.commentId)
  if (idx === -1) return res.status(404).json({ message: 'Comment not found' })
  const comment = comments[idx]
  // admin can delete any comment; commenter can delete their own
  if (req.user.role !== 'admin' && comment.author !== req.user.username) {
    return res.status(403).json({ message: 'Cannot delete this comment' })
  }
  comments.splice(idx, 1)
  write('comments.json', comments)
  res.json({ message: 'Comment deleted' })
})

// End of Delete Block

// Routes for commenting
app.post('/comments/:postId', auth, (req, res) => {
  const comments = read('comments.json')
  const c = {
    id: Date.now(),
    postId: parseInt(req.params.postId),
    content: req.body.content,
    author: req.user.username
  }
  comments.push(c)
  write('comments.json', comments)
  res.json(c)
})

app.get('/comments/:postId', (req, res) => {
  res.json(read('comments.json').filter(c => c.postId == req.params.postId))
})

const PORT = 3000
app.listen(PORT, () => console.log(`Blog server running at http://localhost:${PORT}`))