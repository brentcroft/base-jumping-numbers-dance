
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

        const partnerId = ( boxVolume - id - 1 );

        const pointIndexData = {
            id: id,
            di: di,
            partnerId: partnerId,
            jump: ( di - id ),
            radiant: ( partnerId - id )
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


class LiteralAction extends BoxAction {
    constructor( box, id = 0 ) {
        super( box, id );

        // establish identity plane
        this.identityPlane = [ 1, 0, 0 ];
        this.identityPlaneGcd = 1;
        this.identityPlaneNormal = [ 0, 1, 0 ];
        this.label = 'l';
        this.symbols = [];
        this.alias = [];
        this.idx = [];
        this.dix = [];
    }

    indexPoint( point ) {
        const boxVolume = this.box.volume;
        const di = point.coord[ 0 ];
        const id = ( di + 1 ) % boxVolume;

        const partnerId = ( boxVolume - id - 1 );

        const pointIndexData = {
            id: id,
            di: di,
            partnerId: partnerId,
            jump: ( di - id ),
            radiant: ( partnerId - id )
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
        return 'lit';
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

        const partnerId = ( boxVolume - id - 1 );

        const pointIndexData = {
            id: id,
            di: di,
            partnerId: partnerId,
            jump: ( di - id ),
            radiant: ( partnerId - id )
        };

        const existingPointIndexData = point.indexes[ this.key ];

        point.indexes[this.key] = pointIndexData;

        if ( existingPointIndexData ) {
            throw new Error( `Id already allocated in point for index[${ this.id }]; point=${ point }, data=${ JSON.stringify( pointIndexData ) }, existing=${ JSON.stringify( existingPointIndexData ) }` );
        }
    }
}

class CompositeAction extends BoxAction {
    constructor( box, id = 0 ) {
        super( box, id );

        this.idx = new Array( this.box.volume );
        this.dix = new Array( this.box.volume );

        // todo: no identity plane
        this.identityPlane = [ -1, -1, 1 ];
        this.identityPlaneGcd = 1;
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );

        this.alias = [];
    }
}

class CompositionAction extends CompositeAction {

    static compositeLabel( leftAction, rightAction ) {
        try {
            return `${ leftAction.getLabel() } * ${ rightAction.getLabel() }`;
        } catch ( e ) {
            //consoleLog( e );
            return "anon";
        }
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

    constructor( box, id = 0, leftAction, rightAction, autoInit = false ) {
        super( box, id );

        this.leftAction = leftAction;
        this.rightAction = rightAction;

        this.boxGroup = this.leftAction.boxGroup;
        this.label = CompositionAction.compositeLabel( leftAction, rightAction );
        this.symbols = [ CompositionAction.compositeSymbol( leftAction, rightAction ) ];

        const leftCycles = isCycles( this.leftAction )
            ? this.leftAction
            : this.leftAction.getCycles();
        const rightCycles = isCycles( this.rightAction )
            ? this.rightAction
            : this.rightAction.getCycles();

        this.cycles = composePermutations( leftCycles, rightCycles );

        if ( autoInit ) {
            this.indexPointsFromCycles();
            this.initialise();
        } else {
            this.unindexed = true;
        }
    }

    indexPointsFromCycles() {
        this.box.points.forEach( point => this.indexPointFromCycles( point ) );
        delete this.unindexed;
    }

    indexPointFromCycles( point ) {
        var cycle = this
            .cycles
            .find( cycle => cycle.find( c => c == point ) );

        if ( !cycle || cycle.length == 0 ) {
            throw new Error( `No cycle for point: ${ point }` );
        }

        const nextIndex = ( 1 + cycle.indexOf( point ) ) % cycle.length;
        const endPoint = cycle[ nextIndex ];

        // using common ids from leftAction
        const id = point.at( this.leftAction.key ).id;
        const di = endPoint.at( this.leftAction.key ).id;

        this.box.validateIds( [ id, di ] );

        const partnerId = ( this.box.volume - id - 1 );

        const pointIndexData = {
           id: id,
           di: di,
           partnerId: partnerId,
           jump: ( di - id ),
           radiant: ( partnerId - id )
        };

        point.indexes[this.key] = pointIndexData;

        this.idx[ id ] = point;
        this.dix[ di ] = point;
    }


    indexPoints() {
        this.box.points.forEach( point => this.indexPoint( point ) );
        delete this.unindexed;
    }

    getType() {
        return 'comp';
    }

    getPlaneEquationTx() {
        return this.alias.join(" / ");
    }
}

class IndexCyclesAction extends CompositeAction {

    constructor( box, id = 0, label, cyclesObject ) {
        super( box, id, null, null );
        this.structure = {
            leftBases: cyclesObject.leftBases,
            rightBases: cyclesObject.rightBases,
            multiplierBases: [ cyclesObject.multiplierBase ],
            harmonic: cyclesObject.harmonic
        }
        this.cyclesObject = cyclesObject;
        this.pair = this.getPlaceValuesPermutationPair( cyclesObject );
        this.harmonic = cyclesObject.harmonic;
        this.label = label;
        this.symbols = [ this.pair.symbol ];
        this.indexPoints( this.pair, cyclesObject );
        this.initialise();

        //consoleLog( `${ label } = ${ pair.symbol } = ${ pair }` );
    }

    getPlaceValuesPermutationPair( cyclesObject ) {
        const [ l, r, m ] = [
            [ ...cyclesObject.leftBases ].filter( i => i > -1 ),
            [ ...cyclesObject.rightBases ].filter( i => i > -1 ),
            [ cyclesObject.multiplierBase ].filter( i => i > -1 )
        ];
        const [ leftPermKey, rightPermKey ] = cyclesObject.harmonic
            ? [ [ ...m, ...r, ...l ], [ ...m, ...l, ...r ] ]
            : [ [ ...r, ...l, ...m ], [ ...l, ...r, ...m ] ];

        const [ leftPerm, rightPerm ] = [
            this.box.getPermVector( leftPermKey ),
            this.box.getPermVector( rightPermKey )
        ];

        if ( !leftPerm ) {
            throw new Error( `No leftPerm found for: ${ leftPermKey }`);
        } else if ( !rightPerm ) {
            throw new Error( `No rightPerm found for: ${ rightPermKey }`);
        }

        return new PlaceValuesPermutationPair( null, this.box.bases,
            leftPerm[0], rightPerm[0],
            [
                leftPerm[1],
                rightPerm[1],
                `${ leftPerm[1].leftState ? 'U' : 'D' }${ rightPerm[1].rightState ? 'U' : 'D' }`
            ],
            null,
            cyclesObject.harmonic
        );
    }

    indexPoints( pair, cyclesObject ) {
        const pointIndex = ( pair.leftState ^ this.harmonic )
            ? pair.dix
            : pair.idx;

        const coordPerm = ( pair.leftState ^ this.harmonic )
            ? pair.permPair[0]
            : pair.permPair[1];

        this.cycles = cyclesObject
            .cycles
            .map( cycle => cycle
                .map( ( c, i ) => Number.isInteger( c )
                    ? [ c, cycle[ ( 1 + i ) % cycle.length, [] ] ]
                    : [ c.id, c.di, c.coord ] )
                .map( ( [ id, di, coord ] ) => [ id, di, coordPerm.map( b => coord[b] ) ] )
                .map( ( [ id, di, coord ] ) => this.indexPoint( pointIndex, id, di, coord ) ) );
    }

    indexPoint( pointIndex, id, di, coord ) {
        const point = pointIndex[ id ];
        const partnerId = ( this.box.volume - id - 1 );

        const reportBadCoords = false;
        if ( reportBadCoords && coord && !arrayExactlyEquals( coord, point.coord ) ) {
            const msg = `Matched point ${ point } has wrong coord; expected ${ coord }`;
            consoleLog( msg );
            //throw new Error( msg );
        }

        const pointIndexData = {
           id: id,
           di: di,
           partnerId: partnerId,
           jump: ( di - id ),
           radiant: ( partnerId - id )
        };

        point.indexes[this.key] = pointIndexData;

        this.idx[ id ] = point;
        this.dix[ di ] = point;

        return point;
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


        this.box = extantBoxes.getBox( bases );
        this.key = "box-group" + this.box.bases.join( "." );

        if (toggles.includes( "radiance" )) {

            this.box.radiance = new RadiantAction( this.box, 0, toggles.includes( "fixedRad" ) );
            this.box.unity = new CompositionAction( this.box, 1, this.box.radiance, this.box.radiance );
            this.box.unity.label = 'e';

            this.boxActions = [ this.box.radiance, this.box.unity ];
        } else {
            this.boxActions = [];
        }

        if ( bases.length == 1 ) {
            this.boxActions.push( new LiteralAction( this.box, this.boxActions.length ) );

        } else if ( bases.length > 1 ) {

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
                        .forEach( (pair , i) => this.boxActions
                            .push( new PlaceValuesAction( this.box, this.boxActions.length, pair, pair.id ) )
                        );
                } );
        }

        this.box.points
            .forEach( point => this.boxActions
                  .filter( i => !( i instanceof CompositeAction ) )
                  .forEach( indexer => indexer.indexPoint( point ) ) );

        if (toggles.includes( "radiance" )) {
            // unity is composite so has not yet been indexed
            this.box.unity.indexPoints();
        }

        this.boxActions.forEach( plane => {
            plane.ignoreEuclideanPerimeters = this.ignoreEuclideanPerimeters;
            plane.ignoreIndexPerimeters = this.ignoreIndexPerimeters;
            plane.ignoreOrbitOffsets = this.ignoreOrbitOffsets;
            plane.boxGroup = this;
        } );

        this.boxActions.forEach( plane => plane.initialise() );
    }

    getIndexMap() {
        const keys = {};
        this.boxActions.forEach( p => keys[ p.label ] = p );
        this.compositeActions.forEach( p => keys[ p.label ] = p );
        return keys;
    }

    findMatchingActions( boxAction ) {
        return this.boxActions.filter( p => p.equals( boxAction ) );
    }

    removeEqualCompositeAction( boxAction ) {
        const equalCompositeActions = this.compositeActions.filter( p => p.equals( boxAction ) );
        equalCompositeActions
            .forEach( eca => this.compositeActions.splice( this.compositeActions.indexOf( eca ), 1 ) );
    }

    findActionByPermPair( permPair ) {
        const matches = this
            .boxActions
            .filter( p => p instanceof PlaceValuesAction )
            .filter( p => arrayExactlyEquals( p.pair.permPair[0], permPair[0] ) && arrayExactlyEquals( p.pair.permPair[1], permPair[1] ) );
        return matches.length > 0 ? matches[0] : null;
    }

    registerCompositeAction( alias, compositeAction ) {
        if ( !this.findActionByAlias( alias ) ) {
            this.compositeActions.push( compositeAction );
        }
        //consoleLog( `registered composite action: ${ alias }`);
    }

    findActionByAlias( alias ) {

        const matchingCompositeAlias = this.compositeActions
            .filter( a => a.alias.includes( alias ) );

        if ( matchingCompositeAlias.length > 0 ) {
            //consoleLog( `found matching composite alias: ${ matchingCompositeAlias }`);
            return matchingCompositeAlias[0];
        }

        const matchingAlias = this.boxActions
            .filter( a => a.alias.includes( alias ) );

        if ( matchingAlias.length > 0 ) {
            //consoleLog( `found matching alias: ${ matchingAlias }`);
            return matchingAlias[0];
        }

        return null;
    }
}