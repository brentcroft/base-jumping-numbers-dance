

class Box {
    constructor( bases ) {
        this.bases = [...bases];
        this.rank = this.bases.length;

        this.volume = getVolume( this.bases );
        this.radiance = getRadiance( this.volume );
        this.volumeUnits = getUnits( this.volume );

        this.surfaceArea = getSurfaceArea( this.bases );
        this.brilliance = getBrilliance( this.bases );

        // since each coord plus it's reflection in the centre equals the terminal
        this.sum = this.bases.map( ( x, i ) => ( x - 1 ) * this.volume / 2 );

        // even times odd has to be even
        this.indexSum = ( this.volume * ( this.volume - 1 ) / 2 );
        this.indexCentre = ( this.volume - 1 ) / 2;

        // fixed points
        this.origin = new Array( bases.length ).fill( 0 );
        this.terminal = this.bases.map( x => x - 1 );
        this.diagonal = [ this.origin, this.terminal ];

        // abstract fixed point when volume is even
        this.centre = this.bases.map( b => ( b - 1 ) / 2 );
    }

    getJson() {
        return {
           bases: this.bases,
           sum: this.sum,
           idSum: this.indexSum,
           units: this.volumeUnits.length,
           volume: this.volume,
           area: this.surfaceArea,
           brilliance: this.brilliance,
           radiance: this.radiance
       };
    }

    toString() {
        return JSON.stringify( this.getJson(), null, 4 );
    }
}


class Point {
    constructor( coord = [], centre ) {
        this.coord = [ ...coord ];
        this.brilliance = centre ? distance2( this.coord, centre ) * 2 : 0;
        this.indexes = [];
    }

    report() {
        return `Point: ${ canonicalize( this.coord ) }, brilliance: ${ this.brilliance } \n`
            + this.indexes.map( ( x, i ) => `${ i }: ${ JSON.stringify( x ) }` ).join( "\n" );
    }

    toString() {
        return canonicalize( this.coord );
    }
}



