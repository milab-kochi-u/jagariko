/**
 *
 *
 * Created by xuzhongwei on 2016/11/01.
 */


var express = require('express');
var router = express.Router();
var releaseCNController = require('../controller/release.js');



/* GET users listing. */


var checkCookie = function(req,res,next){
    console.log("check cookie .....")
    console.log(req.cookies)
    console.log("check session .....")
    console.log(req.session)

    if(req.cookies.cookieId != req.session.cookieId){
        console.log(req.cookies.cookieId)
        console.log(req.session.cookieId)
        console.log(req.path)
        res.redirect("/releaseCN/login")
        return;
    }else{
        next()
    }

}


var checkSession = function(req,res,next){
    if(!req.session.debateLogin){
        return;
    }else{
        next()
    }
}


var addPathIntoSession = function(req,res,next){
        req.session.path = req.path
        next()
}

router.get("*",function(req,res,next){
    req.session.LAN = "CN"
    console.log("session is ...")
    console.log(req.session)
    next()
})



router.get('/',checkCookie,addPathIntoSession)
router.get('/',releaseCNController.indexController);



router.get('/login',releaseCNController.loginController,addPathIntoSession);


router.get("/group",checkCookie,addPathIntoSession);
router.get('/group',releaseCNController.groupController)

router.get('/chat',checkCookie,addPathIntoSession)
router.get('/chat',releaseCNController.chatController)


router.post('/loginPost',releaseCNController.loginPostController);
router.post('/getThemeList',checkSession)
router.post('/getThemeList',releaseCNController.getThemeListController)
router.post('/getDebatingList',checkSession)
router.post('/getDebatingList',releaseCNController.getDebatingListController)
router.post('/getDebateFinishList',checkSession)
router.post('/getDebateFinishList',releaseCNController.getDebateFinishListController)


router.post('/createNewRoom',checkSession)
router.post('/createNewRoom',releaseCNController.createNewRoomController)

router.post('/participateRoom',checkSession)
router.post('/participateRoom',releaseCNController.participateRoomController)




//api
router.post("/getUserInformation",checkSession)
router.post("/getUserInformation",releaseCNController.getUserInformationController)


router.post("/getDebateInformation",checkSession)
router.post("/getDebateInformation",releaseCNController.getDebateInformationController)


router.post("/getDebateStatementMapInformation",checkSession)
router.post("/getDebateStatementMapInformation",releaseCNController.getDebateStatementMapInformationController)

router.post("/getDebateAnalysisMapInformation",checkSession)
router.post("/getDebateAnalysisMapInformation",releaseCNController.getDebateAnalysisMapInformationController)

module.exports = router;



