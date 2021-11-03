

class Box {
    constructor( bases ) {
        this.bases = [...bases];
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

    getJson() {
        return {
           bases: this.bases,
           sum: this.sum,
           idSum: this.indexSum,
           //units: this.volumeUnits.length,
           volume: this.volume,
           area: this.surfaceArea,
           erad: this.euclideanRadiance,
           irad: this.indexRadiance
       };
    }

    toString() {
        return JSON.stringify( this.getJson(), null, 4 );
    }
}




class RadiantIndex extends Index {
    constructor( box, id = 0 ) {
        super( box, id );

        this.powersForward = placeValuesForwardArray( this.box.bases );
        // TODO:
        // 1. is there a powersReverse
        // 2. is there an identity plane
        this.powersReverse = [...this.powersForward];

        // establish identity plane
        this.identityPlane = this.powersForward.map( ( x, i ) => x - this.powersReverse[i] );
        this.identityPlaneGcd = Math.abs( gcda( this.identityPlane ) );
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );

        // establish coord index functions
        this.indexForward = ( coord ) => this.powersForward.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c, 0 );
        this.indexReverse = ( coord ) => this.powersReverse.map( (b,i) => b * coord[i] ).reduce( (a,c) => a - c, ( this.box.volume - 1 ) );
    }

    getPlaneEquationTx() {
        return "(radiance)" ;
    }
}

class PointIndex extends Index {
    constructor( box, id = 0, param = { "polarity": "positive" } ) {
        super( box, id );

        const rotation = ( this.id - 1 ) % this.box.bases.length;

        this.powersForward = placeValuesForwardArray( this.box.bases, rotation );
        this.powersReverse = placeValuesReverseArray( this.box.bases, rotation );

        // establish identity plane
        this.identityPlane = this.powersForward.map( ( x, i ) => this.powersReverse[i] - x );
        this.identityPlaneGcd = Math.abs( gcda( this.identityPlane ) );
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );

        // establish coord index functions
        this.indexForward = ( coord ) => this.powersForward.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c, 0 );
        if ( "negative" == param.polarity ) {
            this.indexReverse = ( coord ) => this.powersReverse.map( (b,i) => b * coord[i] ).reduce( (a,c) => a - c, ( this.box.volume - 1 ) );
        } else {
            this.indexReverse = ( coord ) => this.powersReverse.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c, 0 );
        }
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

        // establish coord index functions
        this.indexForward = ( coord ) => this.secondaryIndex.indexForward( primaryIndex.getPoint( coord ).coord );
        this.indexReverse = ( coord ) => this.primaryIndex.indexReverse( secondaryIndex.getPoint( coord ).coord );

        this.box.points.forEach( point => this.indexPoint( point ) );
    }


    getPlaneEquationTx() {
        return `( ${ this.primaryIndex.powersReverse ? this.primaryIndex.id : this.primaryIndex.getPlaneEquationTx() } o ${ this.secondaryIndex.id } )`;
    }
}




class IndexedBox {
    constructor( bases = [], param = {} ) {
        this.box = new Box( bases );
        this.key = "box-" + this.box.bases.join( "." );
        this.box.points = [];
        this.indexPlanes = [ new RadiantIndex( this.box, 0 ) ];

        const toggles = param.toggles || [];
        const negpol = toggles.includes( "negpol" );

        if ( bases.length < 2 ) {
            this.indexPlanes.push( new PointIndex( this.box, this.indexPlanes.length ) );
        } else {
            for ( var i = 0; i < bases.length; i++ ) {
                this.indexPlanes.push( new PointIndex( this.box, this.indexPlanes.length, { "polarity": negpol? "negative" : "positive" } ) );
            }
        }

        this.buildIndexes();

        // set conjugates
        const numPoints = this.box.points.length;
        this.box.points.forEach( point => {
            point.conjugate = this.box.points[ numPoints - point.id - 1];
        } );

        this.indexPlanes.forEach( plane => plane.initialise() );

        const composites = toggles.includes( "composites" );

        if ( composites ) {
            const inverseComposites = toggles.includes( "inverseComposites" );
            var nextIndexId = this.indexPlanes.length;

            const numCompositePlanes = this.indexPlanes.length;

            this.box
                .bases
                .flatMap( (x,i) => [
                    new CompositeIndex(
                        this.box,
                        nextIndexId++,
                        this.indexPlanes[ 1 + i ],
                        this.indexPlanes[ 1 + ( ( 1 + i) % this.box.rank ) ]
                    )
                ] )
                .forEach( index => {
                    index.initialise();
                    this.indexPlanes.push( index );
                } );


            if ( inverseComposites ) {
                var nextIndexId = this.indexPlanes.length;
                this.box
                    .bases
                    .flatMap( (x,i) => [
                        new CompositeIndex(
                            this.box,
                            nextIndexId++,
                            this.indexPlanes[ 1 + ( ( 1 + i) % this.box.rank ) ],
                            this.indexPlanes[ 1 + i ]
                        )
                    ] )
                    .forEach( index => {
                        index.initialise();
                        this.indexPlanes.push( index );
                    } );
            }


            var superComposite = this.indexPlanes[1];
            var compositeIndexId = this.indexPlanes.length;

            for ( var i = 2; i < numCompositePlanes; i++ ) {
                superComposite = new CompositeIndex(
                     this.box,
                     compositeIndexId,
                     superComposite,
                     this.indexPlanes[ i ]
                );
            }
            superComposite.initialise();
            this.indexPlanes.push( superComposite );
        }
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

    getDataHtml( selectedIndex = -1 ) {
        const sep = ", ";
        const planeDataFn = ( data ) => JSON.stringify( data.cycles );
        const tableId = 'indexSummary';
        var columnId = 0;

        var dataHtml = "Summary: " + JSON.stringify( this.box.getJson() );
        dataHtml += `<table id='${ tableId }' class='chain-details summary sortable'><tr>`;
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Id</th>`;
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Structure</th>`;
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
                const clickAction = `document.getElementById( 'planeIndex' ).value = ${ index.id }; updatePlane()`;
                const selectedClass = selectedIndex == index.id ? "class='selected'" : "";
                var x = `<td>${ index.id }</td>`;
                x += `<td onclick="${ clickAction }" ${selectedClass}>${ index.getPlaneEquationTx() }</td>`;
                x += `<td onclick="${ clickAction }" ${selectedClass}>${ getCycleIndexMonomialHtml( index ) }</td>`;
                x += `<td onclick="${ clickAction }" ${selectedClass}>${ index.identities.length }</td>`;
                x += `<td onclick="${ clickAction }" ${selectedClass}>${ index.orbits.length }</td>`;
                x += `<td onclick="${ clickAction }" ${selectedClass}>${ index.fundamental }</td>`;
                x += `<td onclick="${ clickAction }" ${selectedClass}>${ index.grossEuclideanPerimeter() }</td>`;
                x += `<td onclick="${ clickAction }" ${selectedClass}>${ index.grossIndexPerimeter() }</td>`;
                return x;
            } )
            .join( "</tr><tr>" );
        dataHtml += "</tr></table>";
        return dataHtml;
    }
}