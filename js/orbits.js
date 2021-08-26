
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

    torsion() {
        return ( this.radiance - this.jumpage );
    }

    tension() {
        return ( this.diameterSum - this.perimeter );
    }

    isSelfConjugate() {
        return this.index == this.conjugate.index;
    }

    isFirstConjugate() {
        return this.index < this.conjugate.index;
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
        xml += ` "attack": ${ truncate( this.attack ) },`;

        xml += ` "sum": ${ canonicalize( this.sum, ', ', SQUARE_BRA ) },`;
        xml += ` "gcd": ${ this.gcd },`;
        xml += ` "lcm": ${ this.lcm },`;
        //xml += ` "centre": ${ canonicalize( this.centre.map( x => truncate( x, 10000 ) ), ', ', SQUARE_BRA ) },`;
        xml += ` "points": ${ canonicalize( this.coords.map( c => canonicalize( c.coord, ', ', SQUARE_BRA ) ), ', ', SQUARE_BRA) },`;
        xml += ` "jumps": ${ canonicalize( this.jumps, ', ', SQUARE_BRA) }`;
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

    getLineRef() {
        return this.parent.centrePoints[this.centreRef].lineRef;
    }

    getMembers() {
        return this.coords.join( C_SEP )
    }

    getIdSum() {
        return this.coords.reduce( (a, coord ) => a + coord.id, 0 );
    }

    getDiSum() {
        return this.coords.reduce( (a, coord ) => a + coord.di, 0 );
    }
}




class OrbitSystem {
    constructor( param ) {
        this.box = new BaseBox( param.bases );
        this.key = "os-" + this.box.bases.join( "." );
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
        this.findMaxWeight();
        this.analyzeOrbits();
    }

    identityRadiance() {
        return this.identityPoints.reduce( (a, p) => a + p.coords[0].radiant, 0 );
    }

    grossRadiance() {
        return this.identityRadiance() + this.totalRadiance;
    }

    jumpage() {
        return this.totalJumpage;
    }

    torsion() {
        return this.grossRadiance() - this.jumpage();
    }

    identityDiameterSum() {
        const points = this.identityPoints.map( x => x.coords[0] );
        const diameters = points.map( p => distance2( p.coord, this.idx[p.reflectId].coord ) );
        return diameters.reduce( (a,d) => a + d, 0);
    }

    grossDiameterSum() {
        return this.identityDiameterSum() + this.totalDiameterSum;
    }

    tension() {
        return this.grossDiameterSum() - this.totalPerimeter;
    }

    getJson() {
        const n = "\n";
        const t = "  ";
        const nt = n + t;
        const ntt = nt + t;

        var identityJson = canonicalize( this.identityPoints.map( p => canonicalize( p.coords[0].coord, ', ', SQUARE_BRA ) ), ", ", SQUARE_BRA );
        var orbitsJson = "[" + ntt + this.orbits.map( orbit => orbit.getJson() ).join(", " + ntt) + nt + "]";

        var json = "{";
        json += nt + `"fundamental": ${ this.fundamental },`;
        json += nt + `"box": ${ JSON.stringify( this.box, null, 4 ) },`;
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
        return getCycleIndexMonomialHtml( this );
    }

    getSummaryHtml() {
        var cimHtml = "Base Plane: ";
        cimHtml += `[${ this.box.powersForward.join(',') }]/[${ this.box.powersReverse.join(',') }]`;
        cimHtml += `, centre=[${ this.box.centre.map(x=>truncate(x)).join(',') }]`;
        cimHtml += `, normal=[${ this.box.unitNormal.map(x=>truncate(x)).join(',') }]`;
        return cimHtml;
    }

    buildIndexes() {
        generateIndexes( {
            box: this.box,
            indexForward: this.box.indexForward,
            indexReverse: this.box.indexReverse,
            idx: this.idx,
            dix: this.dix } );
    }

    buildRandomIndexes() {
        const randomIndexValues = shuffleArray( Array.from({length: this.box.volume}, (item, index) => index) );
        generateIndexes( {
            box: this.box,
            indexForward: this.box.indexForward,
            indexReverse: ( coord ) => randomIndexValues[ this.box.indexForward( coord ) ],
            idx: this.idx,
            dix: this.dix } );
    }


    buildOrbits() {
        this.identityPoints = [];
        this.orbits = [];
        const tally = [ ...this.dix ];
        const box = this.box;

        function setAntipodes( coord, idx ) {
            const antipodesId = reflectPoint( coord.coord, box.centre );
            coord.antipodes = idx[ coord.reflectId ];
        }

        function extractOrbitCoordsAndTally( startIndex, idx, tally ) {
            var coord = idx[ startIndex ];
            tally[ startIndex ] = -1;
            const coords = [ coord ];
            while ( coord.di != startIndex ) {
                tally[ coord.di ] = -1;
                coord = idx[ coord.di ];
                coords.push( coord );
            }
            return coords;
        }

        for ( var i = 0; i < this.idx.length; i++) {
            if ( tally[ i ]!= -1 ) {

                const orbit = new Orbit( this, this.orbits.length + 1, extractOrbitCoordsAndTally( i, this.idx, tally ) );

                if ( orbit.order == 1 ) {
                    this.identityPoints.push( orbit );
                } else {
                    this.orbits.push( orbit );
                }

                const coord = this.idx[ i ];
                var antipodesCoord = this.idx[ coord.reflectId ];

                if (tally[ antipodesCoord.di ] == -1) {
                    // orbit is conjugate to self
                    orbit.conjugate = orbit;

                } else {
                    const conjugateOrbit = new Orbit( this, this.orbits.length + 1, extractOrbitCoordsAndTally( antipodesCoord.id, this.idx, tally ) );

                    conjugateOrbit.conjugate = orbit;
                    orbit.conjugate = conjugateOrbit;

                    if ( conjugateOrbit.order == 1 ) {
                        this.identityPoints.push( conjugateOrbit );
                    } else {
                        this.orbits.push( conjugateOrbit );
                    }
                }
            }
        }
        this.identityPoints.sort( (a,b) => a.coords[0].id - b.coords[0].id );
    }

