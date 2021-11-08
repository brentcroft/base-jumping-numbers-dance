
var basePlanes = {};

function getBasePlane( key ) {
    return basePlanes[key];
}

function putBasePlane( key, basePlane ) {
    basePlane.key = key;
    basePlanes[key] = basePlane;
}


function truncate( value, places = 100 ){
    return Math.round( places * value ) / places;
}

function formattedWeight( weight ) {
    return ( weight[0] == 0 )
            ? 0
            : ( weight[0] == weight[1] || weight[2] == 0 )
                ? 1
                : ( weight[0] / weight[2] ) + " / " + ( weight[1] / weight[2] );
}


class Point {

    constructor( id, coord = [], centre ) {
        this.id = id;
        this.coord = [ ...coord ];
        this.euclideanRadiance = centre ? 2 * distance2( this.coord, centre ) : 0;
        this.indexes = [];
    }

    getJson() {
        return {
            id: this.id,
            coord: this.coord,
            euclideanRadiance: this.euclideanRadiance,
            indexes: this.indexes
        };
    }

    report() {
        return `Point: ${ canonicalize( this.coord ) }, erad: ${ this.euclideanRadiance } \n`
            + this.indexes.map( ( x, i ) => `${ i }: ${ JSON.stringify( x ) }` ).join( "\n" );
    }

    toString() {
        return canonicalize( this.coord );
    }
}


class Orbit {

    constructor( parent, index, points ) {
        this.parent = parent;
        this.index = index;
        this.midi = {
            "instrument": 0,
            "channel": 0,
            "percussion": 0,
            "repeats": 0
        };
        this.points = points;

        if ( points.length < 1 ) {
            throw `Orbit points is zero length: ${ index }`;
        }

        //this.linkCoords();


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

    toString() {
        return `orbit: ${ this.index }`;
    }

    linkCoords() {
        for ( var i = 0; i < this.points.length; i++ ) {
            const point = this.points[i].indexes[ this.parent.id ];
            const nextPoint = this.points[ (i + 1) % this.points.length ].indexes[ this.parent.id ];

            point.di = nextPoint.id;
            point.jump = this.parent.getJump( point.id, point.di );
        }
    }


    // INDEX
    indexRadiance() {
        return this
            .points
            .map( (x,i) => x.indexes[this.parent.id].radiant )
            .reduce( (a,c) => a + Math.abs( c ), 0 ) / 2;
    }

    getJumps() {
        return this
            .points
            .map( (x,i) => x.indexes[this.parent.id].jump );
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
        return this.points.reduce( (a, coord ) => a + coord.indexes[this.parent.id].id, 0 );
    }

    getDiSum() {
        return this.points.reduce( (a, coord ) => a + coord.di.indexes[this.parent.id], 0 );
    }
}
