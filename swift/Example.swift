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
        
        //your custom middleware endpoint that will transform and relay to BitPay
        let url = "<your-middleware>"
       
        var invoiceURL:Any?
        var monitorUrl:String!
        
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
                invoiceURL = dataJson["url"]
                print(invoiceURL) //this url will print in the console so you can see what is generated
               
                monitorUrl = invoiceURL as! String
                monitorUrl = monitorUrl.replacingOccurrences(of: "?id=", with: "/")
                monitorUrl = monitorUrl.replacingOccurrences(of: "invoice", with: "invoices")
                
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
                let invoiceUrl = monitorUrl + "?cachebuster=" + self.cacheBuster()
                let url = URL(string: invoiceUrl)! //change the url

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
                            if let dataJson = json["data"] as? Dictionary<String, Any> {
                                let invoiceStatus = dataJson["status"] as! String
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
    //used for the GET to make a fresh request when checking the status
    func cacheBuster() -> String {
       var cachebuster = ""
       let letters : NSString = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
       let len = UInt32(letters.length)
       let length = 25

        for _ in 0 ..< length {
            let rand = arc4random_uniform(len)
            var nextChar = letters.character(at: Int(rand))
            cachebuster += NSString(characters: &nextChar, length: 1) as String
        }
        return cachebuster
    }

    


}

