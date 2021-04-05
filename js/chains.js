
randomSystems = [];
chainSystems = [];
maxI = -1;
maxJ = -1;

function hasChainSystem( i, j ) {
    return (i in chainSystems ) && (j in chainSystems[i]);
}


function truncate( value, places = 100 ){
    return Math.round( places * value ) / places;
}

function totalDigitSum( b, m ) {
    return [ ( m * b * ( m - 1 ) ) / 2, ( m * b * ( b - 1 ) ) / 2 ];
}

const PI = 3.1415926;
const TWO_PI = 2 * PI;

function entryRotation( entryLeft, entry, entryRight ) {

    var x00 = entryLeft.coord[0]
    var y00 = entryLeft.coord[1]
    var x01 = entry.coord[0]
    var y01 = entry.coord[1]
    var x10 = x01
    var y10 = y01
    var x11 = entryRight.coord[0]
    var y11 = entryRight.coord[1]

    var dx0  = x01 - x00;
    var dy0  = y01 - y00;
    var dx1  = x11 - x10;
    var dy1  = y11 - y10;

    var angle = Math.atan2(
        (dx0 * dy1) - (dx1 * dy0),
        (dx0 * dx1) + (dy0 * dy1)
    );

//    if ( Math.abs( Math.PI - angle ) < 0.0001 ) {
//        angle = -1 * Math.abs( angle );
//    }


    return angle;
}

function entryRotation2( entryLeft, entry, entryRight ) {

    var a1 = Math.atan2( entryLeft.coord[1] - entry.coord[1], entryLeft.coord[0] - entry.coord[0] );
    var a2 = Math.atan2( entryRight.coord[1] - entry.coord[1], entryRight.coord[0] - entry.coord[0] );

    var angle = a2 - a1;

    if (angle < 0) {
        angle += 2 * Math.PI;
    }

    return angle;
}



function chainRotation( coords ) {
    var rotation = 0;

    for ( var i = 0, d = coords.length; i < d; i++ ) {
        rotation += entryRotation(
            coords[ ( d + i - 1 ) % d ],
            coords[ i ],
            coords[ ( i + 1 ) % d ]
        );
    }
    // number of whole clockwise turns
    return -1 * Math.round( rotation / TWO_PI );
}

function getRandomChainSystem( chainSystem ) {

    const base = chainSystem.base;
    const mult = chainSystem.mult;
    const scale = chainSystem.scale;
    const origin = chainSystem.origin;

    var chains = [];
    var gridCoords = [];

    function coord_text() {
        return "( " + this.coord.join(", ") + " )";
    }

    for (var i = 0; i < mult; i++ ) {
        for (var j = 0; j < base; j++ ) {
            gridCoords.push(
            {
                "coord": [ i, j ],
                "toString": coord_text
            } );
        }
    }

    shuffleArray( gridCoords );

    function getTableRow() {
        return {
            "sum": `( ${ this.sum[0] }, ${ this.sum[1] } )`,
            "gcd": this.gcd,
            "length": this.length,
            "members": this.coords.join(", ")
        };
    }

    function coords_array() {
        var coordsArray = [];
        for ( var i = 0; i < this.coords.length; i++) {
            coordsArray.push( this.coords[ i ].coord );
        }

        return coordsArray;
    }


    while ( gridCoords.length > 0 ) {

        const chainStart = 0;
        const chainLength = 1 + Math.floor( Math.random() * Math.random() * gridCoords.length );

        var coords = gridCoords.splice( chainStart, chainLength );

        var chain =  {
            "coords": coords,
            "coordsArray": coords_array,
            "getTableRow": getTableRow
        };

        var median = chainMedian( chain );

        chain.length = coords.length,
        chain.sum = [ median[0], median[1] ];
        chain.gcd =  median[2];

        chains.push( chain );
    }

    var fundamental = 1;
    for ( var i = 0; i < chains.length; i++ ) {
        var chain = chains[i];
        var hI = chain.coords.length;
        if ( hI > fundamental ) {
            fundamental = hI;
        }
    }

    var maxIndex = (base * mult) - 1;
    var totalWeight = 0;
    var maxChainWeight =  reduce( base - 1, mult - 1 )[2] * fundamental;

    var totalHarmonicSum = [ 0, 0 ]


    // calculate harmonics
    var harmonics = {};
    for ( var i = 0; i < chains.length; i++ ) {
        var chain = chains[i];
        var hI = chain.coords.length;
        harmonics[ hI ] = ( hI in harmonics ) ? ( harmonics[ hI ] + 1 ) : 1;

        var harmonic = fundamental / hI;
        var median = chainMedian( chain );

        chain.length = hI,
        chain.harmonic =  harmonic;
        chain.sum = [ median[0], median[1] ];
        chain.harmonicSum = [ harmonic * median[0], harmonic * median[1] ];
        chain.gcd =  median[2];
        chain.weight = median[2] * harmonic;
        chain.bias = reduce( median[2] * harmonic, maxChainWeight );

        totalHarmonicSum[0] += chain.harmonicSum[0]
        totalHarmonicSum[1] += chain.harmonicSum[1]

        function formattedWeight( weight ) {
            return ( truncate(weight[0]) == 0 )
                    ? 0
                    : ( truncate(weight[0]) == truncate(weight[1]) || truncate( weight[2] ) == 0 )
                        ? 1
                        : ( truncate( weight[0] / weight[2] ) + " / " + truncate( weight[1] / weight[2] ) );
        }


        chain.getTableRow = function()
        {
            return {
                "sum": `( ${ truncate( this.sum[0] ) }, ${ truncate( this.sum[1] ) } )`,
                "harmonicSum": `( ${ truncate( this.harmonicSum[0] ) }, ${ truncate( this.harmonicSum[1] ) } )`,
                "gcd": truncate( this.gcd ),
                "harmonic": truncate( this.harmonic ),
                "length": this.length,
                "weight": truncate( this.weight ),
                "bias": formattedWeight( this.bias ),
                "members": this.coords.join(", "),
                "rotation": chainRotation( this.coords )
            };
        }

        totalWeight += harmonic * median[2];
    }

    totalHarmonicSum[0] = truncate( totalHarmonicSum[0] );
    totalHarmonicSum[1] = truncate( totalHarmonicSum[1] );

    var chainSystem = {
        base: base,
        mult: mult,
        totalDigitSum: totalDigitSum( base, mult ),
        totalHarmonicSum : totalHarmonicSum,
        origin: origin,
        scale: scale,
        chains: chains,
        harmonics: harmonics,
        maxIndex: maxIndex,
        fundamental: fundamental,
        totalWeight: truncate( totalWeight ),
        maxWeight: maxChainWeight
    };

    chainSystem.toString = function(){
        return `( ${ this.base }, ${ this.mult }, ${ this.fundamental }, ${ this.chains.length } )`;
    };

    return chainSystem;
}



