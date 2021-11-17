

class Box {
    constructor( bases ) {
        this.bases = [...bases];

        // generate placeValues according to the permutations of the basis of the bases
        this.placePermutations = permutations( arrayIndexes( this.bases ) );
        this.placeIndexors = this.placePermutations
            .map( perm => [ perm, placeValuesPermutation( this.bases, perm ) ] );

        this.rank = this.bases.length;

        this.volume = getVolume( this.bases );
        this.indexRadiance = getIndexRadiance( this.volume );
        //this.volumeUnits = getUnits( this.volume );

        this.surfaceArea = getSurfaceArea( this.bases );
        this.euclideanRadiance = getEuclideanRadiance( this.bases );

        // since each coord plus it's reflection in the centre equals the terminal
        this.sum = this.bases.map( ( x, i ) => ( x - 1 ) * this.volume / 2 );

        // even times odd has to be even
        this.indexSum = ( this.volume * ( this.volume - 1 ) / 2 );
        this.indexCentre = ( this.volume - 1 ) / 2;

        // fixed points
        this.origin = new Array( bases.length ).fill( 0 );
        this.terminal = this.bases.map( x => x - 1 );
        this.diagonal = [ this.origin, this.terminal ];

        //
        this.centre = this.bases.map( b => ( b - 1 ) / 2 );

    }

    validateIds( ids ) {
        const invalidIds = ids.filter( id => id < 0 || id >= this.volume )
        if ( invalidIds.length > 0 ) {
            throw `id out of range: ${ invalidIds }; box.volume=${ this.volume }`;
        }
    }

    getJson() {
        return {
           //bases: this.bases,
           coordSum: this.sum,
           idSum: this.indexSum,
           //placePermutations: this.placePermutations,
           indexors: this.placeIndexors
           //units: this.volumeUnits.length,
           //volume: this.volume,
           //area: this.surfaceArea,
           //erad: this.euclideanRadiance,
           //irad: this.indexRadiance
       };
    }

    toString() {
        return JSON.stringify( this.getJson(), null, 4 );
    }
}




class RadiantIndex extends Index {
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
        this.indexReverse = ( coord ) => this.placesReverse.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c, this.forwardFrom );
        this.indexForward = ( coord ) => this.placesForward.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c, this.reverseFrom );

        this.label = 'r';
        this.alias = 'e^(1/2)'
    }

    getType() {
        return 'rad';
    }
}

class PlacesIndex extends Index {
    constructor( box, id = 0, placeIndexorPair, label ) {
        super( box, id );
        [
            [ this.permForward, this.placesForward ],
            [ this.permReverse, this.placesReverse ]
        ] = placeIndexorPair;


        // establish identity plane
        this.identityPlane = this.placesForward.map( ( x, i ) => this.placesReverse[i] - x );
        this.identityPlaneGcd = Math.abs( gcda( this.identityPlane ) );
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );

        // establish coord index functions
        this.indexForward = ( coord ) => this.placesForward.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c, this.forwardFrom );
        this.indexReverse = ( coord ) => this.placesReverse.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c, this.reverseFrom );

        this.label = label ? label : ('z' + (id - 1));
    }

    isPalindrome() {
        return isPalindrome( [ this.permForward, this.permReverse ] );
    }

    isOrthogonal() {
        return isOrthogonal( [ this.permForward, this.permReverse ] );
    }
}

class CompositeIndex extends Index {

    static compositeLabel( primaryIndex, secondaryIndex, inverse = [ false, false ] ) {
        return `( ${ primaryIndex.getLabel() }${ inverse[0] ? '^-1' : '' }`
                + " * "
                + `${ secondaryIndex.getLabel() }${ inverse[1] ? '^-1' : '' } )`;
    }


    constructor( box, id = 0, primaryIndex, secondaryIndex, inverse = [ false, false ], autoInit = false, alias ) {
        super( box, id );

        this.primaryIndex = primaryIndex;
        this.secondaryIndex = secondaryIndex;

        this.inverse = inverse;

        // establish identity plane
        this.identityPlane = [ -1, -1, 1 ];
        this.identityPlaneGcd = 1;
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );

        //
        this.label = CompositeIndex.compositeLabel( primaryIndex, secondaryIndex, inverse );
        this.alias = alias || '';

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

        var wayPoint = this.inverse[0]
           ? this.primaryIndex.applyInverse( point )
           : this.primaryIndex.apply( point );

        var endPoint = this.inverse[1]
            ? this.secondaryIndex.applyInverse( wayPoint )
            : this.secondaryIndex.apply( wayPoint );

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
        return this.alias;
    }
}


