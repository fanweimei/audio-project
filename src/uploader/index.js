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
 * @file uploader.js
 * @author leeight
 */
import axios from 'axios';
import * as sdk from 'bce-sdk-js';
// var u = require('underscore');
// var debug = require('debug')('bce-bos-uploader');

import * as utils from './utils';
import * as tracker from './tracker';
import events from './events';
import kDefaultOptions from './config';
import MultipartTask from './multipart_task';
import PutObjectTask from './put_object_task';
import StsTokenManager from './sts_token_manager';
import PolicyManager from './policy_manager';
import NetworkInfo from './network_info';

/**
 * BCE BOS Uploader
 *
 * @constructor
 * @param {Object|string} options 配置参数
 */

class Uploader {
    constructor(options) {
        this.options = { ...kDefaultOptions, ...options };
        this.options.max_file_size = utils.parseSize(this.options.max_file_size);
        this.options.bos_multipart_min_size
            = utils.parseSize(this.options.bos_multipart_min_size);
        this.options.chunk_size = utils.parseSize(this.options.chunk_size);

        var credentials = this.options.bos_credentials;
        if (!credentials && this.options.bos_ak && this.options.bos_sk) {
            this.options.bos_credentials = {
                ak: this.options.bos_ak,
                sk: this.options.bos_sk
            };
        }

        /**
         * @type {sdk.BosClient}
         */
        this.client = new sdk.BosClient({
            endpoint: utils.normalizeEndpoint(this.options.bos_endpoint),
            credentials: this.options.bos_credentials,
            sessionToken: this.options.uptoken
        });

        /**
         * 需要等待上传的文件列表，每次上传的时候，从这里面删除
         * 成功或者失败都不会再放回去了
         * @param {Array.<File>}
         */
        this._files = [];

        /**
         * 正在上传的文件列表.
         *
         * @type {Object.<string, File>}
         */
        this._uploadingFiles = {};

        /**
         * 是否被中断了，比如 this.stop
         * @type {boolean}
         */
        this._abort = false;

        /**
         * 是否处于上传的过程中，也就是正在处理 this._files 队列的内容.
         * @type {boolean}
         */
        this._working = false;

        this._policyManager = null;
        this._networkInfo = new NetworkInfo();

        this._init();
    }

    /**
     * 调用 this.options.init 里面配置的方法
     * @param {string} methodName 方法名称
     * @param {Array.<*>} args 调用时候的参数.
     * @param {boolean=} throwErrors 如果发生异常的时候，是否需要抛出来
     * @return {*} 事件的返回值.
     */
    _invoke(methodName, args, throwErrors) {
        var init = this.options.init || this.options.Init;
        if (!init) {
            return;
        }

        var method = init[methodName];
        if (typeof method !== 'function') {
            return;
        }

        try {
            var up = null;
            args = args == null ? [up] : [up].concat(args);
            return method.apply(null, args);
        }
        catch (ex) {
            console.error('%s(%j) -> %s', methodName, args, ex);
            if (throwErrors === true) {
                return sdk.Q.reject(ex);
            }
        }
    }

    _initEvents() {
        this.client.on('progress', this._onUploadProgress.bind(this));
        // XXX 必须绑定 error 的处理函数，否则会 throw new Error
        this.client.on('error', this._onError.bind(this));
    }

    _onError(e) {
        console.error(e);
    }

    _getCustomizedSignature(uptokenUrl) {
        var options = this.options;
        var timeout = options.uptoken_timeout || options.uptoken_jsonp_timeout;
        var viaJsonp = options.uptoken_via_jsonp;

        return function (_, httpMethod, path, params, headers) {
            if (/\bed=([\w\.]+)\b/.test(location.search)) {
                headers.Host = RegExp.$1;
            }

            if (Array.isArray(options.auth_stripped_headers)) {
                headers = { ...headers };
                options.auth_stripped_headers.forEach(prop => {
                    delete headers[prop];
                });
            }
            var deferred = sdk.Q.defer();
            axios({
                url: uptokenUrl,
                jsonp: viaJsonp ? 'callback' : false,
                dataType: viaJsonp ? 'jsonp' : 'json',
                timeout: timeout,
                data: {
                    httpMethod: httpMethod,
                    path: path,
                    // delay: ~~(Math.random() * 10),
                    queries: JSON.stringify(params || {}),
                    headers: JSON.stringify(headers || {})
                }
            }).then((payload) => {
                if (payload.statusCode === 200 && payload.signature) {
                    deferred.resolve(payload.signature, payload.xbceDate);
                }
                else {
                    deferred.reject(new Error('createSignature failed, statusCode = ' + payload.statusCode));
                }
            }).catch(() => {
                deferred.reject(new Error('Get authorization timeout (' + timeout + 'ms).'));
            });
            return deferred.promise;
        };
    }

