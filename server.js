var express = require('express');
var app = express.createServer(
        express.logger(),
        express.bodyParser()
);
var charts = require("./charts.js");
var supportedChartLibs = ["highcharts"];

function handleChartReq(req, res) {
    var chartLib = req.params.chartLib;
    var chartOptions = req.params.chartOptions || req.body.chartOptions;

    if (!chartLib || !chartOptions || supportedChartLibs.indexOf(chartLib) < 0) {
        res.statusCode = 404;
        return res.end();
    }

    var resultSvgCallback = function (err, svg) {
        if (err || !svg) {
            res.statusCode = 500;
            res.end("Error occurred: " + err);
        } else {
            res.writeHead(200, {'Content-Type':'image/svg+xml'});
            res.end(svg);
        }
    };

    try {
        chartOptions = JSON.parse(chartOptions);
    } catch (e) {
        return resultSvgCallback()
    }

    if (!chartOptions || !chartOptions.series) {
        chartOptions = {
            chart:{
                renderTo:'container',
                type:'line',
                marginRight:130,
                marginBottom:25
            },
            title:{
                text:'Monthly Average Temperature',
                x:-20 //center
            },
            subtitle:{
                text:'Source: WorldClimate.com',
                x:-20
            },
            credits:{
                text:"Buglite"
            },
            xAxis:{
                categories:['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            },
            yAxis:{
                title:{
                    text:'Temperature (°C)'
                },
                plotLines:[
                    {
                        value:0,
                        width:1,
                        color:'#808080'
                    }
                ]
            },
            legend:{
                layout:'vertical',
                align:'right',
                verticalAlign:'top',
                x:-10,
                y:100,
                borderWidth:0
            },
            series:[
                {
                    name:'Tokyo',
                    data:[7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
                },
                {
                    name:'New York',
                    data:[-0.2, 0.8, 5.7, 11.3, 17.0, 22.0, 24.8, 24.1, 20.1, 14.1, 8.6, 2.5]
                },
                {
                    name:'Berlin',
                    data:[-0.9, 0.6, 3.5, 8.4, 13.5, 17.0, 18.6, 17.9, 14.3, 9.0, 3.9, 1.0]
                },
                {
                    name:'London',
                    data:[3.9, 4.2, 5.7, 8.5, 11.9, 15.2, 17.0, 16.6, 14.2, 10.3, 6.6, 4.8]
                }
            ]
        };
    }

    if ("highcharts" == chartLib) {
        return charts.renderHighcharts(chartOptions, resultSvgCallback);
    } else {
        res.statusCode = 404;
        return res.end("Unsupported chart lib");
    }
}

app.get('/chart/:chartLib/:chartOptions', handleChartReq);
app.post("/chart/:chartLib", handleChartReq);

//todo extract port to args
app.listen(3000);
