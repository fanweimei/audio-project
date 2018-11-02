/**
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 *
 * @file utils.js
 * @author leeight
 */

import * as sdk from 'bce-sdk-js';
// import SparkMD5 from 'spark-md5';
import Queue from './queue';

/**
 * 把文件进行切片，返回切片之后的数组
 *
 * @param {Blob} file 需要切片的大文件.
 * @param {string} uploadId 从服务获取的uploadId.
 * @param {number} chunkSize 分片的大小.
 * @param {string} bucket Bucket Name.
 * @param {string} object Object Name.
 * @return {Array.<Object>}
 */
export function getTasks(file, uploadId, chunkSize, bucket, object) {
    var leftSize = file.size;
    var offset = 0;
    var partNumber = 1;

    var tasks = [];

    while (leftSize > 0) {
        var partSize = Math.min(leftSize, chunkSize);

        tasks.push({
            file: file,
            uploadId: uploadId,
            bucket: bucket,
            object: object,
            partNumber: partNumber,
            partSize: partSize,
            start: offset,
            stop: offset + partSize - 1
        });

        leftSize -= partSize;
        offset += partSize;
        partNumber += 1;
    }

    return tasks;
}

export function parseSize(size) {
    if (typeof size === 'number') {
        return size;
    }

    // mb MB Mb M
    // kb KB kb k
    // 100
    var pattern = /^([\d\.]+)([mkg]?b?)$/i;
    var match = pattern.exec(size);
    if (!match) {
        return 0;
    }

    var $1 = match[1];
    var $2 = match[2];
    if (/^k/i.test($2)) {
        return $1 * 1024;
    }
    else if (/^m/i.test($2)) {
        return $1 * 1024 * 1024;
    }
    else if (/^g/i.test($2)) {
        return $1 * 1024 * 1024 * 1024;
    }
    return +$1;
};

/**
 * 判断一下浏览器是否支持 xhr2 特性，如果不支持，就 fallback 到 PostObject
 * 来上传文件
 *
 * @return {boolean}
 */
export function isXhr2Supported() {
    // https://github.com/Modernizr/Modernizr/blob/f839e2579da2c6331eaad922ae5cd691aac7ab62/feature-detects/network/xhr2.js
    return 'XMLHttpRequest' in window && 'withCredentials' in new XMLHttpRequest();
};

/**
 * 规范化用户的输入
 *
 * @param {string} endpoint The endpoint will be normalized
 * @return {string}
 */
export function normalizeEndpoint(endpoint) {
    return endpoint.replace(/(\/+)$/, '');
};

export function getDefaultACL(bucket) {
    return {
        accessControlList: [
            {
                service: 'bce:bos',
                region: '*',
                effect: 'Allow',
                resource: [bucket + '/*'],
                permission: ['READ', 'WRITE']
            }
        ]
    };
};

/**
 * 生成uuid
 *
 * @return {string}
 */
export function uuid() {
    var random = (Math.random() * Math.pow(2, 32)).toString(36);
    var timestamp = new Date().getTime();
    return 'u-' + timestamp + '-' + random;
};

/**
 * 生成本地 localStorage 中的key，来存储 uploadId
 * localStorage[key] = uploadId
 *
 * @param {Object} option 一些可以用来计算key的参数.
 * @param {string} generator 内置的只有 default 和 md5
 * @return {Promise}
 */
export function generateLocalKey(option) {
    // if (generator === 'default') {
    return sdk.Q.resolve([
        option.blob.name, option.blob.size,
        option.chunkSize, option.bucket,
        option.object
    ].join('&'));
    // }
    // else if (generator === 'md5') {
    //     return exports.md5sum(option.blob).then(function (md5) {
    //         return [
    //             md5,
    //             option.blob.name,
    //             option.blob.size,
    //             option.chunkSize,
    //             option.bucket,
    //             option.object
    //         ].join('&');
    //     });
    // }
    // return sdk.Q.resolve(null);
}

/**
 * 基于 SparkMD5 来快速的计算 blob 的md5
 * 貌似直接使用 bce-sdk-js/src/crypto 里面的 md5blob，对于 300M 的文件，Chrome 直接
 * 挂掉了
 *
 * @param {Blob} file 需要计算md5的文件内容.
 * @return {Promise}
 */
// export function md5sum(file) {
//     var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
//     var chunkSize = 2097152;
//     var chunks = Math.ceil(file.size / chunkSize);
//     var currentChunk = 0;
//     var spark = new SparkMD5.ArrayBuffer();
//     var fileReader = new FileReader();

