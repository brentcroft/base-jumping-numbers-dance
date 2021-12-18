
class RadiantAction extends BoxAction {
    constructor( box, id = 0, enforceTerminalIdentities = false ) {
        super( box, id );

        this.forwardFrom = 0;
        this.reverseFrom = ( this.box.volume - 1 );

        this.placesReverse = placeValuesReverseArray( this.box.bases );
        this.placesForward = [...this.placesReverse].map( i => -1 * i );

        // establish identity plane
        this.identityPlane = this.placesForward.map( ( x, i ) => x - this.placesReverse[i] );
        this.identityPlaneGcd = Math.abs( gcda( this.identityPlane ) );
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );

        // establish coord index functions
        this.indexReverse = ( coord ) => {
            const index = this.placesReverse.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c, this.forwardFrom );

            if ( enforceTerminalIdentities ) {
                return index == 0
                    ? this.reverseFrom
                    : index == this.reverseFrom
                        ? 0
                        : index;
            } else {
                return index;
            }
        };
        this.indexForward = ( coord ) => this.placesForward.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c, this.reverseFrom );

        this.label = 'r';
        this.symbols = [];
        this.alias = [];
        this.idx = [];
        this.dix = [];
    }

    indexPoint( point ) {
        const boxVolume = this.box.volume;
        const di = this.indexForward( point.coord );
        const id = this.indexReverse( point.coord );

        this.box.validateIds( [ id, di ] );

        const conjugateId = ( boxVolume - id - 1 );

        const pointIndexData = {
            id: id,
            di: di,
            conjugateId: conjugateId,
            jump: ( di - id ),
            radiant: ( conjugateId - id )
        };

        const existingPointIndexData = point.indexes[ this.key ];

        if ( existingPointIndexData ) {
            consoleLog( `Id already allocated in point for index[${ this.id }]; point=${ point }, data=${ JSON.stringify( pointIndexData ) }, existing=${ JSON.stringify( existingPointIndexData ) }` );
        }

        point.indexes[this.key] = pointIndexData;

        this.idx[ id ] = point;
        this.dix[ di ] = point;
    }

    getType() {
        return 'rad';
    }
}

const pvaIndex = [0];

class PlaceValuesAction extends BoxAction {
    constructor( box, id = 0, placeValuesPermutationPair ) {
        super( box, id );
        this.pair = placeValuesPermutationPair;
        this.identityPlane = this.pair.identityPlane;
        this.identityPlaneGcd = this.pair.echo;
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );

        this.label = `${ this.pair.label }_${ this.pair.id }${ this.pair.harmonic ? `h` : '' }${ this.pair.inverse ? 'i' : '' }`;
        this.symbols = [ this.pair.symbol ];

        // reference to component indexes
        this.idx = this.pair.idx;
        this.dix = this.pair.dix;
    }

    indexPoint( point ) {
        const boxVolume = this.box.volume;

        const id = point.getId( this.pair.leftId );
        const di = point.getId( this.pair.rightId );

        const conjugateId = ( boxVolume - id - 1 );

        const pointIndexData = {
            id: id,
            di: di,
            conjugateId: conjugateId,
            jump: ( di - id ),
            radiant: ( conjugateId - id )
        };

        const existingPointIndexData = point.indexes[ this.key ];

        point.indexes[this.key] = pointIndexData;

        if ( existingPointIndexData ) {
            consoleLog( `Id already allocated in point for index[${ this.id }]; point=${ point }, data=${ JSON.stringify( pointIndexData ) }, existing=${ JSON.stringify( existingPointIndexData ) }` );
        }
    }
}

class CompositeAction extends BoxAction {

    static compositeLabel( leftAction, rightAction ) {
        return `${ leftAction.getLabel() } * ${ rightAction.getLabel() }`;
    }

    static compositeSymbol( leftAction, rightAction ) {
        const one = '1';
        return leftAction.symbols && leftAction.symbols.length > 0
            ? leftAction.symbols[0] == one
                ? rightAction.symbols[0]
                : rightAction.symbols[0] == one
                    ? leftAction.symbols[0]
                    : `${ leftAction.symbols[0] } * ${ rightAction.symbols[0] }`
            : one;
    }

    constructor( box, id = 0, leftAction, rightAction, autoInit = false, reverse = false ) {
        super( box, id );

        this.leftAction = leftAction;
        this.rightAction = rightAction;
        this.reverse = reverse;

        this.idx = new Array( this.box.volume );
        this.dix = new Array( this.box.volume );

        // todo: no identity plane
        this.identityPlane = [ -1, -1, 1 ];
        this.identityPlaneGcd = 1;
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );

