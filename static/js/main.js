$(document).ready(function () {

//   $("#mediaSizeSelect option").unwrap().each(function() {
//     console.log("d",$(this))
//     var btn = $('<div class="btnMediaSize">'+$(this).text()+'</div>');
//     if($(this).selected) btn.addClass('on');
//     $(this).replaceWith(btn);
// });

//   $(document).on('click', '.btnMediaSize', function() {
//       $('.btnMediaSize').removeClass('on');
//       $(this).addClass('on');
//   });


$("#file").change(function(){
  $("#embedMediaSrc").val("")
})

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
      var value =$("#embedMediaSrc")[0].value ;
      if (value.indexOf('http://') == 0 || value.indexOf('https://') == 0) {
        if (value.indexOf("www.youtube.com") != -1 || value.indexOf("youtu.be") != -1 || value.indexOf("vimeo.com") != -1) {
          return padeditor.ace.callWithAce(function (ace) {
            var rep = ace.ace_getRep();
            ace.ace_replaceRange(rep.selStart, rep.selEnd, "E");
            ace.ace_performSelectionChange([rep.selStart[0],rep.selStart[1]-1], rep.selStart, false);
            ace.ace_performDocumentApplyAttributesToRange(rep.selStart, rep.selEnd, [["embedMedia", escape($("#embedMediaSrc")[0].value)]]);
          }, "embedMedia");
        }else{
          var img = new Image();
          var url = $("#embedMediaSrc")[0].value;

          img.onload = function(){
            return padeditor.ace.callWithAce(function (ace) {
              var rep = ace.ace_getRep();
              ace.ace_replaceRange(rep.selStart, rep.selEnd, "E");
              ace.ace_performSelectionChange([rep.selStart[0],rep.selStart[1]-1], rep.selStart, false);
              ace.ace_performDocumentApplyAttributesToRange(rep.selStart, rep.selEnd, [["insertEmbedPicture", escape($("#embedMediaSrc")[0].value)]]);
            }, "insertEmbedPicture");
          }  
          };
          img.onerror = function(){
              alert("Error on loading image...");   
          }
        
         img.src = url;
       
      }
    }else{
      uploadAction()
    }
    
  });

  $("#cancelEmbedMedia").click(function () {
    //$("#embedMediaModal").slideUp("fast");
    $("#embedMediaModal").removeClass("insertEmbedMedia-show");
  });


})

  function uploadAction(){
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
            if(response&&response.error==false ){

                if (isImage(response.fileType)){
                  if (response.type =="s3")
                    var image_url ='/p/getImage/'+response.fileName
                  else
                    var image_url =response.fileName
                  padeditor.ace.callWithAce(function (ace) {
                    var rep = ace.ace_getRep();
                    ace.ace_replaceRange(rep.selStart, rep.selEnd, "E");
                    ace.ace_performSelectionChange([rep.selStart[0],rep.selStart[1]-1], rep.selStart, false);
                    ace.ace_performDocumentApplyAttributesToRange(rep.selStart, rep.selEnd, [["insertEmbedPicture", escape(image_url)]]);
                  }, "insertEmbedPicture");
                }if (isVideo(response.fileType)){
                  if (response.type =="s3")
                    var video_url ='/p/getVideo/'+response.fileName
                  else
                    var video_url =response.fileName

                  padeditor.ace.callWithAce(function (ace) {
                    var rep = ace.ace_getRep();
                    ace.ace_replaceRange(rep.selStart, rep.selEnd, "E");
                    ace.ace_performSelectionChange([rep.selStart[0],rep.selStart[1]-1], rep.selStart, false);
                    ace.ace_performDocumentApplyAttributesToRange(rep.selStart, rep.selEnd, [["insertEmbedVideo", escape(video_url)]]);
                  }, "insertEmbedVideo");
                }if (isAudio(response.fileType)){
                  if (response.type =="s3")
                    var audio_url ='/p/getMedia/'+response.fileName
                  else
                    var audio_url =response.fileName

                  padeditor.ace.callWithAce(function (ace) {
                    var rep = ace.ace_getRep();
                    ace.ace_replaceRange(rep.selStart, rep.selEnd, "E");
                    ace.ace_performSelectionChange([rep.selStart[0],rep.selStart[1]-1], rep.selStart, false);
                    ace.ace_performDocumentApplyAttributesToRange(rep.selStart, rep.selEnd, [["insertEmbedAudio", escape(audio_url)]]);
                  }, "insertEmbedAudio");
                }
              
               
                
                $("#embedMediaModal").removeClass("insertEmbedMedia-show");
                $("#file").val("")
            }else{
                alert('file not uploaded because '+response.error);
            }
        },
    });
  } 




 

function isImage (filename) {
  switch (filename.toLowerCase()) {
    case '.jpg':
    case '.gif':
    case '.bmp':
    case '.png':
      //etc
      return true;
  }
  return false;
}

function isVideo (filename) {
  switch (filename.toLowerCase()) {
    case '.m4v':
    case '.avi':
    case '.mpg':
    case '.mp4':
    case '.webm':

      // etc
      return true;
  }
  return false;
}

function isAudio (filename) {
  switch (filename.toLowerCase()) {
    case '.mp3':
    case '.ogg':
    case '.m4a':
    case '.flac':
    case '.wav':
    case '.wma':
    case '.aac':

      // etc
      return true;
  }
  return false;
}
