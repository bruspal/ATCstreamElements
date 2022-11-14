// Principe : Tour de controle qui pilote l'affichage
// * tout stocker dans SE_API.store
// * comparer avec les data de SE/TWITCH pour resynchroniser les subs
// Variables générique
let SEdata = null;
let fields = null;

// A mettre en fields
let instanceName = 'touristATC';


// Valeur en subPoint par type de sub
const valSubPoint = {
  subPrime: 1,
  subGifted: 1,
  subT1: 1,
  subT2: 2,
  subT3: 5
};

// Données générale du widget
let widgetData = {
  subPrime: 0,
  subPrimeDollars: 0,
  subGifted: 0,
  subGiftedDollars: 0,
  subT1: 0,
  subT1Dollars: 0,
  subT2: 0,
  subT2Dollars: 0,
  subT3: 0,
  subT3Dollars: 0,
  totalSubs: 0,
  totalSubsSE: 0,
  subPoints: 0,
  subPointsDollars: 0,
  tips: 0,
  cheers: 0,
  cheersDollars: 0,
  totalDollars: 0,
  objectif: 0,
  percentObjectif: 0.0,
  dollarsBySubPoint: 0,
  dollarsByCheers: 0,
  dateLastWrite: new Date()
};
$('#loading').show();

/*
Widget Init :
- Recup widgetData
- Recup bilan de streamElement
- recaler les sub dans les widgetData si necessaire.
 */
window.addEventListener('onWidgetLoad', function (obj) {
  //debugger;
  let updateAtLaunch = false;
  SEdata = obj["detail"]["session"]["data"];
  fields = obj["detail"]["fieldData"];
  /*
  console.log(SEdata);
  console.log(fields);
  */

  // Récupération des données de la DB streamElement
  SE_API.store.get(instanceName).then((ret) => {
    if (ret === null) {
      // L'instance n'est pas initialisé ? on l'initialise
      // Init avec les data de SE
      widgetData.totalSubsSE = SEdata['subscriber-month'].count;
      widgetData.cheers = SEdata['cheer-month'].amount;
      widgetData.tips = SEdata['tip-month'].amount;
      calculData();
      updateUi();
      saveData();
    } else {
      // Chargement de l'instance
      widgetData = ret;
    }
  }).then(function () {
    calculData();
    updateUi();
    $('#loading').fadeOut();
    // On demande un refresh aux widgets lié
    /*
    debugger;
    let eventName = instanceName+'_refresh';
    SE_API.sendMessage(eventName, true).then((ret) => {console.log(ret)});
    */
  });
});

/*
Event recut :
nouveau sub : on calcul
nouveau tiers : on calcul
nouveau tips : on calcul
on sauve
*/
window.addEventListener('onEventReceived', function (obj) {
  const listener = obj.detail.listener;
  const event = obj["detail"]["event"];
  // Traitement des subs
  if (listener == 'subscriber-latest') {
    //debugger;
    if (event["tier"] == "prime") {
      if (!!event.gifted || !!event.bulkGifted) {
        tiersSub = "subGifted";
      } else {
        tiersSub = "subPrime";
      }
    }
    if (event["tier"] == "1000") {
      tiersSub = "subT1";
    }
    if (event["tier"] == "2000") {
      tiersSub = "subT2";
    }
    if (event["tier"] == "3000") {
      tiersSub = "subT3";
    }
    widgetData[tiersSub] += parseInt(event.amount);
    widgetData.totalSubs += parseInt(event.amount);
    widgetData.totalSubsSE += parseInt(event.amount);
    calculData();
    saveData();
    updateUi();
  }

  // Traitement cheer
  if (listener == 'cheer-latest') {
    //debugger;
    widgetData.cheers += parseInt(event.amount);
    calculData();
    saveData();
    updateUi();
  }

  // Traitement tips
  if (listener == 'tip-latest') {
    //debugger;
    widgetData.tips += parseInt(event.amount);
    calculData();
    saveData();
    updateUi();
  }
});

