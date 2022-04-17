
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

const getRodLength = ( rod, rodPower, inverseRod = 1000 ) => ( rod > 0 ) ? rod**rodPower : inverseRod;
const getRodStrength = ( rod, rodPower, inverseRod = 0.000001 ) => ( rod > 0 ) ? ( 1 / rod )**rodPower : inverseRod;

class Orbitation {
    constructor( bases, param = {} ) {
        this.param = {
            forces: [ 'pair', 'link' ],
            identityFactor: 0.1,
            pairFactor: -1.0,
            rodLengthExp: 0,
            rodStrengthExp: 2,
            newtonian: true,
            friction: 0.96,
            minDist: 0.000000000001,
            minDelta: 0.000000000001,
            maxDelta: 10,
            burst: 100,
            iterations: 2000,
            tickTime: 10,
            truncated: true,
            ...param
        };
        this.bases = bases;
        this.volume = bases.reduce( ( a, c ) => a * c, 1 );
        this.terminal = this.volume - 1;
        this.coprimes = getCoprimesLessThan( this.terminal );
        this.cofactors = this.coprimes.filter( coprime => ( this.volume % coprime ) == 0 );

        const identityPerm = [ ...new Array( this.terminal ).fill( 0 ).keys() ].map( k => [ k ] );
        const identityRoot = [ 'e', { '1': identityPerm }, 1 ];

        this.roots = [ identityRoot ];

        this.fragments = {};

        this.roots.push( ...this.coprimes.map( coprime => {

            const orbits = getMultiplicativeGroupMember( this.terminal, coprime, this.param.truncated );

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
        } ) );

        this.roots
            .forEach( root => {
                const [ coprime, monomial, order ] = root;
                const cycles = Object
                    .values( monomial )
                    .flatMap( c => c );

                const powers = [];
                var locus = coprime;
                for ( var exponent = 2; exponent < order; exponent++ ) {
                        locus = ( locus * coprime ) % this.terminal;
                        const matchingRoots = this.roots.filter( r => r[0] == locus );
                        if ( matchingRoots.length > 0 ) {
                            const expCoPrime = Math.min( matchingRoots.map( r => r[0] ) );
                            const inverse = ( exponent == ( order - 1 ) );
                            powers.push( [ exponent, expCoPrime, inverse ] );
                        }
                }

                root.push( powers );
            } )


        this.symbols = this.roots
            .flatMap( ( [ coprime, monomial, order, powers ] ) => {

                var expMatches = powers.map( p => [ coprime, ...p ] );

                return expMatches;
            } )
            .filter( x => x.length > 0  )
            .reduce( ( a, [ coprime, exponent, expCoPrime, inverse ] ) => {
                const ref = [ coprime, exponent, inverse ];
                if ( expCoPrime in a ) {
                    a[ expCoPrime ].push( ref );
                } else {
                    a[ expCoPrime ] = [ ref ];
                }
                return a;
            }, {} );


        this.points = [];
        this.roots.forEach( root => {
            const point = {
                'coprime': root[0],
                // assume self-inverse
                'inverse': root[0],
                'powers': root[3],
                'cofactor': this.cofactors.includes( root[0] ),
                'coord': randomSpherePoint( [ 0, 0, 0 ], 1 ),
                'velocity': [ 0, 0, 0 ],
                'mass': 1.0
            };
            root.push( point );
            this.points.push( point );
        } );

        // build links between points
        const linkExponents = [];
        this.points.forEach( point => {
            if ( ( point.coprime == 'e' ) ) {
                point.links = this.roots.map( ( [ coprime, monomial, order ] ) => [ this.getPoint( coprime ), order, false ] );
            } else {
                const coprimeSymbols = this.symbols[ point.coprime ];

                point.links = coprimeSymbols
                    ? coprimeSymbols.map( ( [ c, exp, inverse ] ) => [ this.getPoint( c ), exp, inverse ] )
                    : [];
            }
        } );

        const linksStats = {
            total: 0
        };

        this.points.forEach( point => {
            const links = point.links || [];
            linksStats.total += links.length;
            links
                .filter( ( [ _, _1, inverse ] ) => inverse )
                .forEach( ( [ p ] ) => point.inverse = p.coprime );
            point.links.forEach( ( [ _, exp ] ) => linkExponents.includes( exp ) ? 0 : linkExponents.push( exp ) );
            point.mass = 1 + point.links.length;
        } );

        linkExponents.sort( ( a, b ) => a - b );

        this.linkExponents = linkExponents;
        this.createLinkParam();

        this.buildX3domGraph();
    }

