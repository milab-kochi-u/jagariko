/**
 * Created by xuzhongwei on 2016/11/02.
 */

var sessionSockets = function(sessionSockets,steps,mongo) {

    sessionSockets.of("/release").on("connection", function (err, socket, session) {

        console.log("connection of release")


        socket.on("prepare",function(msg){
            var _update
            steps(function(){
                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){
                    if(parseInt(session.debateLogin.position) == 1){
                        if(_res[0].proPrepare == 1){
                            _update = {proPrepare:0}
                        }else{
                            _update = {proPrepare:1}
                        }
                    }else{
                        if(_res[0].conPrepare == 1){
                            _update = {conPrepare:0}
                        }else{
                            _update = {conPrepare:1}
                        }
                    }
                }))
            },function(){
                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:_update},this.hold(function(){
                    socket.emit("prepared",_update)
                    socket.broadcast.emit("prepared",_update)
                }))
            },function(){
                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){
                    if(parseInt(_res[0].conPrepare) == 1 && parseInt(_res[0].proPrepare) == 1){
                        this.step(function(){
                            mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{status:"start",preStatus:"wait",order:0}},this.hold(function(){
                                socket.emit("prepareCompelete",{})
                                socket.broadcast.emit("prepareCompelete",{})
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

            socket.emit("enterRoom",{})
            socket.broadcast.emit("enterRoom",{})

        })

        socket.on("giveStatement",function(msg){

            var order
            steps(function(){
                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){

                    var _update = {}

                    order = _res[0].order

                    /*
                    if(parseInt(_res[0].status)=="last"){

                        if(_res[0].order < 2){


                            if(_res[0].status == "start" || _res[0].status == "lookup"){
                                _update = {$set:{status:"analysis",preStatus:_res[0].status},$inc:{order:1}}
                            }else{
                                _update = {$set:{status:"bunseki",preStatus:_res[0].status}}
                            }

                        }else{

                        }

                    }else{
                        if(_res[0].status == "start" || _res[0].status == "lookup"){
                            _update = {$set:{status:"analysis",preStatus:_res[0].status},$inc:{order:1}}
                        }else{
                            _update = {$set:{status:"bunseki",preStatus:_res[0].status}}
                        }
                    }
                    */


                    /*
                    if(_res[0].order < 1){
                        if(_res[0].status == "start" || _res[0].status == "lookup"){
                            _update = {$set:{status:"analysis",preStatus:_res[0].status},$inc:{order:1}}
                        }else if(_res[0].status == "appeal"){
                            _update = {$set:{status:"bunseki",preStatus:_res[0].status}}
                        }else{

                        }
                    }else{
                        _update = {$set:{status:"finish",preStatus:_res[0].status,finish:true}}
                        mongo.update("debateMembers",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{debateInvolve:false}},{multi: true},this.hold(function () {
                            session.debateLogin.debateInvolve = false
                            session.save()
                            return _update
                        }))
                    }

                    return _update
                    */

                    var totalNum = 1


                    if(_res[0].status == "start"){
                        _update = {$set:{status:"analysis",preStatus:_res[0].status}}
                    }else if(_res[0].status == "lookup"){

                        //检测是否结束

                        if(_res[0].order < totalNum-1){
                            //还没有结束
                            _update = {$set:{status:"analysis",preStatus:_res[0].status},$inc:{order:1}}
                        }else{
                            //这次阐述完后应该结束了
                            _update = {$set:{status:"analysis",preStatus:_res[0].status,preFinish:true}}
                            mongo.update("debateMembers",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{debateInvolve:false}},{multi: true},this.hold(function () {
                                session.debateLogin.debateInvolve = false
                                session.save()
                                return _update
                            }))
                        }

                    }else{
                        _update = {$set:{status:"bunseki",preStatus:_res[0].status}}
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
                    socket.broadcast.emit("receiveStatement",{sendObj:sendObj})
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
                        if(preFinish){
                            //如果时准结束阶段则在此次分析以后结束辩论
                            var update = {$set:{preStatus:status,status:"finish",finish:true}}
                        }else{
                            //如果不是准结束结论,则继续process
                            var update = {$set:{preStatus:status,status:"check"}}
                        }

                }else{
                        var update = {$set:{preStatus:status,status:"kentou"}}
                }


                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},update,this.hold(function(){

                }))

            },function(){
                sendObj = msg
                sendObj.position = session.debateLogin.position
                sendObj.order = order

                socket.emit("receiveAnalysis",{})
                socket.broadcast.emit("receiveAnalysis",{})
            },function(){
                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{everyAnalysisData:sendObj}},this.hold(function(){

                }))
            })()

        })



        socket.on("confirmAnalysisResult",function(msg){
            var pro
            var con
            var everyAnalysisData

            steps(function() {
                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){
                    pro = _res[0].pro
                    con = _res[0].con
                    everyAnalysisData = _res[0].everyAnalysisData
                    return  _res[0].status
                }))
            },function(status){
                if(status == "check"){
                    var update = {$set:{preStatus:status,status:"appeal"}}
                }else if(status == "kentou"){
                    var update = {$set:{preStatus:status,status:"lookup"}}
                }else{

                }

                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},update,this.hold(function(){

                }))
            },function(){
                socket.emit("confirmAnalysisResultFinish",{})
                socket.broadcast.emit("confirmAnalysisResultFinish",{})
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
            socket.broadcast.emit("selectDissentFinish",msg)

        })


        socket.on('disconnect', function(msg){
            if(!session){
                return;
            }

            if(!session.debateLogin){
                return;
            }
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