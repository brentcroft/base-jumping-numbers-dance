
const arrayExactlyEquals = (a, b) => a.length == b.length && a.filter( (x,i) => x == b[i] ).length == a.length;
const arrayOfIndexes = ( n ) => new Array( n ).fill( 0 ).map( (x,i) => i );
const arrayCompare = (a, b) => {
    for ( i = b.length - 1; i >= 0; i-- ) {
        if ( a[i] < b[i] ) {
            return -1;
        } else if ( a[i] > b[i] ) {
            return 1;
        }
    }
    return 0;
};
const arrayReverseCompare = (a, b) => {
    for ( i = 0; i < b.length - 1; i++ ) {
        if ( a[i] < b[i] ) {
            return -1;
        } else if ( a[i] > b[i] ) {
            return 1;
        }
    }
    return 0;
};

function rotateArray( array, times = 1 ) {
    if ( times < 0 ) {
        return rotateReverseArray( array, -1 * times );
    }
    for ( var i = 0; i < times; i++ ) {
        array.push( array.shift() );
    }
    return array;
}

function rotateReverseArray( array, times = 1 ) {
    if ( times < 0 ) {
        return rotateArray( array, -1 * times );
    }
    for ( var i = 0; i < times; i++ ) {
        array.unshift( array.pop() );
    }
    return array;
}

function pairs2( list ) {
    if (list.length < 2) {
        return [];
    }
    const first = list[0];
    const rest = list.slice(1);
    const p = rest.map( x => [ first, x ] ).concat( pairs( rest ) );
    return p;
}

function pairs( list, includeIdentities = true ) {
    const p = [];
    if ( includeIdentities ) {
        list.forEach( l1 => p.push( [ l1, l1 ] ) );
    }
    list.forEach( l1 => list.forEach( l2 => l1===l2 ? 0 : p.push( [ l1, l2 ] ) ) );
    return p;
}

const factorial = n => !(n > 1) ? 1 : factorial(n - 1) * n;
const gcd = (a, b) => a ? gcd( b % a, a) : b;
const lcm = (a, b) => a && b ? a * b / gcd(a, b) : 0;

const PI = 3.1415926;
const TWO_PI = 2 * PI;

const displacement      = ( p1, p2 ) => p2.map( (p,i) => p - p1[i] );
const euclideanDistance2 = ( p ) => p.map( d => d**2 ).reduce( (a,v) => a + v, 0 )
const distance2          = ( p1, p2 ) => euclideanDistance2( displacement( p1, p2 ) );
const scale             = ( p, s ) => p.map( x => x * s );

function cycles( source ) {
    const ri = [...source.index];
    const cycles = new Cycles();
    cycles.key = source.key;
    for ( var i = 0; i < ri.length; i++ ) {
        const startId = i;
        var nextId = ri[startId];
        if (nextId < 0) {
            continue;
        }
        const cycle = new Cycle();
        cycle.push( startId );
        ri[startId] = -1;
        while ( nextId != startId ) {
            cycle.push( nextId );
            const lastId = nextId;
            nextId = ri[ lastId ];
            if (nextId < 0) {
                throw new Error( `Index does not contain next id: ${ lastId }` );
            } else {
                ri[lastId] = -1;
            }
        }
        cycle.stats = {};
        cycles.push( cycle );
    };
    cycles.index = [...source.index];
    cycles.canonicalize();
    return cycles;
}

const maybeBracket = ( t ) => Array.isArray(t) && t.length > 3 ? `(${ t })` : t;

function inverse( source ) {
    const key = `${ source.key }^-1`;
    const idx = source.index;
    const index = new Array( idx.length );
    for ( var i = 0; i < idx.length; i++ ) {
        index[i] = idx.indexOf(i);
    }
    return cycles( { 'index': index , 'key': key} );
}
function compose( leftSource, rightSource, twist = false ) {
    const key = `${ maybeBracket( leftSource.key ) }${ twist ? ':' : '*' }${ maybeBracket( rightSource.key ) }`;
    const ri = [...rightSource.index];
    const li = leftSource.index;
    const index = new Array( ri.length );
    for ( var i = 0; i < ri.length; i++ ) {
        var nextId = ri[i];
        index[i] = twist ? li.indexOf(nextId) : li[nextId];
    }
    return cycles( { 'index': index , 'key': key} );
}
function product( leftSource, rightSource, twist = false ) {
    const key = `${ maybeBracket( leftSource.key ) }|${ maybeBracket( rightSource.key ) }`;
    const ri = rightSource.index;
    const li = leftSource.index;
    const index = [];
    for ( var i = 0; i < ri.length; i++ ) {
        const offset = twist
            ? ri[i] * li.length
            : ri.indexOf(i) * li.length;
        const x = li.map( j => j + offset );
        index.push( ...x );
    };
    return cycles( { 'index': index , 'key': key} );
}
/**


*/
class Dial extends Array {

