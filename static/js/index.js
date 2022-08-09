import * as copyPasteEvents from 'ep_insert_media/static/js/copyPasteEvents';
import * as mediaHandlers from 'ep_insert_media/static/js/handlers/mediaHandlers';

const hasMediaOnSelection = copyPasteEvents.hasMediaOnSelection;

// Alas we follow the Etherpad convention of using tuples here.
const getRepFromSelector = (selector, container) => {
  const repArr = [];
  // first find the element
  const elements = container.contents().find(selector);
  // One might expect this to be a rep for the entire document
  // However what we actually need to do is find each selection that includes
  // this link and remove it.  This is because content can be pasted
  // Mid link which would mean a remove selection could have unexpected consequences

  $.each(elements, (index, span) => {
    // create a rep array container we can push to..
    const rep = [[], []];

    // span not be the div so we have to go to parents until we find a div
    const parentDiv = $(span).closest('samdiv');
    // line Number is obviously relative to entire document
    const lineNumber = $(parentDiv).prevAll('samdiv').length;
    rep[0][0] = lineNumber;
    rep[1][0] = lineNumber;
    repArr.push(rep);
  });
  return repArr;
};

export const postAceInit = (hookName, context) => {
  const ace = context.ace;
  const browser = require('ep_etherpad-lite/static/js/browser');
  const padOuter = $('iframe[name="ace_outer"]').contents();
  const padInner = padOuter.find('iframe[name="ace_inner"]');
  if (browser.chrome || browser.firefox) {
    padInner.contents().on('copy', (e) => {
      copyPasteEvents.addTextOnClipboard(
          e, ace, padInner, false, null, null);
    });
    padInner.contents().on('cut', (e) => {
      copyPasteEvents.addTextOnClipboard(e, ace, padInner, true);
    });
    padInner.contents().on('paste', (e) => {
      copyPasteEvents.pasteMedia(e, ace, padInner);
    });
  }
};

export const aceInitInnerdocbodyHead = (hookName, args) => {
  const linkURI = '/static/plugins/ep_insert_media/static/css/ace.css';
  args.iframeHTML.push(`<link rel="stylesheet" type="text/css" href="${linkURI}"/>`);
  return [];
};

export const aceAttribsToClasses = (hookName, args) => {
  // copy process should add new type if added
  if (args.key === 'embedMedia' && args.value !== '') {
    return ['ep_insert_media', JSON.stringify({
      func: 'embedMedia',
      data: args.value,
    })];
  }
  if (args.key === 'insertEmbedPicture' && args.value !== '') {
    return ['ep_insert_media', JSON.stringify({
      func: 'insertEmbedPicture',
      data: args.value,
    })];
  }
  if (args.key === 'insertEmbedVideo' && args.value !== '') {
    return ['ep_insert_media', JSON.stringify({
      func: 'insertEmbedVideo',
      data: args.value,
    })];
  }
  if (args.key === 'insertEmbedAudio' && args.value !== '') {
    return ['ep_insert_media', JSON.stringify({
      func: 'insertEmbedAudio',
      data: args.value,
    })];
  }
  if (args.key === 'insertMediaLoading' && args.value !== '') {
    return ['ep_insert_media', JSON.stringify({
      func: 'insertMediaLoading',
      data: args.value,
    })];
  }
  return [];
};

export const aceCreateDomLine = (hookName, args) => {
  try {
    const argClss = args.cls.split(' ');
    if (argClss.length < 2) return [];
    if (argClss[1] !== 'ep_insert_media') return [];
    const mediaData = JSON.parse(argClss[2]);
    const data = JSON.parse(mediaData.data);
    switch (mediaData.func) {
      case 'embedMedia':
        return mediaHandlers.embedMedia(args.cls, data);
      case 'insertEmbedPicture':
        return mediaHandlers.insertEmbedPicture(args.cls, data);
      case 'insertEmbedVideo':
        return mediaHandlers.insertEmbedVideo(args.cls, data);
      case 'insertEmbedAudio':
        return mediaHandlers.insertEmbedAudio(args.cls, data);
      case 'insertMediaLoading':
        return mediaHandlers.insertMediaLoading(args.cls, data);
      default:
        return [];
    }
  } catch (e) {
    console.error(e);
  }
};

