
class Index {

    constructor( box, id = 0 ) {
        this.box = box;
        this.id = id;
        this.key = `plane-${ id }`;

        // local copy
        this.bases = [ ...box.bases ];

        this.idx = new Array( this.box.volume );
        this.dix = new Array( this.box.volume );
    }


    initialise() {
        this.buildOrbits();
        this.buildCentreLines();
        this.findFundamental();
        this.findMaxWeight();
        this.analyzeOrbits();
    }

    isNonTrivialIndexIdentity( id, di ) {
        const boxVolume = this.box.volume;
        const maxIndex = boxVolume - 1;
        const halfMaxIndex = maxIndex / 2;
        return (di == id)
            && (id != 0)
            && (id != maxIndex)
            && (id != halfMaxIndex);
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
        const nonTrivialIndexJump = 0.5;

        // point references data by index
        point.indexes[this.id] = {
            id: id,
            di: di,
            reflectId: reflectId,
            jump: this.isNonTrivialIndexIdentity( id, di ) ? nonTrivialIndexJump : ( di - id ),
            radiant: ( reflectId - id )
        };
    }


    joinPoints( pointIds ) {

        const [ p1, p2 ] = pointIds.map( id => this.box.points[ id ] );
        const [ p1c, p2c ] = [ p1.conjugate, p2.conjugate ];

        const [ d1, d2, d1c, d2c ] = [
            p1.indexes[this.id],
            p2.indexes[this.id],
            p1c.indexes[this.id],
            p2c.indexes[this.id]
        ];

        const [ di1, di2, di1c, di2c ] = [
            d1.di,
            d2.di,
            d1c.di,
            d2c.di
        ];

        // point references data by index
        d1.di = di2;
        d2.di = di1;
        d1c.di = di2c;
        d2c.di = di1c;

        [ d1, d2, d1c, d2c ]
            .forEach( p => p.jump = ( p.di - p.id ) );

        this.initialise();
    }