    constructor( label, symbols ) {
        super( arguments.length > 0 &&  Number.isInteger( arguments[0] ) ? arguments[0] : 0 );
        if ( Array.isArray(symbols) ) {
            this.label = label;
            this.push( ...symbols );
        }
    }

    symbols() {
         return [ ...this ];
     }

    toString() {
        return `${ this.label }:(${ this.join( ',' ) })`;
    }
}

// a sequence of Dial
class Odometer extends Array {

    constructor( dials ) {
        super( arguments.length > 0 &&  Number.isInteger( arguments[0] ) ? arguments[0] : 0 );
        if ( Array.isArray(dials) ) {
            this.push( ...dials );
            this.bases = dials.map( dial => dial.length );
        }
    }

    push( ...items ) {
        const nonDials = items.filter( item => !( item instanceof Dial ) );
        if ( nonDials && nonDials.length > 0 ) {
            throw new Error( `Can only add items of type Dial: ${ nonDials.length } bad items.` );
        }
        super.push( ...items );
    }

    volume() {
        return this.map( d => d.length ).reduce( (a,c) => a * c, 1 );
    }

    incrementLeftToRight( coord ) {
        for ( var i = 0; i < coord.length; i++ ) {
            const dial = this[i];
            if (coord[i] < (dial.length - 1) ) {
                coord[i]++;
                return;
            } else {
                coord[i] = 0;
            }
        }
    }

    incrementRightToLeft( coord ) {
        for ( var i = coord.length - 1; i >= 0; i-- ) {
            const dial = this[i];
            if (coord[i] < (dial.length - 1) ) {
                coord[i]++;
                return;
            } else {
                coord[i] = 0;
            }
        }
    }

    increment( coord ) {
        this.incrementLeftToRight( coord );
    }
}

// each setting represents an index construction
// on a box with n dimensions
class FactorialOdometer extends Odometer {
    static FACTORIAL_DIALS = n => {
        const dials = [];
        for ( var i = 2; i <= n; i++ ) {
            dials.push( new Dial( 'a', arrayOfIndexes( i ) ) );
        }
        return dials;
    };

    constructor( n ) {
        super( FactorialOdometer.FACTORIAL_DIALS( n ) );
    }
}

class Point extends Array {
    constructor( coord ) {
        super( arguments.length > 0 &&  Number.isInteger( arguments[0] ) ? arguments[0] : 0 );
        if ( Array.isArray(coord) ) {
            this.push( ...coord );
        }
    }

    label() {
        return this.key;
    }
}

class AbstractBox extends Array {

    constructor( odometer ) {
        super( arguments.length > 0 &&  Number.isInteger( arguments[0] ) ? arguments[0] : 0 );
        if ( Array.isArray(odometer) ) {
            this.odometer = odometer;
        }
    }

    buildPoints() {
        this.length = 0;
        const dials = this.odometer;
        var coord = new Array( dials.length ).fill( 0 );
        this.push( new Point( coord ) );
        this.odometer.increment( coord );
        for ( var i = 0; i < (this.volume - 1); i++ ) {
            this.push( new Point( coord ) );
            this.odometer.increment( coord );
        }
    }
}

class FactorialBox extends AbstractBox {
    //static ROTATION_KEYS = "αβγδεζηθικλμξνοπρςστυφχψω";
    static LABELS = [
        [ '🠇', '🠅'],
        [ 'α', 'β', 'γ' ],
        [ '♤', '♡', '♢', '♧' ],
        [ '1', '2', '3', '4', '5' ],
        [ 'A', 'B', 'C', 'D', 'E', 'F' ],
    ];
    // TODO: understand mapping from factorial coords to label scheme
    static LABEL_MAPS = [
        // 2D
        [],
        // 3D
        [
            [ [1,0], [1,1] ]
        ],
        // 4D
        [
            [ [1,0,0], [1,1,1] ],
            [ [1,1,0], [1,0,1] ],

            [ [1,1,3], [1,0,2] ],
            [ [1,1,2], [1,0,3] ],

            [ [1,2,1], [1,2,0] ],
            [ [1,2,3], [1,2,2] ]
        ],
        // 5D
        [],
        // 6D
        []
    ];

