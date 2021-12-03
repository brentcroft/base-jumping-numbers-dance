
var basePlanes = {};

function getBasePlane( key ) {
    return basePlanes["plane:" + key];
}

function putBasePlane( key, basePlane ) {
    basePlanes[ "plane:" + key] = basePlane;
}

function truncate( value, places = 100 ){
    return Math.round( places * value ) / places;
}


class Point {
    constructor( id, coord = [], centre ) {
        this.id = id;
        this.coord = [ ...coord ];
        this.euclideanRadiance = centre ? 2 * distance2( this.coord, centre ) : 0;
        this.indexes = [];
        this.idx = [];
    }

    getJson() {
        return {
            id: this.id,
            coord: this.coord,
            euclideanRadiance: this.euclideanRadiance,
            indexes: this.indexes
        };
    }

    getId( id ) {
        return this.idx[id];
    }


    at( indexId ) {
        return this.indexes[ indexId ];
    }

    report() {
        return `Point[${ this.id }]: ${ canonicalize( this.coord ) }, erad: ${ this.euclideanRadiance } \n`
            + this.indexes.map( ( x, i ) => `${ i }: ${ JSON.stringify( x ) }` ).join( "\n" );
    }

    report( indexId ) {
        const indexLine = `${ indexId }: ${ JSON.stringify( this.at( indexId ) ) }`;
        return `Point[${ this.id }]: ${ canonicalize( this.coord ) }, erad: ${ this.euclideanRadiance } \n` + indexLine;
    }

    toString() {
        return canonicalize( this.coord );
    }
}


class Orbit {

    constructor( parent, index, points ) {
        this.parent = parent;
        this.index = index;
        this.points = points;

        if ( points.length < 1 ) {
            throw new Error( `Orbit points is zero length: ${ index }` );
        }

        this.rank = this.points[0].coord.length;
        this.order = this.points.length;
        this.centre = new Array( this.rank ).fill( 0 );

        this.sum = new Array( this.rank ).fill( 0 );
        this.points.forEach( ( item, index ) => {
            for ( var i = 0; i < this.rank; i++ ) {
                this.sum[i] += item.coord[i];
            }
        } );

        this.sum.forEach( ( s, index ) => {
            this.centre[index] = s / this.order;
        } );

        // passing lambdas gcd and lcm
        this.gcd = this.sum.reduce( gcd );
        this.lcm = this.sum.reduce( lcm );

        // starts out as self-conjugate
        this.conjugate = this;
    }

    toString() {
        return `(${ this.parent.label }/)orbit: ${ this.index }`;
    }


    isIdentity() {
        return this.points.length < 2;
    }

    engages( point ) {
        return this.points.includes( point );
    }

    position( point ) {
        return this.points.findIndex( c => c == point );
    }


    rotate( times ) {
        rotateArray( this.points, times )
    }

    conjugateCoords() {
        return this.isSelfConjugate()
            ? [ this.points.slice( 0, this.order / 2 ), this.points.slice( this.order / 2 )  ]
            : [ this.points, this.conjugate.points ];
    }


    // INDEX
    indexRadiance() {
        return this
            .points
            .map( (x,i) => x.at(this.parent.key).radiant )
            .reduce( (a,c) => a + Math.abs( c ), 0 ) / 2;
    }

    getJumps() {
        return this
            .points
            .map( (x,i) => x.at(this.parent.key).jump );
    }

    indexPerimeter() {
        return this
            .getJumps()
            .reduce( (a,c) => a + Math.abs( c ), 0 ) / 2;
    }

    euclideanRadiance() {
        return this
            .points
            .map( x => x.euclideanRadiance )
            .reduce( (a,c) => a + c, 0 );
    }

    euclideanPerimeter() {
        //const f = this.parent.box.eFactor;
        return this
            .points
            .map( (x,i) => distance2( x.coord, this.points[ ( i + 1 ) % this.order ].coord ) )
            .reduce( (a,c) => a + c, 0 ) / 2;
    }

    torsion() {
        return ( this.indexRadiance() - this.indexPerimeter() );
    }

    tension() {
        return ( this.euclideanRadiance() - this.euclideanPerimeter() );
    }

    isSelfConjugate() {
        return this.index == this.conjugate.index;
    }

    isFirstConjugate() {
        return this.index < this.conjugate.index;
    }

    getCoordArray() {
        return this
            .points
            .map( c => c.coord );
    }

    getLineRef() {
        return this.parent.centrePoints[this.centreRef].lineRef;
    }

    getMembers() {
        return this.points.join( C_SEP )
    }

    getIdSum() {
        return this.points.reduce( (a, coord ) => a + coord.at(this.parent.key).id, 0 );
    }

    getDiSum() {
        return this.points.reduce( (a, coord ) => a + coord.di.at(this.parent.key), 0 );
    }
}
