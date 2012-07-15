var express = require('express');
var app = express.createServer(
        express.logger(),
        express.bodyParser()
);

function handleChartReq(req, res) {
    var chartLib = req.params.chartLib;
    var chartOptions = req.params.chartOptions || req.body.chartOptions;

    if (!chartLib || !chartOptions) {
        res.statusCode = 404;
        res.end();
    }

    console.log('generating chart for "' + chartLib
            + '" with options:\n' + chartOptions);

    res.send("chart should be here, chartOptions: " + chartOptions);
}

app.get('/chart/:chartLib/:chartOptions', handleChartReq);

app.post("/chart/:chartLib", handleChartReq);

app.listen(3000);
