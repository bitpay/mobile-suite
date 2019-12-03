Android Example
===============================


This plugin allows developers to add BitPay payments in their mobile projects.

# Requirements

This plugin requires the following:

* A BitPay merchant account ([Test](http://test.bitpay.com) and [Production](http://www.bitpay.com))
* It is **HIGHLY** recommended to use a custom middleware to relay from your project to BitPay, so tokens can be stored in one location and not individual devices.  A Node version can be downloaded [here](https://github.com/bitpay/middleware-node)

# Installation

* In your `AndroidManifest.xml`, add this before your closing `</application>` tag

`<uses-library android:name="org.apache.http.legacy" android:required="false"/>`

* Add the following after your closing `</application>`tag:

`<uses-permission android:name="android.permission.INTERNET" />`

* Copy and paste the code in the `MainActivity` class.

* Add your `API Token` in the `getAPIToken` function.

* Select your currency in the `getCryptoType` function.

* Set your environment in the `getInvoiceURL` function.

If you are using **ETH**, you will need to change the following line

`String invoice_url = btcObj.getString(("BIP72b"));`

to

`String invoice_url = btcObj.getString(("EIP681"));`



## Contribute

Would you like to help with this project?  Great!  You don't have to be a developer, either.  If you've found a bug or have an idea for an improvement, please open an [issue](https://github.com/bitpay/android-sdk-v2/issues) and tell us about it.

If you *are* a developer wanting contribute an enhancement, bugfix or other patch to this project, please fork this repository and submit a pull request detailing your changes.  We review all PRs!

This open source project is released under the [MIT license](http://opensource.org/licenses/MIT) which means if you would like to use this project's code in your own project you are free to do so. Speaking of, if you have used our code in a cool new project we would like to hear about it!  Please send us an [email](mailto:integrations@bitpay.com).

## License

Please refer to the [LICENSE](https://github.com/bitpay/android-sdk-v2/LICENSE) file that came with this project.
