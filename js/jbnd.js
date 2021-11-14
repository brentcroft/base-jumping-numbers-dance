

class Box {
    constructor( bases ) {
        this.bases = [...bases];

        // generate placeValues according to the permutations of the basis of the bases
        this.placeIndexors = permutations( arrayIndexes( bases ) )
            .map( perm => placeValuesPermutation( bases, perm ) );

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

        //
        this.eFactor = this.bases
            .map( (x,i) => gcd( x, this.bases[ ( i + 1 ) % this.rank ] ) )
            .filter( x => x > 1 )
            .reduce( (a,c) => a * c, 1);
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

        this.placesForward = placeValuesForwardArray( this.box.bases );
        // TODO:
        // 1. is there a placesReverse
        // 2. is there an identity plane
        this.placesReverse = [...this.placesForward];

        // establish identity plane
        this.identityPlane = this.placesForward.map( ( x, i ) => x - this.placesReverse[i] );
        this.identityPlaneGcd = Math.abs( gcda( this.identityPlane ) );
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );

        // establish coord index functions
        this.indexForward = ( coord ) => this.placesForward.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c, 0 );
        this.indexReverse = ( coord ) => this.placesReverse.map( (b,i) => b * coord[i] ).reduce( (a,c) => a - c, ( this.box.volume - 1 ) );
    }

    getType() {
        return 'rad';
    }

    getPlaneEquationTx() {
        return "(total radiance)" ;
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
        this.indexForward = ( coord ) => this.placesForward.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c, 0 );
        this.indexReverse = ( coord ) => this.placesReverse.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c, 0 );
    }

    isPalindrome() {
        return isPalindrome( [ this.permForward, this.permReverse ] );
    }

    isOrthogonal() {
        return isOrthogonal( [ this.permForward, this.permReverse ] );
    }
}

class CompositeIndex extends Index {

    constructor( box, id = 0, primaryIndex, secondaryIndex ) {
        super( box, id );

        this.primaryIndex = primaryIndex;
        this.secondaryIndex = secondaryIndex;

        // establish identity plane
        this.identityPlane = [ -1, -1, 1 ];
        this.identityPlaneGcd = 1;
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );

        this.box.points.forEach( point => this.indexPoint( point ) );
    }

    indexPoint( point ) {

        if ( this.id == 11 && point.id == 26 && !this.secondaryIndex.placesReverse ) {
            console.log( `point: ${ point.report( this.primaryIndex.id ) }` );
        }


        var wayPoint = this.primaryIndex.apply( point );
        var endPoint = this.secondaryIndex.apply( wayPoint );

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
            console.log( `Id already allocated in point for index[${ this.id }]; point=${ point }, data=${ JSON.stringify( pointIndexData ) }, existing=${ JSON.stringify( existingPointIndexData ) }` );
        }

        point.indexes[this.id] = pointIndexData;

        this.idx[ id ] = point;
        this.dix[ di ] = point;
        if ( this.id == 11 && point.id == 26 && !this.secondaryIndex.placesReverse ) {
            console.log( `wayPoint.p: ${ wayPoint.report( this.primaryIndex.id ) }` );
            console.log( `wayPoint.s: ${ wayPoint.report( this.secondaryIndex.id ) }` );
            console.log( `endPoint: ${ endPoint.report( this.secondaryIndex.id ) }` );
        }
    }

    getType() {
        return 'comp';
    }

    getPlaneEquationTx() {
        return `( ${ this.primaryIndex.placesReverse ? this.primaryIndex.id : this.primaryIndex.getPlaneEquationTx() }`
                + " o "
                + `${ this.secondaryIndex.placesReverse ? this.secondaryIndex.id : this.secondaryIndex.getPlaneEquationTx() } )`;
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
            // generate placeValues according to the permutations of the basis of the bases
            const placeIndexors = permutations( arrayIndexes( bases ) )
                .map( perm => [ perm, placeValuesPermutation( bases, perm ) ] );

            const indexors = pairs( placeIndexors );

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


        const composites = toggles.includes( "composites" );
        const associates = toggles.includes( "associates" );

        if ( composites ) {

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


//                    if ( unitPlanes.length > 2 ) {
//                        const tci = new CompositeIndex(
//                             this.box,
//                             this.indexPlanes.length,
//                             ci,
//                             p[2]
//                        );
//                        tci.initialise();
//                        this.indexPlanes.push( tci );
//
//                        if ( associates ) {
//                            const tic = new CompositeIndex(
//                                 this.box,
//                                 this.indexPlanes.length,
//                                 p[2],
//                                 ci
//                            );
//                            tic.initialise();
//                            this.indexPlanes.push( tic );
//                        }
//                    }
                } );

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
            console.log( `existingPlane: ${ n }`);
            return existingPlanes[0];
        }


        const plane = ids.length == 2
            ? this.indexPlanes[ ids[ 1 ] ]
            : this.buildCompositeIndex( ids.slice( 1 ) ) ;

        const ci = new CompositeIndex(
            this.box,
            this.indexPlanes.length,
            this.indexPlanes[ ids[ 0 ] ],
            plane
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

    getDataHtml( containerId, selectedIndex = -1 ) {
        const sep = ", ";
        const tableId = 'indexSummary_table';
        var columnId = 0;

        var dataHtml = "";
        dataHtml += `<table id='${ tableId }' class='chain-details summary sortable'><tr>`;
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Id</th>`;
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Type</th>`;
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Perm Pair</th>`;
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Places</th>`;
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Equation</th>`;
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Monomial</th>`;
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Identities</th>`;
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Orbits</th>`;
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Order</th>`;
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>E-Rad</th>`;
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>I-Rad</th>`;
        dataHtml += "</tr><tr>";
        dataHtml += this
            .indexPlanes
            .map( index => {
                const clickAction = `distributeMessages( '${ containerId }', [ { 'indexKey': '${ index.id }', 'sender': this.id } ] )`;
                const selectedClass = selectedIndex == index.id ? "class='selected'" : "";
                const clickAttr = `id="index.${ index.id }" class="box_index" onclick="${ clickAction }" ${selectedClass}`;
                const permHtml = `[${ index.permForward || '' }] - [${ index.permReverse || '' }]`;
                var rowHtml = `<td>${ index.id }</td>`;
                rowHtml += `<td align='center' ${clickAttr}>${ index.getType() }</td>`;
                rowHtml += `<td align='center' ${clickAttr}>[${ index.permForward || '' }] - [${ index.permReverse || '' }]</td>`;
                rowHtml += `<td align='center' ${clickAttr}>[${ index.placesForward || '' }] - [${ index.placesReverse || '' }]</td>`;
                rowHtml += `<td align='center' ${clickAttr}>${ index.getPlaneEquationTx() }</td>`;
                rowHtml += `<td align='center'>${ getCycleIndexMonomialHtml( index ) }</td>`;
                rowHtml += `<td align='center'>${ index.identities.length }</td>`;
                rowHtml += `<td align='center'>${ index.orbits.length }</td>`;
                rowHtml += `<td align='center'>${ index.fundamental }</td>`;
                rowHtml += `<td align='center'>${ index.grossEuclideanPerimeter() }</td>`;
                rowHtml += `<td align='center'>${ index.grossIndexPerimeter() }</td>`;
                return rowHtml;
            } )
            .join( "</tr><tr>" );
        dataHtml += "</tr></table>";
        return dataHtml;
    }
}