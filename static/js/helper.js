export const isImage = (filename) => {
  switch (filename.toLowerCase()) {
    case '.jpg':
    case '.gif':
    case '.bmp':
    case '.png':
      // etc
      return true;
  }
  return false;
};

export const isVideo = (filename) => {
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
