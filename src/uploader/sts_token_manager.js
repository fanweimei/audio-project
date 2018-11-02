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
 * @file sts_token_manager.js
 * @author leeight
 */
import axios from 'axios';
import * as sdk from 'bce-sdk-js';
import * as utils from './utils';

class StsTokenManager {
    constructor(options) {
        this.options = options;
        this._cache = {};
    }


    get(bucket) {
        var self = this;

        if (self._cache[bucket] != null) {
            return self._cache[bucket];
        }

        return sdk.Q.resolve(this._getImpl.apply(this, arguments)).then(function (payload) {
            self._cache[bucket] = payload;
            return payload;
        });
    }

    _getImpl(bucket) {
        var options = this.options;
        var uptoken_url = options.uptoken_url;
        var timeout = options.uptoken_timeout || options.uptoken_jsonp_timeout;
        var viaJsonp = options.uptoken_via_jsonp;

        var deferred = sdk.Q.defer();
        axios({
            url: uptoken_url,
            jsonp: viaJsonp ? 'callback' : false,
            dataType: viaJsonp ? 'jsonp' : 'json',
            timeout: timeout,
            data: {
                sts: JSON.stringify(utils.getDefaultACL(bucket))
            }
        }).then(payload => {
            deferred.resolve(payload);
        }).catch(err => {
            deferred.reject(new Error('Get sts token timeout (' + timeout + 'ms).'));
        })
        return deferred.promise;
    }

}

export default StsTokenManager;