export const aceInitialized = (hookName, context) => {
  const editorInfo = context.editorInfo;
  editorInfo.ace_hasMediaOnSelection = hasMediaOnSelection.bind(context);
  editorInfo.ace_getRepFromSelector = getRepFromSelector.bind(context);
  return [];
};

export const collectContentPre = (hookName, context) => {
  /* eslint-disable max-len */
  // insertEmbedPicture =======  emb_img
  let existTagId = /(?:^| )emb_img-([A-Za-z0-9]*)/.exec(context.cls);
  if (existTagId && existTagId[1]) {
    // JSON.stringify({"url":"https%3A//homepages.cae.wisc.edu/%7Eece533/images/boat.png","align":"Left","size":"Small"}));
    context.cc.doAttrib(context.state, `insertEmbedPicture::${atob(existTagId[1])}`);
  }
  // embedMedia ===== emb_embedMedia
  existTagId = /(?:^| )emb_embedMedia-([A-Za-z0-9]*)/.exec(context.cls);
  if (existTagId && existTagId[1]) {
    // JSON.stringify({"url":"https%3A//homepages.cae.wisc.edu/%7Eece533/images/boat.png","align":"Left","size":"Small"}));
    context.cc.doAttrib(context.state, `embedMedia::${atob(existTagId[1])}`);
  }
  // insertEmbedVideo ===== emb_video
  existTagId = /(?:^| )emb_video-([A-Za-z0-9]*)/.exec(context.cls);
  if (existTagId && existTagId[1]) {
    // JSON.stringify({"url":"https%3A//homepages.cae.wisc.edu/%7Eece533/images/boat.png","align":"Left","size":"Small"}));
    context.cc.doAttrib(context.state, `insertEmbedVideo::${atob(existTagId[1])}`);
  }
  // insertEmbedAudio ===== emb_audio
  existTagId = /(?:^| )emb_audio-([A-Za-z0-9]*)/.exec(context.cls);
  if (existTagId && existTagId[1]) {
    // JSON.stringify({"url":"https%3A//homepages.cae.wisc.edu/%7Eece533/images/boat.png","align":"Left","size":"Small"}));
    context.cc.doAttrib(context.state, `insertEmbedAudio::${atob(existTagId[1])}`);
  }
  return [];
};

