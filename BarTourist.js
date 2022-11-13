
let widgetData = null;
let instanceName = 'touristATC';

/*
 * Widget INIT
 */
window.addEventListener('onWidgetLoad', function (obj) {
    debugger;
    loadData().then(() => {
        reloadGoal();
    });
});
  

/*
 * event received
 */
window.addEventListener('onEventReceived', function (obj) {
  const listener = obj.detail.listener;
  const event = obj["detail"]["event"];
  
  if (listener == 'kvstore:update' ) {
	console.log(event);
    setTimeout(function() {
        loadData().then(() => {
            reloadGoal();
        });
        // dessin
    }, 500);
  }
});

function loadData() {
    debugger;
    return SE_API.store.get(instanceName).then((ret) => {
        debugger;
        if (ret === null) {
            alert('NO DATA');
        } else {
            widgetData = ret;
        }
    })
}

function reloadGoal() {
  let percent = widgetData.percentObjectif;
  // Update goal bar
  $('#progress .loading').css(
    {
      'width': Math.min(percent,100) + '%'
    });
  $('#progress .loading .amount').text(percent + '%' );
  $('#progress .endgame .amount').text(percent + "% Objectif" );
  /*
  $('#debug').text(
    JSON.stringify(widgetData, null, 2)
  )
  */
}
