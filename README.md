#essential package

    node version v0.10~
    mongodb version 3.0~

#optional package
    ImageMagick 6.9~


#essential file


    1.create folder
    /config
    2.create new file /config/config.js

    module.exports = {
        dbName:"blog",  //Name of the database
        dbPort:27017,   //Port of the database
        dbHost:"localhost"  //server host
    }


    3.create new file /config/www.js

    module.exports = {
        wwwPort:8000  //server port
    }


    4.start app
        cd /project
        node ./bin/www
        
    5.access
        http://127.0.0.1:port/_debate
    6.username:miyoshi
      password:miyoshi
      username:syoui
      password:syoui


  status
    //分析機能があり

  start //both of the user prepare pro is writing construct
  analysis // pro has given construct and con is analyzing or request for another construct
  check  //pro check the result of the analysis from con is right or not
  appeal //con's result of analysis gets the approval and con start to appeal
    state // con select dissent from the result of analysis and give statement
  bunseki  //con do the statement and it is the turn for pro to do the analysis
  kentou //pro give the result of analysis and it is the turn for con to check it is right or not
  lookup    // pro's result of analysis gets the approval and pro start to pick dissent
    noberu   // pro select dissent from the result of analysis and give statement
  ....analysis



    //分析機能がなし

  noAnalysisStart // pro start to give his/her statement

  noAnalysisFuncAppealAndState //con give the rebuttal and his/her statement


变量说明

辩论页面
chat.html

analysisData //需要分析的数据,立論だけ
analysisDissentExplainData //需要分析的数据,指的是异议的说明文,非立論
inputStatus //分析师表单输入时的状态,比如现在正在输入claim,现在正在询问是否有evidence,现在正在填写evidence等等
// i claim的号码 j evidence warrant的号码

analysisObject //现在正在对那个文字段做分析,比如现在正在对立論做分析或者说现在正在对异议的解释文字段做分析
{target:"construct",i:0} {target:"dissentExplain",i:0}
inputFormAreachangeInputTabVal  //分析时候填写表单和分析时候请求再次陈述的表单的切换


statementStatus //记录目前做陈述是立論还是对异议做分析
当对异议做分析的时候  {name:"dissent",i:0}  i表示对第几个异议说明做分析


analysisDissentExplainData //这个变量很重要,存放有当前的分析结果信息,里面主要有两大部分,第一部分是对立論的分析,另一部分是对异议说明的分析
$scope.analysisDissentExplainData[i].analysisResult

statementData //陈述意见时立論的主管变量
dissentExplain  //异议说明时陈述时的主管明亮




db.serverCmdLineOpts().parsed.storage.dbPath
mongodump --host mongodb1.example.net --port 37017 --username user --password pass --out /opt/backup/mongodump-2011-10-2488
















https://startbootstrap.com/template-overviews/simple-sidebar/

