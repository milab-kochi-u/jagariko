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


router.get("/group",checkCookie,addPathIntoSession);
router.get('/group',releaseController.groupController)

router.get('/chat',checkCookie,addPathIntoSession)
router.get('/chat',releaseController.chatController)


router.post('/loginPost',releaseController.loginPostController);
router.post('/getThemeList',checkCookie)
router.post('/getThemeList',releaseController.getThemeListController)
router.post('/getDebatingList',checkCookie)
router.post('/getDebatingList',releaseController.getDebatingListController)
router.post('/getDebateFinishList',checkCookie)
router.post('/getDebateFinishList',releaseController.getDebateFinishListController)


router.post('/createNewRoom',checkCookie)
router.post('/createNewRoom',releaseController.createNewRoomController)

router.post('/participateRoom',checkCookie)
router.post('/participateRoom',releaseController.participateRoomController)




//api
router.post("/getUserInformation",checkCookie)
router.post("/getUserInformation",releaseController.getUserInformationController)


router.post("/getDebateInformation",checkCookie)
router.post("/getDebateInformation",releaseController.getDebateInformationController)


router.post("/getDebateStatementMapInformation",checkCookie)
router.post("/getDebateStatementMapInformation",releaseController.getDebateStatementMapInformationController)

router.post("/getDebateAnalysisMapInformation",checkCookie)
router.post("/getDebateAnalysisMapInformation",releaseController.getDebateAnalysisMapInformationController)

module.exports = router;