        //
        this.label = CompositeAction.compositeLabel( leftAction, rightAction );
        this.symbols = [ CompositeAction.compositeSymbol( leftAction, rightAction ) ];
        this.alias = [];

        if ( autoInit ) {
            this.indexPoints();
        } else {
            this.unindexed = true;
        }

        //consoleLog( `Created CompositeAction: ${ this.label }${ this.reverse ? '; (inverse)' : '' }` );
    }

    indexPoints() {
        this.box.points.forEach( point => this.indexPoint( point ) );
        delete this.unindexed;
    }

    indexPoint( point ) {

        var wayPoint = this.reverse
            ? this.rightAction.applyInverse( point )
            : this.rightAction.apply( point );
        var endPoint = this.leftAction.apply( wayPoint );

        // global ids
        const id = point.id;
        const di = endPoint.id;

        this.box.validateIds( [ id, di ] );

        const conjugateId = ( this.box.volume - id - 1 );

        const pointIndexData = {
           id: id,
           di: di,
           conjugateId: conjugateId,
           jump: ( di - id ),
           radiant: ( conjugateId - id )
        };

        const existingPointIndexData = point.indexes[ this.key ];

        if ( existingPointIndexData ) {
            //consoleLog( `Id already allocated in point for index[${ this.id }]; point=${ point }, data=${ JSON.stringify( pointIndexData ) }, existing=${ JSON.stringify( existingPointIndexData ) }` );
        }

        point.indexes[this.key] = pointIndexData;

        this.idx[ id ] = point;
        this.dix[ di ] = point;
    }

    getType() {
        return 'comp';
    }

    getPlaneEquationTx() {
        return this.alias.join(" / ");
    }
}


class BoxGroup {

