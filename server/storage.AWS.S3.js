const settings = require('ep_etherpad-lite/node/utils/Settings');
const {PutObjectCommand, GetObjectCommand, S3} = require('@aws-sdk/client-s3');
const {
  accessKeyId,
  secretAccessKey,
  endpoint,
  region,
  bucket,
  branch,
} = settings.ep_insert_media.s3Storage;

const s3Client = new S3({
  endpoint,
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});


// Uploads the specified file to the chosen path.
/**
 *
 * @param {String} padId pad name @example demopad
 * @param {String} fileName file name with extention/format @example myimage.png
 * @param {Buffer} fileContent  file as a buffer
 * @returns {Promis Object}
 */
exports.upload = (padId, fileName, fileContent) => {
  try {
    // The path of the file to be uploaded.
    // eg: main/demo/image.jpg
    // eg: dev/test/video.jpg
    const Key = `${branch}/${padId}/${fileName}`;

    const bucketParams = {
      Bucket: bucket,
      Key,
      Body: fileContent,
      signatureVersion: 'v4',
    };

    const objectCommand = new PutObjectCommand(bucketParams);
    return s3Client.send(objectCommand);
  } catch (err) {
    console.error('AWS.S3 upload: check your configuration', err);
  }
};

/**
 *
 * @param {String} padId
 * @param {String} fileName
 * @returns {Promis object}
 */
exports.get = async (padId, fileName, res) => {
  const Key = `${branch}/${padId}/${fileName}`;
  // Specifies a path within your Space and the file to download.
  const bucketParams = {
    Bucket: bucket,
    Key,
  };

  const response = await s3Client.send(new GetObjectCommand(bucketParams))
      .catch((err) => {
        console.error('AWS.S3 get', err);
      });

  return response.Body.pipe(res);
};
