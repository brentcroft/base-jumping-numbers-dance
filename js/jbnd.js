

class Box {
    constructor( bases ) {
        this.bases = [...bases];
        this.rank = this.bases.length;
        this.volume = getVolume( this.bases );

        this.placePermutations = permutations( arrayIndexes( this.bases ) );
        this.permCount = this.placePermutations.length;
        this.pairCount = this.permCount  * (this.permCount - 1);

        this.placeValuePermutations = this.placePermutations.map( ( perm, permId ) => new PlaceValuesPermutation( permId, bases, perm ) );

        this.indexRadiance = getIndexRadiance( this.volume );
        this.euclideanRadiance = getEuclideanRadiance( this.bases );

        this.surfaceArea = getSurfaceArea( this.bases );

        // since each coord plus it's reflection in the centre equals the terminal
        this.sum = this.bases.map( ( x, i ) => ( x - 1 ) * this.volume / 2 );

        // even times odd has to be even
        this.indexSum = ( this.volume * ( this.volume - 1 ) / 2 );
        this.indexCentre = ( this.volume - 1 ) / 2;

        // fixed points
        this.origin = new Array( bases.length ).fill( 0 );
        this.terminal = this.bases.map( x => x - 1 );
        this.diagonal = [ this.origin, this.terminal ];

        this.centre = this.bases.map( b => ( b - 1 ) / 2 );
        this.points = this.buildPoints();

        this.placeValuePermutations
            .forEach( perm => perm.idx = new Array( this.volume ).fill( 0 ) );

        this.points
            .forEach( point => {

                point.conjugate = this.points[ this.volume - point.id - 1];

                this.placeValuePermutations
                    .forEach( perm => perm.indexPoint( point ) );
            } );
    }

    buildPoints( place = 0, locusStack = [], points = [] ) {
        if ( place == this.rank ) {
            const point = new Point( points.length, locusStack, this.centre );
            points.push( point );
        } else {
            for ( var i = 0; i < this.bases[place]; i++) {
                locusStack.push( i );
                this.buildPoints( place + 1, locusStack, points );
                locusStack.pop( i );
            }
        }
        return points;
    }

    validateIds( ids ) {
        const invalidIds = ids.filter( id => id < 0 || id >= this.volume )
        if ( invalidIds.length > 0 ) {
            throw new Error( `id out of range: ${ invalidIds }; box.volume=${ this.volume }` );
        }
    }

    getJson() {

        return {
           coordSum: this.sum,
           idSum: this.indexSum,
           perms: this.permCount,
           pairs: this.pairCount
       };
    }

    toString() {
        return JSON.stringify( this.getJson(), null, 4 );
    }
}




class RadiantAction extends ActionElement {
    constructor( box, id = 0 ) {
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
            // enforce origin and terminal
            // radiantOriginAndTerminusAreIdentities
            return index == 0
                ? this.reverseFrom
                : index == this.reverseFrom
                    ? 0
                    : index;
        };
        this.indexForward = ( coord ) => this.placesForward.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c, this.reverseFrom );

        this.label = 'r';
        this.alias = ['e^½'];
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
            jump: this.getJump( id, di ),
            radiant: ( conjugateId - id )
        };

        const existingPointIndexData = point.indexes[ this.id ];

        if ( existingPointIndexData ) {
            consoleLog( `Id already allocated in point for index[${ this.id }]; point=${ point }, data=${ JSON.stringify( pointIndexData ) }, existing=${ JSON.stringify( existingPointIndexData ) }` );
        }

        point.indexes[this.id] = pointIndexData;

        this.idx[ id ] = point;
        this.dix[ di ] = point;
    }

    getType() {
        return 'rad';
    }
}

class PlaceValuesAction extends ActionElement {
    constructor( box, id = 0, placeValuesPermutationPair, actionIndex ) {
        super( box, id );
        this.pair = placeValuesPermutationPair;
        this.identityPlane = this.pair.identityPlane;
        this.identityPlaneGcd = this.pair.echo;
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );
        this.actionIndex = (this.pair.inverse ? this.pair.inversePair.actionIndex : actionIndex );

        //
        this.pair.actionIndex = this.actionIndex;
        this.label = `${ this.pair.inverse ? 'i' : '' }${ this.pair.label }_${ this.actionIndex }`;