/*
    Build the chains for base and mult.
*/
function getChainSystem( base, mult ) {

    if ( hasChainSystem( base-2, mult-2 ) ) {
        return chainSystems[ base-2 ][ mult-2 ];
    }

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

    function coords_array() {
        var coordsArray = [];
        for ( var i = 0; i < this.coords.length; i++) {
            coordsArray.push( this.coords[ i ].coord );
        }

        return coordsArray;
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
            coords: [ gridPoint ],
            coordsArray: coords_array
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

    var totalHarmonicSum = [ 0, 0 ]
    var totalWeight = 0;

    var maxChainWeight =  reduce(
            ( base - 1 ) * fundamental,
            ( mult - 1 ) * fundamental
        )[2];

    // calculate harmonics
    var harmonics = {};
    for ( var i = 0; i < chains.length; i++ ) {
        var chain = chains[i];
        var hI = chain.coords.length;
        harmonics[ hI ] = ( hI in harmonics ) ? ( harmonics[ hI ] + 1 ) : 1;

        var harmonic =  fundamental / hI;
        var median = chainMedian( chain );

        chain.length = hI,
        chain.harmonic =  harmonic;
        chain.sum = [ median[0], median[1] ];
        chain.harmonicSum = [ harmonic * median[0], harmonic * median[1] ];
        chain.gcd =  median[2];
        chain.weight = median[2] * harmonic;
        chain.bias = reduce( median[2] * harmonic, maxChainWeight );

        totalHarmonicSum[0] += chain.harmonicSum[0]
        totalHarmonicSum[1] += chain.harmonicSum[1]

        function formattedWeight( weight ) {
            return ( weight[0] == 0 )
                    ? 0
                    : ( weight[0] == weight[1] || weight[2] == 0 )
                        ? 1
                        : ( weight[0] / weight[2] ) + " / " + ( weight[1] / weight[2] );
        }

        chain.getTableRow = function()
        {
            return {
                "sum": `( ${ this.sum[0] }, ${ this.sum[1] } )`,
                "harmonicSum": `( ${ this.harmonicSum[ 0 ] }, ${ this.harmonicSum[ 1 ] } )`,
                "gcd": this.gcd,
                "harmonic": this.harmonic,
                "length": this.length,
                "weight": this.weight,
                "bias": formattedWeight( this.bias ),
                "members": this.coords.join(", "),
                "rotation": chainRotation( this.coords )
            };
        }

        totalWeight += chain.harmonic * median[2];
    }

    var chainSystem = {
        base: base,
        mult: mult,
        chains: chains,
        totalDigitSum: totalDigitSum( base, mult ),
        totalHarmonicSum : totalHarmonicSum,
        harmonics: harmonics,
        maxIndex: maxIndex,
        fundamental: fundamental,
        totalWeight: totalWeight,
        maxWeight: maxChainWeight
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

    chainSystems[i][j] = chainSystem;

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

function chainMedian( chain ) {
    var median = [ 0, 0 ];
    chain.coords.forEach( ( item, index ) => {
        median[0] += item.coord[0];
        median[1] += item.coord[1];
        } );

    return reduce( median[0], median[1] );
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


function rotateChainText( tdElement, rotateLeft = false ) {

    var chainText = tdElement.innerHTML;

    const chainItems =  chainText
        .substring( 1, chainText.length - 1 )
        .split( /\),\s*\(/ );

    if ( rotateLeft ) {
        chainItems.push( chainItems.shift() );
    } else {
        chainItems.splice( 0, 0, chainItems.pop() );
    }

    tdElement.innerHTML = "(" + chainItems.join( "), (" ) + " )";
}

function arrayFromChainText( tdElement ) {

    var chainText = tdElement.innerHTML;

    const chainItems =  chainText
        .substring( 1, chainText.length - 1 )
        .split( /\),\s*\(/ );

    var chain = [];

    for ( var i = 0; i < chainItems.length; i++ ) {
        const parts = chainItems[i].split( ",");
        chain.push( [ Number( parts[0] ), Number( parts[1] ) ] );
    }

    return chain;
}