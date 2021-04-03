
chainSystems = [];
maxI = -1;
maxJ = -1;

function hasChainSystem( i, j ) {
    return (i in chainSystems ) && (j in chainSystems[i]);
}

/*
    Build the chains for base and mult.
*/
function getChainSystem( base, mult ) {

//    if ( hasChainSystem( base-2, mult-2 ) ) {
//        return chainSystems[ base-2 ][ mult-2 ];
//    }

    function coord_text() {
        return "( " + this.coord.join(", ") + " )";
    }

    const id = ( i, j ) => ( i * base ) + j;
    const di = ( i, j ) => i + ( j * mult );

    const idx = [];
    const dix = [];

    for ( var i = 0; i < mult; i++) {
        for ( var j = 0; j < base; j++) {

            const gridPoint = {
                coord: [ i, j ],
                id: id( i, j ),
                di: di( i, j ),
                toString: coord_text
            };

            idx[ gridPoint.id ] = gridPoint;
            dix[ gridPoint.di ] = gridPoint;
        }
    }

    const chains = [];

    // build each chain by iterating (and dixxing) the items
    for ( var i = 0; i < ( base * mult ); i++) {

        if ( dix[ i ] == -1 ) {
            continue;
        }

        dix[ i ] = -1;

        var gridPoint = idx[ i ];

        const chain = {
            index: i,
            coords: [ gridPoint ]
        };

        const coords = chain.coords;

        while ( gridPoint.di != i ) {
            dix[ gridPoint.di ] = -1;
            gridPoint = idx[ gridPoint.di ];
            coords[ coords.length ] = gridPoint;
        }

        chains[ chains.length ] = chain;
    }


    var maxIndex = (base * mult) - 1;
    var fundamental = chains[1].coords.length;

    var totalWeight = 0;

    var maxChainWeight =  reduce(
            fundamental * (base - 1),
            fundamental * ( mult - 1)
        )[2];

    // calculate harmonics
    var harmonics = {};
    for ( var i = 0; i < chains.length; i++ ) {
        var chain = chains[i];
        var hI = chain.coords.length;
        harmonics[ hI ] = ( hI in harmonics ) ? ( harmonics[ hI ] + 1 ) : 1;

        var harmonic =  fundamental / hI;
        var median = chainMedian( chain, harmonic );
        var weight = reduce( median[2], maxChainWeight );


        chain.length = hI,
        chain.harmonic =  harmonic;
        chain.sum = [ median[0], median[1] ];
        chain.gcd =  median[2];
        chain.weight = weight;


        function formattedWeight( weight ) {
            return ( weight[0] == 0 )
                    ? 0
                    : ( weight[0] == weight[1] )
                        ? 1
                        : ( weight[0] / weight[2] ) + " / " + ( weight[1] / weight[2] );
        }


        chain.getTableRow = function()
        {
            return {
                "sum": `( ${ this.sum[0] }, ${ this.sum[1] } )`,
                "gcd": this.gcd,
                "harmonic": this.harmonic,
                "length": this.length,
                "weight": formattedWeight( this.weight ),
                "members": this.coords.join(", ")
            };
        }

        totalWeight += median[2];
    }

    var chainSystem = {
        base: base,
        mult: mult,
        chains: chains,
        harmonics: harmonics,
        maxIndex: maxIndex,
        fundamental: fundamental,
        totalWeight: totalWeight
    };

    chainSystem.toString = function(){
        return `( ${ this.base }, ${ this.mult }, ${ this.fundamental }, ${ this.chains.length } )`;
    };

    var i = base-2;
    var j = mult-2;

    if ( ! ( i in chainSystems ) ) {
        chainSystems[i] = [];
    }

    maxI = Math.max( maxI, i );
    maxJ = Math.max( maxJ, j );

    //chainSystems[i][j] = chainSystem;

    return chainSystem;
}

// Reduce a fraction by finding the Greatest Common Divisor and dividing by it.
// https://stackoverflow.com/questions/4652468/is-there-a-javascript-function-that-reduces-a-fraction

function reduce( n, d ){
    if ( n == 0 || d == 0 ) {
        return [n,d,0];
    }
    var numerator = (n<d)?n:d;
    var denominator = (n<d)?d:n;
    var gcd = function gcd(a,b){
        return b ? gcd(b, a%b) : a;
    };
    gcd = gcd( numerator,denominator);
    return [ n, d, gcd ];
}

function chainMedian( chain, harmonic = 1 ) {
    var median = [ 0, 0 ];
    chain.coords.forEach( ( item, index ) => {
        median[0] += item.coord[0];
        median[1] += item.coord[1];
        } );

    return reduce( harmonic * median[0], harmonic * median[1] );
}

/*
    Calculate the value obtained by:
    iterating forward over the chain,
    accumulating the product of the [0] coord and mult.
*/
function chainDown( chain, mult) {
    var bm = 0;
    for ( var i = 0; i < ( chain.coords.length - 1 ); i++) {
        // just the base values * mult
        bm = (bm + chain.coords[i].coord[0] ) * mult;
    }
    bm += chain.coords[ chain.coords.length - 1 ].coord[0];
    return bm;
}

/*
    Calculate the value obtained by:
    iterating backward over the chain,
    accumulating the product of the [1] coord and base.
*/
function chainUp( chain, base ) {
    var mb = 0;
    for ( var i = ( chain.coords.length - 1 ); i > 0; i--) {
        // just the mult values * base
        mb = (mb + chain.coords[i].coord[1] ) * base;
    }
    mb += chain.coords[ 0 ].coord[1];
    return mb;
}
