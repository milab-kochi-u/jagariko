/**
 * Created by xuzhongwei on 2016/11/02.
 */



var connectionList = {}; //存储当前连接信息
var tool = require("../controller/tool.js");


var sessionSockets = function(sessionSockets,steps,mongo,io) {
    // 房间用户名单
    var roomInfo = {};


    sessionSockets.of("/release").on("connection", function (err, socket, session) {

        console.log("connection of release")
        console.log(socket.id)

        var roomID = socket.id

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


            socket.emit('refreshOnline', {onlineInfo:roomInfo[roomId]});
            socket.to(session.debateLogin.rNum).broadcast.emit('refreshOnline', {onlineInfo:roomInfo[roomId]});
        })



        socket.on("giveStatement",function(msg){

            //var totalNum = 1
            var totalNum
            if(session.debateLogin.analysisFunc == 0){
                var order
                steps(function(){
                    mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){
                            var _update = {}
                            order = _res[0].order
                            totalNum = _res[0].totalNum

                            if(_res[0].status == "noAnalysisStart"){


                                _update = {$set:{status:"noAnalysisFuncAppealAndState",preStatus:_res[0].status,time:Date.parse(new Date())}}

                            }else if(_res[0].status == "noAnalysisFuncAppealAndState"){
                                if(_res[0].order == (totalNum - 1)){
                                    //反方反驳完,陈述完,预结束阶段
                                    _update = {$set:{status:"noAnalysisStart",preFinish:1,preStatus:_res[0].status,time:Date.parse(new Date())},$inc:{order:1}}
                                }else if(_res[0].order < (totalNum - 1)){
                                    _update = {$set:{status:"noAnalysisStart",preStatus:_res[0].status,time:Date.parse(new Date())},$inc:{order:1}}
                                }else{
                                    //_res[0].order > (totalNum - 1)
                                    _update = {$set:{status:"noAnalysisfinish",preStatus:_res[0].status,time:Date.parse(new Date())},$inc:{order:1}}
                                }




                            }else{
                                this.terminate()
                            }

                        return _update
                    }))
                },function(_update){
                    mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},_update,{},this.hold(function(_res){

                    }))
                },function(){
                    var sendObj = {}
                    sendObj.position = session.debateLogin.position
                    sendObj.statementData = msg.statementData

                    //分别给立論和異議説明的陈述语言加random,以便之后做map时候的骨肉相连

                    sendObj.statementDataRandom  = Math.round(Math.random()*100000)

                    sendObj.order = order
                    sendObj.dissentExplain = msg.rebuttalData

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

                return;
            }




            if(session.debateLogin.analysisFunc == 1){
            var order
            var totalNum
            steps(function(){
                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){

                    var _update = {}
                    order = _res[0].order
                    totalNum = _res[0].totalNum

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


            }
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


        //随时把分析的现阶段结果存入数据库的everyAnalysisData字段,以便让自己和对方在地图里面随时可以看到目前的地图



        socket.on("updateGiveAnalysis",function(msg){
            var sendObj
            steps(function(){
                sendObj = msg
                sendObj.position = session.debateLogin.position

                console.log(msg)
                socket.emit("receiveUpdateAnalysis",{everyAnalysisData:sendObj})
                socket.to(session.debateLogin.rNum).broadcast.emit("receiveUpdateAnalysis",{everyAnalysisData:sendObj})
            },function(){
                //console.log({num:session.debateLogin.num,rNum:session.debateLogin.rNum})
                //console.log({everyAnalysisData:sendObj})
                //console.log(sendObj.analysisData.analysisResult)

                //mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{$set:{everyAnalysisData:sendObj}},this.hold(function(res){
                //}))
            })()

        })

        socket.on("refuseAnalysisResult",function(msg){
            steps(function(){
                mongo.find("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},{},this.hold(function(_res){
                    return  _res[0].status
                }))
            },function(status){
                if(status == "check"){
                    //从check回到上一步analysis的状态
                    var update = {$set:{preStatus:status,status:"analysis",time:Date.parse(new Date())}}
                }else if(status == "kentou"){
                    //从kentou回到上一步bunseki的状态
                    var update = {$set:{preStatus:status,status:"bunseki",time:Date.parse(new Date())}}
                }else{

                }


                mongo.update("debateStatus",{num:session.debateLogin.num,rNum:session.debateLogin.rNum},update,this.hold(function(){
                    socket.emit("refuseAnalysisResultFinish",{})
                    socket.to(session.debateLogin.rNum).broadcast.emit("refuseAnalysisResultFinish",{})
                }))

            })()
        })

        socket.on("rate",function(msg){
            var num = session.debateLogin.num
            var rNum = session.debateLogin.rNum
            var position = session.debateLogin.position
            var rate = msg.rate
            var _update
            var debateResult
            var pro,con,group
            var proUpdate = {}
            var conUpdate = {}
            steps(function(){
                mongo.find("debateStatus",{num:num,rNum:rNum},{},this.hold(function(result){
                    if(result.length == 0) return;

                    pro = result[0].pro
                    con = result[0].con
                    group = result[0].group

                    if(result[0].status == "finish" || result[0].status == "noAnalysisfinish"){
                        if(position == 1){

                            debateResult = determine(rate,result[0].conRate)

                            if(!result[0].proRate){
                                //如果你是正方,且还没有对自己做评价,那么接下来对自己做评价
                                if(debateResult != "wait" && debateResult != "unknow"){
                                    _update = {$set:{proRate:rate,debateResult:debateResult,finish:true}}
                                }else{
                                    _update = {$set:{proRate:rate,debateResult:debateResult}}
                                }

                            }
                        }else if(position == 2){

                            debateResult = determine(result[0].proRate,rate)
                            if(!result[0].conRate){
                                //如果你是反方,且还没有对自己做评价,那么接下来对自己做评价

                                if(debateResult != "wait" && debateResult != "unknow"){
                                    _update = {$set:{conRate:rate,debateResult:debateResult,finish:true}}
                                }else{
                                    _update = {$set:{conRate:rate,debateResult:debateResult}}
                                }

                            }
                        }else{
                            this.terminate()
                        }
                    }
                }))
            },function(){
                mongo.update("debateStatus",{num:num,rNum:rNum},_update,{},this.hold(function(_result){

                }))
            },function(){

                if(debateResult != "wait" && debateResult != "unknow"){
                    if(debateResult == "proWin"){
                        proUpdate = {$inc:{winNum:1}}
                        conUpdate = {$inc:{lostNum:1}}
                    }

                    if(debateResult == "conWin"){
                        proUpdate = {$inc:{lostNum:1}}
                        conUpdate = {$inc:{winNum:1}}
                    }

                    if(debateResult == "draw"){
                        proUpdate = {$inc:{drawNum:1}}
                        conUpdate = {$inc:{drawNum:1}}
                    }

                    if(debateResult == "unable"){
                        proUpdate = {$inc:{unDeterminNum:1}}
                        conUpdate = {$inc:{unDeterminNum:1}}
                    }

                }

            },function(){
                //update pro

                console.log(proUpdate)
                console.log(conUpdate)

                if(!tool.isEmpty(proUpdate)){

                    mongo.update("debateMembers",{username:pro,group:group},proUpdate,{},this.hold(function(){

                    }))
                }



            },function(){
                //update con

                if(!tool.isEmpty(conUpdate)){
                    mongo.update("debateMembers",{username:con,group:group},conUpdate,{},this.hold(function(){

                    }))
                }

            },function(){
                mongo.find("debateStatus",{num:num,rNum:rNum},{},this.hold(function(result){
                    socket.emit("rated",{err:0,data:{proRate:result[0].proRate,conRate:result[0].conRate}})
                    socket.to(session.debateLogin.rNum).broadcast.emit("rated",{err:0,data:{proRate:result[0].proRate,conRate:result[0].conRate}})
                }))
            })()



            function determine(proRes,conRes){
                if(!proRes || !conRes){
                    return "wait"
                }

                if(proRes == 1 && conRes == 3){
                    return "proWin"
                }

                if(proRes == 3 && conRes == 1){
                    return "conWin"
                }

                if(proRes == 2 && conRes == 2){
                    return "draw"
                }

                if(proRes == 1 && (conRes == 1 || conRes == 2)){
                    return "unable"
                }

                if(proRes == 3 && (conRes == 2 || conRes == 3)){
                    return "unable"
                }

                if(proRes == 2 && (conRes == 1 || conRes == 3)){
                    return "unable"
                }

                return "unknow"

            }

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

        socket.on("textStartInputing",function(msg){
            socket.to(session.debateLogin.rNum).broadcast.emit("textStartInputing",msg)
        })

        socket.on("textLeaveInputing",function(msg){
            socket.to(session.debateLogin.rNum).broadcast.emit("textLeaveInputing",msg)
        })

        socket.on("sendCyousi",function(msg){
            var position = session.debateLogin.position
            msg.position = position

            socket.emit("sendCyousi",msg)
            socket.to(session.debateLogin.rNum).broadcast.emit("sendCyousi",msg)
        })

        socket.on("FormInputing",function(msg){
            socket.to(session.debateLogin.rNum).broadcast.emit("FormInputing",msg)
        })

        socket.on("FormStartInputing",function(msg){
            socket.to(session.debateLogin.rNum).broadcast.emit("FormStartInputing",msg)
        })

        socket.on("FormLeaveInputing",function(msg){
            socket.to(session.debateLogin.rNum).broadcast.emit("FormLeaveInputing",msg)
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

            socket.emit("refreshOnline",{onlineInfo:roomInfo[roomId]})
            socket.to(session.debateLogin.rNum).broadcast.emit("refreshOnline",{onlineInfo:roomInfo[roomId]})


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