    constructor( boxOdometer ) {
        super( arguments.length > 0 &&  Number.isInteger( arguments[0] )
            ? arguments[0]
            : new FactorialOdometer( boxOdometer.length ) );
        if ( Array.isArray(boxOdometer) ) {
            this.volume = this.odometer.volume();
            this.buildPoints( boxOdometer );
        }
    }

    permute( list, perm ) {
        for ( var i = 0; i < perm.length; i++ ) {
            if (perm[i] > 0) {
                const b = list.slice( 0, i + 2 );
                rotateReverseArray( b, perm[i] );
                list.splice( 0, b.length, ...b );
            }
        }
    }

    unpermute( list, perm ) {
        for ( var i = perm.length - 1; i >= 0; i-- ) {
            if (perm[i] > 0) {
                const b = list.slice( 0, i + 2 );
                rotateArray( b, perm[i] );
                list.splice( 0, b.length, ...b );
            }
        }
    }

    calculateLabelCoord( point ) {
        const coord = point;
        var labelCoord = [...coord];
        const labelMap = FactorialBox.LABEL_MAPS[ coord.length - 1 ]
        if (labelMap) {
            labelMap.forEach( m => {
                if ( arrayExactlyEquals( coord, m[0] ) ) {
                    labelCoord = m[1];
                } else if ( arrayExactlyEquals( coord, m[1] ) ) {
                    labelCoord = m[0];
                }
            } );
        }
        point.labelCoord = labelCoord;
    }

    makeLabel( coord ) {
        const label = [];
        if ( coord.length == 0 ) {
            label.push( '#' )
        } else {
            for ( var i = 0; i < coord.length; i++ ) {
                const p = coord[i];
                const labels = FactorialBox.LABELS[i];
                label.push( labels[p] );
            }
        }
        // label goes in reverse to factorial coord
        return label.reverse();
    }

    placeValues( bases ) {
        var acc = 1;
        const p = new Array( bases.length ).fill( 0 );
        for ( var i = 0; i < bases.length; i++ ) {
            p[i] = acc;
            acc = acc * bases[i];
        }
        return p;
    }

    buildPoints( boxOdometer ) {
        super.buildPoints();
        const width = boxOdometer.length;
        const dialLengths = boxOdometer.map( dial => dial.length );
        this.forEach( point => {

            const perm = arrayOfIndexes( width );
            this.permute( perm, point );
            point.perm = perm;

            const antiPerm = arrayOfIndexes( width );
            this.unpermute( antiPerm, point );
            point.antiPerm = antiPerm;

            const bases = [...dialLengths];
            this.permute( bases, point );
            point.bases = bases;

            const placeValues = this.placeValues( bases );
            this.unpermute( placeValues, point );
            point.placeValues = placeValues;

            point.index = [];

            this.calculateLabelCoord( point );

            point.key = this.makeLabel( point.labelCoord ).join('');
        } );
        this.forEach( point => {
            if (!point.inverse) {
                const inverseBases = [...point.bases].reverse();
                point.inverse = this.find( p => arrayExactlyEquals( p.bases, inverseBases ) );
            }
        } );
    }
}


class Cycle extends Array {

    constructor() {
        super( arguments.length > 0 && Number.isInteger( arguments[0] ) ? arguments[0] : 0 );
    }

    indexOfCoord( coord ) {
        for ( var i = 0; i < this.length; i++ ) {
            if ( arrayExactlyEquals( this[i], coord ) ) {
                return i;
            }
        }
        return -1;
    }

    previous( i ) {
        return this[ ( i + this.length - 1 ) % this.length ];
    }

    next( i ) {
        return this[ ( i + 1 ) % this.length ];
    }

    getStats( points ) {
        const rank = points[0].length;

        const order = this.length;
        const centre = new Array( rank ).fill( 0 );
        const coordSum = new Array( rank ).fill( 0 );

        this
            .map( index => points[index] )
            .forEach( coord => coord.forEach( (c,i) => coordSum[i] += c ) );

        centre
            .forEach( ( s, i ) => {
                centre[i] = s / order;
            } );

        const indexPerimeter = this
            .map( (index,i) => this[ ( i + 1 ) % order ] - index )
            .map( jump => Math.abs( jump ) )
            .reduce( (a,c) => a + c, 0 );

        const euclideanPerimeter = this
            .map( (index,i) => distance2( points[index], points[ ( i + 1 ) % order ] ) )
            .reduce( (a,c) => a + c, 0 );

        const idSum = this.reduce( (a,index) => a + index, 0 );

        return {
            order: order,
            centre: centre,
            idSum: idSum,
            coordSum: coordSum,
            gcd: coordSum.reduce( gcd ),
            lcm: coordSum.reduce( lcm ),
            indexPerimeter: indexPerimeter,
            euclideanPerimeter: euclideanPerimeter
        }
    }
}

