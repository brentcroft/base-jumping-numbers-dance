
function consoleLog( s ) {
    console.log( s );
}

const PI = 3.1415926;
const TWO_PI = 2 * PI;

const C_SEP = ", ";
const BRA = [ '(', ')' ];
const CURLY_BRA = [ '{', '}' ];
const SQUARE_BRA = [ '[', ']' ];

/**
    reify the data to a new document element of type tag
*/
function reify( tag, attr = {}, children = [], ops = [] ) {
    const e = document.createElement( tag );
    if ( attr ) {
        Object.entries(attr).forEach( x => {
            const [ key, value ] = x;
            if ( value === null || value === "") {
                // do nothing
            } else if ( "class" == key ) {
                value.split(",").forEach( c => e.classList.add( c ) );
            } else if ( "type" == key ) {
                e.type = value;
            } else {
                e.setAttribute( key, value );
            }
        });
    }
    if ( children ) {
        children.forEach( x => e.appendChild( x ) );
    }
    if ( ops ) {
        ops.forEach( x => x( e ) );
    }
    return e;
}

/**

*/
function reifyData( tag, data ) {
    return reify(
        tag,
        data.attr ? data.attr : {},
        data.children ? data.children : [],
        data.ops ? data.ops : []
    );
}

/**

*/
function canonicalize( m, sep = C_SEP, bra = BRA ) {
    try {
        return `${ bra[0] }${ m.join( sep ) }${ bra[1] }`;
    } catch ( e ) {
        throw e;
    }
}

var interleave = ( [ x, ...xs ], ys ) => x ? [ x, ...interleave( ys, xs ) ] : ys;

var arrayIndexes = ( b ) => b.map( (x,i) => i );

var numericArraySorter =  (a,b) => {
    for ( var i = 0; i < a.length; i++ ) {
        if ( a[i] != b[i] ) {
            return a[i] - b[i];
        }
    }
    return 0;
};

function isPalindrome( arrayPair ) {
    const [ a, b ] = arrayPair;
    const d = b.length;
    return a.filter( (x,i) => x == b[ d - i - 1 ]).length == d;
}

function isOrthogonal( arrayPair, degree = 1 ) {
    const [ a, b ] = arrayPair;
    const d = b.length;
    var atIndex = -1;
    a.filter( (x,i) => {
        if (x == b[i]){
            atIndex = i;
            return true;
        }
        return false;
    });
    return atIndex + 1;
}

function alignedPlaces( arrayPair ) {
    const [ a, b ] = arrayPair;
    const aligned = [];
    const alignedWeights = [];
    const unalignedLeft = [];
    const unalignedRight = [];
    for ( var i = 0; i < b.length; i++ ) {
        if (a[i] == b[i] ) {
            aligned.push( a[i] );
            alignedWeights.push( i );
        } else {
            unalignedLeft.push( a[i] );
            unalignedRight.push( b[i] );
        }
    }
    return [ [ aligned, alignedWeights ], [ unalignedLeft, unalignedRight ] ];
}



function leftAlignment( arrayPair ) {
    const [ a, b ] = arrayPair;
    for ( var i = 0; i < b.length; i++ ) {
        if (a[i] != b[i] ) {
            return i;
        }
    }
    return b.length;
}

function rightAlignment( arrayPair ) {
    const [ a, b ] = arrayPair;
    for ( var i = 0; i < b.length; i++ ) {
        const ix = b.length - 1 - i;
        if (a[ix] != b[ix] ) {
            return i;
        }
    }
    return b.length;
}


function isLeftAligned( arrayPair, degree = 1 ) {
    const [ a, b ] = arrayPair;
    const maxDegree = b.length - 1
    for ( var i = 0; i <= maxDegree; i++ ) {
        if (a[i] != b[i] ) {
            return degree == i;
        }
    }
    return degree == maxDegree;
}

function isRightAligned( arrayPair, degree = 1 ) {
    const [ a, b ] = arrayPair;
    const maxDegree = b.length - 1
    for ( var i = 0; i <= maxDegree; i++ ) {
        const ix = maxDegree - i;
        if (a[ix] != b[ix] ) {
            return degree == i;
        }
    }
    return degree == maxDegree;
}

function isRisingFrom( a, from ) {
    for ( var i = from + 1; i < a.length; i++ ) {
        if (a[i-1] >= a[i] ) {
            return false;
        }
    }
    return true;
}

function isReverseFallingFromValue( a, value ) {
    var v = value;
    for ( var i = (a.length - 1); i >= 0; i-- ) {
        if (a[i] != v ) {
            return false;
        }
        v--;
    }
    return true;
}


function isFallingTo( a, to ) {
    for ( var i = 1; i < to; i++ ) {
        if (a[i-1] <= a[i] ) {
            return false;
        }
    }
    return true;
}

