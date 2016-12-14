/**
 * Created by xuzhongwei on 2016/11/16.
 */
var mongo = require("../model/mongo.js");
var mongodb = require("mongodb")
var tool = require("./tool.js");
var steps = require('ocsteps');



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
        var username = req.body.name
        var password = req.body.password
        var group = req.body.group

        if(!username || !password || !group) return;
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
                mongo.insert("debateMembers",{username:username,password:password,group:group,debateInvolve:false,winNum:0,drawNum:0,lostNum:0,unDeterminNum:0},function(_res){
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
    }
}
