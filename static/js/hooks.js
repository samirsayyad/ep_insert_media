var randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;

exports.aceInitInnerdocbodyHead = function(hook_name, args, cb) {
  args.iframeHTML.push('<link rel="stylesheet" type="text/css" href="/static/plugins/ep_insert_media/static/css/ace.css"/>');
  return cb();
};

exports.aceAttribsToClasses = function(hook_name, args, cb) {
  if (args.key == 'embedMedia' && args.value != "")
    return cb(["embedMedia:" + args.value]);
  if (args.key == 'insertEmbedPicture' && args.value != "")
  return cb(["insertEmbedPicture:" + args.value]);
  if (args.key == 'insertEmbedPictureBig' && args.value != "")
  return cb(["insertEmbedPictureBig:" + args.value]);
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

      return cb([{cls: clss.join(" "), extraOpenTags: "<span class='embedMedia'><span class='media'>" + exports.cleanEmbedCode(unescape(value)) + "</span><span class='character'>", extraCloseTags: '</span>'}]);
  }
  if (args.cls.indexOf('insertEmbedPicture:') >= 0) {
    console.log("I came here too insertEmbedPicture",args)
    var clss = [];
    var argClss = args.cls.split(" ");
     var value;

    for (var i = 0; i < argClss.length; i++) {
      var cls = argClss[i];
      if (cls.indexOf("insertEmbedPicture:") != -1) {
	      value = cls.substr(cls.indexOf(":")+1);
      } else {
	      clss.push(cls);
      }
    }

      return cb([{cls: clss.join(" "), extraOpenTags: "<span data-url='"+unescape(value)+"' id='emb_img-"+randomString(16)+"' class='embedRemoteImageSpan'><span class='image'>" + exports.cleanEmbedPictureCode(unescape(value)) + "</span><span class='character'>", extraCloseTags: '</span>'}]);
  }
  if (args.cls.indexOf('insertEmbedPictureBig:') >= 0) {
    console.log("I came here too insertEmbedPictureBig",args)
    var clss = [];
    var argClss = args.cls.split(" ");
     var value;

    for (var i = 0; i < argClss.length; i++) {
      var cls = argClss[i];
      if (cls.indexOf("insertEmbedPictureBig:") != -1) {
	      value = cls.substr(cls.indexOf(":")+1);
      } else {
	      clss.push(cls);
      }
    }

      return cb([{cls: clss.join(" "), extraOpenTags: "<span data-url='"+unescape(value)+"' id='emb_img-"+randomString(16)+"' class='embedRemoteImageSpanBig'><span class='image'>" + exports.cleanEmbedPictureCode(unescape(value)) + "</span><span class='character'>", extraCloseTags: '</span>'}]);
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
  if (!node.is("iframe,object,embed,param")) {
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
    if ($.inArray(tagName, ["embed", "object", "iframe", "param"]) == -1) {
      return null;
    }
    return attribs;
  });
}

exports.cleanEmbedPictureCode = function(orig) {
  value = $.trim(orig);
  return "<img class='embedRemoteImage' src='"+value+"'>";
}


exports.cleanEmbedCode = function (orig) {
  var res = null;

  value = $.trim(orig);

  if (value.indexOf('http://') == 0 || value.indexOf('https://') == 0) {
    if (value.indexOf("www.youtube.com") != -1) {
      var video = escape(parseUrlParams(value).v);
      res = '<iframe  type="text/html"  width="420" height="315" src="https://www.youtube.com/embed/' + video + '?enablejsapi=1&origin=https://docs.plus" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
    } else if (value.indexOf("vimeo.com") != -1) {
      var video = escape(value.split("/").pop());
      res = '<iframe src="http://player.vimeo.com/video/' + video + '?color=ffffff" width="420" height="236" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>';
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


exports.aceInitialized = function(hook, context){
  var padOuter = $('iframe[name="ace_outer"]').contents();
  var padInner = padOuter.find('iframe[name="ace_inner"]');
  var padeditor = require('ep_etherpad-lite/static/js/pad_editor').padeditor;

  padInner.contents().on("click", ".embedRemoteImageSpanBig", function(e){
    var url = $(this).data("url")
    var id = $(this).attr("id")
    var selector = "#"+id
    //$(this).remove()
    var ace = padeditor.ace;

    padeditor.ace.callWithAce(function (aceTop) {
      var repArr = aceTop.ace_getRepFromSelector(selector, padInner);
      $.each(repArr, function(index, rep){
        // I don't think we need this nested call
        ace.callWithAce(function (ace){
          ace.ace_performSelectionChange(rep[0],rep[1],true);
          ace.ace_setAttributeOnSelection('embedRemoteImageSpanBig', 'embedRemoteImageSpan');
          // Note that this is the correct way of doing it, instead of there being
          // a linkId we now flag it as "link-deleted"
        });
      });
    }, "changeEmbedPicture");
  })




  padInner.contents().on("click", ".embedRemoteImageSpan", function(e){
    var url = $(this).data("url")
    var id = $(this).attr("id")
    var selector = ".embedRemoteImageSpan"
    //$(this).remove()
    var ace = padeditor.ace;

    padeditor.ace.callWithAce(function (aceTop) {
      var repArr = aceTop.ace_getRepFromSelector(selector, padInner);
      $.each(repArr, function(index, rep){
        console.log(repArr)
        // I don't think we need this nested call
        ace.callWithAce(function (ace){
          ace.ace_performSelectionChange(rep[0],rep[1],true);
          ace.ace_setAttributeOnSelection('embedRemoteImageSpan', 'embedRemoteImageSpanBig');
          // Note that this is the correct way of doing it, instead of there being
          // a linkId we now flag it as "link-deleted"
        });
      });
    }, "changeEmbedPicture");

  })
}