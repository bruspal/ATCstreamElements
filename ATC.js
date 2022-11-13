// Principe : Tour de controle qui pilote l'affichage
// * tout stocker dans SE_API.store
// * comparer avec les data de SE/TWITCH pour resynchroniser les subs
// Variables pour les subs
//let totalSubs = 0; // totals
//let totalCheers = 0;
//let totalTipsDollars = 0;
//let subPoints = 0;
// Variables générique
let SEdata = null;
let fields = null;
let totalSubs = 0;
let cheers = 0;
let tips = 0;

// Variable de montant
let dollarBySubPoint = 0;
let dollarByCheers = 0;
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
    objectif: 0,
    percentObjectif: 0.0,
    dateLastWrite: new Date()
};
// liste des widget d'affichage des subs
let widgets = {
    subPrime: null,
    subGifted: null,
    subT1: null,
    subT2: null,
    subT3: null,
    cheers: null,
    tips: null
}

/*
Widget Init :
- Recup widgetData
- Recup bilan de streamElement
- recaler les sub dans les widgetData si necessaire.
 */
window.addEventListener('onWidgetLoad', function (obj) {
    //debugger;
    SEdata = obj["detail"]["session"]["data"];
    fields = obj["detail"]["fieldData"];

    // Recup des valeur de SE pour controle de validité des données sauivé dans la base de données
    totalSubs = SEdata['subscriber-month'].count;
    cheers = SEdata['cheer-month'].amount;
    tips = SEdata['tip-month'].amount;

    console.log(SEdata);
    console.log(fields);


    // Récupération des données de la DB streamElement
    SE_API.store.get(instanceName).then((ret) => {
        if (ret === null) {
            // L'instance n'est pas initialisé ? on l'initialise
            // Init avec les data de SE
            widgetData.totalSubsSE = totalSubs;
            widgetData.cheers = cheers;
            widgetData.tips = tips;
            widgetData.objectif = fields.objectif;
            dollarBySubPoint = fields.dollarsBySubPoint;
            dollarByCheers = fields.dollarsByCheer;
            saveData();
        } else {
            // Chargement de l'instance
            widgetData = ret;
            // Mise à jour des champs avec les données des fields
            widgetData.objectif = fields.objectif;
            dollarBySubPoint = fields.dollarsBySubPoint;
            dollarByCheers = fields.dollarsByCheer;
        }
    }).then(function(){
        if (totalSubs != widgetData.totalSubs) {
            /* TODO : Implementer le check sub + correction C'est SE qui fait foi */
        }
        calculData();
        updateUi();
        // On demande un refresh aux widgetsLié
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
    widgetData.cheersDollars = round(widgetData.cheers * dollarByCheers);
    // calcul subpoints
    widgetData.subPoints =  round((widgetData.subPrime * valSubPoint.subPrime) +
                            (widgetData.subGifted * valSubPoint.subGifted) +
                            (widgetData.subT1 * valSubPoint.subT1) +
                            (widgetData.subT2 * valSubPoint.subT2) +
                            (widgetData.subT3 * valSubPoint.subT3));
    // calcul $ subPoints
    widgetData.subPointsDollars = round(widgetData.subPoints * dollarBySubPoint);
    // calcul $ par tiers
    widgetData.subPrimeDollars = round(widgetData.subPrime * valSubPoint.subPrime * dollarBySubPoint);
    widgetData.subGiftedDollars = round(widgetData.subGifted * valSubPoint.subGifted * dollarBySubPoint);
    widgetData.subT1Dollars = round(widgetData.subT1 * valSubPoint.subT1 * dollarBySubPoint);
    widgetData.subT2Dollars = round(widgetData.subT2 * valSubPoint.subT2 * dollarBySubPoint);
    widgetData.subT3Dollars = round(widgetData.subT3 * valSubPoint.subT3 * dollarBySubPoint);
    // TotalSubs par tier
    widgetData.totalSubs = round(widgetData.subPrime + widgetData.subGifted + widgetData.subT1 + widgetData.subT2 + widgetData.subT3);
    // Calcul percent objectif
    widgetData.percentObjectif = round(
        ((widgetData.subPointsDollars + widgetData.cheersDollars + widgetData.tips) * 100) / widgetData.objectif
    );
}

function saveData() {
    widgetData.dateLastWrite = new Date();
    SE_API.store.set(instanceName, widgetData);
}



function updateUi() {
//    console.log(widgetData);
//    return;
    //debugger;
    // Affichage des données non modifiable
    $('#subPointStat').text(widgetData.subPoints);
    $('#totalSubsStat').text(widgetData.totalSubs);
    $('#subDollarsStat').text(widgetData.subPointsDollars);
    $('#totalCheersStat').text(widgetData.cheers);
    $('#totalCheersDollarsStat').text(widgetData.cheersDollars);
    $('#totalTipsDollarsStat').text(widgetData.tips);
    $('#objectifStat').text(widgetData.objectif);
    $('#objectifPercentStat').text(widgetData.percentObjectif);

    $('#dollarsByPrime').text(widgetData.subPrimeDollars);
    $('#dollarsByGifted').text(widgetData.subGiftedDollars);
    $('#dollarsByT1').text(widgetData.subT1Dollars);
    $('#dollarsByT2').text(widgetData.subT2Dollars);
    $('#dollarsByT3').text(widgetData.subT3Dollars);
    $('#dollarsByCheers').text(widgetData.cheersDollars);

    // Remplissage des widgets
    $("#subPrime").val(widgetData.subPrime);
    $("#subGifted").val(widgetData.subGifted);
    $("#subT1").val(widgetData.subT1);
    $("#subT2").val(widgetData.subT2);
    $("#subT3").val(widgetData.subT3);
    $("#cheers").val(widgetData.cheers);
    $("#tips").val(widgetData.tips);

}

function round(nombre) {
    return Math.round((nombre + Number.EPSILON) * 100) / 100;
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