    /**
     * 初始化控件.
     */
    _init() {
        var options = this.options;
        if (options.tracker_id) {
            tracker.init(options.tracker_id);
        }
        var promise = options.bos_credentials
            ? sdk.Q.resolve()
            : this.refreshStsToken();
        promise.then(() => {
            if (options.bos_credentials) {
                this.client.createSignature = function (_, httpMethod, path, params, headers) {
                    var credentials = _ || this.config.credentials;
                    return sdk.Q.fcall(function () {
                        var auth = new sdk.Auth(credentials.ak, credentials.sk);
                        return auth.generateAuthorization(httpMethod, path, params, headers);
                    });
                };
            }
            else if (options.uptoken_url && options.get_new_uptoken === true) {
                // 服务端动态签名的方式
                this.client.createSignature = this._getCustomizedSignature(options.uptoken_url);
            }
            this._initEvents();
            this._invoke(events.kPostInit);
            this._policyManager = new PolicyManager(options);
        }).catch(error => {
            console.log(11);
            console.error(error);
            this._invoke(events.kError, [error]);
        });
    }

    _filterFiles(candidates) {

        // 如果 maxFileSize === 0 就说明不限制大小
        var maxFileSize = this.options.max_file_size;

        var files = candidates.filter(file => {
            if (maxFileSize > 0 && file.size > maxFileSize) {
                this._invoke(events.kFileFiltered, [file]);
                return false;
            }

            // TODO
            // 检查后缀之类的

            return true;
        });

        return this._invoke(events.kFilesFilter, [files]) || files;
    }
    /**
     * 添加文件 与input type="file" 的change事件绑定
     * @param {*} e 
     */
    addFiles(e) {
        var files = e.target.files;
        if (Array.from) {
            files = Array.from(files);
        } else {
            var arr = [];
            Object.keys(files).forEach(key => {
                if (typeof files[key] == 'object') {
                    arr.push(files[key]);
                }
            });
            files = arr;
        }
        files = this._filterFiles(files);
        if (Array.isArray(files) && files.length) {
            if (this.options.max_selected_size > 0 && files.length > this.options.max_selected_size) {
                files = files.slice(0, this.options.max_selected_size);
            }
            this._networkInfo.totalBytes += files.reduce((previous, item) => {
                // 这里是 abort 的默认实现，开始上传的时候，会改成另外的一种实现方式
                // 默认的实现是为了支持在没有开始上传之前，也可以取消上传的需求
                item.abort = () => {
                    item._aborted = true;
                    this._invoke(events.kAborted, [null, item]);
                };

                // 内部的 uuid，外部也可以使用，比如 remove(item.uuid) / remove(item)
                item.uuid = utils.uuid();

                return previous + item.size;
            }, 0);
            this._files.push.apply(this._files, files);
            this._invoke(events.kFilesAdded, [files]);
        }

        if (this.options.auto_start) {
            this.start();
        }
    }


    /**
     * 处理上传进度的回掉函数.
     * 1. 这里要区分文件的上传还是分片的上传，分片的上传是通过 partNumber 和 uploadId 的组合来判断的
     * 2. IE6,7,8,9下面，是不需要考虑的，因为不会触发这个事件，而是直接在 _sendPostRequest 触发 kUploadProgress 了
     * 3. 其它情况下，我们判断一下 Request Body 的类型是否是 Blob，从而避免对于其它类型的请求，触发 kUploadProgress
     *    例如：HEAD，GET，POST(InitMultipart) 的时候，是没必要触发 kUploadProgress 的
     *
     * @param {Object} e  Progress Event 对象.
     * @param {Object} httpContext sendHTTPRequest 的参数
     */
    _onUploadProgress(e, httpContext) {
        var args = httpContext.args;
        var file = args.body;

        if (!utils.isBlob(file)) {
            return;
        }

        var progress = e.lengthComputable
            ? e.loaded / e.total
            : 0;

        this._networkInfo.loadedBytes += (e.loaded - file._previousLoaded);
        this._invoke(events.kNetworkSpeed, this._networkInfo.dump());
        file._previousLoaded = e.loaded;

        var eventType = events.kUploadProgress;
        if (args.params.partNumber && args.params.uploadId) {
            // IE6,7,8,9下面不会有partNumber和uploadId
            // 此时的 file 是 slice 的结果，可能没有自定义的属性
            // 比如 demo 里面的 __id, __mediaId 之类的
            eventType = events.kUploadPartProgress;
        }

        this._invoke(eventType, [file, progress, e]);
    }

    remove(item) {
        if (typeof item === 'string') {
            item = this._uploadingFiles[item] || this.files.find(file => {
                return file.uuid === item;
            });
        }
        if (item && typeof item.abort === 'function') {
            item.abort();
        }
    }

    dispatchEvent(eventName, eventArguments, throwErrors) {
        if (eventName === events.kAborted
            && eventArguments
            && eventArguments[1]) {
            var file = eventArguments[1];
            if (file.size > 0) {
                var loadedSize = file._previousLoaded || 0;
                this._networkInfo.totalBytes -= (file.size - loadedSize);
                this._invoke(events.kNetworkSpeed, this._networkInfo.dump());
            }
        }
        return this._invoke(eventName, eventArguments, throwErrors);
    }

