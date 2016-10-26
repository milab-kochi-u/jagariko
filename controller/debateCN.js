var mongo = require("../model/mongo.js");
var tool = require("./tool.js");
var steps = require('ocsteps');

module.exports = {
    indexController:function(req,res){
        if(tool.isEmpty(req.session.debateLogin)){
            res.redirect("login")
            return;
        }
    },
    loginController:function(req,res){
        res.render("debateCN/login",{})
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

        steps(function(){

            mongo.find("debateStatus",{group:req.session.debateLogin.group,finish:false,setting:1},{},this.hold(function(result){

                for(var i=0;i<result.length;i++){

                    (function(k,that){
                        mongo.find("themes",{num:result[k].num},{},that.hold(function(_result){
                            if(_result.length>0){
                                debatingList.push({num:result[k].num,rNum:result[k].rNum,theme:_result[0].theme,con:result[k].con,pro:result[k].pro,status:result[k].status})
                            }
                        }))
                    })(i,this)

                }
            }))

        },function(){

            mongo.find("debateStatus",{group:req.session.debateLogin.group,finish:true,setting:1},{},this.hold(function(result){

                for(var i=0;i<result.length;i++){

                    (function(k,that){
                        mongo.find("themes",{num:result[k].num},{},that.hold(function(_result){
                            if(_result.length>0){
                                finishList.push({num:result[k].num,rNum:result[k].rNum,theme:_result[0].theme,con:result[k].con,pro:result[k].pro,status:result[k].status})
                            }
                        }))
                    })(i,this)

                }
            }))

        },function(){
            mongo.find("themes",{group:req.session.debateLogin.group},{},this.hold(function(list){
                themes = list
            }))
        },function(){
            res.render("debateCN/group",{userInformation:req.session.debateLogin,themes:themes,debatingList:debatingList,finishList:finishList})
        })()
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
    createNewRoomController:function(req,res){
        var position = req.body.position
        var num = req.body.num
        var title = req.body.title

        var rNum = Math.round(Math.random()*10000)
        if(position == 1){
            var newRoom = {title:title,pro:req.session.debateLogin.username,num:num,rNum:rNum,finish:false,setting:0,status:-1,preStatus:null,group:req.session.debateLogin.group}
        }else{
            var newRoom = {title:title,con:req.session.debateLogin.username,num:num,rNum:rNum,finish:false,setting:0,status:-1,preStatus:null,group:req.session.debateLogin.group}
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

        console.log("result ......")
        console.log(_update)
        console.log({num:num,rNum:rNum})
        steps(function(){
            mongo.update("debateStatus",{num:num,rNum:rNum},{$set:_update},this.hold(function(result){
                console.log(result)
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
    reviewRoomController:function(req,res){
        var num = req.body.num
        var rNum = req.body.rNum
        req.session.debateLogin.num = num
        req.session.debateLogin.rNum = rNum
        req.session.debateLogin.model = "review"
        res.end(JSON.stringify({err:0,msg:"successfully"}))
    },
    chatController:function(req,res){
        if(tool.isEmpty(req.session.debateLogin)){
            res.redirect("login")
        }

        steps(function(){
            mongo.find("debateStatus",{num:req.session.debateLogin.num,rNum:req.session.debateLogin.rNum},{},this.hold(function(_res){
                if(tool.isEmpty(_res)){
                    res.redirect("group")
                    return
                }else{
                    res.render("debateCN/chat",{})
                }
            }))
        })()


    },
    getDebateInformationController:function(req,res){
        mongo.find("debateStatus",{num:req.session.debateLogin.num,rNum:req.session.debateLogin.rNum},{},function(_res){
            _res[0].position = req.session.debateLogin.position
            _res[0].username = req.session.debateLogin.username
            _res[0].status = (parseInt(_res[0].status +1 ) || -1) - 1
            console.log(JSON.stringify(_res[0]))
            res.end(JSON.stringify(_res[0]))
        })
    },
    reviewController:function(req,res){
        if(tool.isEmpty(req.session.debateLogin)){
            res.redirect("login")
        }
        res.render("debateCN/review",{})
    },
    fetchAnalysisLogController:function(req,res){


        if(!req.session.debateLogin.rNum){
            res.end(JSON.stringify({err:1,msg:"illegal session"}))
            return;
        }

        steps(function(){
             mongo.find("analysisLog",{num:req.session.debateLogin.num,rNum:req.session.debateLogin.rNum},{},function(_res){
                    res.end(JSON.stringify(_res))
             })
        })()

    },
    fetchStatementLogController:function(req,res){
        if(!req.session.debateLogin.rNum){
            res.end(JSON.stringify({err:1,msg:"illegal session"}))
            return;
        }

        steps(function(){
            mongo.find("statementLog",{num:req.session.debateLogin.num,rNum:req.session.debateLogin.rNum},{},function(_res){
                
                res.end(JSON.stringify(_res))
            })
        })()
    }
}