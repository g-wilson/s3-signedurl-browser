A command-line tool to that provides an interactive way to get signed S3 URLs for every object in a directory.

Imagine you have 20 files in a directory in S3. The bucket is private. You want to share them with someone unauthenticated.

S3 provides [pre-signed URLs](http://docs.aws.amazon.com/AmazonS3/latest/dev/ShareObjectPreSignedURL.html) which can be used as temporary-use tokens for accessing objects.

This tool can help you generate them with minimum fuss.

### Requirements

Node.js v6.9.0+

### Installation

`$ npm i -g s3-signedurl-browser`

### Usage

`$ s3-signedurl-browser` and follow the steps...

