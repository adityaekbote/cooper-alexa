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

app.post = function(request, res, type, exception) {
 if (exception) {
   // always turn an exception into a successful response
   res.clear().say("An error occured: " + exception).send();
 }
 var session = request.getSession();
 if(session.get('Started')) {
 if (session.get('HP') && !session.get('TL')) {
   res.say("Tell me the Term Length.").send().shouldEndSession(false);
 }
 if (session.get('HP') && session.get('TL') && !session.get('HD')) {
   res.say("Tell me the downPayment").send().shouldEndSession(false);
 }
 }
 return false;
};
// HOMEPRICE INTENT
app.intent('homePrice', {
  'slots': {
    'HOMEPRICE': 'AMAZON.NUMBER',
  },
  'utterances': [
    '{my} {home|house|property} {cost|price|value} {|is|a} {-|HOMEPRICE} {|dollars}',
    '{-|HOMEPRICE} {|dollars}'
]
},
  function(req, res) {
    var session = req.getSession();
    if (req.slot('HOMEPRICE')) {
     session.set('HP',req.slot('HOMEPRICE'));
     res.shouldEndSession(false);
     return true;
  } else {
    res.say("I didn't get that clearly, please tell again!").shouldEndSession(false);
  }
  return false;
}
);

// HOMEDOWN INTENT
app.intent('homeDown', {
  'slots': {
    'HOMEDOWN': 'AMAZON.NUMBER',
  },
  'utterances': [
    '{|i} {will|would|may|} {|put down|put|have} {-|HOMEDOWN} {|dollars}',
    '{-|HOMEDOWN} {|dollars}'
]
},
  function(req, res) {
    var session = req.getSession();
    if (req.slot('HOMEDOWN')) {
     session.set('HD',req.slot('HOMEDOWN'));
     if (session.get('HP') && session.get('TL') && session.get('HD')) {
       var homePrice = session.get('HP');
       var termLength = session.get('TL');
       var homeDown = session.get('HD');
       if(termLength === 30){termLength = "fix30";}else if(termLength === 15){termLength = "fix15";}else{termLength = "fix30"}
       var requ = unirest("GET", "https://alexa-cooper.herokuapp.com/calcMort/"+ homePrice + "/"+ termLength + "/" + homeDown);
       requ.end(function (response) {
        if (response.error) throw new Error(response.error);
        var data = response.body;
        console.log(data);
        var saying = JSON.stringify(data);
        var monthlyPayment = Math.round(data.principalAndInterest+data.taxes+data.homeInsurance+data.mortgageInsurance);
    if(!data.mortgageInsurance){
    res.say("Your monthly payment will be $ "+monthlyPayment+"! It consists of $"+data.principalAndInterest+" of Principle and Interest, $"+data.taxes+" in taxes, $"+data.homeInsurance+" as home insurance and as your LTV is greater than 80%, you don't need a mortgage Insuarance! Contact me on 1-888-480-2432 now for a better understanding!").shouldEndSession(true).send();
    }else if(data.mortgageInsurance){
    res.say("Your monthly payment will be $ "+monthlyPayment+"! It consists of $"+data.principalAndInterest+" of Principle and Interest, $"+data.taxes+" in taxes, $"+data.homeInsurance+" as home insurance and "+data.mortgageInsurance+" for mortgage Insuarance! Contact me on 1-888-480-2432 now for a better understanding!").shouldEndSession(true).send();
    }
       });
     }
  } else {
    res.say("I didn't get that clearly, please tell again!").shouldEndSession(false);
  }
  return false;
}
);

// TERMLENGTH INTENT
app.intent('termLength', {
  'slots': {
    'TERMLENGTH': 'AMAZON.NUMBER',
  },
  'utterances': [
    '{|its} {|for|like} {-|TERMLENGTH} {|years}'
]
},
  function(req, res) {
    var session = req.getSession();
    if (req.slot('TERMLENGTH')) {
     session.set('TL',req.slot('TERMLENGTH'));
     res.shouldEndSession(false);
     return true;
  } else {
    res.say("I didn't get that clearly, please tell again!").shouldEndSession(false);
  }
  return false;
}
);
app.intent('calcMort', {
  'utterances': ['{i} {would|want} {to} {calculate|know|estimate} {my|a} {mortgage|loan}']
},
  function(req, res) {
    //get the slot
    var session = req.getSession();
    session.set('Started','true');
    var homePrice = session.get('HP');
    if (!homePrice) {
      session.set('Started','true');
    }
    var termLength = session.get('TL');
    var homeDown = session.get('HD');

    var reprompt_homeprice = 'Tell me the price of your new home.';
    var reprompt_termlength = 'Tell me the term length in years.';
    var reprompt_homeDown = 'Tell me the down payment amount.';
    if (_.isEmpty(homePrice)) {
      var prompt = 'I didn\'t get you. Tell me an the price of your home.';
      res.say(reprompt_homeprice).reprompt(prompt).shouldEndSession(false);
      return true;
    }
    if (_.isEmpty(termLength)) {
      var prompt = 'I didn\'t get you. Tell me an term length.';
      res.say(reprompt_termlength).reprompt(prompt).shouldEndSession(false);
      return true;
    }
    if (_.isEmpty(homeDown)) {
      var prompt = 'I didn\'t get you. Tell me a down payment amount.';
      res.say(reprompt_homeDown).reprompt(prompt).shouldEndSession(false);
      return true;
    }
     if (!(_.isEmpty(homePrice) && _.isEmpty(termLength) && _.isEmpty(homeDown))) {
       if(termLength === 30){termLength = "fix30";}else if(termLength === 15){termLength = "fix15";}else{termLength = "fix30"}
       var request = unirest("GET", "https://alexa-cooper.herokuapp.com/calcMort/"+ homePrice + "/"+ termLength + "/" + homeDown);
       request.end(function (response) {
        if (response.error) throw new Error(response.error);
        var data = response.body;
        console.log(data);
        var monthlyPayment = Math.round(data.principalAndInterest+data.taxes+data.homeInsurance+data.mortgageInsurance);
	if(!data.mortgageInsurance){
  res.say("Your monthly payment will be $ "+monthlyPayment+"! It consists of $"+data.principalAndInterest+" of Principle and Interest, $"+data.taxes+" in taxes, $"+data.homeInsurance+" as home insurance and as your LTV is greater than 80%, you don't need a mortgage Insuarance! Contact me on 1-888-480-2432 now for a better understanding!").send();
	}else if(data.mortgageInsurance){
		res.say("Your monthly payment will be $ "+monthlyPayment+"! It consists of $"+data.principalAndInterest+" of Principle and Interest, $"+data.taxes+" in taxes, $"+data.homeInsurance+" as home insurance and "+data.mortgageInsurance+" for mortgage Insuarance! Contact me on 1-888-480-2432 now for a better understanding!").send();
	}
       });
    return false;
    }
    return false;
  }
);
//hack to support custom utterances in utterance expansion string
console.log(app.utterances().replace(/\{\-\|/g, '{'));
module.exports = app;
