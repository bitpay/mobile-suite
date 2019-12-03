package com.bitpay.bitpay;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.os.StrictMode;
import android.util.Log;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicHeader;
import org.apache.http.protocol.HTTP;
import org.apache.http.util.EntityUtils;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Arrays;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;

public class MainActivity extends AppCompatActivity {
    public TimerTask checkInvoiceStatus;
    final Timer timer = new Timer();


    public String getPluginVersion(){return "BitPay_Android_3.0.1911";}
    public String BPCurrency(String curr) {
        curr = curr.toUpperCase();
        String[] minorZero;
        minorZero = new String[] {
                "BYR",
                "XOF",
                "BIF",
                "XAF",
                "CLP",
                "KMF",
                "XOF",
                "DJF",
                "XPF",
                "GNF",
                "ISK",
                "JPY",
                "KRW",
                "PYG",
                "RWF",
                "UGX",
                "UYI",
                "VUV",
                "VND"
        };

        // Convert String Array to List
        List< String > minorZeroList = Arrays.asList(minorZero);
        if (minorZeroList.contains(curr)) {
            return "0";
        }


        String[] minorThree = {
                "BHD",
                "IQD",
                "JOD",
                "KWD",
                "LYD",
                "OMR",
                "TND"
        };

        // Convert String Array to List
        List < String > minorThreeList = Arrays.asList(minorThree);
        if (minorThreeList.contains(curr)) {
            return "3";
        }
        return "2";
    }

    //currency
    public String getCryptoType() {
        return "BTC";
        //return BCH;
        //return ETH;
    }

    //your api key
    public String getAPIToken() {
        String API_KEY="<your api token>";
        return API_KEY;

    }

    //which URL to post to
    public String getInvoiceURL() {

        String API_ENV = "DEV";
        if(API_ENV.equals("DEV")){
            return "https://test.bitpay.com/invoices";
        }else{
            return "https://bitpay.com/invoices";
        }

    }



    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        String postReceiverUrl = getInvoiceURL();
        DefaultHttpClient client = new DefaultHttpClient();
        HttpPost post = new HttpPost(postReceiverUrl);
        post.setHeader("X-BitPay-Plugin-Info",getPluginVersion());
        HttpResponse response;


        JSONObject postData = new JSONObject();

        try {
            String orderID = "123-456"; //your order id

            //price formatting

            String final_price  = "1.00";

            postData.put("orderID", orderID);
            postData.put("notificationEmail", "buyers_email_address");
            //postData.put("posData", "{\"<custom stuff goes here>\"}");
            postData.put("price", final_price);
            postData.put("currency", "USD");
            postData.put("extendedNotifications", "true");
            postData.put("transactionSpeed", "high");
            postData.put("token", getAPIToken());

            final String invoiceURL;
            final String invoiceURLGET;
            try {
                StringEntity se = new StringEntity(postData.toString());
                se.setContentType(new BasicHeader(HTTP.CONTENT_TYPE, "application/json"));
                post.setEntity(se);

                StrictMode.ThreadPolicy policy = new
                        StrictMode.ThreadPolicy.Builder()
                        .permitAll().build();
                StrictMode.setThreadPolicy(policy);
                response = client.execute(post);

                HttpEntity entity = response.getEntity();
                if (entity != null) {
                    String JSONString = EntityUtils.toString(entity);
                    JSONObject obj = new JSONObject(JSONString);

                    JSONObject data = new JSONObject(obj.getString("data"));
                    //use data.getString("<field name to get the value>")
                    /**drill down to the payment code**/
                    JSONObject paymentCodeObj = new JSONObject(data.getString("paymentCodes"));
                    JSONObject btcObj = new JSONObject(paymentCodeObj.getString(getCryptoType()));
                    String invoice_url = btcObj.getString(("BIP72b"));
                    //if ethereum, use String invoice_url = btcObj.getString(("EIP681"));
                    Log.i("invoice_url", invoice_url);
                    invoiceURL = data.getString("url");
                    invoiceURLGET = invoiceURL.replace("?id=", "s/");


                    try {

                        /***timer to monitor status**/
                        checkInvoiceStatus = new TimerTask() {
                            @Override
                            public void run() {
                                URL statusURL;
                                StringBuffer invoiceResponse = new StringBuffer();
                                try {
                                    statusURL = new URL(invoiceURLGET);
                                } catch (MalformedURLException e) {
                                    throw new IllegalArgumentException("invalid url");
                                }

                                HttpURLConnection conn = null;
                                try {
                                    conn = (HttpURLConnection) statusURL.openConnection();
                                    conn.setDoOutput(false);
                                    conn.setDoInput(true);
                                    conn.setUseCaches(false);
                                    conn.setRequestMethod("GET");
                                    conn.setRequestProperty("Content-Type", "application/json;charset=UTF-8");

                                    // handle the response
                                    int status = conn.getResponseCode();
                                    if (status != 200) {
                                        throw new IOException("GET failed with error code " + status);
                                    } else {
                                        BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                                        String inputLine;
                                        while ((inputLine = in .readLine()) != null) {
                                            invoiceResponse.append(inputLine);
                                        } in .close();
                                    }
                                } catch (Exception e) {
                                    e.printStackTrace();
                                } finally {
                                    if (conn != null) {
                                        conn.disconnect();
                                    }

                                    //Here is your json in string format
                                    String responseJSON = invoiceResponse.toString();
                                    Log.i("INVOICE INFO", responseJSON);

                                    try {
                                        String invoiceJSONString = responseJSON;
                                        JSONObject invoiceObj = new JSONObject(invoiceJSONString);


                                        JSONObject invoiceData = new JSONObject(invoiceObj.getString("data"));

                                        //use data.getString("<field name to get the value>")
                                        Log.i("INVOICE STATUS", invoiceData.getString("status"));
                                        String invoiceStatus = invoiceData.getString("status");

                                        if (invoiceStatus.trim().equals("paid") || invoiceStatus.trim().equals("confirmed")) {
                                            //payment has been made, add your logic here
                                            checkInvoiceStatus.cancel();
                                        }

                                        if (invoiceStatus.trim().equals("expired")) {
                                            //user waited too long to pay
                                            Log.i("EXPIRED INVOICE", "EXPIRED INVOICE");
                                            String transactionNotes = "BitPay Transaction ID: " + invoiceData.getString("id")+ " has expired.";
                                            checkInvoiceStatus.cancel();
                                        }

                                        //this is if they tried to mess with the fees
                                        if (invoiceStatus.trim().equals("paid") && invoiceData.getBoolean("lowFeeDetected") == true) {
                                            Log.i("EXPIRED INVOICE", "EXPIRED INVOICE");
                                            String transactionNotes = "BitPay Transaction ID: " + invoiceData.getString("id")+ " has been canceled.";
                                            checkInvoiceStatus.cancel();

                                        }

                                    } catch (JSONException e) {
                                        Log.e("MYAPP", "unexpected JSON exception", e);
                                    }

                                }
                            }
                        };
                        timer.schedule(checkInvoiceStatus, 0, 5000);
                    } catch (Exception e) {
                        Log.i("ERROR", e.toString());
                    }
                    /****END CODE SECTION****/
                }

            } catch (IOException ioe) {
                Log.i("ERROR", ioe.toString());
                //Handle exception here, most of the time you will just log it.
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }
}
