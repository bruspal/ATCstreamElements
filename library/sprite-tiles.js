// JS objet : https://www.gekkode.com/developpement/javascript-oriente-objet-guide-complet-du-debutant/
class brsSpriteTiles {
    /* Constructor */
    constructor(constructorOptions) {
        constructorOptions = constructorOptions || {};
        // On controle les options de constructeur
        this.setConstOptions(constructorOptions, 'imgSrc');
        this.setConstOptions(constructorOptions, 'selector');
        this.setConstOptions(constructorOptions, 'rows');
        this.setConstOptions(constructorOptions, 'cols');

        // objet recevant la liste des animations créé par createAnimation().
        this.animationList = {};
        // Tableau stockant les coordonnées des différente tiles
        this.tilesList = [];
        // Variables stockant la ref vers le setInterval()
        this.frameInterval = null;
        // tableau stockant la liste des frames a afficher
        this.framesList = [];

        // Calcul les métrique necessaire
        this.loaded = false;
        this.activeFrame = 0;
        this.img = new Image();
        this.img.addEventListener("load", ev => this.onImageLoaded(ev));
        this.img.src = this.imgSrc;
    };

    /* Methode de mie en place + controle des parametre du constructeur. */
    setConstOptions(constructorOptions, optionName) {
        if (optionName in constructorOptions) {
            this[optionName] = constructorOptions[optionName];
        } else {
            throw new Error(`Options '${optionName}' obligatoire`);
        }
    }

    /* Calcul les coordonnées des différentes frame disponible pour l'animation */
    computeTilesList() {
        let tillNumber = this.rows * this.cols;
        let x = 0;
        let y = 0;

        for (y = 0; y < this.rows; y++) {
            for (x = 0; x < this.cols; x++) {
                this.tilesList.push([
                    x * this.tileWidth,
                    y * this.tileHeight
                ]);
            }
        }
    }

    /* Calcul le tableau de séquence de frames pour les options fournies */
    computeOptions(options) {
        options= {
            ...{
                fps: 10,
                count: 0,
                reverse: false
            },
            ...options
        }
        let framesList = [];
        // Gestion des sequence
        if ('from' in options) {
            // Traitement du 'from' -> 'to'
            if ( ! ('to' in options)) {
                throw new Error(`Option d'animation mal formé : Avec l'option 'to', l'option 'from' est obligatoire`);
            }
            for (let i = options.from; i <= options.to; i++) {
                framesList.push(i);
            }
        } else if ('frames' in options) {
            // Traitement de l'option 'frames'
            framesList = options.frames;
        } else if ('col' in options) {
            // to implement
        } else if ('row' in options) {
            // to implement
        } else {
            framesList = [...this.tilesList.keys()];
        }
        // Gestion du reverse
        if (options.reverse) {
            framesList.reverse();
        }
        // Gestion des répétition
        if (options.count == 0) {
            options.loop = true;
        } else {
            options.loop = false;
            options.innerCounter = Math.abs(options.count);
        }
        options.framesList = framesList;
        return options;
    }

    /* apres préchargement de l'image */
    onImageLoaded(event) {
        this.initDom();

        this.tileHeight = event.target.naturalHeight / this.rows;
        this.tileWidth = event.target.naturalWidth / this.cols;

        // Récupération du selecteur qui contiendra le sprite et pamaétrage de celui-ci
        this.element.style['height'] = this.tileHeight;
        this.element.style['width'] = this.tileWidth;
        this.element.style['background-image'] = `url('${this.imgSrc}')`;
        this.element.style['background-attachment'] = 'fixed';
        this.element.style['background-position-x'] = '0px';
        this.element.style['background-position-y'] = '0px';
        this.element.style['background-origin'] = 'unset';
        this.element.style['background-repeat'] = 'no-repeat';

        // on calcul les coordonnées des différentes tiles
        this.computeTilesList();

        this.loaded = true;
    }

    /* Initialise le DOM */
    initDom() {
        this.element = document.querySelector(this.selector);
    }

    /* creer une animation */
    createAnimation(animationName, options) {
        this.animationList[animationName] = options;
    }

    /* Lance l'animation */
    runAnimation(animationName, options) {
        // controle anim existe
        if ( ! (animationName in this.animationList)) {
            throw new Error(`L'animation '${animationName}' n'a pas été définie.`);
        }
        // merge des options définie dans l'anim avec les options forcé dans l'appel de runAnimation
        options = options || {};
        let localOptions = {...this.animationList[animationName], ...options};
        // calcul de la séquence de frame
        localOptions = this.computeOptions(localOptions);
        this.framesList = localOptions.framesList;

        if (this.frameInterval) clearInterval(this.frameInterval);
        this.activeFrame = 0;

        this.frameInterval = setInterval(() => {
            if ( ! localOptions.loop && this.activeFrame == 0) {
                localOptions.innerCounter--;
                if (localOptions.innerCounter == 0) {
                    clearInterval(this.frameInterval);
                }
            }

            let frameNumber = this.framesList[this.activeFrame];
            this.element.style['background-position-x'] = (this.tilesList[frameNumber][0] * -1) + "px";
            this.element.style['background-position-y'] = (this.tilesList[frameNumber][1] * -1) + "px";
            this.activeFrame = ++this.activeFrame % this.framesList.length;
        }, 1000 / localOptions.fps);
    }

}


function TilesAnim() {
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
        spriteElem.style['background-position-x'] = (xPos * -1) + "px";
    }, 100);
}

