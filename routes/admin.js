/**
 * Created by xuzhongwei on 2016/11/16.
 */
var express = require('express');
var router = express.Router();
var adminController = require('../controller/admin.js');
var checkAdminSession = function(req,res,next){
    if(!req.session.adminLogin){
        res.redirect("/admin/login")
        return;
    }else{
        next()
    }
}


//get
router.get('/',adminController.adminController,checkAdminSession)
router.get('/index',adminController.adminController)
router.get('/login',adminController.adminLoginController)




//post
router.post('/loginAdminPost',adminController.loginAdminPostController);




//api
router.post("/getGroupList",adminController.getGroupListController,checkAdminSession)
router.post("/getMembersList",adminController.getMembersListController,checkAdminSession)
router.post("/getThemesList",adminController.getThemesListController,checkAdminSession)
router.post("/deleteGroup",adminController.deleteGroupController,checkAdminSession)
router.post('/increaseGroup',adminController.increaseGroupController,checkAdminSession);
router.post('/increaseMembers',adminController.increaseMembersController,checkAdminSession);
router.post("/deleteMembers",adminController.deleteMembersController,checkAdminSession)
router.post("/getThemesList",adminController.getThemesListController,checkAdminSession)
router.post('/increaseThemes',adminController.increaseThemesController,checkAdminSession);
router.post("/deleteThemes",adminController.deleteThemesController,checkAdminSession)
router.post("/getThemes",adminController.getThemesController,checkAdminSession)
router.post("/getMembers",adminController.getMembersController,checkAdminSession)
router.post("/updateThemes",adminController.updateThemesController,checkAdminSession)
router.post("/updateMembers",adminController.updateMembersController,checkAdminSession)

router.post("/send",adminController.sendController,checkAdminSession)

router.post("/getGroupMembersList",adminController.getGroupMemberListController,checkAdminSession)
router.post("/draftInsert",adminController.draftInsertController,checkAdminSession)
router.post("/getDraft",adminController.getDraftController,checkAdminSession)
router.post("/draftRemove",adminController.draftRemoveController,checkAdminSession)
router.post("/getOneDraft",adminController.getOneDraftController,checkAdminSession)

module.exports = router;