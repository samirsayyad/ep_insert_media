'use strict';

const _ = require('ep_etherpad-lite/static/js/underscore');
var randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;

exports.pasteMedia = (e,ace,padInner) => {
//  var padeditor = require('ep_etherpad-lite/static/js/pad_editor').padeditor;
  var objectMediaData = e.originalEvent.clipboardData.getData('text/ep_insert_media');
  console.log("come for paste",objectMediaData)

  if(objectMediaData){

    let rawHtml = JSON.parse(objectMediaData);
    rawHtml = $('<div></div>').append(rawHtml.raw);
    console.log('first media', rawHtml.find('.embedRemoteImageSpan'));

    rawHtml.find('.embedRemoteImageSpan').each(function () {
      $(this).attr({id: `emb_img-${randomString(16)}`});
    });

    const selection = padInner.contents()[0].getSelection();
    if (!selection.rangeCount) return false;

    console.log("before injecting",rawHtml)
    selection.getRangeAt(0).insertNode(rawHtml[0]);
    e.preventDefault();

//       setTimeout(function() {
//           //objectMediaData = JSON.parse(objectMediaData)
//           //  var objectMediaDataValue = JSON.parse(objectMediaData.value)
//           console.log("objectMediaData",objectMediaData,"objectMediaDataValue",objectMediaData.value)
//           //$("#khiar").focus().Text("khiar")
//           console.log(padInner.find('#khiar'));
//           ace.callWithAce(function (ace) {
//             var rep = ace.ace_getRep();
//             console.log(e)
//             // ace.ace_replaceRange(rep.selStart, rep.selEnd, "E");
//             // ace.ace_performSelectionChange([rep.selStart[0],rep.selStart[1]-1], rep.selStart, false);
//             // ace.ace_performDocumentApplyAttributesToRange(rep.selStart, rep.selEnd, [["insertEmbedPicture" ,objectMediaData.insertEmbedPicture]]);
// //            ace.ace_focus();

//           }, "insertEmbedPicture");

//       }, 200);
  }


};

exports.addTextOnClipboard = (e, ace, padInner) => {
  let hasMediaOnSelection;
  ace.callWithAce((ace) => {
    hasMediaOnSelection = ace.ace_hasMediaOnSelection();
  });
  if (hasMediaOnSelection) {
    const range = padInner.contents()[0].getSelection().getRangeAt(0);
    const rawHtml = createHiddenDiv(range);
    var html = rawHtml;

    const onlyTextIsSelected = selectionHasOnlyText(rawHtml);

    if (onlyTextIsSelected) {
      const textSelected = rawHtml[0].textContent;
      html = buildHtmlToCopyWhenSelectionHasOnlyText(textSelected, range);

    }

    //html = removeMediaAndReplaceWithChar("E", html);


    //embedRemoteImageSpan

    console.log("commentIdOnFirstPositionSelected",html)

    console.log("this going put in media object",hasMediaOnSelection)
    e.originalEvent.clipboardData.setData('text/ep_insert_media',JSON.stringify({raw: getHtml(html)}));
    e.originalEvent.clipboardData.setData('text/objectMediaData', JSON.stringify(hasMediaOnSelection) );

    e.preventDefault();
  }


}

exports.hasMediaOnSelection = function(){
  let hasMedia;
  const attributeManager = this.documentAttributeManager;
  const rep = this.rep;
  const selFirstLine = rep.selStart[0];
  const firstColumn = rep.selStart[1];
  const lastColumn = rep.selEnd[1];
  const selLastLine = rep.selEnd[0];
  const selectionOfMultipleLine = hasMultipleLineSelected(selFirstLine, selLastLine);
  console.log("selectionOfMultipleLine,",selectionOfMultipleLine)
  if (selectionOfMultipleLine) {
    hasMedia = hasMediaOnMultipleLineSel(selFirstLine, selLastLine, rep, attributeManager);
  } else {
    hasMedia = hasMediaOnLine(selFirstLine, firstColumn, lastColumn, attributeManager);
  }
  return hasMedia;
};

const removeMediaAndReplaceWithChar = (selectedChar,html)=>{
  _.each(html, (element)=>{
    console.log(element)
    
  })

  console.log($(html).find(`.embedRemoteImageSpan`),"|$(html).find(`.embedRemoteImageSpan`)")
  $(html).find(`.embedRemoteImageSpan`).text("ELM") //= "<span id='khiar'>E</span>";

  
  return html
}

const selectionHasOnlyText = (rawHtml) => {
  const html = getHtml(rawHtml);
  const htmlDecoded = htmlDecode(html);
  const text = $(rawHtml).text();
  return htmlDecoded === text;
};

const getHtml = (hiddenDiv) => $(hiddenDiv).html();

// copied from https://css-tricks.com/snippets/javascript/unescape-html-in-js/
const htmlDecode = (input) => {
  const e = document.createElement('div');
  e.innerHTML = input;
  return e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue;
};


