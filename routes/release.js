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
        res.redirect("/release/login")
    }else{
        next()
    }


}


router.get('/',releaseController.indexController);
router.get('/',checkCookie)

router.get('/login',releaseController.loginController);
router.post('/loginPost',releaseController.loginPostController);
router.get("/group",checkCookie);
router.get('/group',releaseController.groupController)

router.get('/chat',checkCookie)
router.get('/chat',releaseController.chatController)


router.post('/getThemeList',releaseController.getThemeListController)
router.post('/getThemeList',checkCookie)
router.post('/getDebatingList',releaseController.getDebatingListController)
router.post('/getDebatingList',checkCookie)
router.post('/getDebateFinishList',releaseController.getDebateFinishListController)
router.post('/getDebateFinishList',checkCookie)

router.post('/createNewRoom',checkCookie)
router.post('/createNewRoom',releaseController.createNewRoomController)

router.post('/participateRoom',checkCookie)
router.post('/participateRoom',releaseController.participateRoomController)








//api
router.post("/getUserInformation",checkCookie)
router.post("/getUserInformation",releaseController.getUserInformationController)


router.post("/getDebateInformation",checkCookie)
router.post("/getDebateInformation",releaseController.getDebateInformationController)






module.exports = router;



