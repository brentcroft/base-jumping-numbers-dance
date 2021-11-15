

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
    }

    getType() {
        return 'rad';
    }
}

class PlacesIndex extends Index {
    constructor( box, id = 0, placeIndexorPair ) {
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
    }

    isPalindrome() {
        return isPalindrome( [ this.permForward, this.permReverse ] );
    }

    isOrthogonal() {
        return isOrthogonal( [ this.permForward, this.permReverse ] );
    }
}

class CompositeIndex extends Index {

    constructor( box, id = 0, primaryIndex, secondaryIndex, inverse = [ false, false ] ) {
        super( box, id );

        this.primaryIndex = primaryIndex;
        this.secondaryIndex = secondaryIndex;

        this.inverse = inverse;

        // establish identity plane
        this.identityPlane = [ -1, -1, 1 ];
        this.identityPlaneGcd = 1;
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );

        this.box.points.forEach( point => this.indexPoint( point ) );
    }

    indexPoint( point ) {

        if ( this.id == 11 && point.id == 26 && !this.secondaryIndex.placesReverse ) {
            consoleLog( `point: ${ point.report( this.primaryIndex.id ) }` );
        }

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
            consoleLog( `Id already allocated in point for index[${ this.id }]; point=${ point }, data=${ JSON.stringify( pointIndexData ) }, existing=${ JSON.stringify( existingPointIndexData ) }` );
        }

        point.indexes[this.id] = pointIndexData;

        this.idx[ id ] = point;
        this.dix[ di ] = point;
        if ( this.id == 11 && point.id == 26 && !this.secondaryIndex.placesReverse ) {
            consoleLog( `wayPoint.p: ${ wayPoint.report( this.primaryIndex.id ) }` );
            consoleLog( `wayPoint.s: ${ wayPoint.report( this.secondaryIndex.id ) }` );
            consoleLog( `endPoint: ${ endPoint.report( this.secondaryIndex.id ) }` );
        }
    }

    getType() {
        return 'comp';
    }

    getPlaneEquationTx() {
        return `( ${ this.inverse[0] ? '-' : '' }${ this.primaryIndex.placesReverse ? this.primaryIndex.id : this.primaryIndex.getPlaneEquationTx() }`
                + " o "
                + `${ this.inverse[1] ? '-' : '' }${ this.secondaryIndex.placesReverse ? this.secondaryIndex.id : this.secondaryIndex.getPlaneEquationTx() } )`;
    }
}




class IndexedBox {
    constructor( bases = [], param = {} ) {
        this.box = new Box( bases );
        this.key = "box-" + this.box.bases.join( "." );
        this.box.points = [];
        this.indexPlanes = [ new RadiantIndex( this.box, 0 ) ];

        const toggles = param.toggles || [];

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

            [
                ...this.palindromes,
                ...this.secondaries,
                ...this.degenerates
            ].forEach( pi => this.indexPlanes.push( new PlacesIndex( this.box, this.indexPlanes.length, pi ) ) );
        }

        this.buildIndexes();

        // set conjugates
        const numPoints = this.box.points.length;
        this.box.points.forEach( point => {
            point.conjugate = this.box.points[ numPoints - point.id - 1];
        } );

        this.indexPlanes.forEach( plane => plane.initialise() );


        const palindromicComposites = toggles.includes( "palindromicComposites" );
        const mixedComposites = toggles.includes( "mixedComposites" );
        const orthogonalComposites = toggles.includes( "orthogonalComposites" );
        const associates = toggles.includes( "associates" );

        if ( palindromicComposites ) {
            pairs( this.indexPlanes.filter( i => i.isPalindrome() ) )
                //.flatMap( p => [ p, [ p[1], p[0] ] ] )
                .forEach( p => {

                    const ci = new CompositeIndex(
                        this.box,
                        this.indexPlanes.length,
                        p[ 0 ],
                        p[ 1 ]
                    );
                    ci.initialise();
                    this.indexPlanes.push( ci );

                    if ( associates ) {
                        const cia = new CompositeIndex(
                            this.box,
                            this.indexPlanes.length,
                            p[ 1 ],
                            p[ 0 ]
                        );
                        cia.initialise();
                        this.indexPlanes.push( cia );
                    }
                } );
        }


        if ( mixedComposites ) {
            pairs( this.indexPlanes.filter( i => !i.isOrthogonal() && !i.isPalindrome() && i.id > 0 ) )
                //.flatMap( p => [ p, [ p[1], p[0] ] ] )
                .forEach( p => {

                    const ci = new CompositeIndex(
                        this.box,
                        this.indexPlanes.length,
                        p[ 0 ],
                        p[ 1 ]
                    );
                    ci.initialise();
                    this.indexPlanes.push( ci );

                    if ( associates ) {
                        const cia = new CompositeIndex(
                            this.box,
                            this.indexPlanes.length,
                            p[ 1 ],
                            p[ 0 ]
                        );
                        cia.initialise();
                        this.indexPlanes.push( cia );
                    }
                } );
        }

        if ( orthogonalComposites ) {
            pairs( this.indexPlanes.filter( i => i.isOrthogonal() && !i.isPalindrome() ) )
                //.flatMap( p => [ p, [ p[1], p[0] ] ] )
                .forEach( p => {

                    const ci = new CompositeIndex(
                        this.box,
                        this.indexPlanes.length,
                        p[ 0 ],
                        p[ 1 ]
                    );
                    ci.initialise();
                    this.indexPlanes.push( ci );

                    if ( associates ) {
                        const cia = new CompositeIndex(
                            this.box,
                            this.indexPlanes.length,
                            p[ 1 ],
                            p[ 0 ]
                        );
                        cia.initialise();
                        this.indexPlanes.push( cia );
                    }
                } );
        }

    }

    buildAndInitialiseCompositeIndex( ids ) {
        return this.buildCompositeIndex( ids );
    }

    buildCompositeIndex( ids ) {
        if ( ids.length < 2 ) {
            throw `buildCompositeIndex requires an array of at least length 2: ${ ids }`;
        }

        function ciName( ids ) {
            return ids.length > 2
                ? `( ${ ids[0] } o ` + ciName( ids.slice( 1 ) ) + " )"
                : `( ${ ids[0] } o ${ ids[1] } )`;
        }

        const n =  ciName( ids );
        const existingPlanes = this.indexPlanes.filter( p => p.getPlaneEquationTx().trim() == n );

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
            [ inverse0, inverse1 ]
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
            this.indexPlanes.forEach( indexer => indexer.indexPoint( point ) );
        } else {
            for ( var i = 0; i < this.box.bases[place]; i++) {
                locusStack.push( i );
                this.buildIndexes( place + 1, locusStack );
                locusStack.pop( i );
            }
        }
    }
}