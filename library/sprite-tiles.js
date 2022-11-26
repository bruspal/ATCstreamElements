// JS objet : 

function TilesAnim_() {
    this.activeFrame = 0;
    let spriteElem = document.getElementById('sprite');
    spriteElem.style['background-position-x'] = "0px";
    let xInc = 140;
    let yInc = 199;
    let xPos = 0;
    let yPos = 0;

    frameInterval = setInterval(() => {
        xPos += xInc
        if (xPos >= (xInc * 4)) {
            xPos = 0;
        }
        spriteElem.style['background-position-x'] = (xPos * -1)+"px";
    }, 100);
}

