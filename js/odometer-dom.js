
Cycles.prototype.cyclesView = {
    'normal': { orientation: '-1 -1 0 0.5', position: '-3.5 2.4 7' },
    'default': { width: '100%', height: '100%', orientation: '-1 -1 0 0.5', position: '-3.5 2.4 7' },
    'resizable': { width: '100%', height: '90%', orientation: '-1 -1 0 0.5', position: '-3.5 2.4 7' },
    'short': { width: '100%', height: '100%', orientation: '1 0 0 -1.6', position: '0 3.5 0' },
    'table': { width: '200px', height: '100px', orientation: '0 0 0 1', position: '0 0 10' },
};

Cycles.prototype.x3dCycles = function( param = { 'toggles': ['lines'] }, view = 'table' ) {
    return buildX3DomRootNode( getCyclesDiagram( this, param ), this.cyclesView[ view ] );
}

Cycles.prototype.boxesView = {
    'default': { width: '100%', height: '90%', orientation: '-1 -1 0 0.5', position: '-3.5 2.4 7' },
    'table': { width: '200px', height: '100px', orientation: '0 0 0 1', position: '0 0 10' },
};

Cycles.prototype.x3dBoxes = function( param = { 'toggles': ['lines'] }, view = 'default' ) {
    return buildX3DomRootNode( getCyclesPointsDiagram( this, param ), this.boxesView[ view ] );
}

Cycles.prototype.htmlSummary = function() {
     return reify( "div",{}, [
         reifyText( this.label() ),
         reifyText( " | " ),
         reifyText( this.alias ),
         reifyText( " = " ),         reifyText( `(box=[${ this.getBases()}], p=${ this.parity }, v=${this.getVolume()}, o=${this.order()}, c=[${this.C()}]) ` ),
         reifyText( " : " ),
         reifyText( " &rarr; " ),
         this.htmlMonomial()
      ] );
};

Cycles.prototype.htmlTable = function( param = {} ) {

        const { coords = false } = param;

        const bases = this.getBases();
        const volume = this.getVolume();
        const maxIndex = volume - 1;

        const initialPointsSum = new Array( this.getRank() ).fill( 0 );

        const identities =  this.identities();
        const identityPointsSum = identities
            .map( cycle => this.box[cycle[0]] )
            .reduce( (a, coord) => addition( a, coord ), initialPointsSum );
        const identityIdSum = identities
            .map( cycle => cycle[0] )
            .reduce( (a, id) => a + id, 0 );
        const identityIdSumGcd = gcd( maxIndex, identityIdSum );

        const headerRow = [
            [ 'Id', [ true ] ],
            [ 'Cycle', [] ],
            [ 'Id Sum', [ true, false, true ] ],
            coords ? [ 'Cycle Coords', [] ] : null,
            [ 'Coord Sum', [ true, true ] ],
            [ 'Order', [ true, false, true ] ],
            [ 'Perimeter<sup>2</sup>', [ true, true ] ],
            [ 'Radiance', [ true, true ] ],
            [ 'Equations', [ true, true ] ],
        ];

        const identityRow = [
            reifyText( '<code>e</code>' ),
            reifyText( identities.map( cycle => `(${ cycle })` ).join( ', ' ) ),
            reifyText( `<code>${ identityIdSum }</code>` ),
            coords
                ? reifyText( identities.map( cycle => cycle.map( c => `(${ this.box[c] })` ) ).join( ', ' ) )
                : null,
            reifyText( `<code>${ identityPointsSum }</code>` ),
            reifyText( `<code>1</code>` ),
            reifyText( `<code>0</code>` ),
            reifyText( `<code>0</code>` ),
            identities[identities.length-1].htmlEquations( this ),
//            ...identities.flatMap( i => [ i.htmlEquations( this ), reify( 'br' ) ] ),
        ];

        const totals = this.getStats();

        const footerRow = [
            reifyText( '' ),
            reifyText( '' ),
            reifyText( `<code>${ totals.idSum }</code>` ),
            coords
                ? reifyText( '' )
                : null,
            reifyText( `<code>${ totals.coordSum }</code>` ),
            reifyText( `<code>${ this.order() }</code>` ),
            reifyText( `<code>${ totals.euclideanPerimeter }</code>` ),
            reifyText( `<code>${ totals.indexPerimeter }</code>` ),
            reifyText( '' )
        ];

        const orbits =  this.filter( cycle => cycle.length > 1 );

        return reify(
            "table",
             { 'cssClass': [ 'box-action' ] },
             [
                reify( "caption", {}, [ this.htmlSummary() ] ),
                reify( "tr", {}, headerRow.filter(h => h != null ).map( ( h, colIndex ) => reify( "th", {}, [ reifyText( h[0] ) ] ) ) ),
                reify( "tr", {}, identityRow.filter(h => h != null ).map( ir => reify( "td", {}, [ ir ] ) ) ),
                ...orbits
                    .map( orbit => [ orbit, orbit.getStats( this.box ) ] )
                    .map( ( [ orbit, stats ], i ) => reify(
                        "tr",
                        {},
                        [
                            reify( "td", {}, [ reify( "sup", {}, [ reifyText( `${ i + 1 }` ) ] ) ] ),
                            reify( "td", { cssClass: [ 'orbit' ] }, [ reifyText( `${ orbit }` ) ] ),
                            reify( "td", {}, [ reifyText( `${ stats.idSum }` ) ] ),
                            coords
                                ? reify( "td", { cssClass: [ 'orbit' ] }, [ reifyText( orbit.map( c => `(${ this.box[c] })` ) ) ] )
                                : null,
                            reify( "td", {}, [ reifyText( `(${ stats.coordSum.join( ', ' ) })` ) ] ),
                            reify( "td", {}, [ reifyText( `${ orbit.length }` ) ] ),
                            reify( "td", {}, [ reifyText( `${ stats.euclideanPerimeter }` ) ] ),
                            reify( "td", {}, [ reifyText( `${ stats.indexPerimeter }` ) ] ),
                            reify( "td", {}, [ orbit.htmlEquations( this ) ] )
                        ]
                ) ),
                reify( "tr", {}, footerRow.map( row => reify( "td", { 'cssClass': 'totals' }, [ row ] ) ) ),
             ] );
    };