    createLinkParam() {
        this.linkParam = this.linkExponents
            .map( le => [
                le,
                getRodLength( le, this.param.rodLengthExp ),
                getRodStrength( le, this.param.rodStrengthExp ),
                this.linkColor( le )
            ] );
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

        return reify( "table", { "id": tableId, class: "sortable, multiplicative-group-table" },
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

    specification( anti = false, rotation = 0) {
        const basesCopy = [ ...this.bases ];
        if ( anti ) {
            basesCopy.reverse();
        }
        rotateArray( basesCopy, rotation );
        return basesCopy.join( "x" );
    }

    placeValuesSpec( anti = false, rotation = 0 ) {
        const basesCopy = [ ...this.bases ];
        if ( anti ) {
            basesCopy.reverse();
        }
        rotateArray( basesCopy, rotation );
        return basesCopy.map( ( b, i ) => ( i + 1 ) == basesCopy.length ? '1' : basesCopy.slice( i + 1 ).join( 'x' ) );
    }

    placeValues( anti = false, rotation = 0) {
        const basesCopy = [ ...this.bases ];
        if ( anti ) {
            basesCopy.reverse();
        }
        rotateArray( basesCopy, rotation );
        return basesCopy.map( ( b, i ) => ( i + 1 ) == basesCopy.length ? 1 : basesCopy.slice( i + 1 ).reduce( (a,c) => a * c, 1 ) );
    }

    cyclesHtml( coprime ) {
        const [ _, monomial, order, powers, point ] = this.roots.find( r => r[0] == coprime );
        return reify(
            "div",
            { "class": "cycles" },
            Object
                .entries( monomial )
                .map( ( [ key, orbits ] ) => orbits.map( orbit => `( ${ orbit.map( c => c.toString() ).join( ' ' ) } )` ).join( ' ' ) )
                .map( orbitsRow => reify( "span", {}, [], [ c => c.innerHTML = orbitsRow ] ) )
        );
    }


    coordCyclesHtml( coprime, spacer = "<br/>" ) {
        const [ _, monomial, order, powers, point ] = this.roots.find( r => r[0] == coprime );
        return reify(
            "div",
            { "class": "cycles" },
            Object
                .entries( monomial )
                .map( ( [ key, orbits ] ) => orbits.map( orbit => `(${ orbit.map( c => `(${ c.coord.join( ", " ) })` ).join( ' ' ) })` ).join( spacer ) )
                .map( orbitsRow => reify( "span", {}, [], [ c => c.innerHTML = orbitsRow + spacer ] ) )
        );
    }
    
    cycles( coprime ) {
        const [ _, monomial, order, powers, point ] = this.roots.find( r => r[0] == coprime );
        return Object
                .entries( monomial )
                .flatMap( ( ( [ _, orbits ] ) => orbits ) );
    }

    order( coprime ) {
        const [ _, monomial, order, powers, point ] = this.roots.find( r => r[0] == coprime );
        return order;
    }

    htmlTable( excludes = [ "cycles" ] ) {

        const tableId = `system-${ this.volume }`;

        const header = [
            [ "coprime", 'number' ],
            [ "inverse", "number" ],
            [ "volume", "number" ],
            [ "order", "number" ],
            [ "monomial", 'monomial' ],
            [ "relations", 'monomial' ],
            [ "cycles", 'cycles' ]
        ];

        function coprimeHtml( point ) {
            return point.cofactor
                ? point.coprime
                : `{${ point.coprime }}`;
        }

        function cofactorHtml( point, terminal ) {
            if ( point.coprime == 'e' ) {
                return `{${ terminal }}`;
            }
            return point.cofactor
                ? point.inverse
                : `{${ point.inverse }}`;
        }

        function cofactorVolume( point, terminal ) {
            if ( point.coprime == 'e' ) {
                return 1;
            }
            return ( ( point.coprime * point.inverse ) - 1 ) / terminal;
        }

        const rows = this
            .roots
            .map(  ( [ coprime, monomial, order, powers, point ] ) => [
                point,
                monomial,
                order,
                point.coprime == 'e'
                    ? ""
                    : point.links
                        ? point.links.map( ( [ linkPoint, linkExp ] ) => `${ linkPoint.coprime }<sup>${ linkExp }</sup>` ).join( ", " )
                        : "-",
                "<div class='cycles'>" + Object
                        .entries( monomial )
                        .map( ( [ key, orbits ] ) => `${ orbits.length } * ${ key } = ` + orbits.map( orbit => `(${ orbit.map( c => c.toString() ).join( ' ' ) })` ).join( '' ) )
                        .map( orbitsRow => `<span>${ orbitsRow }</span>` )
                        .join( '<br/>\n' ) + "</div>"
            ] );

        return reify( "div", {}, [
            reify( "table", { id: tableId, class: "sortable, multiplicative-group-table" }, [
                reify( "caption", {}, [], [ c => c.innerHTML = `Box: [ ${ this.bases.join( ', ' ) } ]; MG(${ this.terminal })` ] ),
                reify(
                    "tr",
                    {},
                    header
                        .filter( h => !excludes.includes( h[0] ) )
                        .map( (h,i) => reify( "th", {}, [], [
                        c => c.onclick = () => sortTable( tableId, i, h[ 1 ] ),
                        c => c.innerHTML = h[0]
                    ] ) ) ),
                ...rows
                    .flatMap( ( [ point, monomial, order, linksHtml, cyclesHtml ], i ) => reify(
                        "tr",
                        {
                            'id': `${ tableId }-${ point.coprime }`,
                            'class': this.bases.includes( point.coprime )
                                ? 'box-side-length'
                                : ( point.coprime != 'e' && cofactorVolume( point, this.terminal ) == 1 )
                                    ? 'inverse-box-side-length'
                                    : ''
                        },
                        [
                            reify( "td", { 'class': 'centre-label' }, [], [ c => c.innerHTML = point.coprime ] ),
                            reify( "td", { 'class': 'centre-label' }, [], [ c => c.innerHTML = point.inverse ] ),
                            reify( "td", { 'class': 'centre-label' }, [], [ c => c.innerHTML = cofactorVolume( point, this.terminal ) ] ),
                            reify( "td", { 'class': 'centre-label' }, [], [ c => c.innerHTML = order ] ),
                            reify( "td", {}, [], [ c => c.innerHTML = monomialHtml( monomial ) ] ),
                            reify( "td", {}, [], [ c => c.innerHTML = linksHtml ] ),
                            excludes.includes( "cycles" ) ? null : reify( "td", {}, [], [ c => c.innerHTML = cyclesHtml ] )
                        ].filter( c => c ),
                        [
                            c => c.onclick = () => {
                                if ( this.selectTableRow( point.coprime ) ) {
                                    document
                                        .querySelectorAll( "#selected-cycles" )
                                        .forEach( c => {
                                            const cycles = Object
                                                .entries( monomial )
                                                .flatMap( ( [ key, orbits ] ) => orbits );

                                            try {
                                                navigator.clipboard.writeText( JSON.stringify( cycles ) );
                                            } catch ( e ) {
                                                consoleLog( `Failed write to clipboard: ${ e }`);
                                            }
                                            c.innerHTML = cyclesHtml;
                                        } );

                                    document
                                        .querySelectorAll( "#selected-cycles-diagram" )
                                        .forEach( d => {
                                            d.innerHTML = "";

                                            const header = reify("span", [], [], [ s => s.innerHTML = monomialHtml( monomial ) ] );
                                            d.appendChild( header );

                                            const cycles = Object
                                                .entries( monomial )
                                                .flatMap( ( [ key, orbits ] ) => orbits );

                                            d.appendChild( buildX3DomRootNode( getCyclesDiagram( cycles ), { width: "100%", height: "100%" } ) );

                                            x3dom.reload();
                                        } );

                                    if ( this.x3dRoot && point.shape ) {
                                        this.x3dRoot.runtime.showObject( point.shape );
                                    }
                                }
                            }
                        ] )
                    )
            ] ),
            reify( "div", { class: "summaryLeft" }, [], [ c => c.innerHTML = `Total rows: ${ rows.length }` ] )
        ] );
    }

    linkColor( exp ) {
        return ( exp == -1 )
            ? "gray"
            : colorForIndex( exp );
    }

    buildX3domGraph() {

        const coord = () => 2 * ( 0.5 - Math.random() );

        const linkRadius = ( exp ) => ( exp == -1 )
            ? 0.001
            : 0.01;

        const movePoint = ( point, minDist = 0.00001 ) => {
            const tCoord = point
                .shape
                .getAttribute( "translation" )
                .split( ' ' )
                .map( t => Number( t ) );
            if ( !arrayAlmostEqual( tCoord, point.coord, minDist ) ) {
                point
                    .shape
                    .setAttribute( "translation", point.coord.join( ' ' ) );
                return true;
            } else {
                return false;
            }
        };
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

                const [ sphereRadius, sphereColor, cylinderFactor ] = ( p.coprime == 'e' )
                   ? [ 0.2, "grey", 0.1 ]
                   : p.cofactor
                        ? [ 0.1, "red", 1 ]
                        : [ 0.1, "blue", 1 ];

                p.shapeLinks = p.links
                    .map( ( [ linkPoint, exp ] ) => [
                        linkPoint,
                        exp,
                        ...createCylinder(
                            p,
                            linkPoint,
                            ( p.coprime == 'e' ) ? "black" : this.linkColor( exp ),
                            cylinderFactor * linkRadius( exp ) ) ] );

                p.shape = reify(
                    "transform",
                    { "translation": p.coord.join( ' ' ) },
                    [
                        createSphereShape( `coprime-${ p.coprime }`, sphereRadius, sphereColor, 0, `${ p.coprime } | ${ p.monomial }`, true ),
                        ...p.shapeLinks.map( sl => sl[2] )
                    ],
                    [
                        shape => shape.onclick = () => this.selectTableRow( p.coprime )
                    ] );

                p.move = () => movePoint( p, this.param.minDist );
                p.moveLinks = () => moveLinks( p );
            } );

        return this.points;
    }

