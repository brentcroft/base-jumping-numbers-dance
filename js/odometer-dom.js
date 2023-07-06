
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


FactorialBox.prototype.pointsDomNode = function() {
    const isInverse = (a,b) => {
        const a0 = [...a];
        a0[0] = (a0[0] + 1) % 2;
        return arrayExactlyEquals( a0, b );
    };
    const columns = [ '#', 'label', 'label-coord', 'coord', 'perm', 'anti-perm', 'bases', 'place-values', 'i-label', 'i-label-coord', 'i-coord', 'match'  ];
    const points = [...this.points()];
    points.sort( (p1, p2) => arrayCompare( p1.labelCoord, p2.labelCoord ) );
    return reify(
        'table',
        { 'class': 'box-action' },
        [
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
                        reify( 'td', {}, [ reifyText( `${ point.label }` ) ] ),
                        reify( 'td', {}, [ reifyText( `${ point.labelCoord }` ) ] ),
                        reify( 'td', {}, [ reifyText( `(${ point })` ) ] ),
                        reify( 'td', {}, [ reifyText( `${ point.perm }` ) ] ),
                        reify( 'td', {}, [ reifyText(
                            arrayExactlyEquals( point.perm, point.antiPerm )
                            ? ''
                            : `${ point.antiPerm }` ) ] ),
                        reify( 'td', {}, [ reifyText( `[${ point.bases }]` ) ] ),
                        reify( 'td', {}, [ reifyText( `[${ point.placeValues }]` ) ] ),
                        reify( 'td', {}, [ reifyText( `${ point.inverse.label }` ) ] ),
                        reify( 'td', {}, [ reifyText( `${ point.inverse.labelCoord }` ) ] ),
                        reify( 'td', {}, [ reifyText( `(${ point.inverse })` ) ] ),
                        reify( 'td', {}, [ reifyText( isInverse( point.labelCoord, point.inverse.labelCoord ) ? '' : '0' ) ] )
                    ]
                )
            )
        ]
    );
}

Box.prototype.actionsDomNode = function() {
    const columns = [ '#', 'label', 'perms', 'place-values', 'monomial' ];

    this.actions.sort( (a1, a2) => arrayReverseCompare( a1.label(), a2.label() ) );
    return reify(
        'table',
        { 'class': 'box-action' },
        [
            reify( 'tr', {}, columns.map( column => reify( 'th', {}, [ reifyText( column ) ] ) ) ),
            ...this.actions.map( (cycles, i) => reify(
                    'tr',
                    {},
                    [
                        reify( 'td', {}, [ reifyText( `${ i }` ) ] ),
                        reify( 'td', {}, [ reifyText( `${ cycles.label() }` ) ] ),
                        reify( 'td', {}, [ reifyText( `${ cycles.perms() }` ) ] ),
                        reify( 'td', {}, [ reifyText( `${ cycles.placeValuePair() }` ) ] ),
                        reify( 'td', {}, [ cycles.htmlMonomial() ] ),
//                            reify( 'td', {}, [ reifyText( cycles.map( cycle => `(${ cycle.join(',') })` ).join('') ) ] )
                    ]
                )
            )
        ]
    );
}
