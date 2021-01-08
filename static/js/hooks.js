var randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;
const _ = require('ep_etherpad-lite/static/js/underscore');
const copyPasteEvents = require('./copyPasteEvents');
const hasMediaOnSelection =copyPasteEvents.hasMediaOnSelection;

exports.aceSelectionChanged= function aceSelectionChanged(rep, context) {
  console.log(context.callstack.type)
  // if (context.callstack.type === 'insertheading') {
  //   rep = context.rep;
  //   var headingTagId = ['headingTagId', randomString(16)];
  //   context.documentAttributeManager.setAttributesOnRange(rep.selStart, rep.selEnd, [headingTagId]);
  // }
}
exports.postAceInit = function(hookName, context, cb) {
  var ace =context.ace


  //var copyPasteEvents = require("./copyPasteEvents")
  var browser = require('ep_etherpad-lite/static/js/browser');

  var padOuter = $('iframe[name="ace_outer"]').contents();
  var padInner = padOuter.find('iframe[name="ace_inner"]');
  console.log("sss",padInner)
  if (browser.chrome || browser.firefox) {
    padInner.contents().on('copy', (e) => {
      console.log(e)
      copyPasteEvents.addTextOnClipboard(
          e, ace, padInner, false, null, null);
    });

    padInner.contents().on('cut', (e) => {
      copyPasteEvents.addTextOnClipboard(e, ace, padInner, true);
    });

    padInner.contents().on('paste', (e) => {
      copyPasteEvents.pasteMedia(e,ace,padInner);
    });
  }


}
exports.aceInitInnerdocbodyHead = function(hook_name, args, cb) {
  args.iframeHTML.push('<link rel="stylesheet" type="text/css" href="/static/plugins/ep_insert_media/static/css/ace.css"/>');
  return cb();
};

exports.aceAttribsToClasses = function(hook_name, args, cb) {
  console.log("aceAttribsToClasses",args)

  // copy process should add new type if added
  if (args.key == 'embedMedia' && args.value != "")         return cb(["embedMedia:" + args.value]);
  if (args.key == 'insertEmbedPicture' && args.value != "") return cb(["insertEmbedPicture:" + args.value]);
  if (args.key == 'insertEmbedVideo' && args.value != "")   return cb(["insertEmbedVideo:" + args.value]);
  if (args.key == 'insertEmbedAudio' && args.value != "")   return cb(["insertEmbedAudio:" + args.value]);
  

  //if (args.key == 'insertEmbedPicture_paste' && args.value != "") return cb(["insertEmbedPicture:" + atob(args.value)]);

  // if (args.key == 'insertEmbedPicture' && args.value == "embedRemoteImageSpanLarge")
  // return cb(["insertEmbedPictureBig:" + args.value]);
};

