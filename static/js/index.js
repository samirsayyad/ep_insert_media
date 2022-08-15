import * as copyPasteEvents from 'ep_insert_media/static/js/copyPasteEvents';
import * as mediaHandlers from 'ep_insert_media/static/js/handlers/mediaHandlers';

const hasMediaOnSelection = copyPasteEvents.hasMediaOnSelection;

const displayError = (message) => {
  $.gritter.add({
    title: 'Error',
    text: message,
    // eslint-disable-next-line camelcase
    class_name: 'error',
  });
};

const aceInserMediaToPad = (action, mediaData) => {
  const padeditor = require('ep_etherpad-lite/static/js/pad_editor').padeditor;
  padeditor.ace.callWithAce((ace) => {
    const rep = ace.ace_getRep();
    ace.ace_replaceRange(rep.selStart, rep.selEnd, 'E');
    console.log(rep.selStart, rep.selEnd);
    ace.ace_performSelectionChange([rep.selStart[0], rep.selStart[1] - 1], rep.selStart, false);
    ace.ace_performDocumentApplyAttributesToRange(
        rep.selStart, rep.selEnd,
        [[action, JSON.stringify(mediaData)]]
    );
  }, action);
};

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
  const showLoading = (mediaData) => aceInserMediaToPad('insertMediaLoading', mediaData);

  const uploadAction = (mediaData) => {
    const fd = new FormData();
    const files = $('#file')[0].files[0];
    fd.append('mediaFile', files);
    console.log(mediaData, fd);
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
        console.log(response);
        const {type, fileType, error} = response;
        if (response && error === false) {
          return displayError(`ep_insert_media: ${error}`);
        }

        let mediaURI = `/pluginfw/ep_insert_media/media/${response.fileName}'`;

        if (fileType === 'image') {
          if (type === 's3') mediaURI = `/p/getImage/${response.fileName}`;
          mediaData.url = encodeURI(mediaURI);
          aceInserMediaToPad('insertEmbedPicture', mediaData);
        } if (fileType === 'video') {
          if (type === 's3') mediaURI = `/p/getVideo/${response.fileName}`;
          mediaData.url = encodeURI(mediaURI);
          aceInserMediaToPad('insertEmbedVideo', mediaData);
        } if (fileType === 'audio') {
          if (type === 's3') mediaURI = `/p/getMedia/${response.fileName}`;
          mediaData.url = encodeURI(mediaURI);
          aceInserMediaToPad('insertEmbedAudio', mediaData);
        }
        // reset form
        $('#embedMediaModal').removeClass('insertEmbedMedia-show');
        $('#file').val('');
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

  $('#file').change(() => $('#embedMediaSrc').val(''));

  $('#insertEmbedMedia').click(() => {
    // Can not use this yet, fix in main etherpad
    // padeditbar.toogleDropDown("embedMediaModal");
    const module = $('#embedMediaModal');
    if (!module.hasClass('insertEmbedMedia-show')) {
      return module.addClass('insertEmbedMedia-show');
    }
    return module.removeClass('insertEmbedMedia-show');
  });

  $('#mobileToolbar .embededMedia').on('touchstart', () => {
    const module = $('#embedMediaModal');
    if (!module.hasClass('insertEmbedMedia-show')) {
      return module.addClass('insertEmbedMedia-show');
    }
    return module.removeClass('insertEmbedMedia-show');
  });

  $('#doEmbedMedia').click(() => {
    const url = $('input[type="text"]#embedMediaSrc').val();
    const imageSize = $('#selectedSize').val();
    const imageAlign = $('#selectedAlign').val();
    const imageUrl = encodeURI(url);

    const mediaData = {
      url: imageUrl,
      align: imageAlign,
      size: imageSize,
    };

    // close the modal
    $('#embedMediaModal').removeClass('insertEmbedMedia-show');

    if (url === '') {
      const files = $('#file')[0].files[0];
      if (!files) {
        return displayError('You didn\'t select or enter any media.');
      }
      if (files.size > clientVars.ep_insert_media.settings.maxFileSize) {
        displayError('Maximum file size exceeded. (50 MB Limit)');
        $('#file').val(null);
        return;
      }
      return uploadAction(mediaData);
    }

    showLoading(mediaData);
    const separatedUrl = new URL(url);
    const img = new Image();

    if (!['http:', 'https:'].includes(separatedUrl.protocol)) return;
    $('#embedMediaSrc').val('');
    if (['www.youtube.com', 'youtu.be', 'vimeo.com'].includes(separatedUrl.host)) {
      return aceInserMediaToPad('embedMedia', mediaData);
    }

    img.onload = () => aceInserMediaToPad('insertEmbedPicture', mediaData);

    img.onerror = () => {
      if (!$('#editorcontainerbox').hasClass('flex-layout')) {
        displayError('ep_insert_media: image is not supported.');
      }
    };

    img.src = url;
  });

  $('#cancelEmbedMedia').click(() => {
    // $("#embedMediaModal").slideUp("fast");
    $('#embedMediaModal').removeClass('insertEmbedMedia-show');
  });
};

export const aceInitialized = (hookName, context) => {
  const editorInfo = context.editorInfo;
  editorInfo.ace_hasMediaOnSelection = hasMediaOnSelection.bind(context);
  editorInfo.ace_getRepFromSelector = getRepFromSelector.bind(context);
  return [];
};
