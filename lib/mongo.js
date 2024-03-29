const config = require('config-lite')(__dirname)
const Mongolass = require('mongolass')
const mongolass = new Mongolass()
mongolass.connect(config.mongodb)

const moment = require('moment')
const objectIdToTimestamp = require('objectid-to-timestamp')

mongolass.plugin('addCreatedAt', {
    afterFind: function (results) {
        results.forEach(item => {
            item.created_at = moment(objectIdToTimestamp(item._id)).format('YYYY-MM-DD HH:mm')
        });
        return results;
    },

    afterFindOne: function (result) {
        if (result) {
            result.created_at = moment(objectIdToTimestamp(result._id)).format('YYYY-MM-DD HH:mm')
        }
        return result;
    }
})

exports.User = mongolass.model('User', {
    name: {type:'string', require: true},
    password: {type:'string', require:true},
    avatar: {type:'string', require: true},
    gender: {type:'string', enum:['m','f','x'], default:'x'},
    bio: {type:'string', require: true}
})
exports.User.index({name:1},{unique:true}).exec()

exports.Post = mongolass.model('Post', {
    author: {type: Mongolass.Types.ObjectId, required: true},
    title: {type: 'string', required: true},
    content: {type: 'string', required: true},
    pv: {type: 'number', default: 0}
})
exports.Post.index({author:1, _id: -1}).exec()// 按创建时间降序查看用户的文章列表

exports.Comment = mongolass.model('Comment', {
    author: {type:Mongolass.Types.ObjectId, required: true},
    content: {type: 'string', required: true},
    postId: {type: Mongolass.Types.ObjectId, required: true}
})
exports.Comment.index({postId:1, _id: 1}).exec()// 通过文章 id 获取该文章下所有留言，按留言创建时间升序

