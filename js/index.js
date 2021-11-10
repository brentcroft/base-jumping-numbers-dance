
var nonTrivialIndexJump = 0.5;
var nonTrivialPerimeterJump = 0.0;

class Index {

    constructor( box, id = 0 ) {
        this.box = box;
        this.id = id;
        this.key = `plane-${ id }`;
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
        return (di == id)
            && (id != 0)
            && (id != maxIndex)
            && gcd( id, maxIndex) == 1;
    }

    getIdentityPoint() {
        return this.identities[0].points[0];
    }

    getJump( id, di ) {
        if (this.isNonTrivialIndexIdentity( id, di ) ) {
            return nonTrivialIndexJump;
        } else {
            return ( di - id );
        }
    }

    getPointFromIdx( id ) {
        return this.idx[ id ];
    }

    getPointFromDix( id ) {
        return this.dix[ id ];
    }


    getOrbit( point ) {
        const orbit = this.orbits.find( orbit => orbit.points.includes( point ) );
        return orbit ? orbit : this.identities.find( identity => identity.points.includes( point ) );
    }

    apply( point ) {
        return this.getPointFromIdx( this.pointAt( point ).di );
    }

    applyInverse( point ) {
        return this.getPointFromDix( this.pointAt( point ).id );
    }

    stepForward( point, p = 1 ) {
        for ( var i = 0; i < p; i++ ) {
            point = this.apply( point );
        }
        return point;
    }

    stepBackward( point, p = 1 ) {
        for ( var i = 0; i < p; i++ ) {
            point = this.applyInverse( point );
        }
        return point;
    }


    pointsOperation( a, b, inverse = false ) {
        const orbit = this.getOrbit( b );
        if ( orbit.engages( a ) ) {
            const position = orbit.position( a );
            return inverse
                ? this.stepBackward( b, position )
                : this.stepForward( b, position );
        } else {
            return null;
        }
    }

    convolve( a, b ) {
        return this.pointsOperation( a, b );
    }

    convolveInverse( a, b ) {
        return this.pointsOperation( a, b, true );
    }

    pointAt( point ) {
        return point.at(this.id);
    }

    indexPoint( point ) {
        const boxVolume = this.box.volume;
        const di = this.indexForward( point.coord );
        const id = this.indexReverse( point.coord );

        this.box.validateIds( [ id, di ] );

        const conjugateId = ( boxVolume - id - 1 );

        // point references this index by
        point.indexes[this.id] = {
            id: id,
            di: di,
            conjugateId: conjugateId,
            jump: this.getJump( id, di ),
            radiant: ( conjugateId - id )
        };

        this.idx[ id ] = point;
        this.dix[ di ] = point;
    }

