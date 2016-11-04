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
                            mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{status:"start",preStatus:"wait",order:1}},this.hold(function(){
                                socket.emit("prepareCompelete",{})
                                socket.broadcast.emit("prepareCompelete",{})
                            }))
                        })
                    }
                }))
            })()
        })



        socket.on("enterRoom",function(msg){

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
                    if(parseInt(_res[0].status)=="last"){

                        if(_res[0].order < _res[0].config.timeNumbers){
                            _update = {$set:{status:"analysis",preStatus:_res[0].status},$inc:{order:1}}
                        }else{
                            _update = {$set:{status:"finish",preStatus:_res[0].status,finish:true}}
                            mongo.update("debateMembers",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{debateInvolve:false}},{multi: true},this.hold(function () {
                                return _update
                            }))
                        }

                    }else{
                        _update = {$set:{status:"analysis",preStatus:_res[0].status}}
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
                sendObj.dissentExplain = msg.dissentData
                sendObj.statementData = msg.statementData
                sendObj.order = order

                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{everyStatement:sendObj}},{},this.hold(function(_res){
                    socket.emit("receiveStatement",{sendObj:sendObj})
                    socket.broadcast.emit("receiveStatement",{sendObj:sendObj})
                }))
            },function(){
                mongo.insert("statementLog",{num:session.debateLogin.num,rNum:session.debateLogin.rNum,dissentExplain:msg.dissentExplain,statementData:msg.statementData,position:session.debateLogin.position,time:
                    (new Date()).getTime(),type:"first"},{},this.hold(function(_res){
                }))
            })()
        })


        socket.on("giveAnalysis",function(msg){


            var sendObj
            var order

            steps(function() {
                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){
                    order = _res[0].order
                    return  _res[0].status
                }))
            },function(status){
                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{preStatus:status,status:"check"}},this.hold(function(){

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





    })




}

exports.sessionSockets = sessionSockets