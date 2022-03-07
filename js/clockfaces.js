
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
    return orbits;
}

function getMultiplicativeGroupMember( terminal, coprime ) {
    return getOrbits( getClockfaces( terminal, coprime ) );
}

function expandCycles( cycles, copies = 1, harmonic = false ) {
    if ( copies < 2 ) {
        return cycles;
    }
    const volume = cycles.reduce( ( a, c ) => a + c.length, 0 );
    const baseCycles = [];
    if ( harmonic ) {
        const template = cycles.map( cycle => cycle.map( c => c * copies ) );
        for ( var i = 0; i < copies; i++ ) {
            template.forEach( cycle => baseCycles.push( cycle.map( c => c + i ) ) );
        }
    } else {
        for ( var i = 0; i < copies; i++ ) {
            cycles
                .forEach( cycle => baseCycles.push(
                    cycle.map( c => c + ( i * volume ) ) ) );
        }
    }

    return baseCycles;
}

function getCycles( factors, copies = 1, harmonic = false ) {
    const [ coprime, cofactor ] = factors;
    const volume = factors.reduce( ( a, c ) => a * c, 1 );
    const terminal = volume - 1;
    const cycles = getMultiplicativeGroupMember( terminal, coprime );
    // maybe insert terminal fixed point
    if ( terminal > 0 ) {
        cycles.push( [ terminal ] );
    }
    return expandCycles( cycles, copies, harmonic );
}


function quickCycles( factors, copies = 1, harmonic = false ) {

}