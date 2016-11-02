/**
 *
 * Created by xuzhongwei on 2016/11/01.
 */

var mongo = require("../model/mongo.js");
var tool = require("./tool.js");
var steps = require('ocsteps');


module.exports = {
    indexController: function (req, res) {
        if (tool.isEmpty(req.session.debateLogin)) {
            res.redirect("login")
            return;
        }
    },

    loginController:function(req,res){
        res.render("release/login.html")
    },

    loginPostController:function(req,res){

        var _username = req.body.username;
        var _password = req.body.password;

        var _isLogin = 0;

        steps(
            function(){
                mongo.find("debateMembers",{username:_username,password:_password},{},this.hold(function(result){
                    if(result.length<=0){res.end(JSON.stringify({error:1,msg:"username or password not correct"}));this.terminate();}
                    req.session.debateLogin = {username:result[0].username,password:result[0].password,type:result[0].type,group:result[0].group}

                }))
            },
            function(){
                mongo.find("userStatus",{username:req.session.debateLogin.username,group:req.session.debateLogin.group},{},this.hold(function(result){
                    // user status
                    //   -1 logout
                    //    0 login
                    //    1 entering
                    //    2 debating

                    if(result.length>0){
                        mongo.update("userStatus",{username:req.session.debateLogin.username,group:req.session.debateLogin.group},{$set:{status:0}},{},this.hold(function(){

                        }))
                    }else{
                        mongo.insert("userStatus",{username:req.session.debateLogin.username,group:req.session.debateLogin.group,status:0},{},this.hold(function(){

                        }))
                    }
                }))
            },function(){
                res.end(JSON.stringify({error:0,msg:"successful"}))
            })()
    },

    groupController:function(req,res){

        if(tool.isEmpty(req.session.debateLogin)){
            res.redirect("login")
            return;
        }

        var themes = []
        var debatingList = []
        var finishList = []
        if(tool.isEmpty(req.session.debateLogin)){
            res.redirect("login")
            return;
        }

        res.render("release/group.html")
    },
    getThemeListController:function(req,res){
        steps(function(){
            mongo.find("themes",{group:req.session.debateLogin.group},{},this.hold(function(_res){
                res.end(JSON.stringify(_res))
            }))
        })()
    },
    getDebatingListController:function(req,res){
        steps(function(){
            mongo.find("debateStatus",{group:req.session.debateLogin.group,setting:1,finish:false},{},this.hold(function(_res){
                res.end(JSON.stringify(_res))
            }))
        })()
    },
    getDebateFinishListController:function(req,res){
        steps(function(){
            mongo.find("debateStatus",{group:req.session.debateLogin.group,setting:1,finish:true},{},this.hold(function(_res){
                res.end(JSON.stringify(_res))
            }))
        })()
    },
}