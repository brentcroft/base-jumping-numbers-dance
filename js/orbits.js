
const PI = 3.1415926;
const TWO_PI = 2 * PI;

const C_SEP = " ";

var orbitSystems = {};

function getOrbitSystem( key ) {
    return orbitSystems[key];
}

function putOrbitSystem( key, orbitSystem ) {
    orbitSystem.key = key;
    orbitSystems[key] = orbitSystem;

    console.log( orbitSystem );
}


function truncate( value, places = 100 ){
    return Math.round( places * value ) / places;
}



// Reduce a fraction by finding the Greatest Common Divisor and dividing by it.
// https://stackoverflow.com/questions/4652468/is-there-a-javascript-function-that-reduces-a-fraction

function reduce( n, d ) {
    if ( n == 0 || d == 0 ) {
        return 0;
    }
    var numerator = (n<d)?n:d;
    var denominator = (n<d)?d:n;
    var gcd = function gcd(a,b){
        return b ? gcd(b, a%b) : a;
    };
    gcd = gcd( numerator,denominator);
    return gcd;
}

function formattedWeight( weight ) {
    return ( weight[0] == 0 )
            ? 0
            : ( weight[0] == weight[1] || weight[2] == 0 )
                ? 1
                : ( weight[0] / weight[2] ) + " / " + ( weight[1] / weight[2] );
}


function entryLengthSquared( entry, entryRight ) {
    var d = entry
        .coord
        .map( ( x, i ) => Math.abs( x - entryRight.coord[i] ) )
        .reduce( ( total, value ) => {
            return total + value**2;
            });
    return d;
}

function digitalDistance( entry, entryRight ) {

    var d = entry
        .coord
        .map( ( x, i ) => Math.abs( x, entryRight.coord[i] ) )
        .reduce( ( total, value ) => {
            return total + value;
            });

    return d;
}

function chainPerimeter( coords ) {
    var perimeter = 0;
    var digitalPerimeter = 0;

    for ( var i = 0, d = coords.length; i < d; i++ ) {
        perimeter += entryLengthSquared( coords[ i ], coords[ ( i + 1 ) % d ] );
        digitalPerimeter += digitalDistance( coords[ i ], coords[ ( i + 1 ) % d ] );
    }
    return [ perimeter, digitalPerimeter ];
}


class Coord {
    constructor( coord = [], id, di ) {
        this.coord = [ ...coord ];
        this.id = id;
        this.di = di;
    }

    toString() {
        return '( ' + this.coord.join( ', ' ) + ' )';
    }
}

class Orbit {
    constructor( index, coords ) {
        this.index = index;
        this.coords = coords;
    }

    findSums() {
        this.basis = this.coords[0].coord.length;
        this.order = this.coords.length;
        this.sum = new Array( this.basis ).fill( 0 );
        this.centre = new Array( this.basis ).fill( 0 );

        this.coords.forEach( ( item, index ) => {
            for ( var i = 0; i < this.basis; i++ ) {
                this.sum[i] += item.coord[i];
            }
        } );

        this.sum.forEach( ( s, index ) => {
            this.centre[index] = s / this.order;
        } );

        this.gcd = this.sum[0];
        this.sum.forEach( ( s ) => {
            this.gcd = reduce( this.gcd, s );
        } );
    }

    getTableRow() {
        return {
            "id": this.index,
            "sum": `( ${ this.sum.join( ', ' ) } )`,
            "centre": `( ${ this.centre.map( x => truncate( x )).join( ', ' ) } )`,
            "harmonicSum": `( ${ this.harmonicSum.map( x => truncate( x )).join( ', ' ) } )`,
            "gcd": this.gcd,
            "harmonic": truncate( this.harmonic ),
            "length": this.length,
            "weight": truncate( this.weight ),
            "bias": formattedWeight( this.bias ),
            "members": this.coords.join( C_SEP ),
            "rotation": this.rotation,
            "perimeter": this.perimeter,
            "digitalPerimeter": this.digitalPerimeter
        };
    }
}




class OrbitSystem {
    constructor( bases ) {
        this.bases = bases;
        this.centre = bases.map( x => (x-1)/2 );
        this.idx = [];
        this.dix = [];
        this.buildIndexes();
        this.buildOrbits();
        this.findFundamental();
        this.findBasesVolume();
        this.findTotalDigitSum();
        this.findMaxWeight();
        this.analyzeOrbits();
    }

    findBasesVolume() {
        var value = 1;
        for ( var i = 0; i < this.bases.length; i++ ) {
            value *= this.bases[i];
        }
        this.volume = value;
    }

