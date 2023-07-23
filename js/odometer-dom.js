
Cycles.prototype.view = {
    'normal': { orientation: '-1 -1 0 0.5', position: '-3.5 2.4 7' },
    'default': { width: '100%', height: '100%', orientation: '-1 -1 0 0.5', position: '-3.5 2.4 7' },
    'resizable': { width: '100%', height: '90%', orientation: '-1 -1 0 0.5', position: '-3.5 2.4 7' },
    'short': { width: '100%', height: '100%', orientation: '1 0 0 -1.6', position: '0 3.5 0' },
    'table': { width: '150px', height: '60px', orientation: '0 0 0 1', position: '0 0 10' },
};

Cycles.prototype.x3dCycles = function( param = { 'toggles': ['lines'] }, view = 'table' ) {
    return buildX3DomRootNode( getCyclesDiagram( this, param ), this.view[ view ] );
}


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
        columns = [ '#', 'label', 'label-coord', 'coord', 'perm', 'anti-perm', 'bases', 'place-values', 'i-label', 'i-label-coord', 'i-coord', 'match', 'monomial', 'index', 'cycles' ],
        caption = null) {
    const isInverse = (a,b) => {
        const a0 = [...a];
        a0[0] = (a0[0] + 1) % 2;
        return arrayExactlyEquals( a0, b );
    };
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
                        !columns.includes( 'i-label' ) ? null : reify( 'td', {}, [ reifyText( `${ point.inverse.label() }` ) ] ),
                        !columns.includes( 'i-label-coord' ) ? null : reify( 'td', {}, [ reifyText( `${ point.inverse.labelCoord }` ) ] ),
                        !columns.includes( 'i-coord' ) ? null : reify( 'td', {}, [ reifyText( `(${ point.inverse })` ) ] ),
                        !columns.includes( 'match' ) ? null : reify( 'td', {}, [ reifyText( isInverse( point.labelCoord, point.inverse.labelCoord ) ? '' : '0' ) ] ),
                        !columns.includes( 'monomial' ) ? null : reify( 'td', {}, [ point.cycles.htmlMonomial() ] ),
                        !columns.includes( 'index' ) ? null : reify( 'td', {}, [ reifyText( `[${ point.index }]` ) ] ),
                        !columns.includes( 'deindex' ) ? null : reify( 'td', {}, [ reifyText( `[${ point.deindex }]` ) ] ),
                        !columns.includes( 'i-index' ) ? null : reify( 'td', {}, [ reifyText( `(${ point.inverse.index })` ) ] ),
                        !columns.includes( 'cycles' ) ? null : reify( 'td', {}, [ reifyText( `[${ point.cycles.map( cycle => `(${ cycle })` ).join('') }]` ) ] ),
                    ]
                )
            )
        ]
    );
}

function cyclesDomNode( actions, columns = [ '#', 'label', 'alias', 'perms', 'place-values', 'monomial', 'cycles', 'diagram' ], caption = null ) {
    return reify(
        'table',
        { 'class': 'box-action' },
        [
            caption ? reify( 'caption',{}, [ reifyText( caption ) ] ) : null,
            reify( 'tr', {}, columns.map( column => reify( 'th', {}, [ reifyText( column ) ] ) ) ),
            ...actions.map( (cycles, i) => reify(
                    'tr',
                    {},
                    [
                        reify( 'td', {}, [ reifyText( `${ i }` ) ] ),
                        !columns.includes( 'label' ) ? null : reify( 'td', {}, [ reifyText( `${ cycles.label() }` ) ] ) ,
                        !columns.includes( 'alias' ) ? null : reify( 'td', {}, [ reifyText( `"${ cycles.alias }"` ) ] ) ,
//                        !columns.includes( 'others' ) ? null : reify( 'td', {}, [ reifyText( cycles.others ? `[${ cycles.others.map(o => o.key).join("=") }]` : "" ) ] ) ,
                        !columns.includes( 'perms' ) ? null : reify( 'td', {}, [ reifyText( `${ cycles.perms() }` ) ] ),
                        !columns.includes( 'place-values' ) ? null : reify( 'td', {}, [ reifyText( `${ cycles.placeValuePair() }` ) ] ),
                        !columns.includes( 'monomial' ) ? null : reify( 'td', {}, [ cycles.htmlMonomial() ] ),
                        !columns.includes( 'index' ) ? null : reify( 'td', {}, [ reifyText( `[${ cycles.index }]` ) ] ),
                        !columns.includes( 'cycles' ) ? null : reify( 'td', {}, [
                            reifyText( cycles.identities().map( cycle => `(${ cycle })` ).join('') ),
                            reify( 'br' ),
                            ...cycles.orbits().flatMap( cycle => [ reifyText( `(${ cycle })` ), reify( 'br' ) ] ),

                        ] ),
                        !columns.includes( 'diagram' ) ? null : reify( 'td', {}, [ cycles.x3dCycles() ] ),
                    ]
                )
            )
        ]
    );
}


Box.prototype.cyclesDomNode = function( columns = [ '#', 'label', 'alias', 'perms', 'place-values', 'monomial', 'cycles', 'diagram' ], caption = null ) {
    return cyclesDomNode( this.actions(), columns, caption ? caption : `Actions of [${ this.odometer.bases }]` );
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
