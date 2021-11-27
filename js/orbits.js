
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

    getId( actionId ) {
        return this.idx[actionId];
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

class PlaceValuesPermutation {
    constructor( id, bases, perm = [], forwardFrom = 0 ) {
        this.id = id;
        this.perm = perm;
        this.placeValues = placeValuesPermutation( bases, perm );
        this.forwardFrom = forwardFrom;
    }
    indexOf( coord ) {
        return this.placeValues.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c, this.forwardFrom );
    }
    indexPoint( point ) {
        const indexValue = this.indexOf( point.coord );
        point.idx[ this.id ] = indexValue;
        this.idx[ indexValue ] = point;
    }
}


class PlaceValuesPermutationPair {

    compareTo( other ) {

        if ( this.zeroedPlaces != other.zeroedPlaces ) {
            return -1 * ( this.zeroedPlaces - other.zeroedPlaces );
        }

        if ( !this.inverse && other.inverse ) {
            return -1;
        } else if ( this.inverse && !other.inverse ) {
            return 1;
        }

        if ( !this.degenerate && other.degenerate ) {
            return -1;
        } else if ( this.degenerate && !other.degenerate ) {
            return 1;
        }

        if ( !this.harmonic && other.harmonic ) {
            return -1;
        } else if ( this.harmonic && !other.harmonic ) {
            return 1;
        }

        return this.harmonic - other.harmonic;
    }

    static layerLabel = ( i, palindrome ) => {
        const labels = 'e_abcdfghijklmnopqrstuvwxy';
        return i == palindrome ? "z" : labels[i];
    }

    static crossValue = ( l, r ) => arrayCompare( l, r );
    static crossPermValue = ( l, r ) => arrayCompare( l.concat( r ), l.concat( r ).reverse() );
    static squarePermValue = ( l, r ) => arrayCompare( l.concat( r ), r.concat( l ).reverse() );


    constructor( bases = [ 1 ], left, right, inversePair ) {
        this.bases = bases;
        this.left = left;
        this.right = right;
        this.inverse = inversePair != null;
        this.inversePair = inversePair;

        this.rank = this.left.perm.length;

        this.identityPlane = this.left.placeValues.map( ( x, i ) => this.right.placeValues[i] - x );
        this.echo = Math.abs( gcda( this.identityPlane ) );
        this.zeroedPlaces = this.identityPlane.reduce( (a,c) => c==0 ? a + 1 : a, 0 );

        // place values difference sum
        this.placeValuesDiffSum = this.left.placeValues.map( (x,i) => Math.abs( x - this.right.placeValues[i] ) ).reduce( (a,c) => a + c, 0 );

        // which inverse
        this.crossValue = PlaceValuesPermutationPair.crossValue( this.left.perm, this.right.perm );
        this.crossValueType = this.crossValue > 0
            ? "right"
            : this.crossValue < 0
                ? "left"
                : "even";

        this.crossPermValue = PlaceValuesPermutationPair.crossPermValue( this.left.perm, this.right.perm );
        this.crossPermType = this.crossPermValue > 0
            ? "cr"
            : this.crossPermValue < 0
                ? "cl"
                : "";

        this.squarePermValue = PlaceValuesPermutationPair.squarePermValue( this.left.perm, this.right.perm );
        this.squarePermType = this.squarePermValue > 0
            ? "sr"
            : this.squarePermValue < 0
                ? "sl"
                : "";

        this.permPair = [ this.left.perm, this.right.perm ];

        this.leftAlignment = leftAlignment( this.permPair );
        this.leftFalling = this.leftAlignment < 1
            ? false
            : isFallingTo( this.left.perm, this.leftAlignment );

        this.rightAlignment = rightAlignment( this.permPair );
        this.rightRising = this.rightAlignment < 1
           ? false
           : isRisingFrom( this.left.perm, ( this.rank - this.rightAlignment ) );

        // palindrome has alignment of 0
        // even though odd one has common middle item
        this.alignment = isPalindrome( this.permPair )
            ? -1
            : alignment( this.permPair );

        this.degenerate = (this.rightAlignment == this.alignment && !this.rightRising )
            || (this.leftAlignment == this.alignment && !this.leftFalling );

        //this.degenerate = this.crossPermValue >= 0;


        this.layer = isPalindrome( this.permPair )
            ? this.rank + 1
            : this.rank - this.zeroedPlaces;

        this.label = PlaceValuesPermutationPair.layerLabel( this.layer, this.rank + 1 );

        this.harmonic = this.alignment > 0
            && !( this.alignment == this.leftAlignment || this.alignment == this.rightAlignment );



        var report = "";
        report += `${ this.alignment }[${ this.leftAlignment }${ this.leftFalling ? 'y': 'n' }${ this.rightAlignment }${ this.rightRising ? 'y': 'n' }] `;
        report += `${ this.crossPermType }${ this.squarePermType } `;
        report += `${ this.inverse ? 'i' : '' }${ this.degenerate ? 'd' : '' }${ this.harmonic ? 'h' : '' } `;
        report += `${ this.echo }`;

        this.signature = report;
    }


    getInversePair() {
        if ( this.inversePair ) {
            throw new Error( `Pair already has an inverse: [${ this.left.perm }] [${ this.right.perm }].` );
        }
        this.inversePair = new PlaceValuesPermutationPair( this.bases, this.right, this.left, this );
        return this.inversePair;
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

    // INDEX
    indexRadiance() {
        return this
            .points
            .map( (x,i) => x.at(this.parent.id).radiant )
            .reduce( (a,c) => a + Math.abs( c ), 0 ) / 2;
    }

    getJumps() {
        return this
            .points
            .map( (x,i) => x.at(this.parent.id).jump );
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
        return this.points.reduce( (a, coord ) => a + coord.at(this.parent.id).id, 0 );
    }

    getDiSum() {
        return this.points.reduce( (a, coord ) => a + coord.di.at(this.parent.id), 0 );
    }
}
