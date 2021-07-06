
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
        this.midi = {
            "instrument": 0,
            "channel": 0,
            "percussion": 0,
            "repeats": 0
        };
        this.coords = coords;
        this.findSums();
    }

    getJson() {
        var xml = "{";
        xml += ` "id": ${ this.index },`;
        xml += ` "midi": {`;
        xml += ` "instrument": ${ this.midi.instrument },`;
        xml += ` "channel": ${ this.midi.channel },`;
        xml += ` "percussion": ${ this.midi.percussion },`;
        xml += ` "repeats": ${ this.midi.repeats }`;
        xml += ` },`;
        xml += ` "order": ${ this.order },`;
        xml += ` "harmonic": ${ this.harmonic },`;

        xml += ` "centre": ${ this.centreRef },`;
        xml += ` "axis": ${ this.parent.centrePoints[this.centreRef].lineRef },`;
        xml += ` "perimeter": ${ this.perimeter },`;
        xml += ` "attack": ${ truncate( this.unitPerimeter ) },`;

        xml += ` "sum": ${ canonicalize( this.sum, ', ', SQUARE_BRA ) },`;
        xml += ` "gcd": ${ this.gcd },`;
        xml += ` "lcm": ${ this.lcm },`;
        //xml += ` "centre": ${ canonicalize( this.centre.map( x => truncate( x, 10000 ) ), ', ', SQUARE_BRA ) },`;
        xml += ` "points": ${ canonicalize( this.coords.map( c => canonicalize( c.coord, ', ', SQUARE_BRA ) ), ', ', SQUARE_BRA) },`;
        xml += ` "parity": ${ canonicalize( this.parity, ', ', SQUARE_BRA) }`;
        xml += "}";
        return xml;
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

        // passing lambdas gcd and lcm
        this.gcd = this.sum.reduce( gcd );
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
            "midi": this.midi,
            "sum": `( ${ this.sum.join( ', ' ) } )`,
            "centre": `( ${ this.centre.map( x => truncate( x )).join( ', ' ) } )`,
            "harmonicSum": `( ${ this.harmonicSum.map( x => truncate( x )).join( ', ' ) } )`,
            "gcd": this.gcd,
            "lcm": this.lcm,
            "harmonic": truncate( this.harmonic ),
            "order": this.order,
            "weight": truncate( this.weight ),
            "bias": formattedWeight( this.bias ),
            "perimeter": this.perimeter,
            "attack": truncate( this.unitPerimeter ),
            "members": this.coords.join( C_SEP ),
            "parity": this.parity.join( C_SEP ),
            "rotation": this.rotation,
            "lineRef": centre.lineRef,
            "centreRef": this.centreRef,
            "centreHypoteneuse": truncate( centre.hyp2 ),
            "centreOpposite": truncate( line.pd )
        };
    }
}