AbstractBox.prototype.pointsDomNode = function() {
    const columns = [ '#', 'coord', 'indexes' ];
    return reify(
        'table',
        { 'class': 'box-action' },
        [
            reify( 'tr', {}, columns.map( column => reify( 'th', {}, [ reifyText( column ) ] ) ) ),
            ...this.points().map( (point, i) => reify(
                    'tr',
                    {},
                    [
                        reify( 'td', {}, [ reifyText( `${ i }` ) ] ),
                        reify( 'td', {}, [ reifyText( `${ point }` ) ] ),
                        reify( 'td', {}, [ reifyText( `${ point.indexes }` ) ] )
                    ]
                )
            )
        ]
    );
}


FactorialBox.prototype.pointsDomNode = function(
        cols = [ '#', 'label', 'monomial', 'index', 'cycles' ],
        caption = null) {
    const isInverse = (a,b) => {
        const a0 = [...a];
        a0[0] = (a0[0] + 1) % 2;
        return arrayExactlyEquals( a0, b );
    };
    const allColumns = [ 'label', 'alias', 'label-coord', 'coord', 'perm', 'anti-perm', 'bases', 'place-values',
        'inverse', 'i-label-coord', 'i-coord', 'match', 'monomial', 'index', 'cycles', 'diagram' ];
    const columns = [ '#', ...arrayIntersection( allColumns, cols ) ];
    const maybeDisplay = (label, domFn) => columns.includes( label ) ? domFn() : null;

    const points = this;
    return reify(
        'table',
        { 'class': 'box-action' },
        [
            caption
                ? reify( 'caption',{}, [ reifyText( caption ) ] )
                : reify( 'caption',{}, [ reifyText( `Points of [${ this.odometer.bases }]` ) ] ),
            reify(
                'tr',
                {},
                columns.map( column => reify( 'th', {}, [ reifyText( column ) ] ) )
            ),
            ...points.map( (point, i) => reify(
                    'tr',
                    {},
                    [
                        reify( 'td', {}, [ reifyText( `${ i }` ) ] ),
                        !columns.includes( 'label' ) ? null : reify( 'td', {}, [ reifyText( `${ point.label() }` ) ] ),
                        !columns.includes( 'alias' ) ? null : reify( 'td', {}, [ reifyText( point.cycles.others ? `[${ point.cycles.others.map(o => o.key).join("=") }]` : "" ) ] ) ,
                        !columns.includes( 'label-coord' ) ? null : reify( 'td', {}, [ reifyText( `${ point.labelCoord }` ) ] ),
                        !columns.includes( 'coord' ) ? null : reify( 'td', {}, [ reifyText( `(${ point })` ) ] ),
                        !columns.includes( 'perm' ) ? null : reify( 'td', {}, [ reifyText( `${ point.perm }` ) ] ),
                        !columns.includes( 'anti-perm' ) ? null : reify( 'td', {}, [ reifyText(
                            arrayExactlyEquals( point.perm, point.antiPerm )
                            ? ''
                            : `${ point.antiPerm }` ) ] ),
                        !columns.includes( 'bases' ) ? null : reify( 'td', {}, [ reifyText( `[${ point.bases }]` ) ] ),
                        !columns.includes( 'place-values' ) ? null : reify( 'td', {}, [ reifyText( `[${ point.placeValues }]` ) ] ),
                        maybeDisplay( 'inverse', () => reify( 'td', {}, [ reifyText( `${ point.inverse ? point.inverse.label() : '' }` ) ] ) ),
                        !columns.includes( 'i-label-coord' ) ? null : reify( 'td', {}, [ reifyText( `${ point.inverse.labelCoord }` ) ] ),
                        !columns.includes( 'i-coord' ) ? null : reify( 'td', {}, [ reifyText( `(${ point.inverse })` ) ] ),
                        !columns.includes( 'match' ) ? null : reify( 'td', {}, [ reifyText( isInverse( point.labelCoord, point.inverse.labelCoord ) ? '' : '0' ) ] ),
                        !columns.includes( 'monomial' ) ? null : reify( 'td', {}, [ point.cycles.htmlMonomial() ] ),
                        !columns.includes( 'index' ) ? null : reify( 'td', {}, [ reifyText( `[${ point.index }]` ) ] ),
                        !columns.includes( 'deindex' ) ? null : reify( 'td', {}, [ reifyText( `[${ point.deindex }]` ) ] ),
                        !columns.includes( 'i-index' ) ? null : reify( 'td', {}, [ reifyText( `(${ point.inverse.index })` ) ] ),
//                        !columns.includes( 'cycles' ) ? null : reify( 'td', {}, [ reifyText( `[${ point.cycles.map( cycle => `(${ cycle })` ).join('') }]` ) ] ),
                        !columns.includes( 'cycles' ) ? null : reify( 'td', {}, [
                            reifyText( point.cycles.identities().map( cycle => `(${ cycle })` ).join('') ),
                            reify( 'br' ),
                            ...point.cycles.orbits().flatMap( cycle => [ reifyText( `(${ cycle })` ), reify( 'br' ) ] ),
                        ] ),
                        maybeDisplay( 'diagram', () => reify( 'td', {}, [ point.cycles.x3dCycles() ] ) ),
                    ]
                )
            )
        ]
    );
}

