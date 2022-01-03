function roots( index, stride ) {
    const source = [...index];
    const base = source.length;

    // no twists below three
    if ( base <= 2 ) {
        return [ source ];
    }

    function twist( source, stride = 2 ) {
        const base = source.length;
        const tally = new Array( base ).fill( 0 );
        const sink = [];
        for ( var i = 0; i < base; i++ ) {
            const j = ( i * stride ) % base;
            if (tally[ j ] ) {
                const msg = `Common Factor: Index length ${ base } repeats [${ sink}] length ${ sink.length }`;
                throw new Error( msg );
            }
            tally[ j ] = 1;
            sink.push( source[ j ] );
        }
        return sink
    }

    const currentRoots = [ index ];
    var locus = twist( index, stride );
    while ( !arrayExactlyEquals( index, locus ) ) {
        currentRoots.push( locus );
        locus = twist( locus, stride );
    }
    return currentRoots;
}

function permulate( index = [ 0, 1, 2, 3, 4, 5, 6, 7, 8 ], stride = 1, offset = 0 ) {
    const source = [...index];
    const sink = [];
    const base = source.length;
    for ( var i = 0; i < ( base / stride ); i++ ) {
        const j = ( offset + ( i * stride ) ) % base;
        sink[ i ] = source[ j ];
    }
    return sink;
}

function permulates( index, stride ) {
    const ps = [];
    for ( var i = 0; i < stride; i ++ ) {
        const p = permulate( index, stride, i );
        ps.push( p );
    }
    return ps;
}


function orbitation( index ) {

    const primeStrides = primeFactors( index.length )
        .filter( f => f != index.length )
        .filter( f => f != 1 )
        .reverse();

    var p = [ index ];

    function atDepth( p, f, d ) {
        if ( p.length > 0 ) {
            if ( Array.isArray( p[0] ) ) {
                 return p.map( (b, i) => atDepth( b, f, d ) )
            } else if ( p.length >= d ) {
                return f( p, d );
            }
        }
        return p;
    }

    var length = index.length;

    while ( primeStrides.length > 0 ) {
        const primeStride = primeStrides.pop();
        if ( primeStride != length ) {
            p = p.map( (b, i) => atDepth( b, permulates, primeStride ) );
            length = length / primeStride;
        }
    }

    p = p.map( (b, i) => atDepth( b, roots, 2 ) );

    return p;
}

function rootsOf( base, stride ) {
    return roots( arrayOfIndexes( base ), stride )
}