    selectTableRow( coprime ) {
        var wasSelected = false;
        try {
            const tableId = `system-${ this.volume }`;
            const table = document.getElementById( tableId );
            const removed = [];
            table
                .querySelectorAll( "tr.selected" )
                .forEach( tableRow => {
                    tableRow.classList.remove("selected");
                    removed.push( tableRow );
                } );
            table
                .querySelectorAll( `tr#${ tableId }-${ coprime }` )
                .forEach( selectedRow => {
                    if ( !removed.includes( selectedRow ) ) {
                        selectedRow.classList.add( "selected" );
                        wasSelected = true;
                    }
                } );

            if ( this.onSelectTableRow ) {
                this.onSelectTableRow( coprime );
            }
        } catch ( e ) {
            console.log( e );
        }
        return wasSelected;
    }
}

function walkBases( bases, cellFn, place = 0, locusStack = [] ) {
    if ( place == bases.length ) {
        cellFn( locusStack );
    } else {
        for ( var i = 0; i < bases[ place ]; i++) {
            locusStack.push( i );
            walkBases( bases, cellFn, place + 1, locusStack );
            locusStack.pop();
        }
    }
}


function boxPlaceValueTable( bases, maxRows, order ) {

    //const caption = `Box: ${ bases.join( 'x' )}`;

    const placesForward = placeValuesForwardArray( bases, offset = 0 );
    const placesReverse = placeValuesReverseArray( bases, offset = 0 );
    const indexReverse = ( coord ) => placesReverse.map( (b,i) => b * coord[i] ).reduce( ( a, c ) => a + c, 0 );

    const placeOrder = order || new Array( bases.length ).fill( 0 ).map( (_,i) => i );

    function reorder( coord, order ) {
        return order.map( i => coord[i] );
    }

    const rowData = [];

    walkBases( bases, coord => rowData.push( [ reorder( coord, placeOrder ), indexReverse( coord ) ] ) );

    rowData.sort( (a,b) => numericArraySorter( a[0], b[0] ) );

    const rows = rowData
        .map( ( [ coord, index ], i ) => reify(
             "tr",
             {},
             [
                ...coord.map( b => reify( "td", { "class": "places-left" }, [], [ c => c.innerHTML = b ] ) ),
                reify( "td", { "class": "tally-value" }, [], [ c => c.innerHTML = index ] )
             ] ) );

    const rowsPerTable = maxRows || rows.length;
    const cols = maxRows
        ? Math.ceil( rows.length / rowsPerTable )
        : 1;

    const tables = [];

    const placeValuesHeader = reorder(
        bases
            .map( ( b, i ) => reify(
                "th",
                { "class": "places-left" },
                [],
                [ c => c.innerHTML = ( i + 1 ) == bases.length ? 1 : bases.slice( i + 1 ).join( 'x' ) ] )
            ),
        placeOrder
    );

    for ( var i = 0; i < cols; i++ ) {
        const tableRows = rows.splice( 0, rowsPerTable );
        const table = reify( "table", { "class": "place-values-table"}, [
            reify(
                "tr",
                {},
                [
                    reify( "th", { "colspan": bases.length }, [], [ c => c.innerHTML = 'Coordinate' ] ),
                    reify( "th", {}, [], [ c => c.innerHTML = 'Index' ] )
                ]
            ),
            reify(
                "tr",
                {},
                [
                    ...reorder(
                        bases
                            .map( ( b, i ) => reify(
                                "th",
                                { "class": "places-left" },
                                [],
                                [ c => c.innerHTML = ( i + 1 ) == bases.length ? 1 : bases.slice( i + 1 ).join( 'x' ) ] )
                            ),
                        placeOrder
                    ),
                    reify( "th", { "class": "places-left" }, [], [ c => c.innerHTML = '' ] )
                ]
            ),
            ...tableRows
        ] );

        //table.createCaption().textContent = caption;

        tables.push( table );
    }

    if ( tables.length == 1 ) {
        return tables[0];
    } else {
        return reify( "table", {}, [
            reify( "tr", {}, tables.map( table => reify( "td", {}, [ table ] ) ) )
        ] );
    }
}