function isRisingTo( a, to ) {
    for ( var i = 0; i < to; i++ ) {
        if (a[i-1] >= a[i] ) {
            return false;
        }
    }
    return true;
}



function middleSum( a ) {
    return a.slice( 1, a.length - 1 ).reduce( (a,c) => a + c, 0 );
}


// @see: https://stackoverflow.com/questions/44474864/compute-determinant-of-a-matrix
var determinant = ( m ) => m.length == 1
    ? m[0][0]
    : m.length == 2
        ? m[0][0]*m[1][1]-m[0][1]*m[1][0]
        : m[0]
            .reduce( (r,e,i) => r+(-1)**(i+2)*e*determinant(
                m
                    .slice(1)
                    .map(c => c.filter((_,j) => i != j))),0);

var displacement      = ( p1, p2 ) => p2.map( (p,i) => p - p1[i] );
var addition          = ( p1, p2 ) => p2.map( (p,i) => p + p1[i] );
var subtraction       = ( p1, p2 ) => p1.map( (p,i) => p - p2[i] );
var scale             = ( p, s ) => p.map( x => x * s );
var modularize        = ( p, b ) => {
    const m = [ ...p ];
    for ( var i = m.length-1; i >= 0; i-- ) {
        m[i] = p[i] % b[i];
    }
    return m;
};
var modularizeC        = ( p, b ) => {
    const m = [ ...p ];
    var carry = 0;
    for ( var i = m.length-1; i >= 0; i-- ) {
        const v = carry + p[i];
        m[i] = v % b[i];
        carry = ~~( v / b[i] );
    }
    return m;
};

var arrayCompare = (a, b) => {
    for ( i = 0; i < b.length; i++ ) {
        if ( a[i] < b[i] ) {
            return -1;
        } else if ( a[i] > b[i] ) {
            return 1;
        }
    }
    return 0;
};

var arrayExactlyEquals = (a, b) => a.filter( (x,i) => x == b[i] ).length == a.length;
var arrayEquals = (a, b) => arrayContains( a, b ) && a.length === b.length;
var arrayContains = (a, b) => Array.isArray(a) && Array.isArray(b) && b.every( v => a.includes( v ) );

// @:see: https://stackoverflow.com/questions/12303989/cartesian-product-of-multiple-arrays-in-javascript
var cartesian         = ( ...a ) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
var dotProduct        = ( p1, p2 ) => p2.map( (x,i) => x * p1[i] ).reduce( (a,c) => a + c, 0 );
var crossProduct      = ( p1, p2 ) => [
      p1[1] * p2[2] - p1[2] * p2[1],
      p1[2] * p2[0] - p1[0] * p2[2],
      p1[0] * p2[1] - p1[1] * p2[0]
];

var reflectPoint = ( point, centre ) => subtraction( scale( centre, 2 ), point );


var euclideanDistance2 = ( p ) => p.map( d => d**2 ).reduce( (a,v) => a + v, 0 )
var distance2          = ( p1, p2 ) => euclideanDistance2( displacement( p1, p2 ) );

var gcd = (a, b) => a ? gcd( b % a, a) : b;
var lcm = (a, b) => a && b ? a * b / gcd(a, b) : 0;

var gcda = (a) => {
    let result = a[0];
    for (let i = 1; i < a.length; i++) {
        result = gcd(a[i], result);
        if(result == 1) {
            return 1;
        }
    }
    return result;
};
var lcma = (a) => {
    let result = a[0];
    for (let i = 1; i < a.length; i++) {
        result = lcm(a[i], result);
        if(result == 0) {
            return 0;
        }
    }
    return result;
};

var normalize = (d) => {
    const ed = Math.sqrt( euclideanDistance2( d ) );
    return d.map( x => x / ed );
};

var unitDisplacement  = ( p1, p2 ) => normalize( displacement( p1, p2 ) );

var perpendicularDistance = ( point, line, lineUnit ) => {
    const [ A, B ] = line;
    const ud = ( lineUnit ? lineUnit : unitDisplacement( A, B ) );
    const t = dotProduct( displacement( A, point ), ud );
    const intersectionPoint = addition( A, scale( ud, t ) );
    return distance2( point, intersectionPoint );
};

function extendLine( p1, p2, scale = 0 ) {

    const v = displacement( p1, p2 );
    const r = Math.sqrt( euclideanDistance2( v ) );

    if ( r == 0 ) {
        return [ p1, p2 ];
    }

    const d = v.map( (x,i) => ( scale * x / r ) );

    const p0 = p1.map( (p, i) => p - d[i] );
    const p3 = p2.map( (p, i) => p + d[i] );

    return [ p0, p1, p2, p3 ];
}


function tetrahedralVolume( line1, line2 ) {
    const [ p1, p2 ] = line1;
    const [ p3, p4 ] = line2;
    const v = determinant( [ displacement( p1, p2 ), displacement( p2, p3 ), displacement( p3, p4 ) ] ) / 6;
    return v;
}


