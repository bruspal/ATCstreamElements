
const modeDebug = false;
debugger;

let widgetData = null;
let instanceName = 'touristATC';

/*
 * Widget INIT
 */
window.addEventListener('onWidgetLoad', function (obj) {
  if (modeDebug) debugger;
  loadData().then(() => {
    reloadGoal();
  });
});


// On attache le message de mise à jour de la barre
receiveMessage('update', () => {
  if (modeDebug) debugger;
  loadData().then(() => {
    reloadGoal();
  });
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
  if (modeDebug) debugger;
  return SE_API.store.get(instanceName).then((ret) => {
    if (modeDebug) debugger;
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
    const messageName = obj["detail"]["event"]["data"]["key"];
    let messageStr = instanceName + '_' + message;
    if (listener == 'kvstore:update' && ('customWidget.' + messageStr) == messageName) {
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
  });
}
