
function showHideCSS( selector ) {
    document
        .querySelectorAll( selector )
        .forEach( c => {
            var s = c.style.display;
            if ( s == '' ) {
                c.style.display  =  'none';
            } else {
                c.style.display  =  '';
            }
        } );
}

function showHide( id, control ) {
    const force = control ? control.checked ? 1 : -1 : 0;
    var c = document.getElementById( id );
    if ( c ) {
        var s = c.style.display;
        if ( ( force && force != -1 ) || s != '' ) {
            c.style.display  =  '';
        } else {
            c.style.display  =  'none';
        }
    }
}

function showHideAll( ids = [], control ) {
    ids.forEach( id => showHide( id, control ) );
}



Cycles.prototype.cyclesView = {
    'normal': { orientation: '-1 -1 0 0.5', position: '-3.5 2.4 7' },
    'default': { width: '100%', height: '100%', orientation: '-1 -1 0 0.5', position: '-3.5 2.4 7' },
    'resizable': { width: '100%', height: '100%', orientation: '-1 -1 0 0.5', position: '-3.5 2.4 7' },
    'short': { width: '100%', height: '100%', orientation: '1 0 0 -1.6', position: '0 3.5 0' },
    'table': { width: '200px', height: '100px', orientation: '0 0 0 1', position: '0 0 10' },
};

Cycles.prototype.x3dCycles = function( param = { 'toggles': ['lines'] }, view = 'table' ) {
    return buildX3DomRootNode( getCyclesDiagram( this, param ), this.cyclesView[ view ] );
}

Cycles.prototype.boxesView = {
    'default': { width: '100%', height: '92%', orientation: '0 0 0 1', position: '0 2 20' },
    'table': { width: '200px', height: '100px', orientation: '0 0 0 1', position: '0 0 10' },
};

