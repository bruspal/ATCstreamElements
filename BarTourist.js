/* modeDebug = true pour passer en mode debug (TODO : Passer ça en field ? ou en coche ) */
const modeDebug = false;
debugger;

let fields = null;

let widgetData = null;
let instanceName = '';

/*
 * Widget INIT
 */
window.addEventListener('onWidgetLoad', function (obj) {
  if (modeDebug) debugger;
  fields = obj.detail.fieldData;
  instanceName = fields.instanceName;
  loadData().then(() => {
    reloadGoal();
  });
});


// On attache le message de mise à jour de la barre

receiveMessage('update', (payload) => {
  if (modeDebug) debugger;
  widgetData = payload;
  reloadGoal();
});

/*
 * event received
 */
/*
window.addEventListener('onEventReceived', function (obj) {
  if (modeDebug) debugger;
  const listener = obj.detail.listener;
  const event = obj["detail"]["event"];
  console.log('Event', obj);
*/
  /*
    if (listener == 'kvstore:update') {
      console.log(event);
      setTimeout(function () {
        loadData().then(() => {
          reloadGoal();
        });
        // dessin
      }, 500);
    }
    */
/*   
});
*/

/*
Load data
*/
function loadData() {
  console.log(new Date().toLocaleString()+' : loading-data');
  if (modeDebug) debugger;
  return SE_API.store.get(instanceName).then((ret) => {
    if (modeDebug) debugger;
    console.log(new Date().toLocaleString()+' : data-loaded');
    console.log(ret);
    if (ret === null) {
      alert('NO DATA');
    } else {
      widgetData = ret;
    }
  })
}

/*
MAJ bar
*/
function reloadGoal() {
  //if (modeDebug) debugger;
  let percent = widgetData.percentObjectif;
  // Update goal bar
  $('#progress .loading').css(
    {
      'width': Math.min(percent, 100) + '%'
    });
  $('#progress .loading .amount').text(percent + '%');
  $('#progress .endgame .amount').text(percent + "% Objectif");
  if (modeDebug) {
    $('#debug').text(
      JSON.stringify(widgetData, null, 2)
    )
  }
}

/*
Attache du code a la recetion d'un message
*/
function receiveMessage(message, callback) {
  window.addEventListener('onEventReceived', function (obj) {
    const listener = obj.detail.listener;
    if (listener == 'kvstore:update') {
      const messageName = obj.detail.event.data.key;
      let messageStr = instanceName + '_' + message;
      if (('customWidget.' + messageStr) == messageName) {
      	if (modeDebug) debugger;
        SE_API.store.get(messageStr).then((ret) => {
          if (modeDebug) debugger;
          if (ret === null) {
            // quedalle
          } else {
            callback(ret.payload, ret.options);
          }
        });
      }
    }
  });
}
