/** Onboard Middleware ***/
exports.tokenCheck = function (req, res) {
    const request = require('request');
    const fetch = require('node-fetch');

    const {
        $dev_endpoint,
        $prod_endpoint,
        $dev_token,
        $prod_token,
        $is_production,
        $invoice_url,
        $port
    } = require('./config')

    /*
    To log invoice data, use the following
    logger = require('./selog.js');
    logger.createLogger('onboard');
    logger.error("information to log")
    */

    //set the endpoint to dev by default 
    let endpoint = $dev_endpoint
    let token = $dev_token
    if ($is_production == true) {
        token = $prod_token
        endpoint = $prod_endpoint
    }



    async function checkToken(req, res, token) {
        let response = await fetch(endpoint + '/invoices/1?token=' + token);
        let dataV2 = await response.json();
        if (dataV2.error === 'Object not found') {
            res.code = 200;
            res.status(res.code);
            res.json({
                status: res.code,
                apiVersion: 'v2',
                message: 'This token is for v2',
                resourceUrl: endpoint + '/invoices'
            });
            return;
        }

        //check v1
        checkV1Token(req, res, token)
    }

    async function checkV1Token(req, res, token) {
        let request = require('request');

        let headers = {
            'content-type': 'application/json'
        };

        let options = {
            url: endpoint + '/api/invoice/1',
            headers: headers,
            auth: {
                'user': token,
                'pass': ''
            }
        };

        let callback = function (error, response) {
            let dataV2 = JSON.parse(response.body);
            if (dataV2.error.type === 'notFound') {
                //good api key
                res.code = 200;
                res.status(res.code);
                res.json({
                    status: res.code,
                    apiVersion: 'v1',
                    message: 'This token is for v1',
                    resourceUrl: endpoint + '/api/invoice'
                });

                return;
            }
            res.code = 403
            res.status(res.code);
            
            res.json({
                status: res.code,
                error: {
                    message: dataV2.error.message
                }
            })
        };

        request(options, callback)
    }

    checkToken(req, res, token)
};
