exports.createLogger = function (logType) {
    var fs = require('fs');

    fs.mkdir('./logs/onboard', (err) => {});
    fs.mkdir('./logs/invoice', (err) => {});
    fs.mkdir('./logs/ipn', (err) => {});

    const SimpleNodeLogger = require('simple-node-logger'),
    onboard_opts = {
        logDirectory: 'logs/onboard', // NOTE: folder must exist and be writable...
        fileNamePattern: 'onboard-<DATE>.log',
        dateFormat: 'YYYY.MM.DD'
    },

    invoice_opts = {
        logDirectory: 'logs/invoice', // NOTE: folder must exist and be writable...
        fileNamePattern: 'invoice-<DATE>.log',
        dateFormat: 'YYYY.MM.DD'
    },
    ipn_opts = {
        logDirectory: 'logs/ipn', // NOTE: folder must exist and be writable...
        fileNamePattern: 'ipn-<DATE>.log',
        dateFormat: 'YYYY.MM.DD'
    };

    if (logType === 'onboard') {
        logger = SimpleNodeLogger.createRollingFileLogger(onboard_opts);
    }
    else if (logType === 'invoice') {
        logger = SimpleNodeLogger.createRollingFileLogger(invoice_opts);
    }
    else if (logType === 'ipn') {
        logger = SimpleNodeLogger.createRollingFileLogger(ipn_opts);
    }

    return logger
};