    buildCentreLines() {

        const allowance = 0.00000000001;
        const [ A, B ] = this.box.diagonal;

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

                const unit = displacement( centre, orbitSystem.box.centre );
                const scaledUnit = scale( unitDisplacement( centre, orbitSystem.box.centre ), 0.5 );

                for ( var i = 1; i < centreLines.length; i++) {
                    const pd = perpendicularDistance( centre, centreLines[i].points, centreLines[i].unit );
                    if ( pd < allowance ) {
                        if ( cpd > centreLines[i].pd ) {
                            centreLines[i].points = [
                                subtraction( subtraction( orbitSystem.box.centre, unit ), scaledUnit),
                                addition( addition( orbitSystem.box.centre, unit ), scaledUnit)
                            ];
                        }
                        return i;
                    }
                }

                const points = [
                    subtraction( subtraction( orbitSystem.box.centre, unit ), scaledUnit),
                    addition( addition( orbitSystem.box.centre, unit ), scaledUnit)
                ];

                centreLines.push( { "points": points, "unit": unitDisplacement( centre, orbitSystem.box.centre ), "pd": cpd }  );
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
        this.maxWeight = ( this.box.bases[0] - 1 ) * this.fundamental;
        this.box.bases.forEach( ( b, i ) => {
            this.maxWeight = reduce( this.maxWeight, ( b - 1 ) * this.fundamental );
        });
    }

    analyzeOrbits() {

        const maxIndex = this.box.volume - 1;

        var totalHarmonicSum = new Array( this.box.bases.length ).fill( 0 );
        var totalWeight = 0;
        var totalRotation = 0;
        var totalJumpage = 0;
        var totalRadiance = 0;
        var totalPerimeter = 0;
        var totalDiameterSum = 0;
        var totalTension = 0;

        var totalOrderSpace = 1;
        var totalNetOrderSpace = 1;
        var totalNet2Space = 0;

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

            orbit.diameterSum = coords
                    .map( (x,i) => distance2( x.coord, this.idx[x.reflectId].coord ) )
                    .reduce( (a,c) => a + c, 0 );

            orbit.perimeter = coords
                    .map( (x,i) => distance2( x.coord, coords[ ( i + 1 ) % orbit.order ].coord ) )
                    .reduce( (a,c) => a + c, 0 );

            orbit.attack = Math.sqrt( orbit.perimeter ) / orbit.order;


            orbit.jumps = coords
                .map( (x,i) => x.jump );

            // jumpage counts half the jump per coord
            orbit.jumpage = orbit.jumps
                .reduce( (a,c) => a + Math.abs( c ), 0 ) / 2;

            orbit.radiants = coords
                .map( (x,i) => x.radiant );
            orbit.radiance = orbit.radiants
                .reduce( (a,c) => a + Math.abs( c ), 0 );



            [
                orbit.midi.instrument,
                orbit.midi.percussion,
                orbit.midi.channel,
                orbit.midi.repeat
            ] = getInstrumentForOrder( orbit.order );

            totalHarmonicSum = orbit.harmonicSum.map( (x, i)  => x + totalHarmonicSum[i] );
            totalPerimeter += orbit.perimeter;
            totalDiameterSum += orbit.diameterSum;



            totalWeight += orbit.weight;
            totalJumpage += orbit.jumpage;
            totalRadiance += orbit.radiance;

            totalOrderSpace *= orbit.order;
            totalNetOrderSpace *= orbit.isSelfConjugate()
                ? ( orbit.order / 2 )
                : orbit.isFirstConjugate()
                    ? orbit.order
                    : 1;

            totalNet2Space += orbit.isSelfConjugate() || orbit.isFirstConjugate() ? 1 : 0;
        }

        Object.entries( cycleIndexMonomial ).sort( (a, b) => a < b );
        this.cycleIndexMonomial = cycleIndexMonomial;

        this.totalOrderSpace = totalOrderSpace;
        this.totalNetOrderSpace = totalNetOrderSpace;
        this.totalNet2Space = totalNet2Space;

        this.totalHarmonicSum = totalHarmonicSum;
        this.totalPerimeter = totalPerimeter;
        this.totalDiameterSum = totalDiameterSum;
        this.harmonics = harmonics;
        this.maxIndex = maxIndex;
        this.totalWeight = totalWeight;
        this.totalJumpage = totalJumpage;
        this.totalRadiance = totalRadiance;

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
