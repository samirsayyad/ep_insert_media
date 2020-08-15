$(document).ready(function () {

  var helper= require("./helper")
  $("#insertEmbedMedia").click(function () {
    // Can not use this yet, fix in main etherpad
    // padeditbar.toogleDropDown("embedMediaModal");
    var module = $("#embedMediaModal");
    console.log(module)
    if (!module.hasClass('insertEmbedMedia-show')) {
      module.addClass("insertEmbedMedia-show");
    } else {
      module.removeClass("insertEmbedMedia-show");
    }
  });

  $("#doEmbedMedia").click(function () {
    var padeditor = require('ep_etherpad-lite/static/js/pad_editor').padeditor;

    //$("#embedMediaModal").slideUp("fast");
    $("#embedMediaModal").removeClass("insertEmbedMedia-show");
    if($("#embedMediaSrc")[0].value !=""){
      return padeditor.ace.callWithAce(function (ace) {
        var rep = ace.ace_getRep();
        ace.ace_replaceRange(rep.selStart, rep.selEnd, "E");
        ace.ace_performSelectionChange([rep.selStart[0],rep.selStart[1]-1], rep.selStart, false);
        ace.ace_performDocumentApplyAttributesToRange(rep.selStart, rep.selEnd, [["embedMedia", escape($("#embedMediaSrc")[0].value)]]);
      }, "embedMedia");
    }else{
      return padeditor.ace.callWithAce(function (ace) {
        var rep = ace.ace_getRep();
        ace.ace_replaceRange(rep.selStart, rep.selEnd, "E");
        ace.ace_performSelectionChange([rep.selStart[0],rep.selStart[1]-1], rep.selStart, false);
        ace.ace_performDocumentApplyAttributesToRange(rep.selStart, rep.selEnd, [["insertEmbedPicture", escape($("#embedPictureSrc")[0].value)]]);
      }, "insertEmbedPicture");
    }

    
  });

  $("#cancelEmbedMedia").click(function () {
    //$("#embedMediaModal").slideUp("fast");
    $("#embedMediaModal").removeClass("insertEmbedMedia-show");
  });




  $("#but_upload").click(function(){
    var padeditor = require('ep_etherpad-lite/static/js/pad_editor').padeditor;

    var fd = new FormData();
    var files = $('#file')[0].files[0];
    fd.append('file',files);

    $.ajax({
        url: '/p/' + clientVars.padId + '/pluginfw/ep_insert_media/upload',
        type: 'post',
        data: fd,
        contentType: false,
        processData: false,
        success: function(response){
            if(response != 0){
                if (helper.isImage(response.fileType)){
                  var image_url ='/p/' + clientVars.padId + '/getImage/'+response.fileName
                  $("#img").attr("src",image_url); 
                  $(".preview img").show(); // Display image element
                  padeditor.ace.callWithAce(function (ace) {
                    var rep = ace.ace_getRep();
                    ace.ace_replaceRange(rep.selStart, rep.selEnd, "E");
                    ace.ace_performSelectionChange([rep.selStart[0],rep.selStart[1]-1], rep.selStart, false);
                    ace.ace_performDocumentApplyAttributesToRange(rep.selStart, rep.selEnd, [["insertEmbedPicture", escape(image_url)]]);
                  }, "insertEmbedPicture");
                }if (helper.isVideo(response.fileType)){
                  var video_url ='/p/' + clientVars.padId + '/getVideo/'+response.fileName

                  padeditor.ace.callWithAce(function (ace) {
                    var rep = ace.ace_getRep();
                    ace.ace_replaceRange(rep.selStart, rep.selEnd, "E");
                    ace.ace_performSelectionChange([rep.selStart[0],rep.selStart[1]-1], rep.selStart, false);
                    ace.ace_performDocumentApplyAttributesToRange(rep.selStart, rep.selEnd, [["insertEmbedVideo", escape(video_url)]]);
                  }, "insertEmbedVideo");
                }
                
                $("#embedMediaModal").removeClass("insertEmbedMedia-show");

            }else{
                alert('file not uploaded');
            }
        },
    });
  });




});
