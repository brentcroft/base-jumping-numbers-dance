

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


    buildRadiants() {
        this.radiants = [];

        for ( var i = 0; i < ( this.volume / 2 ) ; i++) {
            const orbit = new Orbit( this, this.radiants.length + 1, [] );
            this.orbits.push( conjugateOrbit );
        }
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




class IndexedBox {
    constructor( bases = [] ) {
        this.box = new Box( bases );
        this.key = "box-" + this.box.bases.join( "." );

        this.indexPlanes = [];

        if ( bases.length <= 2 ) {
            this.indexPlanes.push( new PointIndex( this.box, 0 ) );
        } else {
            for ( var i = 0; i < bases.length; i++ ) {
                this.indexPlanes.push( new PointIndex( this.box, i ) );
            }
        }

        this.indexPlanes.push( new RadiantIndex( this.box, this.indexPlanes.length ) );

        this.buildIndexes();
        this.indexPlanes.forEach( plane => plane.initialise() );
    }

    buildIndexes( place = 0, locusStack = [] ) {
        if ( place == this.box.bases.length ) {
            const point = new Point( locusStack, this.box.centre );
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
            .map( plane => planeDataFn( plane.getData() ) )
            .join( "\n" );

        return dataHtml;
    }
}