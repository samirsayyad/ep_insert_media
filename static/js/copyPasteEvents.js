import * as _ from 'underscore';

const createHiddenDiv = (range) => {
  const content = range.cloneContents();
  const div = document.createElement('div');
  const hiddenDiv = $(div).html(content);
  return hiddenDiv;
};

const getLength = (line, rep) => {
  const nextLine = line + 1;
  const startLineOffset = rep.lines.offsetOfIndex(line);
  const endLineOffset = rep.lines.offsetOfIndex(nextLine);

  // lineLength without \n
  const lineLength = endLineOffset - startLineOffset - 1;

  return lineLength;
};

const getFirstColumnOfSelection =
  (line, rep, firstLineOfSelection) => line !== firstLineOfSelection ? 0 : rep.selStart[1];

const getLastColumnOfSelection = (line, rep, lastLineOfSelection) => {
  let lastColumnOfSelection;
  if (line !== lastLineOfSelection) {
    lastColumnOfSelection = getLength(line, rep); // length of line
  } else {
    lastColumnOfSelection = rep.selEnd[1] - 1; // position of last character selected
  }
  return lastColumnOfSelection;
};

const hasMediaOnLine = (lineNumber, firstColumn, lastColumn, attributeManager) => {
  let foundMediaOnLine = false;
  for (let column = firstColumn; column <= lastColumn && !foundMediaOnLine; column++) {
    // copy process should add new type if added also for pasted
    // real elements that comes from upload modal

    const embedMedia = _.object(attributeManager.getAttributesOnPosition(lineNumber, column)).embedMedia;
    const insertEmbedPicture = _.object(attributeManager.getAttributesOnPosition(lineNumber, column)).insertEmbedPicture;
    const insertEmbedVideo = _.object(attributeManager.getAttributesOnPosition(lineNumber, column)).insertEmbedVideo;
    const insertEmbedAudio = _.object(attributeManager.getAttributesOnPosition(lineNumber, column)).insertEmbedAudio;

    console.info(embedMedia, attributeManager.getAttributesOnPosition(lineNumber, column));

    if (embedMedia !== undefined) {
      foundMediaOnLine = {elemenet: 'embedMedia', data: embedMedia};
    }
    if (insertEmbedPicture !== undefined) {
      foundMediaOnLine = {elemenet: 'insertEmbedPicture', data: insertEmbedPicture};
    }
    if (insertEmbedVideo !== undefined) {
      foundMediaOnLine = {elemenet: 'insertEmbedVideo', data: insertEmbedVideo};
    }
    if (insertEmbedAudio !== undefined) {
      foundMediaOnLine = {elemenet: 'insertEmbedAudio', data: insertEmbedAudio};
    }
  }
  return foundMediaOnLine;
};

const hasMediaOnMultipleLineSel = (selFirstLine, selLastLine, rep, attributeManager) => {
  let foundLineWithMedia = {};
  for (let line = selFirstLine; line <= selLastLine; line++) {
    const firstColumn = getFirstColumnOfSelection(line, rep, selFirstLine);
    const lastColumn = getLastColumnOfSelection(line, rep, selLastLine);
    const hasMedia = hasMediaOnLine(line, firstColumn, lastColumn, attributeManager);
    if (hasMedia) {
      if (!foundLineWithMedia[hasMedia.elemenet]) foundLineWithMedia[hasMedia.elemenet] = [];

      foundLineWithMedia[hasMedia.elemenet].push(hasMedia.data);
    }
  }
  if (_.isEmpty(foundLineWithMedia)) foundLineWithMedia = false;
  return foundLineWithMedia;
};

const hasMultipleLineSelected =
  (firstLineOfSelection, lastLineOfSelection) => firstLineOfSelection !== lastLineOfSelection;

export const hasMediaOnSelection = function () {
  let hasMedia;
  const attributeManager = this.documentAttributeManager;
  const rep = this.rep;
  const selFirstLine = rep.selStart[0];
  const firstColumn = rep.selStart[1];
  const lastColumn = rep.selEnd[1];
  const selLastLine = rep.selEnd[0];
  const selectionOfMultipleLine = hasMultipleLineSelected(selFirstLine, selLastLine);
  if (selectionOfMultipleLine) {
    hasMedia = hasMediaOnMultipleLineSel(selFirstLine, selLastLine, rep, attributeManager);
  } else {
    hasMedia = hasMediaOnLine(selFirstLine, firstColumn, lastColumn, attributeManager);
  }
  return hasMedia;
};

const getHtml = (hiddenDiv) => $(hiddenDiv).html();

const buildHtmlWithTwoSpanTags = (text) => {
  // text until before last char
  const firstSpan = `<span class="media">${text.slice(0, -1)}</span>`;
  const secondSpan = `<span class="media">${text.slice(-1)}</span>`; // last char

  return firstSpan + secondSpan;
};

const buildOpenTags = (tags) => {
  let openTags = '';
  tags.forEach((tag) => {
    openTags += `<${tag}>`;
  });
  return openTags;
};

const buildCloseTags = (tags) => {
  let closeTags = '';
  for (const tag of tags.slice().reverse()) {
    closeTags += `</${tag}>`;
  }
  return closeTags;
};

