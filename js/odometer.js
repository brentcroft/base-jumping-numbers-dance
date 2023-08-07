function arrowUp( parity ) {
    return parity ? '🠅' : '🠇';
}
const arrayExactlyEquals = (a, b) => a.length == b.length && a.filter( (x,i) => x == b[i] ).length == a.length;
const arrayIntersection = (a,b) => a.filter(v => b.includes(v));
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

const addition          = ( p1, p2 ) => p2.map( (p,i) => p + p1[i] );
const subtraction       = ( p1, p2 ) => p1.map( (p,i) => p - p2[i] );
const displacement      = ( p1, p2 ) => p2.map( (p,i) => p - p1[i] );
const euclideanDistance2 = ( p ) => p.map( d => d**2 ).reduce( (a,v) => a + v, 0 )
const distance2          = ( p1, p2 ) => euclideanDistance2( displacement( p1, p2 ) );
const scale             = ( p, s ) => p.map( x => x * s );
const dotProduct        = ( p1, p2 ) => p2.map( (x,i) => x * p1[i] ).reduce( (a,c) => a + c, 0 );
const crossProduct      = ( p1, p2 ) => [
      p1[1] * p2[2] - p1[2] * p2[1],
      p1[2] * p2[0] - p1[0] * p2[2],
      p1[0] * p2[1] - p1[1] * p2[0]
];
const gcda = (a) => {
    let result = a[0];
    for (let i = 1; i < a.length; i++) {
        result = gcd(a[i], result);
        if(result == 1) {
            return 1;
        }
    }
    return result;
};
const lcma = (a) => {
    let result = a[0];
    for (let i = 1; i < a.length; i++) {
        result = lcm(a[i], result);
        if(result == 0) {
            return 0;
        }
    }
    return result;
};
const normalize = (d) => {
    const ed = Math.sqrt( euclideanDistance2( d ) );
    return d.map( x => x / ed );
};
const unitDisplacement  = ( p1, p2 ) => normalize( displacement( p1, p2 ) );
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

function cycles( source ) {
    const ri = [...source.index];
    const cycles = new Cycles();
    cycles.key = source.key;
    cycles.permPair = source.sources;
    cycles.box = source.box;
    cycles.parity = source.parity;
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
    return cycles( {
        'index': index,
        'key': key,
        'sources': [ source ],
        'box': source.box,
        'parity': !source.parity
    } );
}

function parity( p0, p1 ) {
    return (p0 && p1) || (!p0 && !p1);
}