    constructor( bases = [], param = {} ) {

        const toggles = param.toggles || [];
        const actionLayers = param.actionLayers || [];

        this.compositeActions = [];

        [
            this.alternatePerms,
            this.compositionRules,
            this.ignoreOrbitOffsets,
            this.ignoreIndexPerimeters,
            this.ignoreEuclideanPerimeters
        ] = [
            toggles.includes( "alternatePerms" ),
            toggles.includes( "compositionRules" ),
            toggles.includes( "ignoreOrbitOffsets" ),
            toggles.includes( "ignoreIndexPerimeters" ),
            toggles.includes( "ignoreEuclideanPerimeters" )
        ];

        const [ identities, inverses, harmonics, degenerates, compositionRules, ignoreOrbitOffsets ] = [
            toggles.includes( "identities" ),
            toggles.includes( "inverses" ),
            toggles.includes( "harmonics" ),
            toggles.includes( "degenerates" )
        ];


        this.box = new Box( bases );
        this.key = "box-group" + this.box.bases.join( "." );

        if (toggles.includes( "radiance" )) {

            this.box.radiance = new RadiantAction( this.box, 0, toggles.includes( "fixedRad" ) );
            this.box.unity = new CompositeAction( this.box, 1, this.box.radiance, this.box.radiance );
            this.box.unity.label = 'e';

            this.indexPlanes = [ this.box.radiance, this.box.unity ];
        } else {
            this.indexPlanes = [];
        }


        if ( bases.length > 1 ) {

            const [ DD, DU, UD, UU ] = [
                [ 0, 0, 'DD' ],
                [ 0, 1, 'DU' ],
                [ 1, 0, 'UD' ],
                [ 1, 1, 'UU' ]
            ];

            const indexors = [];

            var identityId = 0;
            var palindromeId = 0;

            this.box.placeValuePermutations
                .forEach( ( pvp, i ) => {

                    const identity = new PlaceValuesPermutationPair( identityId++, bases, pvp, pvp, DD );
                    const palindrome = new PlaceValuesPermutationPair( palindromeId++, bases, pvp, pvp, UD );

                    indexors.push( identity );
                    indexors.push( palindrome );

                    if ( inverses ) {
                        // same pair id
                        indexors.push( new PlaceValuesPermutationPair( identity.id, bases, pvp, pvp, UU, identity ) );
                        indexors.push( new PlaceValuesPermutationPair( palindrome.id, bases, pvp, pvp, DU, palindrome ) );
                    }
                });


            var uppers = 0;

            pairs( this.box.placeValuePermutations )
                .forEach( ( p, i ) => {

                    // rotate every iteration
                    const pair = this.alternatePerms && (i % 2) ? [ p[1], p[0] ] : [ p[0], p[1] ];

                    var dd = null;
                    var uu = null;
                    var idd = null;
                    var iuu = null;

                    var du = null;
                    var duh = null;

                    var idu = null;
                    var iduh = null;

                    dd = new PlaceValuesPermutationPair( uppers, bases, pair[0], pair[1], DD );
                    uu = new PlaceValuesPermutationPair( uppers + 1, bases, pair[0], pair[1], UU );

                    idu = new PlaceValuesPermutationPair( i, bases, pair[0], pair[1], UD, duh, false );
                    iduh = new PlaceValuesPermutationPair( i, bases, pair[1], pair[0], UD, du, true );

                    if ( inverses ) {
                        idd = new PlaceValuesPermutationPair( uppers, bases, pair[1], pair[0], DD, dd );
                        iuu = new PlaceValuesPermutationPair( uppers + 1, bases, pair[1], pair[0], UU, uu );

                        // swap places && swap state
                        duh = new PlaceValuesPermutationPair( i, bases, pair[1], pair[0], DU, iduh, false );
                        du = new PlaceValuesPermutationPair( i, bases, pair[0], pair[1], DU, idu, true );
                    }

                    [ dd, idd, uu, iuu ]
                        .filter( p => p )
                        .forEach( p => indexors.push( p ) );

                    [ idu, iduh, duh, du ]
                        .filter( p => p )
                        .forEach( p => indexors.push( p ) );

                    uppers += 2;
                } );

            //indexors.sort( ( p1, p2 ) => p1.compareTo( p2 ) );

            // capture all labels
            this.layerLabels = [];
            indexors.forEach( pair => this.layerLabels.filter( l => l[1] == pair.label ).length > 0 ? 0 : this.layerLabels.push( [ pair.layer, pair.label ] ) );
            this.layerLabels.sort( (a,b) => a[0]- b[0] );

            const layers = new Array( indexors.length + 2 ).fill( 0 );
            layers.forEach( (x,i) => layers[i] = [] );

            // filter and group by layers
            indexors
                .filter( pair => actionLayers.includes( pair.layer ) )
                .filter( pair => harmonics || !pair.harmonic )
                .filter( pair => degenerates || !pair.degenerate )
                .forEach( pair => {
                    layers[ pair.layer ].push( pair );
                } );

            // remove empty layers
            this.layers = layers.filter( layer => layer.length > 0 );

            this.layers
                .forEach( layer => {
                    var actionIndex = 0;
                    layer
                        .forEach( (pair , i) => this.indexPlanes
                            .push( new PlaceValuesAction( this.box, this.indexPlanes.length, pair, pair.id ) )
                        );
                } );
        }

        this.box.points
            .forEach( point => this.indexPlanes
                  .filter( i => !( i instanceof CompositeAction ) )
                  .forEach( indexer => indexer.indexPoint( point ) ) );

        if (toggles.includes( "radiance" )) {
            // unity is composite so has not yet been indexed
            this.box.unity.indexPoints();
        }

        this.indexPlanes.forEach( plane => {
            plane.ignoreEuclideanPerimeters = this.ignoreEuclideanPerimeters;
            plane.ignoreIndexPerimeters = this.ignoreIndexPerimeters;
            plane.ignoreOrbitOffsets = this.ignoreOrbitOffsets;
        } );

        this.indexPlanes.forEach( plane => plane.initialise() );
    }

    getIndexMap( label ) {
        const keys = {};
        this.indexPlanes.forEach( p => keys[ p.getLabel() ] = p );
        return keys;
    }

    findMatchingActions( boxAction ) {
        return this.indexPlanes.filter( p => p.equals( boxAction ) );
    }

    findActionByPermPair( permPair ) {
        const matches = this
            .indexPlanes
            .filter( p => p instanceof PlaceValuesAction )
            .filter( p => arrayExactlyEquals( p.pair.permPair[0], permPair[0] ) && arrayExactlyEquals( p.pair.permPair[1], permPair[1] ) );
        return matches.length > 0 ? matches[0] : null;
    }

    registerCompositeAction( alias, compositeAction ) {
        this.compositeActions[alias] = compositeAction;
        //consoleLog( `registered composite action: ${ alias }`);
    }

    findActionByAlias( alias ) {
        if ( alias in this.compositeActions ) {
            //consoleLog( `found composite action: ${ alias }`);
            return this.compositeActions[ alias ];
        }
        return null;
    }
}