export const documentReady = (hookName, context) => {
  const isImage = (filename) => {
    switch (filename.toLowerCase()) {
      case '.jpg':
      case '.gif':
      case '.bmp':
      case '.png':
      case '.jpeg':

        // etc
        return true;
    }
    return false;
  };

  const isVideo = (filename) => {
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
  };

  const isAudio = (filename) => {
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
  };

  const showLoading = (mediaData) => {
    const padeditor = require('ep_etherpad-lite/static/js/pad_editor').padeditor;
    padeditor.ace.callWithAce((ace) => {
      const rep = ace.ace_getRep();
      ace.ace_replaceRange(rep.selStart, rep.selEnd, 'E');
      ace.ace_performSelectionChange([rep.selStart[0], rep.selStart[1] - 1], rep.selStart, false);
      ace.ace_performDocumentApplyAttributesToRange(
          rep.selStart, rep.selEnd,
          [['insertMediaLoading', JSON.stringify(mediaData)]]
      );
    }, 'insertMediaLoading');
  };

  const uploadAction = (mediaData) => {
    const padeditor = require('ep_etherpad-lite/static/js/pad_editor').padeditor;

    const fd = new FormData();
    const files = $('#file')[0].files[0];
    fd.append('file', files);
    $.ajax({
      url: `/p/${clientVars.padId}/pluginfw/ep_insert_media/upload`,
      type: 'post',
      data: fd,
      contentType: false,
      processData: false,
      beforeSend: () => {
        showLoading(mediaData);
      },
      error: (xhr, textStatus, thrownError) => {
        alert(xhr.status);
        alert(thrownError);
      },
      success: (response) => {
        const padOuter = $('iframe[name="ace_outer"]').contents();
        const padInner = padOuter.find('iframe[name="ace_inner"]');

        if (response && response.error === false) {
          if (isImage(response.fileType)) {
            let imageUrl;
            if (response.type === 's3') imageUrl = `/p/getImage/${response.fileName}`;
            else imageUrl = response.fileName;
            mediaData.url = escape(imageUrl);
            padeditor.ace.callWithAce((ace) => {
              const rep = ace.ace_getRepFromSelector('#media_loading', padInner); // ace.ace_getRep();
              if (!rep.length) return;
              ace.ace_replaceRange(rep[0][0], rep[0][1], 'E');
              ace.ace_performSelectionChange([rep[0][0][0], rep[0][0][1] - 1], rep[0][0], false);
              ace.ace_performDocumentApplyAttributesToRange(
                  rep[0][0], rep[0][1],
                  [['insertEmbedPicture', JSON.stringify(mediaData)]]
              );
            }, 'insertEmbedPicture');
          } if (isVideo(response.fileType)) {
            let videoUrl;
            if (response.type === 's3') videoUrl = `/p/getVideo/${response.fileName}`;
            else videoUrl = response.fileName;
            mediaData.url = escape(videoUrl);

            padeditor.ace.callWithAce((ace) => {
              const rep = ace.ace_getRepFromSelector('#media_loading', padInner); // ace.ace_getRep();
              if (!rep.length) return;
              ace.ace_replaceRange(rep[0][0], rep[0][1], 'E');
              ace.ace_performSelectionChange([rep[0][0][0], rep[0][0][1] - 1], rep[0][0], false);
              ace.ace_performDocumentApplyAttributesToRange(
                  rep[0][0], rep[0][1],
                  [['insertEmbedVideo', JSON.stringify(mediaData)]]
              );
            }, 'insertEmbedVideo');
          } if (isAudio(response.fileType)) {
            let audioUrl;
            if (response.type === 's3') audioUrl = `/p/getMedia/${response.fileName}`;
            else audioUrl = response.fileName;
            mediaData.url = escape(audioUrl);

            padeditor.ace.callWithAce((ace) => {
              const rep = ace.ace_getRepFromSelector('#media_loading', padInner); // ace.ace_getRep();
              if (!rep.length) return;
              ace.ace_replaceRange(rep[0][0], rep[0][1], 'E');
              ace.ace_performSelectionChange([rep[0][0][0], rep[0][0][1] - 1], rep[0][0], false);
              ace.ace_performDocumentApplyAttributesToRange(
                  rep[0][0], rep[0][1],
                  [['insertEmbedAudio', JSON.stringify(mediaData)]]
              );
            }, 'insertEmbedAudio');
          }


          $('#embedMediaModal').removeClass('insertEmbedMedia-show');
          $('#file').val('');
        } else {
          $.gritter.add({
            title: 'Error',
            text: `ep_insert_media: ${response.error}`,
            sticky: true,
            className: 'error',
          });
        }
      },
    });
  };

  $(document).on('click', '.btnMediaSize', function () {
    $('.btnMediaSize').removeClass('on');
    $(this).addClass('on');
    $('#selectedSize').val($(this).text());
  });

  $(document).on('click', '.btnAlignDirection', function () {
    $('.btnAlignDirection').removeClass('on');
    $(this).addClass('on');
    $('#selectedAlign').val($(this).data('value'));
  });

  $('#file').change(() => {
    $('#embedMediaSrc').val('');
  });

  $('#insertEmbedMedia').click(() => {
    // Can not use this yet, fix in main etherpad
    // padeditbar.toogleDropDown("embedMediaModal");
    const module = $('#embedMediaModal');
    if (!module.hasClass('insertEmbedMedia-show')) {
      module.addClass('insertEmbedMedia-show');
    } else {
      module.removeClass('insertEmbedMedia-show');
    }
  });

  $('#mobileToolbar .embededMedia').on('touchstart', (e) => {
    const module = $('#embedMediaModal');
    if (!module.hasClass('insertEmbedMedia-show')) {
      module.addClass('insertEmbedMedia-show');
    } else {
      module.removeClass('insertEmbedMedia-show');
    }
  });

  $('#doEmbedMedia').click(() => {
    const padeditor = require('ep_etherpad-lite/static/js/pad_editor').padeditor;
    const url = $('#embedMediaSrc')[0].value;
    const imageSize = $('#selectedSize').val();
    const imageAlign = $('#selectedAlign').val();
    const imageUrl = escape(url);
    const mediaData = {
      url: imageUrl,
      align: imageAlign,
      size: imageSize,
    };
    $('#embedMediaModal').removeClass('insertEmbedMedia-show');

    if ((url === '')) {
      const files = $('#file')[0].files[0];
      if (!files) {
        $.gritter.add({
          title: 'Error',
          text: 'You didn\'t select or enter any media.',
          class_name: 'error',
        });
        return;
      }
      if (files.size > clientVars.ep_insert_media.settings.maxFileSize) {
        $.gritter.add({
          title: 'Error',
          text: 'Maximum file size exceeded. (50 MB Limit)',
          class_name: 'error',
        });
        $('#file').val(null);
        return;
      }
      uploadAction(mediaData);
      return;
    }

    const padOuter = $('iframe[name="ace_outer"]').contents();
    const padInner = padOuter.find('iframe[name="ace_inner"]');

    showLoading(mediaData);
    const separatedUrl = new URL(url);
    const img = new Image();
    if (!['http:', 'https:'].includes(separatedUrl.protocol)) return;
    $('#embedMediaSrc').val('');
    if (['www.youtube.com', 'youtu.be', 'vimeo.com'].includes(separatedUrl.host)) {
      return padeditor.ace.callWithAce((ace) => {
        const rep = ace.ace_getRepFromSelector('#media_loading', padInner); // ace.ace_getRep();
        if (!rep.length) return;
        ace.ace_replaceRange(rep[0][0], rep[0][1], 'E');
        ace.ace_performSelectionChange([rep[0][0][0], rep[0][0][1] - 1], rep[0][0], false);
        ace.ace_performDocumentApplyAttributesToRange(
            rep[0][0], rep[0][1],
            [['embedMedia', JSON.stringify(mediaData)]]
        );
      }, 'embedMedia');
    }
    img.onload = () => padeditor.ace.callWithAce((ace) => {
      const rep = ace.ace_getRepFromSelector('#media_loading', padInner); // ace.ace_getRep();
      if (!rep.length) return;
      ace.ace_replaceRange(rep[0][0], rep[0][1], 'E');
      ace.ace_performSelectionChange([rep[0][0][0], rep[0][0][1] - 1], rep[0][0], false);
      ace.ace_performDocumentApplyAttributesToRange(
          rep[0][0], rep[0][1],
          [['insertEmbedPicture', JSON.stringify(mediaData)]]
      );
    }, 'insertEmbedPicture');

    img.onerror = () => {
      if (!$('#editorcontainerbox').hasClass('flex-layout')) {
        $.gritter.add({
          title: 'Error',
          text: 'ep_insert_media: image is not supported.',
          sticky: true,
          className: 'error',
        });
      }
    };
    img.src = url;
  });

  $('#cancelEmbedMedia').click(() => {
    // $("#embedMediaModal").slideUp("fast");
    $('#embedMediaModal').removeClass('insertEmbedMedia-show');
  });
};
