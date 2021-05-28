
var orbitSystems = {};

function getOrbitSystem( key ) {
    return orbitSystems[key];
}

function putOrbitSystem( key, orbitSystem ) {
    orbitSystem.key = key;
    orbitSystems[key] = orbitSystem;

    //console.log( orbitSystem );
}


function truncate( value, places = 100 ){
    return Math.round( places * value ) / places;
}

function formattedWeight( weight ) {
    return ( weight[0] == 0 )
            ? 0
            : ( weight[0] == weight[1] || weight[2] == 0 )
                ? 1
                : ( weight[0] / weight[2] ) + " / " + ( weight[1] / weight[2] );
}


class Coord {
    constructor( coord = [], id, di ) {
        this.coord = [ ...coord ];
        this.id = id;
        this.di = di;
    }

    toString() {
        return canonicalize( this.coord );
    }
}

class Orbit {

    constructor( parent, index, coords ) {
        this.parent = parent;
        this.index = index;
        this.coords = coords;
        this.findSums();
    }

    findSums() {
        this.basis = this.coords[0].coord.length;
        this.order = this.coords.length;
        this.centre = new Array( this.basis ).fill( 0 );

        this.sum = new Array( this.basis ).fill( 0 );
        this.coords.forEach( ( item, index ) => {
            for ( var i = 0; i < this.basis; i++ ) {
                this.sum[i] += item.coord[i];
            }
        } );

        this.sum.forEach( ( s, index ) => {
            this.centre[index] = s / this.order;
        } );

        this.gcd = this.sum.reduce( gcd );
//        this.sum.forEach( ( s ) => {
//            this.gcd = reduce( this.gcd, s );
//        } );
        this.lcm = this.sum.reduce( lcm );
    }

    getCoordArray() {
        return this
            .coords
            .map( c => c.coord );
    }

    getTableRow() {
        const centre = this.parent.centrePoints[this.centreRef];
        const line = this.parent.centreLines[centre.lineRef];
        return {
            "id": this.index,
            "sum": `( ${ this.sum.join( ', ' ) } )`,
            "centre": `( ${ this.centre.map( x => truncate( x )).join( ', ' ) } )`,
            "harmonicSum": `( ${ this.harmonicSum.map( x => truncate( x )).join( ', ' ) } )`,
            "gcd": this.gcd,
            "lcm": this.lcm,
            "harmonic": truncate( this.harmonic ),
            "length": this.length,
            "weight": truncate( this.weight ),
            "bias": formattedWeight( this.bias ),
            "members": this.coords.join( C_SEP ),
            "rotation": this.rotation,
            "perimeter": this.perimeter,
            "lineRef": centre.lineRef,
            "centreRef": this.centreRef,
            "centreHypoteneuse": truncate( centre.hyp2 ),
            "centreOpposite": truncate( line.pd )
        };
    }
}




class OrbitSystem {
    constructor( param ) {
        this.bases = param.bases;
        this.key = "os-" + this.bases.join( "." );
        this.volume = this.bases.reduce( (a,c) => a*c, 1);
        this.centre = this.bases.map( x => (x-1)/2 );
        this.mainDiagonal = [ [ 0, 0, 0 ], this.bases.map( x => x - 1) ];
        this.idx = [];
        this.dix = [];
        if ( param.toggles && param.toggles.random ) {
            this.buildRandomIndexes();
        } else {
            this.buildIndexes();
        }
        this.buildOrbits();
        this.buildCentreLines();
        this.findFundamental();
        this.findTotalDigitSum();
        this.findMaxWeight();
        this.analyzeOrbits();
    }

    getCaptionTex() {
        var cimHtml = "\\(" + getCycleIndexMonomialTex( this ) + "\\)";
        return cimHtml;
    }

    findTotalDigitSum() {
        this.totalDigitSum = new Array( this.bases.length ).fill( 0 );
        for ( var i = 0; i < this.idx.length; i++ ) {
            const coord = this.idx[i].coord;
            this.bases.forEach( (x,i) => {
                this.totalDigitSum[i] += coord[i];
            } );
        }
    }

    getCoordId( coord ) {
        var value = 0;
        var acc = 1;
        for ( var i = coord.length-1; i >= 0; i-- ) {
            const b = coord[i];
            value += acc * b;
            acc = acc * this.bases[i];
        }
        return value;
    }

    getCoordIdInverse( coord ) {
        var value = 0;
        var acc = 1;
        for ( var i = 0; i < coord.length ; i++ ) {
            const b = coord[i];
            value += acc * b;
            acc = acc * this.bases[i];
        }
        return value;
    }

    buildIndexes() {
        generateIndexes( {
            bases: this.bases,
            coordId: this.getCoordId,
            inverseCoordId: this.getCoordIdInverse,
            idx: this.idx,
            dix: this.dix } );
    }

    buildRandomIndexes() {
        const randomIndexValues = shuffleArray( Array.from({length: this.volume}, (item, index) => index) );
        const di = ( coord ) => randomIndexValues[ this.getCoordId( coord ) ];

        generateIndexes( {
            bases: this.bases,
            coordId: this.getCoordId,
            inverseCoordId: di,
            idx: this.idx,
            dix: this.dix } );
    }


    buildOrbits() {
        this.orbits = [];
        const tally = [ ...this.dix ];
        for ( var i = 0; i < this.idx.length; i++) {
            if ( tally[ i ]!= -1 ) {
                tally[ i ] = -1;
                var coord = this.idx[ i ];
                const coords = [ coord ];
                while ( coord.di != i ) {
                    tally[ coord.di ] = -1;
                    coord = this.idx[ coord.di ];
                    coords.push( coord );
                }
                this.orbits.push( new Orbit( this, this.orbits.length, coords ) );
            }
        }
    }

