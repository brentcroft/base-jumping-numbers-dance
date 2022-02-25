


function minAbs( maxDelta, value ) {
    return value < 0
        ? Math.max( -1 * maxDelta, value )
        : Math.min( maxDelta, value );
}

function inverseForce( pointA, pointB, param = {} ) {
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
    const u = normalize( d );
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




function applyForces( orb, onIteration ) {

    const points = orb.points;

    const {
        forces = [ 'pair', 'link' ],
        iterations = 100,
        tickTime = 100,
        minDist = 0.001,
        maxDelta = 0.001,
        burst = 100,
    } = orb.param;

    orb.param.running = true;

    const origin = { coord: [ 0, 0, 0 ] };
    const tick = ( iteration, burst ) => {

        for ( var b = 0; b < burst; b++ ) {

            points.forEach( p => p.netForce = [ 0, 0, 0 ] );

            if ( forces.includes( 'pair' ) ) {
                // only points with non-inverse links feel the pair force
                const linkedPoints = points
                    .filter( p => p.coprime != 'e' );
//                    .filter( p => p.links.filter( ( [ linkPoint, _ ] ) => p.inverse != linkPoint  ).length > 0 );

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
                    const [ otherPoint, exp ] = link;
                    const [ d, r2, u ] = springForce( point, otherPoint, exp, orb.param, orb.linkParam );
                    link[0].netForce = addition( link[0].netForce, u );
                    return u;
                };

                points
                    .filter( p => p.coprime != 'e' )
                    .filter( p => p.links )
                    .forEach( p => {
                        const linkSum = p.links
                            .filter( link => p != link[0] )
                            // not if can find a lower exponent link via powers
                            .filter( link => !p.powers
                                .filter( ( [ exponent, expCoPrime ] ) => expCoPrime == link[0].coprime )
                                .filter( ( [ exponent, expCoPrime ] ) => exponent <= link[1] )
                                // arbitrarily choose one side
                                .find( ( [ exponent, expCoPrime ] ) => ( exponent < link[1] ) || ( expCoPrime < p.coprime ) ) )
                            .map( link => linkForceAdjuster( p, link[0].netForce, link ) )
                            .reduce( ( a, c ) => addition( a, c ), [ 0, 0, 0 ] );
                        p.netForce = subtraction( p.netForce, linkSum );
                    } );

                points
                    .filter( p => p.coprime == 'e' )
                    .filter( p => p.links.length > 0 )
                    .forEach( p => {
                        const identityFactor = orb.param.identityFactor / p.links.length ;
                        const linkSum = p.links
                            .map( link => {
                                const [ d, r2, u ] = inverseForce( p, link[0], orb.param );
                                const upf = scale( u, identityFactor );
                                link[0].netForce = subtraction( link[0].netForce, upf );
                                return upf;
                            } )
                            .reduce( ( a, c ) => addition( a, c ), [ 0, 0, 0 ] );
                        p.netForce = addition( p.netForce, linkSum );
                    } );
            }
        }

        if ( orb.param.newtonian ) {
            points
                .forEach( p => {
                    const acceleration = scale( p.netForce, 1 / p.mass );
                    const nextVelocity = scale( addition( acceleration, p.velocity ), orb.param.friction );

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



        if ( iteration > 0 && orb.param.running ) {
            setTimeout( tick, tickTime, iteration - 1, burst );
        }
        if ( onIteration ) {
            onIteration( iteration );
        }
    };
    if ( iterations > 0 && orb.param.running ) {
        setTimeout( tick, tickTime, iterations, burst );
    }
}