class IndexedBox {

//    static indexSorter( a, b ) {
//        return (a.getLabel() == "r")
//            ? -1
//            : ( b.getLabel() == "r")
//                ? 1
//                : (a.getLabel() == "e")
//                    ? -1
//                    : ( b.getLabel() == "e")
//                        ? 1
//                        : a.getLabel().localeCompare( b.getLabel() );
//    }
    static indexSorter( a, b ) {
        return a.id - b.id;
    }

    constructor( bases = [], param = {} ) {
        this.box = new Box( bases );
        this.key = "box-" + this.box.bases.join( "." );
        this.box.points = [];

        this.box.radiance = new RadiantIndex( this.box, 0 );
        this.box.unity = new CompositeIndex( this.box, 1, this.box.radiance, this.box.radiance, [ false, false ], false, 'r * r' );
        this.box.unity.label = 'e';
        this.indexPlanes = [ this.box.radiance, this.box.unity ];

        const toggles = param.toggles || [];

        const globalise = toggles.includes( "globalise" );

        if ( bases.length < 2 ) {
            this.indexPlanes.push( new PlacesIndex( this.box, this.indexPlanes.length ) );
        } else {

            const indexors = pairs( this.box.placeIndexors );

            const sorter = (a,b) => {
                const [ [ a1, aPF ], [ a2, aPR ] ] = a;
                const [ [ b1, bPF ], [ b2, bPR ] ] = b;
                const l1 = middleSum( a1 ) + middleSum( a2 );
                const l2 = middleSum( b1 ) + middleSum( b2 );

                return l1 != l2
                    ? l1 - l2
                    : a1 - a2;
            };

            this.palindromes = indexors
                .filter( pi => {
                    const [ [ f, pF ], [ r, pR ] ] = pi;
                    return isPalindrome( [ f, r ] );
                } );

            this.secondaries = indexors
                .filter( pi => {
                    const [ [ f, pF ], [ r, pR ] ] = pi;
                    return !isPalindrome( [ f, r ] ) && !isOrthogonal( [ f, r ] );
                } );

            this.degenerates = indexors
                .filter( pi => {
                    const [ [ f, pF ], [ r, pR ] ] = pi;
                    return !isPalindrome( [ f, r ] ) && isOrthogonal( [ f, r ] );
                } );

            this.palindromes.sort( sorter );
            this.secondaries.sort( sorter );
            this.degenerates.sort( sorter );

            const initialPlanes = [ ];

            if ( toggles.includes( "palindromicPlanes" ) ) {
                this.palindromes.forEach( (pi,i) => this.indexPlanes.push( new PlacesIndex( this.box, this.indexPlanes.length, pi, 'a_' + i ) ) );
            }
            if ( toggles.includes( "mixedPlanes" ) ) {
                this.secondaries.forEach( (pi,i) => this.indexPlanes.push( new PlacesIndex( this.box, this.indexPlanes.length, pi, 'b_' + i ) ) );
            }
            if ( toggles.includes( "orthogonalPlanes" ) ) {
                this.degenerates.forEach( (pi,i) => this.indexPlanes.push( new PlacesIndex( this.box, this.indexPlanes.length, pi, 'c_' + i ) ) );
            }
        }

        this.buildIndexes();
        this.box.unity.indexPoints();

        // set conjugates
        const numPoints = this.box.points.length;
        this.box.points.forEach( point => {
            point.conjugate = this.box.points[ numPoints - point.id - 1];
        } );

        this.indexPlanes.forEach( plane => plane.initialise( globalise ) );
    }

    getIndexMap( label ) {
        const keys = {};
        this
            .indexPlanes
            .forEach( p => keys[ p.getLabel() ] = p );
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
            throw `buildCompositeIndex requires an array of at least length 2: ${ ids }`;
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

        const ci = new CompositeIndex(
            this.box,
            this.indexPlanes.length,
            this.indexPlanes[ id0 ],
            plane,
            [ inverse0, inverse1 ],
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
    };

    buildIndexes( place = 0, locusStack = [] ) {
        if ( place == this.box.bases.length ) {
            const point = new Point( this.box.points.length, locusStack, this.box.centre );
            this.box.points.push( point );
            this.indexPlanes
                .filter( i => !( i instanceof CompositeIndex ) )
                .forEach( indexer => indexer.indexPoint( point ) );
        } else {
            for ( var i = 0; i < this.box.bases[place]; i++) {
                locusStack.push( i );
                this.buildIndexes( place + 1, locusStack );
                locusStack.pop( i );
            }
        }
    }
}