function cyclesDomNode( actions, cols = [ 'label', 'alias', 'monomial', 'cycles', 'diagram' ], caption = null, monomialFilter = null, cyclesContainer = null ) {
    const allColumns = [
        'label',
        'others', 'alias', 'inverse', 'perms', 'parity', 'place-values',
        'monomial', 'perimeter', 'radiance', 'equations', 'index', 'cycles', 'diagram' ];
    const columns = [ '#', ...arrayIntersection( allColumns, cols ) ];

    const otherLabel = ( source ) => {
        const actions = Box.identifySources( source );
        return actions.length == 0
            ? ''
            : `${ actions.map( action => action.label()).join('=') }`;
    };
    const maybeDisplay = (label, domFn) => columns.includes( label ) ? domFn() : null;

    const monomialFilterMatches = ( m1, m2 ) => {
        const k1 = Object.keys( m1 );
        const k2 = Object.keys( m2 );
        if ( k1.length != k2.length ) {
            return false;
        } else {
            return k1.filter( k => m1[k] == m2[k] ).length == k1.length;
        }
    };

    const onRowSelectionFactory = ( cycles, source ) => {
        return ( event ) => {
            const classList = source.classList;

            if ( classList.contains( 'selected' ) ) {
                classList.remove( 'selected' );
                if ( cyclesContainer ) {
                    cyclesContainer.innerHTML = '';
                }
            } else {
                document
                    .querySelectorAll( '.selected' )
                    .forEach( s => s.classList.remove('selected'));
                classList.add( 'selected' );
                if ( cyclesContainer ) {
                    cyclesContainer.innerHTML = '';
                    cyclesContainer.appendChild( cycles.htmlTable( { 'coords': true } ) );
                }
                const monomialFilter = document.getElementById('monomialFilter');
                if ( monomialFilter ) {
                    monomialFilter.value = ( JSON.stringify( cycles.monomial() ) );
                }
                const cyclesDiagram = document.getElementById('boxDiagram');
                if ( cyclesDiagram ) {
                    cyclesDiagram.innerHTML = '';
                    cyclesDiagram.appendChild( cycles.x3dBoxes() );
                    x3dom.reload();
                }
            }
       };
    };

    return reify(
        'table',
        { 'class': 'box-action' },
        [
            caption ? reify( 'caption',{}, [ reifyText( caption ) ] ) : null,
            reify( 'tr', {}, columns.map( column => reify( 'th', {}, [ reifyText( column ) ] ) ) ),
            ...actions
                .filter( cycles => !monomialFilter || monomialFilterMatches( cycles.monomial(), monomialFilter ) )
                .map( (cycles, i) => reify(
                    'tr',
                    {},
                    [
                        reify( 'td', {}, [ reifyText( `${ i }` ) ] ),
                        maybeDisplay( 'label', () => reify( 'td', {}, [ reifyText( `${ cycles.label() }` ) ] ) ),
                        maybeDisplay( 'others', () => reify( 'td', {}, [ reifyText( otherLabel( cycles ) ) ] ) ),
                        maybeDisplay( 'alias', () => reify( 'td', {}, [ cycles.alias ? reifyText( cycles.alias ) : null ] ) ),
                        maybeDisplay( 'inverse', () => reify( 'td', {}, [ reifyText( `${ cycles.inverse ? cycles.inverse.label() : '-' }` ) ] ) ),
                        maybeDisplay( 'perms', () => reify( 'td', {}, [ reifyText( `${ cycles.perms() }` ) ] ) ),
                        maybeDisplay( 'parity', () => reify( 'td', {}, [ reifyText( `${ cycles.parity }` ) ] ) ),
                        maybeDisplay( 'place-values', () => reify( 'td', {}, [ reifyText( `${ cycles.placeValuePair() }` ) ] ) ),
                        maybeDisplay( 'monomial', () => reify( 'td', {}, [ cycles.htmlMonomial() ] ) ),
                        maybeDisplay( 'perimeter', () => reify( 'td', {}, [ reifyText( `${ cycles.getStats().euclideanPerimeter }` ) ] ) ),
                        maybeDisplay( 'radiance', () => reify( 'td', {}, [ reifyText( `${ cycles.getStats().indexPerimeter }` ) ] ) ),
                        maybeDisplay( 'equations', () => reify( 'td', {}, [ cycles.htmlEquations() ] ) ),
                        maybeDisplay( 'index', () => reify( 'td', {}, [ reifyText( `[${ cycles.index }]` ) ] ) ),
                        maybeDisplay( 'cycles', () => reify( 'td', {}, [
                            reifyText( cycles.identities().map( cycle => `(${ cycle })` ).join('') ),
                            reify( 'br' ),
                            ...cycles.orbits().flatMap( cycle => [ reifyText( `(${ cycle })` ), reify( 'br' ) ] ),

                        ] ) ),
                        maybeDisplay( 'diagram', () => reify( 'td', {}, [ cycles.x3dCycles() ] ) ),
                    ],
                    [
                        c => c.onclick = onRowSelectionFactory( cycles, c )
                    ]
                )
            )
        ]
    );
}


