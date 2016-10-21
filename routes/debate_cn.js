/**
 * Created by xuzhongwei on 2016/07/12.
 */


var express = require('express');
var router = express.Router();
var debateCNController = require('../controller/_debate.js');


/* GET users listing. */


router.get('/',debateCNController.indexController);
router.get('/login',debateCNController.loginController);
router.post('/loginPost',debateCNController.loginPostController);

router.get('/group',debateCNController.groupController)
router.post('/getThemeList',debateCNController.getThemeListController)
router.post('/getDebatingList',debateCNController.getDebatingListController)
router.post('/getDebateFinishList',debateCNController.getDebateFinishListController)

router.post('/createNewRoom',debateCNController.createNewRoomController)
router.post('/participateRoom',debateCNController.participateRoomController)
router.post('/reviewRoom',debateCNController.reviewRoomController)
router.get("/chat",debateCNController.chatController)
router.get("/review",debateCNController.reviewController)
router.post('/getDebateInformation',debateCNController.getDebateInformationController)
router.post('/fetchAnalysisLog',debateCNController.fetchAnalysisLogController)
router.post('/fetchStatementLog',debateCNController.fetchStatementLogController)


module.exports = router;