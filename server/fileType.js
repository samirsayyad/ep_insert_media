const isImage = (filename) => {
  switch (filename.toLowerCase()) {
    case 'jpg':
    case 'gif':
    case 'bmp':
    case 'png':
    case 'jpeg':

      // etc
      return true;
  }
  return false;
};

const isVideo = (filename) => {
  switch (filename.toLowerCase()) {
    case 'm4v':
    case 'avi':
    case 'mpg':
    case 'mp4':
    case 'webm':

      // etc
      return true;
  }
  return false;
};

const isAudio = (filename) => {
  switch (filename.toLowerCase()) {
    case 'mp3':
    case 'ogg':
    case 'm4a':
    case 'flac':
    case 'wav':
    case 'wma':
    case 'aac':

      // etc
      return true;
  }
  return false;
};

exports.extractFileType = (fileExtention) => {
  fileExtention = fileExtention.toLowerCase(fileExtention);
  let result = 'unknown';
  if (isImage(fileExtention)) result = 'image';
  if (isVideo(fileExtention)) result = 'video';
  if (isAudio(fileExtention)) result = 'audio';

  return result;
};
