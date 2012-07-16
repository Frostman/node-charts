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
