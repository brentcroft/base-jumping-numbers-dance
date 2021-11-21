

class Box {
    constructor( bases ) {
        this.bases = [...bases];

        // generate placeValues according to the permutations of the basis of the bases
        this.placePermutations = permutations( arrayIndexes( this.bases ) );
        this.placeIndexors = this.placePermutations.map( perm => [ perm, placeValuesPermutation( this.bases, perm ) ] );

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

        this.permCount = this.placePermutations.length;
        this.pairCount = this.permCount  * (this.permCount - 1);
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
        this.alias = 'e^½'
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

    static indexSorter( a, b ) {
        return a.id - b.id;
    }

    hasPalindromicPair( indexors, pair ) {
        const [ a, b ] = pair;
        const [ l1, r1 ] = [ a[0], b[0] ];

        const pp = indexors
            .filter( p => {
                const [ c, d ] = p;
                const [ l2, r2 ] = [ c[0], d[0] ];
                return (isPalindrome( [ l1, r2 ] ) && isPalindrome( [ r1, l2 ] ) )
                    || (isPalindrome( [ l1, l2 ] ) && isPalindrome( [ r1, r2 ] ) );
            } );
        return pp.length > 0;
    }

    getPalindromicPairsToEvict( indexors, reflections = false ) {
        const removers = [];

        indexors
            .forEach( (x,i) => {
                if (i == 0 ) {
                    return;
                }
                const [ a, b ] = x;
                const [ al, ar ] = [ a[0], b[0] ];
                indexors
                    .slice( 0, i )
                    .forEach( (y,j) => {
                        const [ c, d ] = y;
                        const [ cl, cr ] = [ c[0], d[0] ];

                        const square = isPalindrome( [ al, cl ] ) && isPalindrome( [ ar, cr ] );
                        const cross = isPalindrome( [ al, cr ] ) && isPalindrome( [ ar, cl ] );

                        if ( !reflections && (cross || square)  ) {
                            removers.push( x );
                        }
                    } );
            } );

        return removers;
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
            var indexors = pairs( this.box.placeIndexors );


            const typeOfIndexor = ( a ) => {
                const [ l, r ] = [ a[0][0], a[1][0] ];
                const p = isPalindrome( [ l, r ] );
                if ( p ) {
                    return 1;
                }
                const o = isOrthogonal( [ l, r ] );
                return o ? -1 * o : 0;
            }

            const indexorSorter = ( a, b ) => {
                const [ aL, aR ] = [ a[0][0], a[1][0] ];
                const [ bL, bR ] = [ b[0][0], b[1][0] ];
                const aT = typeOfIndexor( a );
                const bT = typeOfIndexor( b );

                return aT - bT;
            };

            indexors.sort( indexorSorter );

            const [ inverses, reflections ] = [
                toggles.includes( "inverses" ),
                toggles.includes( "reflections" )
            ];

            this.palindromes = [];
            this.secondaries = [];
            this.tertiaries = [];
            this.degenerates = [];

            const maxAlignment = this.box.rank - 2;

            indexors
                .forEach( pi => {
                    const [ [ f, pF ], [ r, pR ] ] = pi;

                    if ( isPalindrome( [ f, r ] ) ) {
                        this.palindromes.push( pi );

                    } else if ( isLeftAligned( [ f, r ], maxAlignment ) ) {
                        if ( reflections || isRightRisingFromTo( f, [ maxAlignment, this.box.rank - 1 ] ) ) {
                            this.degenerates.push( pi );
                        }

                    } else if ( isRightAligned( [ f, r ], maxAlignment ) ) {
                        if ( reflections || isLeftRisingFromTo( f, [ 2, maxAlignment + 1 ] ) ) {
                            this.degenerates.push( pi );
                        }

                    } else {
                        if ( leftAlignment( [ f, r ] ) > 0 || rightAlignment( [ f, r ] ) > 0 ) {
                            this.tertiaries.push( pi );
                        } else {
                            this.secondaries.push( pi );
                        }
                    }
                } );

            if ( !reflections ) {
                const sR = this.getPalindromicPairsToEvict( this.secondaries, reflections );
                this.secondaries = this.secondaries.filter( x => !sR.includes( x ) );

                const tR = this.getPalindromicPairsToEvict( this.tertiaries, reflections );
                this.tertiaries = this.tertiaries.filter( x => !tR.includes( x ) );

                const dR = this.getPalindromicPairsToEvict( this.degenerates, reflections );
                this.degenerates = this.degenerates.filter( x => !dR.includes( x ) );
            }

            if ( inverses ) {
                this.degenerates = this.degenerates.concat( this.degenerates.map( p => [ p[1], p[0] ] ) );
                this.secondaries = this.secondaries.concat( this.secondaries.map( p => [ p[1], p[0] ] ) );
                this.tertiaries = this.tertiaries.concat( this.tertiaries.map( p => [ p[1], p[0] ] ) );
                this.palindromes = this.palindromes.concat( this.palindromes.map( p => [ p[1], p[0] ] ) );
            }


            if ( toggles.includes( "orthogonalPlanes" ) ) {
                this.degenerates.forEach( (pi,i) => this.indexPlanes.push( new PlacesIndex( this.box, this.indexPlanes.length, pi, 'a_' + i ) ) );
            }
            if ( toggles.includes( "tertiaryPlanes" ) ) {
                this.tertiaries.forEach( (pi,i) => this.indexPlanes.push( new PlacesIndex( this.box, this.indexPlanes.length, pi, 'b_' + i ) ) );
            }
            if ( toggles.includes( "mixedPlanes" ) ) {
                this.secondaries.forEach( (pi,i) => this.indexPlanes.push( new PlacesIndex( this.box, this.indexPlanes.length, pi, 'c_' + i ) ) );
            }
            if ( toggles.includes( "palindromicPlanes" ) ) {
                this.palindromes.forEach( (pi,i) => this.indexPlanes.push( new PlacesIndex( this.box, this.indexPlanes.length, pi, 'z_' + i ) ) );
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