    findTotalDigitSum() {

        this.totalDigitSum = new Array( this.bases.length ).fill( 0 );
        for ( var i = 0; i < this.idx.length; i++ ) {
            const coord = this.idx[i].coord;
            this.bases.forEach( (x,i) => {
                this.totalDigitSum[i] += coord[i];
            } );
        }
    }

    getCoordId( coord ) {
        var value = 0;
        var acc = 1;
        for ( var i = coord.length-1; i >= 0; i-- ) {
            const b = coord[i];
            value += acc * b;
            acc = acc * this.bases[i];
        }
        return value;
    }

    getCoordIdInverse( coord ) {
        var value = 0;
        var acc = 1;
        for ( var i = 0; i < coord.length ; i++ ) {
            const b = coord[i];
            value += acc * b;
            acc = acc * this.bases[i];
        }
        return value;
    }

    buildIndexes( index = 0, coord = [] ) {
        if ( index ==  this.bases.length ) {
            const id = this.getCoordId( coord );
            const di = this.getCoordIdInverse( coord );
            const item = new Coord( coord, id, di );
            this.idx[ id ] = item;
            this.dix[ di ] = item;
        } else {
            for ( var i = 0; i < this.bases[index]; i++) {
                coord.push( i );
                this.buildIndexes( index + 1, coord );
                coord.pop( i );
            }
        }
    }

    buildOrbits() {

        this.orbits = [];
        const tally = [ ...this.dix ];

        for ( var i = 0; i < this.idx.length; i++) {

            if ( tally[ i ] == -1 ) {
                continue;
            }

            tally[ i ] = -1;
            var coord = this.idx[ i ];
            const orbit = new Orbit( this.orbits.length, [ coord ] );
            this.orbits.push( orbit );

            while ( coord.di != i ) {
                tally[ coord.di ] = -1;
                coord = this.idx[ coord.di ];
                orbit.coords.push( coord );
            }

            orbit.findSums();
        }
    }

    findFundamental() {
        this.fundamental = 1;
        for ( var i = 0; i < this.orbits.length; i++ ) {
            var orbit = this.orbits[i];
            var hI = orbit.coords.length;
            if ( hI > this.fundamental ) {
                this.fundamental = hI;
            }
        }
    }

    findMaxWeight() {
        this.maxWeight = ( this.bases[0] - 1 ) * this.fundamental;
        this.bases.forEach( ( b, i ) => {
            this.maxWeight = reduce( this.maxWeight, ( b - 1 ) * this.fundamental );
        });
    }

    analyzeOrbits() {

        const maxIndex = this.volume - 1;

        var totalHarmonicSum = new Array( this.bases.length ).fill( 0 );
        var totalWeight = 0;
        var totalRotation = 0;
        var totalPerimeter = 0;
        var totalDigitalPerimeter = 0;

        const cycleIndexMonomial  = {};

       // calculate harmonics
        var harmonics = {};

        for ( var i = 0; i < this.orbits.length; i++ ) {
            var orbit = this.orbits[i];
            var hI = orbit.coords.length;
            harmonics[ hI ] = ( hI in harmonics ) ? ( harmonics[ hI ] + 1 ) : 1;

            var harmonic = this.fundamental / hI;

            const [ perimeter, digitalPerimeter ] = chainPerimeter( orbit.coords );

            cycleIndexMonomial[hI] = ( hI in cycleIndexMonomial ) ? cycleIndexMonomial[hI] + 1 : 1

            orbit.length = hI,
            orbit.harmonic = harmonic;
            orbit.weight = orbit.gcd * harmonic;
            orbit.harmonicSum = orbit.sum.map( x => x * harmonic);
            orbit.bias = [ orbit.weight, this.maxWeight, reduce( orbit.weight, this.maxWeight ) ];
            orbit.biasFactor = ( orbit.bias[0] / orbit.bias[1] );

            orbit.perimeter = perimeter;
            orbit.digitalPerimeter = digitalPerimeter;

            totalHarmonicSum = orbit.harmonicSum.map( (x, i)  => x + totalHarmonicSum[i] );

            totalPerimeter += orbit.perimeter;
            totalDigitalPerimeter += orbit.digitalPerimeter;
            totalWeight += orbit.weight;
        }

        Object.entries( cycleIndexMonomial ).sort( (a, b) => a < b );

        //this.hypo = Math.sqrt( base**2 + mult**2 );
        this.totalHarmonicSum = totalHarmonicSum;
        this.totalPerimeter = totalPerimeter;
        this.totalDigitalPerimeter = totalDigitalPerimeter;
        this.harmonics = harmonics;
        this.maxIndex = maxIndex;
        this.totalWeight = totalWeight;
        //this.maxWeight = maxChainWeight;
        this.cycleIndexMonomial = cycleIndexMonomial;
    }
}
