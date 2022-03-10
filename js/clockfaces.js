
const pointLabel = ( point ) => point.id;


function getClockfaces( terminal, stride ) {

    const identity = [ ...Array( terminal ).keys() ];
    const clockfaces = [ identity ];

    const strideClockface = ( clockface, stride ) => identity.map( i => clockface[ ( i * stride ) % terminal ] );
    const exactlyEquals = (a, b) => a.filter( (x,i) => x == b[i] ).length == a.length;

    var clockface = strideClockface( identity, stride );
    while ( !exactlyEquals( identity, clockface ) ) {
        clockfaces.push( clockface );
        clockface = strideClockface( clockface, stride );
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

    return orbits
        .map( orbit => orbit
            .map( ( c, i ) => {
                 return {
                    id: c,
                    di: orbit[ ( i + 1 ) % orbit.length ],
                    coord: [ c ],
                    toString: () => c
                };
            } )
        );
}



function createPoint( i, j, coprime, cofactor ) {
    const point = {
         id: j + ( i * coprime ),
         di: ( j * cofactor ) + i,
         coord: [ i, j ]
    };
    point.toString = () => pointLabel( point );
    return point;
}

function stubNextPoint( lastPoint, cofactor, terminal ) {
    const point = {
        id: lastPoint.di,
        di: ( lastPoint.di * cofactor ) % terminal,
        coord: []
    };
    point.toString = () => pointLabel( point );
    return point;
}

function getBoxGroupMember( volume, coprime ) {
    const cofactor = ( volume / coprime );
    if ( !Number.isInteger( cofactor ) ) {
        throw new Error( `Volume ${ volume } is not a truncated box with side ${ coprime }.` );
    }
    const terminal = volume - 1;
    const cycles = [];

    for ( var i = 0; i < cofactor; i++ ) {
        for ( var j = 0; j < coprime; j++ ) {

            const point = createPoint( i, j, coprime, cofactor );
            const cycle = cycles.find( cycle => cycle.find( p => p.id == point.id ) );

            if ( cycle ) {
                cycle
                    .find( p => p.id == point.id )
                    .coord
                    .push( i, j );
            } else {
                const newCycle = [ point ];
                var lastPoint = point;
                var nextPoint = stubNextPoint( lastPoint, cofactor, terminal );
                while ( nextPoint.id != point.id ) {
                    newCycle.push( nextPoint );
                    lastPoint = nextPoint;
                    nextPoint = stubNextPoint( lastPoint, cofactor, terminal );
                }
                cycles.push( newCycle );
            }
        }
    };
    return cycles;
}

function magnifyPoint( c, magnification ) {
    const point = {
        id: c.id * magnification,
        di: c.di * magnification,
        coord: [ ...c.coord ]
    };
    point.toString = () => pointLabel( point );
    return point;
}

function offsetPoint( c, i, volume = 1 ) {
    const point = {
        id: ( c.id + ( i * volume ) ),
        di: ( c.di + ( i * volume ) ),
        coord: [ i, ...c.coord ]
    };
    point.toString = () => pointLabel( point );
    return point;
}

function expandCycles( cycles, copies = 1, harmonic = false ) {
    if ( copies < 2 ) {
        return cycles;
    }

    const volume = cycles.reduce( ( a, c ) => a + c.length, 0 );
    const baseCycles = [];

    if ( harmonic ) {
        const template = cycles.map( cycle => cycle.map( c => magnifyPoint( c, copies ) ) );
        for ( var i = 0; i < copies; i++ ) {
            template.forEach( cycle => baseCycles.push( cycle.map( c => offsetPoint( c, i ) ) ) );
        }
    } else {
        for ( var i = 0; i < copies; i++ ) {
            cycles.forEach( cycle => baseCycles.push( cycle.map( c => offsetPoint( c, i, volume ) ) ) );
        }
    }

    return baseCycles;
}

function getMultiplicativeGroupMember( terminal, stride, truncated = true ) {
    const volume = ( terminal + 1 );
    const cofactor = volume / stride;
    if ( Number.isInteger( cofactor ) ) {
        return getBoxGroupMember( volume, cofactor )
            .filter( cycle => !truncated || !cycle.find( c => c.id == terminal ) );
    } else {
        // one-dimensional
        const cycles = getOrbits( getClockfaces( terminal, stride ) );
        if ( !truncated ) {
            cycles.push( [ {
                id: terminal,
                di: terminal,
                coord: [ terminal ],
                toString: () => c
            } ] );
        }
        return cycles;
    }
}

function getCycles( factors, copies = 1, harmonic = false, truncated = true ) {
    const [ coprime, cofactor ] = factors;
    const volume = factors.reduce( ( a, c ) => a * c, 1 );
    const terminal = volume - 1;
    const cycles = getMultiplicativeGroupMember( terminal, coprime, truncated );
    return expandCycles( cycles, copies, harmonic );
}
