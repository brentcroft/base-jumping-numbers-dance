

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

        // abstract fixed point when volume is even
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

        this.powersForward = placeValuesForwardArray( this.bases );
        this.powersReverse = placeValuesReverseArray( this.bases );

        this.indexForward = ( coord ) => this.powersForward.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c, 0 );
        this.indexReverse = ( coord ) => ( this.box.volume - 1 ) - this.indexForward( coord );

        // plane of identity
        this.identityPlane = this.powersForward.map( ( x, i ) => x - this.powersReverse[i] );
        this.identityPlaneGcd = Math.abs( gcda( this.identityPlane ) );
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );
    }

    getPlaneEquationTx() {
        return "(radiance)";
    }
}

class PointIndex extends Index {
    constructor( box, id = 0 ) {
        super( box, id );

        // indexers
        rotateArray( this.bases, this.id );
        this.powersForward = placeValuesForwardArray( this.bases );
        this.powersReverse = placeValuesReverseArray( this.bases );

        // coord index functions
        const rotateId = (i) => ( i + this.id ) % this.bases.length;
        this.indexForward = ( coord ) => this.powersForward.map( (b,i) => b * coord[rotateId(i)] ).reduce( (a,c) => a + c, 0 );
        this.indexReverse = ( coord ) => this.powersReverse.map( (b,i) => b * coord[rotateId(i)] ).reduce( (a,c) => a + c, 0 );

        // plane of identity
        this.identityPlane = this.powersForward.map( ( x, i ) => x - this.powersReverse[i] );
        this.identityPlaneGcd = Math.abs( gcda( this.identityPlane ) );
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );
    }

    getLocusPoints( locusLine ) {
        return locusLine
            .map( (index,i) => {
                const coords = this.orbits[i].coords;
                return coords[ index % coords.length ];
            } );
    }

    getLocusStep( locusLine, step ) {
        const maxLocusIndex = this.orbits.length - 1;

        const rl = [].concat( locusLine ).reverse();
        var rlStep = step;
        if ( !(step && this.orbits.length == step.length ) ) {
            rlStep = rl.map( (x,i) => i == 0 ? 1 : 0);
        }

        var newLocus = [];
        var carry = 0;
        rl.forEach( (x,i) => {
            const orbit = this.orbits[ maxLocusIndex - i ];
            const orbitStep = rlStep[ i ];
            const maxOrbitOrder = orbit.order;

            const d = ( x + orbitStep + carry );
            const f = d % maxOrbitOrder;
            newLocus.push( f );
            carry = Math.floor( d / maxOrbitOrder );
        } );

        newLocus.reverse();

        return newLocus;
    }
}





class IndexedBox {
    constructor( bases = [] ) {
        this.box = new Box( bases );
        this.key = "box-" + this.box.bases.join( "." );
        this.box.points = [];
        this.indexPlanes = [ new RadiantIndex( this.box, 0 ) ];

        if ( bases.length <= 2 ) {
            this.indexPlanes.push( new PointIndex( this.box, this.indexPlanes.length ) );
        } else {
            for ( var i = 0; i < bases.length; i++ ) {
                this.indexPlanes.push( new PointIndex( this.box, this.indexPlanes.length ) );
            }
        }

        this.buildIndexes();

        // set conjugates
        const numPoints = this.box.points.length;
        this.box.points.forEach( point => point.conjugate = this.box.points[ numPoints - point.id - 1] );

        this.indexPlanes.forEach( plane => plane.initialise() );
    }

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

    getDataHtml() {
        const sep = ", ";
        const planeDataFn = ( data ) => ""
                           + "id: " + JSON.stringify( data.id ) + sep
                           + "cycles: " + JSON.stringify( data.cycles ) + sep
                           + "plane: " + JSON.stringify( data.equation ) + sep
                           + "euclidean: " + JSON.stringify( data.euclidean ) +sep
                           + "index: " + JSON.stringify( data.index );

        var dataHtml = "" + JSON.stringify( this.box.getJson() );
        dataHtml += "\n";
        dataHtml += this
            .indexPlanes
            .map( plane => planeDataFn( plane.getJson() ) )
            .join( "\n" );

        return dataHtml;
    }
}