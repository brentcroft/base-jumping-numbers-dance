
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

function pairs( list ) {
    if (list.length < 2) {
        return [];
    }
    const first = list[0];
    const rest = list.slice(1);
    const p = rest.map( x => [ first, x ] ).concat( pairs( rest ) );
    return p;
}

var factorial = n => !(n > 1) ? 1 : factorial(n - 1) * n;
var gcd = (a, b) => a ? gcd( b % a, a) : b;
var lcm = (a, b) => a && b ? a * b / gcd(a, b) : 0;

const displacement      = ( p1, p2 ) => p2.map( (p,i) => p - p1[i] );
const euclideanDistance2 = ( p ) => p.map( d => d**2 ).reduce( (a,v) => a + v, 0 )
const distance2          = ( p1, p2 ) => euclideanDistance2( displacement( p1, p2 ) );

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

const maybeBracket = ( t ) => t.length > 3 ? `(${ t })` : t;

function compose( leftCycles, rightCycles ) {
    const ri = [...rightCycles.index];
    const li = leftCycles.index;

    const cycles = new Cycles();
    cycles.key = `${ maybeBracket( leftCycles.label() ) }*${ maybeBracket( rightCycles.label() ) }`;

    const index = new Array( ri.length );

    for ( var i = 0; i < ri.length; i++ ) {

        const startId = i;
        var nextId = ri[startId];
        if (nextId < 0) {
            continue;
        } else {
            ri[startId] = -1;
        }

        const cycle = new Cycle();
        cycle.push( startId );

        // apply left cycles
        nextId = li[nextId];
        index[startId] = nextId;

        while ( nextId != startId ) {
            cycle.push( nextId );
            const lastId = nextId;
            nextId = ri[ lastId ];
            if (nextId < 0) {
                throw new Error( `Right index does not contain next id: ${ lastId }` );
            } else {
                ri[lastId] = -1;
            }
            const endId = li[nextId];
            if (endId < 0) {
                throw new Error( `Left index does not contain next id: ${ nextId }` );
            }

            nextId = endId;
            index[lastId] = endId;
        }

        cycle.stats = {};
        cycles.push( cycle );
    };

    cycles.index = index;
    cycles.canonicalize();
    return cycles;
}


function twist( leftCycles, rightCycles ) {
    const leftIndex = [...leftCycles.index];
    const rightIndex = [...rightCycles.index];

    const cycles = new Cycles();
    const index = new Array( rightIndex.length );
    cycles.permPair = [
        {'index': leftCycles.index, 'label': maybeBracket( leftCycles.key ) },
        {'index': rightCycles.index, 'label': maybeBracket( rightCycles.key ) }
    ];
    cycles.key = `${ leftCycles.label() }:${ rightCycles.label() }`;

    for ( var i = 0; i < leftIndex.length; i++ ) {
        var startId = leftIndex[i];
        if (startId < 0) {
            continue;
        } else {
            leftIndex[i] = -1;
        }

        const cycle = new Cycle();
        cycle.push( startId );

        var nextId = rightIndex[i];
        index[startId] = nextId;

        while ( nextId != startId ) {
            cycle.push( nextId );
            const lastId = nextId;
            const j = leftIndex.indexOf( nextId );
            if (j < 0) {
                throw new Error( `Left index does not contain next id: ${ lastId }` );
            } else {
                leftIndex[j] = -1;
            }
            nextId = rightIndex[j];
            index[lastId] = nextId;
        }

        cycle.stats = {};
        cycles.push( cycle );
    };
    cycles.index = index;
    cycles.canonicalize();
    return cycles;
}



// a sequence of symbols
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

    toString() {
        return this.map( (d, i) => `${ d }` ).join( '\n' );
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


// a sequence of Point
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

    toString() {
        return this.map( (p, i) => `${ i }: ${ p }` ).join( '\n' );
    }
}

class FactorialBox extends AbstractBox {
    //static ROTATION_KEYS = "αβγδεζηθικλμξνοπρςστυφχψω";
    static LABELS = [
        [ '🠇', '🠅'],
        [ 'α', 'γ', 'β' ],
        [ '♤', '♡', '♢', '♧' ],
        [ '1', '2', '3', '4', '5' ],
        [ 'A', 'B', 'C', 'D', 'E', 'F' ],
     ];
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

    depermute( list, perm ) {
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
        labelMap.forEach( m => {
            if ( arrayExactlyEquals( coord, m[0] ) ) {
                labelCoord = m[1];
            } else if ( arrayExactlyEquals( coord, m[1] ) ) {
                labelCoord = m[0];
            }
        } );
        point.labelCoord = labelCoord;
    }

