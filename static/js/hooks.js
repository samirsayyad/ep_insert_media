'use strict';

const randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;
const _ = require('ep_etherpad-lite/static/js/underscore');
const copyPasteEvents = require('./copyPasteEvents');
const hasMediaOnSelection = copyPasteEvents.hasMediaOnSelection;
exports.postAceInit = (hookName, context) => {
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
exports.aceInitInnerdocbodyHead = (_hookName, args) => {
  args.iframeHTML.push('<link rel="stylesheet" type="text/css" href="/static/plugins/ep_insert_media/static/css/ace.css"/>');
  return [];
};

exports.aceAttribsToClasses = (_hookName, args) => {
  // copy process should add new type if added
  if (args.key === 'embedMedia' && args.value !== '') return [`embedMedia:${args.value}`];
  if (args.key === 'insertEmbedPicture' && args.value !== '') return [`insertEmbedPicture:${args.value}`];
  if (args.key === 'insertEmbedVideo' && args.value !== '') return [`insertEmbedVideo:${args.value}`];
  if (args.key === 'insertEmbedAudio' && args.value !== '') return [`insertEmbedAudio:${args.value}`];

  return [];
};

exports.aceCreateDomLine = (_hookName, args) => {
  try {
    const argClss = args.cls.split(' ');
    let value, clss;
    if (args.cls.indexOf('embedMedia:') >= 0) {
      for (let i = 0; i < argClss.length; i++) {
        const cls = argClss[i];
        if (cls.indexOf('embedMedia:') !== -1) {
          value = cls.substr(cls.indexOf(':') + 1);
        } else {
          clss.push(cls);
        }
      }
      const mediaData = JSON.parse(value);

      if (mediaData) {
        let height = '175';
        if (mediaData.size === 'Medium') {
          height = '350';
        }
        if (mediaData.size === 'Large') {
          height = '540';
        }

        return [{cls: clss.join(' '), extraOpenTags: `<samdiv style='height:${
          height}px' id='emb_embedMedia-${randomString(16)}' class='embedMedia'><samdiv class='media'>${
          exports.cleanEmbedCode(unescape(mediaData.url), mediaData)}</samdiv><samdiv class='character'>`, extraCloseTags: '</samdiv>'}];
      }
    }
    // --------------------- insertEmbedPicture
    if (args.cls.indexOf('insertEmbedPicture:') >= 0) {
      for (let i = 0; i < argClss.length; i++) {
        const cls = argClss[i];
        if (cls.indexOf('insertEmbedPicture:') !== -1) {
          value = cls.substr(cls.indexOf(':') + 1);
        } else {
          clss.push(cls);
        }
      }
      const mediaData = JSON.parse(value);

      if (mediaData) {
        return [{cls: clss.join(' '),
          extraOpenTags: `<samdiv data-size='${mediaData.size}' data-align='${mediaData.align
          }' data-url='${unescape(mediaData.url)}' id='emb_img-${randomString(16)}' class='embedRemoteImageSpan'><samdiv class='image'>${exports.cleanEmbedPictureCode(unescape(mediaData.url), mediaData.align, mediaData.size)
          }</samdiv><samdiv class='character'>`, extraCloseTags: '</samdiv>'}];
      }
    }


    // //////////////////////////////// insertEmbedVideo
    if (args.cls.indexOf('insertEmbedVideo:') >= 0) {
      const argClss = args.cls.split(' ');
      for (let i = 0; i < argClss.length; i++) {
        const cls = argClss[i];
        if (cls.indexOf('insertEmbedVideo:') !== -1) {
          value = cls.substr(cls.indexOf(':') + 1);
        } else {
          clss.push(cls);
        }
      }
      const mediaData = JSON.parse(value);
      if (mediaData) return [{cls: clss.join(' '), extraOpenTags: `<samdiv data-url='${unescape(mediaData.url)}' id='emb_video-${randomString(16)}' class='embedRemoteVideoSpan'><samdiv class='video'>${exports.cleanEmbedVideoCode(unescape(mediaData.url), mediaData)}</samdiv><samdiv class='character'>`, extraCloseTags: '</samdiv>'}];
    }


    // //////////////////////////////// insertEmbedAudio
    if (args.cls.indexOf('insertEmbedAudio:') >= 0) {
      const argClss = args.cls.split(' ');

      for (let i = 0; i < argClss.length; i++) {
        const cls = argClss[i];
        if (cls.indexOf('insertEmbedAudio:') !== -1) {
          value = cls.substr(cls.indexOf(':') + 1);
        } else {
          clss.push(cls);
        }
      }
      const mediaData = JSON.parse(value);
      if (mediaData) return [{cls: clss.join(' '), extraOpenTags: `<samdiv data-url='${unescape(mediaData.url)}' id='emb_audio-${randomString(16)}' class='embedRemoteAudioSpan'><samdiv class='audio'>${exports.cleanEmbedAudioCode(unescape(mediaData.url), mediaData)}</samdiv><samdiv class='character'>`, extraCloseTags: '</samdiv>'}];
    }
    return [];
  } catch (e) {
    console.log(e);
  }
};

const parseUrlParams = (url) => {
  const res = {};
  url.split('?')[1].split('&').map((item) => {
    item = item.split('=');
    res[item[0]] = item[1];
  });
  return res;
};

exports.sanitize = (inputHtml) => {
  // Monkeypatch the sanitizer a bit, adding support for embed tags and fixing broken param tags

  html4.ELEMENTS.embed = html4.eflags.UNSAFE;
  html4.ELEMENTS.param = html4.eflags.UNSAFE; // NOT empty or we break stuff in some browsers...

  return html.sanitizeWithPolicy(inputHtml, (tagName, attribs) => {
    if ($.inArray(tagName, ['embed', 'object', 'iframe', 'param', 'video']) === -1) {
      return null;
    }
    return attribs;
  });
};

exports.cleanEmbedAudioCode = (orig, mediaData) => {
  const value = $.trim(orig);
  return `<audio class="audioClass ep_insert_media_${mediaData.size} ep_insert_media_${mediaData.align}" controls><source src="${value}" type="audio/mpeg"></video>`;
};
exports.cleanEmbedVideoCode = (orig, mediaData) => {
  const value = $.trim(orig);
  return `<video class="videoClass ep_insert_media_${mediaData.size} ep_insert_media_${mediaData.align}" controls><source src="${value}" type="video/mp4"></video>`;
};
exports.cleanEmbedPictureCode = (orig, align, size) => {
  const value = $.trim(orig);
  return `<img class='embedRemoteImage ep_insert_media_${align} ep_insert_media_${size}' src='${value}'>`;
};


exports.cleanEmbedCode = (orig, mediaData) => {
  let res = null;

  let value = $.trim(orig);
  let video;
  if (value.indexOf('http://') === 0 || value.indexOf('https://') === 0) {
    if (value.indexOf('www.youtube.com') !== -1) {
      video = escape(parseUrlParams(value).v);
      res = `<iframe  type="text/html"   class="video ep_insert_media_${mediaData.size} ep_insert_media_${mediaData.align}"  src="https://www.youtube.com/embed/${video}?enablejsapi=1&origin=https://docs.plus" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else if (value.indexOf('vimeo.com') !== -1) {
      video = escape(value.split('/').pop());
      res = `<iframe   class="video" src="http://player.vimeo.com/video/${video}?color=ffffff" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>`;
    } else {
      console.warn(`Unsupported embed url: ${orig}`);
    }
  } else if (value.indexOf('<') === 0) {
    value = $.trim(exports.sanitize(value));
    if (value !== '') {
      res = value;
    } else {
      console.warn(`Invalid embed code: ${orig}`);
    }
  } else {
    console.warn(`Invalid embed code: ${orig}`);
  }

  if (!res) {
    return '<img src=\'/static/plugins/ep_insert_media/static/html/invalid.png\'>';
  }

  return res;
};


exports.aceInitialized = (hook, context) => {
  const editorInfo = context.editorInfo;
  // eslint-disable-next-line you-dont-need-lodash-underscore/bind
  editorInfo.ace_hasMediaOnSelection = _(hasMediaOnSelection).bind(context);
  return [];
};
