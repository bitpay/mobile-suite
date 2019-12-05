<?php
/*
This file should be used by your integration to create invoices, instead of directly accessing BitPay.  This will allow you to modify
any incoming data and pad as-needed or transform to match your specific needs.  It also allows you to store your API key in one central place, instead
of multiple locations (ie mobile devices) in the event your key is compromised and a new one needs to be generated. 
*/

#autoload classes to read the .env
define('DIR_VENDOR', __DIR__.'/vendor/');
if (file_exists(DIR_VENDOR . 'autoload.php')) {
    require_once(DIR_VENDOR . 'autoload.php');
}
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

#autoload the BitPay classes
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


//sample incoming
/*
{
"total": "5.00",
"order_number":"123-456",
"currency":"USD",
"user_name":"Satoshi Nakamoto",
"user_email":"Satoshi@Nakamoto.com"
}
*/
// modify the following to meet your requirements, this example takes an incoming json post
// Access the incoming data
$json = file_get_contents('php://input');
// decodes to object
$data = json_decode($json);

//create a request to pass to BitPay
//your token should be in a secure location, for demo purposes only it will be in a .env (and not included in this repo)

$bitpay_checkout_token = getenv("API_TOKEN");
$env = getenv("ENV"); //test or prod

$config = new BPC_Configuration($bitpay_checkout_token, $env);
//create a class that will contain all the parameters to send to bitpay
$params = new stdClass();
$params->extension_version = "My_Plugin_1.0";
$params->price = $data->total;
$params->currency = $data->currency; //set as needed

//if there is user info, pass it along 
if ($data->user_email):
    $buyerInfo = new stdClass();
    $buyerInfo->name = $data->user_name;
    $buyerInfo->email = $data->user_email;
    $params->buyer = $buyerInfo;
endif;

//if you would like to redirect a user after they make a payment, add it here, with any other GET parametrs
$params->redirectURL = "http://myserver.com/place-to-redirect";
//the notification url (IPN) will need to be configured on your setup to handle incoming data when the status changes (ipn.php)
$params->notificationURL = "http://myserver.com/ipn.php";
$params->extendedNotifications = true;


//create an item with all of the parameters
$item = new BPC_Item($config, $params);
$invoice = new BPC_Invoice($item);

$invoice->BPC_createInvoice();

// if you would like to view the raw data, use the following
// an example would be if you a mobile device was using this middleware, you would need to send back the following for it to monitor the status
// http://test.bitpay.com/invoices/$decoded_invoice->id  ( or http://www.bitpay.com/invoices/$decoded_invoice->id)
// you would be monitoring $decoded_invoice->status for the paid/confirmed status to change and handle it in-app

/*
$decoded_invoice = $invoice->BPC_getInvoiceRaw();
print_r($decoded_invoice);
*/
$decoded_invoice = $invoice->BPC_getInvoiceRaw();
#print_r($decoded_invoice);

#save the id into the database.  You will need to setup your own connection, example in conn_example.php
include 'conn.php';

if($mysqli->connect_error) {
    exit('Error connecting to database'); //Should be a message a typical user could understand in production
  }
$table = '_bitpay_transactions';
$stmt = $mysqli->prepare("INSERT INTO $table (invoice_id,invoice_status) VALUES (?,?)");
$stmt->bind_param("ss", $decoded_invoice->id,$decoded_invoice->status);
$stmt->execute();
$stmt->close();

//this url is created by BitPay.  You will need to display or redirect so the user can pay the invoice
$invoiceUrl = $invoice->BPC_getInvoiceURL();

//this url will be sent to the user
echo $invoiceUrl;