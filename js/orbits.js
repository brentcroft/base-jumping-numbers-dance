
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

    constructor( parent, index, coords ) {
        this.parent = parent;
        this.index = index;
        this.midi = {
            "instrument": 0,
            "channel": 0,
            "percussion": 0,
            "repeats": 0
        };
        this.coords = coords;

        if ( coords.length < 1 ) {
            throw `Orbit coords is zero length: ${ index }`;
        }

        this.linkCoords();


        this.rank = this.coords[0].coord.length;
        this.order = this.coords.length;
        this.centre = new Array( this.rank ).fill( 0 );

        this.sum = new Array( this.rank ).fill( 0 );
        this.coords.forEach( ( item, index ) => {
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
        return this.coords.length < 2;
    }

    engages( point ) {
        return this.coords.includes( point );
    }

    position( point ) {
        return this.coords.findIndex( c => c == point );
    }


    rotate( times ) {
        rotateArray( this.coords, times )
    }

    conjugateCoords() {
        return this.isSelfConjugate()
            ? [ this.coords.slice( 0, this.order / 2 ), this.coords.slice( this.order / 2 )  ]
            : [ this.coords, this.conjugate.coords ];
    }

    toString() {
        return `orbit: ${ this.index }`;
    }

    linkCoords() {
        for ( var i = 0; i < this.coords.length; i++ ) {
            const point = this.coords[i].indexes[ this.parent.id ];
            const nextPoint = this.coords[ (i + 1) % this.coords.length ].indexes[ this.parent.id ];

            point.di = nextPoint.id;
            point.jump = this.parent.getJump( point.id, point.di );
        }
    }


    // INDEX
    indexRadiance() {
        return this
            .coords
            .map( (x,i) => x.indexes[this.parent.id].radiant )
            .reduce( (a,c) => a + Math.abs( c ), 0 ) / 2;
    }

    getJumps() {
        return this
            .coords
            .map( (x,i) => x.indexes[this.parent.id].jump );
    }

    indexPerimeter() {
        return this
            .getJumps()
            .reduce( (a,c) => a + Math.abs( c ), 0 ) / 2;
    }

    euclideanRadiance() {
        return this
            .coords
            .map( x => x.euclideanRadiance )
            .reduce( (a,c) => a + c, 0 );
    }

    euclideanPerimeter() {
        return this
            .coords
            .map( (x,i) => distance2( x.coord, this.coords[ ( i + 1 ) % this.order ].coord ) )
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
            .coords
            .map( c => c.coord );
    }

    getLineRef() {
        return this.parent.centrePoints[this.centreRef].lineRef;
    }

    getMembers() {
        return this.coords.join( C_SEP )
    }

    getIdSum() {
        return this.coords.reduce( (a, coord ) => a + coord.indexes[this.parent.id].id, 0 );
    }

    getDiSum() {
        return this.coords.reduce( (a, coord ) => a + coord.di.indexes[this.parent.id], 0 );
    }
}
