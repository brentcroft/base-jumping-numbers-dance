
var colourPointIndexDefault = {
    bases: [ 11, 5, 7 ],
    actionIndex: 5,
    orbitIndex: 5,
    minPixel: 20,
    maxPixel: 180,
    colorPoints: [[10,1,6],[10,1,0],[0,1,4,],[6,1,4],[6,2,5],[8,3,4],[7,1,3],[5,3,1],[2,3,4],[7,0,2],[3,2,2],[3,0,6],[9,3,3],[5,2,6],[10,2,1],[2,2,3],[5,4,2],[4,4,3],[6,3,0],[1,4,0],[1,0,2],[3,1,1],[1,4,6],[10,0,5],[8,0,1],[1,3,5],[8,4,5],[9,2,2],[4,1,0],[0,0,3],[4,0,5],[7,4,6]]
};

function colorForIndex( index ) {
    const colorPoints = colourPointIndexDefault.colorPoints;
    const colorPoint = colorPoints[ index % colorPoints.length ];
    const picker = (x,i) => colourPointIndexDefault.minPixel + Math.round(
        ( colourPointIndexDefault.maxPixel - colourPointIndexDefault.minPixel ) * x / colourPointIndexDefault.bases[i] );
    return colorPoint
        .map( (x,i) => picker( x, i) )
        .map( x => x.toString( 16 ).padStart( 2, '0' ) )
        .reduce( (a,c) => a + c, "#" );
}


// https://codegolf.stackexchange.com/questions/104665/coprimes-up-to-n
var getCoprimesLessThan = ( n ) => [ ...Array( n ).keys() ]
    .filter( b => ( g = a => b ? g( b, b = a % b ) : a < 2 )( n ) )
    .slice( 1 );

function getClockfaces( terminal, coprime ) {

    const identity = [ ...Array( terminal ).keys() ];
    const clockfaces = [ identity ];

    const strideClockface = ( clockface, stride ) => identity.map( i => clockface[ ( i * stride ) % terminal ] );
    const exactlyEquals = (a, b) => a.filter( (x,i) => x == b[i] ).length == a.length;

    var clockface = strideClockface( identity, coprime );
    while ( !exactlyEquals( identity, clockface ) ) {
        clockfaces.push( clockface );
        clockface = strideClockface( clockface, coprime );
    }

    return clockfaces;
}

function getOrbits( roots ) {
    const orbits = [];

    const identity = roots[0];
    const tally = [...identity];
    const terminal = identity.length;

    identity.forEach( i => {
        if ( tally.includes( i ) ) {
            // take the i th item from each clockface
            // todo: removing duplicate sequences
            const orbit = roots.map( root => root[i] ).filter( (v, i, a) => a.indexOf( v ) === i );
            orbit.forEach( i => tally.splice( tally.indexOf( i ), 1 ) );
            orbits.push( orbit );
        }
    } );

    return orbits;
}

function monomialHtml( monomial ) {
     const identities = Object
        .entries( monomial )
        .filter( entry => Number( entry[ 0 ] ) == 1 )
        .map( entry => `(<code>e</code><sup>${ entry[ 1 ].length }</sup>) ` )
        .join( '' );
     const orbits = Object
        .entries( monomial )
        .filter( entry => Number( entry[ 0 ] ) > 1 )
        .map( entry => `<i>a</i><sup>${ entry[ 1 ].length }</sup><sub style='position: relative; left: -.5em;'>${ entry[ 0 ] }</sub>` )
        .join( '' );
     return identities + orbits;
}

function equalCycle( o1, o2 ) {
    const l = o2.length;
    if ( o1.length != l ) {
        return false;
    } else {
        const offset = o2.indexOf( o1[0] );
        for ( var i = 0; i < l; i++ ) {
            const [ a, b ] = [ o1[i], o2[ ( i + offset ) % l ] ];
            if ( a != b ) {
                return false;
            }
        }
        return true;
    }
}

function equalCycles( cycles1, cycles2 ) {
    const l = cycles2.length;
    if ( cycles1.length != l ) {
        return false;
    }
    const eq = cycles1
       .map( cycle1 => cycles2
           .map( cycle2 => equalCycle( cycle1, cycle2 ) )
           .filter( e => e )
           .length > 0 )
        .filter( e => e );

    return l == eq.length;
}


function reverseCycle( o1, o2 ) {
    const l = o2.length;
    if ( o1.length != l ) {
        return false;
    } else {
        const offset = o2.indexOf( o1[0] );
        if ( offset < 0 ) {
            return false;
        }
        for ( var i = 0; i < l; i++ ) {
            const [ a, b ] = [ o1[i], o2[ ( l + offset - i ) % l ] ];
            if ( a != b ) {
                return false;
            }
        }
        return true;
    }
}

