// Mode debug mettre true pour activer le mode debug, mettre false sinon
let debugMode = false;

// Principe : Tour de controle qui pilote l'affichage
// * tout stocker dans SE_API.store
// * comparer avec les data de SE/TWITCH pour resynchroniser les subs
// Variables générique
let SEdata = null;
let SEdataUpdated = null;
let fields = null;
let APIToken = '';
let channelName = '';
let logsArray = [];

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
  if (debugMode) debugger;
  let updateAtLaunch = false;
  SEdata = obj.detail.session.data;
  fields = obj.detail.fieldData;
  APIToken = obj.detail.channel.apiToken;
  channelName = obj.detail.channel.username;

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
    $('#log').val('Date\tListener\tData\r\n');
    $('#logGift').val('Date\tNom\tQte\tType\r\n');
    $('#logSub').val('Date\tNom\tNb mois\tType\tgift\tgifteur\r\n');

    $('#loading').fadeOut();
    // On demande un refresh aux widgets lié
    /*
    if(debugMode) debugger;
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
  const event = obj.detail.event;
  log(listener, event);
  // Traitement des subs
  if (listener == 'subscriber-latest') {
    if (debugMode) debugger;
    if (!!event.bulkGifted) {
      logGift(event);
    } else {
      logSub(event);
      if (event.tier == "prime") {
        if (!!event.gifted) {
          tiersSub = "subGifted";
        } else {
          tiersSub = "subPrime";
        }
      }
      if (event.tier == "1000") {
        tiersSub = "subT1";
      }
      if (event.tier == "2000") {
        tiersSub = "subT2";
      }
      if (event.tier == "3000") {
        tiersSub = "subT3";
      }

      widgetData[tiersSub] += 1;
      widgetData.totalSubs += 1;
      widgetData.totalSubsSE += 1;
      calculData();
      saveData();
      updateUi();
    }
  }

  // Traitement cheer
  if (listener == 'cheer-latest') {
    if (debugMode) debugger;
    widgetData.cheers += parseInt(event.amount);
    calculData();
    saveData();
    updateUi();
  }

  // Traitement tips
  if (listener == 'tip-latest') {
    if (debugMode) debugger;
    widgetData.tips += parseInt(event.amount);
    calculData();
    saveData();
    updateUi();
  }
});


window.addEventListener('onSessionUpdate', function (obj) {
  if (debugMode) debugger;
  console.log(obj);
  SEdataUpdated = obj.detail.session;
  // log('session-update', SEdataUpdated);
});

function calculData() {
  if (debugMode) debugger;
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
  if (debugMode) debugger;
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
  if (debugMode) debugger;
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

function log(listener, data) {
  if (listener != 'event:test' && listener != 'kvstore:update') {
    $('#log').val($('#log').val() + new Date().toISOString() + '\t' + listener + '\t' + JSON.stringify(data) + '\n');
    scrollDown('#log');
    logsArray.push({
      'listerner': listerner,
      'data': data
    })
  }
}

function logGift(data) {
  let txt = new Date().toISOString() + '\t' + data.name + '\t' + data.amount + '\t' + data.tier + '\t';
  $('#logGift').val($('#logGift').val() + txt + '\n');
  scrollDown('#logGift');
}

function logSub(data) {
  let txt = new Date().toISOString() + '\t' + data.name + '\t' + data.amount + '\t' + data.tier + '\t';
  if (data.gifted) {
    txt += 'Oui\t' + data.sender;
  } else {
    txt += 'Non\t';
  }
  $('#logSub').val($('#logSub').val() + txt + '\n');
  scrollDown('#logSub');
}

function scrollDown(elString) {
  let el = $(elString)[0];
  el.scrollTop = el.scrollHeight;
}

function round(nombre) {
  return Math.round((nombre + Number.EPSILON) * 100) / 100;
}

/*
 Synchronise les données du widget avec les données de streamElements
 */
function synchronise() {
  if (debugMode) debugger;
  /*
  let url = 'https://api.streamelements.com/kappa/v2/sessions/' + channelName;
  fetch(url, {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + APIToken
    },
    mode: 'cors',
    cache: 'no-cache'
  }).then((response) => {
    if (debugMode) debugger;
    console.log(response);
  }).catch((error) => {
    if (debugMode) debugger;
    console.log(error);
  });
  */
  //if (widgetData.totalSubs != SEdataUpdated)
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

$("#synchronise").click(() => {
  synchronise();
});