function compareBoxIndexesTable( bases0, bases1 ) {

    const placesReverse0 = placeValuesReverseArray( bases0, offset = 0 );
    const indexReverse0 = ( coord ) => placesReverse0.map( (b,i) => b * coord[i] ).reduce( ( a, c ) => a + c, 0 );

    const placesReverse1 = placeValuesReverseArray( bases1, offset = 0 );
    const indexReverse1 = ( coord ) => placesReverse1.map( (b,i) => b * coord[i] ).reduce( ( a, c ) => a + c, 0 );

    const colData = [];

    walkBases( bases0, coord => colData.push( [ indexReverse0( coord ), indexReverse1( [...coord].reverse() ) ] ) );

    colData.sort( (a,b) => a[0] - b[0] );

    colData.splice( 0, 0, [ bases0.join( "x" ), bases1.join( "x" ) ] )

    const rowData = [ [], [] ];
    colData.forEach( c => {
        rowData[0].push( c[0] );
        rowData[1].push( c[1] );
    } );

    return reify(
        "table",
        { "class": "raw-permutation" },
        rowData.map( row => reify(
            "tr",
            {},
            row.map( ( v, i ) => reify(
                "td",
                { "class": "" },
                [],
                [ c => c.innerHTML = v ] ) ) ) ) );
}