        // reference to component indexes
        this.idx = this.pair.left.idx;
        this.dix = this.pair.right.idx;
    }

    indexPoint( point ) {
        const boxVolume = this.box.volume;

        const id = point.getId( this.pair.left.id );
        const di = point.getId( this.pair.right.id );

        const conjugateId = ( boxVolume - id - 1 );

        const pointIndexData = {
            id: id,
            di: di,
            conjugateId: conjugateId,
            jump: this.getJump( id, di ),
            radiant: ( conjugateId - id )
        };

        const existingPointIndexData = point.indexes[ this.id ];

        if ( existingPointIndexData ) {
            consoleLog( `Id already allocated in point for index[${ this.id }]; point=${ point }, data=${ JSON.stringify( pointIndexData ) }, existing=${ JSON.stringify( existingPointIndexData ) }` );
        }

        point.indexes[this.id] = pointIndexData;
    }

    isPalindrome() {
        return this.pair.isPalindrome();
    }

    isOrthogonal() {
        return this.pair.isOrthogonal();
    }
}

class CompositeAction extends ActionElement {

    static compositeLabel( primaryIndex, secondaryIndex ) {
        return `( ${ primaryIndex.getLabel() } * ${ secondaryIndex.getLabel() }`;
    }

    constructor( box, id = 0, primaryIndex, secondaryIndex, autoInit = false, reverse = false ) {
        super( box, id );

        this.primaryIndex = primaryIndex;
        this.secondaryIndex = secondaryIndex;
        this.reverse = reverse;

        // todo: fast calculate on fly?
        this.idx = new Array( this.box.volume );
        this.dix = new Array( this.box.volume );

        // todo: no identity plane
        this.identityPlane = [ -1, -1, 1 ];
        this.identityPlaneGcd = 1;
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );

        //
        this.label = CompositeAction.compositeLabel( primaryIndex, secondaryIndex );
        this.alias = [];