function cycleExponential( cycle, exponent ) {
    if ( exponent < 0 ) {
        const inverseCycle = [ ...cycle ].reverse();
        if ( exponent == -1 ) {
            return [ inverseCycle ];
        } else {
            return cycleExponential( inverseCycle, -1 * exponent, true )
        }
    }
    const l = cycle.length;
    const tally = new Array( exponent ).fill( 0 );
    return ( l % exponent ) == 0
        ? tally.map( (_, e) => cycle.filter( (x,i) => (i % exponent) == e ) )
        : [ cycle.map( (x,i) => cycle[ (exponent * i) % l ] ) ];
}

function cyclesExponential( cycles, exponent ) {
    return cycles.flatMap( cycle => cycleExponential( cycle, exponent ) );
}


class Orbitation {
    constructor( bases, param = {} ) {
        this.param = param;
        this.bases = bases;
        this.volume = bases.reduce( ( a, c ) => a * c, 1 );
        this.terminal = this.volume - 1;
        this.coprimes = getCoprimesLessThan( this.terminal );

        this.fragments = {};

        this.roots = this.coprimes.map( coprime => {
            const clockfaces = getClockfaces( this.terminal, coprime );
            const orbits = getOrbits( clockfaces );

            orbits.sort( ( o1, o2 ) => o1.length - o2.length );

            const monomial = {};

            orbits.forEach( orbit => {

                const key = orbit.length;
                if ( key in monomial ) {
                    monomial[ key ].push( orbit );
                } else {
                    monomial[ key ] = [ orbit ];
                }

                if ( !( key in this.fragments ) ) {
                    this.fragments[ key ] = [];
                }

                const keyFragments = this.fragments[ key ];

                const matchingFragments = keyFragments
                    .map( ( f,i ) => [ i, f, reverseCycle( f, orbit ), equalCycle( f, orbit ) ] )
                    .filter( f => f[2] || f[3] )
                    .map( ([ i, f, r, e ]) => [ i, !e, f ] );

                if ( matchingFragments.length < 1 ) {
                    matchingFragments.push( [ keyFragments.length, false, orbit ] );
                    this.fragments[ key ].push( orbit );
                }
            } );

            const order = lcma( orbits.map( o => o.length ));

            return [ coprime, monomial, order ];
        } );

        function getMatchingRoots( roots, cycles, coprime ) {
            const matchingRoots = roots
                .filter( ( [ coprime2, monomial2, _ ] ) => {
                    const cycles2 = Object.values( monomial2 ).flatMap( c => c );
                    return equalCycles( cycles, cycles2 );
                } );

            return matchingRoots;
        }

        this.symbols = this.roots
            .flatMap( ( [ coprime, monomial, order ] ) => {

                const cycles = Object
                    .values( monomial )
                    .flatMap( c => c );

                var expMatches = [];

                [ -1 ].forEach( exponent => {
                    const inverseCycles = cyclesExponential( cycles, exponent );
                    const matchingRoots = getMatchingRoots( this.roots, inverseCycles );
                    if ( matchingRoots.length > 0 ) {
                        const expCoPrime = Math.min( matchingRoots.map( r => r[0] ) );
                        expMatches.push( [ coprime, exponent, expCoPrime ] );
                    }
                } );

                var expCycles = [ ...cycles ];
                for ( var exponent = 2; exponent < order; exponent++ ) {
                        expCycles = composePermutations( cycles, expCycles )
                        const matchingRoots = getMatchingRoots( this.roots, expCycles );
                        if ( matchingRoots.length > 0 ) {
                            const expCoPrime = Math.min( matchingRoots.map( r => r[0] ) );
                            if ( expCoPrime != coprime || exponent == -1 ) {
                                expMatches.push( [ coprime, exponent, expCoPrime ] );
                            }
                        }
                }

                expMatches = expMatches
                    .filter( ( [ coprime, exponent, expCoPrime ] ) => expMatches
                        .filter( em => ( expCoPrime == em[ 2 ] ) && exponent <= em[ 2 ] ) );

                const inverses = expMatches
                    .filter( ( [ coprime, exponent, expCoPrime ] ) => exponent == -1 )
                    .map( ( [ coprime, exponent, expCoPrime ] ) => expCoPrime );

                return expMatches
                    .filter( ( [ coprime, exponent, expCoPrime ] ) => exponent == -1 || !inverses.includes( expCoPrime ) );
            } )
            .filter( x => x.length > 0  )
            .reduce( ( a, [ coprime, exponent, expCoPrime ] ) => {
                const ref = [ coprime, exponent ];
                if ( expCoPrime in a ) {
                    a[ expCoPrime ].push( ref );
                } else {
                    a[ expCoPrime ] = [ ref ];
                }
                return a;
            }, {} );


        this.points = [];
        this.roots = this
            .roots
            .map( root => {
                root.point = {
                    'coprime': root[0],
                    'monomial': monomialHtml( root[1] ),
                    'coord': randomSpherePoint( [ 0, 0, 0 ], 1 )
                };

                if ( ( this.volume % root.point.coprime ) == 0 ) {
                    this.points.push( root.point );
                } else {
                    const coprimeSymbols = this.symbols[ root.point.coprime ];
                    if ( coprimeSymbols && coprimeSymbols.find( ( [ c, _ ] ) => ( this.volume % c ) == 0 ) ) {
                        this.points.push( root.point );
                    } else {
                        //console.log( `dropped point: ${ JSON.stringify( root.point ) } `);
                        delete this.symbols[ root.point.coprime ];
                        return null;
                    }
                }
                return root;
            } )
            .filter( root => root );

        // build links between points
        const linkExponents = [];

        this.points.forEach( point => {
            point.links = this
                .symbols[ point.coprime ]
                .filter( ( [ c, _ ] ) => ( this.volume % c ) == 0 )
                .map( ( [ c, exp ] ) => [ this.getPoint( c ), exp ] )
                // exclude self-references
                .filter( ( [ p, exp ] ) => p != point );

            point.links.forEach( ( [ _, exp ] ) => linkExponents.includes( exp ) ? 0 : linkExponents.push( exp ) );
        } );

        linkExponents.sort( ( a, b ) => a - b );

        const getRodLength = ( rod, rodPower, inverseRod = 1000 ) => ( rod > 0 ) ? rod**rodPower : inverseRod;
        const getRodStrength = ( rod, rodPower, inverseRod = 0.000001 ) => ( rod > 0 ) ? ( 1 / rod )**rodPower : inverseRod;

        this.linkParam = linkExponents
            .map( le => [
                le,
                getRodLength( le, param.rodLengthExp ),
                getRodStrength( le, param.rodStrengthExp ),
                this.linkColor( le )
            ] );


        this.buildX3domGraph();
    }

