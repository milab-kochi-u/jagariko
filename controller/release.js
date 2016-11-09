/**
 *
 * Created by xuzhongwei on 2016/11/01.
 */

var mongo = require("../model/mongo.js");
var tool = require("./tool.js");
var steps = require('ocsteps');



function makeid(n)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < n; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}



module.exports = {
    indexController: function (req, res) {
        if (tool.isEmpty(req.session.debateLogin)) {
            res.redirect("login")
            return;
        }
    },

    loginController:function(req,res){

        console.log("session")
        console.log(req.session)
        res.render("release/login.html")
    },

    loginPostController:function(req,res){

        var _username = req.body.username;
        var _password = req.body.password;

        steps(
            function(){
                mongo.find("debateMembers",{username:_username,password:_password},{},this.hold(function(result){
                    if(result.length<=0){res.end(JSON.stringify({error:1,msg:"username or password not correct"}));this.terminate();}



                    var cookieId = makeid(10)
                    req.session.cookieId = cookieId



                    if(result[0].debateInvolve){
                        req.session.debateLogin = {username:result[0].username,password:result[0].password,type:result[0].type,group:result[0].group,num:result[0].num,rNum:result[0].rNum,debateInvolve:true}

                        mongo.find("debateStatus",{num:result[0].num,rNum:result[0].rNum,group:result[0].group},{},this.hold(function(_result){
                            if(_result.length>0){
                                if(_result[0].pro == result[0].username){
                                    req.session.debateLogin.position = 1
                                }
                                if(_result[0].con == result[0].username){
                                    req.session.debateLogin.position = 2
                                }
                                res.end(JSON.stringify({error:0,msg:"successful",cookieId:cookieId,debating:true}))
                                return;
                            }else{
                                res.end(JSON.stringify({error:1,msg:"involved debate not finished yet but no debate log has been found"}))
                                return;
                            }
                        }))


                    }else{
                        req.session.debateLogin = {username:result[0].username,password:result[0].password,type:result[0].type,group:result[0].group,debateInvolve:false}
                        res.end(JSON.stringify({error:0,msg:"successful",cookieId:cookieId}))
                        return;
                    }


                }))
            }
           )()
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
            mongo.find("debateStatus",{group:req.session.debateLogin.group,finish:false},{},this.hold(function(_res){
                res.end(JSON.stringify(_res))
            }))
        })()
    },
    getDebateFinishListController:function(req,res){
        steps(function(){
            mongo.find("debateStatus",{group:req.session.debateLogin.group,finish:true},{},this.hold(function(_res){
                res.end(JSON.stringify(_res))
            }))
        })()
    },
    createNewRoomController:function(req,res){
        var position = req.body.position
        var num = req.body.num
        var title = req.body.title

        var rNum = Math.round(Math.random()*10000)
        if(position == 1){
            var newRoom = {title:title,pro:req.session.debateLogin.username,num:num,rNum:rNum,finish:false,status:"wait",preStatus:null,group:req.session.debateLogin.group,order:0}
        }else{
            var newRoom = {title:title,con:req.session.debateLogin.username,num:num,rNum:rNum,finish:false,status:"wait",preStatus:null,group:req.session.debateLogin.group,order:0}
        }

        req.session.debateLogin.position = position
        steps(function(){
            mongo.insert("debateStatus",newRoom,{},this.hold(function(_res){
                req.session.debateLogin.num = num
                req.session.debateLogin.rNum = rNum
                req.session.debateLogin.model = "debate"
                res.end(JSON.stringify({err:0,msg:"successfully"}))
            }))
        },function(){
            mongo.update("debateMembers",{username:req.session.debateLogin.username,group:req.session.debateLogin.group},{$set:{debateInvolve:true,num:num,rNum:rNum}},{},function(){

            })
        })()
    },
    participateRoomController:function(req,res){
        var position = req.body.position
        var num = req.body.num
        var rNum = req.body.rNum

        if(position == 1){
            var _update = {pro:req.session.debateLogin.username}
        }else{
            var _update = {con:req.session.debateLogin.username}
        }

        req.session.debateLogin.position = position

        steps(function(){
            mongo.update("debateStatus",{num:num,rNum:rNum},{$set:_update},this.hold(function(result){
                req.session.debateLogin.num = num
                req.session.debateLogin.rNum = rNum
                req.session.debateLogin.model = "debate"
                res.end(JSON.stringify({err:0,msg:"successfully"}))
            }))
        },function(){
            mongo.update("debateMembers",{username:req.session.debateLogin.username,group:req.session.debateLogin.group},{$set:{debateInvolve:true,num:num,rNum:rNum}},{},function(){

            })
        })()
    },
    chatController:function(req,res){
        res.render("release/chat.html")
    },
    getUserInformationController:function(req,res){
        var num = req.session.debateLogin.num
        var rNum = req.session.debateLogin.rNum
        var username = req.session.debateLogin.username
        var group = req.session.debateLogin.group
        var LAN = req.session.LAN

        mongo.find("debateMembers",{username:username,group:group},{},function(_result){
            if(_result.length>0){
                res.end(JSON.stringify({err:0,data:{num:num,rNum:rNum,username:username,group:group,status:_result[0].status,debateInvolve:_result[0].debateInvolve,LAN:LAN}}))
            }else{
                res.end(JSON.stringify({err:1,msg:"no data find"}))
            }
        })
    },


    getDebateInformationController:function(req,res){
        mongo.find("debateStatus",{num:req.session.debateLogin.num,rNum:req.session.debateLogin.rNum},{},function(_res){

            if(_res.length == 0){
                res.end(JSON.stringify({err:1,msg:"no data exists"}))
                return;
            }

            _res[0].position = req.session.debateLogin.position
            _res[0].username = req.session.debateLogin.username
            _res[0].status = _res[0].status
            _res[0].LAN = req.session.LAN

            console.log(JSON.stringify(_res[0]))
            res.end(JSON.stringify(_res[0]))
        })
    },

    getDebateStatementMapInformationController:function(req,res){
        mongo.find("statementLog",{num:req.session.debateLogin.num,rNum:req.session.debateLogin.rNum},{},function(_res){
            console.log(JSON.stringify(_res))
            res.end(JSON.stringify(_res))
        })
    },
    getDebateAnalysisMapInformationController:function(req,res){
        mongo.find("analysisLog",{num:req.session.debateLogin.num,rNum:req.session.debateLogin.rNum},{},function(_res){
            console.log(JSON.stringify(_res))
            res.end(JSON.stringify(_res))
        })
    },
}