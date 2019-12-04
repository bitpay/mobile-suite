# Custom API Integrations for BitPay

This node service is a custom middleware layer for 3rd-party integrations who can't modify outgoing data.  This middleware layer will map variables as needed.  

## Setup
run `npm install`

Copy the `sample_env.env` file to `.env`.  These values will be read from `config.js` and can be dynamically overwritten.

Modify  `.env` as needed.  You will need an account on [test.bitpay.com](test.bitpay.com) for sandbox testing, and [bitpay.com](bitpy.com) for production.

Change any routes in `app.js`.  This **README** will refer to the default settings.

Modify `config.js` if you would like to customize variables.  These all map to the `.env` file.

Create a database for IPN information.  This assumes you're using MySQL

```
CREATE TABLE _bitpay_transactions ( id INT(11) NOT NULL AUTO_INCREMENT , invoice_id VARCHAR(255) NOT NULL , invoice_status VARCHAR(255) NOT NULL , date_added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP , PRIMARY KEY (id)) ENGINE = InnoDB;
```


Start the service with `nodemon`.

**note:** For this **README** all urls will refer to `test.bitpay.com`


## Testing API Tokens

To verify your API token, send a `GET` request to the node service.
`http://<your server>:<your port>/api/version`

##### Valid response for V1 Token
```
{
    "status": 200,
    "apiVersion": "v1",
    "message": "This token is for v1",
    "resourceUrl": "http://test.bitpay.com/api/invoice"
}
```

##### Valid response for V2 Token
```
{
    "status": 200,
    "apiVersion": "v2",
    "message": "This token is for v2",
    "resourceUrl": "http://test.bitpay.com/invoices"
}
```

##### Error Response 
```
{
    "status": 403,
    "error": {
        "message": "invalid api key"
    }
}
```


## Creating BitPay Invoice

BitPay expects an order to be sent using the following format.  If your POS system has different fields, you will need to customize the mapping in the `invoice.js` file.  

Send a `POST` to your NodeJS server, `/api/createInvoice`

Below are example fields, our API can be reviewed at [bitpay.com/api](bitpay.com/api)

```
{
    "orderID": 000001,
    "notificationURL": "http://yourserverinfo.com/ipn",
    "redirectURL": "<where to redirect on your website after a successful payment>",
    "price": 5.00,
    "currency": "USD",
    "extendedNotifications": "true",
	"buyer":{
		"name":"<buyer name>",
		"email":"<buyer email>",
		"notify":true

	},
	"token":"<api token from the .env file>"
}
```
The `notificationURL` should match your NodeJS route.

A response will be sent in the following format.  As a user you must redirect users to the `data->url` field

```
{
    "facade": "pos/invoice",
    "data": {
        "url": "https://test.bitpay.com/invoice?id=<bitpay invoice id>",
        "status": "new",
        "price": 5,
        "currency": "USD",
        "invoiceTime": 1565118684277,
        "expirationTime": 1565119584277,
        "currentTime": 1565118684304,
        "id": "<bitpay invoice id>",
        "lowFeeDetected": false,
        "amountPaid": 0,
        "exceptionStatus": false,
        "redirectURL": "<your specificed redirect url>",
        "refundAddressRequestPending": false,
        "buyerProvidedInfo": {
            "name": "Satoshi Nakamoto"
        },
        "paymentSubtotals": {
            "BTC": 42600,
            "BCH": 1455600
        },
        "paymentTotals": {
            "BTC": 42700,
            "BCH": 1455600
        },
        "paymentDisplayTotals": {
            "BTC": "0.000427",
            "BCH": "0.014556"
        },
        "paymentDisplaySubTotals": {
            "BTC": "0.000426",
            "BCH": "0.014556"
        },
        "exchangeRates": {
            "BTC": {
                "USD": 11750.01,
                "BCH": 34.166938063390525
            },
            "BCH": {
                "USD": 343.49999999999994,
                "BTC": 0.02923272397074855
            }
        },
        "supportedTransactionCurrencies": {
            "BTC": {
                "enabled": true
            },
            "BCH": {
                "enabled": true
            }
        },
        "minerFees": {
            "BTC": {
                "satoshisPerByte": 1,
                "totalFee": 100
            },
            "BCH": {
                "satoshisPerByte": 0,
                "totalFee": 0
            }
        },
        "paymentCodes": {
            "BTC": {
                "BIP72b": "bitcoin:?r=https://test.bitpay.com/i/P3UFybTwAkt4k2YxELxm9t",
                "BIP73": "https://test.bitpay.com/i/P3UFybTwAkt4k2YxELxm9t"
            },
            "BCH": {
                "BIP72b": "bitcoincash:?r=https://test.bitpay.com/i/P3UFybTwAkt4k2YxELxm9t",
                "BIP73": "https://test.bitpay.com/i/P3UFybTwAkt4k2YxELxm9t"
            }
        },
        "token": "<random guid>"
    }
}
```