class OrbitSystem {
    constructor( param ) {
        this.basePlane = new BasePlane( param.bases );
        this.key = "os-" + this.basePlane.bases.join( "." );
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

    getJson() {
        const n = "\n";
        const t = "  ";
        const nt = n + t;
        const ntt = nt + t;

        var plane = this.basePlane;
        var baseJson = '{';
        baseJson += ntt + ` "volume": ${ plane.volume },`;
        baseJson += ntt + ` "fundamental": ${ this.fundamental },`;
        baseJson += ntt + ` "sum": ${ canonicalize( this.totalDigitSum, ', ', SQUARE_BRA ) },`;
        baseJson += ntt + ` "units": ${ canonicalize( plane.bases, ', ', SQUARE_BRA ) },`;
        baseJson += ntt + ` "centre": ${ canonicalize( plane.centre, ', ', SQUARE_BRA ) },`;
        baseJson += ntt + ` "forward": ${ canonicalize( plane.powers, ', ', SQUARE_BRA ) },`;
        baseJson += ntt + ` "reverse": ${ canonicalize( plane.powersReverse, ', ', SQUARE_BRA ) },`;
        baseJson += ntt + ` "axis": ${ canonicalize( plane.centre.map( x => truncate( x, 10000 ) ), ', ', SQUARE_BRA ) },`;
        baseJson += ntt + ` "normal": ${ canonicalize( plane.unitNormal.map( x => truncate( x, 10000 ) ), ', ', SQUARE_BRA ) }`;
        baseJson += ntt + '}';

        var identityJson = canonicalize( this.identityPoints.map( p => canonicalize( p.coords[0].coord, ', ', SQUARE_BRA ) ), ", ", SQUARE_BRA );
        var orbitsJson = "[" + ntt + this.orbits.map( orbit => orbit.getJson() ).join(", " + ntt) + nt + "]";

        var json = "{";
        json += nt + `"base": ${ baseJson },`;
        json += nt + `"identity": ${ identityJson },`;
        json += nt + `"orbits": ${ orbitsJson }`;
        json += n + "}";
        return json;
    }

    getCaptionTex() {
        var cimHtml = "\\(" + getCycleIndexMonomialTex( this ) + "\\)";
        return cimHtml;
    }

    getCaptionHtml() {
        var cimHtml = getCycleIndexMonomialHtml( this );
        return cimHtml;
    }

    getSummaryHtml() {
        var cimHtml = "Base Plane: ";
        cimHtml += `[${ this.basePlane.powers.join(',') }]/[${ this.basePlane.powersReverse.join(',') }]`;
        cimHtml += `, centre=[${ this.basePlane.centre.map(x=>truncate(x)).join(',') }]`;
        cimHtml += `, normal=[${ this.basePlane.unitNormal.map(x=>truncate(x)).join(',') }]`;
        return cimHtml;
    }


    findTotalDigitSum() {
        this.totalDigitSum = new Array( this.basePlane.bases.length ).fill( 0 );
        for ( var i = 0; i < this.idx.length; i++ ) {
            const coord = this.idx[i].coord;
            this.basePlane.bases.forEach( (x,i) => {
                this.totalDigitSum[i] += coord[i];
            } );
        }
    }

    buildIndexes() {
        generateIndexes( {
            bases: this.basePlane.bases,
            coordId: this.basePlane.indexForward,
            inverseCoordId: this.basePlane.indexReverse,
            idx: this.idx,
            dix: this.dix } );
    }

    buildRandomIndexes() {
        const randomIndexValues = shuffleArray( Array.from({length: this.basePlane.volume}, (item, index) => index) );
        generateIndexes( {
            bases: this.basePlane.bases,
            coordId: this.basePlane.indexForward,
            inverseCoordId: ( coord ) => randomIndexValues[ this.basePlane.indexForward( coord ) ],
            idx: this.idx,
            dix: this.dix } );
    }


    buildOrbits() {
        this.identityPoints = [];
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
                var orbit = new Orbit( this, this.orbits.length + 1, coords );
                if ( orbit.order == 1 ) {
                    this.identityPoints.push( orbit );
                } else {
                    this.orbits.push( orbit );
                }
            }
        }
    }

    buildCentreLines() {

        const allowance = 0.00000000001;
        const [ A, B ] = this.basePlane.diagonal;

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

                const unit = displacement( centre, orbitSystem.basePlane.centre );
                const scaledUnit = scale( unitDisplacement( centre, orbitSystem.basePlane.centre ), 0.5 );

                for ( var i = 1; i < centreLines.length; i++) {
                    const pd = perpendicularDistance( centre, centreLines[i].points, centreLines[i].unit );
                    if ( pd < allowance ) {
                        if ( cpd > centreLines[i].pd ) {
                            centreLines[i].points = [
                                subtraction( subtraction( orbitSystem.basePlane.centre, unit ), scaledUnit),
                                addition( addition( orbitSystem.basePlane.centre, unit ), scaledUnit)
                            ];
                        }
                        return i;
                    }
                }

                const points = [
                    subtraction( subtraction( orbitSystem.basePlane.centre, unit ), scaledUnit),
                    addition( addition( orbitSystem.basePlane.centre, unit ), scaledUnit)
                ];

                centreLines.push( { "points": points, "unit": unitDisplacement( centre, orbitSystem.basePlane.centre ), "pd": cpd }  );
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
        this.fundamental = this.orbits.length > 0
            ? lcma( this.orbits.map( (x,i) => x.order ) )
            : 1;
    }

    findMaxWeight() {
        this.maxWeight = ( this.basePlane.bases[0] - 1 ) * this.fundamental;
        this.basePlane.bases.forEach( ( b, i ) => {
            this.maxWeight = reduce( this.maxWeight, ( b - 1 ) * this.fundamental );
        });
    }

    analyzeOrbits() {

        const maxIndex = this.basePlane.volume - 1;

        var totalHarmonicSum = new Array( this.basePlane.bases.length ).fill( 0 );
        var totalWeight = 0;
        var totalRotation = 0;
        var totalPerimeter = 0;
        var totalOrderSpace = 1;

        const cycleIndexMonomial  = {};

       // calculate harmonics
        var harmonics = {};

        for ( var i = 0; i < this.orbits.length; i++ ) {
            var orbit = this.orbits[i];

            harmonics[ orbit.order ] = ( orbit.order in harmonics ) ? ( harmonics[ orbit.order ] + 1 ) : 1;

            var harmonic = this.fundamental / orbit.order;

            cycleIndexMonomial[orbit.order] = ( orbit.order in cycleIndexMonomial )
                ? cycleIndexMonomial[orbit.order] + 1
                : 1

            orbit.harmonic = harmonic;
            orbit.weight = orbit.gcd * harmonic;
            orbit.harmonicSum = orbit.sum.map( x => x * harmonic);
            orbit.bias = [ orbit.weight, this.maxWeight, reduce( orbit.weight, this.maxWeight ) ];
            orbit.biasFactor = ( orbit.bias[0] / orbit.bias[1] );

            const coords = orbit.coords;
            orbit.perimeter = coords
                    .map( (x,i) => distance2( x.coord, coords[ ( i + 1 ) % orbit.order ].coord ) )
                    .reduce( (a,c) => a + c );

            orbit.unitPerimeter = Math.sqrt( orbit.perimeter ) / orbit.order;

            orbit.parity = coords
                .map( (x,i) => dotProduct( x.coord, this.basePlane.unitNormal ) )
                .map( (x,i) => x < 0 ? -1 : 1 );

            [
                orbit.midi.instrument,
                orbit.midi.percussion,
                orbit.midi.channel,
                orbit.midi.repeat
            ] = getInstrumentForOrder( orbit.order );

            totalHarmonicSum = orbit.harmonicSum.map( (x, i)  => x + totalHarmonicSum[i] );
            totalPerimeter += orbit.perimeter;
            totalWeight += orbit.weight;

            totalOrderSpace *= orbit.order;
        }

        Object.entries( cycleIndexMonomial ).sort( (a, b) => a < b );
        this.cycleIndexMonomial = cycleIndexMonomial;

        this.totalOrderSpace = totalOrderSpace;

        this.totalHarmonicSum = totalHarmonicSum;
        this.totalPerimeter = totalPerimeter;
        this.harmonics = harmonics;
        this.maxIndex = maxIndex;
        this.totalWeight = totalWeight;

        // reference into each orbit
        this.originPoints = this.orbits.map( orbit => 0 );
        this.locusPoints = [].concat( this.originPoints );
    }

    getLocusPoints( locusLine ) {
        return locusLine
            .map( (index,i) => {
                const coords = this.orbits[i].coords;
                return coords[ index % coords.length ];
            } );
    }

    getLocusStep( locusLine, step ) {
        const maxLocusIndex = this.orbits.length - 1;

        const rl = [].concat( locusLine ).reverse();
        var rlStep = step;
        if ( !(step && this.orbits.length == step.length ) ) {
            rlStep = rl.map( (x,i) => i == 0 ? 1 : 0);
        }

        var newLocus = [];
        var carry = 0;
        rl.forEach( (x,i) => {
            const orbit = this.orbits[ maxLocusIndex - i ];
            const orbitStep = rlStep[ i ];
            const maxOrbitOrder = orbit.order;

            const d = ( x + orbitStep + carry );
            const f = d % maxOrbitOrder;
            newLocus.push( f );
            carry = Math.floor( d / maxOrbitOrder );
        } );

        newLocus.reverse();

        return newLocus;
    }
}
