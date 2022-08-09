const randomString = (len) => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let randomstring = '';
  len = len || 20;
  for (let i = 0; i < len; i++) {
    const rnum = Math.floor(Math.random() * chars.length);
    randomstring += chars.substring(rnum, rnum + 1);
  }
  return randomstring;
};


const cleanEmbedAudioCode = (orig, mediaData) => {
  const value = $.trim(orig);
  const {size, align} = mediaData;
  return `
    <audio class="audioClass ep_insert_media_${size} ep_insert_media_${align}" controls>
      <source src="${value}" type="audio/mpeg">
    </video>
  `;
};

const cleanEmbedVideoCode = (orig, mediaData) => {
  const value = $.trim(orig);
  const {size, align} = mediaData;
  return `
    <video class="videoClass ep_insert_media_${size} ep_insert_media_${align}" controls>
      <source src="${value}" type="video/mp4">
    </video>
  `;
};
const cleanEmbedPictureCode = (orig, align, size) => {
  const value = $.trim(orig);
  const cls = `embedRemoteImage ep_insert_media_${align} ep_insert_media_${size}`;
  return `<img  loading='auto' class='${cls}' src='${value}'>`;
};

const cleanEmbedSvgCode = (orig, align, size) => {
  const value = $.trim(orig);
  const csl = `embedRemoteImage ep_insert_media_${align} ep_insert_media_${size}`;
  let height = '175';
  if (size === 'Medium') {
    height = '350';
  } else if (size === 'Large') {
    height = '540';
  }
  return `
  <object
    loading='lazy'
    data='${value}'
    class='${csl}'
    type="image/svg+xml"
    id="alphasvg"
    width="${height}"
    height="${height}"
  >
  </object>`;
  // <img class='embedRemoteImage ep_insert_media_${align} ep_insert_media_${size}' src='${value}'>
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
      return `
        <iframe
          type="text/html"
          class="video ep_insert_media_${mediaData.size} ep_insert_media_${mediaData.align}"
          src="https://www.youtube.com/embed/${parseUrlParams(orig).v}?enablejsapi=1&origin=https://docs.plus"
          frameborder="0"
          allow="accelerometer; autoplay;encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        >
        </iframe>`;
    case 'vimeo.com':
    case 'www.vimeo.com':
      return `<iframe   class="video" src="http://player.vimeo.com/video${separatedUrl.pathname}?color=ffffff"
       frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>`;
    default:
      return '<img loading="lazy" src="/static/plugins/ep_insert_media/static/html/invalid.png">';
  }
};

export const embedMedia = (cls, mediaData) => {
  let height = '175';
  if (mediaData.size === 'Medium') {
    height = '350';
  } else if (mediaData.size === 'Large') {
    height = '540';
  }

  const tag = `
    <samdiv style='height:${height}px' id='emb_embedMedia-${randomString(16)}' class='embedMedia'>
      <samdiv class='media'>
        ${cleanEmbedCode(unescape(mediaData.url), mediaData)}
      </samdiv>
    <samdiv class='character'>`;

  return [{cls, extraOpenTags: tag, extraCloseTags: '</samdiv>'}];
};

export const insertEmbedPicture = (cls, {size, align, url}) => {
  const picTag = `
  <samdiv
    data-size='${size}'
    data-align='${align}'
    data-url='${unescape(url)}'
    id='emb_img-${randomString(16)}'
    class='embedRemoteImageSpan'
  >
    <samdiv class='image'>
      ${cleanEmbedPictureCode(unescape(url), align, size)}
    </samdiv>
  <samdiv class='character'>`;

  return [{cls, extraOpenTags: picTag, extraCloseTags: '</samdiv>'}];
};

export const insertEmbedVideo = (cls, mediaData) => {
  const url = mediaData.url;

  const videoTag = `
    <samdiv
      data-url='${unescape(url)}'
      id='emb_video-${randomString(16)}'
      class='embedRemoteVideoSpan'
    >
      <samdiv class='video'>
        ${cleanEmbedVideoCode(unescape(url), mediaData)}
      </samdiv>
    <samdiv class='character'>
  `;

  return [{cls, extraOpenTags: videoTag, extraCloseTags: '</samdiv>'}];
};

export const insertEmbedAudio = (cls, mediaData) => {
  const url = mediaData.url;
  const audioTag = `
    <samdiv
      data-url='${unescape(url)}'
      id='emb_audio-${randomString(16)}'
      class='embedRemoteAudioSpan'
    >
      <samdiv class='audio'>
        ${cleanEmbedAudioCode(unescape(url), mediaData)}
      </samdiv>
    <samdiv class='character'>`;

  return [{cls, extraOpenTags: audioTag, extraCloseTags: '</samdiv>'}];
};

export const insertMediaLoading = (cls, mediaData) => {
  const spinnerAddress = '/static/plugins/ep_insert_media/static/images/spinner.svg';
  const svg = cleanEmbedSvgCode(spinnerAddress, mediaData.align, mediaData.size);
  const loadingTag = `
    <samdiv
      data-size='${mediaData.size}'
      data-align='${mediaData.align}'
      data-url='/static/plugins/ep_insert_media/static/images/loading.gif'
      id='media_loading'
      class='embedRemoteImageSpan'
    >
      <samdiv class='image'>
        ${svg}
      </samdiv>
    <samdiv class='character'>
  `;
  return [{cls,
    extraOpenTags: loadingTag, extraCloseTags: '</samdiv>'}];
};