The `invoice id` and `status` will be logged in the database table created during the setup.

## IPN
BitPay will send an IPN in the following format.

```
{
    "event": {
        "code": 1005,
        "name": "invoice_confirmed"
    },
    "data": {
        "id": "<bitpay invoice id>",
        "orderId": "467",
        "url": "https://test.bitpay.com/invoice?id=<bitpay invoice id>",
        "posData": "order1234abcd",
        "status": "confirmed",
        "btcPrice": "0.002600",
        "price": 10.5,
        "currency": "EUR",
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
            "buyerEmail": "satoshi@nakamoto.com",
            "buyerPhone": "555-555-5555",
            "buyerNotify": true
        }
    }
}
```

The middleware will automatically verify the status and update the local database accordingly, you can customize behavior in the `receiveIpn` function in `invoice.js`

Your custom integration should poll the NodeJS server `/api/checkstatus` and send a `GET` with the `invoiceid` to verify status if needed (ex a Mobile integration) instead of bitpay.com, to prevent rate limits and throttling.


## Invoice Statuses

The BitPay invoice status is as follows
[https://bitpay.com/docs/invoice-states
](https://bitpay.com/docs/invoice-states)

* **new**
	* An invoice starts in this state. When in this state and only in this state, payments to the associated bitcoin address are credited to the invoice. If an invoice has received a partial payment, it will still reflect a status of new to the merchant. From a merchant system perspective, an invoice is either paid or not paid, partial payments are refunded by BitPay to the customer.
* **paid**
	* As soon as payment is received it is evaluated against the invoice requested amount. If the amount paid is equal to or greater than the amount expected then the invoice is marked as being paid. To detect whether the invoice has been overpaid consult the invoice exception status (exceptionStatus parameter). Overpaid invoices are refunded by BitPay to the customer.

* **confirmed**
	* The transactionSpeed setting of an invoice determines when an invoice is confirmed:
	* For the high speed setting, it will be confirmed as soon as full payment is received on the bitcoin network (note, the invoice will go from a status of new to confirmed, bypassing the paid status).
	* For the medium speed setting, the invoice is confirmed after the payment transaction has been confirmed by 1 block on the bitcoin network.
	* For the low speed setting, 6 blocks on the bitcoin network are required. Invoices are considered complete after 6 blocks on the bitcoin network, therefore an invoice will go from a paid status directly to a complete status if the transaction speed is set to low.
* **complete**
	* When an invoice is complete, it means that BitPay has credited the merchant’s account for the invoice. Currently, 6 confirmation blocks on the bitcoin network are required for an invoice to be complete. Note, in the future (for qualified payers), invoices may move to a complete status immediately upon payment, in which case the invoice will move directly from a new status to a complete status.
* **expired**
	* An expired invoice is one where payment was not received and the 15 minute payment window has elapsed.
* **invalid**
	* An invoice is considered invalid when it was paid, but the corresponding bitcoin transaction was not confirmed within 1 hour after receipt. It is possible that some transactions on the bitcoin network can take longer than 1 hour to be included in a block. If the transaction confirms after 1 hour, BitPay will update the invoice state from invalid to confirmed or complete (6 confirmations), depending on the invoice transactionSpeed setting.

## Exception States
* **false**
	* The invoice is not in an exception state.
* **paidPartial**
	* If the amount paid is less than the amount expected then the invoice is marked as being partially paid.
* **paidOver**
	* If the amount paid is greater than the amount expected then the invoice is marked as being overpaid.

	
## Logging

To create rolling logs, use the following code

```
logger = require('./selog.js');
logger.createLogger('<log type>');
logger.error("information to log")
```

Log types are defined below, and stored in a logs/<log type> folder
* **onboard**
	* used api connection
* **invoice**
	* used for invoice data

To create your own, edit the `selog.js` file, and copy and modify the following to your specifications.

```
your_options = {
        logDirectory: 'logs/<logtype>', // NOTE: folder must exist and be writable...
        fileNamePattern: '<logtype>-<DATE>.log',
        dateFormat: 'YYYY.MM.DD'
    },
```
    
Then add another `else` block

```
else if (logType === '<logtype>') {
        logger = SimpleNodeLogger.createRollingFileLogger(your_options);
    }
```