    getPoint( coprime ) {
        return this.points.filter( p => p.coprime == coprime )[0];
    }

    fragmentsBlock() {
        const fragments = Object
            .entries( this.fragments )
            .map( f => `${ f[0] } ( ${ f[1].length } ) = ( ${ f[1].map( o => o.join(" ") ).join(" ), ( ") } )` )
            .join( "\n" );
        return `<pre>${ fragments }</pre>`;
    }

    symbolsTable() {

        const tableId = `symbols-${ this.volume }`;

        const header = [
            [ "coprime", 'number' ],
            [ "match", 'text' ]
        ];

        const rows = Object
            .entries( this.symbols )
            .map( ( [ coprime, refs ] ) => [
                coprime,
                refs
                    .filter( ref => ( ref[ 0 ] in this.symbols ) )
                    .map( ref => `${ ref[ 0 ] }<sup>${ ref[ 1 ] }</sup>` ).join( ', ' ) ] );

        return reify( "table", { "id": tableId, class: "sortable, symbol-details" },
            [
                reify( "caption", {}, [], [ c => c.innerHTML = "Symbols" ] ),
                reify( "tr", {},
                    header.map( ( h, i ) => reify( "th", {}, [],
                            [
                                c => c.onclick = () => sortTable( tableId, i, h[ 1 ] ),
                                c => c.innerHTML = h[0]
                            ]
                        )
                    )
                ),
                ...rows.map( row => reify( "tr", {},
                    row.map( r => reify( "td", {}, [],
                            [
                                c => c.onclick = () => {
                                    this.x3dRoot.runtime.showObject( this.getPoint( row[0] ).shape )
                                },
                                c => c.innerHTML = r
                            ]
                        )
                    ) ) )
            ]
        );
    }

