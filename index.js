'use strict';
module.change_code = 1;
var _ = require('lodash');
var Alexa = require('alexa-app');
var unirest = require("unirest");
var app = new Alexa.app('cooper');
var FAADataHelper = require('./faa_data_helper');

app.launch(function(req, res) {
  var prompt = 'Hey there, its Mr. Cooper, what would you like to know!';
  res.say(prompt).reprompt(prompt).shouldEndSession(false);
});

app.intent('calcMort', {
  'slots': {
    'HOMEPRICE': 'AMAZON.NUMBER',
    'TERMLENGTH': 'AMAZON.NUMBER',
    'HOMEDOWN': 'AMAZON.NUMBER'
  },
  'utterances': ['{|i} {|would|want} {|to} {|calculate|know|estimate} {|my|a} {|mortgage|loan}']
},
  function(req, res) {
    //get the slot
    var homePrice = req.slot('HOMEPRICE');
    var termLength = req.slot('TERMLENGTH');
    var homeDown = req.slot('HOMEDOWN');
    var reprompt_homeprice = 'Tell me the price of your new home.';
    var reprompt_termlength = 'Tell me the term length.';
    var reprompt_homeDown = 'Tell me the down payment amount.';
    if (_.isEmpty(homePrice)) {
      var prompt = 'I didn\'t get you. Tell me an the price of your home.';
      res.say(reprompt_homeprice).reprompt(prompt).shouldEndSession(false);
      return true;
    } else
    if (_.isEmpty(termLength)) {
      var prompt = 'I didn\'t get you. Tell me an term length.';
      res.say(reprompt_termlength).reprompt(prompt).shouldEndSession(false);
      return true;
    } else
    if (_.isEmpty(homeDown)) {
      var prompt = 'I didn\'t get you. Tell me a down payment amount.';
      res.say(reprompt_homeDown).reprompt(prompt).shouldEndSession(false);
      return true;
    }
     if (!(_.isEmpty(homePrice) && _.isEmpty(termLength) && _.isEmpty(homeDown))) {
       if(termLength === 30){termLength === "fix30";}else if(termLength === 15){termLength === "fix15";}else{termLength === "fix30"}
       var req = unirest("GET", "https://shaisachs-mortgage-payments-v1.p.mashape.com/payments");
       req.query({
  "downPayment": homeDown,
  "interestRate": "0.00425",
  "price": homePrice,
  "taxRate": "2.25",
  "type": termLength
});
req.headers({
  "cache-control": "no-cache",
  "x-mashape-key": "oWYe7fCBUWmshCJe5xNGDWaqMMztp1pdWIVjsnSR3LE4cSDVXA"
});
req.end(function (res) {
  if (res.error) throw new Error(res.error);
  res.say('OK'+ res.body);
  console.log(res.body);
});


// request(options, function (error, response, body) {
//   // var data = JSON.parse(response);
//   console.log(body);
//   var monthlyPayment = Math.round(data.principalAndInterest+data.taxes+data.homeInsurance+data.mortgageInsurance);
//   if(!data.mortgageInsurance){
//   res.say("Your monthly payment will be $ "+monthlyPayment+"! It consists of $"+data.principalAndInterest+" of Principle and Interest, $"+data.taxes+" in taxes, $"+data.homeInsurance+" as home insurance and as your LTV is greater than 80%, you don't need a mortgage Insuarance! Contact me on 1-888-480-2432 now for a better understanding!").send();
// 	}else if(data.mortgageInsurance){
// 		res.say("Your monthly payment will be $ "+monthlyPayment+"! It consists of $"+data.principalAndInterest+" of Principle and Interest, $"+data.taxes+" in taxes, $"+data.homeInsurance+" as home insurance and "+data.mortgageInsurance+" for mortgage Insuarance! Contact me on 1-888-480-2432 now for a better understanding!").send();
// 	}
// });
    }
    return false;
  }
);
//hack to support custom utterances in utterance expansion string
console.log(app.utterances().replace(/\{\-\|/g, '{'));
module.exports = app;