class Cycles extends Array {

    constructor() {
        super( arguments.length > 0 && Number.isInteger( arguments[0] ) ? arguments[0] : 0 );
        this.key = "";
    }

    canonicalize() {
        function ios( cycle ) {
            var l = 0;
            for (var i = 1; i < cycle.length; i++) {
                if ( cycle[ i ] < cycle[ l ] ) {
                    l = i;
                }
            }
            return l;
        }
        this.forEach( cycle => rotateArray( cycle, ios( cycle ) ) );
        const comparator = (a,b) => a.length == b.length ? a[0] - b[0] : a.length - b.length;
        this.sort( comparator );
    }

    identities() {
        return this.filter( cycle => cycle.length == 1);
    }

    orbits() {
        return this.filter( cycle => cycle.length != 1);
    }

    permPairLabel() {
        return "&lt;"
            + this.permPair[0].join('.')
            + "|"
            + this.permPair[1].join('.')
            + "&gt;";
    }

    label() {
        return this.key;
    }

    perms() {
        try {
            return "["
                + this.permPair[0].perm.join(',')
                + "]:["
                + this.permPair[1].perm.join(',')
                + "]";
        } catch ( e ) {
            return "";
        }
    }

    placeValuePair() {
        try {
            return "["
                + this.permPair[0].placeValues.join(',')
                + "]:["
                + this.permPair[1].placeValues.join(',')
                + "]";
        } catch ( e ) {
            return "";
        }
    }

    monomial() {
        const monomial  = {};
        this.forEach( cycle => monomial[cycle.length] = ( cycle.length in monomial )
            ? monomial[cycle.length] + 1
            : 1 );
        Object.entries( monomial ).sort( (a, b) => a < b );
        return monomial;
    }

    htmlMonomial() {
        return reify( "span", { 'class': 'monomial' }, Object
            .entries( this.monomial() )
            .flatMap( ( [ k, e ] ) => [
                reify( "i", {}, [ reifyText( k == 1 ? "(e" : "a" )  ] ),
                reify( "sup", {}, [ reifyText( `${ e }` ) ] ),
                k == 1
                    ? reifyText( ")" )
                    : reify( "sub", { 'style': 'position: relative; left: -.5em;'}, [ reifyText( `${ k }` ) ] )
            ] ) );
    }
}

class Box extends AbstractBox {

    static boxes = {};

    static list() {
        return Object.values( Box.boxes );
    }

    static of( bases ) {
        const canonicalBases = [...bases].sort();
        const key = canonicalBases.join( '.' );
        if (!( key in Box.boxes )) {
            const box = new Box( new Odometer( canonicalBases.map( (b,i) => new Dial( `${i}`, arrayOfIndexes( b ) ) ) ) );
            Box.boxes[key] = box;
        }
        return Box.boxes[key];
    }

    constructor( odometer ) {
        super( arguments.length > 0 && Number.isInteger( arguments[0] ) ? arguments[0] : odometer );
        if ( Array.isArray(odometer) ) {
            this.permBox = new FactorialBox( this.odometer );
            this.volume = this.odometer.volume();
            this.buildPoints();
            this.indexPoints();
        }
    }

    indexPoint( coord, placeValues ) {
        return coord.map( (c,i) => c * placeValues[i] ).reduce( (a,c) => a + c, 0 );
    }

    indexPoints() {
        this.forEach( point => {
            this.permBox.forEach( perm => {
                const id = this.indexPoint( point, perm.placeValues );
                perm.index.push( id );
            } );
        } );
        this.permBox.forEach( perm => {
            perm.cycles = cycles( perm );
        } );
    }

    actions() {
        return this.permBox.flatMap( pl => this.permBox.map( pr => compose( pl, pr, true ) ) );
    }

    testPermBox() {
        this.forEach( point => {
            this.permBox
                .forEach( permPoint => {
                    const roundTrip = [...point];
                    this.permBox.permute( roundTrip, permPoint );
                    this.permBox.unpermute( roundTrip, permPoint );
                    if ( !arrayExactlyEquals( point, roundTrip ) ) {
                        throw ( `Failed round trip: ${ point } !=  ${ roundTrip }` );
                    }
                } );
        } );
    }
}



//Box.of( [2, 3, 5, 7 ] ).testPermBox();