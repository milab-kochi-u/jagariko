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

  wait //before start the debate
  start //both of the user prepare pro is writing construct
  analysis // pro has given construct and con is analyzing or request for another construct
  check  //pro check the result of the analysis from con is right or not




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