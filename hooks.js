var path = require('path'), 
    eejs = require("ep_etherpad-lite/node/eejs");
    Busboy = require('busboy');
    StreamUpload = require('stream_upload');
    uuid = require('uuid');
    path = require('path');
    mimetypes = require('mime-db');
    url = require('url');
    settings = require('ep_etherpad-lite/node/utils/Settings');
    Minio = require('minio');
 
exports.eejsBlock_editbarMenuLeft = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_insert_media/templates/editbarButtons.ejs", {}, module);
  return cb();
}

exports.eejsBlock_body = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_insert_media/templates/modals.ejs", {}, module);
  return cb();
}

exports.eejsBlock_scripts = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_insert_media/templates/scripts.ejs", {}, module);
  return cb();
}

exports.eejsBlock_styles = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_insert_media/templates/styles.ejs", {}, module);
  return cb();
}

exports.expressConfigure = async function (hookName, context) {


  context.app.post('/p/:padId/pluginfw/ep_insert_media/upload', function (req, res, next) {
    console.log(settings)
    var padId = req.params.padId;
    var storageConfig = settings.ep_insert_media.storage;

    if (settings.ep_insert_media.storage.type =="min.io"){
        var minioClient = new Minio.Client({
            endPoint: settings.ep_insert_media.storage.endPoint, 
            //port: settings.ep_insert_media.storage.port,
            useSSL: settings.ep_insert_media.storage.useSSL,
            accessKey: settings.ep_insert_media.storage.accessKeyId,
            secretKey: settings.ep_insert_media.storage.secretAccessKey
        });
        // var minioClient = new Minio.Client({
        //     url: 'https://78.46.16.197:9000',
        //     accessKey: settings.ep_insert_media.storage.accessKeyId,
        //     secretKey: settings.ep_insert_media.storage.secretAccessKey
        //   })
    }else{
        var imageUpload = new StreamUpload({
            extensions: settings.ep_insert_media.fileTypes,
            maxSize: settings.ep_insert_media.maxFileSize,
            baseFolder: settings.ep_insert_media.storage.baseFolder,
            storage: settings.ep_insert_media.storage
          });
  
          
    }





    if (storageConfig) {
        try {
            var busboy = new Busboy({
                headers: req.headers,
                limits: {
                    fileSize: settings.ep_insert_media.maxFileSize
                }
            });
        } catch (error) {
            console.error('ep_insert_media ERROR', error);

            return next(error);
        }

        var isDone;
        var done = function (error) {
            if (error) {
                console.error('ep_insert_media UPLOAD ERROR', error);

                return;
            }

            if (isDone) return;
            isDone = true;

            res.status(error.statusCode || 500).json(error);
            req.unpipe(busboy);
            drainStream(req);
            busboy.removeAllListeners();
        };

        var uploadResult;
        var newFileName = uuid.v4();
        var accessPath = '';
        busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
            var savedFilename = path.join(padId, newFileName + path.extname(filename));

            if (storageConfig && settings.ep_insert_media.storage.type === 'local') {
                var baseURL = settings.ep_insert_media.storage.baseURL;
                if (baseURL.charAt(baseURL.length - 1) !== '/') {
                    baseURL += '/';
                }
                accessPath = url.resolve(settings.ep_insert_media.storage.baseURL, savedFilename);
                savedFilename = path.join(settings.ep_insert_media.storage.baseFolder, savedFilename);
            }
            file.on('limit', function () {
                var error = new Error('File is too large');
                error.type = 'fileSize';
                error.statusCode = 403;
                busboy.emit('error', error);
                imageUpload.deletePartials();
            });
            file.on('error', function (error) {
                busboy.emit('error', error);
            });

            if (settings.ep_insert_media.storage.type =="min.io"){
                // Using fPutObject API upload your file to the bucket europetrip.
                
                // minioClient.putObject("samir", savedFilename,file, function(err, etag) {
                //     if (err) console.log(err)
                //     console.log('File uploaded successfully.',etag,err)
                //     return res.status(201).json("val")
                //   });
               
                minioClient.makeBucket(settings.ep_insert_media.storage.bucket, 'us-east-1', function(err) {
                    if (err) return console.log("error",err)
                
                    console.log('Bucket created successfully in "us-east-1".')
                
                    var metaData = {
                        'Content-Type': 'application/octet-stream',
                        'X-Amz-Meta-Testing': 1234,
                        'example': 5678
                    }
                    // Using fPutObject API upload your file to the bucket europetrip.
                    minioClient.fPutObject(settings.ep_insert_media.storage.bucket,savedFilename, file, metaData, function(err, etag) {
                      if (err) return console.log("error",err)
                      console.log('File uploaded successfully.')
                      return res.status(201).json(etag)
                    });
                });

            }else{

                uploadResult = imageUpload
                .upload(file, {type: mimetype, filename: savedFilename});
                busboy.on('error', done);
                busboy.on('finish', function () {
                if (uploadResult) {
                    uploadResult
                        .then(function (data) {
    
                            if (accessPath) {
                                data = accessPath;
                            }
    
                            return res.status(201).json(data);
                        })
                        .catch(function (err) {
                            return res.status(500).json(err);
                        });
                }
    
            });
            }
            

        });

       
        req.pipe(busboy);
    }












        
        

  })
}