// Reduce a fraction by finding the Greatest Common Divisor and dividing by it.
// https://stackoverflow.com/questions/4652468/is-there-a-javascript-function-that-reduces-a-fraction

function reduce( n, d ) {
    if ( n == 0 || d == 0 ) {
        return 0;
    }
    var numerator = (n<d)?n:d;
    var denominator = (n<d)?d:n;
    return gcd( numerator, denominator );
}


function rotateArray( array, times = 1 ) {
    for ( var i = 0; i < times; i++ ) {
        array.push( array.shift() );
    }
    return array;
}

function rotateReverseArray( array, times = 1 ) {
    for ( var i = 0; i < times; i++ ) {
        array.unshift( array.pop() );
    }
    return array;
}

/*
    Randomize array in-place using Durstenfeld shuffle algorithm
    https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
*/
function shuffleArray( array ) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function getVolume( bases ) {
    return bases.reduce( ( a, c ) => a * c, 1 );
}

function getIndexRadiance( volume ) {
    return ( volume ** 2 - ( volume % 2 ) ) / 4;
}

function getUnits( volume ) {
    const units = [ 1 ];
    for ( var i = 2; i < volume; i++ ) {
        if ( 1 == gcd( i, volume ) ) {
            units.push( i );
        }
    }
    return units;
}

function getSurfaceArea( bases ) {
    const rank = bases.length;
    return bases
        .map( (x,i) => [ x - 1, bases[ ( i + 1 ) % rank ] - 1 ] )
        .map( x => ( rank - 1 ) * x[0] * x[1] )
        .reduce( (a,c) => a + c, 0 );
}

/**
     The sum of the distances from each coordinate to the box centre.
*/
function getEuclideanRadiance( bases ) {

    const volume = bases.reduce( (a,c) => a*c, 1 );
    const volumeFactor = ( b ) => ( volume / b );
    const sumTriangles = ( n ) => n * ( n + 1 ) / 2;
    const sumSquares = ( n ) => n * ( n + 1 ) * ( 2 * n + 1 ) / 6;

    const d = bases.map( b => volume * ( b - 1 )**2 );
    const e = bases.map( b => 4 * volumeFactor( b ) * ( b - 1 ) * sumTriangles( b - 1 ) );
    const f = bases.map( b => 4 * volumeFactor( b ) * sumSquares( b - 1 ) );

    const [ c, s, t ] = [
        d.reduce( (a,c) => a + c, 0 ),
        e.reduce( (a,c) => a + c, 0 ),
        f.reduce( (a,c) => a + c, 0 )
    ];

    return ( c - s + t ) / 2;
}


/*
    calculate array of place values
    forwards, where p[offset] == 1.
*/
function placeValuesForwardArray( bases, offset = 0 ) {
    offset = offset % bases.length;
    var acc = 1;
    const p = new Array( bases.length ).fill( 0 );
    for ( var i = offset; i < bases.length; i++ ) {
        p[i] = acc;
        acc = acc * bases[i];
    }
    if ( offset > 0 ) {
        for ( var i = 0; i < offset; i++ ) {
            p[i] = acc;
            acc = acc * bases[i];
        }
    }
    return p;
}
/*
    calculate array of place values
    in reverse, where p[bases.length-offset-1] == 0.
*/
function placeValuesReverseArray( bases, offset = 0 ) {
    offset = offset % bases.length;
    var acc = 1;
    const p = new Array( bases.length ).fill( 0 );

    if ( offset > 0 ) {
        for ( var i = offset - 1; i >= 0; i-- ) {
            p[ i ] = acc;
            acc = acc * bases[i];
        }
    }
    for ( var i = bases.length - 1; i >= offset; i-- ) {
        p[ i ] = acc;
        acc = acc * bases[i];
    }
    return p;
}


function pairs( list ) {
    if (list.length < 2) {
        return [];
    }
    const first = list[0];
    const rest = list.slice(1);
    return rest.map( x => [ first, x ] ).concat( pairs( rest ) );
}

// https://stackoverflow.com/questions/9960908/permutations-in-javascript
function permutations( inputArr ) {
    let result = [];
    const permute = (arr, m = []) => {
        if (arr.length === 0) {
            result.push(m);
        } else {
            for (let i = 0; i < arr.length; i++) {
                let curr = arr.slice();
                let next = curr.splice(i, 1);
                permute(curr.slice(), m.concat(next));
            }
        }
    }
    permute(inputArr);
    //result.sort( numericArraySorter );
    return result;
}

function placeValuesPermutation( bases, placePermutation = [] ) {
    var acc = 1;
    const p = new Array( bases.length ).fill( 0 );
    for ( var i = 0; i < bases.length; i++ ) {
        const place = placePermutation[i];
        p[place] = acc;
        acc = acc * bases[place];
    }
    return p;
}
