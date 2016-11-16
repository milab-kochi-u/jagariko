/**
 *
 *
 * Created by xuzhongwei on 2016/11/01.
 */


var express = require('express');
var router = express.Router();
var releaseController = require('../controller/release.js');



/* GET users listing. */


var checkCookie = function(req,res,next){
    console.log("check cookie .....")
    console.log(req.cookies)
    console.log("check session .....")
    console.log(req.session)

    if(!req.cookies.cookieId){
        res.redirect("/release/login")
        return;
    }

    if(!req.session){
        res.redirect("/release/login")
        return;
    }

    if(!req.session.cookieId){
        res.redirect("/release/login")
        return;
    }

    if(req.cookies.cookieId != req.session.cookieId){
        console.log(req.cookies.cookieId)
        console.log(req.session.cookieId)
        console.log(req.path)
        res.redirect("/release/login")
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
    req.session.LAN = "JP"
    console.log("session is ...")
    console.log(req.session)
    next()
})



router.get('/',checkCookie,addPathIntoSession)
router.get('/',releaseController.indexController);



router.get('/login',releaseController.loginController,addPathIntoSession);
router.get('/logout',releaseController.logoutController)

router.get("/group",checkCookie,addPathIntoSession);
router.get('/group',releaseController.groupController)

router.get('/chat',checkCookie,addPathIntoSession)
router.get('/chat',releaseController.chatController)







router.post('/loginPost',releaseController.loginPostController);



router.post('/getThemeList',checkSession)
router.post('/getThemeList',releaseController.getThemeListController)
router.post('/getDebatingList',checkSession)
router.post('/getDebatingList',releaseController.getDebatingListController)
router.post('/getDebateFinishList',checkSession)
router.post('/getDebateFinishList',releaseController.getDebateFinishListController)


router.post('/createNewRoom',checkSession)
router.post('/createNewRoom',releaseController.createNewRoomController)

router.post('/participateRoom',checkSession)
router.post('/participateRoom',releaseController.participateRoomController)


router.post('/leaveRoom',checkSession)
router.post('/leaveRoom',releaseController.leaveRoomController)


//api
router.post("/getUserInformation",checkSession)
router.post("/getUserInformation",releaseController.getUserInformationController)


router.post("/getDebateInformation",checkSession)
router.post("/getDebateInformation",releaseController.getDebateInformationController)


router.post("/getDebateStatementMapInformation",checkSession)
router.post("/getDebateStatementMapInformation",releaseController.getDebateStatementMapInformationController)

router.post("/getDebateAnalysisMapInformation",checkSession)
router.post("/getDebateAnalysisMapInformation",releaseController.getDebateAnalysisMapInformationController)

router.post("/getListInformation",checkSession)
router.post("/getListInformation",releaseController.getListInformationController)

router.post("/getCurrentSelfDebateInfo",checkSession)
router.post("/getCurrentSelfDebateInfo",releaseController.getCurrentSelfDebateInfoController)


router.post("/backToRoom",checkSession)
router.post("/backToRoom",releaseController.backToRoomController)






module.exports = router;



