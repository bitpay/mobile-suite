/** Invoice Middleware ***/
exports.createTransaction = function (req, res, request) {
    const fetch = require('node-fetch');
    const {
        $dev_endpoint,
        $prod_endpoint,
        $dev_token,
        $prod_token,
        $is_production,
        $invoice_url,
        $port,
        $pluginVersion,
        $db_host,
        $db_user,
        $db_password,
        $db_database
    } = require('./config')
    var mysql = require('mysql');
    var dbConfig = {
        host:$db_host,
        user:$db_user,
        password:$db_password,
        database:$db_database
    }
    var connection = mysql.createConnection(dbConfig);


    /*
    To log invoice data, use the following
    logger = require('./selog.js');
    logger.createLogger('invoice');
    logger.error("information to log")
    */

    //set the endpoint to dev by default 

    let $token = $dev_token
    if ($is_production == true) {
        $token = $prod_token
    }


    let $postParams = req.body;
    let $params = {}; //our params
    let $buyerInfo = {};

    /*what BitPay expects, map accordingly.
    You can review https://bitpay.com/api#resource-Invoices for all fields
    
    /*
    {
        "extendedNotifications":"true",
        "extension_version":"Plugin_Version_1.0",
        "price":5.00,
        "orderId":"123456",
        "currency":"USD",
        "buyer":{
            "name":"Satoshi Nakamoto",
            "email":"Satoshi@Nakamoto.com",
            "notify":true

        },
       "redirectURL":"https://<redirect url>",
        "notificationURL":"https://<optional ipn url>"
        }
    */
    /*end sample*/

    //extract what we need for the BitPay API, example mapping
    $params.token = $token
    $params.orderId = $postParams.orderID
    $params.price = $postParams.price
    $params.currency = $postParams.currency

    //default for sandbox

    //buyer info`
    try {
        //wix may or may not send this info
        $buyerInfo.name = $postParams.buyer.name
        $buyerInfo.email = $postParams.buyer.email
        $params.buyer = $buyerInfo;
    } catch (ivErr) {
        //dont do anything,
    }

    //change this to the in this package, /ipn
    //$params.notificationURL = '<this server/ipn>';
    $params.notificationURL = 'http://local.example.com/ipn';

    //redirect after checkout    
    $params.redirectURL = $postParams.redirectURL
    $params.extendedNotifications = true;
    $params.acceptanceWindow = 1200000;

    const postOptions = {
        url: $invoice_url,
        method: 'POST',
        headers: {
            'X-BitPay-Plugin-Info': $pluginVersion
        },
        json: $params
    };

    //send to BitPay, demo code
    try {

        request(postOptions, function (bperror, bpres, bpbody) {
            if (bperror) {
                res.json({
                    status: 'error',
                    message: bperror,
                    apiToken: $params.token
                })

                return
            }
            if (bpbody.hasOwnProperty('error')) {
                res.json({
                    status: 'error',
                    message: bpbody.error,
                    apiToken: $params.token
                })
            } else {
                let $bitpayResponse = bpbody
                connection.connect( function onConnect(err) {   // The server is either down
                    if (err) {                                  // or restarting (takes a while sometimes).
                        console.log('error when connecting to db:', err);
                        res.status(403).send(err)
                        connection.end()
                    }else{
                        res.status(200).send($bitpayResponse)
                        let sql = "INSERT INTO _bitpay_transactions(invoice_id,invoice_status) VALUES('"+$bitpayResponse.data.id+"','"+$bitpayResponse.data.status+"')"
                       // console.log(sql)                
                        // execute the insert statment
                        //connection.query(sql);
                        connection.query("INSERT INTO _bitpay_transactions(invoice_id,invoice_status) VALUES (?,?) ",[
                            $bitpayResponse.data.id,$bitpayResponse.data.status
                         ], function (err, result, fields) {
                             if (err) throw err;
                             
                           });
                        connection.end()
                    }          
                
                });                                             // process asynchronous requests in the meantime.
                                                                // If you're also serving http, display a 503 error.
                connection.on('error', function onError(err) {
                    console.log('db error', err);
                    res.status(403).send(err)
                    connection.end()

                });


               
            }
        })
    } catch (seErr) {
        res.status(403)
        res.json({
            status: seErr.name,
            message: seErr.message,
            apiToken: $params.token
        })
    }
};

exports.checkStatus = function (req, res, request) {
    
    //your integration should check this function to verify the invoice status, instead of polling bitpay.com to prevent throttling
    //expects an invoice id
    /*
    {
        "data": {
            "id": "H9BK6syVbuk4zxET7rzXrg"
                
        }
    }
    */
    const {
 $db_host,
 $db_user,
 $db_password,
 $db_database,
 $invoice_url,
} = require('./config')
var mysql = require('mysql');
var dbConfig = {
 host:$db_host,
 user:$db_user,
 password:$db_password,
 database:$db_database
}
let invoiceid = req.query.invoiceid

if(invoiceid == undefined){
    res.status(403).send('undefined')//send an empty response
    return
}
var connection = mysql.createConnection(dbConfig);

connection.query("SELECT * FROM _bitpay_transactions WHERE invoice_id = ?",[
    invoiceid
 ], function (err, result, fields) {
     if (err) throw err;
     let row = result[0]
     if(row != undefined){
         /*handle the status from here
         new - invoice created not paid
         paid - invoice paid but not confirmed.  Best used when a payment is received.  Best for UX, but physical goods should not be shipped
         until a confirmed status is reached
         confirmed - confirmed by 6 blockchain verifications.  This is best used when there are physical good
         expired - invoice has not been paid within 15 miinutes of creation
        */
         row.status = 'invoice found'
         res.status(200).json(row)
         return
     }else{
        let row = {}
        row.status = 'invoice not found'
        res.status(403).json(row)//send an empty response
     }
   });


};

exports.receiveIpn = function (req, res, request) {
    var request = require('request');
    const {
               $db_host,
        $db_user,
        $db_password,
        $db_database
    } = require('./config')
    var mysql = require('mysql');
    var dbConfig = {
        host:$db_host,
        user:$db_user,
        password:$db_password,
        database:$db_database
    }
    var connection = mysql.createConnection(dbConfig);

    let data = req.body.data
 
    let $ipn_status = data.status //the incoming IPN status
    let $bitpayUrl = data.url.split("?id=",)
    $bitpayUrl = $bitpayUrl[0] +'s/' + data.id //reconstruct the url
    
    connection.query("SELECT * FROM _bitpay_transactions WHERE invoice_id = ?",[
       data.id
    ], function (err, result, fields) {
        if (err) throw err;
        let row = result[0]
        if(row != undefined){
            request($bitpayUrl, (err, bpres, body) => {
               // let statusCode = res.statusCode;
              let data = JSON.parse(body)
              if(data.data == undefined){//could be archived
                res.status(200).send()//send an empty response
                return
              }
              
              let $invoice_status = data.data.status //the incoming IPN status
              let $invoice_id = data.data.id
              if($invoice_status == $ipn_status){
                  //they match, update the _bitpay_transactions table, and add any custom action your setup requires
                  let $sql = "UPDATE _bitpay_transactions SET invoice_status = '"+$ipn_status+"'  WHERE invoice_id = '"+$invoice_id+"'"
                  console.log('$sql',$sql)
                  connection.query($sql, function (err, result, fields) {
                    res.status(200).send()//send an empty response
                  })
              }else{
                res.status(200).send()//send an empty response
              }
            });
        }else{
            res.status(200).send()//send an empty response
        }
      });
}
