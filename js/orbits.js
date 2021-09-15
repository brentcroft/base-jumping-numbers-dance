
var basePlanes = {};

function getBasePlane( key ) {
    return basePlanes[key];
}

function putBasePlane( key, basePlane ) {
    basePlane.key = key;
    basePlanes[key] = basePlane;

    //console.log( basePlane );
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


class Point {
    constructor( coord = [], centre ) {
        this.coord = [ ...coord ];
        this.euclideanRadiance = centre ? 2 * distance2( this.coord, centre ) : 0;
        this.indexes = [];
    }

    report() {
        return `Point: ${ canonicalize( this.coord ) }, erad: ${ this.euclideanRadiance } \n`
            + this.indexes.map( ( x, i ) => `${ i }: ${ JSON.stringify( x ) }` ).join( "\n" );
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

        this.rank = this.coords[0].coord.length;
        this.order = this.coords.length;
        this.centre = new Array( this.rank ).fill( 0 );

        this.sum = new Array( this.rank ).fill( 0 );
        this.coords.forEach( ( item, index ) => {
            for ( var i = 0; i < this.rank; i++ ) {
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

    torsion() {
        return ( this.indexRadiance - this.indexPerimeter );
    }

    tension() {
        return ( this.euclideanRadiance - this.euclideanPerimeter );
    }

    isSelfConjugate() {
        return this.index == this.conjugate.index;
    }

    isFirstConjugate() {
        return this.index < this.conjugate.index;
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
        return this.coords.reduce( (a, coord ) => a + coord.indexes[this.parent.id].id, 0 );
    }

    getDiSum() {
        return this.coords.reduce( (a, coord ) => a + coord.di.indexes[this.parent.id], 0 );
    }
}

class Index {

    initialise() {
        this.buildOrbits();
        this.buildCentreLines();
        this.findFundamental();
        this.findMaxWeight();
        this.analyzeOrbits();
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

    // EUCLIDEAN RADIANCE
    identityEuclideanRadiance() {
        const points = this.identities.map( x => x.coords[0] );
        const radii = points.map( p => p.euclideanRadiance );
        return radii.reduce( (a,r) => a + r, 0);
    }

    grossEuclideanRadiance() {
        //return this.box.euclideanRadiance;
        return this.identityEuclideanRadiance() + this.totalEuclideanRadiance;
    }

    // EUCLIDEAN PERIMETER
    identityEuclideanPerimeter() {
        return 0;
//        const stationaryCentres = 2 + (this.identities.length % 2 );
//        return 2 * ( this.identities.length - stationaryCentres );
    }

    grossEuclideanPerimeter() {
        return this.identityEuclideanPerimeter() + this.totalEuclideanPerimeter;
    }

    // EUCLIDEAN TENSION
    identityEuclideanTension() {
        return this.identityEuclideanRadiance() - this.identityEuclideanPerimeter();
    }

    grossEuclideanTension() {
        return this.grossEuclideanRadiance() - this.grossEuclideanPerimeter();
    }

    // INDEX RADIANCE
    identityIndexRadiance() {
        return this.identities.reduce( (a, p) => a + Math.abs( p.coords[0].indexes[this.id].radiant ), 0 ) / 2;
    }

    grossIndexRadiance() {
        return this.identityIndexRadiance() + this.totalIndexRadiance;
    }

    // INDEX PERIMETER
    identityIndexPerimeter() {
        return this.identities
            .map( identityOrbit => identityOrbit.coords[0] )
            .map( indexedIdentity => indexedIdentity.indexes[ this.id ] )
            .map( identity => identity.jump )
            .reduce( (a,c) => a + c, 0 );
    }

    grossIndexPerimeter() {
        return this.identityIndexPerimeter() + this.totalIndexPerimeter;
    }

    // INDEX TORSION
    identityIndexTorsion() {
        return this.identityIndexRadiance() - this.identityIndexPerimeter();
    }

    grossIndexTorsion() {
        return this.grossIndexRadiance() - this.grossIndexPerimeter();
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
                d: this.grossEuclideanRadiance(),
                p: this.grossEuclideanPerimeter(),
                //this.tension()
            },

            index: {
                d: this.grossIndexRadiance(),
                p: this.grossIndexPerimeter(),
                //this.torsion()
            }
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

    analyzeOrbits() {

        const maxIndex = this.box.volume - 1;

        var totalHarmonicSum = new Array( this.bases.length ).fill( 0 );
        var totalWeight = 0;
        var totalRotation = 0;

        var totalEuclideanRadiance = 0;
        var totalEuclideanPerimeter = 0;
        var totalIndexRadiance = 0;
        var totalIndexPerimeter = 0;
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

            // EUCLIDEAN
            orbit.euclideanRadiance = coords
                    .map( x => x.euclideanRadiance )
                    .reduce( (a,c) => a + c, 0 );

            orbit.euclideanPerimeter = coords
                    .map( (x,i) => distance2( x.coord, coords[ ( i + 1 ) % orbit.order ].coord ) )
                    .reduce( (a,c) => a + c, 0 ) / 2;

            // INDEX
            orbit.indexRadiance = coords
                .map( (x,i) => x.indexes[this.id].radiant )
                .reduce( (a,c) => a + Math.abs( c ), 0 ) / 2;

            orbit.jumps = coords
                .map( (x,i) => x.indexes[this.id].jump );

            orbit.indexPerimeter = orbit.jumps
                .reduce( (a,c) => a + Math.abs( c ), 0 ) / 2;

            [
                orbit.midi.instrument,
                orbit.midi.percussion,
                orbit.midi.channel,
                orbit.midi.repeat
            ] = getInstrumentForOrder( orbit.order );

            totalHarmonicSum = orbit.harmonicSum.map( (x, i)  => x + totalHarmonicSum[i] );
            totalEuclideanPerimeter += orbit.euclideanPerimeter;
            totalEuclideanRadiance += orbit.euclideanRadiance;

            totalWeight += orbit.weight;
            totalIndexPerimeter += orbit.indexPerimeter;
            totalIndexRadiance += orbit.indexRadiance;

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

        this.totalIndexRadiance = totalIndexRadiance;
        this.totalIndexPerimeter = totalIndexPerimeter;

        this.totalEuclideanRadiance = totalEuclideanRadiance;
        this.totalEuclideanPerimeter = totalEuclideanPerimeter;

        this.harmonics = harmonics;
        this.maxIndex = maxIndex;
        this.totalWeight = totalWeight;

        // reference into each orbit
        this.originPoints = this.orbits.map( orbit => 0 );
        this.locusPoints = [].concat( this.originPoints );
    }

    buildCentreLines() {

        const allowance = 0.00000000001;
        const [ A, B ] = this.box.diagonal;
        const boxCentre = this.box.centre;

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

                const unit = displacement( centre, centre );
                const scaledUnit = scale( unitDisplacement( centre, boxCentre ), 0.5 );

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
                    subtraction( subtraction( boxCentre, unit ), scaledUnit),
                    addition( addition( boxCentre, unit ), scaledUnit)
                ];

                centreLines.push( { "points": points, "unit": unitDisplacement( centre, boxCentre ), "pd": cpd }  );
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

}


class RadiantIndex extends Index {
    constructor( box, id = 0 ) {
        super();
        this.box = box;
        this.id = id;
        this.key = `plane-${ id }`;

        // local copy
        this.bases = [ ...box.bases ];

        this.idx = new Array( this.box.volume );
        this.dix = new Array( this.box.volume );

        this.powersForward = placeValuesForwardArray( this.bases );
        this.powersReverse = placeValuesReverseArray( this.bases );

        this.indexForward = ( coord ) => this.powersForward.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c, 0 );
        this.indexReverse = ( coord ) => ( this.box.volume - 1 ) - this.indexForward( coord );

        // plane of identity
        this.identityPlane = this.powersForward.map( ( x, i ) => x - this.powersReverse[i] );
        this.identityPlaneGcd = Math.abs( gcda( this.identityPlane ) );
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );
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

        const nonTrivialIndexJump = 0.5;

        // point references data by index
        point.indexes[this.id] = {
            id: id,
            di: di,
            reflectId: reflectId,
            jump: isNonTrivialIndexIdentity( id, di ) ? nonTrivialIndexJump : ( di - id ),
            radiant: ( reflectId - id )
        };
    }


    getPlaneEquationTx() {
        return "(radiance)";
    }

}

class PointIndex extends Index {
    constructor( box, id = 0 ) {
        super();
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
        this.identityPlane = this.powersForward.map( ( x, i ) => x - this.powersReverse[i] );
        this.identityPlaneGcd = Math.abs( gcda( this.identityPlane ) );
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );
    }


    initialise() {
        this.buildOrbits();
        this.buildCentreLines();
        this.findFundamental();
        this.findMaxWeight();
        this.analyzeOrbits();
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

        const nonTrivialIndexJump = 0.5;

        // point references data by index
        point.indexes[this.id] = {
            id: id,
            di: di,
            reflectId: reflectId,
            jump: isNonTrivialIndexIdentity( id, di ) ? nonTrivialIndexJump : ( di - id ),
            radiant: ( reflectId - id )
        };
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