function compose( leftSource, rightSource, twist = false, box ) {
    const ri = rightSource.index;
    const li = leftSource.index;
    const index = new Array( ri.length );
    for ( var i = 0; i < ri.length; i++ ) {
        var nextId = twist ? ri.indexOf(i) : ri[i];
        index[i] = li[nextId];
    }
    return cycles( {
        'index': index,
        'key': `${ maybeBracket( leftSource.key ) }${ twist ? ':' : '*' }${ maybeBracket( rightSource.key ) }`,
        'sources': [ leftSource, rightSource, twist ],
        'box': box,
        'parity': twist
            ? parity(leftSource.parity, !rightSource.parity)
            : parity(leftSource.parity, rightSource.parity)
    } );
}
function product( leftSource, rightSource, twist = false, box ) {
    const ri = rightSource.index;
    const li = leftSource.index;
    const index = [];
    for ( var i = 0; i < ri.length; i++ ) {
        const nextOffset = twist
            ? ri.indexOf(i) * li.length
            : ri[i] * li.length;
        const x = li.map( j => j + nextOffset );
        index.push( ...x );
    };
    return cycles( {
        'index': index ,
        'key': `${ maybeBracket( leftSource.key ) }${ twist ? '~' : '|' }${ maybeBracket( rightSource.key ) }`,
        'sources': [ leftSource, rightSource, twist ],
        'box': box,
        'parity': twist
            ? parity(leftSource.parity, !rightSource.parity)
            : parity(leftSource.parity, rightSource.parity)
    } );
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
        [ 'α', 'γ', 'β' ],
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

            point.parity = -1 * point[0];
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
        if ( Object.hasOwn( this, '$stats' ) ) {
            return this.$stats;
        }
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
            .map( (index,i) => distance2( points[index], points[ this[ ( i + 1 ) % order ] ] ) )
            .reduce( (a,c) => a + c, 0 );

        const idSum = this.reduce( (a,index) => a + index, 0 );

        this.$stats = {
            order: order,
            centre: centre,
            idSum: idSum,
            coordSum: coordSum,
            gcd: coordSum.reduce( gcd ),
            lcm: coordSum.reduce( lcm ),
            indexPerimeter: indexPerimeter,
            euclideanPerimeter: euclideanPerimeter
        };
        return this.$stats;
    }

    equations( cycles ) {
        const equations  = [];
        const bases = [...cycles.box.odometer.bases];
        const order = cycles.order();

        bases.forEach( (base, bI) => {

            const baseIndex = bI;//(bases.length -1 - bI);

            const C = cycles.C()[baseIndex];

            // the coefficients formed by picking a place from each underlying point
            const cycleCoefficients = this.map( id => cycles.box[ id ][baseIndex] );
            if (cycleCoefficients) {

                const localParity = (baseIndex % 2) == 0;

                const rightToLeft = (cycles.parity && !localParity) || (!cycles.parity && localParity);

                if (rightToLeft) {
                    cycleCoefficients.reverse();
                }

                const coefficients = [];
                const repeats = order / this.length;
                for (var i = 0; i < repeats; i++) {
                    coefficients.push(...cycleCoefficients);
                }
                var acc = 0;
                var placeValue = 1;

                coefficients.forEach( (coefficient, place) => {
                    acc = acc + (coefficient * placeValue);
                    placeValue = placeValue * base;
                } );

                const reverseCoefficients = true;
                if (reverseCoefficients) {
                    coefficients.reverse();
                }

                const factor = this[ cycles.parity ? 0 : this.length - 1 ];
                var error = ( acc / factor / C );
                if (error == 1) {
                    error = null;
                }

                equations.push( { 'acc': acc, 'base': base, 'coeffs': coefficients, 'factor': factor, 'C': C, 'error': error } );
            } else {
                console.log( `No cycle coordinates: ${ this }` );
            }
        } );

        return equations;
    }
    htmlEquations( cycles ) {
        return reify( "span", { 'class': 'equation' }, this.equations( cycles )
            .flatMap( ( {'acc': acc, 'base': base, 'coeffs': coeffs, 'factor': factor, 'C': C, 'error': error } ) => [
                ...coeffs.flatMap( (c,i) => [
                    reify( "b", {}, [ reifyText( `${ c }` ) ] ),
                ] ),
                reify( "sub", {}, [ reifyText( `${ base }` ) ] ),
                reify( "b", {}, [ reifyText( ` = ${ acc } ` ) ] ),
                reify( "i", {}, [
                    error
                        ? reify( "span", { 'class': 'error' }, [ reifyText( ` (${ factor } x ${ C.toFixed(2) } x ${ error.toFixed(2) })` ) ] )
                        : reifyText( ` (${ factor } x ${ C })` ),
                ] ),
                reify( "br" )
            ] ) );
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

    C() {
        if (!Object.hasOwn( this, '$C')) {
            const C = [];
            const order = this.order();
            const terminalCoords = this.getTerminal();
            const bases = this.box.odometer.bases;
            bases.forEach( (base, bI) => {

                const baseIndex = bI; //(bases.length -1 - bI);
                const terminalCoord = terminalCoords[baseIndex];
                const coeffs = [];
                for (var i = 0; i < order; i++) {
                    coeffs.push( terminalCoord );
                }
                var acc1 = 0;
                var basePower1 = 1;
                coeffs.forEach( (coeff, place) => {
                    acc1 = acc1 + (coeff * basePower1);
                    basePower1 = basePower1 * base;
                } );
                const factor = this.box.length - 1;
                C.push( acc1 / factor );
            } );
            this.$C = C;
        }
        return this.$C;
    }

    order() {
        if (!Object.hasOwn(this,'$order')) {
            this.$order = lcma( this.map( a => a.length ).filter( a => a > 1 ) );
        }
        return this.$order;
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
            return this.permPair
                .filter( p => Array.isArray(p) )
                .map( p => `[${ p.perm }]`).join(',');
        } catch ( e ) {
            return null;
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
    getRank() {
        return this.box.odometer.length;
    }
    getBases() {
        return this.box.odometer.bases;
    }
    getVolume() {
        return this.box.length;
    }
    getOrigin() {
        return this.box[0];
    }
    getTerminal() {
        return this.box[this.box.length - 1];
    }
    getDiagonal() {
        return [ this.getOrigin(), this.getTerminal() ];
    }
    getCentre() {
        return this.getTerminal().map( c => c/2 );
    }

    getStats() {
        if( Object.hasOwn( this, '$stats' ) ) {
            return this.$stats;
        }
        this.$stats = this
            .map( cycle => {
                const stats = cycle.getStats(this.box);
                return stats;
            } )
            .filter( stats => stats != null )
            .reduce( (a,c) => {
                a.idSum += c.idSum;
                a.coordSum = addition( a.coordSum, c.coordSum );
                a.indexPerimeter += c.indexPerimeter;
                a.euclideanPerimeter += c.euclideanPerimeter;
                return a;
            },
            {
                idSum: 0,
                coordSum: new Array(this.getRank()).fill(0),
                indexPerimeter: 0,
                euclideanPerimeter: 0
            } );
        return this.$stats;
    }

    getCentres() {
        if ( Object.hasOwn( this, '$centres' ) ) {
            return this.$centres;
        }

        const allowance = 0.00000000001;
        const boxCentre = this.getCentre();

        var centreLines = [
            { "points": this.getDiagonal(), "unit": unitDisplacement( ...this.getDiagonal() ), "pd": 0 }
        ];
        var centrePoints = [
            { "point": [0,0,0], "lineRef": 0, "hyp2": 0 }
        ];

        function assignCentreRef( cycleStats ) {
            const centreDist = distance2( centrePoints[0].point, cycleStats.centre );
            if ( centreDist < allowance ) {
                cycleStats.centreRef = 0;
                return;
            }
            for ( var i = 1; i < centrePoints.length; i++) {
                const d = distance2( centrePoints[i].point, cycleStats.centre );
                if ( d < allowance ) {
                    cycleStats.centreRef = i;
                    return;
                }
            }

            // new centre
            function getCentreLineRef( centre ) {
                var cpd = perpendicularDistance( centre, centreLines[0].points, centreLines[0].unit );
                if ( cpd < allowance ) {
                    return 0;
                }

                const unit = displacement( centre, centre );
                const scaledUnit = scale( unitDisplacement( centre, boxCentre ), 1 );

                for ( var i = 1; i < centreLines.length; i++) {
                    const pd = perpendicularDistance( centre, centreLines[i].points, centreLines[i].unit );
                    if ( pd < allowance ) {
                        if ( cpd > centreLines[i].pd ) {
                            centreLines[i].points = [
                                subtraction( subtraction( boxCentre, unit ), scaledUnit),
                                addition( addition( boxCentre, unit ), scaledUnit)
                            ];
                        }
                        return i;
                    }
                }

                const points = [
                    subtraction( subtraction( boxCentre, unit ), scaledUnit),
                    addition( addition( boxCentre, unit ), scaledUnit)
                ];

                centreLines.push( { "points": points, "unit": unitDisplacement( centre, boxCentre ), "pd": cpd }  );
                return centreLines.length - 1;
            }

            centrePoints.push( {
                "point": cycleStats.centre,
                "lineRef": getCentreLineRef( cycleStats.centre ),
                "hyp2": centreDist
            } );

            cycleStats.centreRef = centrePoints.length - 1;
        }

        this
            .filter( cycle => cycle.length > 1 )
            .forEach( cycle => assignCentreRef( cycle.getStats(this.box) ) );

        this.$centres = {
            centreLines: centreLines,
            centrePoints: centrePoints
        };

        return this.$centres;
    }

    getIdentityPlane() {
        const { centreLines, centrePoints } = this.getCentres();

        if ( centreLines.length > 1 ) {

            const diagonal = centreLines[0].points;
            const otherLine = centreLines[ centreLines.length - 1 ].points;

            // establish identity plane
            const identityPlane = otherLine.map( ( coord, i ) => subtraction( coord, diagonal[i] ) );
            const identityPlaneGcd = Math.abs( gcda( identityPlane ) );
            const identityPlaneNormal = displacement( this.getOrigin(), identityPlane );

            this.identityPlane = {
                coord: identityPlane,
                gcd: identityPlaneGcd,
                normal: identityPlaneNormal
            };
            return this.identityPlane;

        } else {
            const bases = this.getBases();

            const placesReverse = this.permPair[0].placeValues;

//            const placesReverse = placeValuesReverseArray( bases );
            const placesForward = [...placesReverse].map( i => -1 * i );

            // establish identity plane
            const identityPlane = placesForward.map( ( x, i ) => x - placesReverse[i] );
            const identityPlaneGcd = Math.abs( gcda( identityPlane ) );
            const identityPlaneNormal = displacement( this.getOrigin(), identityPlane );

            this.identityPlane = {
                coord: identityPlane,
                gcd: identityPlaneGcd,
                normal: identityPlaneNormal
            };
            return this.identityPlane;
        }
    }
}

class Box extends AbstractBox {

    static boxes = {};

    static list() {
        const values = Object.values( Box.boxes );
        const boxComparator = ( b0, b1 ) => {
            if ( b0.odometer.bases.length == b1.odometer.bases.length ) {
                return arrayCompare( b0.odometer.bases, b1.odometer.bases );
            } else {
                return b0.odometer.bases.length - b1.odometer.bases.length;
            }
        };
        values.sort( boxComparator );
        return values;
    }

    static clear() {
        Object.keys( Box.boxes ).forEach( key => {
            delete Box.boxes[ key ];
        } );
    }

    static identifySources( source ) {
        return source.box.actions()
            .filter( action => action != source )
            .filter( action => arrayExactlyEquals( source.index, action.index ) );
    }

    static of( bases ) {
        const canonicalBases = [...bases].filter( b => b != 1 );
        canonicalBases.sort( (a,b) => b - a );

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
            this.actionsCache = [];
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
            const inversePerm = inverse( perm );
            const candidate = this.permBox.find( p => arrayExactlyEquals( p.index, inversePerm.index ) );
            perm.inverse = candidate;
        } );
    }

    actions() {
        if ( this.actionsCache.length == 0 ) {
            this.actionsCache = this.permBox.flatMap( pr => this.permBox
                .filter( pl => pl != pr )
                .map( pl => {
                    const c = compose( pl, pr, true, this );
                    c.parity = arrayCompare( pl.perm, pr.perm ) > 0;
                    return c;
                } ) );


            // assign inverses
            const inverseOf = ( idx ) => {
                const index = new Array( idx.length );
                for ( var i = 0; i < idx.length; i++ ) {
                    index[i] = idx.indexOf(i);
                }
                return index;
            };

            this.actionsCache.forEach( a0 => {
                if (!Object.hasOwn( a0, 'inverse' )) {
                    const dix = inverseOf( a0.index );
                    const a1 = this.actionsCache
                        .filter( a => !Object.hasOwn( a, 'inverse' ) )
                        .find( a => arrayExactlyEquals( a.index, dix ) );
                    if (a1) {
                        a0.inverse = a1;
                        a1.inverse = a0;
                    } else {
//                        a0.inverse = null;
//                        throw new Error(`Inverse not found: ${a0.label()}`);
                    }
                }
            } );

        }
        return this.actionsCache;
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