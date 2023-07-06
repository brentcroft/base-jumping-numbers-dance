
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


// a sequence of symbols
class Dial extends Array {

    constructor( label, symbols ) {
        super();
        this.label = label;
        this.push( ...symbols );
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
        super();
        this.push( ...dials );
    }

    push( ...items ) {
        const nonDials = items.filter( item => !( item instanceof Dial ) );
        if ( nonDials && nonDials.length > 0 ) {
            throw new Error( `Can only add items of type Dial: ${ nonDials.length } bad items.` );
        }
        super.push( ...items );
    }

    dials() {
        return [ ...this ];
    }

    volume() {
        return this.dials().map( d => d.length ).reduce( (a,c) => a * c, 1 );
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
        return this.dials().map( (d, i) => `${ d }` ).join( '\n' );
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
        super();
        this.push( ...coord );
    }
    coord() {
        return [ ...this ];
    }
}


// a sequence of Point
class AbstractBox extends Array {

    constructor( odometer ) {
        super();
        this.odometer = odometer;
    }

    buildPoints() {
        this.length = 0;
        const dials = this.odometer.dials();
        var coord = new Array( dials.length ).fill( 0 );
        this.push( new Point( coord ) );
        this.odometer.increment( coord );
        for ( var i = 0; i < (this.volume - 1); i++ ) {
            this.push( new Point( coord ) );
            this.odometer.increment( coord );
        }
    }

    points() {
        return [ ...this ];
    }

    toString() {
        return this.points().map( (p, i) => `${ i }: ${ p }` ).join( '\n' );
    }
}

class FactorialBox extends AbstractBox {
    static ROTATION_KEYS = "αβγδεζηθικλμξνοπρςστυφχψω";
    static LABELS = [
        [ '🠇', '🠅'],
        [ 'α', 'β', 'γ' ],
        [ '♤', '♡', '♢', '♧' ]
    ];
    static LABEL_MAPS = [
        [],
        [
            [ [1,0], [1,1] ]
        ],
        [
            [ [1,0,0], [1,1,1] ],
            [ [1,1,0], [1,0,1] ],

            [ [1,1,3], [1,0,2] ],
            [ [1,1,2], [1,0,3] ],

            [ [1,2,1], [1,2,0] ],
            [ [1,2,3], [1,2,2] ]
        ]
    ];

    constructor( boxOdometer ) {
        super( new FactorialOdometer( boxOdometer.length ) );
        this.volume = this.odometer.volume();
        this.buildPoints( boxOdometer );
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
        const coord = point.coord();
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

    label( coord ) {
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
        const dialLengths = boxOdometer.dials().map( dial => dial.length );
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

            point.label = this.label( point.labelCoord ).join('');
        } );
        this.forEach( point => {
            if (!point.inverse) {
                const inverseBases = [...point.bases].reverse();
                point.inverse = this.find( p => arrayExactlyEquals( p.bases, inverseBases ) );
            }
        } );
    }

    toString() {
        return this.points().map( (p, i) => `${ i }: (${ p }) [${ p.bases }] [${ p.placeValues }] [${ p.index }]` ).join( '\n' );
    }
}


class Cycle extends Array {
}

class Cycles extends Array {

    constructor() {
        super( );
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
        this.sort( ( a, b ) => a[0] - b[0] );
    }

    permPairLabel() {
        return "&lt;"
            + this.permPair[0].join('.')
            + "|"
            + this.permPair[1].join('.')
            + "&gt;";
    }

    label() {
        return this.permPair[0].label + ":" + this.permPair[1].label;
    }

    perms() {
        return "["
            + this.permPair[0].perm.join(',')
            + "]:["
            + this.permPair[1].perm.join(',')
            + "]";
    }

    placeValuePair() {
        return "["
            + this.permPair[0].placeValues.join(',')
            + "]:["
            + this.permPair[1].placeValues.join(',')
            + "]";
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



// a sequence of Point
class Box extends AbstractBox {

    constructor( odometer ) {
        super( odometer );
        this.permBox = new FactorialBox( this.odometer );
        this.volume = this.odometer.volume();
        this.buildPoints();

        this.indexPoints();
        this.buildActions();
    }

    indexPoint( coord, placeValues ) {
        return coord.map( (c,i) => c * placeValues[i] ).reduce( (a,c) => a+c, 0 );
    }

    indexPoints() {
        this.forEach( point => {
            const indexes = [];
            this.permBox.forEach( perm => {
                const id = this.indexPoint( point.coord(), perm.placeValues );
                perm.index.push( id );
                indexes.push( id );
            } );
            point.indexes = indexes;
        } );
    }

    buildCycles( permPair ) {
        const leftIndex = [...permPair[0].index];
        const rightIndex = permPair[1].index;

        const cycles = new Cycles();
        cycles.permPair = permPair;

        for ( var i = 0; i < leftIndex.length; i++ ) {
            var startId = leftIndex[i];
            if (startId < 0) {
                continue;
            }

            const cycle = new Cycle();
            cycle.push( startId );
            leftIndex[i] = -1;

            var nextId = rightIndex[i];

            while ( !cycle.includes( nextId ) ) {
                cycle.push( nextId );
                const j = leftIndex.indexOf( nextId );
                if (j < 0) {
                    continue;
                }
                leftIndex[j] = -1;
                nextId = rightIndex[j];
            }
            cycles.push( cycle );
        };
        cycles.canonicalize();
        return cycles;
    }

    inverseCycles( inverseCycles ) {
        const cycles = new Cycles();
        cycles.permPair = [ inverseCycles.permPair[1], inverseCycles.permPair[0] ];
        inverseCycles.forEach( cycle => {
            cycles.push( [...cycle].reverse() );
        } );
        cycles.canonicalize();
        return cycles;
    }

    buildActions() {
        this.actions = [];
//        this
//            .permBox
//            .points()
//            .map( p => [ p, p ] )
//            .forEach( identity => {
//                const cycles = this.buildCycles( identity );
//                this.actions.push( cycles );
//            } );
        pairs( this.permBox.points() )
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
            this.permBox.points()
                .forEach( permPoint => {
                    const roundTrip = point.coord();
                    this.permBox.permute( roundTrip, permPoint );
                    this.permBox.depermute( roundTrip, permPoint );
                    if ( !arrayExactlyEquals( point.coord(), roundTrip ) ) {
                        throw ( `Failed round trip: ${ point.coord() } !=  ${ roundTrip }` );
                    }
                } )
        } );
    }
}
