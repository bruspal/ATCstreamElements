// Mode debug mettre true pour activer le mode debug, mettre false sinon
let debugMode = false;
const version = "6.1";

/*
Handle des erreurs
*/
window.addEventListener("error", (event) => {
  debugger;
  errObj = {
    type: event.type,
    filename: event.filename,
    linecol: event.lineno + ':' + event.colno,
    message: event.message
  };
  log('js-message:' + event.type, errObj);
});

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


// Gestion des timeouts
let timeoutUpdate = false;
let timeoutSave = false;

// Gestion des interval
let intervalAutosaveBackup = 60; // interval autosave en secondes

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
  SEdataUpdated = SEdata;
  fields = obj.detail.fieldData;
  APIToken = obj.detail.channel.apiToken;
  channelName = obj.detail.channel.username;
  instanceName = fields.instanceName;
  intervalAutosaveBackup = fields.intervalAutosaveBackup;

  $('#instanceNameStat').text(instanceName);
  $('#versionStat').text(version);
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

/*
 A chaque mise a jour de la session on store les info dans SEdataUpdated
 TODO : SEdata devient inutil
 */
window.addEventListener('onSessionUpdate', function (obj) {
  if (debugMode) debugger;
  console.log(obj);
  SEdataUpdated = obj.detail.session;
  // log('session-update', SEdataUpdated);
});

/*
Calcul des valeurs en fonction des infos
*/
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

/*
Sauvegarde des infos dans la DB de SE
*/
function saveData(forceDate) {
  if (debugMode) debugger;
  if (forceDate === undefined) {
    widgetData.dateLastWrite = new Date();
  } else {
    widgetData.dateLastWrite = forceDate;
  }
  if (timeoutSave !== false) clearTimeout(timeoutSave);
  timeoutSave = setTimeout(() => {
    log('save-data:saving', widgetData);
    SE_API.store.set(instanceName, widgetData).then(() => {
      log('save-data:saved', widgetData);
      // On envois le message 'update' 500ms apres le dernier event
      if (timeoutUpdate !== false) clearTimeout(timeoutUpdate);
      timeoutUpdate = setTimeout(() => {
        sendMessage('update', widgetData);
      }, fields.timeoutUpdate);
    });
  }, fields.timeoutSave);
}

/*
 * Auto sauvegarde du backup
 */
function saveBackup() {
  if (typeof saveBackup.timer == 'undefined') {
      saveBackup.timer = intervalAutosaveBackup;
  }
  $('#nextAutosaveStat').text(saveBackup.timer);
  if (--saveBackup.timer == 0) {
    log('backup:saving', widgetData);
    SE_API.store.set(instanceName+'_autosavebackup', widgetData).then(() => {
      log('backup:saved', widgetData);
    });
    saveBackup.timer = intervalAutosaveBackup;
  };
}
setInterval(saveBackup, 1000);

/*
 * Resturation du dernier backup
 */
function restaureBackup() {
  log('backup:restoring', {});
  $('#loading').show();
  SE_API.store.get(instanceName+'_autosavebackup').then((ret) => {
    if (ret === null) {
      log('backup:no-backup-found', {});
    } else {
      widgetData = ret;
      log('backup:restored', widgetData);
      updateUi();
      saveData();
    }
    $('#loading').fadeOut();
  });
}

//setInterval(function)
/*
Envois un message (HACK de SE_API.store.set)
*/
function sendMessage(message, data, options) {
  if (debugMode) debugger;
  options = options || {};
  data = data || {};
  message = instanceName + '_' + message;
  let objMessage = {
    timestamp: Date.now(),
    payload: data,
    'options': options
  };
  log('custom-message-sending:' + message, objMessage);
  SE_API.store.set(message, objMessage).then(() => {
    log('custom-message-sent:' + message, objMessage);
  });
}

/*
Attache du code a la recetion d'un message
*/
function receiveMessage(message, callback) {
  message = instanceName + '_' + message;
  SE_API.store.get(message).then((ret) => {
    if (ret === null) {
      // queedalle
    } else {
      callback(ret.payload, ret.options);
    }
  })
}

/*
Mise a jour de l'interface
*/
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

/*
Log des events dans la zone log, ignore les events de type 'kvstore:update' et 'event:test'
*/
function log(listener, data) {
  if (listener != 'event:test' && listener != 'kvstore:update') {
    $('#log').val($('#log').val() + new Date().toISOString() + '\t' + listener + '\t' + JSON.stringify(data) + '\n');
    scrollDown('#log');
    logsArray.push({
      'listener': listener,
      'data': data
    })
  }
}

/*
Log les subgift dans la zone gifteurs
*/
function logGift(data) {
  let txt = new Date().toISOString() + '\t' + data.name + '\t' + data.amount + '\t' + data.tier + '\t';
  $('#logGift').val($('#logGift').val() + txt + '\n');
  scrollDown('#logGift');
}

/*
log les subs dans la zone subs
*/
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

/*
Scroll en bas des textarea idntifié par elString
*/
function scrollDown(elString) {
  let el = $(elString)[0];
  el.scrollTop = el.scrollHeight;
}

/*
Arrondis a 2 decimal
*/
function round(nombre) {
  return Math.round((nombre + Number.EPSILON) * 100) / 100;
}

/*
 Synchronise les données du widget avec les données de streamElements
 */
function synchronise() {
  if (debugMode) debugger;
  let updated = false;
  /*
    SEdataUpdated["subscriber-recent"] = dataDebug;
    SEdataUpdated['subscriber-month'].count = 25;
  */
  if (widgetData.totalSubs != SEdataUpdated['subscriber-month'].count) {
    // On met a jour tous les subs en T1 puis on déplace
    updated = true;
    widgetData.totalSubsSE = SEdataUpdated['subscriber-month'].count;
    widgetData.subPrime = 0;
    widgetData.subGifted = 0;
    widgetData.subT1 = SEdataUpdated['subscriber-month'].count;
    widgetData.subT2 = 0;
    widgetData.subT3 = 0;

    // On boucle les derniers subs
    let tabLen = SEdataUpdated["subscriber-recent"].length;
    for (let idx = 0; idx < tabLen; idx++) {
      data = SEdataUpdated["subscriber-recent"][idx];
      switch (data.tier) {
        case 'prime':
          widgetData.subPrime++;
          widgetData.subT1--;
          break;
        case '2000':
          widgetData.subT2++;
          widgetData.subT1--;
          break;
        case '3000':
          widgetData.subT3++;
          widgetData.subT1--;
          break;
      }
    }
  }

  if (widgetData.cheers != SEdataUpdated['cheer-month'].amount) {
    updated = true;
    widgetData.cheers = SEdataUpdated['cheer-month'].amount;
  }

  if (widgetData.tips != SEdataUpdated['tip-month'].amount) {
    updated = true;
    widgetData.tips = SEdataUpdated['tip-month'].amount;
  }

  if (updated) {
    calculData();
    saveData();
    updateUi();
  } else {
    alert('rien à synchroniser');
  }
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

// Syncronise
$("#synchronise").click(() => {
  // synchronise();
});

// Envois du message
$('#updateMessage').click(() => {
  sendMessage('update', widgetData);
});

$('#restaureBackup').click(() => {
  restaureBackup();
});