
# Insert media plugin

Insert media like `audio` / `video` / `stream` / `youtube` / `vimeo` and ... to your pad.

## Demo

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/0zi4EGQdZyE/0.jpg)](https://www.youtube.com/watch?v=0zi4EGQdZyE)

# Inastraltion

In the root of the project, Run the following command:

```bash
npm install --no-save --legacy-peer-deps "https://github.com/samirsayyad/ep_insert_media.git#main"
```

# Settings

This plugin has some settings that you have set to global settings before starting;
The media will default persist to the local machine in the `./temp` directory.
If you will (Which we highly recommend), please set `persistToLocal` to `false` and use a storage service like [Amazon.S3](https://aws.amazon.com/s3/) or [Digitalocean](https://www.digitalocean.com/products/spaces)

```Json
-----
"ep_insert_media": {
  "persistToLocal": true,
  "s3Storage": {
    // need for s3 upload,
    "endpoint": "${BUCKET_S3_SERVER:https://...}",
    // need for s3 upload
    "accessKeyId": "${ACCESS_ID:accessKeyId}",
    // need for s3 upload
    "secretAccessKey": "${ACCESS_SECRET:AccessKey}",
    "region": "UK",
     // space/bucket name
    "bucket": "${MEDIA_BUCKET_NAME:docsplus}",
    // use for folder strucre
    "branch": "${BRANCH_NAME:dev}"
  },
  // maximum file size that a user can upload
  "maxFileSize": 50000000
}
-----
```

The Storage strategy loads the media with the following hierarchical folder structure:

```js
{brach}/{padId}/{fileName}.{format}
```

- The **branch** is the state of your application, the standard state of an application is like **dev**, **stage**, **prod**.

- The **padId** is a pad unique name.
- The **fileName** which is a UUID with the **format** of the media.

# Develop and Contribute

Development, you can set `persistToLocal` to `true`; This will upload/persist the media into the local machine. (The `express-fileupload` library handles the files uploading)

This plugin uses the `@aws-sdk/client-s3` library in order to connect to any provider that gives you the `S3` storage.

In case of minimizing the code and using the `ES6+`, the plugin uses the `rollup.js`; so when you are in the development mode, you have to run this command:

> `npm run rollup:watch`

Also, we have the `rollup:build` command for the build command.

*Before pushing your changes which we'll be thrilled about, please use Eslint to reduce the linting problems. To achieve this step, you can run the following command:*

> `npm run lint:fix`



## LICENSE

Apache 2.0
