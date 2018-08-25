$(function () {

  var roundTripOptionsPerYear = parseFloat($('#roundTripOptionsPerYear').val()) || 0,
    avgOptionQuantityPerTrade = parseFloat($('#avgOptionQuantityPerTrade').val()) || 0,
    roundTripStocksPerYear = parseFloat($('#roundTripStocksPerYear').val()) || 0,
    avgStockQuantityPerTrade = parseFloat($('#avgStockQuantityPerTrade').val()) || 0,
    roundTripFuturesPerYear = parseFloat($('#roundTripFuturesPerYear').val()) || 0,
    avgFutureQuantityPerTrade = parseFloat($('#avgFutureQuantityPerTrade').val()) || 0,
    accountSize = parseFloat($('#accountSize').val()) || 0,

    optionBaseChargeOb = parseFloat($('#optionBaseChargeOb').val()) || 0,
    optionPerContractChargeOb = parseFloat($('#optionPerContractChargeOb').val()) || 0,
    hasOptionMinimumChargeOb = $('#hasOptionMinimumChargeOb').prop('checked'),
    optionMinimumChargeOb = parseFloat($('#optionMinimumChargeOb').val()) || 0,
    optionAdditionalFeesOb = parseFloat($('#optionAdditionalFeesOb').val()) || 0,
    optionFreeToCloseOb = $('#optionFreeToCloseOb').prop('checked'),
    optionCappedCommissionOb = $('#optionCappedCommissionOb').prop('checked'),
    optionCappedCommissionPerLegOb = parseFloat($('#optionCappedCommissionPerLegOb').val()) || 0,

    stockBaseChargeOb = parseFloat($('#stockBaseChargeOb').val()) || 0,
    stockPerShareChargeOb = parseFloat($('#stockPerShareChargeOb').val()) || 0,
    hasStockMinimumChargeOb = $('#hasStockMinimumChargeOb').prop('checked'),
    stockMinimumChargeOb = parseFloat($('#stockMinimumChargeOb').val()) || 0,
    stockFreeToCloseOb = $('#stockFreeToCloseOb').prop('checked'),

    futureBaseChargeOb = parseFloat($('#futureBaseChargeOb').val()) || 0,
    futurePerContractChargeOb = parseFloat($('#futurePerContractChargeOb').val()) || 0,
    futureAdditionalFeesOb = parseFloat($('#futureAdditionalFeesOb').val()) || 0,

    futureOptionBaseChargeOb = parseFloat($('#futureOptionBaseChargeOb').val()) || 0,
    futureOptionPerContractChargeOb = parseFloat($('#futureOptionPerContractChargeOb').val()) || 0,
    futureOptionFreeToCloseOb = $('#futureOptionFreeToCloseOb').prop('checked'),
    futureOptionAdditionalFeesOb = parseFloat($('#futureOptionAdditionalFeesOb').val()) || 0,

    optionBaseChargeTw = 0,
    optionPerContractChargeTw = 1,
    hasOptionMinimumChargeTw = false,
    optionMinimumChargeTw = 0,
    optionAdditionalFeesTw = 0.1,
    optionFreeToCloseTw = true,
    optionCappedCommissionTw = true,
    optionCappedCommissionPerLegTw = 10,

    stockBaseChargeTw = 5,
    stockPerShareChargeTw = 0.0008,
    hasStockMinimumChargeTw = false,
    stockMinimumChargeTw = 0,
    stockFreeToCloseTw = true,

    futureBaseChargeTw = 0,
    futurePerContractChargeTw = 1.25,
    futureAdditionalFeesTw = 0.3,

    futureOptionBaseChargeTw = 0,
    futureOptionPerContractChargeTw = 2.50,
    futureOptionFreeToCloseTw = true,
    futureOptionAdditionalFeesTw = 0.3;

  var ctx = document.getElementById("myChart").getContext('2d');
  var myChart = null;

  function reInitializeGlobals(){
    roundTripOptionsPerYear = parseFloat($('#roundTripOptionsPerYear').val()) || 0;
    avgOptionQuantityPerTrade = parseFloat($('#avgOptionQuantityPerTrade').val()) || 0;
    roundTripStocksPerYear = parseFloat($('#roundTripStocksPerYear').val()) || 0;
    avgStockQuantityPerTrade = parseFloat($('#avgStockQuantityPerTrade').val()) || 0;
    roundTripFuturesPerYear = parseFloat($('#roundTripFuturesPerYear').val()) || 0;
    avgFutureQuantityPerTrade = parseFloat($('#avgFutureQuantityPerTrade').val()) || 0;
    accountSize = parseFloat($('#accountSize').val()) || 0;

    optionBaseChargeOb = parseFloat($('#optionBaseChargeOb').val()) || 0;
    optionPerContractChargeOb = parseFloat($('#optionPerContractChargeOb').val()) || 0;
    hasOptionMinimumChargeOb = $('#hasOptionMinimumChargeOb').prop('checked');
    optionMinimumChargeOb = parseFloat($('#optionMinimumChargeOb').val()) || 0;
    optionAdditionalFeesOb = parseFloat($('#optionAdditionalFeesOb').val()) || 0;
    optionFreeToCloseOb = $('#optionFreeToCloseOb').prop('checked');
    optionCappedCommissionOb = $('#optionCappedCommissionOb').prop('checked');
    optionCappedCommissionPerLegOb = parseFloat($('#optionCappedCommissionPerLegOb').val()) || 0;

    stockBaseChargeOb = parseFloat($('#stockBaseChargeOb').val()) || 0;
    stockPerShareChargeOb = parseFloat($('#stockPerShareChargeOb').val()) || 0;
    hasStockMinimumChargeOb = $('#hasStockMinimumChargeOb').prop('checked');
    stockMinimumChargeOb = parseFloat($('#stockMinimumChargeOb').val()) || 0;
    stockFreeToCloseOb = $('#stockFreeToCloseOb').prop('checked');

    futureBaseChargeOb = parseFloat($('#futureBaseChargeOb').val()) || 0;
    futurePerContractChargeOb = parseFloat($('#futurePerContractChargeOb').val()) || 0;
    futureAdditionalFeesOb = parseFloat($('#futureAdditionalFeesOb').val()) || 0;

    futureOptionBaseChargeOb = parseFloat($('#futureOptionBaseChargeOb').val()) || 0;
    futureOptionPerContractChargeOb = parseFloat($('#futureOptionPerContractChargeOb').val()) || 0;
    futureOptionFreeToCloseOb = $('#futureOptionFreeToCloseOb').prop('checked');
    futureOptionAdditionalFeesOb = parseFloat($('#futureOptionAdditionalFeesOb').val()) || 0;
  }

  function calculateRoundTripCost(qty, base, per, thereIsMin, minCharge, additionalFees, isFreeToClose, isCapped, cappedAmount){
    if (qty){
      per_amount = qty * per;
      commission_cost = per_amount + base;
      if (thereIsMin){
        commission_cost = Math.max(commission_cost,minCharge);
      }
      if (isCapped){
        commission_cost = Math.min(commission_cost,cappedAmount);
      }
      roundTripMultiplier = 2;
      if (isFreeToClose){
        roundTripMultiplier = 1;
      }
      commission_cost *= roundTripMultiplier;
      feeAmount = additionalFees * qty * 2;
      roundTripCost = commission_cost + feeAmount;
      return roundTripCost;
    } else {
      return 0;
    }

  }

  function formatNumber(n) {
        return n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
    }

    function createChart(obComm, twComm){
      if (myChart) {
        myChart.destroy();
      }
      myChart = new Chart(ctx, {
          type: 'bar',
          data: {
              labels: ["other brokerage", "tastyworks"],
              datasets: [{
                  data: [obComm, twComm],
                  backgroundColor: [
                      '#E12529',
                      '#5DB101'
                  ],
                  borderColor: [
                      '#E12529',
                      '#5DB101'
                  ],
                  borderWidth: 1
              }]
          },
          options: {
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        return "$" + Number(tooltipItem.yLabel).toFixed(0).replace(/./g, function(c, i, a) {
                            return i > 0 && c !== "." && (a.length - i) % 3 === 0 ? "," + c : c;
                        });
                    }
                }
              },
              legend: {
                  display: false
              },
              scales: {
                  yAxes: [{
                      ticks: {
                          beginAtZero:true,
                          display:false
                      },
                      gridLines: {
                        color: "rgba(0, 0, 0, 0)",
                    }
                  }],
                  xAxes: [{
                    gridLines: {
                        color: "rgba(0, 0, 0, 0)",
                    },
                    ticks: {
                        fontSize:16
                    }
                }]
              }
          }
      });
    }

  function populateValues(){
    optionRoundTripString = "Round Trip Commission on " + avgOptionQuantityPerTrade + " contracts"
    $('#optionRoundTripString').html(optionRoundTripString);
    optionRoundTripOb = calculateRoundTripCost(avgOptionQuantityPerTrade, optionBaseChargeOb, optionPerContractChargeOb, hasOptionMinimumChargeOb, optionMinimumChargeOb, optionAdditionalFeesOb, optionFreeToCloseOb, optionCappedCommissionOb, optionCappedCommissionPerLegOb);
    $('#optionRoundTripOb').html('$' + formatNumber(optionRoundTripOb));
    optionRoundTripTw = calculateRoundTripCost(avgOptionQuantityPerTrade, optionBaseChargeTw, optionPerContractChargeTw, hasOptionMinimumChargeTw, optionMinimumChargeTw, optionAdditionalFeesTw, optionFreeToCloseTw, optionCappedCommissionTw, optionCappedCommissionPerLegTw);
    $('#optionRoundTripTw').html('$' + formatNumber(optionRoundTripTw));
    stockRoundTripString = "Round Trip Commissions on " + avgStockQuantityPerTrade + " shares";
    $('#stockRoundTripString').html(stockRoundTripString);
    stockRoundTripOb = calculateRoundTripCost(avgStockQuantityPerTrade, stockBaseChargeOb, stockPerShareChargeOb, hasStockMinimumChargeOb, stockMinimumChargeOb, 0, stockFreeToCloseOb, false, 0);
    $('#stockRoundTripOb').html('$' + formatNumber(stockRoundTripOb));
    stockRoundTripTw = avgStockQuantityPerTrade * stockPerShareChargeTw * 2 + stockBaseChargeTw;
    $('#stockRoundTripTw').html('$' + formatNumber(stockRoundTripTw));
    futureRoundTripString = "Round Trip Commissions on " + avgFutureQuantityPerTrade + " Contract(s)";
    $('#futureRoundTripString').html(futureRoundTripString);
    futureRoundTripOb = calculateRoundTripCost(avgFutureQuantityPerTrade, futureBaseChargeOb, futurePerContractChargeOb, false, 0, 0, false, false, 0);
    $('#futureRoundTripOb').html('$' + formatNumber(futureRoundTripOb));
    futureRoundTripTw = calculateRoundTripCost(avgFutureQuantityPerTrade, futureBaseChargeTw, futurePerContractChargeTw, false, 0, 0, false, false, 0);
    $('#futureRoundTripTw').html('$' + formatNumber(futureRoundTripTw));
    optionYearEndString = "Options commissions on " + roundTripOptionsPerYear + " round trips"
    $('#optionYearEndString').html(optionYearEndString);
    optionYearEndOb = roundTripOptionsPerYear * optionRoundTripOb
    $('#optionYearEndOb').html('$' + formatNumber(optionYearEndOb));
    optionYearEndTw = roundTripOptionsPerYear * optionRoundTripTw
    $('#optionYearEndTw').html('$' + formatNumber(optionYearEndTw));
    stockYearEndString = "Stock commissions on " + roundTripStocksPerYear + " round trips"
    $('#stockYearEndString').html(stockYearEndString);
    stockYearEndOb = roundTripStocksPerYear * stockRoundTripOb
    $('#stockYearEndOb').html('$' + formatNumber(stockYearEndOb));
    stockYearEndTw = roundTripStocksPerYear * stockRoundTripTw
    $('#stockYearEndTw').html('$' + formatNumber(stockYearEndTw));
    futureYearEndString = "Futures commissions on " + roundTripFuturesPerYear + " round trips"
    $('#futureYearEndString').html(futureYearEndString);
    futureYearEndOb = roundTripFuturesPerYear * futureRoundTripOb
    $('#futureYearEndOb').html('$' + formatNumber(futureYearEndOb));
    futureYearEndTw = roundTripFuturesPerYear * futureRoundTripTw
    $('#futureYearEndTw').html('$' + formatNumber(futureYearEndTw));
    totalEstimatedCommissionsOb = optionYearEndOb + stockYearEndOb + futureYearEndOb
    $('#totalEstimatedCommissionsOb').html('$' + formatNumber(totalEstimatedCommissionsOb));
    totalEstimatedCommissionsTw = optionYearEndTw + stockYearEndTw + futureYearEndTw
    $('#totalEstimatedCommissionsTw').html('$' + formatNumber(totalEstimatedCommissionsTw));
    createChart(totalEstimatedCommissionsOb, totalEstimatedCommissionsTw);
  }


  function showHide(){
    if (hasOptionMinimumChargeOb){
      $('#optionMinChargeRow').show();
    } else {
      $('#optionMinChargeRow').hide();
    }
    if (hasStockMinimumChargeOb || hasStockMinimumChargeTw){
      $('#stockMinChargeRow').show();
    } else {
      $('#stockMinChargeRow').hide();
    }
    if (optionCappedCommissionOb){
      $('#optionCappedRow').show();
    } else {
      $('#optionCappedRow').hide();
    }

  }

  function updateRowspan(){
    $('#optionCommission').attr('rowspan', $(".optionRow:visible").length);
    $('#stockCommission').attr('rowspan', $(".stockRow:visible").length);
    $('#futureCommission').attr('rowspan', $(".futureRow:visible").length);
    $('#futureOptionCommission').attr('rowspan', $(".futureOptionRow:visible").length);
  }

  function updatePage(){
    reInitializeGlobals();
    showHide();
    populateValues();
    updateRowspan();
  }

  updatePage();
  $('input[type=number]').keyup(updatePage);
  $('input[type=number]').change(updatePage);
  $(":checkbox").change(updatePage);



});
