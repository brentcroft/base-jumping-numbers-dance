
var nonTrivialIndexJump = 0;
var nonTrivialPerimeterJump = 0.0;

var indexMap = {};


class ActionElement {

    constructor( box, id = 0 ) {
        this.box = box;
        this.id = id;
        this.key = `plane-${ id }`;
        this.idx = new Array( this.box.volume );
        this.dix = new Array( this.box.volume );

        this.forwardFrom = 0;
        this.reverseFrom = 0;
        this.label = 'xxx';
    }

    getLabel() {
        return this.label;
    }

    toString() {
        return this.getLabel();
    }

    initialise( globaliseIds = false ) {
        this.buildOrbits();
        this.findFundamental();
        this.buildCentreLines();
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

    equals( other ) {
        const totalOrbits = ( this.identities.length + this.orbits.length );
        const totalOtherOrbits = ( other.identities.length + other.orbits.length );

        if ( totalOrbits != totalOtherOrbits ) {
            return false;
        }

        const matchedOrbits = [ ...this.identities, ...this.orbits ]
            .filter( orbit => {
                const otherOrbit = other.getOrbit( orbit.points[0] );
                if ( !otherOrbit || otherOrbit.order != orbit.order ) {
                    return false;
                }
                const otherPoints = otherOrbit.points;
                const offset = otherPoints.indexOf( orbit.points[0] );
                for ( var i = 0; i < otherPoints.length; i++ ) {
                    if ( orbit.points[i] != otherPoints[ ( i + offset ) % otherPoints.length ] ) {
                        return false;
                    }
                }
                return true;
            } );

        return matchedOrbits.length == totalOrbits;
    }

    apply( point ) {
        const p = this.pointAt( point );
        if (!p) {
            throw new Error( `ActionElement ${ this.id } has no entry for the point: ${ point }.` );
        }
        return this.getPointFromIdx( p.di );
    }

    applyInverse( point ) {
        const p = this.pointAt( point );
        return this.getPointFromDix( p.id );
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
        throw new Error("Abstract method.");
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

            const alreadySeen = [];

            while ( di != startIndex ) {
                try {
                    tally[ di ] = -1;
                    point = idx[ di ];
                    point.at(indexId).orbitId = orbitId;
                    points.push( point );
                    di = point.at(indexId).di;

                    if ( alreadySeen.includes( di ) ) {
                        throw new Error( `Already seen: di=${ di }`);
                    } else {
                        alreadySeen.push( di );
                    }
                } catch ( e ) {
                    const msg = `Bad orbit: ${ indexId }/${ orbitId }; ${ alreadySeen }; ${ e }`;
                    consoleLog( msg );
                    //break;
                    throw new Error( msg );
                }
            }
            return points;
        }

        for ( var i = 0; i < this.idx.length; i++) {
            if ( tally[ i ]!= -1 ) {
                const orbitId = this.orbits.length + 1;

                var orbit = new Orbit( this, orbitId, extractOrbitCoordsAndTally( orbitId, i, this.idx, tally ) );

                if ( orbit.order == 1 ) {
                    this.identities.push( orbit );
                } else {
                    this.orbits.push( orbit );
                }

                const point = this.idx[ i ];
                var antipodesCoord = this.idx[ point.at(indexId).conjugateId ];

                if ( !antipodesCoord ) {
                    const msg = `Bad point no conjugate: ${ point }`;
                    cconsoleLog( msg );
                    //break;
                    throw new Error( msg );
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
        this.identities.sort( (a,b) => a.points[0].id - b.points[0].id );
    }

    analyzeOrbits() {

        var totalEuclideanRadiance = 0;
        var totalEuclideanPerimeter = 0;
        var totalIndexRadiance = 0;
        var totalIndexPerimeter = 0;
        var totalTension = 0;

        const cycleIndexMonomial  = {};

        for ( var i = 0; i < this.orbits.length; i++ ) {
            var orbit = this.orbits[i];

            cycleIndexMonomial[orbit.order] = ( orbit.order in cycleIndexMonomial )
                ? cycleIndexMonomial[orbit.order] + 1
                : 1

            totalEuclideanPerimeter += orbit.euclideanPerimeter();
            totalEuclideanRadiance += orbit.euclideanRadiance();

            totalIndexPerimeter += orbit.indexPerimeter( this.id );
            totalIndexRadiance += orbit.indexRadiance( this.id );
        }

        Object.entries( cycleIndexMonomial ).sort( (a, b) => a < b );
        this.cycleIndexMonomial = cycleIndexMonomial;

        this.totalIndexRadiance = totalIndexRadiance;
        this.totalIndexPerimeter = totalIndexPerimeter;

        this.totalEuclideanRadiance = totalEuclideanRadiance;
        this.totalEuclideanPerimeter = totalEuclideanPerimeter;
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
        const varIds = ( d ) => [
                "x", "y", "z", "w", "v", "u", "t", "s", "r", "q", "p"
            ].map( x => `<i>${ x }</i>` )[d];

        const plane = this.identityPlane.map( x => x );

        var eqn = plane
              .map( ( x, i ) => `${ x < 0 ? i == 0 ? " " : " + " : " - " }${ Math.abs( x ) }${ varIds( i ) }` )
              .join("");

        eqn += ` = ${ this.reverseFrom - this.forwardFrom }`;

        return eqn;
    }

    getJson() {
        return {
            id: this.id,
            powers: {
                forward: this.placesForward,
                reverse: this.placesReverse
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

    findFundamental() {
        this.fundamental = this.orbits.length > 0
            ? lcma( this.orbits.map( (x,i) => x.order ) )
            : 1;
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