function calculData() {
  //debugger;
  // Calcul $ cheer
  widgetData.cheersDollars = round(widgetData.cheers * widgetData.dollarsByCheers);
  // calcul subpoints
  widgetData.subPoints = round((widgetData.subPrime * valSubPoint.subPrime) +
    (widgetData.subGifted * valSubPoint.subGifted) +
    (widgetData.subT1 * valSubPoint.subT1) +
    (widgetData.subT2 * valSubPoint.subT2) +
    (widgetData.subT3 * valSubPoint.subT3));
  // calcul $ subPoints
  widgetData.subPointsDollars = round(widgetData.subPoints * widgetData.dollarsBySubPoint);
  // calcul $ par tiers
  widgetData.subPrimeDollars = round(widgetData.subPrime * valSubPoint.subPrime * widgetData.dollarsBySubPoint);
  widgetData.subGiftedDollars = round(widgetData.subGifted * valSubPoint.subGifted * widgetData.dollarsBySubPoint);
  widgetData.subT1Dollars = round(widgetData.subT1 * valSubPoint.subT1 * widgetData.dollarsBySubPoint);
  widgetData.subT2Dollars = round(widgetData.subT2 * valSubPoint.subT2 * widgetData.dollarsBySubPoint);
  widgetData.subT3Dollars = round(widgetData.subT3 * valSubPoint.subT3 * widgetData.dollarsBySubPoint);
  // TotalSubs par tier
  widgetData.totalSubs = round(widgetData.subPrime + widgetData.subGifted + widgetData.subT1 + widgetData.subT2 + widgetData.subT3);
  // Calcul total dollars
  widgetData.totalDollars = widgetData.subPointsDollars + widgetData.cheersDollars + widgetData.tips;
  // Calcul percent objectif
  widgetData.percentObjectif = round(
    (widgetData.totalDollars * 100) / widgetData.objectif
  );
}


function saveData(forceDate) {
  //debugger;
  if (forceDate === undefined) {
    widgetData.dateLastWrite = new Date();
  } else {
    widgetData.dateLastWrite = forceDate;
  }
  SE_API.store.set(instanceName, widgetData);
}

function sendMessage(message, data) {
  message = instanceName + '_' + message;
  SE_API.store.set(message, {
    custom: true,
    payload: data
  })
}

function updateUi() {
  //    console.log(widgetData);
  //    return;
  //debugger;
  // Affichage des données non modifiable
  $('#subPointStat').text(widgetData.subPoints);
  $('#totalSubsStat').text(widgetData.totalSubs);
  $('#subDollarsStat').text(widgetData.subPointsDollars);
  $('#dollarsByCheersStat').text(widgetData.cheersDollars);
  $('#totalDollarsStat').text(widgetData.totalDollars);
  $('#objectifPercentStat').text(widgetData.percentObjectif);

  $('#dollarsByPrimeStat').text(widgetData.subPrimeDollars);
  $('#dollarsByGiftedStat').text(widgetData.subGiftedDollars);
  $('#dollarsByT1Stat').text(widgetData.subT1Dollars);
  $('#dollarsByT2Stat').text(widgetData.subT2Dollars);
  $('#dollarsByT3Stat').text(widgetData.subT3Dollars);

  // Remplissage des widgets editable
  // Prime et etc
  $("#subPrime").val(widgetData.subPrime);
  $("#subGifted").val(widgetData.subGifted);
  $("#subT1").val(widgetData.subT1);
  $("#subT2").val(widgetData.subT2);
  $("#subT3").val(widgetData.subT3);
  $("#cheers").val(widgetData.cheers);
  $("#tips").val(widgetData.tips);
  // parametrage du widget
  $('#objectif').val(widgetData.objectif);
  $('#dollarsBySubPoints').val(widgetData.dollarsBySubPoint);
  $('#dollarsByCheers').val(widgetData.dollarsByCheers);
}

function round(nombre) {
  return Math.round((nombre + Number.EPSILON) * 100) / 100;
}

function synchronise() {

}

/* Interactivité */
// Update
$("#updateGoal").click(function () {
  widgetData.subPrime = parseInt($("#subPrime").val());
  widgetData.subGifted = parseInt($("#subGifted").val());
  widgetData.subT1 = parseInt($("#subT1").val());
  widgetData.subT2 = parseInt($("#subT2").val());
  widgetData.subT3 = parseInt($("#subT3").val());
  widgetData.cheers = parseInt($("#cheers").val());
  widgetData.tips = parseFloat($("#tips").val());
  widgetData.objectif = parseFloat($("#objectif").val());
  widgetData.dollarsBySubPoint = parseFloat($("#dollarsBySubPoints").val());
  widgetData.dollarsByCheers = parseFloat($("#dollarsByCheers").val());
  calculData();
  saveData();
  updateUi();
});

// reset
$("#reset").click(function () {
  widgetData.subPrime = 0;
  widgetData.subGifted = 0;
  widgetData.subT1 = 0;
  widgetData.subT2 = 0;
  widgetData.subT3 = 0;
  widgetData.cheers = 0;
  widgetData.tips = 0.0;
  calculData();
  saveData();
  updateUi();
});
