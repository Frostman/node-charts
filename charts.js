var windowLib = require("./window.js");

function cleanSVG(svg) {
    // from highcharts exporting.js
    return svg
            .replace(/zIndex="[^"]+"/g, '')
            .replace(/isShadow="[^"]+"/g, '')
            .replace(/symbolName="[^"]+"/g, '')
            .replace(/jQuery[0-9]+="[^"]+"/g, '')
            .replace(/isTracker="[^"]+"/g, '')
            .replace(/url\([^#]+#/g, 'url(#')
            .replace(/<svg /, '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ')
            .replace(/ href=/g, ' xlink:href=')
            .replace(/\n/, ' ')
            .replace(/<\/svg>.*?$/, '</svg>')
            .replace(/([0-9]+)\.([0-9]+)/g, function (s1, s2, s3) {
                return s2 + '.' + s3[0];
            })
            .replace(/&nbsp;/g, '\u00A0')
            .replace(/&shy;/g, '\u00AD')
            .replace(/<IMG /g, '<image ')
            .replace(/height=([^" ]+)/g, 'height="$1"')
            .replace(/width=([^" ]+)/g, 'width="$1"')
            .replace(/hc-svg-href="([^"]+)">/g, 'xlink:href="$1"/>')
            .replace(/id=([^" >]+)/g, 'id="$1"')
            .replace(/class=([^" ]+)/g, 'class="$1"')
            .replace(/ transform /g, ' ')
            .replace(/:(path|rect)/g, '$1')
            .replace(/style="([^"]+)"/g, function (s) {
                return s.toLowerCase();
            });
}

function renderHighcharts(options, callback) {
    // prepare highcharts options to render on server
    options.chart = options.chart || {};
    options.chart.renderTo = 'container';
    options.chart.forExport = true;
    options.chart.renderer = 'SVG';
    options.chart.animation = false;
    options.chart.plotBackgroundImage = null;

    options.tooltip = options.tooltip || {};
    options.tooltip.enabled = false;

    options.exporting = options.exporting || {};
    options.exporting.enabled = false;

    options.credits = options.credits || {};

    options.series = options.series || [];
    options.series.forEach(function (series) {
        series.animation = false;
        series.showCheckbox = false;
        if (series.marker && /^url\(/.test(series.marker.symbol)) {
            series.marker.symbol = 'circle';
        }
    });

    windowLib.createWindow(function (err, window) {
        if (err) {
            return callback(e, null);
        }
        window.loadScript("./lib/highcharts.src.patched.js", function (err, window) {
            if (err) {
                return callback(e, null);
            }
            try {
                var $ = window.jQuery;
                var highcharts = window.Highcharts;
                var document = window.document;
                var container = $('<div id="container" />');
                container.appendTo(document.body);
                new highcharts.Chart(options);

                var svg = cleanSVG(container.children().html());

                window.close();
                callback(null, svg);
            } catch (e) {
                callback(e, null);
            }
        });
    });
}

exports.renderHighcharts = renderHighcharts;