    htmlTable() {

        const tableId = `system-${ this.volume }`;

        const header = [
            ["coprime", 'number' ],
            ["monomial", 'text' ],
            ["cycles", 'cycles' ]
        ];

        const rows = this
            .roots
            .map( root => [
                root[0],
                monomialHtml( root[1] ),
                "<div class='cycles'>" + Object
                    .entries( root[1] )
                    .map( ( [ key, orbits ] ) => `${ key } * ${ orbits.length } = ` + orbits.map( orbit => `( ${ orbit.join( ' ' ) } )` ).join( '' ) )
                    .map( orbitsRow => `<span>${ orbitsRow }</span>` )
                    .join( '<br/>\n' )
                + "</div>"
            ] );

        const fragmentsCount = Object.values( this.fragments ).reduce( (a,c) => a + c.length, 0 );
        const orbitsCount = this.roots.reduce( ( a, root ) => a + Object.values( root[2] ).reduce( ( b, orbits ) => b + orbits.length, 0 ), 0 );

        return `<table id="${ tableId }" class='sortable symbol-details'>`
            + `<caption>Orbitation: [ ${ this.bases.join( ', ' ) } ], terminal: ${ this.terminal }, fragments: ${ fragmentsCount }, orbits: ${ orbitsCount }</caption>`
            + "<tr>" + header.map( (h,i) => `<th onclick='sortTable( "${ tableId }", ${ i }, "${ h[ 1 ] }" )'>${ h[0] }</th>` ).join( "\n" ) + "</tr>"
            + rows.map( row => "<tr>" + row.map( r => `<td>${ r }</td>` ).join( "\n" ) + "</tr>" ).join( "\n" )
            + "</table>";
    }

    linkColor( exp ) {
        return ( exp == -1 )
            ? "gray"
            : colorForIndex( exp );
    }

    buildX3domGraph() {

        const rows = Object
            .entries( this.symbols )
            .map( ( [ coprime, refs ] ) => [ coprime, refs.map( ref => `${ ref[ 0 ] }<sup>${ ref[ 1 ] }</sup>` ).join( ', ' ) ] );

        const coord = () => 2 * ( 0.5 - Math.random() );



        const linkRadius = ( exp ) => ( exp == -1 )
            ? 0.001
            : 0.01;

        const moveLinks = ( point ) => {
            point
                .shapeLinks
                .forEach( shapeLink => {
                        const [ linkPoint, exp, transformTranslation, transformRotation, cylinder ] = shapeLink;
                        const [ centre, rotationAxis, rotationAngle, height ] = getCylinderData( point, linkPoint );

                        transformTranslation.setAttribute( "translation", centre.join( ' ' ) );
                        transformRotation.setAttribute( "rotation", rotationAxis.join( ' ' ) + ' ' + rotationAngle );
                        cylinder.setAttribute( "height", String( height) );
                    } );
        };


        // build x3dom shapes and links
        this.points
            .forEach( p => {

                const radius = 0.1;
                p.shapeLinks = p.links
                    .map( ( [ linkPoint, exp ] ) => [
                        linkPoint,
                        exp,
                        ...createCylinder( p, linkPoint, this.linkColor( exp ), linkRadius( exp ) ) ] );

                p.shape = reify(
                    "transform",
                    { "translation": p.coord.join( ' ' ) },
                    [
                        createSphereShape( `coprime-${ p.coprime }`, radius, "red", 0, `${ p.coprime } | ${ p.monomial }`, true ),
                        ...p.shapeLinks.map( sl => sl[2] )
                    ] );

                p.moveLinks = () => moveLinks( p );
            } );

        return this.points;
    }

}




function twist( sequence, stride = 2 ) {
    const base = sequence.length;
    const tally = new Array( base ).fill( 0 );
    const sink = [];
    for ( var i = 0; i < base; i++ ) {
        const j = ( i * stride ) % base;
        if (tally[ j ] ) {
            throw new Error( `Common Factor: Index length ${ base } at stride ${ stride } repeats with length ${ sink.length }; [${ sink }]  ` );
        }
        tally[ j ] = 1;
        sink.push( sequence[ j ] );
    }
    return sink
}

function roots( index, stride ) {
    const source = [...index];
    const base = source.length;

    // no twists below three
    if ( base <= 2 ) {
        return [ source ];
    }

    const currentRoots = [ index ];
    var locus = twist( index, stride );
    while ( !arrayExactlyEquals( index, locus ) ) {
        currentRoots.push( locus );
        locus = twist( locus, stride );
    }
    return currentRoots;
}

function winding( sequence ) {
    const w = sequence
        .reduce(
            (a,c) => [ a[0] + (c < a[1] ? 1 : 0 ), c ],
            [ 1, 0 ]
        );
    return w[0];
}

function rootsInfo( base, stride ) {
    //const r = roots( arrayOfIndexes( base ), stride );
    const r = getClockfaces(  base, stride );
    const w = r.map( sequence => winding( sequence ) );
    return { base: base, stride: stride, size: r.length, windings: w, roots: r  };
}