Box.prototype.cyclesDomNode = function( columns = [ '#', 'label', 'alias', 'perms', 'place-values', 'monomial', 'cycles', 'diagram' ], caption, monomialFilter, cyclesContainer ) {
    return cyclesDomNode( this.actions(), columns, caption ? caption : `Actions of [${ this.odometer.bases }]`, monomialFilter, cyclesContainer );
}

Box.prototype.indexesDomNode = function( actions ) {
    const columns = [ '#', 'label', 'perms', 'place-values', 'monomial', 'index'];

//    actions.sort( (a1, a2) => arrayReverseCompare( a1.label(), a2.label() ) );
    return reify(
        'table',
        { 'class': 'box-action' },
        [
            reify( 'tr', {}, columns.map( column => reify( 'th', {}, [ reifyText( column ) ] ) ) ),
            ...actions.map( (cycles, i) => reify(
                    'tr',
                    {},
                    [
                        reify( 'td', {}, [ reifyText( `${ i }` ) ] ),
                        reify( 'td', {}, [ reifyText( `${ cycles.label() }` ) ] ),
                        reify( 'td', {}, [ reifyText( `${ cycles.perms() }` ) ] ),
                        reify( 'td', {}, [ reifyText( `${ cycles.placeValuePair() }` ) ] ),
                        reify( 'td', {}, [ cycles.htmlMonomial() ] ),
//                        reify( 'td', {}, [ cycles.stats.idSum ] ),
//                        reify( 'td', {}, [ cycles.stats.coordSum ] ),
//                        reify( 'td', {}, [ cycles.stats.indexPerimeter ] ),
//                        reify( 'td', {}, [ cycles.stats.euclideanPerimeter ] ),
                            reify( 'td', {}, [ reifyText( cycles.index.join(',') ) ] )
                    ]
                )
            )
        ]
    );
}
