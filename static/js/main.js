'use strict';

const $ = require('ep_etherpad-lite/static/js/rjquery').$;


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
    success: (response) => {
      if (response && response.error === false) {
        if (isImage(response.fileType)) {
          let imageUrl;
          if (response.type === 's3') imageUrl = `/p/getImage/${response.fileName}`;
          else imageUrl = response.fileName;
          mediaData.url = escape(imageUrl);
          padeditor.ace.callWithAce((ace) => {
            const rep = ace.ace_getRep();
            ace.ace_replaceRange(rep.selStart, rep.selEnd, 'E');
            ace.ace_performSelectionChange([rep.selStart[0], rep.selStart[1] - 1], rep.selStart, false);
            ace.ace_performDocumentApplyAttributesToRange(rep.selStart, rep.selEnd, [['insertEmbedPicture', JSON.stringify(mediaData)]]);
          }, 'insertEmbedPicture');
        } if (isVideo(response.fileType)) {
          let videoUrl;
          if (response.type === 's3') videoUrl = `/p/getVideo/${response.fileName}`;
          else videoUrl = response.fileName;
          mediaData.url = escape(videoUrl);

          padeditor.ace.callWithAce((ace) => {
            const rep = ace.ace_getRep();
            ace.ace_replaceRange(rep.selStart, rep.selEnd, 'E');
            ace.ace_performSelectionChange([rep.selStart[0], rep.selStart[1] - 1], rep.selStart, false);
            ace.ace_performDocumentApplyAttributesToRange(rep.selStart, rep.selEnd, [['insertEmbedVideo', JSON.stringify(mediaData)]]);
          }, 'insertEmbedVideo');
        } if (isAudio(response.fileType)) {
          let audioUrl;
          if (response.type === 's3') audioUrl = `/p/getMedia/${response.fileName}`;
          else audioUrl = response.fileName;
          mediaData.url = escape(audioUrl);

          padeditor.ace.callWithAce((ace) => {
            const rep = ace.ace_getRep();
            ace.ace_replaceRange(rep.selStart, rep.selEnd, 'E');
            ace.ace_performSelectionChange([rep.selStart[0], rep.selStart[1] - 1], rep.selStart, false);
            ace.ace_performDocumentApplyAttributesToRange(rep.selStart, rep.selEnd, [['insertEmbedAudio', JSON.stringify(mediaData)]]);
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
$(document).ready(() => {
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
    console.log(module);
    if (!module.hasClass('insertEmbedMedia-show')) {
      module.addClass('insertEmbedMedia-show');
    } else {
      module.removeClass('insertEmbedMedia-show');
    }
  });

  $('#doEmbedMedia').click(() => {
    const padeditor = require('ep_etherpad-lite/static/js/pad_editor').padeditor;
    $('#embedMediaModal').removeClass('insertEmbedMedia-show');
    const url = $('#embedMediaSrc')[0].value;
    const imageSize = $('#selectedSize').val();
    const imageAlign = $('#selectedAlign').val();
    const imageUrl = escape(url);
    const mediaData = {
      url: imageUrl,
      align: imageAlign,
      size: imageSize,
    };
    console.log('[ep_insert_media]: ', mediaData);
    if ((url === '')) {
      uploadAction(mediaData);
      return;
    }

    const separatedUrl = new URL(url);
    console.log('[ep_insert_media]: ', separatedUrl);

    const img = new Image();
    if (!['http:', 'https:'].includes(separatedUrl.protocol)) return;
    $('#embedMediaSrc').val('');
    console.log('[ep_insert_media]: ', 'embedMediaSrc');

    if (['www.youtube.com', 'youtu.be', 'vimeo.com'].includes(separatedUrl.host)) {
      return padeditor.ace.callWithAce((ace) => {
        const rep = ace.ace_getRep();
        ace.ace_replaceRange(rep.selStart, rep.selEnd, 'E');
        ace.ace_performSelectionChange([rep.selStart[0], rep.selStart[1] - 1], rep.selStart, false);
        ace.ace_performDocumentApplyAttributesToRange(rep.selStart, rep.selEnd, [['embedMedia', JSON.stringify(mediaData)]]);
      }, 'embedMedia');
    }
    console.log('[ep_insert_media]: ', 'insertEmbedPicture');

    img.onload = () => padeditor.ace.callWithAce((ace) => {
      const rep = ace.ace_getRep();
      ace.ace_replaceRange(rep.selStart, rep.selEnd, 'E');
      ace.ace_performSelectionChange([rep.selStart[0], rep.selStart[1] - 1], rep.selStart, false);
      ace.ace_performDocumentApplyAttributesToRange(rep.selStart, rep.selEnd, [['insertEmbedPicture', JSON.stringify(mediaData)]]);
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

    console.log('[ep_insert_media]: ', url, img);
  });

  $('#cancelEmbedMedia').click(() => {
    // $("#embedMediaModal").slideUp("fast");
    $('#embedMediaModal').removeClass('insertEmbedMedia-show');
  });
});
