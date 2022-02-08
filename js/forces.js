


function minAbs( maxDelta, value ) {
    return value < 0
        ? Math.max( -1 * maxDelta, value )
        : Math.min( maxDelta, value );
}

function inverseForce( pointA, pointB, factor = 1, param = {} ) {
    const {
        minDist = 0.001,
        maxDelta = 0.01,
        minDelta = 0.001
    } = param;
    const d = displacement( pointA.coord, pointB.coord );
    const r2 = euclideanDistance2( d );
    const r = Math.sqrt( r2 );
    if ( r < minDist ) {
        return [ d, r, [ 0,0,0 ] ];
    }
    const u = normalize( d )
        .map( x => minAbs( maxDelta, factor * x / r ) )
        .map( x => Math.abs( x ) < minDelta ? 0 : x );
    return [ d, r, u ];
}


function inverseSquareForce( pointA, pointB, factor = 1, param = {} ) {
    const {
        minDist = 0.001,
        maxDelta = 0.0001,
        minDelta = 0.001
    } = param;
    const d = displacement( pointA.coord, pointB.coord );
    if ( d < minDist ) {
        return 0;
    }
    const r2 = euclideanDistance2( d );
    const r = Math.sqrt( r2 );
    if ( r < minDist ) {
        return [ d, r, [0,0,0] ];
    }
    const u = normalize( d )
        .map( x => minAbs( maxDelta, factor * x / r2 ) )
        .map( x => Math.abs( x ) < minDelta ? 0 : x );
    return [ d, r2, u ];
}

function springForce(  pointA, pointB, linkType, factor = 1, param = {} ) {
    const {
        minDist = 0.1,
        maxDelta = 0.01,
        minDelta = 0.001,
        rods = {
            '-1': [ 8, 0.01 ],
            '2': [ 2, 0.02 ],
            '3': [ 1, 0.03 ]
        }
    } = param;

    const d = displacement( pointA.coord, pointB.coord );

    const r2 = euclideanDistance2( d );
    const r = Math.sqrt( r2 );

    if ( r < minDist ) {
        return [ d, r, [0,0,0] ];
    }

    const rf = ( rods[ linkType ][0] - r );

    const delta = minAbs( maxDelta, rods[ linkType ][1] * rf );
    const u = normalize( d )
        .map( x => x * delta )
        .map( x => Math.abs( x ) < minDelta ? 0 : x );

    return [ d, r, u ];
}

function applyForces( points, param, onIteration ) {

    const {
        forces = [ 'origin', 'link' ],
        iterations = 100,
        tickTime = 100,
        minDist = 0.001,
        maxDelta = 0.001,
        originFactor = 1,
        pairFactor = 1
    } = param;

    param.running = true;

    const origin = { coord: [ 0, 0, 0 ] };
    const tick = ( iteration ) => {

        points.forEach( p => p.netForce = [ 0, 0, 0 ] );

        if ( forces.includes( 'origin' ) ) {
            points
                // only points that are not self inverse feel the origin force
                .filter( p => p.links.length == 0 || p.links.filter( ( [ linkPoint, exp ] ) => exp == -1 ).length > 0 )
                .forEach( p => {
                    const [ d, r2, u ] = inverseForce( origin, p, originFactor, param );
                    p.netForce = addition( p.netForce, u )
                } );
        }

        if ( forces.includes( 'pair' ) ) {
            // only points with non-inverse links feel the pair force
            const linkedPoints = points
                .filter( p => p.links
                    .filter( ( [ linkPoint, exp ] ) => exp != -1  ).length > 0 );
            const pointPairs = pairs( linkedPoints );
            const pointFactor = 1 / ( 1 + pointPairs.length );
            pointPairs.forEach( ( [ p1, p2 ] ) => {
                const [ d, r2, u ] = inverseSquareForce( p1, p2, pairFactor, param );
                const upf = scale( u, pointFactor );
                p1.netForce = addition( p1.netForce, upf);
                p2.netForce = subtraction( p2.netForce, upf );
            } );
        }

        if ( forces.includes( 'link' ) ) {
            points
                .forEach( p => {
                    const linkSum = p.links
                        .filter( link => p != link[0] )
                        .map( link => {
                               const [ d, r2, u ] = springForce( p, link[0], link[1], param );
                               link[0].netForce = addition( link[0].netForce, u );
                               return u;
                           } )
                        .reduce( ( a, c ) => addition( a, c ), [ 0, 0, 0 ] );
                    p.netForce = subtraction( p.netForce, linkSum );
                } );
        }

        // move point shapes
        points
            .forEach( p => {
                const nextCoord = addition( p.netForce, p.coord );
                if ( !arrayAlmostEqual( p.coord, nextCoord, minDist ) ) {
                    p.coord = nextCoord;
                    p.shape.setAttribute( "translation", nextCoord.join( ' ' ) );

                    p.moveLinks();
                }
            } );


        if ( iteration > 0 && param.running ) {
            setTimeout( tick, tickTime, iteration - 1 );
        }
        if ( onIteration ) {
            onIteration( iteration );
        }
    };
    if ( iterations > 0 && param.running ) {
        setTimeout( tick, tickTime, iterations );
    }
}