function compareBoxSpecificationsTable( bases, anti = false, rotation = 0 ) {

    const bases0 = [...bases];

    const placesReverse0 = placeValuesReverseArray( bases0, offset = 0 );
    const indexReverse0 = ( coord ) => placesReverse0.map( ( p, i ) => p * coord[i] ).reduce( ( a, c ) => a + c, 0 );

    function txArray( a, anti, rotation ) {
        return rotateArray( anti ? [...a].reverse() : [...a], rotation );
    }

    const bases1 = txArray( bases, anti, rotation );

    const placesReverse1 = placeValuesReverseArray( bases1, offset = 0 );
    const indexReverse1 = ( coord ) => placesReverse1.map( ( p, i ) => p * txArray( coord, anti, rotation )[i] ).reduce( ( a, c ) => a + c, 0 );

    const colData = [];

    walkBases( bases0, coord => colData.push( [ indexReverse0( coord ), indexReverse1( coord ) ] ) );

    colData.sort( (a,b) => a[0] - b[0] );

    colData.splice( 0, 0, [ bases0.join( "x" ), bases1.join( "x" ) ] )

    const rowData = [ [], [] ];
    colData.forEach( c => {
        rowData[0].push( c[0] );
        rowData[1].push( c[1] );
    } );

    return reify(
        "table",
        { "class": "raw-permutation" },
        rowData.map( row => reify(
            "tr",
            {},
            row.map( ( v, i ) => reify(
                "td",
                { "class": "" },
                [],
                [ c => c.innerHTML = v ] ) ) ) ) );
}