    buildCentreLines() {

        const allowance = 0.00000000001;
        const [ A, B ] = this.mainDiagonal;

        var centreLines = [
            { "points": [ A, B ], "unit": unitDisplacement( A, B ), "pd": 0 }
        ];
        var centrePoints = [
            { "point": [0,0,0], "lineRef": 0, "hyp2": 0 }
        ];

        function assignCentreRef( orbitSystem, orbit ) {
            const centreDist = distance2( centrePoints[0].point, orbit.centre );
            if ( centreDist < allowance ) {
                orbit.centreRef = 0;
                return;
            }
            for ( var i = 1; i < centrePoints.length; i++) {
                const d = distance2( centrePoints[i].point, orbit.centre );
                if ( d < allowance ) {
                    orbit.centreRef = i;
                    return;
                }
            }

            // new centre
            function getCentreLineRef( centre ) {

                var cpd = perpendicularDistance( centre, centreLines[0].points, centreLines[0].unit );
                if ( cpd < allowance ) {
                    return 0;
                }

                const unit = displacement( centre, orbitSystem.centre );
                const scaledUnit = scale( unitDisplacement( centre, orbitSystem.centre ), 0.5 );

                for ( var i = 1; i < centreLines.length; i++) {
                    const pd = perpendicularDistance( centre, centreLines[i].points, centreLines[i].unit );
                    if ( pd < allowance ) {
                        if ( cpd > centreLines[i].pd ) {
                            centreLines[i].points = [
                                subtraction( subtraction( orbitSystem.centre, unit ), scaledUnit),
                                addition( addition( orbitSystem.centre, unit ), scaledUnit)
                            ];
                        }
                        return i;
                    }
                }

                const points = [
                    subtraction( subtraction( orbitSystem.centre, unit ), scaledUnit),
                    addition( addition( orbitSystem.centre, unit ), scaledUnit)
                ];

                centreLines.push( { "points": points, "unit": unitDisplacement( centre, orbitSystem.centre ), "pd": cpd }  );
                return centreLines.length - 1;
            }

            centrePoints.push( {
                "point": orbit.centre,
                "lineRef": getCentreLineRef( orbit.centre ),
                "hyp2": centreDist
            } );

            orbit.centreRef = centrePoints.length - 1;
        }

        this.orbits.forEach( orbit => assignCentreRef( this, orbit ) );
        this.centreLines = centreLines;
        this.centrePoints = centrePoints;
    }

    findFundamental() {
        this.fundamental = 1;
        for ( var i = 0; i < this.orbits.length; i++ ) {
            var orbit = this.orbits[i];
            var hI = orbit.coords.length;
            if ( hI > this.fundamental ) {
                this.fundamental = hI;
            }
        }
    }

    findMaxWeight() {
        this.maxWeight = ( this.bases[0] - 1 ) * this.fundamental;
        this.bases.forEach( ( b, i ) => {
            this.maxWeight = reduce( this.maxWeight, ( b - 1 ) * this.fundamental );
        });
    }

    analyzeOrbits() {

        const maxIndex = this.volume - 1;

        var totalHarmonicSum = new Array( this.bases.length ).fill( 0 );
        var totalWeight = 0;
        var totalRotation = 0;
        var totalPerimeter = 0;

        const cycleIndexMonomial  = {};

       // calculate harmonics
        var harmonics = {};

        for ( var i = 0; i < this.orbits.length; i++ ) {
            var orbit = this.orbits[i];

            var orbitOrder = orbit.coords.length;
            harmonics[ orbitOrder ] = ( orbitOrder in harmonics ) ? ( harmonics[ orbitOrder ] + 1 ) : 1;

            var harmonic = this.fundamental / orbitOrder;

            cycleIndexMonomial[orbitOrder] = ( orbitOrder in cycleIndexMonomial )
                ? cycleIndexMonomial[orbitOrder] + 1
                : 1

            orbit.length = orbitOrder;
            orbit.harmonic = harmonic;
            orbit.weight = orbit.gcd * harmonic;
            orbit.harmonicSum = orbit.sum.map( x => x * harmonic);
            orbit.bias = [ orbit.weight, this.maxWeight, reduce( orbit.weight, this.maxWeight ) ];
            orbit.biasFactor = ( orbit.bias[0] / orbit.bias[1] );

            const coords = orbit.coords;
            orbit.perimeter = coords
                    .map( (x,i) => distance2( x.coord, coords[ ( i + 1 ) % orbitOrder ].coord ) )
                    .reduce( (a,c) => a + c );

            totalHarmonicSum = orbit.harmonicSum.map( (x, i)  => x + totalHarmonicSum[i] );
            totalPerimeter += orbit.perimeter;
            totalWeight += orbit.weight;
        }

        Object.entries( cycleIndexMonomial ).sort( (a, b) => a < b );

        //this.hypo = Math.sqrt( base**2 + mult**2 );
        this.totalHarmonicSum = totalHarmonicSum;
        this.totalPerimeter = totalPerimeter;
        this.harmonics = harmonics;
        this.maxIndex = maxIndex;
        this.totalWeight = totalWeight;
        //this.maxWeight = maxChainWeight;
        this.cycleIndexMonomial = cycleIndexMonomial;
    }
}
