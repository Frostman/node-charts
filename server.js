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

process.on('uncaughtException', function (e) {
    console.error(e.message);
    console.error(e.stack);
});

var cluster = require('cluster');

// handle command line args
var args = require('commander');
args
        .option('--debug', 'Debug')
        .option('-p, --port <port>', 'Port to listen', 3000)
        .option('-w, --workers <workers>', 'Number of workers', 0)
        .version('0.0.1');
args.parse(process.argv);

if (args.workers > 1 && cluster.isMaster) {
    // Fork workers.
    for (var i = 0; i < args.workers; i++) {
        cluster.fork();
    }

    function workerLabel(worker) {
        return 'node-charts worker #' + worker.id + ' (pid: ' + worker.process.pid + ')';
    }

    cluster.on('listening', function (worker, address) {
        console.log(workerLabel(worker) + ' listen on ' + address.address + ':' + address.port);
    });
    cluster.on('exit', function (worker, code, signal) {
        console.log(workerLabel(worker) + ' died with code: ' + code + ', signal: ' + signal);
    });
} else {
    var express = require('express');

    var app = express.createServer(express.bodyParser());
    if (args.debug) {
        app.use(express.logger());
    }

    var charts = require("./charts.js"),
            supportedChartLibs = ["highcharts"];

    function handleChartReq(req, res) {
        if (args.debug) {
            req.start_time = new Date().getTime();
        }
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
                if (args.debug) {
                    console.log("Chart generation takes: " + (new Date().getTime() - req.start_time) / 1000 + " sec")
                }
                res.writeHead(200, {'Content-Type':'image/svg+xml'});
                res.end(svg);
            }
        };

        try {
            chartOptions = JSON.parse(chartOptions);
        } catch (e) {
            return resultSvgCallback(e, null)
        }

        // default chart
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

    if (!cluster.isWorker) {
        console.log("node-charts listen on port " + args.port);
    }
    app.listen(args.port);

}