    joinPoints( pointIds, joinType = 0 ) {

        console.log( `join: type=${ joinType }, ids: ${ pointIds }` );

        const [ p1, q1 ] = pointIds.map( id => this.idx[ id ] );
        const [ p1c, q1c ] = [ p1.conjugate, q1.conjugate ];

        const [ ip1, iq1, ip1c, iq1c ] = [
            p1.indexes[this.id],
            q1.indexes[this.id],
            p1c.indexes[this.id],
            q1c.indexes[this.id]
        ];

        // dix must be maintained
        const [ p0, p0c ] = [ this.dix[ip1.id], this.dix[ip1c.id] ];
        const [ q0, q0c ] = [ this.dix[iq1.id], this.dix[iq1c.id] ];

        //
        const [ p2, p2c ] = [ this.idx[ip1.di], this.idx[ip1c.di] ];
        const [ q2, q2c ] = [ this.idx[iq1.di], this.idx[iq1c.di] ];

        const [ ip0, ip0c, ip2, ip2c ] = [
            p0.indexes[this.id],
            p0c.indexes[this.id],
            p2.indexes[this.id],
            p2c.indexes[this.id]
        ];
        const [ iq0, iq0c, iq2, iq2c, ] = [
            q0.indexes[this.id],
            q0c.indexes[this.id],
            q2.indexes[this.id],
            q2c.indexes[this.id]
        ];

        // cache changing di values
        const [
            dip0,  dip1,  dip2,
            dip0c, dip1c, dip2c,
            diq0,  diq1,  diq2,
            diq0c, diq1c, diq2c
        ] = [
            ip0.di,  ip1.di,  ip2.di,
            ip0c.di, ip1c.di, ip2c.di,
            iq0.di,  iq1.di,  iq2.di,
            iq0c.di, iq1c.di, iq2c.di
        ];

        console.log( `id cache: type=${ [ ip1.id, ip2.id, ip1c.id, ip2c.id, iq0.id, iq1.id, iq2.id, iq0c.id, iq1c.id, iq2c.id ] }` );
        console.log( `di cache: type=${ [ dip1, dip2, dip1c, dip2c, diq0, diq1, diq2, diq0c, diq1c, diq2c ] }` );

        switch( joinType ) {

            case 0: {
                    // then q1 must point at p2
                    iq1.di = ip2.id;
                    iq1c.di = ip2c.id;
                    // if p1 points at q2
                    ip1.di = iq2.id;
                    ip1c.di = iq2c.id;

                    const result = [ ip1, ip1c, iq1, iq1c ];
                    console.log( `joined: ${ result.map( p => "[" + p.id + "," + p.di  + "]" ).join(", ") }` );
                }
                break;


            case 1: if ( ip1.di != iq1.id ){
                    // then q0 must point at p2
                    iq0.di = ip2.id;
                    iq0c.di = ip2c.id;
                    // if p1 points at q1
                    ip1.di = iq1.id;
                    ip1c.di = iq1c.id;

                    const result = [ ip1, ip1c, iq0, iq0c ];
                    console.log( `joined: ${ result.map( p => "[" + p.id + "," + p.di  + "]" ).join(", ") }` );
                } else {
                    const result = [ ip1, ip1c, iq0, iq0c, iq1, iq1c ];
                    throw ( `Invalid join (${ joinType }): iq1.di == iq1.id: ${ result.map( p => "[" + p.id + "," + p.di  + "]" ).join(", ") }` );
                }
                break;


            case 2: if ( ip1.di != iq1.id ) {
                    // then q0 must point at q2
                    iq0.di = diq1;//iq2.id;
                    iq0c.di = diq1c;//iq2c.id;
                    // and q1 points at p2
                    iq1.di = dip1;//ip2.id;
                    iq1c.di = dip1c;//ip2c.id;
                    // if p1 points at q1
                    ip1.di = diq0;//iq1.id;
                    ip1c.di = diq0c;//iq1c.id;

                    const result = [ ip1, ip1c, iq0, iq0c, iq1, iq1c ];
                    console.log( `joined: ${ result.map( p => "[" + p.id + "," + p.di  + "]" ).join(", ") }` );
                } else {
                    const result = [ ip1, ip1c, iq0, iq0c, iq1, iq1c ];
                    throw ( `Invalid join (${ joinType }): iq1.di == iq1.id: ${ result.map( p => "[" + p.id + "," + p.di  + "]" ).join(", ") }` );
                }
                break;


            default:
        }

        // reset dix
        this.dix[ip0.di] = p0;
        this.dix[ip0c.di] = p0c;

        this.dix[ip1.di] = p1;
        this.dix[ip1c.di] = p1c;

        this.dix[ip2.di] = p2;
        this.dix[ip2c.di] = p2c;

        this.dix[iq0.di] = q0;
        this.dix[iq0c.di] = q0c;

        this.dix[iq1.di] = q1;
        this.dix[iq1c.di] = q1c;

        this.dix[iq2.di] = q2;
        this.dix[iq2c.di] = q2c;

        // reset jumps
        [
            ip0,  ip1,  ip2,
            ip0c, ip1c, ip2c,
            iq0,  iq1,  iq2,
            iq0c, iq1c, iq2c
        ].forEach( p => p.jump = this.getJump( p.di - p.id ) );

        this.initialise();
    }