function boxPackingTable( sides, cellFn, invert = false ) {

    const caption = `Box specification: ${ sides.join( 'x' )}${ invert ? ' (twisted)' : '' }`;

    const bases = invert ? [ ...sides ].reverse() : sides;
    const rank = bases.length;

    const placesForward = placeValuesForwardArray( bases, offset = 0 );
    const placesReverse = placeValuesReverseArray( bases, offset = 0 );

    const indexForward = ( coord ) => placesForward.map( (b,i) => b * coord[i] ).reduce( ( a, c ) => a + c, 0 );
    const indexReverse = ( coord ) => placesReverse.map( (b,i) => b * coord[i] ).reduce( ( a, c ) => a + c, 0 );

    function _walkBases( bases, cellFn, inverted = false, place = 0, locusStack = [] ) {
        if ( place == rank ) {
            const id = inverted
                ? indexForward( locusStack )
                : indexReverse( locusStack );
            return reify( "td", { 'class' : 'cell' }, [], [ c => c.innerHTML = cellFn( locusStack, id ) ] );
        } else {
            const isRow = ( 0 != ( rank - place ) % 2 );

            const holder = isRow
                ? reify( "tr", { 'class' : 'pack' } )
                : ( place == 0 )
                    ? reify( "table", { 'class' : 'packing' } )
                    : reify( "td", { 'class' : 'pack' } );

            for ( var i = 0; i < bases[ place ]; i++) {

                locusStack.push( i );
                const cell = _walkBases( bases, cellFn, inverted, place + 1, locusStack );
                locusStack.pop();

                if ( isRow ) {
                    holder.appendChild( cell );
                } else {
                    holder.insertBefore( reify( "tr", {}, [ reify( "td", { 'class' : 'pack' } , [ cell ] ) ] ), holder.firstChild );
                }
            }
            if ( isRow ) {
                return reify( "table", { 'class' : 'pack' }, [ holder ] );
            } else {
                return holder;
            }
        }
    }

    // the locus stack handles reversed coordinates
    const table = _walkBases( bases, cellFn, invert );

    table.createCaption().textContent = caption;
    table.classList.remove( 'pack' );
    table.classList.add( 'packing' );

    return table;
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

function putOrbitationNode( orb, param = {} ) {
    const { css = [], sourceId = 'calculationScript', sourceElement } = param;

    orb.x3dRoot = reify( "x3d", { "width": "100%", "height": "100%" },
        [ reify( "scene", { "id": "plot_scene_root" }, orb.points.map( p => p.shape ) ) ]
    );

    const targetElement = sourceElement || document.getElementById( sourceId );

    targetElement
        .appendChild( reify( "div", { "class": [ 'scriptPanelResult', ...css ].join( "," ) }, [ orb.x3dRoot ] ) );

    x3dom.reload();

    orb.points.forEach( p => {
        new x3dom.Moveable(
            orb.x3dRoot,
            p.shape,
            ( shape, position ) => {
                 p.coord = [ position.x, position.y, position.z ];
                 p.moveLinks();
            },
            0 );
    } );
}

function putForceControls( orb, param = {} ) {
    const { css = [], sourceId = 'calculationScript', sourceElement, autoRun = true, } = param;

    const runButton = reify( "input", { "type": "button", "value": "run" } );

    const onIterationAction = ( iteration ) => {
        if ( iteration == 0 ) {
            runButton.value = 'forces';
            orb.param.running = false;
        } else {
            runButton.value = iteration;
        };
    };

    runButton.onclick = () => {
        if ( orb.param.running ) {
            orb.param.running = false;
            runButton.value = 'forces';
        } else {
            applyForces( orb, onIterationAction );
        }
    };

    const iterationsInput = reifyInput(
        "iterations: ",
        { type: "number", class: "decimal-input", max: 100000, min: 0, step: 1, value: orb.param.iterations },
        iterations => orb.param.iterations = iterations
    );


    const identityFactorInput = reifyInput(
        "identity-factor: ",
        { type: "number", class: "decimal-input", max: 100, min: -100, step: 0.1, value: orb.param.identityFactor },
        identityFactor => orb.param.identityFactor = identityFactor
    );

    const pairFactorInput = reifyInput(
        "pair-factor: ",
        { type: "number", class: "decimal-input", max: 100, min: -100, step: 0.1, value: orb.param.pairFactor },
        pairFactor => orb.param.pairFactor = pairFactor
    );

    const frictionInput = reifyInput(
        "friction: ",
        { type: "number", class: "decimal-input", max: 1, min: 0, step: 0.01, value: orb.param.friction },
        friction => orb.param.friction = friction
    );


    const onChangeRodsAction = ( iteration ) => {
        if ( iteration == 0 ) {
            runButton.value = 'forces';
            orb.param.running = false;
        } else {
            runButton.value = iteration;
        };
    };

    const rodLengthExponentInput = reifyInput(
        "rod-length-exponent: ",
        { type: "number", class: "decimal-input", max: 100, min: -100, step: 0.1, value: orb.param.rodLengthExp },
        rodLengthExp => {
            orb.param.rodLengthExp = rodLengthExp;
            orb.createLinkParam();
            const linkControls = document.getElementById( 'link_controls' );
            linkControls.removeChild( linkControls.lastChild );
            linkControls.appendChild( createLinkTable() );
        }
    );
    const rodStrengthExponentInput = reifyInput(
        "rod-strength-exponent: ",
        { type: "number", class: "decimal-input", max: 100, min: -100, step: 0.1, value: orb.param.rodStrengthExp },
        rodStrengthExp => {
            orb.param.rodStrengthExp = rodStrengthExp;
            orb.createLinkParam();
            linkControls.removeChild( linkControls.lastChild );
            linkControls.appendChild( createLinkTable() );
        }
    );

    function createLinkTable() {
        const linkControlHeaders = [ "exponent", "spring-length", "spring-constant" ];
        const linkControlRows = orb.linkParam
            .map( ( expData, i ) => reify( "tr", {},
                [
                    reify( "td", {}, [ reify( "label", {}, [], [ c => c.innerHTML = expData[ 0 ] ] ) ] ),
                    reify( "td", {}, [ reify( "label", {}, [
                        reify( "input", { type: "number", class: "decimal-input", step: 0.1, value: expData[ 1 ].toFixed( 4 ) },
                            [], [ c => c.onchange = () => orb.linkParam[ i ][ 1 ] = c.value ] ) ] ) ] ),
                    reify( "td", {}, [ reify( "label", {}, [
                        reify( "input", { type: "number", class: "decimal-input", step: 0.000001, value: expData[ 2 ].toFixed( 10 ) },
                            [], [ c => c.onchange = () => orb.linkParam[ i ][ 2 ] = c.value ] ) ] ) ] )
                ],
                [
                    tr => tr.style.backgroundColor = expData[ 3 ]
                ]
            ) );

        return reify( "table", {},
                    [
                        reify( "tr", {}, linkControlHeaders.map( h => reify( "th", {}, [], [ c => c.innerHTML = h ] ) ) ),
                        ...linkControlRows
                    ]
                );
    }

    const linkControls = reify( "div", { id: "link_controls", class: "floatRight" },
        [
            rodLengthExponentInput,
            rodStrengthExponentInput,
            createLinkTable()
        ],
        [
            c => c.style.display = 'none'
        ]);

    const targetElement = sourceElement || document.getElementById( sourceId );

    targetElement
        .appendChild( reify( "div", { "class": [ 'scriptPanelResult', 'summaryRight' ].join( "," ) }, [
            runButton,
            iterationsInput,
            identityFactorInput,
            pairFactorInput,
            frictionInput,
            reify( "label", {}, [
                reify( "text", {}, [], [ t => t.textContent = "show/hide link controls" ] ),
                reify( "input", { type: "checkbox" }, [], [ input => input.onclick = () => showHide( "link_controls", input ) ] )
            ] ),
            linkControls
        ] ) );

    if ( autoRun ) {
        applyForces( orb, onIterationAction );
    }
}


function insertOrbitation( bases ) {
    const key = bases.join( 'x' );
    const containerId = `orbitation-${ key }`;
    const div = document.getElementById( containerId );
    const orb = new Orbitation( bases );
    div.appendChild( orb.htmlTable( excludes = [] ) );

    orb.onSelectTableRow = ( coprime ) => {
        const orbCyclesId = `orbitation-${ key }-cycles`;
        const orbCycles = document.getElementById( orbCyclesId );
        if ( orbCycles ) {
            div.removeChild( orbCycles );
        }
        appendX3DomNode(
            getCyclesDiagram( orb.cycles( coprime ), { scaleBase: [ 1, 1, 1 ], scaleVolume: 10 } ),
            {
                containerId: containerId,
                id: orbCyclesId,
                height: "100%",
                width: "100%",
                css: [ "resizable" ],
                reload: true
            }
        );
    };
    //putOrbitationNode( orb, { sourceElement: div, width: "100%", height: "100%", css: [ "resizable", "leftFlow" ] } );
    //putForceControls( orb, { sourceElement: div } );
}