        if ( autoInit ) {
            this.indexPoints();
        } else {
            this.unindexed = true;
        }
    }

    indexPoints() {
        this.box.points.forEach( point => this.indexPoint( point ) );
        delete this.unindexed;
    }

    indexPoint( point ) {

//        var wayPoint = this.primaryIndex.apply( point );
//        var endPoint = this.reverse
//            ? this.secondaryIndex.applyInverse( wayPoint )
//            : this.secondaryIndex.apply( wayPoint );

        var wayPoint = this.reverse
            ? this.secondaryIndex.applyInverse( point )
            : this.secondaryIndex.apply( point );
        var endPoint = this.primaryIndex.apply( wayPoint );

        // global ids
        const id = point.id;
        const di = endPoint.id;

        this.box.validateIds( [ id, di ] );

        const conjugateId = ( this.box.volume - id - 1 );

        const pointIndexData = {
           id: id,
           di: di,
           conjugateId: conjugateId,
           jump: this.getJump( id, di ),
           radiant: ( conjugateId - id )
        };

        const existingPointIndexData = point.indexes[ this.id ];

        if ( existingPointIndexData ) {
            //consoleLog( `Id already allocated in point for index[${ this.id }]; point=${ point }, data=${ JSON.stringify( pointIndexData ) }, existing=${ JSON.stringify( existingPointIndexData ) }` );
        }

        point.indexes[this.id] = pointIndexData;

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


class IndexedBox {

    constructor( bases = [], param = {} ) {

        const toggles = param.toggles || [];
        const actionLayers = param.actionLayers || [];

        const [ identities, inverses, harmonics, degenerates ] = [
            toggles.includes( "identities" ),
            toggles.includes( "inverses" ),
            toggles.includes( "harmonics" ),
            toggles.includes( "degenerates" )
        ];

        const globalise = toggles.includes( "globalise" );

        this.box = new Box( bases );
        this.key = "box-" + this.box.bases.join( "." );

        if (toggles.includes( "radiance" )) {

            this.box.radiance = new RadiantAction( this.box, 0 );
            this.box.unity = new CompositeAction( this.box, 1, this.box.radiance, this.box.radiance );
            this.box.unity.label = 'e';

            this.indexPlanes = [ this.box.radiance, this.box.unity ];
        } else {
            this.indexPlanes = [];
        }


        if ( bases.length > 1 ) {
            var indexors = pairs( this.box.placeValuePermutations )
                .map( ( pair, i ) => new PlaceValuesPermutationPair( bases, pair[0], pair[1], null, i ) );

            if ( inverses ) {
                indexors.push( ...indexors.map( pair => pair.getInversePair() ) );
            }

            this.box.placeValuePermutations
                .forEach( ( perm, i ) => indexors.push( new PlaceValuesPermutationPair( bases, perm, perm, null, i ) ) );

            const indexorSorter = ( p1, p2 ) => p1.compareTo( p2 );

            indexors.sort( indexorSorter );

            // capture all labels
            this.layerLabels = [];
            indexors.forEach( pair => this.layerLabels.filter( l => l[1] == pair.label ).length > 0 ? 0 : this.layerLabels.push( [ pair.layer, pair.label ] ) );
            this.layerLabels.sort( (a,b) => a[0]- b[0] );

            this.layers = [
                ...this.layerLabels.map( x => [] ),
                ...this.layerLabels.map( x => [] )
            ];

            // todo:: move to PlaceValuesPermutationPair constructor
            const maxOnes = this.box.rank - 2;
            const countOnes = ( x ) => x.reduce( (a,c) => c == 1 ? a + 1 : a, 0 );
            const indicatesIdentity = ( pair ) => countOnes( pair.left.placeValues ) > maxOnes || countOnes( pair.right.placeValues ) > maxOnes;

            // filter and group by layers
            indexors
                .filter( pair => actionLayers.includes( pair.layer ) )
                .filter( pair => harmonics || !pair.harmonic )
                .filter( pair => degenerates || !pair.degenerate )
                .filter( pair => degenerates || !indicatesIdentity( pair )  )
                .forEach( pair => {
                    this.layers[ pair.layer ].push( pair );
                } );


            // remove empty layers
            this.layers = this.layers.filter( layer => layer.length > 0 );

            this.layers
                .forEach( layer => {
                    var actionIndex = 0;
                    layer
                        .forEach( (pair , i) => this.indexPlanes
                            .push(
                                new PlaceValuesAction(
                                    this.box,
                                    this.indexPlanes.length,
                                    pair,
                                    pair.inverse
                                        ? -1
                                        : actionIndex++
                                )
                            )
                        );
                } );
        }

        this.box.points
            .forEach( point => this.indexPlanes
                  .filter( i => !( i instanceof CompositeAction ) )
                  .forEach( indexer => indexer.indexPoint( point ) ) );

        if (toggles.includes( "radiance" )) {
            // unity is composite so not auto-indexed
            this.box.unity.indexPoints();
        }

        this.indexPlanes.forEach( plane => plane.initialise( globalise ) );
    }

    getIndexMap( label ) {
        const keys = {};
        this.indexPlanes.forEach( p => keys[ p.getLabel() ] = p );
        return keys;
    }

    buildAndInitialiseCompositeIndex( ids ) {
        return this.buildCompositeIndex( ids );
    }

    findMatchingIndexes( index ) {
        const matches = this.indexPlanes.filter( p => p.equals( index ) );
        matches.sort( IndexedBox.indexSorter  );
        return matches;
    }

    buildCompositeIndex( ids ) {
        if ( ids.length < 2 ) {
            throw new Error( `buildCompositeIndex requires an array of at least length 2: ${ ids }` );
        }

        function ciName( ids ) {
            return ids.length > 2
                ? `( ${ ids[0] } * ` + ciName( ids.slice( 1 ) ) + " )"
                : `( ${ ids[0] } * ${ ids[1] } )`;
        }

        const n =  ciName( ids );
        const existingPlanes = this.indexPlanes.filter( p => p.getLabel() == n );

        if (existingPlanes.length > 0 ) {
            consoleLog( `existingPlane: ${ n }`);
            return existingPlanes[0];
        }

        const id1 = Math.abs( ids[ 1 ] );
        const inverse1 = ids[ 1 ] < 0;

        const plane = ids.length == 2
            ? this.indexPlanes[ id1 ]
            : this.buildCompositeIndex( ids.slice( 1 ) ) ;

        const id0 = Math.abs( ids[ 0 ] );
        const inverse0 = ids[ 0 ] < 0;

        const ci = new CompositeAction(
            this.box,
            this.indexPlanes.length,
            this.indexPlanes[ id0 ],
            plane,
            true
        );

        ci.initialise();
        this.indexPlanes.push( ci );
        return ci;
    }

    convolve( a, b, indexes ) {
        indexes = indexes || this.indexPlanes;
        var locus = b;
        indexes
            .map( i => this.indexPlanes[i] )
            .forEach( index => locus = index.convolve( a, locus ) || locus );
        return locus;
    }
}