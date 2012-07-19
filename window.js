/******************************************************************************
 * node-charts                                                                *
 *                                                                            *
 * Node.js based server for server-side charts rendering.                     *
 *                                                                            *
 * Copyright (c) 2012 - Sergey "Frosman" Lukjanov, me@frostman.ru             *
 *                                                                            *
 * Licensed under the Apache License, Version 2.0 (the "License");            *
 * you may not use this file except in compliance with the License.           *
 * You may obtain a copy of the License at                                    *
 *                                                                            *
 * http://www.apache.org/licenses/LICENSE-2.0                                 *
 *                                                                            *
 * Unless required by applicable law or agreed to in writing, software        *
 * distributed under the License is distributed on an "AS IS" BASIS,          *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   *
 * See the License for the specific language governing permissions and        *
 * limitations under the License.                                             *
 ******************************************************************************/

var jsdom = require('jsdom');

jsdom.dom.level3.core.Element.prototype.getBBox = function () {
    return this.textContent ? {
        width:this.textContent.length * 6.5,
        height:14
    } : {
        x:elem.offsetLeft,
        y:elem.offsetTop,
        width:elem.offsetWidth,
        height:elem.offsetHeight
    };
};

function createWindow(callback) {
    try {
        var document = jsdom.jsdom("<html><head></head><body>html</body></html>");
        var window = document.createWindow();
        window.SVGAngle = true;

        window.loadScript = function (path, callback) {
            try {
                var script = document.createElement('script');
                script.src = path;
                script.onload = function () {
                    callback(null, window);
                };
                window.document.body.appendChild(script);
            } catch (e) {
                callback(e, null);
            }
        };

        jsdom.jQueryify(window, './lib/jquery.min.js', function (window) {
            callback(null, window);
        });
    } catch (e) {
        callback(e, null);
    }
}

exports.createWindow = createWindow;
