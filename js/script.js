var stockPrice = 100.00;
var stockRegT = 0.5;
var stockMain = 0.25;
var optStndReq = 0.25;
var optMinReq = 0.15;
var optMulti = 100;
var stockQty = 0;
var options = [ // type: true means call, false means put // "Req's" are per contract
];


// option constructor
function option(){
    this.qty = 0;
    this.dte = 0;
    this.strike = 0;
    this.type = null;
    this.price = null;
    this.qtyAvail = 0;
}
function copyOption(original){
    var copy = new option();
    for (var property in original){
        if (original.hasOwnProperty(property)){
            copy[property] = original[property];
        }
    }
    return copy;
}

function gcd(a, b){
  if (b){
    return gcd(b, a % b);
  } else {
    return Math.abs(a);
  }
}
function gcdOfArray(arr){
  var length = arr.length;
  currentGcd = gcd(arr[0],arr[1]);
  for (i = 2; i < length; i++){
    currentGcd = gcd(arr[i],currentGcd)
  }
  return currentGcd;
}
function arrayMax(array){
    x = 0;
  array.forEach(function(item){
      if (item > x) {
        x = item;
    }
  });
  return x;
}
function arrayMin(array){
    x = 999999;
  array.forEach(function(item){
      if (item < x) {
        x = item;
    }
  });
  return x;
}
function numberWithCommas(x) {
    return x.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function numberWithCommasNoDecimal(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function clearTable(table){
  var rowCount = table.rows.length;
  for (var i = rowCount - 1; i > 0; i--){
    table.deleteRow(i);
  }
}

function clearRow(row){
  var colCount = row.cells.length;
  for (var i = colCount - 1; i >= 0; i--){
    row.deleteCell(i);
  }
}

function renderPage(){
  var longCalls = [], // separate option positions array into four arrays
    shortCalls = [],
    longPuts = [],
    shortPuts = [];

  options.forEach(function(option){ // loop through each option in the option position array
    option.qtyAvail = Math.abs(option.qty); // add a new property called "qtyAvail"
    var copy = copyOption(option);

    if (copy.qty > 0 && copy.type == true) { // add long calls to longCalls array
      longCalls.push(copy);
    } else if (copy.qty < 0 && copy.type == true) { // add short calls to shortCalls array
      var standardUncovered = optStndReq * stockPrice - Math.max(copy.strike - stockPrice, 0);
      var minimumUncovered = optMinReq * stockPrice;
      copy.uncoveredReq = (Math.max(standardUncovered, minimumUncovered) + copy.price) * optMulti; // calculate uncovered req per contract if not paired
      copy.coveredReq = Math.max(stockPrice - copy.strike, 0) * (1 - stockRegT) * optMulti; // calculate what req would be if paired with stock
      shortCalls.push(copy);``
    } else if (copy.qty > 0 && copy.type == false) {
      longPuts.push(copy);
    } else if (copy.qty < 0 && copy.type == false) {
      var standardUncovered = optStndReq * stockPrice - Math.max(stockPrice - copy.strike, 0);
      var minimumUncovered = optMinReq * copy.strike;
      copy.uncoveredReq = (Math.max(standardUncovered, minimumUncovered) + copy.price) * optMulti;
      copy.coveredReq = Math.max(copy.strike - stockPrice, 0) * optMulti;
      shortPuts.push(copy);
    } else {
      console.log("Something went wrong.")
    }
  });


  function findNexShortOption(callOrPut) { // callOrPut is a boolean value, true for call and false for put
    var maxDte = -2,
      limitStrikeReset = callOrPut ? 999999 : 0,
      limitStrike = limitStrikeReset,
      shortOptions = callOrPut ? shortCalls : shortPuts,
      nextShortOption = null;
    shortOptions.forEach(function(short){
      if (short.qtyAvail > 0 && short.dte >= maxDte){
        if (short.dte > maxDte){
          limitStrike = limitStrikeReset;
        }
        maxDte = short.dte;
        if ((callOrPut && short.strike < limitStrike) || (!callOrPut && short.strike > limitStrike)){
          limitStrike = short.strike;
          nextShortOption = short;
        }
      }
    });
    return nextShortOption;
  }
  function findLongForSpread(short, debitOrCredit){ // debitOrCredit is a boolean, true will look for a debit spread, false will look for credit spread
    var lowDte = 999999,
      callOrPut = short.type,
      limitStrike = (callOrPut && debitOrCredit) || (!callOrPut && !debitOrCredit) ? 0 : 999999,
      longOptions = callOrPut ? longCalls : longPuts,
      longForSpread = null;
    longOptions.forEach(function(long){
      if (long.qtyAvail > 0 && long.dte >= short.dte){
        if (debitOrCredit && ((callOrPut && long.strike <= short.strike && long.strike >= limitStrike) || (!callOrPut && long.strike >= short.strike && long.strike <= limitStrike)) ||
        !debitOrCredit && ((callOrPut && long.strike <= limitStrike) || (!callOrPut && long.strike >= limitStrike))){
          if (debitOrCredit && ((callOrPut && long.strike > limitStrike) || (!callOrPut && long.strike < limitStrike)) ||
          !debitOrCredit && ((callOrPut && long.strike < limitStrike) || (!callOrPut && long.strike > limitStrike))){
            lowDte = 999999;
          }
          limitStrike = long.strike;
          if (long.dte < lowDte){
            lowDte = long.dte;
            longForSpread = long;
          }
        }
      }
    });
    return longForSpread;
  }

  function qtyHandler(long, short){ // when creating verticals, calendars, or diagonals, determine spread qty and remaining qty for legs
      var spreadQty = 0;
      if (long.qtyAvail >= short.qtyAvail){ // if there are more than enough longs, apply them too all shorts
          spreadQty = short.qtyAvail;
          long.qtyAvail -= short.qtyAvail;
          short.qtyAvail = 0;
      } else { // if there aren't enough longs, apply as many as possible
          spreadQty = long.qtyAvail;
          short.qtyAvail -= long.qtyAvail;
          long.qtyAvail = 0;
      }
      return spreadQty;
  }

  // spread constructor
  function spread(legs) {
    this.legs = legs;
    this.qtyLegs = legs.length;
    this.legQtys = [];
    this.spreadQty = 0;
    this.spreadQtyAvail = 0;
    this.requirement = 0;
    this.reqPerSpread = 0;
    this.relief = 0;
    this.reliefPerSpread = 0;
    this.strikes = [];
    this.hasCalls = false;
    this.hasPuts = false;
    this.shortDte = -2;
    this.highStrike = 0;
    this.lowStrike = 0;
    this.lowestShortCall = null;
    this.highestShortCall = null;
    this.highestShortPut = null;
    this.lowestShortPut = null;
    this.calculate = function(){
        var strikes = this.strikes,
            legs = this.legs,
            legQtys = this.legQtys,
            legQtys = [];
            spreadQty = 0,
            requirement = 0,
            reqPerSpread = 0,
            hasCalls = false,
            hasPuts = false,
            maxReq = 0,
            relief = 0,
            shortDte = -2,
            lowestShortCallStrike = 999999,
            highestShortCallStrike = 0,
            highestShortPutStrike = 0,
            lowestShortPutStrike = 999999;
            lowestShortCall = null,
            highestShortCall = null,
            highestShortPut = null,
            lowestShortPut = null;

        legs.forEach(function(leg){
            strikes.push(leg.strike);
            legQtys.push(leg.qtyAvail);
            if (leg.qty < 0){
                shortDte = leg.dte;
                if (leg.type){
                  if (leg.strike < lowestShortCallStrike){
                    lowestShortCallStrike = leg.strike;
                    lowestShortCall = leg;
                  }
                  if (leg.strike > highestShortCallStrike){
                    highestShortCallStrike = leg.strike;
                    highestShortCall = leg;
                  }
                } else {
                  if (leg.strike < lowestShortPutStrike){
                    lowestShortPutStrike = leg.strike;
                    lowestShortPut = leg;
                  }
                  if (leg.strike > highestShortPutStrike){
                    highestShortPutStrike = leg.strike;
                    highestShortPut = leg;
                  }
                }
            }
            if (leg.type == true) {
              hasCalls = true;
            } else if (leg.type == false) {
                hasPuts = true;
            }
        });
        var highStrike = arrayMax(strikes),
            lowStrike = arrayMin(strikes);
      //calculate margin requirements or potential relief for spread
      strikes.forEach(function(strike){
          var netIntrinsic = 0;
          legs.forEach(function(leg){
          if (leg.type){ // if it's a call
              netIntrinsic += Math.max(0,(strike - leg.strike)) * leg.qty * optMulti;
          } else { // if it's a put
              netIntrinsic += Math.max(0,(leg.strike - strike)) * leg.qty * optMulti;
          }
        });
        maxReq = Math.max(maxReq, Math.abs(Math.min(0, netIntrinsic)));
        if (hasCalls == true && hasPuts == false && strike == highStrike){
              relief = Math.max(netIntrinsic,0);
          } else if (hasCalls == false && hasPuts == true && strike == lowStrike){
              relief = Math.max(netIntrinsic,0);
          }
        relief = Math.max(relief,0);
      });

      this.spreadQty = this.spreadQtyAvail = gcdOfArray(legQtys);
      this.legQtys = legQtys;
      this.highStrike = highStrike;
      this.lowStrike = lowStrike;
      this.requirement = maxReq;
      this.reqPerSpread = this.requirement / this.spreadQty;
      this.relief = relief;
      this.reliefPerSpread = this.relief / this.spreadQty;
      this.hasCalls = hasCalls;
      this.hasPuts = hasPuts;
      this.shortDte = shortDte;
      this.lowestShortCall = lowestShortCall;
      this.highestShortCall = highestShortCall;
      this.highestShortPut = highestShortPut;
      this.lowestShortPut = lowestShortPut;
    };
    this.calculate();
  }
  function copySpread(original){
      var copy = new spread(original.legs);
      for (var property in original){
          if (original.hasOwnProperty(property)){
              if (property == "legs") {
                  copy.legs = [];
                  original[property].forEach(function(leg){
                      var copiedOption = copyOption(leg);
                      copy.legs.push(copiedOption);
                  });
              } else {
                  copy[property] = original[property];
              }
          }
      }
      return copy;
  }

  var spreadArray = [],
      spreadArrayShortDtes = [];
      uncoveredShortCalls = [],
      uncoveredShortPuts = [];

  while (shortCalls.length || shortPuts.length){ // try to create two leg spreads if any shorts exist
    var currentShort = findNexShortOption(shortCalls.length), // find next short (true means call, false means put)
        spreadQty = 0,
        longForSpread = findLongForSpread(currentShort, true);
    if (!longForSpread){
      longForSpread = findLongForSpread(currentShort, false);
    }
    var shortCopy = copyOption(currentShort);
    if (longForSpread){ //create spread
      spreadQty = qtyHandler(longForSpread, currentShort);
      var longCopy = copyOption(longForSpread);
      longCopy.qty = longCopy.qtyAvail = shortCopy.qtyAvail = spreadQty;
      shortCopy.qty = spreadQty * -1;
      var newSpread = new spread([shortCopy,longCopy]);
      spreadArray.push(newSpread); // add to appropriate 2-leg spread array
      if (spreadArrayShortDtes.indexOf(newSpread.shortDte) < 0){
        spreadArrayShortDtes.push(newSpread.shortDte);
      }
      if (longForSpread.qty == 0){
        var longArray = longForSpread.type ? longCalls : longPuts;
        longArray.splice(longArray.indexOf(longForSpread), 1);
      }
    } else { // move short option to naked option array
        var uncoveredShortArray = shortCopy.type ? uncoveredShortCalls : uncoveredShortPuts;
        uncoveredShortArray.push(shortCopy); // add the copy of the short option to the uncovered short array
        currentShort.qtyAvail = 0; // set the original qtyAvail to 0 so it is removed from original short array
    }
    if (currentShort.qtyAvail == 0){
      var shortArray = currentShort.type ? shortCalls : shortPuts;
      shortArray.splice(shortArray.indexOf(currentShort),1);
    }
  };

  var universalSpreads = [];

  spreadArrayShortDtes.forEach(function(shortDte){
    var legs = [];
    spreadArray.forEach(function(spread){
      if (spread.shortDte == shortDte){
        legs = legs.concat(spread.legs);
      }
    });
    universalSpreads.push(new spread(legs));
  });

  var optionsForCovereds = [];
  var unpairedLongs = [];

  var stockHedgeQty = parseInt(stockQty / optMulti),
      accountIsLongStock = stockHedgeQty >= 1 ? true : false,
      accountIsShortStock = stockHedgeQty <= -1 ? true : false;
  stockHedgeQty = Math.abs(stockHedgeQty);


  while (stockHedgeQty) {
    var mostRelief = 0,
        nakedWithMostRelief = null,
        legOfInterestFromSpreadMostRelief = null;
        spreadWithMostRelief = null,
        uncoveredShorts = accountIsLongStock ? uncoveredShortCalls : uncoveredShortPuts;
    uncoveredShorts.forEach(function(uncoveredShort){
      var reliefIfPairedWithStock = uncoveredShort.uncoveredReq - uncoveredShort.coveredReq;
      if (reliefIfPairedWithStock > mostRelief){
        mostRelief = reliefIfPairedWithStock;
        nakedWithMostRelief = uncoveredShort;
      }
    });

    universalSpreads.forEach(function(universalSpread){
      if (((universalSpread.hasCalls && accountIsLongStock) || (universalSpread.hasPuts && accountIsShortStock)) && universalSpread.requirement){
        var newSpreadLegs = [],
            legOfInterest = accountIsLongStock ? universalSpread.lowestShortCall : universalSpread.highestShortPut;
        universalSpread.legs.forEach(function(leg){
          if (leg != legOfInterest){
            newSpreadLegs.push(leg);
          }
        });
        var newSpread = new spread(newSpreadLegs);
        var reliefIfPairedWithStock = universalSpread.reqPerSpread - newSpread.reqPerSpread - legOfInterest.coveredReq;
        if (reliefIfPairedWithStock > mostRelief){
          mostRelief = reliefIfPairedWithStock;
          spreadWithMostRelief = universalSpread;
          legOfInterestFromSpreadMostRelief = legOfInterest;
        }
      }
    });

    if (spreadWithMostRelief){
      var longsToRemove = 0;
      if (legOfInterestFromSpreadMostRelief.qtyAvail <= stockHedgeQty){
        longsToRemove = legOfInterestFromSpreadMostRelief.qtyAvail;
        optionsForCovereds.push(legOfInterestFromSpreadMostRelief);
        stockHedgeQty -= legOfInterestFromSpreadMostRelief.qtyAvail;
        spreadWithMostRelief.legs.splice(spreadWithMostRelief.legs.indexOf(legOfInterestFromSpreadMostRelief),1);
      } else {
        longsToRemove = stockHedgeQty;
        var copiedOption = copyOption(legOfInterestFromSpreadMostRelief);
        copiedOption.qty = stockHedgeQty * -1;
        copiedOption.qtyAvail = stockHedgeQty;
        optionsForCovereds.push(copiedOption);
        legOfInterestFromSpreadMostRelief.qty += stockHedgeQty;
        legOfInterestFromSpreadMostRelief.qtyAvail -= stockHedgeQty;
        stockHedgeQty = 0;
      }
      while (longsToRemove){ // remove 1 long for each short that was removed from spread
        var longLegOfInterest = null,
            limitStrike = accountIsLongStock ? 0 : 999999;

        spreadWithMostRelief.legs.forEach(function(leg){
          if (leg.qty > 0 && ((leg.type && leg.strike > limitStrike) || (!leg.type && leg.strike < limitStrike))){
            limitStrike = leg.strike;
            longLegOfInterest = leg;
          }
        });

        if (longLegOfInterest.qtyAvail <= longsToRemove){
          longsToRemove -= longLegOfInterest.qtyAvail;
          unpairedLongs.push(longLegOfInterest);
          spreadWithMostRelief.legs.splice(spreadWithMostRelief.legs.indexOf(longLegOfInterest),1);
        } else {
          var newOption = copyOption(longLegOfInterest);
          longLegOfInterest.qtyAvail -= longsToRemove;
          newOption.qty = newOption.qytAvail = longsToRemove;
          longsToRemove = 0;
          unpairedLongs.push(newOption);
        }
      }
      spreadWithMostRelief.calculate();
    } else {
      if (nakedWithMostRelief){
        if (nakedWithMostRelief.qtyAvail <= stockHedgeQty){
          optionsForCovereds.push(nakedWithMostRelief);
          uncoveredShorts.splice(uncoveredShorts.indexOf(nakedWithMostRelief),1);
          stockHedgeQty -= nakedWithMostRelief.qtyAvail;
        } else {
          var copiedOption = copyOption(nakedWithMostRelief);
          copiedOption.qty = stockHedgeQty * -1;
          copiedOption.qtyAvail = stockHedgeQty;
          optionsForCovereds.push(copiedOption);
          nakedWithMostRelief.qty += stockHedgeQty;
          nakedWithMostRelief.qtyAvail -= stockHedgeQty;
          stockHedgeQty = 0;
        }
      } else {
        stockHedgeQty = 0;
      }
    }
  }

  //straddle/strangle constructor
  function straddle(legs) {
    this.legs = legs;
    this.spreadQty = legs[0].qtyAvail;
    this.requirement = 0;
    this.reqPerSpread = 0;
    this.calculate = function(){
      var legs = this.legs,
          quantity = this.spreadQty,
          reqPerSpread = 0;
      if (legs[0].uncoveredReq > legs[1].uncoveredReq){
        reqPerSpread = legs[0].uncoveredReq + legs[1].price * optMulti;
      } else {
        reqPerSpread = legs[1].uncoveredReq + legs[0].price * optMulti;
      }
      this.reqPerSpread = reqPerSpread;
      this.requirement = reqPerSpread * quantity;
    }
    this.calculate();
  }

  var straddles = [];

  while (uncoveredShortCalls.length && uncoveredShortPuts.length){
    // find highest requirement short call
    var currentUncoveredCall = null,
        currentUncoveredPut = null,
        highestReq = 0;
    uncoveredShortCalls.forEach(function(call){
      if (call.uncoveredReq > highestReq){
        currentUncoveredCall = call;
        highestReq = call.uncoveredReq;
      }
    });
    highestReq = 0;
    // find highest requirement short put
    uncoveredShortPuts.forEach(function(put){
      if (put.uncoveredReq > highestReq){
        currentUncoveredPut = put;
        highestReq = put.uncoveredReq;
      }
    });

    var callCopy = copyOption(currentUncoveredCall);
    var putCopy = copyOption(currentUncoveredPut);

    // create a strangle with them and remove them from uncovered

    if (currentUncoveredCall.qtyAvail <= currentUncoveredPut.qtyAvail){
      putCopy.qty = putCopy.qtyAvail = currentUncoveredCall.qtyAvail;
      currentUncoveredPut.qtyAvail -= currentUncoveredCall.qtyAvail;
      currentUncoveredCall.qtyAvail = 0;
    } else {
      callCopy.qty = callCopy.qtyAvail = currentUncoveredPut.qtyAvail;
      currentUncoveredCall.qtyAvail -= currentUncoveredPut.qtyAvail;
      currentUncoveredPut.qtyAvail = 0;
    }
    var legs =[callCopy, putCopy];
    var straddle = new straddle(legs);
    straddles.push(straddle);

    if (currentUncoveredCall.qtyAvail == 0){
      uncoveredShortCalls.splice(uncoveredShortCalls.indexOf(currentUncoveredCall), 1);
    }
    if (currentUncoveredPut.qtyAvail == 0){
      uncoveredShortPuts.splice(uncoveredShortPuts.indexOf(currentUncoveredPut), 1);
    }
  }

  var totalSpreadReq = 0;
  universalSpreads.forEach(function(universalSpread){
    if (universalSpread.legs.length){
      totalSpreadReq += universalSpread.requirement;
    } else {
      universalSpreads.splice(universalSpreads.indexOf(universalSpread), 1);
    }
  });

  var totalUncoveredCallReq = 0;
  uncoveredShortCalls.forEach(function(uncoveredShortCall){
    totalUncoveredCallReq += uncoveredShortCall.uncoveredReq * uncoveredShortCall.qtyAvail;
  });

  var totalUncoveredPutReq = 0;
  uncoveredShortPuts.forEach(function(uncoveredShortPut){
    totalUncoveredPutReq += uncoveredShortPut.uncoveredReq * uncoveredShortPut.qtyAvail;
  });

  var straddleReg = 0;
  straddles.forEach(function(straddle){
    straddleReg += straddle.requirement;
  });

  var sharesCovered = 0;
  var totalStockAndCoveredReq = Math.abs(stockQty * stockPrice * stockRegT);
  optionsForCovereds.forEach(function(optionForCovered){
    sharesCovered += optionForCovered.qtyAvail * optMulti;
    totalStockAndCoveredReq += optionForCovered.coveredReq * optionForCovered.qtyAvail;
  });

  var straddleReg = 0;
  straddles.forEach(function(straddle){
    straddleReg += straddle.requirement;
  });

  longCalls.forEach(function(long){
    if (long.qtyAvail > 0){unpairedLongs.push(long);}
  });

  longPuts.forEach(function(long){
    if (long.qtyAvail > 0){unpairedLongs.push(long);}
  });



  var totalRequirement = totalSpreadReq + totalUncoveredCallReq + totalUncoveredPutReq + straddleReg + totalStockAndCoveredReq;

  var nakedShorts = uncoveredShortCalls.concat(uncoveredShortPuts);


  var table = document.getElementById("globalInfo");
  clearTable(table);

  var row = table.insertRow(-1);
  var cell = row.insertCell(-1);
  cell.innerHTML = "$" + numberWithCommas(stockPrice);
  cell = row.insertCell(-1);
  cell.innerHTML = numberWithCommasNoDecimal(stockQty);
  cell = row.insertCell(-1);
  cell.innerHTML = (stockRegT * 100) + "%";
  cell = row.insertCell(-1);
  cell.innerHTML = (optStndReq * 100) + "%";
  cell = row.insertCell(-1);
  cell.innerHTML = (optMinReq * 100) + "%";
  cell = row.insertCell(-1);
  cell.innerHTML = "edit";
  cell.className = "addDelete";

  cell.onclick = function(){
    var table = document.getElementById("globalInfo");
    clearTable(table);
    var row = table.insertRow(-1),
        cell = row.insertCell(-1),
        field = document.createElement("input");
    field.setAttribute("id", "stockPriceInput");
    field.defaultValue = stockPrice;
    cell.appendChild(field);
    cell = row.insertCell(-1);
    field = document.createElement("input");
    field.setAttribute("id", "stockQtyInput");
    field.defaultValue = stockQty;
    cell.appendChild(field);
    cell = row.insertCell(-1);
    field = document.createElement("input");
    field.setAttribute("id", "stockRegTInput");
    field.defaultValue = stockRegT;
    cell.appendChild(field);
    cell = row.insertCell(-1);
    field = document.createElement("input");
    field.setAttribute("id", "optionStandardInput");
    field.defaultValue = optStndReq;
    cell.appendChild(field);
    cell = row.insertCell(-1);
    field = document.createElement("input");
    field.setAttribute("id", "optionMinInput");
    field.defaultValue = optMinReq;
    cell.appendChild(field);
    cell = row.insertCell(-1);
    cell = row.insertCell(-1);
    cell.innerHTML = "save";
    cell.className = "addDelete";
    cell.onclick = function(){
      stockPrice = parseFloat(document.getElementById('stockPriceInput').value);
      stockQty = parseInt(document.getElementById('stockQtyInput').value);
      stockRegT = parseFloat(document.getElementById('stockRegTInput').value);
      optStndReq = parseFloat(document.getElementById('optionStandardInput').value);
      optMinReq = parseFloat(document.getElementById('optionMinInput').value);
      renderPage();
    }
  }

  table = document.getElementById("optionPositions");
  clearTable(table);
  if (options.length == 0){
  } else {
    /*
    options.sort(
      function(a, b){
        if (a.dte != b.dte){
          return a.dte - b.dte;
        } else if (a.strike != b.strike){
          return a.strike - b.strike;
        } else {
          return b.type - a.type;
        }
      }
    )
    */
    var optionIdCounter = 0;
    options.forEach(function(option){
      var optionId = optionIdCounter;
      optionIdCounter++;
      var callPut = option.type ? "Call" : "Put"
      var defaultQty = option.qty,
          defaultStrike = option.strike,
          defaultType = option.type,
          defaultDte = option.dte,
          defaultPrice = option.price
          thisOption = option;
      var row = table.insertRow(-1);
      var cell = row.insertCell(-1);
      cell.innerHTML = option.qty;
      cell = row.insertCell(-1);
      cell.innerHTML = option.strike;
      cell = row.insertCell(-1);
      cell.innerHTML = callPut;
      cell = row.insertCell(-1);
      cell.innerHTML = option.dte;
      cell = row.insertCell(-1);
      cell.innerHTML = "$" + numberWithCommas(option.price);
      cell = row.insertCell(-1);
      cell.innerHTML = "edit";
      cell.className = "addDelete";
      cell.onclick = function(){
        // options.splice(options.indexOf(option), 1);
        clearRow(row);
        var cell = row.insertCell(-1);
        var field = document.createElement("input");
        field.setAttribute("id", "qtyInput" + optionId);
        field.defaultValue = defaultQty;
        cell.appendChild(field);
        cell = row.insertCell(-1);
        field = document.createElement("input");
        field.setAttribute("id", "strikeInput" + optionId);
        field.defaultValue = defaultStrike;
        cell.appendChild(field);
        cell = row.insertCell(-1);
        field = document.createElement("select");
        field.setAttribute("id", "typeInput" + optionId);
        var option = document.createElement("option");
        option.text = "Call";
        option.value = true;
        field.add(option);
        option = document.createElement("option");
        option.text = "Put";
        option.value = false;
        field.add(option);
        field.selectedIndex = !defaultType;
        cell.appendChild(field);
        cell = row.insertCell(-1);
        field = document.createElement("input");
        field.setAttribute("id", "dteInput" + optionId);
        field.defaultValue = defaultDte;
        cell.appendChild(field);
        cell = row.insertCell(-1);
        field = document.createElement("input");
        field.setAttribute("id", "priceInput" + optionId);
        field.defaultValue = defaultPrice;
        cell.appendChild(field);
        cell = row.insertCell(-1);
        cell.innerHTML = "save"
        cell.className = "addDelete";
        cell.onclick = function(){
          var newOption = {};
          newOption.qty = parseInt(document.getElementById('qtyInput' + optionId).value);
          newOption.strike = parseFloat(document.getElementById('strikeInput' + optionId).value);
          var e = document.getElementById('typeInput' + optionId);
          newOption.type = e.options[e.selectedIndex].value == "true" ? true : false;
          newOption.dte = parseInt(document.getElementById('dteInput' + optionId).value);
          newOption.price = parseFloat(document.getElementById('priceInput' + optionId).value);
          // options.push(newOption);
          options.splice(optionId, 0, newOption)
          options.splice(options.indexOf(thisOption),1);
          renderPage();
        }
      }

      cell = row.insertCell(-1);
      cell.innerHTML = "delete"
      cell.className = "addDelete";
      cell.onclick = function(){
        options.splice(options.indexOf(option), 1);
        renderPage();
      }
    });
  }

  row = table.insertRow(-1);
  cell = row.insertCell(-1);
  var field = document.createElement("input");
  field.setAttribute("id", "qtyInput");
  cell.appendChild(field);
  cell = row.insertCell(-1);
  field = document.createElement("input");
  field.setAttribute("id", "strikeInput");
  cell.appendChild(field);
  cell = row.insertCell(-1);
  field = document.createElement("select");
  field.setAttribute("id", "typeInput");
  var option = document.createElement("option");
  option.text = "Call";
  option.value = true;
  field.add(option);
  option = document.createElement("option");
  option.text = "Put";
  option.value = false;
  field.add(option);
  cell.appendChild(field);
  cell = row.insertCell(-1);
  field = document.createElement("input");
  field.setAttribute("id", "dteInput");
  field.defaultValue = 45;
  cell.appendChild(field);
  cell = row.insertCell(-1);
  field = document.createElement("input");
  field.setAttribute("id", "priceInput");
  field.defaultValue = 5;
  cell.appendChild(field);
  cell = row.insertCell(-1);
  cell.innerHTML = "add"
  cell.className = "addDelete";
  cell.onclick = function(){
    var newOption = {};
    newOption.qty = parseInt(document.getElementById('qtyInput').value);
    newOption.strike = parseFloat(document.getElementById('strikeInput').value);
    var e = document.getElementById('typeInput');
    newOption.type = e.options[e.selectedIndex].value == "true" ? true : false;
    newOption.dte = parseInt(document.getElementById('dteInput').value);
    newOption.price = parseFloat(document.getElementById('priceInput').value);
    options.push(newOption);
    renderPage();
  }

  table = document.getElementById("pairings");
  clearTable(table);

  if (nakedShorts.length != 0 || straddles.length != 0){
    var nakedCount = 1;
    nakedShorts.forEach(function(nakedShort){
      if (nakedShort.qtyAvail){
        var uncoveredName = "uncovered short #" + nakedCount;
        nakedCount++;
        var callPut = nakedShort.type ? "Call" : "Put";
        var optionRequirement = numberWithCommas(nakedShort.uncoveredReq * nakedShort.qtyAvail);
        var row = table.insertRow(-1);
        var cell = row.insertCell(-1);
        cell.innerHTML = uncoveredName;
        cell.colSpan = 5;
        cell.className = "spreadSummary";
        cell = row.insertCell(-1);
        cell.innerHTML = optionRequirement;
        cell.className = "spreadSummary";

        row = table.insertRow(-1);
        cell = row.insertCell(-1);
        cell.innerHTML = nakedShort.qtyAvail * -1;
        cell = row.insertCell(-1);
        cell.innerHTML = nakedShort.strike;
        cell = row.insertCell(-1);
        cell.innerHTML = callPut;
        cell = row.insertCell(-1);
        cell.innerHTML = nakedShort.dte;
        cell = row.insertCell(-1);
        cell.innerHTML = "$" + numberWithCommas(nakedShort.price);
        cell = row.insertCell(-1);
        cell.innerHTML = "";
      }
    });

    straddleCount = 1;
    straddles.forEach(function(straddle){
      var straddleName = "straddle/strangle #" + straddleCount;
      straddleCount++;
      var straddleRequirement = numberWithCommas(straddle.requirement);
      var row = table.insertRow(-1);
      var cell = row.insertCell(-1);
      cell.innerHTML = straddleName;
      cell.colSpan = 5;
      cell.className = "spreadSummary";
      cell = row.insertCell(-1);
      cell.innerHTML = straddleRequirement;
      cell.className = "spreadSummary";

      straddle.legs.forEach(function(leg){
        if (leg.qtyAvail){
          var callPut = leg.type ? "Call" : "Put";
          row = table.insertRow(-1);
          cell = row.insertCell(-1);
          cell.innerHTML = leg.qtyAvail * -1;
          cell = row.insertCell(-1);
          cell.innerHTML = leg.strike;
          cell = row.insertCell(-1);
          cell.innerHTML = callPut;
          cell = row.insertCell(-1);
          cell.innerHTML = leg.dte;
          cell = row.insertCell(-1);
          cell.innerHTML = "$" + numberWithCommas(leg.price);
          cell = row.insertCell(-1);
          cell.innerHTML = "";
        }
      });
    });
  }

  if (universalSpreads.length != 0){
    var spreadCount = 1;
    universalSpreads.forEach(function(universalSpread){
      var spreadName = "spread #" + spreadCount;
      spreadCount++;
      var row = table.insertRow(-1);
      var cell = row.insertCell(-1);
      cell.innerHTML = spreadName;
      cell.colSpan = 5;
      cell.className = "spreadSummary";
      cell = row.insertCell(-1);
      cell.innerHTML = numberWithCommas(universalSpread.requirement);
      cell.className = "spreadSummary";
      universalSpread.legs.sort(
        function(a, b){
          if (a.strike != b.strike){
            return a.strike - b.strike
          } else {
            return b.type - a.type;
          }

        }
      )

      universalSpread.legs.forEach(function(leg){
        if (leg.qtyAvail) {
          var callPut = leg.type ? "Call" : "Put"
          row = table.insertRow(-1);
          cell = row.insertCell(-1);
          cell.innerHTML = leg.qty;
          cell = row.insertCell(-1);
          cell.innerHTML = leg.strike;
          cell = row.insertCell(-1);
          cell.innerHTML = callPut;
          cell = row.insertCell(-1);
          cell.innerHTML = leg.dte;
          cell = row.insertCell(-1);
          cell.innerHTML = "$" + numberWithCommas(leg.price);
          cell = row.insertCell(-1);
          cell.innerHTML = "";
        }
      });
    });
  }

  if (totalStockAndCoveredReq != 0){
    var row = table.insertRow(-1);
    var cell = row.insertCell(-1);
    cell.innerHTML = optionsForCovereds.length ? stockQty + " shares (with covereds)" : stockQty + " shares";
    cell.colSpan = 5;
    cell.className = "spreadSummary";
    cell = row.insertCell(-1);
    cell.innerHTML = numberWithCommas(totalStockAndCoveredReq);
    cell.className = "spreadSummary";

    optionsForCovereds.forEach(function(leg){
      var callPut = leg.type ? "Call" : "Put";
      var optionRequirement = numberWithCommas(leg.coveredReq * leg.qtyAvail);
      var row = table.insertRow(-1);
      var cell = row.insertCell(-1);
      cell.innerHTML = leg.qtyAvail * -1;
      cell = row.insertCell(-1);
      cell.innerHTML = leg.strike;
      cell = row.insertCell(-1);
      cell.innerHTML = callPut;
      cell = row.insertCell(-1);
      cell.innerHTML = leg.dte;
      cell = row.insertCell(-1);
      cell.innerHTML = "$" + numberWithCommas(leg.price);
      cell = row.insertCell(-1);
      cell.innerHTML = "";
    });
  }

  if (unpairedLongs.length != 0){
    var row = table.insertRow(-1);
    var cell = row.insertCell(-1);
    cell.innerHTML = "unpaired longs";
    cell.colSpan = 5;
    cell.className = "spreadSummary";
    cell = row.insertCell(-1);
    cell.innerHTML = numberWithCommas(0);
    cell.className = "spreadSummary";

    unpairedLongs.forEach(function(leg){
      var callPut = leg.type ? "Call" : "Put";
      var row = table.insertRow(-1);
      var cell = row.insertCell(-1);
      cell.innerHTML = leg.qtyAvail;
      cell = row.insertCell(-1);
      cell.innerHTML = leg.strike;
      cell = row.insertCell(-1);
      cell.innerHTML = callPut;
      cell = row.insertCell(-1);
      cell.innerHTML = leg.dte;
      cell = row.insertCell(-1);
      cell.innerHTML = "$" + numberWithCommas(leg.price);
      cell = row.insertCell(-1);
      cell.innerHTML = "";
    });
  }

  var row = table.insertRow(-1);
  var cell = row.insertCell(-1);
  cell.innerHTML = "total";
  cell.colSpan = 5;
  cell.className = "summary";
  cell = row.insertCell(-1);
  cell.className = "summary";
  cell.innerHTML = numberWithCommas(totalRequirement);

}



renderPage();
