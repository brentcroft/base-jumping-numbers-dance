


function getClockfaces( m, b ) {

    const terminal = ( m * b ) - 1;
    const identity = [ ...Array( terminal ).keys() ];
    const clockfaces = [ identity ];

    const strideClockface = ( clockface, stride ) => identity.map( i => clockface[ ( i * stride ) % terminal ] );
    const exactlyEquals = (a, b) => a.filter( (x,i) => x == b[i] ).length == a.length;

    var clockface = strideClockface( identity, m );
    while ( !exactlyEquals( identity, clockface ) ) {
        clockfaces.push( clockface );
        clockface = strideClockface( clockface, m );
    }

    return clockfaces;
}

function coPrimeFactors( terminal ) {

    // https://stackoverflow.com/questions/11966520/how-to-find-prime-numbers-between-0-100
    function getPrimes( max ) {
        var sieve = [], i, j, primes = [];
        for (i = 2; i <= max; ++i) {
            if (!sieve[i]) {
                // i has not been marked -- it is prime
                primes.push(i);
                for (j = i << 1; j <= max; j += i) {
                    sieve[j] = true;
                }
            }
        }
        return primes;
    }

    // https://stackoverflow.com/questions/39899072/how-can-i-find-the-prime-factors-of-an-integer-in-javascript
    function primeFactors( n ) {
        const factors = [];
        let divisor = 2;
        while (n >= 2) {
            if (n % divisor == 0) {
                factors.push(divisor);
                n = n / divisor;
            } else {
                divisor++;
            }
        }
        return factors;
    }

    const availablePrimes = getPrimes( terminal );

    // remove duplicate prime factors
    const terminalPrimes = primeFactors( terminal ).filter( (v, i, a) => a.indexOf( v ) === i );

    terminalPrimes.forEach( p => availablePrimes.splice( availablePrimes.indexOf( p ), 1 ) );

    const coprimes = [];

    var exp = 1;

    function buildOut( q ) {
        for ( var j = 0; j < availablePrimes.length; j++ ) {

            const r = q * availablePrimes[j];

            if ( r < terminal ) {
                if ( coprimes.indexOf( r ) == -1 ) {
                    coprimes.push( r );
                }
                buildOut( r );
            } else {
                break;
            }
        }
    }


    // availablePrimes is sorted low to high
    for ( var i = 0; i < availablePrimes.length; i++ ) {
        const p = availablePrimes[i];

        coprimes.push( p );

        buildOut( p );
    }

    coprimes.sort( (a,b) => a - b );

    return coprimes;
}



function twist( sequence, stride = 2 ) {
    const base = sequence.length;
    const tally = new Array( base ).fill( 0 );
    const sink = [];
    for ( var i = 0; i < base; i++ ) {
        const j = ( i * stride ) % base;
        if (tally[ j ] ) {
            throw new Error( `Common Factor: Index length ${ base } at stride ${ stride } repeats with length ${ sink.length }; [${ sink }]  ` );
        }
        tally[ j ] = 1;
        sink.push( sequence[ j ] );
    }
    return sink
}

function roots( index, stride ) {
    const source = [...index];
    const base = source.length;

    // no twists below three
    if ( base <= 2 ) {
        return [ source ];
    }

    const currentRoots = [ index ];
    var locus = twist( index, stride );
    while ( !arrayExactlyEquals( index, locus ) ) {
        currentRoots.push( locus );
        locus = twist( locus, stride );
    }
    return currentRoots;
}

function winding( sequence ) {
    const w = sequence
        .reduce(
            (a,c) => [ a[0] + (c < a[1] ? 1 : 0 ), c ],
            [ 1, 0 ]
        );
    return w[0];
}

function rootsInfo( base, stride ) {
    const r = roots( arrayOfIndexes( base ), stride );
    const w = r.map( sequence => winding( sequence ) );
    return { base: base, stride: stride, size: r.length, windings: w, roots: r  };
}