    makeLabel( coord ) {
        const label = [];
        for ( var i = 0; i < coord.length; i++ ) {
            const p = coord[i];
            const labels = FactorialBox.LABELS[i];
            label.push( labels[p] );
        }
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
            this.depermute( antiPerm, point );
            point.antiPerm = antiPerm;

            const bases = [...dialLengths];
            this.permute( bases, point );
            point.bases = bases;

            const placeValues = this.placeValues( bases );
            this.depermute( placeValues, point );
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

    toString() {
        return this.map( (p, i) => `${ i }: (${ p }) [${ p.bases }] [${ p.placeValues }] [${ p.index }]` ).join( '\n' );
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
            //cycle: this,
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

    cycleAndIndex( coord ) {
        for ( var i = 0; i < this.length; i++ ) {
            const cycle = this[i];
            const pointIndex = cycle.getPointIndex( coord );
            if ( pointIndex > -1 ) {
                return [ cycle, pointIndex ];
            }
        }
        throw new Error( `The supplied coord ${ coord } does not exist in any cycle.` );
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

    index() {
        const l = this.reduce( (a,c) => a + c.length, 0);
        const idx = new Array(l);
        this.forEach( cycle => cycle.forEach( (index, i) => {
            idx[index] = idx[ cycle[i + 1 % cycle.length ] ];
        } ) );
        this.idx = idx;
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

    compose( leftCycles ) {
        return compose( this, leftCycles );
    }

    twist( leftCycles ) {
        return twist( this, leftCycles );
    }
}



// a sequence of Point
class Box extends AbstractBox {

    constructor( odometer ) {
        super( arguments.length > 0 && Number.isInteger( arguments[0] ) ? arguments[0] : odometer );
        if ( Array.isArray(odometer) ) {
            this.permBox = new FactorialBox( this.odometer );
            this.volume = this.odometer.volume();
            this.buildPoints();

            this.indexPoints();
            //this.buildActions();
        }
    }

    indexPoint( coord, placeValues ) {
        return coord.map( (c,i) => c * placeValues[i] ).reduce( (a,c) => a + c, 0 );
    }

    indexPoints() {
        this.forEach( point => {
            const indexes = [];
            this.permBox.forEach( perm => {
                const id = this.indexPoint( point, perm.placeValues );
                perm.index.push( id );
                indexes.push( id );
            } );
            point.indexes = indexes;
        } );

        this.permBox.forEach( perm => {
            perm.cycles = cycles( perm );
        } );
    }

    buildCycles( permPair, op = ":" ) {
        const leftIndex = [...permPair[0].index];
        const rightIndex = permPair[1].index;

        const cycles = new Cycles();
        const index = new Array( this.length );
        cycles.permPair = permPair;
        cycles.key = permPair[0].label() + op + permPair[1].label();

        const points = this;

        for ( var i = 0; i < leftIndex.length; i++ ) {
            var startId = leftIndex[i];
            if (startId < 0) {
                continue;
            } else {
                leftIndex[i] = -1;
            }

            const cycle = new Cycle();
            cycle.push( startId );

            var nextId = rightIndex[i];
            index[startId] = nextId;

            while ( nextId != startId ) {
                cycle.push( nextId );
                const lastId = nextId;
                const j = leftIndex.indexOf( nextId );
//                const j = leftIndex[ nextId ];
                if (j < 0) {
                    continue;
                }
                leftIndex[j] = -1;
                nextId = rightIndex[j];
                index[lastId] = nextId;
            }

            cycle.stats = cycle.getStats( points );

            cycles.push( cycle );
        };
        cycles.index = index;
        cycles.box = this;
        cycles.canonicalize();
        return cycles;
    }

    inverseCycles( inverseCycles ) {
        const cycles = new Cycles();
        cycles.permPair = [ inverseCycles.permPair[1], inverseCycles.permPair[0] ];
        cycles.key = permPair[1].label() + op + permPair[0].label();
        inverseCycles.forEach( cycle => {
            cycles.push( [...cycle].reverse() );
        } );
        cycles.canonicalize();
        cycles.box = this;
        return cycles;
    }

    buildActions() {
        this.actions = [];
//        this
//            .permBox
//            .map( p => [ p, p ] )
//            .forEach( identity => {
//                const cycles = this.buildCycles( identity );
//                this.actions.push( cycles );
//            } );
        pairs( this.permBox )
            .forEach( permPair => {
                const cycles = this.buildCycles( permPair );
                this.actions.push( cycles );
                this.actions.push( this.inverseCycles( cycles ) );
            } );
    }


    toString() {
        return this.actions.map( (cycles, i) => `${ i }:(${ cycles.monomial() })` ).join( '\n\n' );
    }


    testPermBox() {
        this.forEach( point => {
            this.permBox
                .forEach( permPoint => {
                    const roundTrip = [...point];
                    this.permBox.permute( roundTrip, permPoint );
                    this.permBox.depermute( roundTrip, permPoint );
                    if ( !arrayExactlyEquals( point, roundTrip ) ) {
                        throw ( `Failed round trip: ${ point } !=  ${ roundTrip }` );
                    }
                } )
        } );
    }
}
