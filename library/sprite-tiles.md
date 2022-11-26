# TilesAnime prototypage WIP :



sprite.setFps();

# Utilisation
Permet de creer un sprite a partir d'une spritesheet et d'y attacher des animations et de piloter celle-ci

# Constructeur

## option constructeurs :
| option | Obligatoire | defaut | role |
|-|-|-|-|
|`imgUrl`| Oui | - | lien vers la spritesheet url ou `data::` encodé base 64|
|`selector` | Oui | - | Nom de l'element div qui va recevoire le sprite, si il existe, on utilise ce div sinon on va cré un unique element à la fin du document. |
|`rows`| Oui | - | Nombre de ligne de sprites dans la spritesheet |
|`cols`| Oui | - | Nombre de colonne de sprites dans la spritesheet |

## Numerotation des frames
Les frames sont numéroté en partant d'en haut a gauche et en allant de la gauche vers la droite et du haut vers le bas.

Par exemple pour un spritesheet de 4 colonnes et 3 lignes la numérotation sera :
| | | | |
|-|-|-|-|
|0|1|2|3|
|4|5|6|7|
|8|9|10|11|


## Exemple
```js
var sprite = new TilesAnime({
    imgUrl : 'assets/sprites_test.png',
    selector: '#sprite',
    rows: 3,
    cols: 4,
});
```

# setAnimation() :
Permet de définir une animation identifié par un nom unique avec des caractérisque spécifiés par ses options
```js
sprite.setAnimation('animationName'[, options]);
```
## Paramétres
|Parametre|Type|Role|
|-|-|-|
|`animationName`|String|Nom de l'animation, remplace une eventuelle animation existante|
|`options`| Object | Définition des caratéristique de l'animation |

## Options d'animation
| option | Obligatoire | defaut | role |
|-|-|-|-|
|`fps` | Non | `10` | fps de l'animation |
|`cycle` | Non | `'cycling'` | type d'animation voir detail |
|`cycleCount`| Non | 1 | nombre de fois ou l'animation cycle lorsque cycle vaut 'once' ou 'reverseOnce' |
|`then`| Non | - | Animation a jouer apres la fin de l'animation pour les animations dont `cycle` vaut 'once' ou 'reverseOnce'. **Si `then` n'est pas définie, l'animation s'arrete** |

### Gestion des frames de l'animation
**Les options ci-dessous concerne la gestion des frames incluses dans l'animation seul un des choix sera pris en compte**

| options | Description |
|-|-|
| - | Si aucune options de frame n'est définie la séquence est par défaut de la première à la dernière frame de la spritesheet |
| `from`, `to` | L'animation est la séquence de frames allant de la frame `from` jusqu'a la frame `to` |
| `frames` |  L'animation est la séquence de frames dont les numéro sont listé dans le tableau `frames` |
| `row` |  L'animation est la séquence de frames de la ligne numéro N (numérotation a partir de zéro) |
| `col` |  L'animation est la séquence de frames de la colonne numéro N (numérotation a partir de zéro) |

## Exemples

* definir une animation a 10 fps bouclant toutes les frames de la spritesheet
```js
sprite.setAnimation('animName1');
```

* definir une animation a 12 fps bouclant des frame 0 à 7
```js
sprite.setAnimation('animName2', {
    fps : 12,
    from : 0,
    to : 7
});
```

* definir une animation a 15 fps bouclant les frames dans l'ordre définie dans frames
```js
sprite.setAnimation('animName3', {
    fps : 15,
    frames : [1, 3, 5, 8, 6, 0, 4, 8]
});
```

* definir une animation a 20 fps bouclant les frames de la ligne 2
```js
sprite.setAnimation('animName4', {
    fps : 20,
    row : 2
});
```

* definir une animation a 20 fps des frames de la première colonne uniquement une fois, suite a quoi l'animation 'animName1' est lancer avec des fps mis à 25 fps.
```js
sprite.setAnimation('animName5', {
    fps : 10,
    col : 0,
    cycle : 'once',
    then : {
        anim : 'animName1',
        options : {
            fps: 25
        }
    }
});
```


### Valeurs de cycle        
|Valeur|Type|
|-|-|
|`'cycling'` | L'animation tourne en boucle |
|`'count'` | L'animation s'execute N fois |
|`'reverse'` | boucle l'alimation en reverse |
|`'reverseCount'` | boucle l'animation en reverse N fois |

Pour les cycles `'count'` et `'reverseCount'` N prend la valeur de `cycleCount`, si `cycleCount` est absent N = 1.

# delAnimation()
Suppresion d'une anim identifié par son nom.

# Lancer une animation
Une fois définie les animation doivent être lancer via l'appel a la fonction
```js
sprite.runAnimation('animationName'[, options]);
```
## Paramétres
|Parametre|Type|Role|
|-|-|-|
|`animationName`| String |Nom de l'animation à lancer|
|`options`| Object | Définition uniquement les options de l'anim pour cet appel, les options sont identique à celle de setAnimation mais ne concerne que cet appel |

## Exemples
* Lancer l'animation 'animName1' avec les paramétre définie dans sa définition
```js
sprite.runAnimation('animName1');
```

* Lancer une animation en remplaçant les fps définie a 12 par défaut par un fps de 25, le reste des options définie dans setAnimation() seront utilisée.

```js
sprite.run('animName2', {
    fps: 25
});
```

**ATTENTION : La valeur initiale est conservée, ainsi si on appel `sprite.run('animName2')` apres l'appel ci-dessus l'animation sera bien éxecutée au 12 FPS initialement définie**

# setFps()
Modifie les fps de l'animation en cours
```js
sprite.setFps(45);
```
