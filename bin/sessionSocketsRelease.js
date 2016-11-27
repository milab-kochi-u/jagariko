/**
 * Created by xuzhongwei on 2016/11/02.
 */



var connectionList = {}; //存储当前连接信息



var sessionSockets = function(sessionSockets,steps,mongo,io) {
    // 房间用户名单
    var roomInfo = {};


    sessionSockets.of("/release").on("connection", function (err, socket, session) {

        console.log("connection of release")
        console.log(socket.id)




        var roomID = socket.id


        socket.on("prepare",function(msg){

            var _update
            steps(function(){
                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){
                    if(parseInt(session.debateLogin.position) == 1){
                        if(_res[0].proPrepare == 1){
                            _update = {proPrepare:0,time:Date.parse(new Date())}
                        }else{
                            _update = {proPrepare:1,time:Date.parse(new Date())}
                        }
                    }else{
                        if(_res[0].conPrepare == 1){
                            _update = {conPrepare:0,time:Date.parse(new Date())}
                        }else{
                            _update = {conPrepare:1,time:Date.parse(new Date())}
                        }
                    }
                }))
            },function(){
                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:_update},this.hold(function(){
                    socket.emit("prepared",_update)
                    socket.to(session.debateLogin.rNum).broadcast.emit("prepared",_update)
                }))
            },function(){
                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){
                    if(parseInt(_res[0].conPrepare) == 1 && parseInt(_res[0].proPrepare) == 1){
                        this.step(function(){
                            mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{status:"start",preStatus:"wait",order:0,time:Date.parse(new Date())}},this.hold(function(){
                                socket.emit("prepareCompelete",{})
                                socket.to(session.debateLogin.rNum).broadcast.emit("prepareCompelete",{})
                            }))
                        })
                    }
                }))
            })()
        })



        socket.on("enterRoom",function(msg){
            if(!session.debateLogin){
                return;
            }
            var loginInfo = session.debateLogin
            delete loginInfo['password']


            var user = msg.username;


            // 将用户昵称加入房间名单中

            var roomId = "debate" + session.debateLogin.rNum

            console.log(roomInfo)

            if (!roomInfo[roomId]) {
                roomInfo[roomId] = [];
            }
            roomInfo[roomId].push({username:session.debateLogin.username});

            console.log(roomInfo)


            socket.join(session.debateLogin.rNum)

            socket.emit("enterRoom",{})
            socket.to(session.debateLogin.rNum).broadcast.emit("enterRoom",{})


            socket.emit('sys', user + '加入了房间', roomInfo[roomID]);
            socket.to(session.debateLogin.rNum).broadcast.emit('sys', user + '加入了房间', roomInfo[roomID]);
            console.log(user + '加入了' + roomID);

        })

        socket.on("giveStatement",function(msg){
            var order
            steps(function(){
                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){

                    var _update = {}

                    order = _res[0].order

                    var totalNum = 1


                    if(_res[0].status == "start"){
                        _update = {$set:{status:"analysis",preStatus:_res[0].status,time:Date.parse(new Date())}}
                    }else if(_res[0].status == "lookup"){

                        //检测是否结束

                        if(_res[0].order < totalNum-1){
                            //还没有结束
                            _update = {$set:{status:"analysis",preStatus:_res[0].status,time:Date.parse(new Date())},$inc:{order:1}}
                        }else{




                            if(!msg.statementData && msg.dissentData.length == 0){
                                //说明在准结束的lookup阶段,什么異議都没有选择,直接点了下一步,那么下一步也没有立論了所以直接结束了
                                _update = {$set:{status:"finish",preStatus:_res[0].status,preFinish:true,finish:true,time:Date.parse(new Date())}}
                            }else{
                                //说明在准结束的lookup阶段,选择了異議,点击下一步以后需要对異議的部分做解释说明
                                //这次阐述完后应该结束了
                                _update = {$set:{status:"analysis",preStatus:_res[0].status,preFinish:true,time:Date.parse(new Date())}}
                            }


                            mongo.update("debateMembers",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{debateInvolve:false}},{multi: true},this.hold(function () {
                                session.debateLogin.debateInvolve = false
                                session.save()
                                return _update
                            }))
                        }

                    }else{
                        _update = {$set:{status:"bunseki",preStatus:_res[0].status,time:Date.parse(new Date())}}
                    }

                    return _update

                }))
            },function(_update){
                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},_update,{},this.hold(function(_res){

                }))
            },function(){
                /*
                 $scope.dissentData = [{type:"claim",txt:"Tシャツの相場は、500円から高くても4000円。対して、100,000円のTシャツなんて誰も買うわけがない。同じお金があれば、コート、カバン、時計、アクセサリーを買うに違いない。",reply:"",i:0,j:0},
                 {type:"claim",txt:"Tシャツの相場は、500円から高くても4000円。対して、100,000円のTシャツなんて誰も買うわけがない。同じお金があれば、コート、カバン、時計、アクセサリーを買うに違いない。",reply:"",i:0,j:2},
                 {type:"claim",txt:"Tシャツの相場は、500円から高くても4000円。対して、100,000円のTシャツなんて誰も買うわけがない。同じお金があれば、コート、カバン、時計、アクセサリーを買うに違いない。",reply:"",i:0,j:2},
                 ]
                 */

                var sendObj = {}
                sendObj.position = session.debateLogin.position



                sendObj.statementData = msg.statementData

                //分别给立論和異議説明的陈述语言加random,以便之后做map时候的骨肉相连

                sendObj.statementDataRandom  = Math.round(Math.random()*100000)

                for(var s=0;s<msg.dissentData.length;s++){
                    msg.dissentData[s].random = Math.round(Math.random()*100000)
                }

                sendObj.dissentExplain = msg.dissentData

                sendObj.order = order


                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{everyStatement:sendObj}},{},this.hold(function(_res){
                    socket.emit("receiveStatement",{sendObj:sendObj})
                    socket.to(session.debateLogin.rNum).broadcast.emit("receiveStatement",{sendObj:sendObj})
                    return sendObj
                }))
            },function(sendObj){
                mongo.insert("statementLog",{num:session.debateLogin.num,rNum:session.debateLogin.rNum,everyStatement:sendObj,position:session.debateLogin.position,time:
                    (new Date()).getTime(),type:"first"},{},this.hold(function(_res){
                }))
            })()
        })


        socket.on("giveAnalysis",function(msg){


            var sendObj
            var order
            var preFinish
            steps(function() {
                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){
                    order = _res[0].order
                    preFinish = _res[0].preFinish
                    return  _res[0].status
                }))
            },function(status){

                if(status == "analysis"){
                        //if(preFinish){
                            //如果时准结束阶段则在此次分析以后结束辩论
                        //    var update = {$set:{preStatus:status,status:"finish",finish:true,time:Date.parse(new Date())}}
                        //}else{
                            //如果不是准结束结论,则继续process
                            var update = {$set:{preStatus:status,status:"check",time:Date.parse(new Date())}}
                        //}

                }else{
                        var update = {$set:{preStatus:status,status:"kentou",time:Date.parse(new Date())}}
                }


                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},update,this.hold(function(){

                }))

            },function(){
                sendObj = msg
                sendObj.position = session.debateLogin.position
                sendObj.order = order

                socket.emit("receiveAnalysis",{})
                socket.to(session.debateLogin.rNum).broadcast.emit("receiveAnalysis",{})
            },function(){
                console.log({num:session.debateLogin.num,rNum:session.debateLogin.rNum})
                console.log({everyAnalysisData:sendObj})
                console.log(sendObj.analysisData.analysisResult)
                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{everyAnalysisData:sendObj}},this.hold(function(res){


                }))
            })()

        })



        socket.on("confirmAnalysisResult",function(msg){
            var pro
            var con
            var everyAnalysisData
            var preFinish

            steps(function() {
                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){
                    pro = _res[0].pro
                    con = _res[0].con
                    everyAnalysisData = _res[0].everyAnalysisData
                    preFinish = _res[0].preFinish
                    return  _res[0].status
                }))
            },function(status){
                if(status == "check"){

                    if(preFinish){
                        var update = {$set:{preStatus:status,status:"finish",finish:true,time:Date.parse(new Date())}}
                    }else{
                        var update = {$set:{preStatus:status,status:"appeal",time:Date.parse(new Date())}}
                    }

                }else if(status == "kentou"){
                    var update = {$set:{preStatus:status,status:"lookup",time:Date.parse(new Date())}}
                }else{

                }

                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},update,this.hold(function(){

                }))
            },function(){
                socket.emit("confirmAnalysisResultFinish",{})
                socket.to(session.debateLogin.rNum).broadcast.emit("confirmAnalysisResultFinish",{})
            },function(){
                everyAnalysisData.rNum = session.debateLogin.rNum
                everyAnalysisData.num = session.debateLogin.num
                everyAnalysisData.pro = pro
                everyAnalysisData.con = con
                mongo.insert("analysisLog",everyAnalysisData,{},this.hold(function(_res){

                }))
            })()
        })


        socket.on("selectDissent",function(msg){
            socket.emit("selectDissentFinish",msg)
            socket.to(session.debateLogin.rNum).broadcast.emit("selectDissentFinish",msg)

        })



        //对方正在输入

        socket.on("textInputing",function(msg){
            socket.to(session.debateLogin.rNum).broadcast.emit("textInputing",msg)
        })


        socket.on('disconnect', function(msg){

            if(!session){
                return;
            }

            if(!session.debateLogin){
                return;
            }

            var roomId = "debate" + session.debateLogin.rNum

            for(var i=0;i<roomInfo[roomId].length;i++){
                if(roomInfo[roomId][i].username == session.debateLogin.username){
                    delete roomInfo[roomId].splice(i,1)
                }
            }


            console.log(roomInfo)

            console.log("room debate has been out of connection")
            console.log(msg)
            if(!session){
                return
            }

            var username = session.debateLogin.username
            var group = session.debateLogin.group
            var num = session.debateLogin.num
            var rNum = session.debateLogin.rNum
            var position = session.debateLogin.position

            return;
            //userStatus status
            //   -1 logout
            //    0 login
            //    1 entering
            //    2 debating

        });

    })




}

exports.sessionSockets = sessionSockets