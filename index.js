#!/usr/bin/env node
'use strict'

const _ = require('lodash')
const AWS = require('aws-sdk')
const inquirer = require('inquirer')
const chalk = require('chalk')

const s3 = new AWS.S3()

let Bucket, objects

function go() {
  return s3.listBuckets().promise()
    .then(data => _.map(data.Buckets, 'Name'))
    .then(buckets => inquirer.prompt({
      type: 'list',
      name: 'bucket',
      message: 'Choose a bucket',
      choices: buckets,
    }))
    .then(({ bucket }) => {
      Bucket = bucket
      return s3.headBucket({ Bucket }).promise()
    })
    .then(() => s3.listObjects({ Bucket, Delimiter: '/' }).promise())
    .then(walkDirectories)
    .then(o => {
      objects = o
      return inquirer.prompt({
        type: 'input',
        name: 'ttl',
        message: 'How long (in seconds) should the link(s) be available?',
        default: 3600,
        validate(val) {
          return !Number.isNaN(val) && parseInt(val, 10) > 0
        },
      })
    })
    .then(({ ttl }) => objects.map(Key => {
      return s3.getSignedUrl('getObject', { Bucket, Key, Expires: parseInt(ttl, 10) })
    }))
    .then(urls => urls.forEach(s => process.stdout.write(`${s}\n`)))
}

const walkDirectories = function (data) {
  const subfolders = _.map(data.CommonPrefixes, 'Prefix')
  const objects = _.map(data.Contents, 'Key').filter(k => k[k.length - 1] !== '/')
  const choices = subfolders.slice(0)

  if (data.Prefix) choices.unshift('< back one level >')
  if (objects.length > 0) choices.unshift('< choose this directory >')

  let message = `This directory has ${objects.length} file(s).`

  if (subfolders.length) {
    message += ' Choose a sub-directory?'
  }

  return inquirer.prompt({
    type: 'list',
    name: 'folder',
    message,
    choices,
  }).then(({ folder }) => {
    if (folder === '< choose this directory >') {
      return objects
    }
    else if (folder === '< back one level >') {
      let dest = data.Prefix.split('/')
      dest = dest.slice(0, dest.length - 2).join('/')
      if (dest) dest += '/'
      return s3.listObjectsAsync({ Bucket, Delimiter: '/', Prefix: dest }).then(walkDirectories)
    }
    else {
      return s3.listObjectsAsync({ Bucket, Delimiter: '/', Prefix: folder }).then(walkDirectories)
    }
  })
}

go().then(() => process.exit(), console.error)
