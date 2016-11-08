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
        next()
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
router.post('/getThemeList',checkCookie)
router.post('/getThemeList',releaseCNController.getThemeListController)
router.post('/getDebatingList',checkCookie)
router.post('/getDebatingList',releaseCNController.getDebatingListController)
router.post('/getDebateFinishList',checkCookie)
router.post('/getDebateFinishList',releaseCNController.getDebateFinishListController)


router.post('/createNewRoom',checkCookie)
router.post('/createNewRoom',releaseCNController.createNewRoomController)

router.post('/participateRoom',checkCookie)
router.post('/participateRoom',releaseCNController.participateRoomController)




//api
router.post("/getUserInformation",checkCookie)
router.post("/getUserInformation",releaseCNController.getUserInformationController)


router.post("/getDebateInformation",checkCookie)
router.post("/getDebateInformation",releaseCNController.getDebateInformationController)


router.post("/getDebateStatementMapInformation",checkCookie)
router.post("/getDebateStatementMapInformation",releaseCNController.getDebateStatementMapInformationController)

router.post("/getDebateAnalysisMapInformation",checkCookie)
router.post("/getDebateAnalysisMapInformation",releaseCNController.getDebateAnalysisMapInformationController)

module.exports = router;



