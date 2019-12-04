const express = require('express');
const app = express();
const request = require('request');
var bodyParser = require('body-parser');
var fs = require('fs');

const { $dev_endpoint, $prod_endpoint, $dev_token, $prod_token,$env,$port } = require('./integration_libs/config')

//Custom SE Middleware Libraries
const tokenLib = require('./integration_libs/token.js');
const invoiceLib = require('./integration_libs/invoice.js');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.listen($port, function () {
    fs.mkdir('./logs', (err) => {});
    console.log(`Middleware running on port ${$port}`)
});

app.get('/', function (req, res) {
    console.log('aaa')
    res.send('Nope');
});

app.post('/', function (req, res) {
    res.send('Nope');
});

/** TOKEN CHECK ***/
app.get('/api/version', function (req, res) {
    tokenLib.tokenCheck(req,res)
});

/** CREATE INVOICE ***/
app.post('/api/createInvoice', function (req, res) {
    invoiceLib.createTransaction(req,res,request)
});

/** IPN LISTENER FROM BITPAY ***/
app.post('/api/ipn', function (req, res) {
    invoiceLib.receiveIpn(req,res,request)
});

/** IPN LISTENER FROM CUSTOM INTEGRATION ***/
app.get('/api/checkstatus', function (req, res) {
    invoiceLib.checkStatus(req,res,request)
});
