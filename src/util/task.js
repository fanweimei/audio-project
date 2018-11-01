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
 * @file task.js
 * @author leeight
 */


/**
 * 不同的场景下，需要通过不同的Task来完成上传的工作
 *
 * @param {sdk.BosClient} client The bos client.
 * @param {EventDispatcher} eventDispatcher The event dispatcher.
 * @param {Object} options The extra task-related arguments.
 *
 * @constructor
 */
class Task {
    constructor(client, eventDispatcher, options) {
        /**
         * 可以被 abort 的 promise 对象
         *
         * @type {Promise}
         */
        this.xhrRequesting = null;

        /**
         * 标记一下是否是人为中断了
         *
         * @type {boolean}
         */
        this.aborted = false;

        this.networkInfo = null;

        this.client = client;
        this.eventDispatcher = eventDispatcher;
        this.options = options;
    }
    abstractMethod() {
        throw new Error('unimplemented method.');
    }
    /**
     * 开始上传任务
     */
    start() {
        throw new Error('unimplemented method.');
    }
    /**
     * 暂停上传
     */
    pause() {
        throw new Error('unimplemented method.');
    }
    /**
     * 恢复暂停
     */
    resume() {
        throw new Error('unimplemented method.');
    }
    setNetworkInfo(networkInfo) {
        this.networkInfo = networkInfo;
    }
    /**
     * 终止上传任务
     */
    abort() {
        if (this.xhrRequesting
            && typeof this.xhrRequesting.abort === 'function') {
            this.aborted = true;
            this.xhrRequesting.abort();
            this.xhrRequesting = null;
        }
    }
}
export default Task;
