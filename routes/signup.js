const express = require('express')
const router = express.Router()
const checkNotLogin = require('../middlewares/check').checkNotLogin
const fs = require('fs')
const path = require('path')
const sha1 = require('sha1')
const UserModel = require('../models/users')


router.get('/', checkNotLogin, function (req, res, next) {
    // res.send('注册页')
    res.render('signup')
})

router.post('/', checkNotLogin, function (req,res, next) {
    console.log('注册 req---' + req)
    const name = req.fields.name;
    const gender = req.fields.gender;
    const bio = req.fields.bio;
    const avatar = req.files.avatar.path.split(path.sep).pop();
    let password = req.fields.password;
    const repassword = req.fields.repassword;

    try {
        if (!(name.length >= 1 && name.length <= 10)) {
            throw new Error('名字请限制在 1-10 个字符')
        }
        if (['m','f','x'].indexOf(gender) === -1){
            throw new Error('性别只能是 m、f 或 x')
        }
        if (!(bio.length >= 1 && bio.length <= 30)) {
            throw new Error('个人简介请限制在 1-30 个字符')
        }
        if (!req.files.avatar.name) {
            throw new Error('缺少头像')
        }
        if (password.length < 6) {
            throw new Error('密码至少 6 个字符')
        }
        if (repassword !== password) {
            throw new Error('两次输入密码不一致')
        }
    } catch (error) {
        // 注册失败，异步删除上传的头像
        // fs.unlink(req.files.avatar.path)
        console.log('avatar--'+ req.files.avatar.path)
        fs.unlinkSync(req.files.avatar.path)
        req.flash('error', error.message)
        return res.redirect('/signup')
    }

    // 明文密码加密
    password = sha1(password)

    let user = {
        name: name,
        password: password,
        gender:gender,
        avatar:avatar,
        bio:bio
    }

    UserModel.create(user).then(result => {
        console.log('create user result' + result)
        user = result.ops[0]
        delete user.password
        req.session.user = user
        req.flash('success','注册成功')
        res.redirect('/posts')
    }).catch(error => {
        // 注册失败，异步删除上传的头像
        fs.unlinkSync(req.files.avatar.path)
        // 用户名被占用则跳回注册页，而不是错误页
        if (error.message.match('duplicate key')) {
            req.flash('error', '用户名已被占用')
            return res.redirect('/signup')
        }
        next(e)
    })
})

module.exports = router