    start() {
        var self = this;

        if (this._working) {
            return;
        }

        if (this._files.length) {
            this._working = true;
            this._abort = false;
            this._networkInfo.reset();

            var taskParallel = this.options.bos_task_parallel;
            utils.eachLimit(this._files, taskParallel,
                function (file, callback) {
                    file._previousLoaded = 0;
                    self._uploadNext(file).fin(function () {
                        delete self._uploadingFiles[file.uuid];
                        callback(null, file);
                    });
                },
                function (error) {
                    self._working = false;
                    self._files.length = 0;
                    self._networkInfo.totalBytes = 0;
                    self._invoke(events.kUploadComplete);
                });
        }
    }

    _uploadNext(file) {
        if (this._abort) {
            this._working = false;
            return sdk.Q.resolve();
        }

        if (file._aborted === true) {
            return sdk.Q.resolve();
        }

        var throwErrors = true;
        var returnValue = this._invoke(events.kBeforeUpload, [file], throwErrors);
        if (returnValue === false) {
            return sdk.Q.resolve();
        }

        var self = this;
        return sdk.Q.resolve(returnValue)
            .then(function () {
                return self._uploadNextImpl(file);
            })
            .catch(function (error) {
                console.log(22)
                self._invoke(events.kError, [error, file]);
            });
    }

    _uploadNextImpl(file) {
        var self = this;
        var options = this.options;
        var object = file.name;
        var throwErrors = true;

        var defaultTaskOptions = {};
        var arr = ['max_retries', 'chunk_size',
            'bos_multipart_parallel',
            'bos_multipart_auto_continue',
            'bos_multipart_local_key_generator'];
        Object.keys(options).forEach(key => {
            if (arr.includes(key)) {
                defaultTaskOptions[key] = options[key];
            }
        });

        return sdk.Q.all([
            this._invoke(events.kKey, [file], throwErrors),
            this._invoke(events.kObjectMetas, [file])
        ]).then(function (array) {
            // options.bos_bucket 可能会被 kKey 事件动态的改变
            var bucket = options.bos_bucket;

            var result = array[0];
            var objectMetas = array[1];

            var multipart = 'auto';
            if (typeof result == 'string') {
                object = result;
            }
            else if (typeof result == 'object') {
                bucket = result.bucket || bucket;
                object = result.key || object;

                // 'auto' / 'off'
                multipart = result.multipart || multipart;
            }

            var client = self.client;
            var eventDispatcher = self;
            var taskOptions = {
                ...defaultTaskOptions, ...{
                    file: file,
                    bucket: bucket,
                    object: object,
                    metas: objectMetas
                }
            };

            var task = null;
            if (multipart === 'auto' && file.size > options.bos_multipart_min_size) {
                task = new MultipartTask(client, eventDispatcher, taskOptions);
            }
            else {
                task = new PutObjectTask(client, eventDispatcher, taskOptions);
            }

            self._uploadingFiles[file.uuid] = file;

            file.abort = function () {
                file._aborted = true;
                return task.abort();
            };

            task.setNetworkInfo(self._networkInfo);
            return task.start();
        });
    }

    stop() {
        this._abort = true;
        this._working = false;
    }



    /**
     * 动态设置 Uploader 的某些参数，当前只支持动态的修改
     * bos_credentials, uptoken, bos_bucket, bos_endpoint
     * bos_ak, bos_sk
     *
     * @param {Object} options 用户动态设置的参数（只支持部分）
     */
    setOptions(options) {
        const supportedKeys = ['bos_credentials',
            'bos_ak', 'bos_sk', 'uptoken', 'bos_bucket', 'bos_endpoint'];
        Object.keys(options).forEach(key => {
            if (supportedKeys.includes(key)) {
                supportedOptions[key] = options[key];
            }
        });
        this.options = { ...options, ...supportedOptions };
        var config = this.client && this.client.config;
        if (config) {
            var credentials = null;

            if (options.bos_credentials) {
                credentials = options.bos_credentials;
            }
            else if (options.bos_ak && options.bos_sk) {
                credentials = {
                    ak: options.bos_ak,
                    sk: options.bos_sk
                };
            }

            if (credentials) {
                this.options.bos_credentials = credentials;
                config.credentials = credentials;
            }
            if (options.uptoken) {
                config.sessionToken = options.uptoken;
            }
            if (options.bos_endpoint) {
                config.endpoint = utils.normalizeEndpoint(options.bos_endpoint);
            }
        }
    }

    /**
 * 有的用户希望主动更新 sts token，避免过期的问题
 *
 * @return {Promise}
 */
    refreshStsToken() {
        var self = this;
        var options = self.options;
        var stsMode = options.uptoken_url && options.get_new_uptoken === false;
        if (stsMode) {
            var stm = new StsTokenManager(options);
            return stm.get(options.bos_bucket).then(function (payload) {
                return self.setOptions({
                    bos_ak: payload.AccessKeyId,
                    bos_sk: payload.SecretAccessKey,
                    uptoken: payload.SessionToken
                });
            });
        }
        return sdk.Q.resolve();
    }

}
export default Uploader;
