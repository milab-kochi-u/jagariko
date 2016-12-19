/**
 *
 * Created by xuzhongwei on 2016/11/01.
 */

var mongo = require("../model/mongo.js");
var tool = require("./tool.js");
var steps = require('ocsteps');
var mongodb = require("mongodb")



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

    logoutController:function(req,res){
        delete req.session.debateInfo
        res.redirect("login")
    },

    loginPostController:function(req,res){

        var _username = req.body.username;
        var _password = req.body.password;
        var _group = req.body.group

        steps(
            function(){
                mongo.find("debateMembers",{username:_username,password:_password,group:_group},{},this.hold(function(result){
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

                                req.session.debateLogin.analysisFunc = _result[0].analysisFunc
                                if(_result[0].analysisFunc == 1){
                                    req.session.debateLogin.mapFunc = _result[0].mapFunc
                                }

                                res.end(JSON.stringify({error:0,msg:"successful",cookieId:cookieId,debating:true}))
                                return;
                            }else{
                                req.session.debateLogin = {username:result[0].username,password:result[0].password,type:result[0].type,group:result[0].group,debateInvolve:false}
                                res.end(JSON.stringify({error:1,msg:"involved debate not finished yet but no debate log has been found",cookieId:cookieId}))
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

        res.render("release/groupNew.html")
    },

    getListInformationController:function(req,res){
        var themes = []
        var debateStatus = []

        steps(function(){
            mongo.find("themes",{group:req.session.debateLogin.group},{},this.hold(function(_res){
                    themes = _res
            }))
        },function(){
            mongo.find("debateStatus",{group:req.session.debateLogin.group},{},this.hold(function(_res){
                debateStatus = _res
            }))
        },function(){
            for(var i=0;i<themes.length;i++){
                themes[i].debating = []
                themes[i].finish = []
                for(var j=0;j<debateStatus.length;j++){
                    if(debateStatus[j].finish == false && themes[i].num == debateStatus[j].num){
                       themes[i].debating.push(debateStatus[j])
                    }

                    if(debateStatus[j].finish == true && themes[i].num == debateStatus[j].num){
                        themes[i].finish.push(debateStatus[j])
                    }
                }
            }

            res.end(JSON.stringify(themes))
        })()
    },

    getCurrentSelfDebateInfoController:function(req,res){
        var username = req.session.debateLogin.username
        var group = req.session.debateLogin.group
        steps(function(){
            mongo.find("debateStatus",{$or:[{pro:username},{con:username}],group:group},{},function(result){
                res.end(JSON.stringify({err:0,data:result}))
            })
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
        var timeLimit = req.body.timeLimit
        var timeLimitVal = req.body.timeLimitVal
        var analysisFunc = req.body.analysisFunc
        var mapFunc = req.body.mapFunc
        var totalNum = req.body.totalNum

        if(analysisFunc == 0){
            //如果没有分析功能的话,那么肯定没有地图功能
            mapFunc = 0
            var startStatus = "noAnalysisStart"
        }else{
            var startStatus = "start"
        }

        var rNum = Math.round(Math.random()*10000)




        if(position == 1){
            var newRoom = {title:title,pro:req.session.debateLogin.username,num:num,rNum:rNum,finish:false,status:startStatus,preStatus:null,group:req.session.debateLogin.group,order:0,timeLimit:timeLimit,timeLimitVal:timeLimitVal,analysisFunc:analysisFunc,mapFunc:mapFunc,totalNum:totalNum}
        }else{
            var newRoom = {title:title,con:req.session.debateLogin.username,num:num,rNum:rNum,finish:false,status:startStatus,preStatus:null,group:req.session.debateLogin.group,order:0,timeLimit:timeLimit,timeLimitVal:timeLimitVal,analysisFunc:analysisFunc,mapFunc:mapFunc,totalNum:totalNum}
        }



        steps(function(){
            mongo.insert("debateStatus",newRoom,{},this.hold(function(_res){
                req.session.debateLogin.num = num
                req.session.debateLogin.rNum = rNum
                req.session.debateLogin.model = "debate"

                req.session.debateLogin.position = position
                req.session.debateLogin.analysisFunc = parseInt(analysisFunc)
                req.session.debateLogin.mapFunc = parseInt(mapFunc)

                res.end(JSON.stringify({err:0,msg:"successfully"}))
            }))
        },function(){
            mongo.update("debateMembers",{username:req.session.debateLogin.username,group:req.session.debateLogin.group},{$set:{debateInvolve:true,num:num,rNum:rNum}},{},function(){

            })
        })()
    },

    participateRoomController:function(req,res){
        var position = parseInt(req.body.position)
        var num = req.body.num
        var rNum = req.body.rNum

        if(position == 1){
            var _update = {pro:req.session.debateLogin.username}
        }else if(position == 2){
            var _update = {con:req.session.debateLogin.username}
        }else if(position ==0){
            //オブザーバーとして参加
            var _update = {observer:req.session.debateLogin.username}
        }else{
            res.end(JSON.stringify({err:1,msg:"illegal position data"}))
            return
        }

        req.session.debateLogin.position = position

        steps(
            function(){
                if(position > 0){
                    //オブザーバーではない場合には
                    mongo.find("debateStatus",{num:num,rNum:rNum},{},this.hold(function(result){
                        //检查参加的是不是自己创建的房间
                        if(position == 1){
                            if(req.session.debateLogin.username == result[0].con){
                                res.end(JSON.stringify({err:1,msg:"this is already your room now"}))
                                this.terminate()
                            }
                        }else if(position == 2){
                            if(req.session.debateLogin.username == result[0].pro){
                                res.end(JSON.stringify({err:1,msg:"this is already your room now"}))
                                this.terminate()
                            }
                        }else{
                            res.end(JSON.stringify({err:1,msg:"illegal position data"}))
                            this.terminate()
                        }

                        req.session.debateLogin.analysisFunc = result[0].analysisFunc
                        req.session.debateLogin.mapFuc = result[0].mapFunc

                    }))
                }

            },
            function(){
            mongo.update("debateStatus",{num:num,rNum:rNum},{$set:_update},this.hold(function(result){
                req.session.debateLogin.num = num
                req.session.debateLogin.rNum = rNum
                req.session.debateLogin.model = "debate"
                res.end(JSON.stringify({err:0,msg:"successfully"}))
            }))
        },function(){
                if(position > 0){
                    //オブザーバーではない場合
                    var update = {$set:{debateInvolve:true,num:num,rNum:rNum}}
                }else{
                    //オブザーバーの場合
                    var update = {$set:{num:num,rNum:rNum}}
                }
            mongo.update("debateMembers",{username:req.session.debateLogin.username,group:req.session.debateLogin.group},update,{},function(){

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

        steps(
        function(){
            //贏了多少次輸了多少次
        },function(){
                mongo.find("debateMembers",{username:username,group:group},{},this.hold(function(_result){
                    if(_result.length>0){
                        res.end(JSON.stringify({err:0,data:{num:num,rNum:rNum,username:username,group:group,status:_result[0].status,debateInvolve:_result[0].debateInvolve,LAN:LAN,winNum:_result[0].winNum,lostNum:_result[0].lostNum,drawNum:_result[0].drawNum,unDeterminNum:_result[0].unDeterminNum}}))
                    }else{
                        res.end(JSON.stringify({err:1,msg:"no data find"}))
                    }
                }))
        })()

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
        var status
        steps(function(){
            mongo.find("analysisLog",{num:req.session.debateLogin.num,rNum:req.session.debateLogin.rNum},{},this.hold(function(_res){
                /*
                //只有在分析阶段才会从debateStatus数据表取analysisData

                if(status == "analysis" || status == "bunseki"){
                    //把当前还没有写入analysisLog的analysisData也放入地图数组信息里面
                    if(everyAnalysisData){
                        arr.push(everyAnalysisData)
                    }
                }

                */


                console.log(_res)
                res.end(JSON.stringify(_res))
            }))
        })()

    },

    backToRoomController:function(req,res){
        var _id = req.body._id
        if(!_id) return;

        var objectId = new mongodb.ObjectID(_id)
        var num,rNum
        var username = req.session.debateLogin.username

        steps(function(){
            mongo.find("debateStatus",{_id:objectId},{},this.hold(function(result){
               if(result.length == 0){
                   res.end(JSON.stringify({err:1,msg:"no data find"}))
                   this.terminate()
               }else{

                    if(username == result[0].pro){
                        req.session.debateLogin.position = 1
                    }


                   if(username == result[0].con){
                       req.session.debateLogin.position = 2
                   }


                   req.session.debateLogin.analysisFunc = result[0].analysisFunc
                   req.session.debateLogin.mapFuc = result[0].mapFunc

                    console.log(req.session.debateLogin)
                    num = result[0].num
                    rNum = result[0].rNum
                    req.session.debateLogin.num = num
                    req.session.debateLogin.rNum = rNum
                    res.end(JSON.stringify({err:0,data:{num:num,rNum:rNum}}))
               }
            }))
        },function(){

        })()
    },
    leaveRoomController:function(req,res){
        var num = req.session.debateLogin.num
        var rNum = req.session.debateLogin.rNum
        var position = req.session.debateLogin.position
        var deleteRoom = false
        /*
        steps(function(){
            mongo.find("debateStatus",{num:num,rNum:rNum},{},this.hold(function(result){
                if(result.length == 0) return;

                if(result[0].status == "wait"){
                   if(position == 1){
                       if(!result[0].con) deleteRoom = true  //如果你是正方,且反方还没有人占据,那么可以删除这个房间
                   }else if(position == 2){
                        if(!result[0].pro) deleteRoom = true //如果你是反方,且正方的位置还没有人占据,那么可以删除这个房间
                   }else{

                   }
                }
            }))
        },function(){
            if(!deleteRoom) return;

            mongo.remove("debateStatus",{num:num,rNum:rNum},{},this.hold(function(result){
            }))
        },function(){
            res.end(JSON.stringify({err:0,data:{}}))
        })()
        */

        //这里面需求改变了,原来更具有没有准备来决定退出这个房间的时候放不放弃这条记录
        //现在则是根据有没有做statement来决定退出时保不保留这条记录


        //如果正方退出时
        //1.反方有人
            //1.自己以做出主張 ----->不改变pro字段,保留数据记录
            //2.自己还没有做出主張 ------->删除pro字段,保留数据记录
        //2.反方无人
            //1.自己已做出主張  -------> 删除数据记录
            //2.自己还没有做出主張 -----> 删除数据记录

        //如果反方退出时
        //1.正方有人
            //1.正方已做出主張 -------->不改变con字段,保留数据记录
            //2.正方还没有做出主張-------->改变con字段
        //2.正方没人


        steps(function(){
            mongo.find("debateStatus",{num:num,rNum:rNum},{},this.hold(function(result){
                if(result.length == 0) return;
                //只有处于开始阶段退出的时候才有可能被删除

                //只有是在开始阶段,如果对方空缺
            }))
        })()
    }
}