'use strict';
const crypto = require('crypto');
const requestIp = require('request-ip'); //to get IPs from incoming requests
const mongoose = require('mongoose');
require('dotenv').config();

const fetch = require('node-fetch'); //to perform requests


module.exports = function (app) {
  
  //set up request-ip middleware
  app.use(requestIp.mw());

  //create Mongoose model
  mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true });
  let StockSchema = new mongoose.Schema({
    symbol: {
      type: String,
      required: true
    },
    ipHashesLiking: {
      type: [String],
      default: []
    }
  });
  let Stock = mongoose.model('Stock', StockSchema, 'Stocks');

  app.route('/api/stock-prices')
    .get(async function (req, res){
      let stockList = req.query.stock
      const liking = req.query.like
      const ip = req.clientIp
      let dataList = [];
      
      //hash the ip
      const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
     
      if (typeof stockList == 'string'){ //if it's just one stock (it's a string and not an array)
        //make it an array with just itself
        stockList = [stockList];   
      } else if (!Array.isArray(stockList)) { //if it's not a string or an array, something has gone wrong
        res.json({error:"invalid input"});
        return;
      }

      //do the whole retrieval and liking process for the stocks (be it one or two)
      for (let stock of stockList){
        //upsert creates a document if doesn't find one
        const queryOptions = { upsert: true, new: true, setDefaultsOnInsert: true };
        // Find the document (stock database entry) or create it
        const doc = await Stock.findOneAndUpdate({ symbol: stock }, {} /*empty update*/, queryOptions);
        
        let likeAmount;
        if (liking == 'true') {
          let previouslyLiked = false;
          //check if has already been liked. If not previously liked, add like
          if (!doc.ipHashesLiking.includes(ipHash)) {
            doc.ipHashesLiking.push(ipHash)
            doc.save();
          }
        }
        likeAmount = doc.ipHashesLiking.length; //get number of likes

        //get stock price
        const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`);
        const responseJson = await response.json();
          //record data of current stock
          dataList.push({
            stock:stock,
            price:responseJson.latestPrice,
            likes:likeAmount
          });
      }
      
      //send response depending on dataList length
      if (dataList.length == 1) {
        //just send the data one stock
        res.json({stockData:dataList[0]});
        return;
      } else if (dataList.length == 2){
        //calculate relative likes for each stock
        dataList[0].rel_likes = dataList[0].likes - dataList[1].likes;
        dataList[1].rel_likes = dataList[1].likes - dataList[0].likes;
        //get rid of the likes field, which doesn't belong on the response for two stocks
        delete dataList[0].likes;
        delete dataList[1].likes;
        res.json({stockData:dataList});
        return;
      } else {
        console.log(dataList);
        throw new Error("Something has gone wrong")
      }
      
      
      
    });
    
};
