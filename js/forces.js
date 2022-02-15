


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
        return [ d, r, [ 0, 0, 0 ] ];
    }
    const u = normalize( d )
        .map( x => minAbs( maxDelta, factor * x / r ) )
        .map( x => Math.abs( x ) < minDelta ? 0 : x );
    return [ d, r, u ];
}


function inverseSquareForce( pointA, pointB, param = {} ) {
    const {
        minDist = 0.001
    } = param;
    const d = displacement( pointA.coord, pointB.coord );
    const r2 = euclideanDistance2( d );
    const r = Math.sqrt( r2 );
    if ( r < minDist ) {
        return [ d, r, [ 0, 0, 0 ] ];
    }
    const u = normalize( d );
    return [ d, r2, u ];
}

function springForce(  pointA, pointB, linkType, param = {}, linkParam = [] ) {
    const {
        minDist = 0.1,
        maxDelta = 0.01,
        minDelta = 0.001
    } = param;

    const d = displacement( pointA.coord, pointB.coord );
    const r2 = euclideanDistance2( d );
    const r = Math.sqrt( r2 );

    if ( r < minDist ) {
        return [ d, r, [ 0, 0, 0 ] ];
    }

    const [ _, springLength, springFactor ] = linkParam.find( lp => lp[0] == linkType );

    const restoringForce = springFactor * ( springLength - r );
    const delta = minAbs( maxDelta, restoringForce );

    const u = normalize( d )
        .map( x => x * delta )
        .map( x => Math.abs( x ) < minDelta ? 0 : x );

    return [ d, r, u ];
}

function applyForces( orb, param, onIteration ) {

    const [ points, linkParam ] = [ orb.points, orb.linkParam ];

    const {
        forces = [ 'origin', 'link' ],
        iterations = 100,
        tickTime = 100,
        minDist = 0.001,
        maxDelta = 0.001,
        originFactor = 1,
        pairFactor = 1,
        burst = 100,
        newtonian = true,
        friction = 0.99
    } = param;

    param.running = true;

    const origin = { coord: [ 0, 0, 0 ] };
    const tick = ( iteration, burst ) => {

        for ( var b = 0; b < burst; b++ ) {

            points.forEach( p => p.netForce = [ 0, 0, 0 ] );

            if ( forces.includes( 'origin' ) ) {
                points
                    // only points that are not self inverse feel the origin force
                    //.filter( p => p.links.length == 0 || p.links.filter( ( [ linkPoint, exp ] ) => exp == -1 ).length > 0 )
                    .forEach( p => {
                        const [ d, r2, u ] = inverseForce( origin, p, orb.param.originFactor, orb.param );
                        p.netForce = addition( p.netForce, u )
                    } );
            }

            if ( forces.includes( 'pair' ) ) {
                // only points with non-inverse links feel the pair force
                const linkedPoints = points
                    .filter( p => p.links.filter( ( [ linkPoint, exp ] ) => exp != -1  ).length > 0 );
                const pointPairs = pairs( linkedPoints );
                if ( pointPairs.length > 0 ) {
                    const pointFactor = orb.param.pairFactor / pointPairs.length;
                    pointPairs.forEach( ( [ p1, p2 ] ) => {
                        const [ d, r2, u ] = inverseSquareForce( p1, p2, orb.param );
                        const upf = scale( u, pointFactor );
                        p1.netForce = addition( p1.netForce, upf);
                        p2.netForce = subtraction( p2.netForce, upf );
                    } );
                }
            }

            if ( forces.includes( 'link' ) ) {
                const linkForceAdjuster = ( point, force, link ) => {
                    const [ otherPoint, exp, pIsCoFac, opIsCoFac ] = link;

                    const [ d, r2, u ] = springForce( point, otherPoint, exp, orb.param, linkParam );
                    link[0].netForce = addition( link[0].netForce, u );

                    const f = pIsCoFac && opIsCoFac
                        ? 1
                        : pIsCoFac || opIsCoFac
                            ? 0.5
                            : 0.1;

                    return scale( u, 1 );
                };

                points
                    .forEach( p => {
                        const linkSum = p.links
                            .filter( link => p != link[0] )
                            .map( link => linkForceAdjuster( p, link[0].netForce, link ) )
                            .reduce( ( a, c ) => addition( a, c ), [ 0, 0, 0 ] );
                        p.netForce = subtraction( p.netForce, linkSum );
                    } );
            }
        }

        if ( newtonian ) {
            points
                .forEach( p => {
                    const acceleration = scale( p.netForce, 1 / p.mass );
                    const nextVelocity = scale( addition( acceleration, p.velocity ), friction );

                    if ( !arrayAlmostEqual( p.velocity, nextVelocity, minDist ) ) {
                        p.velocity = nextVelocity;
                        const nextCoord = addition( p.velocity, p.coord );
                        if ( !arrayAlmostEqual( p.coord, nextCoord, minDist ) ) {
                            p.coord = nextCoord;
                            if ( p.move() ) {
                                p.moveLinks();
                            }
                        }
                    }
                } );
        } else {
            points
                .forEach( p => {
                    const nextCoord = addition( p.netForce, p.coord );
                    if ( !arrayAlmostEqual( p.coord, nextCoord, minDist ) ) {
                        p.coord = nextCoord;
                        if ( p.move() ) {
                            p.moveLinks();
                        }
                    }
                } );
        }



        if ( iteration > 0 && param.running ) {
            setTimeout( tick, tickTime, iteration - 1, burst );
        }
        if ( onIteration ) {
            onIteration( iteration );
        }
    };
    if ( iterations > 0 && param.running ) {
        setTimeout( tick, tickTime, iterations, burst );
    }
}