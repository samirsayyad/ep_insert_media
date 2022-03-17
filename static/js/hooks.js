'use strict';

const _ = require('ep_etherpad-lite/static/js/underscore');
const copyPasteEvents = require('./copyPasteEvents');
const hasMediaOnSelection = copyPasteEvents.hasMediaOnSelection;
const mediaHandlers = require('./handlers/mediaHandlers');


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


exports.aceCreateDomLine = (_hookName, args) => {
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


exports.aceInitialized = (hook, context) => {
  const editorInfo = context.editorInfo;
  // eslint-disable-next-line you-dont-need-lodash-underscore/bind
  editorInfo.ace_hasMediaOnSelection = _(hasMediaOnSelection).bind(context);
  // eslint-disable-next-line you-dont-need-lodash-underscore/bind
  editorInfo.ace_getRepFromSelector = _(getRepFromSelector).bind(context);
  return [];
};
