//  Example.swift
//  BitPay SDK
//

import Foundation


class YourClass {
    //add this code to your project where you are wanting to trigger a payment (button click, new window, etc
    
    //if you are adding other fields from the API, update this struct
    struct Invoice:Codable {
            var price: String
            var currency: String
           
        }
        let encoder = JSONEncoder()
         
         //your custom middleware endpoint
         let url = "http://localhost:1234/api/createInvoice"
        
         var invoiceURL:String?
         var monitorUrl:String?
         
         //price and currency are the minimum requirements, visit http://bitpay.com/api for more fields
         let invoice = try! encoder.encode(Invoice(price:"2.00",currency:"USD"))
         let postUrl = URL(string: url)!
         var request = URLRequest(url: postUrl)
         request.setValue("application/json", forHTTPHeaderField: "Content-Type")
         request.httpMethod = "POST"
         request.httpBody = invoice
         
         let task = URLSession.shared.dataTask(with: request) {
           (data, response, error) in
           // check for any errors
           guard error == nil else {
             print("error creating invoice")
             print(error!)
             return
           }
           // make sure we got data
           guard let responseData = data else {
             print("Error: did not receive data")
             return
           }
           // parse the result as JSON, since that's what the API provides
           do {
             guard let invoiceJson = try JSONSerialization.jsonObject(with: responseData, options: [])
               as? [String: Any] else {
               print("error trying to convert data to JSON")
               return
             }
             
             if let dataJson = invoiceJson["data"] as? Dictionary<String, Any> {
                 //redirect users to this url so they can open in-app or via movile browser to view the invoice
                 invoiceURL = dataJson["url"] as? String
                 let invoiceID = dataJson["id"] as! String
                 print(invoiceURL)
                
                 //this should be your middleware monitor
                 monitorUrl = "http://localhost:1234/api/checkstatus?invoiceid=" + invoiceID
                 
                 
             }
          
           } catch  {
             print("error trying to convert data to JSON")
             return
           }
         }
        task.resume()

         //the timer checks the invoice status every 3 seconds
          let timer = Timer.scheduledTimer(withTimeInterval: 3.0, repeats: true) { timer in
             if(monitorUrl == nil){
                 print("do nothing")
               
             }else{
                 //check the invoice status
                 //let invoiceUrl = monitorUrl + "?cachebuster=" + self.cacheBuster()
                 let invoiceUrl = monitorUrl as! String
                 let url = URL(string: invoiceUrl)! //change the url
                 print(url)
                 //create the session object
                 let session = URLSession.shared

                 //now create the URLRequest object using the url object
                 let requestMonitor = URLRequest(url: url)

                 //create dataTask using the session object to send data to the server
                 let task = session.dataTask(with: requestMonitor as URLRequest, completionHandler: { data, response, error in

                     guard error == nil else {
                         return
                     }

                     guard let data = data else {
                         return
                     }

                     do {
                         //create json object from data
                         if let json = try JSONSerialization.jsonObject(with: data, options: .mutableContainers) as? [String: Any] {
                             if let dataJson = json as? Dictionary<String, Any> {
                                 let invoiceStatus = dataJson["invoice_status"] as! String
                                 print("checking invoice status")
                                 if(invoiceStatus == "paid"){
                                      print("paid, turning timer off")
                                      timer.invalidate()//payment made, end the timer
                                 }
                                
                              }
                         }
                     } catch let error {
                         print(error.localizedDescription)
                         timer.invalidate()//end the timer
                     }
                 })
                 task.resume()
                 
                 
                 
                 
             }//end of the else
          }
    }
    
    


}

