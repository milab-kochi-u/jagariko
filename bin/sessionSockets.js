/**
 *
 * Created by xuzhongwei on 6/21/16.
 */


var sessionSockets = function(sessionSockets,steps,mongo){







    sessionSockets.of("/_group").on('connection',function(err,socket,session){

    })

    sessionSockets.of("/_chat").on('connection',function(err,socket,session){
        socket.on("enterRoom",function(msg){
            console.log("enter room session is the following...")
            console.log(session.debateLogin)

            var loginInfo = session.debateLogin
            delete loginInfo['password']
            var lastest = {}
            steps(
                function(){
                    // 传给刚进入房间或者是再次进入房间的用户status
                    mongo.find("debateStatus",{num:loginInfo.num,rNum:loginInfo.rNum,group:loginInfo.group},{},this.hold(function(result){
                        return {status:result[0].status,config:result[0].config,setting:result[0].setting}
                    }))
                },function(_obj){
                    socket.emit("enterRoom",{loginInfo:loginInfo,status:_obj.status,config:_obj.config,setting:_obj.setting})
                    socket.broadcast.emit("enterRoom",{loginInfo:loginInfo,status:_obj.status,config:_obj.config,setting:_obj.setting})
                })()

        })

        socket.on("debateSetting",function(msg){
            steps(function(){
                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{config:{timeNumbers:msg.timeNumbers,timeLimit:msg.timeLimit,timeLimitValDefault:msg.timeLimitValDefault,timeLimitValCustomize:msg.timeLimitValCustomize},setting:1}},this.hold(function(_res){
                    socket.emit("systemSettingFinish",msg)
                    socket.broadcast.emit("systemSettingFinish",msg)
                }))
            })()
        })

        socket.on("prepare",function(msg){
             if(parseInt(session.debateLogin.position) == 1){
                    var _update = {proPrepare:1}
             }else{
                    var _update = {conPrepare:1}
             }
            steps(function(){
                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:_update},this.hold(function(){
                    socket.emit("prepared",_update)
                    socket.broadcast.emit("prepared",_update)
                }))
            },function(){
                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){
                    if(parseInt(_res[0].conPrepare) == 1 && parseInt(_res[0].proPrepare) == 1){
                        this.step(function(){
                            mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{status:0,preStatus:-2,order:1}},this.hold(function(){
                                socket.emit("prepareCompelete",{})
                                socket.broadcast.emit("prepareCompelete",{})
                            }))
                        })
                    }
                }))
            })()
        })


        socket.on("giveStatement",function(msg){

                var order
                steps(function(){
                    mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){

                        var _update = {}

                        order = _res[0].order
                        if(parseInt(_res[0].status)==6){

                            if(_res[0].order < _res[0].config.timeNumbers){
                                _update = {$set:{status:1,preStatus:_res[0].status},$inc:{order:1}}
                            }else{
                                _update = {$set:{status:1,preStatus:_res[0].status,finish:true}}
                                mongo.update("debateMembers",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{debateInvolve:false}},{multi: true},this.hold(function () {
                                    return _update
                                }))
                            }

                        }else{
                            _update = {$inc:{status:1},$set:{preStatus:_res[0].status}}
                        }

                        return _update

                    }))
                },function(_update){
                        mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},_update,{},this.hold(function(_res){

                        }))
                },function(){
                    var sendObj = {}
                    sendObj.position = session.debateLogin.position
                    sendObj.obj = msg.inputMessage
                    sendObj.order = order
                    var objs = []
                    for(var i=0;i<sendObj.obj.length;i++){
                        objs.push([{"claimTxt":"","dissent":0,"warrant":[{"warrantTxt":"","evidence":[{"evidenceTxt":"","dissent":0}],"dissent":0}],index:sendObj.obj[i].index}])
                    }
                    mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{everyStatement:sendObj,objs:objs}},{},this.hold(function(_res){
                        socket.emit("receiveStatement",{sendObj:sendObj,objs:objs})
                        socket.broadcast.emit("receiveStatement",{sendObj:sendObj,objs:objs})
                    }))
                },function(){
                    mongo.insert("statementLog",{num:session.debateLogin.num,rNum:session.debateLogin.rNum,inputMessage:msg.inputMessage,position:session.debateLogin.position,time:
                        (new Date()).getTime(),type:"first"},{},this.hold(function(_res){

                    }))
                })()
        })


        socket.on("giveTwiceStatement",function(msg){
            steps(function() {
                    mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){
                        return  _res[0].status
                    }))
            },function(status){
                    mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$inc:{status:-1},$set:{preStatus:status}},this.hold(function(){

                    }))
            },function(){
                var sendObj = {}
                sendObj.position = session.debateLogin.position
                sendObj.obj = msg
                socket.emit("receiveTwiceStatement",sendObj)
                socket.broadcast.emit("receiveTwiceStatement",sendObj)
                return sendObj
            },function(sendObj){
                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{everyStatement:obj}},{},function(_res){
                        console.log(_res)
                })
            },function(){
                console.log(msg)
                mongo.insert("statementLog",{num:session.debateLogin.num,rNum:session.debateLogin.rNum,inputMessage:msg.obj,position:session.debateLogin.position,time:(new Date()).getTime(),type:"twice"},{},this.hold(function(_res){
                        console.log(_res)
                }))
            })()
        })


        socket.on("requestStatement",function(msg){
            steps(function() {
                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){
                    return  _res[0].status
                }))
            },function(status){
                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$inc:{status:-1},$set:{preStatus:status}},this.hold(function(){

                }))
            },function(){
                socket.emit("requestStatement",msg)
                socket.broadcast.emit("requestStatement",msg)
            },function(){
                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{requestStatementMessage:msg.requestStatementMessage}},this.hold(function(_res){

                }))
            },function(){

                mongo.insert("statementLog",{num:session.debateLogin.num,rNum:session.debateLogin.rNum,requestStatementMessage:msg.requestStatementMessage,position:session.debateLogin.position,time:
                (new Date()).getTime(),type:"request"},{},this.hold(function(_res){

                }))

            })()

        })

        socket.on("refuseAnalysis",function(msg){
            steps(function() {
                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){
                    return  _res[0].status
                }))
            },function(status){
                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$inc:{status:-1},$set:{preStatus:status}},this.hold(function(){

                }))
            },function(){
                socket.emit("refuseAnalysis",msg)
                socket.broadcast.emit("refuseAnalysis",msg)
            },function(){
                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{refuseAnalysisResultReason:msg.refuseAnalysisResultReason}},this.hold(function(_res){

                }))
            })()
        })

        socket.on("giveAnalysis",function(msg){

            // inputStatement = [{title:"主張を述べてください",dissent:0,content:""}]

            if(msg.LAN == 'JP'){
                var inputMessage = [{title:"主張を述べてください",dissent:0,content:"",index:Math.round(Math.random()*10000)}]
            }else{

                var inputMessage = [{title:"请阐述你的结论",dissent:0,content:"",index:Math.round(Math.random()*10000)}]
            }

            for(var t=0;t<msg.objs.length;t++){
                for(var i=0;i<msg.objs[t].length;i++){
                    if(msg.objs[t][i].dissent){
                        msg.objs[t][i].random = Math.round(Math.random()*10000000)
                        inputMessage.push({title:msg.objs[t][i].claimTxt,dissent:1,content:"",index:msg.objs[t][i].random})
                    }
                    for(var j=0;j<msg.objs[t][i].warrant.length;j++){
                        if(msg.objs[t][i].warrant[j].dissent){
                            msg.objs[t][i].warrant[j].random = Math.round(Math.random()*10000000)
                            inputMessage.push({title:msg.objs[t][i].warrant[j].warrantTxt,dissent:1,content:"",index:msg.objs[t][i].warrant[j].random})
                        }

                        for(var k=0;k<msg.objs[t][i].warrant[j].evidence.length;k++){
                            if(msg.objs[t][i].warrant[j].evidence[k].dissent){
                                msg.objs[t][i].warrant[j].evidence[k].random = Math.round(Math.random()*10000000)
                                inputMessage.push({title:msg.objs[t][i].warrant[j].evidence[k].evidenceTxt,dissent:1,content:"",index:msg.objs[t][i].warrant[j].evidence[k].random})
                            }
                        }
                    }
                }
            }

            var sendObj
            var order

            steps(function() {
                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){
                    order = _res[0].order
                    return  _res[0].status
                }))
            },function(status){
                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$inc:{status:1},$set:{preStatus:status}},this.hold(function(){

                }))
            },function(){
                sendObj = msg
                sendObj.position = session.debateLogin.position
                sendObj.order = order

                socket.emit("receiveAnalysis",{sendObj:sendObj,inputMessage:inputMessage})
                socket.broadcast.emit("receiveAnalysis",{sendObj:sendObj,inputMessage:inputMessage})
            },function(){
                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{everyAnalysisData:sendObj,inputMessage:inputMessage}},this.hold(function(){

                }))
            })()

        })

        socket.on("confirmAnalysisResult",function(msg){
            var pro
            var con
            steps(function() {
                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){
                    pro = _res[0].pro
                    con = _res[0].con
                    return  _res[0].status
                }))
            },function(status){
                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$inc:{status:1},$set:{preStatus:status}},this.hold(function(){

                }))
            },function(){
                var sendObj = msg
                socket.emit("confirmAnalysisResultFinish",sendObj)
                socket.broadcast.emit("confirmAnalysisResultFinish",sendObj)
            },function(){
                msg.everyAnalysisData.rNum = session.debateLogin.rNum
                msg.everyAnalysisData.num = session.debateLogin.num
                msg.everyAnalysisData.pro = pro
                msg.everyAnalysisData.con = con
                mongo.insert("analysisLog",msg.everyAnalysisData,{},this.hold(function(_res){

                }))
            })()
        })


        socket.on('disconnect', function(msg){

            console.log("room debate has been out of connection")
            console.log(msg)
            if(!session){
                return
            }
            console.log(session.debateLogin)

            var username = session.debateLogin.username
            var group = session.debateLogin.group
            var num = session.debateLogin.num
            var rNum = session.debateLogin.rNum
            var position = session.debateLogin.position


            //userStatus status
            //   -1 logout
            //    0 login
            //    1 entering
            //    2 debating

            steps(function(){

            },function(){
                mongo.find("debateStatus",{num:num,rNum:rNum},{},this.hold(function(result){
                    var pro = result[0].pro
                    var con = result[0].con
                    var status = result[0].status
                    if(status < 0){
                        //比赛还没有开始



                        if((position == 1 && !con) || (position == 2 && !pro)){
                            mongo.remove("debateStatus",{num:num,rNum:rNum},{},this.hold(function(result){
                                delete session.debateLogin.num
                                delete session.debateLogin.position
                                delete session.debateLogin.rNum
                                session.save()

                                mongo.update("debateMembers",{username:session.debateLogin.username,group:session.debateLogin.group},{$set:{debateInvolve:false},$unset:{num:1,rNum:1}},{},this.hold(function(){

                                }))



                            }))
                        }else{
                                mongo.update("debateMembers",{username:session.debateLogin.username,group:session.debateLogin.group},{$set:{debateInvolve:false},$unset:{num:1,rNum:1}},{},this.hold(function(){
                                        if(position==1){
                                            var update = {$unset:{pro:1,proPrepare:1}}
                                        }else{
                                            var update = {$unset:{con:1,conPrepare:1}}
                                        }

                                        mongo.update("debateStatus",{num:num,rNum:rNum},update,{},this.hold(function(result){
                                            delete session.debateLogin.num
                                            delete session.debateLogin.position
                                            delete session.debateLogin.rNum
                                            session.save()
                                        }))
                                }))
                        }


                    }else{
                        //比赛已经开始了


                    }



                }))
            })()

        });

    })


    sessionSockets.of("/test").on('connection',function(err,socket,session){
        socket.on("sendAnalysisResult",function(msg){
            console.log(msg)
            socket.broadcast.emit("receiveAnalysisResult",msg)
            socket.emit("receiveAnalysisResult",msg)
        })
    })

    sessionSockets.of("/debate").on('connection', function (err, socket, session) {
        //your regular socket.io code goes here
        //and you can still use your io object

        socket.on("enterRoom",function(msg){
            console.log("enter room session is the following...")
            console.log(session.debateLogin)

            var loginInfo = session.debateLogin
            delete loginInfo['password']
            var lastest = {}
            steps(
                function(){
                    mongo.find("statementLog",{lastest:1},{},this.hold(function(result){
                        lastest.statement = result[0]
                    }))
                },
                function(){
                    mongo.find("analysisLog",{lastest:1},{},this.hold(function(result){
                        lastest.analysis = result[0]
                    }))
                },
                function(){
                    // 传给刚进入房间或者是再次进入房间的用户status
                    mongo.find("debateStatus",{num:loginInfo.num,rNum:loginInfo.rNum,group:loginInfo.group},{},this.hold(function(result){
                        return {status:result[0].status,timeLimit:result[0].timeLimit,setting:result[0].setting}
                    }))
                },function(_obj){
                    socket.emit("enterRoom",{loginInfo:loginInfo,status:_obj.status,timeLimit:_obj.timeLimit,setting:_obj.setting,lastest:lastest})
                    socket.broadcast.emit("enterRoom",{loginInfo:loginInfo,status:_obj.status,timeLimit:_obj.timeLimit,setting:_obj.setting})
                })()

        })

        socket.on("getLastest",function(msg){
            steps(function(){

                mongo.find("statementLog",{},{},this.hold(function(result){

                }))

            })()
        })


        socket.on("prepare",function(msg){
            var prepareInfo = session.debateLogin
            delete prepareInfo['password']
            socket.emit("prepare",{prepareInfo:prepareInfo})
            socket.broadcast.emit("prepare",{prepareInfo:prepareInfo})


            steps(function(){

                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(result){
                    var proPrepare = result[0].proPrepare
                    var conPrepare = result[0].conPrepare

                    if(parseInt(proPrepare) == 1  && parseInt(conPrepare) == 1){

                        //debateStatus status
                        // 0 pro 做陈述
                        // 1 con 做分析
                        // 2 con 做陈述
                        // 3 pro 做分析

                        //userStatus status
                        //   -1 logout
                        //    0 login
                        //    1 entering
                        //    2 debating

                        mongo.update("userStatus",{username:result[0].pro,num:result[0].num,rNum:result[0].rNum},{$set:{status:2}},{},function(result){

                        })

                        mongo.update("userStatus",{username:result[0].con,num:result[0].num,rNum:result[0].rNum},{$set:{status:2}},{},function(result){

                        })

                        mongo.update("debateStatus",{num:session.debateLogin.num},{$set:{status:0}},{},this.hold(function(res){
                            socket.emit("allPrepare",{status:0})
                            socket.broadcast.emit("allPrepare",{status:0})
                        }))
                    }
                }))


            },function(){


            })()
        })


        socket.on("makeStatement",function(msg){

            // 0 pro 做陈述
            // 1 con 做分析
            // 2 con 做陈述
            // 3 pro 做分析

            for(var i=0;i<msg.submitContentArr.length;i++){
                msg.submitContentArr[i].uuid = Math.round(Math.random()*1000000000)
            }

            //把陈述内容计入数据库
            steps(function(){
                mongo.createIfNotExists("statementLog",this.hold(function(result){

                }))
            },function(){
                mongo.update("statementLog",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$unset:{lastest:1}},{multi:true},this.hold(function(result){

                }))
            },function(){
                mongo.insert("statementLog",{num:session.debateLogin.num,rNum:session.debateLogin.rNum,position:session.debateLogin.position,lastest:1,submitContentArr:msg.submitContentArr,time:Date.parse(new Date())},{},this.hold(function(result){

                }))
            },function(){
                //如果是pro方做陈述的话，修改当前处于第几轮
                if(session.debateLogin.position == 1){
                    mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$inc:{numberOrder:1}},{},this.hold(function(result){

                    }))
                }
            },function(){
                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(result){
                    var status = result[0].status || 0
                    msg.numberOrder = result[0].numberOrder
                    msg.status = status
                    var preStatus = status
                    if(msg.violate == 1){
                        if(msg.status==0){
                            status = 2
                            socket.broadcast.emit("restartFromCon",{status:status,preStatus:preStatus})
                            socket.emit("restartFromCon",{status:status,preStatus:preStatus})
                        }else{
                            status = 0
                            socket.broadcast.emit("restartFromPro",{status:status,preStatus:preStatus})
                            socket.emit("restartFromPro",{status:status,preStatus:preStatus})
                        }

                        return status-1;
                    }else{
                        msg.status = (status + 1)%4
                        this.step(
                            function(){
                                mongo.createIfNotExists("LatestAnalysisMsg",this.hold(function(){

                                }))
                            },function(){
                                mongo.remove("LatestStatementMsg",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(){

                                }))
                            },function(){
                                mongo.insert("LatestStatementMsg",{num:session.debateLogin.num,rNum:session.debateLogin.rNum,msg:msg},{},this.hold(function(){
                                    socket.emit("receiveStatement",msg)
                                    socket.broadcast.emit("receiveStatement",msg)
                                    socket.emit("DoAnalysis",msg)
                                    socket.broadcast.emit("DoAnalysis",msg)
                                    return status;
                                }))
                            })

                    }

                }))
            },function(status){
                console.log(status)
                status = (status + 1)%4
                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{status:status}},{},this.hold(function(result){
                    console.log(result)
                }))
            })()


        })

        socket.on("makeAnalysis",function(msg){


            for(var i=0;i<msg._obj.length;i++){
                msg._obj[i].uuid = Math.round(Math.random()*1000000000)
                for(var j=0;j<msg._obj[i].warrant.length;j++){
                    msg._obj[i].warrant[j].uuid =  Math.round(Math.random()*1000000000)
                    for(var k=0;k<msg._obj[i].warrant[j].evidence.length;k++){
                        msg._obj[i].warrant[j].evidence[k].uuid = Math.round(Math.random()*1000000000)
                    }
                }
            }

            if(msg.violate == 1){
                steps(function(){
                    mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(result){
                        var status = result[0].status
                        var preStatus = status;
                        if(status == 1){
                            status = 2
                            socket.broadcast.emit("restartFromCon",{status:status,preStatus:preStatus})
                            socket.emit("restartFromCon",{status:status,preStatus:preStatus})
                        }

                        if(status == 3){
                            status = 0
                            socket.broadcast.emit("restartFromPro",{status:status,preStatus:preStatus})
                            socket.emit("restartFromPro",{status:status,preStatus:preStatus})
                        }

                        return status;
                    }))
                },function(status){
                    mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{status:status}},{},this.hold(function(result){
                        console.log(result)
                    }))
                })()


                return false;
            }

            steps(function(){
                mongo.createIfNotExists("analysisLog",this.hold(function(result){

                }))
            },function(){
                mongo.update("analysisLog",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$unset:{lastest:1}},{multi:true},this.hold(function(result){

                }))
            },function(){
                mongo.insert("analysisLog",{num:session.debateLogin.num,rNum:session.debateLogin.rNum,position:session.debateLogin.position,lastest:1,obj:msg._obj,dissentObj:msg.dissentObj,fenduanArr:msg.fenduanArr,time:Date.parse(new Date())},{},this.hold(function(result){

                }))
            },function(){
                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(result){
                    var status = result[0].status
                    msg.numberOrder = result[0].numberOrder
                    //msg.status = (status + 1)%4
                    msg.status = status;
                    socket.emit("receiveAnalysis",msg)
                    // msg is the following...
                    // { _obj: [ { claimTxt: '勉強用の時間が減少しても，学業が疎かにならない', warrant: [Object] } ],
                    //     dissentObj: [ { claimDissnet: '', warrant: [Object] } ],
                    //     fenduanArr: [ 1 ],
                    //     numberOrder: 1,
                    //     status: 2 }
                    //var dissentObj = [{"claimDissent":1,"warrant":[{"warrantDissent":1,"evidenceDissent":[1]}]}]
                    //var _obj =  [{"claimTxt":"勉強用の時間が減少しても，学業が疎かにならない","warrant":[{"warrantTxt":"大切にするから，時間の効率がよくなって，勉強の効果も上がる","evidence":[{"evidenceTxt":"勉強用の時間が少なければ，その時間を大切することになる"}]}]}]

                    socket.broadcast.emit("receiveAnalysis",msg)
                    return status;
                }))

            },function(status){
                //status = (status + 1)%4
                //mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{status:status}},{},this.hold(function(result){
                //    console.log(result)
                //}))
            },function(){
                mongo.createIfNotExists("LatestAnalysisMsg",this.hold(function(_res){

                }))
            },function(){
//                mongo.remove("LatestAnalysisMsg",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){
//
//                }))
            },function(){
                mongo.insert("LatestAnalysisMsg",{num:session.debateLogin.num,rNum:session.debateLogin.rNum,msg:msg,confirmed:0},{},this.hold(function(){

                }))
            })()

        })

        //监测到客户端的时间违规时间
        socket.on("timeLimitViolate",function(){
            //console.log("session debateLogin is the following....")
            //console.log(session.debateLogin)
            //{ username: 'villa', group: 'miyoshi', num: 1, position: 2 }

            //查看当前debate的状态从而得知是谁在哪个状态里时间违规的
            steps(function(){
                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(result){
                    var status = result[0].status

                    console.log("the status is the following....")
                    console.log(status)

                    //再把违规事件发送给客户端并且告诉客户端在debate的哪个状态下产生的时间违规的
                    socket.emit("disposal",{status:status})
                    socket.broadcast.emit("disposal",{status:status})
                }))
            })()

        })

        socket.on("dealWithAnalysisResult",function(msg){
            if(msg.res == 1){
                var quotesConfirmTxt = msg.opt.quotesConfirmTxt
                steps(function(){
                    mongo.remove("LatestAnalysisMsg",{num:session.debateLogin.num,rNum:session.debateLogin.rNum,confirmed:1},{},this.hold(function(_res){

                    }))
                },function(){
                    mongo.update("LatestAnalysisMsg",{num:session.debateLogin.num,rNum:session.debateLogin.rNum,confirmed:0},{$set:{confirmed:1}},{},this.hold(function(_res){

                    }))
                },function(){
                    mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_result){
                        return _result[0].status
                    }))
                },function(status){
                    if(status !=1 && status !=3){
                        this.terminate()
                    }
                    var status = (status+1)%4
                    mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{status:status}},{},this.hold(function(result){
                        console.log(result)
                        return status
                    }))
                },function(status){
                    mongo.find("LatestAnalysisMsg",{num:session.debateLogin.num,rNum:session.debateLogin.rNum,confirmed:1},{},function(_result){
                        console.log(_result)
                        if(_result[0].msg){
                            var _obj = _result[0].msg
                            console.log(status)
                            _obj.status = status;
                            _obj.quotesConfirmTxt = quotesConfirmTxt
                            //_result[0].msg.status = status
                            socket.emit("confirmCompleted",_obj)
                            socket.broadcast.emit("confirmCompleted",_obj)
                        }
                    })
                })()
            }

            if(msg.res == 2){
                var quotesRefuseOptionsTxt = msg.opt.quotesRefuseOptionsTxt
                var quotesRefuseOptions = msg.opt.quotesRefuseOptions

                steps(
                    function(){
                        mongo.find("LatestStatementMsg",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},function(_res){
                            socket.emit("DoAnalysis",_res[0].msg)
                            socket.broadcast.emit("DoAnalysis",_res[0].msg)
                            socket.broadcast.emit("analysisRefused",{quotesRefuseOptionsTxt:quotesRefuseOptionsTxt,quotesRefuseOptions:quotesRefuseOptions})
                        })
                    })()
            }
        })

        socket.on("dealWithStatementResult",function(msg){
            var LatestAnalysisMsg

            steps(function(){
                mongo.find("LatestAnalysisMsg",{num:session.debateLogin.num,rNum:session.debateLogin.rNum,confirmed:1},{},this.hold(function(_res){
                    LatestAnalysisMsg = _res.length>0? _res[0].msg:1
                }))

            },function(){
                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$inc:{status:-1}},{},this.hold(function(_res){

                }))
            },function(){
                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){
                    var dealWithStatementResultTxt = msg.saitoukounegaiTxt
                    socket.broadcast.emit("statementRefused",{dealWithStatementResultTxt:dealWithStatementResultTxt,status:_res[0].status,LatestAnalysisMsg:LatestAnalysisMsg})
                    socket.emit("statementRefused",{dealWithStatementResultTxt:dealWithStatementResultTxt,status:_res[0].status,LatestAnalysisMsg:LatestAnalysisMsg})
                }))
            })()

        })


        socket.on("endDebate",function(msg){
             steps(function(){
                   mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){
                            if(parseInt(_res[0].themeTimes) == _res[0].numberOrder){
                                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{finishi:1}},this.hold(function(_res){

                                }))
                            }
                   }))
             },function(){
                 mongo.update("debateMembers",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{debateInvolve:false}},{},this.hold(function (_res) {
                        
                 }))
             })()
        })


        socket.on("systemSetting",function(msg){
            steps(function(){
                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{timeLimit:msg.timeLimite,themeTimes:msg.themeTimes,setting:1}},function(_res){
                    socket.emit("systemSettingFinish",{timeLimit:msg.timeLimite,themeTimes:msg.themeTimes})
                    socket.broadcast.emit("systemSettingFinish",{timeLimit:msg.timeLimite,themeTimes:msg.themeTimes})
                })
            })()
        })




    });


    sessionSockets.of("/group").on('connection', function (err, socket, session) {

        socket.on('join',function(jsonData){
            var position = jsonData.position
            var num = jsonData.num

            var rNum = Math.round(Math.random()*10000)
            if(position == 1){
                var newRoom = {pro:session.debateLogin.username,num:jsonData.num,rNum:rNum,finish:false,group:session.debateLogin.group}
            }else{
                var newRoom = {con:session.debateLogin.username,num:jsonData.num,rNum:rNum,finish:false,group:session.debateLogin.group}
            }

            steps(function(){
                mongo.insert("debateStatus",newRoom,{},this.hold(function(result){
                    
                }))
            },function(){
                mongo.find("debateStatus",{finish:false},{},this.hold(function(result){
                    //在session中写入num
                    session.debateLogin.num = num
                    session.debateLogin.rNum = rNum
                    session.debateLogin.position = position
                    session.save()
                    socket.broadcast.emit("reNewRoomList",result)
                    socket.broadcast.emit("joined",result)
                }))
            })()

        })

        /*
        socket.on('participate',function(jsonData){
            var position = jsonData.position
            var num = jsonData.num
            var rNum = jsonData.rNum
            var theme
            steps(function(){
                mongo.find("themes",{group:session.debateLogin.group,num:num},{},function(result){
                    if(result.length<=0) this.terminate();
                })

            },function(){
                mongo.find("debateStatus",{group:session.debateLogin.group,num:num,rNum:rNum},{},function(result){
                    if(position == 1 && result[0].pro) this.terminate()
                    if(position == 2 && result[0].con) this.terminate()
                })
            },function(){
                if(position == 1) var _update = {$set:{pro:session.debateLogin.username}}
                if(position == 2) var _update = {$set:{con:session.debateLogin.username}}

                mongo.update("debateStatus",{group:session.debateLogin.group,num:num,rNum:rNum},_update,function(result){
                    console.log("result is ....")
                    console.log(result)

                    //在session中写入num
                    session.debateLogin.num = num
                    session.debateLogin.rNum = rNum
                    session.debateLogin.position = position
                    session.save()
                    socket.emit("EnterIntoRoom",{})
                    //socket.broadcast.emit("participated",{})
                })
            })()

        })

        */

        
        socket.on("loadThemes",function(jsonData){

            mongo.find("themes",{group:session.debateLogin.group},{},function(result){
                socket.emit("loadThemes",{result:result})
                //socket.broadcast.emit("loadThemes",{result:result})
            })

        })

        socket.on("insertTheme",function(jsonData){



            if(session.debateLogin.type != 0){
                socket.emit("insertThemeErr",{err:1,msg:"権限がなし"})
            }

            steps(function(){
                var num = Math.round(Math.random()*10000)
                mongo.insert("themes",{theme:jsonData.themeTitle,desc:jsonData.themeDesc,num:num,group:session.debateLogin.group},{},this.hold(function(){
                    socket.emit("insertThemeSuccess",{err:0,msg:"新しいテーマを追加しました"})
                }))
            })()

        })

        socket.on("removeTheme",function(jsonData){
            var _id = jsonData._id
            mongo.remove("themes",{_id:new mongodb.ObjectID(_id)},{},function(result){
                mongo.find("themes",{group:session.debateLogin.group},{},function(result){
                    socket.emit("loadThemes",{result:result})
                    //socket.broadcast.emit("loadThemes",{result:result})
                })
            })

        })


        socket.on('disconnect', function(){
            console.log("room group is out of connection")
        })

    })

    return sessionSockets;

}

exports.sessionSockets = sessionSockets