    getJson() {
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

    updateOrbitIndexes() {
        this.orbits.forEach( ( orbit, index ) => orbit.index = index + 1 );
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


    // EUCLIDEAN RADIANCE
    identityEuclideanRadiance() {
        return this
            .identities
            .map( x => x.coords[0] )
            .map( p => p.euclideanRadiance )
            .reduce( (a,r) => a + r, 0);
    }

    orbitEuclideanRadiance() {
        return this
            .orbits
            .map( p => p.euclideanRadiance() )
            .reduce( (a,r) => a + r, 0);
    }

    grossEuclideanRadiance() {
        //return this.box.euclideanRadiance;
        return this.identityEuclideanRadiance() + this.orbitEuclideanRadiance();
        //return this.identityEuclideanRadiance() + this.totalEuclideanRadiance;
    }


    // EUCLIDEAN PERIMETER
    identityEuclideanPerimeter() {
        return 0;
    }

    orbitEuclideanPerimeter() {
        return this
            .orbits
            .map( p => p.euclideanPerimeter() )
            .reduce( (a,r) => a + r, 0);
    }

    grossEuclideanPerimeter() {
        //return this.identityEuclideanPerimeter() + this.totalEuclideanPerimeter;
        return this.identityEuclideanPerimeter() + this.orbitEuclideanPerimeter();
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
        return this
            .identities
            .map( x => x
                .coords
                .map( p => Math.abs( p.indexes[this.id].radiant ) )
                .reduce( (a,c) => a + c, 0 ) )
            .reduce( (a, c) => a + c, 0 ) / 2;
    }

    orbitIndexRadiance() {
        return this
            .orbits
            .map( x => x
                .coords
                .map( p => Math.abs( p.indexes[this.id].radiant ) )
                .reduce( (a,c) => a + c, 0 ) )
            .reduce( (a, c) => a + c, 0 ) / 2;
    }

    grossIndexRadiance() {
        //return this.identityIndexRadiance() + this.orbitIndexRadiance();
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

    orbitIndexPerimeter() {
        return this
            .orbits
            .reduce( (a, orbit) => a + orbit.indexPerimeter(), 0 );
    }

    grossIndexPerimeter() {
        //return this.identityIndexPerimeter() + this.totalIndexPerimeter;
        return this.identityIndexPerimeter() + this.orbitIndexPerimeter();
    }

    // INDEX TORSION
    identityIndexTorsion() {
        return this.identityIndexRadiance() - this.identityIndexPerimeter();
    }

    grossIndexTorsion() {
        return this.grossIndexRadiance() - this.grossIndexPerimeter();
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

                var orbit = new Orbit( this, this.orbits.length + 1, extractOrbitCoordsAndTally( i, this.idx, tally ) );

                // only for radiants
                if ( i == 0 && orbit.order == 2 ) {

                    const [ coordsA, coordsB ] = orbit.conjugateCoords();

                    coordsA
                        .map( p => p.indexes[indexId] )
                        .forEach( p => {
                            p.jump = 0;
                        } );
                    coordsB
                        .map( p => p.indexes[indexId] )
                        .forEach( p => {
                            p.jump = 0;
                        } );

                    orbit = new Orbit( this, this.identities.length + 1, coordsA );
                    const conjugateOrbit = new Orbit( this, this.identities.length + 2, coordsB  );

                    orbit.conjugate = conjugateOrbit;
                    conjugateOrbit.conjugate = orbit;

                    this.identities.push( orbit );
                    this.identities.push( conjugateOrbit );

                    continue;
                }

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

            [
                orbit.midi.instrument,
                orbit.midi.percussion,
                orbit.midi.channel,
                orbit.midi.repeat
            ] = getInstrumentForOrder( orbit.order );

            totalHarmonicSum = orbit.harmonicSum.map( (x, i)  => x + totalHarmonicSum[i] );
            totalEuclideanPerimeter += orbit.euclideanPerimeter();
            totalEuclideanRadiance += orbit.euclideanRadiance();

            totalWeight += orbit.weight;
            totalIndexPerimeter += orbit.indexPerimeter( this.id );
            totalIndexRadiance += orbit.indexRadiance( this.id );

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
                                subtraction( subtraction( indexPlane.box.centre, unit ), scaledUnit),
                                addition( addition( indexPlane.box.centre, unit ), scaledUnit)
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

    rotateOrbits( orbitIds, times = 1 ) {

        const orbits = orbitIds
            .map( id => this.orbits.filter( x => x.index == id )[0] )
            .filter( orbit => orbit.isSelfConjugate() || orbit.isFirstConjugate() );

        orbits.forEach( orbit => {
            orbit.rotate( times );
            if ( !orbit.isSelfConjugate() && !orbit.isFirstConjugate() ) {
                orbit.conjugate.rotate( times )
            }
        } );
    }

    mergeOrbits( orbitIds, mergeType ) {

        const orbits = orbitIds
            .map( id => this.orbits.filter( x => x.index == id )[0] )
            .filter( orbit => orbit.isSelfConjugate() || orbit.isFirstConjugate() );

        var orbit = orbits[0];

        for ( var oi = 1; oi < orbits.length; oi++ ) {
            const orbit2 = orbits[oi];

            const idsToRemove = [
                    this.orbits.indexOf( orbit ),
                    this.orbits.indexOf( orbit.conjugate ),
                    this.orbits.indexOf( orbit2 ),
                    this.orbits.indexOf( orbit2.conjugate ),
                ]
                .reduce( (unique,id) => unique.includes( id ) ? unique : [...unique, id ], [] );
            idsToRemove.sort( (a,b) => b - a );
            idsToRemove.forEach( id => this.orbits.splice( id, 1) );

            const [ o1a, o1b ] = orbit.conjugateCoords();
            const [ o2b, o2a ] = orbit2.conjugateCoords();

            const coordsA = interleave( o1a, o2a );
            const coordsB = interleave( o1b, o2b );

            if ( orbit.isSelfConjugate() ) {
                const coords = [ ...coordsA, ...coordsB ];

                // switch master
                orbit = new Orbit( this, orbit.index, coords );
                orbit.conjugate = orbit;
                orbit.centreRef = 0;

                this.orbits.splice( idsToRemove[0], 0, orbit );

            } else {
                // switch master
                orbit = new Orbit( this, orbit.index, coordsA );
                const orbitB = new Orbit( this, orbit2.index, coordsB );

                orbit.conjugate = orbitB;
                orbit.centreRef = 0;
                orbitB.conjugate = orbit;
                orbitB.centreRef = 0;

                this.orbits.splice( idsToRemove[0], 0, orbit, orbitB );
            }
            this.updateOrbitIndexes();
        }
        this.analyzeOrbits();
    }


    conjugateOrbits( orbitIds, mergeType ) {

        const orbits = orbitIds
            .map( id => this.orbits.filter( x => x.index == id )[0] )
            .filter( orbit => orbit.isSelfConjugate() || orbit.isFirstConjugate() );

        var orbit = orbits[0];

        for ( var oi = 1; oi < orbits.length; oi++ ) {
            const orbit2 = orbits[oi];

            const idsToRemove = [
                    this.orbits.indexOf( orbit ),
                    this.orbits.indexOf( orbit.conjugate ),
                    this.orbits.indexOf( orbit2 ),
                    this.orbits.indexOf( orbit2.conjugate )
                ]
                .reduce( (unique,id) => unique.includes( id ) ? unique : [...unique, id ], [] );
            idsToRemove.sort( (a,b) => b - a );
            idsToRemove
                .forEach( id => this.orbits.splice( id, 1) );

            const [ o1a, o1b ] = orbit.conjugateCoords();
            const [ o2b, o2a ] = orbit2.conjugateCoords();

            const coordsA = interleave( o1a, o2a );
            const coordsB = interleave( o1b, o2b );

            // switch master
            orbit = new Orbit( this, orbit.index, coordsA );
            const orbitB = new Orbit( this, orbit2.index, coordsB );

            orbit.conjugate = orbitB;
            orbit.centreRef = 0;
            orbitB.conjugate = orbit;
            orbitB.centreRef = 0;

            this.orbits.splice( orbit.index - 1, 0, orbitB );
            this.orbits.splice( orbit.index - 1, 0, orbit );

            this.updateOrbitIndexes();
        }
        this.analyzeOrbits();
    }

}
