const express = require('express')
const router = express.Router()
const PostModel = require('../models/posts')
const CommentModel = require('../models/comments')

const checkLogin = require('../middlewares/check').checkLogin

router.get('/', function (req, res, next) {
    const author = req.query.author
    console.log('getposts:' + JSON.stringify(author))
    PostModel.getPosts(author)
        .then(posts => {
            
            res.render('posts', {
                posts: posts
            })
        })
        .catch(next)
})

// POST /posts/create 发表一篇文章
router.post('/create', checkLogin, function (req, res, next) {
    const author = req.session.user._id;
    const title = req.fields.title;
    const content = req.fields.content;

    console.log('title:' + title)
    console.log('content:' + content)
    console.log('author:' + author)

    try {
        if (!title.length) {
            throw new Error('请填写标题')
        }
        if (!content.length) {
            throw new Error('请填写内容')
        }
    } catch (error) {
        req.flash('error', error.message)
        return res.redirect('back')
    }

    let post = {
        author : author,
        title : title,
        content: content
    }

    PostModel.create(post)
        .then(result => {
            post = result.ops[0]
            console.log('create post'+ post.title)
            req.flash('success', '发表成功')
            res.redirect(`/posts/${post._id}`)
        })
        .catch(next)
})

// GET /posts/create 发表文章页
router.get('/create', checkLogin, function (req, res, next) {
    res.render('create')
})

// GET /posts/:postId 单独一篇的文章页
router.get('/:postId', function (req, res, next) {
    const postId = req.params.postId
    Promise.all([
        PostModel.getPostById(postId),
        CommentModel.getComments(postId),
        PostModel.incPv(postId)
    ])
    .then(function (result) {
        const post = result[0]
        const comments = result[1]
        if (!post) {
            throw new Error('该文章不存在')
        }

        res.render('post', {
            post: post,
            comments: comments
        })
    })
    .catch(next)
})

// GET /posts/:postId/edit 更新文章页
router.get('/:postId/edit', checkLogin, function (req, res, next) {
    res.send('更新文章页')
})

// POST /posts/:postId/edit 更新一篇文章
router.post('/:postId/edit', checkLogin, function (req, res, next) {
    res.send('更新文章')
})

router.get('/:postId/remove', checkLogin, function (req, res, next) {
    res.send('删除文章')
})

module.exports = router