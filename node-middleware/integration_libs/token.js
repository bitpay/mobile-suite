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
    if ($is_production == "TRUE") {
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
          
        }else{
            res.code = 403
            res.status(res.code);
            
            res.json({
                status: res.code,
                error: {
                    message: 'Invalid Token'
                }
            })
        }

    }


    checkToken(req, res, token)
};
