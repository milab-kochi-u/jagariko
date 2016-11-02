/**
 *
 *
 * Created by xuzhongwei on 2016/11/01.
 */


var express = require('express');
var router = express.Router();
var releaseController = require('../controller/release.js');


/* GET users listing. */


router.get('/',releaseController.indexController);
router.get('/login',releaseController.loginController);
router.post('/loginPost',releaseController.loginPostController);
router.get('/group',releaseController.groupController)
router.post('/getThemeList',releaseController.getThemeListController)
router.post('/getDebatingList',releaseController.getDebatingListController)
router.post('/getDebateFinishList',releaseController.getDebateFinishListController)
module.exports = router;


