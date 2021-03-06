/**
 * Created by xuzhongwei on 2016/11/16.
 */
var mongo = require("../model/mongo.js");
var mongodb = require("mongodb")
var tool = require("./tool.js");
var steps = require('ocsteps');

var nodemailer = require('nodemailer');

module.exports = {

    adminController: function (req, res) {
        if (tool.isEmpty(req.session.adminLogin)) {
            res.redirect("login")
            return;
        }
        res.render("admin/admin.html")
    },

    adminLoginController: function (req, res) {
        res.render("admin/adminLogin.html")
    },

    loginAdminPostController: function (req, res) {
        var _username = req.body.username;
        var _password = req.body.password;

        if (_username == 'admin' && _password == "pass") {
            req.session.adminLogin = {username: _username, time: Date.parse(new Date())}
            res.end(JSON.stringify({error: 0, msg: "successful", username: _username}))
        }
    },

    increaseGroupController:function(req,res){
            var name = req.body.name
            var desc = req.body.desc

            if(!name || !desc) return;
            steps(function(){
                mongo.createIfNotExists("group",this.hold(function(res){
                    console.log(res)
                }))
            },function(){
                mongo.find("group",{name:name},{},this.hold(function(res){
                    return res.length
                }))
            },function(length){
                if(length > 0){
                    res.end(JSON.stringify({error: 1, msg: "duplicated theme"}))
                    this.terminate()
                }else{
                    mongo.insert("group",{name:name,desc:desc,time:Date.parse(new Date())},function(_res){
                            res.end(JSON.stringify({error: 0, msg: "ok"}))
                    })
                }
            })()
    },

    getGroupListController: function (req, res) {
        steps(function () {
            mongo.find("group", {}, {}, this.hold(function (_res) {
                res.end(JSON.stringify({error: 0, msg: "successful", data: _res}))
            }))
        })()
    },

    deleteGroupController:function(req,res){
        var _id = req.body._id
        if(!_id) return;
        var objectId = new mongodb.ObjectID(_id)
        steps(function(){
            mongo.remove("group",{_id:objectId},{},function(result){
                console.log(result)
                if(result.result.ok == 1){
                    res.end(JSON.stringify({error: 0, msg: "successful"}))
                }else{
                    res.end(JSON.stringify({error: 1, msg: "failure in delete"}))
                }
            })
        })()
    },

    getMembersListController: function (req, res) {
        steps(function () {
            mongo.find("debateMembers", {}, {}, this.hold(function (_res) {
                res.end(JSON.stringify({error: 0, msg: "successful", data: _res}))
            }))
        })()
    },

    increaseMembersController:function(req,res){
        var username = req.body.username
        var name = req.body.name
        var mail = req.body.mail
        var password = req.body.password
        var group = req.body.group

        if(!username || !password || !group || !name) return;
        steps(function(){
            mongo.createIfNotExists("debateMembers",this.hold(function(res){
                console.log(res)
            }))
        },function(){
            mongo.find("debateMembers",{username:username,group:group},{},this.hold(function(res){
                return res.length
            }))
        },function(length){

            if(length > 0){
                res.end(JSON.stringify({error: 1, msg: "duplicated theme"}))
                this.terminate()
            }else{
                mongo.insert("debateMembers",{username:username,password:password,name:name,mail:mail,group:group,debateInvolve:false,winNum:0,drawNum:0,lostNum:0,unDeterminNum:0},function(_res){
                        res.end(JSON.stringify({error: 0, msg: "ok"}))
                })
            }

        })()
    },

    deleteMembersController:function(req,res){
        var _id = req.body._id
        if(!_id) return;
        var objectId = new mongodb.ObjectID(_id)
        steps(function(){
            mongo.remove("debateMembers",{_id:objectId},{},function(result){
                console.log(result)
                if(result.result.ok == 1){
                    res.end(JSON.stringify({error: 0, msg: "successful"}))
                }else{
                    res.end(JSON.stringify({error: 1, msg: "failure in delete"}))
                }
            })
        })()
    },


    getThemesListController: function (req, res) {
        steps(function () {
            mongo.find("themes", {}, {}, this.hold(function (_res) {
                res.end(JSON.stringify({error: 0, msg: "successful", data: _res}))
            }))
        })()
    },

    getGroupMemberListController:function(req,res){
        steps(function(){
            console.log(req.body)
            if(!req.body.group) return;

            mongo.find("debateMembers",{group:req.body.group},{},function(result){
                console.log(result)
                if(result.length == 0){
                    res.end(JSON.stringify({error: 1, msg: "related data not found"}))
                }else{
                    res.end(JSON.stringify({error: 0, data:result}))
                }
            })
        })()
    },

    getMembersController:function(req,res){
        var _id = req.body._id
        if(!_id) return;
        var objectId = new mongodb.ObjectID(_id)
        mongo.find("debateMembers",{_id:objectId},{},function(result){
            console.log(result)
            if(result.length == 0){
                res.end(JSON.stringify({error: 1, msg: "related data not found"}))
            }else{
                res.end(JSON.stringify({error: 0, data:result[0]}))
            }
        })
    },

    getThemesController:function(req,res){
        var _id = req.body._id
        if(!_id) return;
        var objectId = new mongodb.ObjectID(_id)
        mongo.find("themes",{_id:objectId},{},function(result){
            console.log(result)
            if(result.length == 0){
                res.end(JSON.stringify({error: 1, msg: "related data not found"}))
            }else{
                res.end(JSON.stringify({error: 0, data:result[0]}))
            }
        })
    },

    updateThemesController:function(req,res){
        var theme = req.body.theme
        var desc = req.body.desc
        var group = req.body.group
        var _id = req.body._id
        var objectId = new mongodb.ObjectID(_id)
        if(!theme || !desc || !group || !_id) return


        mongo.update("themes",{_id:objectId},{$set:{theme:theme,desc:desc,group:group}},function(result){
            res.end(JSON.stringify({error: 0}))
        })

    },


    updateMembersController:function(req,res){
        var username = req.body.username
        var name = req.body.name
        var mail = req.body.mail
        var password = req.body.password
        var group = req.body.group
        var _id = req.body._id
        var objectId = new mongodb.ObjectID(_id)
        if(!username || !name || !group || !password) return


        mongo.update("debateMembers",{_id:objectId},{$set:{username:username,name:name,mail:mail,password:password}},function(result){
            res.end(JSON.stringify({error: 0}))
        })

    },

    increaseThemesController:function(req,res){
        var theme = req.body.theme
        var desc = req.body.desc
        var group = req.body.group

        if(!theme || !desc || !group) return

        var num = Math.round(Math.random()*10000)
        steps(function(){
            mongo.createIfNotExists("themes",this.hold(function(res){
                console.log(res)
            }))
        },function(){
            mongo.find("themes",{theme:theme,group:group},{},this.hold(function(res){
                return res.length
            }))
        },function(length){

            if(length > 0){
                res.end(JSON.stringify({error: 1, msg: "duplicated theme"}))
                this.terminate()
            }else{
                mongo.insert("themes",{theme:theme,desc:desc,group:group,debateInvolve:false,num:num},function(_res){
                    res.end(JSON.stringify({error: 0, msg: "ok"}))
                })
            }

        })()


    },
    deleteThemesController:function(req,res){
        var _id = req.body._id
        if(!_id) return;
        var objectId = new mongodb.ObjectID(_id)
        steps(function(){
            mongo.remove("themes",{_id:objectId},{},function(result){
                console.log(result)
                if(result.result.ok == 1){
                    res.end(JSON.stringify({error: 0, msg: "successful"}))
                }else{
                    res.end(JSON.stringify({error: 1, msg: "failure in delete"}))
                }
            })
        })()
    },
    sendController:function(req,res){

        console.log(req.body)

        var toContacts = []
        for(var i=0;i<req.body.contacts.length;i++){
            for(var j=0;j<req.body.contacts[i].val.length;j++){
                toContacts.push(req.body.contacts[i].val[j].mail)
            }
        }

        toContacts = toContacts.join(",")

        console.log(toContacts)

        var smtpConfig = {
            host: 'mail.is.kochi-u.ac.jp',
            port: 465,
            secure: true, // use SSL
            auth: {
                user: 'joshoi',
                pass: 'villavilla'
            }
        };

        var transporter = nodemailer.createTransport(smtpConfig);

        var mailOptions = {
            from: '"三好研究室" <joshoi@is.kochi-u.ac.jp>', // sender address
            to: toContacts, // list of receivers
            subject: req.body.subject, // Subject line
            //text: 'Hello world 🐴', // plaintext body
            html: req.body.content // html body
        };

        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                return console.log(error);
            }
            console.log('Message sent: ' + info.response);
        });
    },
    draftInsertController:function(req,res){
        var subject = req.body.subject
        var content = req.body.content
        var contacts = req.body.contacts
        console.log(subject+":"+content + ":" + contacts)
        if(!content) return;

        steps(function(){
            mongo.insert("mailDraft",{subject:subject,contacts:contacts,content:content,date:Date.parse(new Date())},this.hold(function(_res){
                res.end(JSON.stringify({error: 0, data:_res}))
            }))
        })()


    },
    getDraftController:function(req,res){
        steps(function(){
            mongo.find("mailDraft",{},{},this.hold(function(result){
                console.log(result)
                if(result.length == 0){
                    res.end(JSON.stringify({error: 1, msg: "related data not found"}))
                }else{
                    res.end(JSON.stringify({error: 0, data:result}))
                }
            }))
        })()
    },

    draftRemoveController:function(req,res){
        var _id = req.body._id
        if(!_id) return;
        var objectId = new mongodb.ObjectID(_id)
        steps(function(){
            mongo.remove("mailDraft",{_id:objectId},{},function(result){
                if(result.result.ok == 1){
                    res.end(JSON.stringify({error: 0, msg: "successful"}))
                }else{
                    res.end(JSON.stringify({error: 1, msg: "failure in delete"}))
                }
            })
        })()
    },
    getOneDraftController:function(req,res){
        var _id = req.body._id
        if(!_id) return;
        var objectId = new mongodb.ObjectID(_id)
        mongo.find("mailDraft",{_id:objectId},{},function(result){
            console.log(result)
            if(result.length == 0){
                res.end(JSON.stringify({error: 1, msg: "related data not found"}))
            }else{
                res.end(JSON.stringify({error: 0, data:result[0]}))
            }
        })
    },
    updateMailDraftController:function(req,res){
        var subject = req.body.subject
        var contacts = req.body.contacts
        var content = req.body.content
        var _id = req.body._id
        var objectId = new mongodb.ObjectID(_id)
        if(!subject || !contacts || !content) return


        mongo.update("mailDraft",{_id:objectId},{$set:{subject:subject,contacts:contacts,content:content}},function(result){
            res.end(JSON.stringify({error: 0}))
        })
    },

    getStatementstaticsController:function(req,res){
        var expeOrder = req.body.expeOrder
        var group
        var debateList
        if(expeOrder == 1){
            group = "第1回目評価実験"
        }

        if(expeOrder == 2){
            group = "第2回目評価実験"
        }

        steps(function(){
            mongo.find("debateStatus",{group:group},{},this.hold(function(_res){
                if(_res.length == 0) return;
                debateList = _res
                    /*
                    (function(_i){

                        mongo.find("statementLog",{rNum:_rNum},{},_this.hold(function(__res){
                            if(__res.length == 0) return
                            var everyStatement = __res[0].everyStatement
                            _res[_i].statementLog.push(everyStatement)
                            return _res
                        }))

                    })(i)
                     */

            }))
        },function(){
            for(var i=0;i<debateList.length;i++){
                (function(_i,that){
                    debateList[_i].statementLog = []
                    mongo.find("statementLog",{rNum:debateList[_i].rNum},{},that.hold(function(result){
                        for(var k=0;k<result.length;k++){
                            var everyStatement = result[k].everyStatement
                            debateList[_i].statementLog.push(everyStatement)
                        }
                    }))
                })(i,this)
            }
        },function(){
            for(var i=0;i<debateList.length;i++){
                (function(_i,that){
                    mongo.find("debateMembers",{username:debateList[_i].pro,group:group},{},that.hold(function(result){
                        if(result.length == 0) return
                        delete result[0].password
                        debateList[_i].proInfo = result[0]
                    }))
                })(i,this)
            }
        },function(){
            for(var i=0;i<debateList.length;i++){
                (function(_i,that){
                    mongo.find("debateMembers",{username:debateList[_i].con,group:group},{},that.hold(function(result){
                        if(result.length == 0) return
                        delete result[0].password
                        debateList[_i].conInfo = result[0]
                    }))
                })(i,this)
            }
        },function(){

            res.end(JSON.stringify({error: 0, data:debateList}))
        })()
    }
}