Cycles.prototype.x3dBoxes = function( param = { 'toggles': ['lines', 'grid', 'plane', 'centres'] }, view = 'default' ) {
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
Cycles.prototype.htmlTableColumns = [ 'orbit', 'id-sum', 'coords-sum', 'order', 'per2', 'rad' ];
Cycles.prototype.htmlTableDiagramOptions = [];
Cycles.prototype.htmlTable = function() {

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

    const allColumns = [ 'orbit', 'id-sum', 'coords', 'coords-sum', 'order', 'per2', 'rad', 'equations' ];
    const columns = [ '#', ...arrayIntersection( allColumns, this.htmlTableColumns ) ];

    const maybeDisplay = (label, domFn) => this.htmlTableColumns.includes( label ) ? domFn() : null;


    const tableContainer = reify( 'div' );
    const diagramContainer = reify( 'div', { 'style': 'border: solid black 1px; resize: both; overflow: auto; width: 100%; height: 300px;' } );

    const showOrbit = ( orbitId ) => {
        const orbits = diagramContainer.querySelectorAll( ".orbit-line" );
        orbits.forEach( orbitElement => {
            if ( !orbitId ) {
                orbitElement.setAttribute( "render", true );
                orbitElement.classList.remove("selected");
            } else if ( orbitId == orbitElement.id ) {
                if ( orbitElement.classList.contains( "selected" ) ) {
                    orbitElement.setAttribute( "render", false );
                    orbitElement.classList.remove("selected");
                } else {
                    orbitElement.setAttribute( "render", true );
                    orbitElement.classList.add("selected");
                }
            } else if ( 'orbit.e' == orbitElement.id ) {
                orbitElement.setAttribute( "render", true );
                orbitElement.classList.remove("selected");
            } else {
                orbitElement.setAttribute( "render", false );
                orbitElement.classList.remove("selected");
            }
        });
    }

    const onRowSelectionFactory = ( source ) => {
        return ( event ) => {
            const classList = source.classList;
            if ( classList.contains( 'selected' ) ) {
                classList.remove( 'selected' );
            } else {
                tableContainer
                    .querySelectorAll( '.selected' )
                    .forEach( s => s.classList.remove('selected'));
                if ( source.id ) {
                    classList.add( 'selected' );
                }
            }
            showOrbit( source.id );
       };
    };

    const identityRow = () => [
        reifyText( '<code>e</code>' ),
        maybeDisplay( 'orbit', () => reifyText( identities.map( cycle => `(${ cycle })` ).join( ', ' ) ) ),
        maybeDisplay( 'id-sum', () => reifyText( `<code>${ identityIdSum }</code>` ) ),
        maybeDisplay( 'coords', () => reifyText( identities.map( cycle => cycle.map( c => `(${ this.box[c] })` ) ).join( ', ' ) ) ),
        maybeDisplay( 'coords-sum', () => reifyText( `<code>(${ identityPointsSum })</code>` ) ),
        maybeDisplay( 'order', () => reifyText( `<code>1</code>` ) ),
        maybeDisplay( 'per2', () => reifyText( `<code>0</code>` ) ),
        maybeDisplay( 'rad', () => reifyText( `<code>0</code>` ) ),
        maybeDisplay( 'equations', () => identities[identities.length-1].htmlEquations( this ) ),
    ].filter( h => h );

    const totals = this.getStats();

    const footerRow = () => [
        reifyText( '' ),
        maybeDisplay( 'orbit', () => reifyText( '' ) ),
        maybeDisplay( 'id-sum', () => reifyText( `<code>${ totals.idSum }</code>`, { 'class': 'sum-total' } ) ),
        maybeDisplay( 'coords', () => reifyText( '' ) ) ,
        maybeDisplay( 'coords-sum', () => reifyText( `<code>${ totals.coordsSum }</code>`, { 'class': 'sum-total' } ) ),
        maybeDisplay( 'order', () => reifyText( `<code>${ this.order() }</code>`, { 'class': 'sum-total' } ) ),
        maybeDisplay( 'per2', () => reifyText( `<code>${ totals.euclideanPerimeter }</code>`, { 'class': 'sum-total' } ) ),
        maybeDisplay( 'rad', () => reifyText( `<code>${ totals.indexPerimeter }</code>`, { 'class': 'sum-total' } ) ),
        maybeDisplay( 'equations', () => reifyText( '' ) )
    ].filter(h => h );


    const tableRenderer = (orbits) => reify(
        "table",
         { 'cssClass': [ 'box-action' ] },
         [
            reify( "caption", {}, [ this.htmlSummary() ] ),
            reify( 'tr', {}, [ '#', ...arrayIntersection( allColumns, columns ) ].map( column => reify( 'th', {}, [ reifyText( column ) ] ) ) ),
            reify( "tr", { 'id': 'orbit.e' }, identityRow().map( ir => reify( "td", {}, [ ir ] ) ), [ c => c.onclick = onRowSelectionFactory( c ) ] ),
            ...orbits
                .map( orbit => [ orbit, orbit.getStats( this.box ) ] )
                .map( ( [ orbit, stats ], i ) => reify(
                    "tr",
                    { 'id': `orbit.${ i }` },
                    [
                        reify( "td", {}, [ reify( "sup", {}, [ reifyText( `${ i + 1 }` ) ] ) ] ),
                        maybeDisplay( 'orbit', () => reify( "td", { cssClass: [ 'orbit' ] }, [ reifyText( `(${ orbit })` ) ] ) ),
                        maybeDisplay( 'id-sum', () => reify( "td", {}, [ reifyText( `${ stats.idSum }` ) ] ) ),
                        maybeDisplay( 'coords', () => reify( "td", { cssClass: [ 'orbit' ] }, [ reifyText( orbit.map( c => `(${ this.box[c] })` ) ) ] ) ),
                        maybeDisplay( 'coords-sum', () => reify( "td", {}, [ reifyText( `(${ stats.coordsSum.join( ', ' ) })` ) ] ) ),
                        maybeDisplay( 'order', () => reify( "td", {}, [ reifyText( `${ orbit.length }` ) ] ) ),
                        maybeDisplay( 'per2', () => reify( "td", {}, [ reifyText( `${ stats.euclideanPerimeter }` ) ] ) ),
                        maybeDisplay( 'rad', () => reify( "td", {}, [ reifyText( `${ stats.indexPerimeter }` ) ] ) ),
                        maybeDisplay( 'equations', () => reify( "td", {}, [ orbit.htmlEquations( this ) ] ) )
                    ],
                    [ c => c.onclick = onRowSelectionFactory( c ) ]
            ) ),
            reify( "tr", {}, footerRow().map( col => reify( "td", {}, [ col ] ) ), [ c => c.onclick = onRowSelectionFactory( c ) ] ),
         ] );
    const orbits =  this.filter( cycle => cycle.length > 1 );
    const columnSelectors = allColumns
        .map( (column,i) => reify( 'label', { 'class': 'columnSelector' }, [
            i == 0 ? null : reifyText( '| ' ),
            reifyText( column ),
            reify( 'input', { 'type': 'checkbox', 'checked': ( columns.includes( column ) ? 'checked' : '' ) }, [], [
                c => c.onchange = () => {
                    if ( !c.checked && this.htmlTableColumns.includes( column ) ) {
                        this.htmlTableColumns.splice( this.htmlTableColumns.indexOf(column), 1 );
                        columns.length = 0;
                        columns.push( '#', ...arrayIntersection( allColumns, this.htmlTableColumns ) );
                        tableContainer.innerHTML = '';
                        tableContainer.appendChild( tableRenderer( orbits ) );

                    } else if ( c.checked && !this.htmlTableColumns.includes( column ) ) {
                        this.htmlTableColumns.push( column );
                        columns.length = 0;
                        columns.push( '#', ...arrayIntersection( allColumns, this.htmlTableColumns ) );
                        tableContainer.innerHTML = '';
                        tableContainer.appendChild( tableRenderer( orbits ) );
                    }
                }
            ] )
        ] ) );

    const allDiagramOptions = [ '3d' ];
    const diagramOptions = arrayIntersection( allDiagramOptions, this.htmlTableDiagramOptions );
    const replaceDiagram = () => {
        diagramContainer.innerHTML = '';
        diagramContainer.appendChild(
            diagramOptions.includes( '3d' )
                ? this.x3dBoxes()
                : this.x3dCycles( param = { 'toggles': ['lines'] }, view = 'resizable' )
        );
    };
    const diagramOptionsSelectors = allDiagramOptions
        .map( (diagramOption,i) => reify( 'label', { 'class': 'columnSelector' }, [
            i == 0 ? null : reifyText( '| ' ),
            reifyText( diagramOption ),
            reify( 'input', { 'type': 'checkbox', 'checked': ( this.htmlTableDiagramOptions.includes( diagramOption ) ? 'checked' : '' ) }, [], [
                c => c.onchange = () => {
                    if ( !c.checked && this.htmlTableDiagramOptions.includes( diagramOption ) ) {
                        this.htmlTableDiagramOptions.splice( this.htmlTableDiagramOptions.indexOf(diagramOption), 1 );
                        diagramOptions.length = 0;
                        diagramOptions.push( ...arrayIntersection( allDiagramOptions, this.htmlTableDiagramOptions ) );
                        replaceDiagram();
                        x3dom.reload();

                    } else if ( c.checked && !this.htmlTableDiagramOptions.includes( diagramOption ) ) {
                        this.htmlTableDiagramOptions.push( diagramOption );
                        diagramOptions.length = 0;
                        diagramOptions.push( ...arrayIntersection( allDiagramOptions, this.htmlTableDiagramOptions ) );
                        replaceDiagram();
                        x3dom.reload();
                    }
                }
            ] )
        ] ) );

    const diagramLegend = reify( 'div', { 'class': 'legend' }, [
        reifyText( '[ a, r, u | e, f, l, w, <space> ] see: ' ),
        reify( 'a', { 'href': 'https://doc.x3dom.org/tutorials/animationInteraction/navigation/index.html', 'target': '_blank' }, [
            reifyText( 'x3dom navigation tutorial' )
        ] )
    ] );

    const tableLegend = reify( 'div', { 'class': 'legend' }, [
        reifyText( 'Click on a cell to select/deselect or on a totals cell to draw all.' )
    ] );

    tableContainer.appendChild( tableRenderer( orbits ) );
    replaceDiagram();

    return reify( 'div', {}, [
        reify( 'div', {}, [
            reify( 'label', { 'class': 'columnSelector' }, [ reifyText( 'diagram: ' ) ] ),
            ...diagramOptionsSelectors
        ] ),

        diagramContainer,
        diagramLegend,
        reify( 'div', {}, [
            reify( 'label', { 'class': 'columnSelector' }, [ reifyText( 'columns: ' ) ] ),
            ...columnSelectors
        ] ),
        tableContainer,
        tableLegend
    ]);
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


const actionsHtmlTableColumns = [
    'box',
    'label', 'alias', 'others',
    'box',
    'monomial',
    'parity',
    'id-sum',
    'coords-sum',
    'perimeter',
    'radiance',
    'order',
    'volume'
];

function cyclesDomNode( actions, caption = null, monomialFilter = null ) {
    const allColumns = [
        'box', 'label',
        'others',
        'alias',
        'inverse',
        'perms',
        'parity',
        'place-values',
        'C',
        'monomial',
        'volume',
        'order',
        'id-sum',
        'coords-sum',
        'perimeter',
        'radiance',
        'index',
        'cycles',
        'diagram'
    ];
    const columns = [ '#', ...arrayIntersection( allColumns, actionsHtmlTableColumns ) ];

    const otherLabel = ( source ) => {
        const actions = Box.identifySources( source );
        return actions.length == 0
            ? ''
            : `${ actions.map( action => action.label()).join('=') }`;
    };
    const otherPerm = ( source ) => {
        const actions = Box.identifySources( source );
        return actions.length == 0
            ? ''
            : actions[0].perms();
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

    const tableContainer = reify( 'div' );
    const cyclesContainer = reify( 'div' );

    const onRowSelectionFactory = ( cycles, source ) => {
        return ( event ) => {
            const classList = source.classList;

            if ( classList.contains( 'selected' ) ) {
                classList.remove( 'selected' );
                if ( cyclesContainer ) {
                    cyclesContainer.innerHTML = '';
                }
            } else {
                tableContainer
                    .querySelectorAll( '.selected' )
                    .forEach( s => s.classList.remove('selected'));
                classList.add( 'selected' );

                if ( cyclesContainer ) {
                    cyclesContainer.innerHTML = '';
                    cyclesContainer.appendChild( reify( 'hr' ) );
                    cyclesContainer.appendChild( cycles.htmlTable() );
                    x3dom.reload();
                }

                const monomialFilter = document.getElementById('monomialFilter');
                if ( monomialFilter ) {
                    monomialFilter.value = ( JSON.stringify( cycles.monomial() ) );
                    monomialFilterDisplay.innerHTML = '';
                    monomialFilterDisplay.appendChild( cycles.htmlMonomial() );
                }
            }
       };
    };

    const tableRenderer = (actions) => reify(
        'table',
        { 'class': 'box-action' },
        [
            caption ? reify( 'caption',{}, [ reifyText( caption ) ] ) : null,
            reify(
                'tr',
                {},
                [ '#', ...arrayIntersection( allColumns, columns ) ]
                    .map( column => reify( 'th', {}, [ reifyText( column ) ] ) )
            ),
            ...actions
                .filter( cycles => !monomialFilter || monomialFilterMatches( cycles.monomial(), monomialFilter ) )
                .map( (cycles, i) => reify(
                    'tr',
                    {
                        'id': `orbit-${ i }`
                    },
                    [
                        reify( 'td', {}, [ reifyText( `${ i }` ) ] ),
                        maybeDisplay( 'box', () => reify( 'td', {}, [ reifyText( `[${ cycles.getBases() }]` ) ] ) ),
                        maybeDisplay( 'label', () => reify( 'td', {}, [ reifyText( `${ cycles.label() }` ) ] ) ),
                        maybeDisplay( 'others', () => reify( 'td', {}, [ reifyText( otherLabel( cycles ) ) ] ) ),
                        maybeDisplay( 'alias', () => reify( 'td', {}, [ cycles.alias ? reifyText( cycles.alias ) : null ] ) ),
                        maybeDisplay( 'inverse', () => reify( 'td', {}, [ reifyText( `${ cycles.inverse ? cycles.inverse.label() : '-' }` ) ] ) ),
                        maybeDisplay( 'perms', () => reify( 'td', {}, [ reifyText( `${ cycles.perms() }` ) ] ) ),
                        maybeDisplay( 'parity', () => reify( 'td', {}, [ reifyText( `${ arrowUp( cycles.parity ) }` ) ] ) ),
                        maybeDisplay( 'place-values', () => reify( 'td', {}, [ reifyText( `${ cycles.placeValuePair() }` ) ] ) ),
                        maybeDisplay( 'C', () => reify( 'td', {}, [ reifyText( `${ cycles.C() }` ) ] ) ),
                        maybeDisplay( 'monomial', () => reify( 'td', {}, [ cycles.htmlMonomial() ] ) ),
                        maybeDisplay( 'volume', () => reify( 'td', {}, [ reifyText( `${ cycles.getVolume() }` ) ] ) ),
                        maybeDisplay( 'order', () => reify( 'td', {}, [ reifyText( `${ cycles.order() }` ) ] ) ),
                        maybeDisplay( 'id-sum', () => reify( 'td', {}, [ reifyText( `${ cycles.getStats().idSum }` ) ] ) ),
                        maybeDisplay( 'coords-sum', () => reify( 'td', {}, [ reifyText( `(${ cycles.getStats().coordsSum })` ) ] ) ),
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
    const columnSelectors = allColumns
        .map( (column,i) => reify( 'label', { 'class': 'columnSelector' }, [
            i == 0 ? null : reifyText( '| ' ),
            reifyText( column ),
            reify( 'input', { 'type': 'checkbox', 'checked': ( actionsHtmlTableColumns.includes( column ) ? 'checked' : '' ) }, [], [
                c => c.onchange = () => {
                    if ( !c.checked && actionsHtmlTableColumns.includes( column ) ) {
                        actionsHtmlTableColumns.splice( actionsHtmlTableColumns.indexOf(column), 1 );
                        columns.length = 0;
                        columns.push( '#', ...arrayIntersection( allColumns, actionsHtmlTableColumns ) );
                        tableContainer.innerHTML = '';
                        tableContainer.appendChild( tableRenderer( actions ) );

                    } else if ( c.checked && !actionsHtmlTableColumns.includes( column ) ) {
                        actionsHtmlTableColumns.push( column );
                        columns.length = 0;
                        columns.push( '#', ...arrayIntersection( allColumns, actionsHtmlTableColumns ) );
                        tableContainer.innerHTML = '';
                        tableContainer.appendChild( tableRenderer( actions ) );
                        if ( columns.includes( 'diagram')) {
                            x3dom.reload();
                        }
                    }
                }
            ] )
        ] ) );
    tableContainer.appendChild( tableRenderer(actions) );
    return reify( 'div', {}, [
        reify('div', {}, [
            reify( 'label', { 'class': 'columnSelector' }, [ reifyText( 'columns: ' ) ] ),
            ...columnSelectors
        ] ),
        tableContainer,
        cyclesContainer
    ]);
}


Box.prototype.cyclesDomNode = function( caption, monomialFilter, cyclesContainer ) {
    return cyclesDomNode( this.actions(), caption ? caption : `Actions of [${ this.odometer.bases }]`, monomialFilter, cyclesContainer );
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