class PointIndex {
    constructor( box, id = 0 ) {
        this.box = box;
        this.id = id;
        this.key = `plane-${ id }`;

        // local copy
        this.bases = [ ...box.bases ];

        // indexers
        rotateArray( this.bases, this.id );
        this.powersForward = placeValuesForwardArray( this.bases );
        this.powersReverse = placeValuesReverseArray( this.bases );

        // coord index functions
        const rotateId = (i) => ( i + this.id ) % this.bases.length;
        this.indexForward = ( coord ) => this.powersForward.map( (b,i) => b * coord[rotateId(i)] ).reduce( (a,c) => a + c, 0 );
        this.indexReverse = ( coord ) => this.powersReverse.map( (b,i) => b * coord[rotateId(i)] ).reduce( (a,c) => a + c, 0 );

        this.idx = new Array( this.box.volume );
        this.dix = new Array( this.box.volume );

        // plane of identity
        this.centre = this.bases.map( x => ( x - 1 ) / 2 );
        this.identityPlane = this.powersForward.map( ( x, i ) => x - this.powersReverse[i] );
        this.identityPlaneGcd = Math.abs( gcda( this.identityPlane ) );
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );
    }

    getPlaneEquationTx() {
        const basis = this.identityPlane.length;
        const varIds = d => [ "x", "y", "z", "w", "v", "u", "t", "s", "r", "q", "p" ].map( x => `<i>${ x }</i>` )[d];
        var plane = this
            .identityPlane
            .map( x => x );

        const pad = s => `${ s }`.padStart( 2, " " );

        var planeMid = plane
            .map( ( x, i ) => `${ x < 0 ? " + " : " - " }${ pad( Math.abs( x ) ) }${ varIds( i ) }` )
            .slice( 1, basis - 1 )
            .join("");

        var eqn = `${ pad( -1 * plane[0] ) }${ varIds( 0 ) }`;
        eqn += `${ planeMid }`;
        eqn += " = ";
        eqn += `${ pad( plane[ basis - 1 ] ) }${ varIds( basis - 1) }`;
        return eqn;
    }

    getCaptionHtml() {
        var cimHtml = "plane: <span class='equation'>" + this.getPlaneEquationTx() + "</span>, ";
        cimHtml += " <span class='equation'>|e| - 1 = " + this.identityPlaneGcd + "</span>";
        cimHtml += " | orbits: <span class='monomial'>" + getCycleIndexMonomialHtml( this ) + "</span>";
        return cimHtml;
    }

    // BRILLIANCE
    identityBrilliance() {
        const points = this.identities.map( x => x.coords[0] );
        const radii = points.map( p => 2 * distance2( p.coord, this.centre ) );
        return radii.reduce( (a,r) => a + r, 0);
    }

    grossBrilliance() {
        //return this.box.brilliance;
        return this.identityBrilliance() + this.totalBrilliance;
    }

    // PERIMETER
    identityPerimeter() {
        return 0;
//        const stationaryCentres = 2 + (this.identities.length % 2 );
//        return 2 * ( this.identities.length - stationaryCentres );
    }

    grossPerimeter() {
        return this.identityPerimeter() + this.totalPerimeter;
    }

    // TENSION
    identityTension() {
        return this.identityBrilliance() - this.identityPerimeter();
    }

    grossTension() {
        return this.grossBrilliance() - this.grossPerimeter();
    }

    // RADIANCE
    identityRadiance() {
        return this.identities.reduce( (a, p) => a + Math.abs( p.coords[0].indexes[this.id].radiant ), 0 ) / 2;
    }

    grossRadiance() {
        return this.identityRadiance() + this.totalRadiance;
    }

    // JUMPAGE
    identityJumpage() {
        const stationaryCentres = 2 + (this.identities.length % 2 );
        return ( this.identities.length - stationaryCentres ) / 2;
    }

    grossJumpage() {
        return this.identityJumpage() + this.totalJumpage;
    }

    // TORSION
    identityTorsion() {
        return this.identityRadiance() - this.identityJumpage();
    }

    grossTorsion() {
        return this.grossRadiance() - this.grossJumpage();
    }

    getData() {
        return {
            id: this.id,
            equation: this.getPlaneEquationTx(),
            box: this.box.getJson(),

            cycles: {
                fixed: this.identities.length,
                orbits: this.orbits.length,
                order: this.fundamental
            },

            euclidean: {
                d: this.grossBrilliance(),
                p: this.grossPerimeter(),
                //this.tension()
            },

            index: {
                d: this.grossRadiance(),
                p: this.grossJumpage(),
                //this.torsion()
            }
        };
    }

    indexPoint( point ) {
        const boxVolume = this.box.volume;
        const id = this.indexForward( point.coord );
        const di = this.indexReverse( point.coord );
        const reflectId = ( boxVolume - id - 1 );

        if ( id < 0 || di < 0 || id >= boxVolume || di >= boxVolume ) {
            throw `id out of range: id=${ id }, volume=${ boxVolume }`;
        }

        // index references point
        this.idx[ id ] = point;
        this.dix[ di ] = point;

        const maxIndex = boxVolume - 1;
        const halfMaxIndex = maxIndex / 2;
        const isNonTrivialIndexIdentity = (id, di) => (di == id)
            && (id != 0)
            && (id != maxIndex)
            && (id != halfMaxIndex);

        // point references data by index
        point.indexes[this.id] = {
            id: id,
            di: di,
            reflectId: reflectId,
            jump: isNonTrivialIndexIdentity( id, di ) ? 1 : ( di - id ),
            radiant: ( reflectId - id )
        };
    }


    buildOrbits() {
        this.identities = [];
        this.orbits = [];
        const tally = [ ...this.dix ];
        const indexId = this.id;

        function extractOrbitCoordsAndTally( startIndex, idx, tally ) {
            var point = idx[ startIndex ];
            tally[ startIndex ] = -1;
            const coords = [ point ];

            var di = point.indexes[indexId].di;

            while ( di != startIndex ) {
                tally[ di ] = -1;
                point = idx[ di ];
                coords.push( point );

                di = point.indexes[indexId].di;
            }
            return coords;
        }

        for ( var i = 0; i < this.idx.length; i++) {
            if ( tally[ i ]!= -1 ) {

                const orbit = new Orbit( this, this.orbits.length + 1, extractOrbitCoordsAndTally( i, this.idx, tally ) );

                if ( orbit.order == 1 ) {
                    this.identities.push( orbit );
                } else {
                    this.orbits.push( orbit );
                }

                const point = this.idx[ i ];
                var antipodesCoord = this.idx[ point.indexes[indexId].reflectId ];

                if (tally[ antipodesCoord.indexes[indexId].di ] == -1) {
                    // orbit is conjugate to self
                    orbit.conjugate = orbit;

                } else {
                    const conjugateOrbit = new Orbit( this, this.orbits.length + 1, extractOrbitCoordsAndTally( antipodesCoord.indexes[indexId].id, this.idx, tally ) );

                    conjugateOrbit.conjugate = orbit;
                    orbit.conjugate = conjugateOrbit;

                    if ( conjugateOrbit.order == 1 ) {
                        this.identities.push( conjugateOrbit );
                    } else {
                        this.orbits.push( conjugateOrbit );
                    }
                }
            }
        }
        this.identities.sort( (a,b) => a.coords[0].indexes[indexId].id - b.coords[0].indexes[indexId].id );
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

        function assignCentreRef( indexPlane, orbit ) {
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

                const unit = displacement( centre, indexPlane.centre );
                const scaledUnit = scale( unitDisplacement( centre, indexPlane.centre ), 0.5 );

                for ( var i = 1; i < centreLines.length; i++) {
                    const pd = perpendicularDistance( centre, centreLines[i].points, centreLines[i].unit );
                    if ( pd < allowance ) {
                        if ( cpd > centreLines[i].pd ) {
                            centreLines[i].points = [
                                subtraction( subtraction( indexPlane.centre, unit ), scaledUnit),
                                addition( addition( indexPlane.centre, unit ), scaledUnit)
                            ];
                        }
                        return i;
                    }
                }

                const points = [
                    subtraction( subtraction( indexPlane.centre, unit ), scaledUnit),
                    addition( addition( indexPlane.centre, unit ), scaledUnit)
                ];

                centreLines.push( { "points": points, "unit": unitDisplacement( centre, indexPlane.centre ), "pd": cpd }  );
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
        this.maxWeight = ( this.bases[0] - 1 ) * this.fundamental;
        this.bases.forEach( ( b, i ) => {
            this.maxWeight = reduce( this.maxWeight, ( b - 1 ) * this.fundamental );
        });
    }

    analyzeOrbits() {

        const maxIndex = this.box.volume - 1;

        var totalHarmonicSum = new Array( this.bases.length ).fill( 0 );
        var totalWeight = 0;
        var totalRotation = 0;
        var totalJumpage = 0;
        var totalRadiance = 0;
        var totalPerimeter = 0;
        var totalBrilliance = 0;
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

            orbit.brilliance = coords
                    .map( x => x.brilliance )
                    .reduce( (a,c) => a + c, 0 );

            orbit.perimeter = coords
                    .map( (x,i) => distance2( x.coord, coords[ ( i + 1 ) % orbit.order ].coord ) )
                    .reduce( (a,c) => a + c, 0 );

            orbit.jumps = coords
                .map( (x,i) => x.indexes[this.id].jump );

            orbit.jumpage = orbit.jumps
                .reduce( (a,c) => a + Math.abs( c ), 0 ) / 2;

            orbit.radiants = coords
                .map( (x,i) => x.indexes[this.id].radiant );

            orbit.radiance = orbit.radiants
                .reduce( (a,c) => a + Math.abs( c ), 0 ) / 2;

            [
                orbit.midi.instrument,
                orbit.midi.percussion,
                orbit.midi.channel,
                orbit.midi.repeat
            ] = getInstrumentForOrder( orbit.order );

            totalHarmonicSum = orbit.harmonicSum.map( (x, i)  => x + totalHarmonicSum[i] );
            totalPerimeter += orbit.perimeter;
            totalBrilliance += orbit.brilliance;

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
        this.totalBrilliance = totalBrilliance;

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




class IndexedBox {
    constructor( bases = [] ) {
        this.box = new Box( bases );
        this.key = "box-" + this.box.bases.join( "." );

        this.indexPlanes = [];

        if ( bases.length <= 2 ) {
            this.indexPlanes.push( new PointIndex( this.box, 0 ) );
        } else {
            for ( var i = 0; i < bases.length; i++ ) {
                this.indexPlanes.push( new PointIndex( this.box, i ) );
            }
        }

        this.buildIndexes();

        this.indexPlanes.forEach( plane => {
            plane.buildOrbits();
            plane.buildCentreLines();
            plane.findFundamental();
            plane.findMaxWeight();
            plane.analyzeOrbits();
        } );
    }

    buildIndexes( place = 0, locusStack = [] ) {
        if ( place == this.box.bases.length ) {
            const point = new Point( locusStack, this.box.centre );
            this.indexPlanes.forEach( indexer => indexer.indexPoint( point ) );
        } else {
            for ( var i = 0; i < this.box.bases[place]; i++) {
                locusStack.push( i );
                this.buildIndexes( place + 1, locusStack );
                locusStack.pop( i );
            }
        }
    }


    getDataHtml() {
        const sep = ", ";
        const planeDataFn = ( data ) => ""
                           + "id: " + JSON.stringify( data.id ) + sep
                           + "cycles: " + JSON.stringify( data.cycles ) + sep
                           + "plane: " + JSON.stringify( data.equation ) + sep
                           + "euclidean: " + JSON.stringify( data.euclidean ) +sep
                           + "index: " + JSON.stringify( data.index );

        var dataHtml = "" + JSON.stringify( this.box.getJson() );
        dataHtml += "\n";
        dataHtml += this
            .indexPlanes
            .map( plane => planeDataFn( plane.getData() ) )
            .join( "\n" );

        return dataHtml;
    }
}