const getMediaIds = (html) => {
  const allDiv = $(html).find('div');
  const commentIds = [];
  _.each(allDiv, (span) => {
    const cls = $(span).attr('class');
    const classCommentId = /(?:^| )(embedRemoteImageSpan[A-Za-z0-9]*)/.exec(cls);
    const commentId = (classCommentId) ? classCommentId[1] : false;
    if (commentId) {
      commentIds.push(commentId);
    }
  });
  const uniqueCommentIds = _.uniq(commentIds);
  return uniqueCommentIds;
};


const hasMediaOnMultipleLineSel = (selFirstLine, selLastLine, rep, attributeManager) => {
  let foundLineWithMedia = false;
  console.log(selFirstLine, selLastLine,)
  for (let line = selFirstLine; line <= selLastLine && !foundLineWithMedia; line++) {
    console.log("we are going to process",line)
    const firstColumn = getFirstColumnOfSelection(line, rep, selFirstLine);
    const lastColumn = getLastColumnOfSelection(line, rep, selLastLine);
    const hasMedia = hasMediaOnLine(line, firstColumn, lastColumn, attributeManager);
    if (hasMedia) {
      foundLineWithMedia = hasMedia;
    }
  }
  return foundLineWithMedia;
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

const hasMultipleLineSelected =
  (firstLineOfSelection, lastLineOfSelection) => firstLineOfSelection !== lastLineOfSelection;

const hasMediaOnLine = (lineNumber, firstColumn, lastColumn, attributeManager) => {
  let foundMediaOnLine = false;
  console.log(lineNumber, firstColumn, lastColumn,)
  for (let column = firstColumn; column <= lastColumn && !foundMediaOnLine; column++) {

    // copy process should add new type if added
    const mediaData_embedMedia          =  _.object(attributeManager.getAttributesOnPosition(lineNumber, column)).embedMedia ;
    const mediaData_insertEmbedPicture  =  _.object(attributeManager.getAttributesOnPosition(lineNumber, column)).insertEmbedPicture ;
    const mediaData_insertEmbedVideo    =  _.object(attributeManager.getAttributesOnPosition(lineNumber, column)).insertEmbedVideo ;
    const mediaData_insertEmbedAudio    =  _.object(attributeManager.getAttributesOnPosition(lineNumber, column)).insertEmbedAudio ;

    if(mediaData_embedMedia         !== undefined) foundMediaOnLine = _.object(attributeManager.getAttributesOnPosition(lineNumber, column));
    if(mediaData_insertEmbedPicture !== undefined) foundMediaOnLine = _.object(attributeManager.getAttributesOnPosition(lineNumber, column));
    if(mediaData_insertEmbedVideo   !== undefined) foundMediaOnLine = _.object(attributeManager.getAttributesOnPosition(lineNumber, column));
    if(mediaData_insertEmbedAudio   !== undefined) foundMediaOnLine = _.object(attributeManager.getAttributesOnPosition(lineNumber, column));
    
  }
  return foundMediaOnLine;
};

const createHiddenDiv = (range) => {
  const content = range.cloneContents();
  const div = document.createElement('div');
  const hiddenDiv = $(div).html(content);
  return hiddenDiv;
};




const getTagsInSelection = (htmlObject) => {
  const tags = [];
  let tag;
  while ($(htmlObject)[0].localName !== 'div') {
    const html = $(htmlObject).prop('outerHTML');
    const stylingTagRegex = /<(b|i|u|s)>/.exec(html);
    tag = stylingTagRegex ? stylingTagRegex[1] : '';
    tags.push(tag);
    htmlObject = $(htmlObject).parent();
  }
  return tags;
};

const buildHtmlToCopyWhenSelectionHasOnlyText = (text, range) => {
  const htmlWithSpans = buildHtmlWithTwoSpanTags(text);

  const html = buildHtmlWithFormattingTagsOfSelection(htmlWithSpans, range);

  const htmlToCopy = $.parseHTML(`<div>${html}</div>`);
  return htmlToCopy;
};

const buildHtmlWithTwoSpanTags = (text) => {
  // text until before last char
  const firstSpan = `<span class="media">${text.slice(0, -1)}</span>`;
  const secondSpan = `<span class="media">${text.slice(-1)}</span>`; // last char

  return firstSpan + secondSpan;
};

const getLength = (line, rep) => {
  const nextLine = line + 1;
  const startLineOffset = rep.lines.offsetOfIndex(line);
  const endLineOffset = rep.lines.offsetOfIndex(nextLine);

  // lineLength without \n
  const lineLength = endLineOffset - startLineOffset - 1;

  return lineLength;
};

const buildHtmlWithFormattingTagsOfSelection = (html, range) => {
  const htmlOfParentNode = range.commonAncestorContainer.parentNode;
  console.log("htmlOfParentNode",htmlOfParentNode)
  const tags = getTagsInSelection(htmlOfParentNode);

  // this case happens when we got a selection with one or more styling (bold, italic, underline,
  // strikethrough) applied in all selection in the same range. For example,
  // <b><i><u>text</u></i></b>
  if (tags) {
    html = buildOpenTags(tags) + html + buildCloseTags(tags);
  }

  return html;
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
