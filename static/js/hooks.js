'use strict';

const _ = require('ep_etherpad-lite/static/js/underscore');
const copyPasteEvents = require('./copyPasteEvents');
const hasMediaOnSelection = copyPasteEvents.hasMediaOnSelection;
const mediaHandlers = require('./handlers/mediaHandlers');
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
    if (argClss.length < 2) return;
    const [first, ...rest] = argClss[1].split(':'); // first means the func and rest is data
    const mediadata = JSON.parse(rest.join(':'));
    switch (first) {
      case 'embedMedia':
        return mediaHandlers.embedMedia(args.cls, mediadata);
      case 'insertEmbedPicture':
        return mediaHandlers.insertEmbedPicture(args.cls, mediadata);
      case 'insertEmbedVideo':
        return mediaHandlers.insertEmbedVideo(args.cls, mediadata);
      case 'insertEmbedAudio':
        return mediaHandlers.insertEmbedAudio(args.cls, mediadata);
      default:
        return [];
    }
  } catch (e) {
    console.log(e);
  }
};


exports.aceInitialized = (hook, context) => {
  const editorInfo = context.editorInfo;
  // eslint-disable-next-line you-dont-need-lodash-underscore/bind
  editorInfo.ace_hasMediaOnSelection = _(hasMediaOnSelection).bind(context);
  return [];
};