exports.aceCreateDomLine = function(hook_name, args, cb) {
  if (args.cls.indexOf('embedMedia:') >= 0) {
    var clss = [];
    var argClss = args.cls.split(" ");
     var value;

    for (var i = 0; i < argClss.length; i++) {
      var cls = argClss[i];
      if (cls.indexOf("embedMedia:") != -1) {
	      value = cls.substr(cls.indexOf(":")+1);
      } else {
	      clss.push(cls);
      }
    }
    try{
      var mediaData = JSON.parse(value)
    } catch(e) {
      console.log(e)
    }
    if (mediaData){
      var height= "175"
      if(mediaData.size =="Medium"){
        height= "350"
      }
      if(mediaData.size =="Large"){
        height= "540"
      }
      
      return cb([{cls: clss.join(" "), extraOpenTags: "<samdiv style='height:"+
      height+"px' id='emb_embedMedia-"+randomString(16)+"' class='embedMedia'><samdiv class='media'>" + 
      exports.cleanEmbedCode(unescape(mediaData.url),mediaData) + "</samdiv><samdiv class='character'>", extraCloseTags: '</samdiv>'}]);
    }
    
  }
  //--------------------- insertEmbedPicture
  if (args.cls.indexOf('insertEmbedPicture:') >= 0) {
      var clss = [];
      var argClss = args.cls.split(" ");
      var value;
      for (var i = 0; i < argClss.length; i++) {
        var cls = argClss[i];
        if (cls.indexOf("insertEmbedPicture:") != -1) {
          value = cls.substr(cls.indexOf(":")+1);
        }
        else {
          clss.push(cls);
        }
      }
      try{
        var mediaData = JSON.parse(value)
        console.log("after ",mediaData)
      } catch(e) {
        console.log(e)
      }
      if(mediaData)
        return cb([{cls: clss.join(" "), 
        extraOpenTags: "<samdiv data-size='"+mediaData.size+"' data-align='"+mediaData.align+
        "' data-url='"+unescape(mediaData.url)+"' id='emb_img-"+randomString(16)+"' class='embedRemoteImageSpan'><samdiv class='image'>" + exports.cleanEmbedPictureCode(unescape(mediaData.url),mediaData.align,mediaData.size) +
         "</samdiv><samdiv class='character'>", extraCloseTags: '</samdiv>'}]);

  }


  ////////////////////////////////// insertEmbedVideo
  if (args.cls.indexOf('insertEmbedVideo:') >= 0) {
    var clss = [];
    var argClss = args.cls.split(" ");
    var value;

    for (var i = 0; i < argClss.length; i++) {
      var cls = argClss[i];
      if (cls.indexOf("insertEmbedVideo:") != -1) {
        value = cls.substr(cls.indexOf(":")+1);
      }
      else {
        clss.push(cls);
      }
    }
    try{
      var mediaData = JSON.parse(value)
    } catch(e) {
      console.log(e)
    }
    if(mediaData)
      return cb([{cls: clss.join(" "), extraOpenTags: "<samdiv data-url='"+unescape(mediaData.url)+"' id='emb_video-"+randomString(16)+"' class='embedRemoteVideoSpan'><samdiv class='video'>" + exports.cleanEmbedVideoCode(unescape(mediaData.url),mediaData) + "</samdiv><samdiv class='character'>", extraCloseTags: '</samdiv>'}]);

  }




  ////////////////////////////////// insertEmbedAudio
  if (args.cls.indexOf('insertEmbedAudio:') >= 0) {
    var clss = [];
    var argClss = args.cls.split(" ");
    var value;

    for (var i = 0; i < argClss.length; i++) {
      var cls = argClss[i];
      if (cls.indexOf("insertEmbedAudio:") != -1) {
        value = cls.substr(cls.indexOf(":")+1);
      }
      else {
        clss.push(cls);
      }
    }
    try{
      var mediaData = JSON.parse(value)
    } catch(e) {
      console.log(e)
    }

    if (mediaData){
      return cb([{cls: clss.join(" "), extraOpenTags: "<samdiv data-url='"+unescape(mediaData.url)+"' id='emb_audio-"+randomString(16)+"' class='embedRemoteAudioSpan'><samdiv class='audio'>" + exports.cleanEmbedAudioCode(unescape(mediaData.url),mediaData) + "</samdiv><samdiv class='character'>", extraCloseTags: '</samdiv>'}]);

    }

  }

  return cb();
};


var wrap = function (obj) {
  var wrapper = $("<div></div>");
  wrapper.append(obj);
  return wrapper;
}

var filter = function (node) {
  node = $(node);
  if (node.children().length) {
    node.children().each(function () { filter(this); });
  }
  if (!node.is("iframe,object,embed,param,video")) {
    node.replaceWith(node.children().clone());
  }
}

var parseUrlParams = function (url) {
  var res = {};
  url.split("?")[1].split("&").map(function (item) {
    item = item.split("=");
    res[item[0]] = item[1];
  });
  return res;
}

exports.sanitize = function (inputHtml) {
  // Monkeypatch the sanitizer a bit, adding support for embed tags and fixing broken param tags

  html4.ELEMENTS.embed = html4.eflags.UNSAFE;
  html4.ELEMENTS.param = html4.eflags.UNSAFE; // NOT empty or we break stuff in some browsers...

  return html.sanitizeWithPolicy(inputHtml, function(tagName, attribs) {
    if ($.inArray(tagName, ["embed", "object", "iframe", "param","video"]) == -1) {
      return null;
    }
    return attribs;
  });
}

