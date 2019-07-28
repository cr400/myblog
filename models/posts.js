const Post = require('../lib/mongo').Post
const marked = require('marked')
const CommentModel = require('./comments')

// 将 post 的 content 从 markdown 转换成 html
Post.plugin('contentToHtml', {
    afterFind: function (posts) {
        return posts.map(function (post) {
            post.content = marked(post.content)
            return post
        })
    },

    afterFindOne: function (post) {
        if (post) {
            post.content = marked(post.content)
        }
        return post
    }
})

Post.plugin('addCommentsCount', {
    afterFind: function (posts) {
        return Promise.all(posts.map(function (post) {
            return CommentModel.getCommentsCount(post._id).then(function (commentsCount) {
                post.commentsCount = commentsCount
                return post
            })
        }))
    },

    afterFindOne: function (post) {
        if (post) {
            return CommentModel.getCommentsCount(post._id).then(function (commentsCount) {
                post.commentsCount = commentsCount
                return post
            })
        }
        return post
    }
})

module.exports = {
    create: function create(post) {
        return Post.create(post).exec()
    },

    // 通过文章 id 获取一篇文章
    getPostById: function getPostById(postId) {
        return Post.findOne({_id: postId})
                    .populate({path:'author', model: 'User'})
                    .addCreatedAt()
                    .addCommentsCount()
                    .contentToHtml()
                    .exec()
    },

    //按创建时间降序获取所有用户文章或者某个特定用户的所有文章
    getPosts: function getPosts(author) {
        const query = {}
        if (author) {
            query.author = author
        }
        return Post.find(query)
                    .populate({path:'author', model:'User'})
                    .sort({_id:-1})
                    .addCreatedAt()
                    .addCommentsCount()
                    .contentToHtml()
                    .exec()
    },

    delPostById: function delPostById(postId, author) {
        return Post.deleteOne({author: author, _id: postId})
                    .exec()
                    .then(function (res) {
                        if (res.result.ok && res.result.n > 0) {
                            return CommentModel.delCommentByPostId(postId)
                        }
                    })
    },

    // 通过文章 id 给 pv 加 1
    incPv: function incPv(postId) {
        return Post.update({_id:postId},{$inc:{pv:1}}).exec()
    }
}