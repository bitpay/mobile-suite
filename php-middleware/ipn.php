<?php
/*
This file should be used by your integration (most likely a Mobile implementation) as the IPN (notificationURL)
and have accesss to your database and accept incoming POST on 443.  

This file will be used by BitPay to update / verify the status, and the checkstatus.php  file can be used to verify that change from your integration.
*/

#autoload classes to read the .env
define('DIR_VENDOR', __DIR__.'/vendor/');
if (file_exists(DIR_VENDOR . 'autoload.php')) {
    require_once(DIR_VENDOR . 'autoload.php');
}
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

#autoload the classes
function BPC_autoloader($class)
{
    if (strpos($class, 'BPC_') !== false):
        if (!class_exists('BitPayLib/' . $class, false)):
            #doesnt exist so include it
            include 'BitPayLib/' . $class . '.php';
        endif;
    endif;
}
spl_autoload_register('BPC_autoloader');

//sample incoming ipn
/*
{
    "event": {
        "code": 1005,
        "name": "invoice_confirmed"
    },
    "data": {
        "id": "123456",
        "orderId": "1a9e2efa-555b-433f-8780-55eeae1f0f45",
        "url": "https:/test.bitpay.com/invoice?id=123456",
        "status": "confirmed",
        "btcPrice": "0.002600",
        "price": 10.5,
        "currency": "USD",
        "invoiceTime": 1507729941907,
        "expirationTime": 1507730841907,
        "currentTime": 1507730718246,
        "btcPaid": "0.002600",
        "btcDue": "0.000000",
        "rate": 4037.92,
        "exceptionStatus": false,
        "buyerFields": {
            "buyerName": "Satoshi Nakamoto",
            "buyerAddress1": "140 E 46th St",
            "buyerAddress2": "",
            "buyerCountry": "US",
            "buyerEmail": "test@email.com",
            "buyerPhone": "555-0042",
            "buyerNotify": true
        }
    }
}
*/
// modify the following to meet your requirements, this example takes an incoming json post
// Access the incoming data
$json = file_get_contents('php://input');
// decodes to object
$data = json_decode($json);
$invoice_data = $data->data;
#print_r($invoice_data);

$invoiceID = $invoice_data->id;
$ipn_status = $invoice_data->status;

// you should verify the status of the IPN by sending a GET request to BitPay
// http://test.bitpay.com/invoices/$invoiceID (or http://www.bitpay.com/invoices/$invoiceID)

//create a basic object to send to BitPay
//your token should be in a secure location, for demo purposes only it will be in a .env (and not included in this repo)

$bitpay_checkout_token = getenv("API_TOKEN");
$env = getenv("ENV"); //test or prod
$config = new BPC_Configuration($bitpay_checkout_token, $env);

//create a class that will contain all the parameters to send to bitpay
$params = new stdClass();
$params->invoiceID = $invoiceID;

$item = new BPC_Item($config, $params);

$invoice = new BPC_Invoice($item); //this creates the invoice with all of the config params
$orderStatus = json_decode($invoice->BPC_checkInvoiceStatus($invoiceID));

$invoiceData = $orderStatus->data;
$invoiceStatus = $invoiceData->status;
$invoiceId = $invoiceData->id;
// here is where you will need to do a comparison, and update your system
// this compares the incoming IPN status to the actual status from the GET, and if they match, then proceed
//example

#get the value from  your database
include 'conn.php';
$table = '_bitpay_transactions';
$stmt = $mysqli->prepare("SELECT * FROM $table WHERE invoice_id = ?");
$stmt->bind_param("s", $invoiceId);
$stmt->execute();
$result = $stmt->get_result();
$row = mysqli_fetch_object($result);

//fetching result would go here, but will be covered later
$stmt->close();
if($ipn_status == $invoiceStatus):
#update the status
$stmt = $mysqli->prepare("UPDATE $table SET invoice_status = ? WHERE invoice_id = ?");
$stmt->bind_param("ss", $invoiceStatus,$invoiceId);
$stmt->execute();

#now update your specific setup pased on the status (refer to the README for a full understanding)
switch ($invoiceStatus){
    case 'paid':
        //invoice has been paid, not confirmed.  
    break;
    case 'confirmed':
        //invoice has been confirmed via 6 confirmation.  If shipping physical goods, this status should be used  
    break;
    case 'completed':
        //invoice has been completed 
    break;
    case 'expired':
        //invoice has expired, user most likely never paid
    break;

}
endif;