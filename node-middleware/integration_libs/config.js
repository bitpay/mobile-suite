// config.js
const dotenv = require('dotenv');
dotenv.config();
let invoice_url = process.env.API_URL_PROD +'/invoices'
if(process.env.IS_PRODUCTION === 'FALSE'){
  invoice_url = process.env.API_URL_DEV +'/invoices'
}
module.exports = {
  $dev_endpoint: process.env.API_URL_DEV,
  $prod_endpoint: process.env.API_URL_PROD,
  $dev_token: process.env.API_KEY_DEV,
  $prod_token: process.env.API_KEY_PROD,
  $is_production:process.env.IS_PRODUCTION,
  $invoice_url:invoice_url,
  $port: process.env.PORT,
  $pluginVersion:'1.0.0',
  $db_host:process.env.DB_HOST,
  $db_user:process.env.DB_USER,
  $db_password:process.env.DB_PASS,
  $db_database:process.env.DB_DATABASE
};