    buildOrbits() {
        this.identities = [];
        this.orbits = [];
        const tally = [ ...this.dix ];
        const indexId = this.id;

        function extractOrbitCoordsAndTally( orbitId, startIndex, idx, tally ) {
            var point = idx[ startIndex ];
            point.at(indexId).orbitId = orbitId;

            tally[ startIndex ] = -1;
            const points = [ point ];

            var di = point.at(indexId).di;

            while ( di != startIndex ) {
                try {
                    tally[ di ] = -1;
                    point = idx[ di ];
                    point.at(indexId).orbitId = orbitId;
                    points.push( point );
                    di = point.at(indexId).di;

                } catch ( e ) {
                    console.log( `Bad orbit: ${ orbitId }`);
                    break;
                }
            }
            return points;
        }

        for ( var i = 0; i < this.idx.length; i++) {
            if ( tally[ i ]!= -1 ) {
                const orbitId = this.orbits.length + 1;
                var orbit = new Orbit( this, orbitId, extractOrbitCoordsAndTally( orbitId, i, this.idx, tally ) );

                // only for radiants
                if ( i == 0 && orbit.order == 2 ) {

                    const [ coordsA, coordsB ] = orbit.conjugateCoords();

                    coordsA
                        .map( p => p.at(indexId) )
                        .forEach( p => {
                            p.jump = 0;
                        } );
                    coordsB
                        .map( p => p.at(indexId) )
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
                var antipodesCoord = this.idx[ point.at(indexId).conjugateId ];

                if ( !antipodesCoord ) {
                    console.log( `Bad point no conjugate: ${ point }`);
                    break;
                }

                if (tally[ antipodesCoord.at(indexId).di ] == -1) {
                    // orbit is conjugate to self
                    orbit.conjugate = orbit;

                } else {
                    const orbitId = this.orbits.length + 1;

                    const conjugateOrbit = new Orbit(
                        this,
                        orbitId,
                        extractOrbitCoordsAndTally( orbitId, antipodesCoord.at(indexId).id, this.idx, tally ) );

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
        this.identities.sort( (a,b) => this.pointAt(a.points[0]).id - this.pointAt(b.points[0]).id );
    }

    analyzeOrbits() {

        const maxIndex = this.box.volume - 1;

        var totalHarmonicSum = new Array( this.box.bases.length ).fill( 0 );
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

            const points = orbit.points;

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
                const scaledUnit = scale( unitDisplacement( centre, boxCentre ), 1 );

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

        const pad = s => `${ s }`.padStart( 1, " " );

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
                const points = [ ...coordsA, ...coordsB ];

                // switch master
                orbit = new Orbit( this, orbit.index, points );
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

    getJson() {
        return {
            id: this.id,
            powers: {
                forward: this.powersForward,
                reverse: this.powersReverse
            },
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
        this.maxWeight = ( this.box.bases[0] - 1 ) * this.fundamental;
        this.box.bases.forEach( ( b, i ) => {
            this.maxWeight = reduce( this.maxWeight, ( b - 1 ) * this.fundamental );
        });
    }


    // EUCLIDEAN RADIANCE
    identityEuclideanRadiance() {
        return this
            .identities
            .map( p => p.euclideanRadiance() )
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
        return this
            .identities
            .map( orbit => orbit.points[0] )
            .map( p => p.at(this.id) )
            .map( p => this.isNonTrivialIndexIdentity( p.id, p.di ) ? nonTrivialPerimeterJump : 0 )
            .reduce( (a,r) => a + r, 0);
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
                .points
                .map( p => Math.abs( p.at(this.id).radiant ) )
                .reduce( (a,c) => a + c, 0 ) )
            .reduce( (a, c) => a + c, 0 ) / 2;
    }

    orbitIndexRadiance() {
        return this
            .orbits
            .map( x => x
                .points
                .map( p => Math.abs( p.at(this.id).radiant ) )
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
            .map( identityOrbit => identityOrbit.points[0] )
            .map( indexedIdentity => indexedIdentity.at(this.id) )
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

}
