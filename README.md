
# Insert media plugin
It will upload / add media ( audio / video / stream / youtube / vimeo ) to pad.

## Demo

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/0zi4EGQdZyE/0.jpg)](https://www.youtube.com/watch?v=0zi4EGQdZyE)

## Installing
npm install ep_insert_media

or Use the Etherpad ``/admin`` interface.

## Settings
    "ep_insert_media":{
      "persistToLocal": false
      "storage":{
        "endPoint" : "${BUCKET_S3_SERVER:null}",// need for s3 upload
        "useSSL" : true ,// need for s3 upload
        "type": "s3", // put whatever except s3 for upload local
        "accessKeyId": "${ACCESS_KEY_ID:null}",// need for s3 upload
        "secretAccessKey": "${ACCESS_KEY_SECRET:null}",// need for s3 upload
        "region": "UK",// need for s3 upload
        "bucket": "${MEDIA_BUCKET_NAME}", // need for s3 upload
        "baseFolder": "${FOLDER_PATH:./}" // need just for local uploading
      },
      "fileTypes": ["jpeg", "jpg", "bmp", "gif","png","webm","mp4","m4v","mp3",
        "ogg", "m4a","flac","wav","wma", "aac"  ],
      "maxFileSize": 50000000
    },

## LICENSE
Apache 2.0