//     var deferred = sdk.Q.defer();

//     fileReader.onload = function (e) {
//         spark.append(e.target.result);
//         currentChunk++;

//         if (currentChunk < chunks) {
//             loadNext();
//         }
//         else {
//             deferred.resolve(spark.end());
//         }
//     };
//     fileReader.onerror = function (error) {
//         deferred.reject(error);
//     };

//     function loadNext() {
//         var start = currentChunk * chunkSize;
//         var end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;
//         fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
//     }
//     loadNext();

//     return deferred.promise;
// };

export function getDefaultPolicy(bucket) {
    if (bucket == null) {
        return null;
    }

    var now = new Date().getTime();

    // 默认是 24小时 之后到期
    var expiration = new Date(now + 24 * 60 * 60 * 1000);
    var utcDateTime = expiration.toISOString().replace(/\.\d+Z$/, 'Z');

    return {
        expiration: utcDateTime,
        conditions: [
            { bucket: bucket }
        ]
    };
};

/**
 * 根据key获取localStorage中的uploadId
 *
 * @param {string} key 需要查询的key
 * @return {string}
 */
export function getUploadId(key) {
    return localStorage.getItem(key);
};


/**
 * 根据key设置localStorage中的uploadId
 *
 * @param {string} key 需要查询的key
 * @param {string} uploadId 需要设置的uploadId
 */
export function setUploadId(key, uploadId) {
    localStorage.setItem(key, uploadId);
}

/**
 * 根据key删除localStorage中的uploadId
 *
 * @param {string} key 需要查询的key
 */
export function removeUploadId(key) {
    localStorage.removeItem(key);
};

/**
 * 取得已上传分块的etag
 *
 * @param {number} partNumber 分片序号.
 * @param {Array} existParts 已上传完成的分片信息.
 * @return {string} 指定分片的etag
 */
function getPartEtag(partNumber, existParts) {
    var matchParts = (existParts || []).filter(part => {
        return +part.partNumber === partNumber;
    });
    return matchParts.length ? matchParts[0].eTag : null;
}

/**
 * 因为 listParts 会返回 partNumber 和 etag 的对应关系
 * 所以 listParts 返回的结果，给 tasks 中合适的元素设置 etag 属性，上传
 * 的时候就可以跳过这些 part
 *
 * @param {Array.<Object>} tasks 本地切分好的任务.
 * @param {Array.<Object>} parts 服务端返回的已经上传的parts.
 */
export function filterTasks(tasks, parts) {
    tasks.forEach(task => {
        var partNumber = task.partNumber;
        var etag = getPartEtag(partNumber, parts);
        if (etag) {
            task.etag = etag;
        }
    });
};

export function isBlob(body) {
    var blobCtor = null;

    if (typeof Blob !== 'undefined') {
        // Chrome Blob === 'function'
        // Safari Blob === 'undefined'
        blobCtor = Blob;
    }
    else if (typeof mOxie == 'function') {
        blobCtor = mOxie.Blob;
    }
    else {
        return false;
    }

    return body instanceof blobCtor;
}

export function now() {
    return new Date().getTime();
};

export function eachLimit(tasks, taskParallel, executer, done) {
    var runningCount = 0;
    var aborted = false;
    var fin = false;      // done 只能被调用一次.
    var queue = new Queue(tasks);

    function infiniteLoop() {
        var task = queue.dequeue();
        if (!task) {
            return;
        }

        runningCount++;
        executer(task, function (error) {
            runningCount--;

            if (error) {
                // 一旦有报错，终止运行
                aborted = true;
                fin = true;
                done(error);
            }
            else {
                if (!queue.isEmpty() && !aborted) {
                    // 队列还有内容
                    setTimeout(infiniteLoop, 0);
                }
                else if (runningCount <= 0) {
                    // 队列空了，而且没有运行中的任务了
                    if (!fin) {
                        fin = true;
                        done();
                    }
                }
            }
        });
    }

    taskParallel = Math.min(taskParallel, queue.size());
    for (var i = 0; i < taskParallel; i++) {
        infiniteLoop();
    }
}


export function guessContentType(file, opt_ignoreCharset) {
    var contentType = file.type;
    if (!contentType) {
        var object = file.name;
        var ext = object.split(/\./g).pop();
        contentType = sdk.MimeType.guess(ext);
    }

    // Firefox在POST的时候，Content-Type 一定会有Charset的，因此
    // 这里不管3721，都加上.
    if (!opt_ignoreCharset && !/charset=/.test(contentType)) {
        contentType += '; charset=UTF-8';
    }

    return contentType;
}
