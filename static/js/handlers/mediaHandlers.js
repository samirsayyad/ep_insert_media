'use strict';
const randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;

const cleanEmbedAudioCode = (orig, mediaData) => {
  const value = $.trim(orig);
  return `<audio class="audioClass ep_insert_media_${mediaData.size} ep_insert_media_${mediaData.align}" controls><source src="${value}" type="audio/mpeg"></video>`;
};

const cleanEmbedVideoCode = (orig, mediaData) => {
  const value = $.trim(orig);
  return `<video class="videoClass ep_insert_media_${mediaData.size} ep_insert_media_${mediaData.align}" controls><source src="${value}" type="video/mp4"></video>`;
};
const cleanEmbedPictureCode = (orig, align, size) => {
  const value = $.trim(orig);
  return `<img class='embedRemoteImage ep_insert_media_${align} ep_insert_media_${size}' src='${value}'>`;
};

const parseUrlParams = (url) => {
  const res = {};
  url.split('?')[1].split('&').map((item) => {
    item = item.split('=');
    res[item[0]] = item[1];
  });
  return res;
};


const cleanEmbedCode = (orig, mediaData) => {
  const separatedUrl = new URL(orig);
  switch (separatedUrl.host) {
    case 'www.youtube.com':
    case 'youtube.com':
    case 'youtu.be':
    case 'www.youtu.be':
      return `<iframe  type="text/html"   class="video ep_insert_media_${mediaData.size}
       ep_insert_media_${mediaData.align}"  src="https://www.youtube.com/embed/${parseUrlParams(orig).v}?enablejsapi=1&origin=https://docs.plus"
       frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    case 'vimeo.com':
    case 'www.vimeo.com':
      return `<iframe   class="video" src="http://player.vimeo.com/video${separatedUrl.pathname}?color=ffffff"
       frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>`;
    default:
      return '<img src=\'/static/plugins/ep_insert_media/static/html/invalid.png\'>';
  }
};

const embedMedia = (cls, mediaData) => {
  let height = '175';
  if (mediaData.size === 'Medium') {
    height = '350';
  }
  if (mediaData.size === 'Large') {
    height = '540';
  }
  return [{cls, extraOpenTags: `<samdiv style='height:${
    height}px' id='emb_embedMedia-${randomString(16)}' class='embedMedia'><samdiv class='media'>${
    cleanEmbedCode(unescape(mediaData.url), mediaData)}</samdiv><samdiv class='character'>`, extraCloseTags: '</samdiv>'}];
};
const insertEmbedPicture = (cls, mediaData) => [{cls,
  extraOpenTags: `<samdiv data-size='${mediaData.size}' data-align='${mediaData.align
  }' data-url='${unescape(mediaData.url)}' id='emb_img-${randomString(16)}' class='embedRemoteImageSpan'><samdiv class='image'>${cleanEmbedPictureCode(unescape(mediaData.url), mediaData.align, mediaData.size)
  }</samdiv><samdiv class='character'>`, extraCloseTags: '</samdiv>'}];

const insertEmbedVideo = (cls, mediaData) => {
  [{cls, extraOpenTags: `<samdiv data-url='${unescape(mediaData.url)}' id='emb_video-${randomString(16)}' class='embedRemoteVideoSpan'><samdiv class='video'>${cleanEmbedVideoCode(unescape(mediaData.url), mediaData)}</samdiv><samdiv class='character'>`, extraCloseTags: '</samdiv>'}];
};
const insertEmbedAudio = (cls, mediaData) => {
  [{cls, extraOpenTags: `<samdiv data-url='${unescape(mediaData.url)}' id='emb_audio-${randomString(16)}' class='embedRemoteAudioSpan'><samdiv class='audio'>${cleanEmbedAudioCode(unescape(mediaData.url), mediaData)}</samdiv><samdiv class='character'>`, extraCloseTags: '</samdiv>'}];
};

module.exports = {
  embedMedia,
  insertEmbedPicture,
  insertEmbedVideo,
  insertEmbedAudio,
};