exports.cleanEmbedAudioCode =  function(orig,mediaData) {
  var value = $.trim(orig);
  return '<audio class="audioClass ep_insert_media_'+mediaData.size+' ep_insert_media_'+mediaData.align+'" controls><source src="'+value+'" type="audio/mpeg"></video>';
}
exports.cleanEmbedVideoCode =  function(orig,mediaData,align,size) {
  var value = $.trim(orig);
  return '<video class="videoClass ep_insert_media_'+mediaData.size+' ep_insert_media_'+mediaData.align+'" controls><source src="'+value+'" type="video/mp4"></video>';
}
exports.cleanEmbedPictureCode = function(orig,align,size) {
  var value = $.trim(orig);
  return "<img class='embedRemoteImage ep_insert_media_"+align+" ep_insert_media_"+size+"' src='"+value+"'>";
}


exports.cleanEmbedCode = function (orig,mediaData) {
  var res = null;

  value = $.trim(orig);

  if (value.indexOf('http://') == 0 || value.indexOf('https://') == 0) {
    if (value.indexOf("www.youtube.com") != -1) {
      var video = escape(parseUrlParams(value).v);
      res = '<iframe  type="text/html"   class="video ep_insert_media_'+mediaData.size+' ep_insert_media_'+mediaData.align+'"  src="https://www.youtube.com/embed/' + video + '?enablejsapi=1&origin=https://docs.plus" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
    } else if (value.indexOf("vimeo.com") != -1) {
      var video = escape(value.split("/").pop());
      res = '<iframe   class="video" src="http://player.vimeo.com/video/' + video + '?color=ffffff" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>';
    } else {
      console.warn("Unsupported embed url: " + orig);
    }
  } else if (value.indexOf('<') == 0) {
    value = $.trim(exports.sanitize(value));
    if (value != '') {
        console.log([orig, value]);
      res = value;
    } else {
      console.warn("Invalid embed code: " + orig);
    }
  } else {
    console.warn("Invalid embed code: " + orig);
  }

  if (!res) {
    return  "<img src='/static/plugins/ep_insert_media/static/html/invalid.png'>";
  }

  return res;
}


exports.aceInitialized = (hook, context, cb)=>{

  const editorInfo = context.editorInfo;
  // var padOuter = $('iframe[name="ace_outer"]').contents();
  // var padInner = padOuter.find('iframe[name="ace_inner"]');
  // var padeditor = require('ep_etherpad-lite/static/js/pad_editor').padeditor;
  
  editorInfo.ace_hasMediaOnSelection = _(hasMediaOnSelection).bind(context);
  return cb();

  // padInner.contents().on("click", ".embedRemoteImageSpanLarge", function(e){
  //   var url = $(this).data("url")
  //   var id = $(this).attr("id")
  //   var selector = "#"+id
  //   var ace = padeditor.ace;

  //   padeditor.ace.callWithAce(function (aceTop) {
  //     var repArr = aceTop.ace_getRepFromSelector(selector, padInner);
  //     $.each(repArr, function(index, rep){
  //       ace.callWithAce(function (ace){
  //         ace.ace_performSelectionChange(rep[0],rep[1],true);
  //         ace.ace_setAttributeOnSelection('insertEmbedPicture', url);
  //       });
  //     });
  //   }, "changeEmbedPicture");
  // })




  // padInner.contents().on("click", ".embedRemoteImageSpan", function(e){
  //   var url = $(this).data("url")
  //   var id = $(this).attr("id")
  //   var selector = "#"+id
  //   var ace = padeditor.ace;

  //   padeditor.ace.callWithAce(function (aceTop) {
  //     var repArr = aceTop.ace_getRepFromSelector(selector, padInner);
  //     $.each(repArr, function(index, rep){
  //       ace.callWithAce(function (ace){
  //         ace.ace_performSelectionChange(rep[0],rep[1],true);
  //         ace.ace_setAttributeOnSelection('insertEmbedPicture', 'embedRemoteImageSpanLarge:'+url);

  //       });
  //     });
  //   }, "changeEmbedPicture");

  // })
}