const getTagsInSelection = (htmlObject) => {
  const tags = [];
  let tag;
  while ($(htmlObject)[0].localName !== 'div') {
    const html = $(htmlObject).prop('outerHTML');
    const stylingTagRegex = /<(b|i|u|s|div|img)>/.exec(html);
    tag = stylingTagRegex ? stylingTagRegex[1] : '';
    tags.push(tag);
    htmlObject = $(htmlObject).parent();
  }
  return tags;
};

const buildHtmlWithFormattingTagsOfSelection = (html, range) => {
  const htmlOfParentNode = range.commonAncestorContainer.parentNode;
  const tags = getTagsInSelection(htmlOfParentNode);

  // this case happens when we got a selection with one or more styling (bold, italic, underline,
  // strikethrough) applied in all selection in the same range. For example,
  // <b><i><u>text</u></i></b>
  if (tags) {
    html = buildOpenTags(tags) + html + buildCloseTags(tags);
  }

  return html;
};

const buildHtmlToCopyWhenSelectionHasOnlyText = (text, range) => {
  const htmlWithSpans = buildHtmlWithTwoSpanTags(text);

  const html = buildHtmlWithFormattingTagsOfSelection(htmlWithSpans, range);

  const htmlToCopy = $.parseHTML(`<div>${html}</div>`);
  return htmlToCopy;
};

// copied from https://css-tricks.com/snippets/javascript/unescape-html-in-js/
const htmlDecode = (input) => {
  const e = document.createElement('div');
  e.innerHTML = input;
  return e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue;
};

const selectionHasOnlyText = (rawHtml) => {
  const html = getHtml(rawHtml);
  const htmlDecoded = htmlDecode(html);
  const text = $(rawHtml).text();
  return htmlDecoded === text;
};

export const pasteMedia = (e, ace, padInner) => {
  const objectMediaDataHtml = e.originalEvent.clipboardData.getData('text/objectMediaDataHtml');
  let objectMediaData = e.originalEvent.clipboardData.getData('text/objectMediaData');
  if (objectMediaDataHtml && objectMediaData) {
    objectMediaData = JSON.parse(objectMediaData);
    let rawHtml = JSON.parse(objectMediaDataHtml);
    rawHtml = $('<div></div>').append(rawHtml.raw);
    // insertEmbedPicture
    let elementCounter = 0;
    rawHtml.find('.embedRemoteImageSpan').each(function () {
      const id = btoa(objectMediaData.insertEmbedPicture[elementCounter]); // randomString(16) ;
      $(this).attr({id: `emb_img-${id}`});
      $(this).attr({class: `emb_img-${id}`});

      $(this).empty();
      $(this).text('E');
      elementCounter++;
    });
    // embedMedia
    elementCounter = 0;
    rawHtml.find('.embedMedia').each(function () {
      const id = btoa(objectMediaData.embedMedia[elementCounter]); // randomString(16) ;
      $(this).attr({id: `emb_embedMedia-${id}`});
      $(this).attr({class: `emb_embedMedia-${id}`});

      $(this).empty();
      $(this).text('E');
      elementCounter++;
    });
    // insertEmbedVideo
    elementCounter = 0;
    rawHtml.find('.embedRemoteVideoSpan').each(function () {
      const id = btoa(objectMediaData.insertEmbedVideo[elementCounter]); // randomString(16) ;
      $(this).attr({id: `emb_video-${id}`});
      $(this).attr({class: `emb_video-${id}`});

      $(this).empty();
      $(this).text('E');
      elementCounter++;
    });
    // insertEmbedAudio
    elementCounter = 0;
    rawHtml.find('.embedRemoteAudioSpan').each(function () {
      const id = btoa(objectMediaData.insertEmbedAudio[elementCounter]); // randomString(16) ;
      $(this).attr({id: `emb_audio-${id}`});
      $(this).attr({class: `emb_audio-${id}`});

      $(this).empty();
      $(this).text('E');
      elementCounter++;
    });
    const selection = padInner.contents()[0].getSelection();
    if (!selection.rangeCount) return false;
    selection.getRangeAt(0).insertNode(rawHtml[0]);
    e.preventDefault();
  }
};

export const addTextOnClipboard = (e, ace, padInner) => {
  let hasMediaOnSelection;
  ace.callWithAce((ace) => {
    hasMediaOnSelection = ace.ace_hasMediaOnSelection();
  });
  if (hasMediaOnSelection) {
    const range = padInner.contents()[0].getSelection().getRangeAt(0);
    const rawHtml = createHiddenDiv(range);
    let html = rawHtml;
    const onlyTextIsSelected = selectionHasOnlyText(rawHtml);
    if (onlyTextIsSelected) {
      const textSelected = rawHtml[0].textContent;
      html = buildHtmlToCopyWhenSelectionHasOnlyText(textSelected, range);
    }
    e.originalEvent.clipboardData.setData('text/objectMediaDataHtml', JSON.stringify({raw: getHtml(html)}));
    e.originalEvent.clipboardData.setData('text/objectMediaData', JSON.stringify(hasMediaOnSelection));
    e.preventDefault();
  }
};
