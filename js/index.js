/*


*/
var indexMap = {};
const PERMUTATION_KEYS = "αβγδεζηθικλμξνοπρςστυφχψω";

/*
    Extract a permutation (and reverse anti-permutation) of the bases
    and provide corresponding place value functions.
*/
class PlaceValuesPermutation {
    constructor( id, perm = [], bases, volume, forwardFrom = 0 ) {
        this.id = id;
        this.key =  2 * id;
        this.perm = perm;
        this.antiPerm = [...perm].reverse();
        this.placeValues = placeValuesPermutation( bases, this.perm );
        this.antiPlaceValues = placeValuesPermutation( bases, this.antiPerm );
        this.forwardFrom = forwardFrom;
        this.idx = new Array( volume ).fill( -1 );
        this.dix = new Array( volume ).fill( -1 );
        this.symbol = PERMUTATION_KEYS[this.id];
    }

    indexOf( coord ) {
        return this
            .placeValues
            .map( (b,i) => b * coord[i] )
            .reduce( (a,c) => a + c, this.forwardFrom );
    }

    antiIndexOf( coord ) {
        return this
            .antiPlaceValues
            .map( (b,i) => b * coord[i] )
            .reduce( (a,c) => a + c, this.forwardFrom );
    }

    indexPoint( point ) {
        const indexValue = this.indexOf( point.coord );
        const antiIndexValue = this.antiIndexOf( point.coord );

        point.idx[ this.key ] = indexValue;
        point.idx[ this.key + 1 ] = antiIndexValue;

        this.idx[ indexValue ] = point;
        this.dix[ antiIndexValue ] = point;
    }
}

class LiteralPermutation {
    constructor( id, volume ) {
        this.id = id;
        this.volume = volume;
        this.key =  2 * id;
        this.idx = new Array( volume ).fill( -1 );
        this.dix = new Array( volume ).fill( -1 );
        this.perm = [ 0 ];
        this.symbol = "#";
    }

    indexPoint( point ) {
        const indexValue = point.coord[0];
        const antiIndexValue = ( indexValue + 1 ) % this.volume;

        point.idx[ this.key ] = indexValue;
        point.idx[ this.key + 1 ] = antiIndexValue;

        this.idx[ indexValue ] = point;
        this.dix[ antiIndexValue ] = point;
    }
}


class Box {
    constructor( bases ) {
        this.bases = [...bases];
        this.init();
    }

    init() {
        this.rank = this.bases.length;
        this.volume = getVolume( this.bases );

        this.indexRadiance = getIndexRadiance( this.volume );
        this.euclideanRadiance = getEuclideanRadiance( this.bases );

        // since each coord plus it's reflection in the centre equals the terminal
        this.sum = this.bases.map( ( x, i ) => ( x - 1 ) * this.volume / 2 );

        // even times odd has to be even
        this.indexSum = ( this.volume * ( this.volume - 1 ) / 2 );
        this.indexCentre = ( this.volume - 1 ) / 2;

        // fixed points
        this.origin = new Array( bases.length ).fill( 0 );
        this.terminal = this.bases.map( x => x - 1 );
        this.diagonal = [ this.origin, this.terminal ];

        // only a point if every base is odd
        this.centre = this.bases.map( b => ( b - 1 ) / 2 );
    }

    postProcessPoints( extraProcessing ) {
        this.points.forEach( point => {
            point.partner = this.points[ this.volume - point.id - 1 ];
            if ( extraProcessing ) {
                extraProcessing( point );
            }
        } );
    }

    getJson() {
        return {
            bases: [...this.bases],
            coordSum: this.sum,
            idSum: this.indexSum
        };
    }

    toString() {
        return JSON.stringify( this.getJson(), null, 4 );
    }

    validateIds( ids ) {
        const invalidIds = ids.filter( id => id < 0 || id >= this.volume )
        if ( invalidIds.length > 0 ) {
            throw new Error( `id out of range: ${ invalidIds }; box.volume=${ this.volume }` );
        }
    }
}

/*

*/
class PermBox extends Box {
    constructor( bases ) {
        super( bases );

        this.points = this.buildPoints();

        const perm = arrayIndexes( this.bases );
        const seedPerms = [ perm ];

        switch( this.rank ) {

            case 1:
                this.placeValuePermutations = [ new LiteralPermutation( 0, this.volume ) ];
                break;

            case 2:
                this.placeValuePermutations = seedPerms
                    .map( (p,i) => new PlaceValuesPermutation( i, p, this.bases, this.volume ) );
                break;

            case 3:
                this.placeValuePermutations = seedPerms
                    .flatMap( seedPerm => seedPerm.map( (_,i) => rotateArray( [...seedPerm], i ) ) )
                    .map( (p,i) => new PlaceValuesPermutation( i, p, this.bases, this.volume ) );

                break;

            case 4:
                seedPerms.push( [ perm[0], perm[2], perm[1], perm[3] ] );

                this.placeValuePermutations = seedPerms
                    .flatMap( seedPerm => seedPerm.map( (_,i) => [...rotateArray( [...seedPerm], i ) ] ) )
                    .map( (p,i) => new PlaceValuesPermutation( i, p, this.bases, this.volume ) );

                break;

            default:
        }

        this.permCount = this.placeValuePermutations.length;
        this.pairCount = this.permCount  * (this.permCount - 1);

        this.postProcessPoints( point => {
            this.placeValuePermutations.forEach( perm => perm.indexPoint( point ) );
        } );
    }


    buildPoints( place = 0, locusStack = [], points = [] ) {
        if ( place == this.rank ) {
            const point = new Point( points.length, locusStack, this.centre );
            points.push( point );
        } else {
            for ( var i = 0; i < this.bases[place]; i++) {
                locusStack.push( i );
                this.buildPoints( place + 1, locusStack, points );
                locusStack.pop();
            }
        }
        return points;
    }

    getPointAtCoord( coord ) {
        return this.points.find( point => arrayExactlyEquals( coord, point.coord ) );
    }

    getPermKey( key ) {
        return key
            .map( k => this.bases.indexOf( k ) )
            .filter( ( _, i ) => i < this.bases.length );
    }

    getPermVector( permKey ) {
        return this.placeValuePermutations
            .map( pvp => arrayExactlyEquals( permKey, pvp.perm )
                  ? [ pvp, false ]
                  : arrayExactlyEquals( permKey, pvp.antiPerm )
                      ? [ pvp, true ]
                      : null )
            .find( x => x );
    }

    getJson() {
        return {
            bases: [...this.bases],
            coordSum: this.sum,
            idSum: this.indexSum,
            perms: this.permCount,
            pairs: this.pairCount
        };
    }

    toString() {
        return JSON.stringify( this.getJson(), null, 4 );
    }
}




class PlaceValuesPermutationPair {

    compareTo( other ) {
        if ( this.zeroedPlaces != other.zeroedPlaces ) {
            return -1 * ( this.zeroedPlaces - other.zeroedPlaces );
        } else if ( !this.inverse && other.inverse ) {
            return -1;
        } else if ( this.inverse && !other.inverse ) {
            return 1;
        } else if ( !this.harmonic && other.harmonic ) {
            return -1;
        } else if ( this.harmonic && !other.harmonic ) {
            return 1;
        } else if ( !this.degenerate && other.degenerate ) {
            return -1;
        } else if ( this.degenerate && !other.degenerate ) {
            return 1;
        }
        return this.echo - other.echo;
    }

    static layerLabel = ( i, palindrome ) => {
        const labels = 'e!abcdfghijklmnopqrstuvwxy';
        return i == palindrome ? "z" : labels[i];
    }

    static crossValue = ( l, r ) => arrayCompare( l, r );
    static crossPermValue = ( l, r ) => arrayCompare( l.concat( r ), l.concat( r ).reverse() );
    static squarePermValue = ( l, r ) => arrayCompare( l.concat( r ), r.concat( l ).reverse() );

    static extractMembers = ( state, placeValuePerms ) => {
        const [ leftState, rightState ] = state;
        const [ left, right ] = placeValuePerms;

        return ( leftState && rightState )
            ? [ state,
                [ left.key + 1, right.key + 1 ],
                [ left.dix, right.dix ],
                [ left.antiPerm, right.antiPerm ],
                [ left.antiPlaceValues, right.antiPlaceValues ] ]
            : (!leftState && rightState)
                ? [ state,
                    [ left.key, right.key + 1 ],
                    [ left.idx, right.dix ],
                    [ left.perm, right.antiPerm ],
                    [ left.placeValues, right.antiPlaceValues ] ]
                : (leftState && !rightState)
                    ? [ state,
                        [ left.key + 1, right.key ],
                        [ left.dix, right.idx ],
                        [ left.antiPerm, right.perm ],
                        [ left.antiPlaceValues, right.placeValues ] ]
                    : [ state,
                        [ left.key, right.key ],
                        [ left.idx, right.idx ],
                        [ left.perm, right.perm ],
                        [ left.placeValues, right.placeValues ] ];
    };

    toString() {
        return "[" + this.permPair.map( p => p.join( "," ) ).join( "]:[" ) + "]";
    }

    constructor( id, bases = [ 1 ], left, right, state = [ false, false, '' ], inversePair, harmonic = false ) {
        this.id = id;
        this.bases = bases;
        this.inversePair = inversePair;
        this.inverse = (inversePair != null);
        this.harmonic = harmonic;

        [
            [ this.leftState, this.rightState, this.stateType ],
            [ this.leftId, this.rightId ],
            [ this.idx, this.dix ],
            this.permPair,
            [ this.leftPlaceValues, this.rightPlaceValues ]
        ] = PlaceValuesPermutationPair.extractMembers( state, [ left, right ] );


        //
        this.location = [ new Array(bases.length).fill(0), new Array(bases.length).fill(0) ];
        this.location[0][left.id] = this.leftState ? 1 : -1;
        this.location[1][right.id] = this.rightState ? 1 : -1;

        this.color = [
              ( ( this.leftState ? 1 : -1 ) * ( left.id == 0 ? 63 : -63 ) ) + ( this.rightState ? -1 : 1 ) * ( right.id == 0 ? -63 : 63 ),
              ( ( this.leftState ? 1 : -1 ) * ( left.id == 1 ? 63 : -63 ) ) + ( this.rightState ? -1 : 1 ) * ( right.id == 1 ? -63 : 63 ),
              ( ( this.leftState ? 1 : -1 ) * ( left.id == 2 ? 63 : -63 ) ) + ( this.rightState ? -1 : 1 ) * ( right.id == 2 ? -63 : 63 )
          ]
          .map( i => i + 127 );

        this.symbol = `${ left.symbol }${ arrowUp( this.leftState ) }:${ right.symbol }${ arrowUp( this.rightState ) }`;

        this.rank = this.permPair[0].length;

        this.identityPlane = this.leftPlaceValues.map( ( x, i ) => this.rightPlaceValues[i] - x );
        this.echo = Math.abs( gcda( this.identityPlane ) );
        this.zeroedPlaces = this.identityPlane.reduce( (a,c) => c==0 ? a + 1 : a, 0 );

        this.palindrome = isPalindrome( this.permPair );
        this.layer = this.palindrome
            ? this.rank + 1
            : this.rank - this.zeroedPlaces;

        this.label = PlaceValuesPermutationPair.layerLabel( this.layer, this.rank + 1 );

        [
            [ this.alignedPlaces, this.alignedWeights ],
            this.unalignedPlaces
        ] = alignedPlaces( this.permPair );

        if ( this.alignedPlaces.length > 1 && !isRisingFrom( this.alignedPlaces, 0 ) ) {
            this.degenerate = true;

        } else if ( this.alignedPlaces.length == 1 ) {
             if ( PlaceValuesPermutationPair.crossPermValue( this.unalignedPlaces[0], this.unalignedPlaces[1] ) > 0 ) {
                this.degenerate = true;
             }
        }

        var report = "";
        report += `(${ this.palindrome ? 'p' : this.alignedPlaces.length }) `;
        report += `${ this.leftState ? 'u' : 'd' }${ this.rightState ? 'u' : 'd' } `;
        report += `${ this.inverse ? 'i' : '' }${ this.degenerate ? 'd' : '' }${ this.harmonic ? 'h' : '' } `;
        report += `${ this.echo }`;

        this.signature = report;
    }

    getInversePair() {
        if ( this.inversePair ) {
            throw new Error( `Pair already has an inverse: [${ this.left.perm }] [${ this.right.perm }].` );
        }
        // todo: why is "not passing this.harmonic" not causing a failure???
        this.inversePair = new PlaceValuesPermutationPair( this.bases, this.right, this.left, this );
        return this.inversePair;
    }
}




// unique key for each action
const boxActionKeyCounter = [ 0 ];

class BoxAction {

    constructor( box, id = 0 ) {
        this.box = box;
        this.id = id;
        this.key = boxActionKeyCounter[0]++;

        this.cycleIndexMonomial = [];

        this.forwardFrom = 0;
        this.reverseFrom = 0;
        this.label = 'xxx';
        this.symbols = [];
        this.alias = [];

        this.identities = [];
        this.orbits = [];
    }

    getCycles() {
        return [
            ...this.identities.map( o => o.points ),
            ...this.orbits.map( o => o.points )
        ];
    }

    getLabel() {
        return this.label;
    }

    toString() {
        return this.getLabel();
    }

    initialise() {
        this.buildOrbits();
        this.order = this.orbits.length > 0
            ? lcma( this.orbits.map( (x,i) => x.order ) )
            : 1;
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

        const orbitOffsetMessages = {};

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
                if ( offset > 0 ) {
                    if ( !this.ignoreOrbitOffsets ) {
                        const key = `${ offset }/${ orbit.order }`;
                        orbitOffsetMessages[key] = (key in orbitOffsetMessages)
                            ? orbitOffsetMessages[key] + 1
                            : 1;
                    }
                }

                return true;
            } );

        if ( matchedOrbits.length != totalOrbits ) {
            return false;
        }

        if ( !this.ignoreEuclideanPerimeters ) {
            if ( this.totalEuclideanPerimeter != other.totalEuclideanPerimeter ) {
                consoleLog( `${ other } != ${ this }; euclidean-perimeter: ${ other.totalEuclideanPerimeter } != ${ this.totalEuclideanPerimeter }`);
                return false;
            }
        }

        if ( !this.ignoreIndexPerimeters ) {
            if ( this.totalIndexPerimeter != other.totalIndexPerimeter ) {
                //consoleLog( `${ other } != ${ this }; index-perimeter: ${ other.totalIndexPerimeter } != ${ this.totalIndexPerimeter }`);
                return false;
            }
        }

        const orbitOffsetEntries = Object.entries( orbitOffsetMessages );
        if ( orbitOffsetEntries.length > 0 ) {
            const msg = orbitOffsetEntries.map( entry => `${ entry[1] }(${ entry[0] })` ).join(", ");
            //consoleLog( `${ other } != ${ this }; offsets: ${ msg };`);
            return false;
        }

        return true;
    }

    apply( point ) {
        const p = this.pointAt( point );
        if (!p) {
            throw new Error( `BoxAction ${ this.id } has no entry for the point: ${ point }.` );
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
        return point.at(this.key);
    }

    indexPoint( point ) {
        throw new Error("Abstract method.");
    }

    buildOrbits() {
        this.identities = [];
        this.orbits = [];
        const tally = [ ...this.dix ];
        const indexId = this.key;

        function extractOrbitCoordsAndTally( orbitId, startIndex, idx, tally ) {
            var point = idx[ startIndex ];

            if (!point) {
                throw new Error( `Bad orbit: No start point: index: ${ indexId } orbit: ${ orbitId }, start: ${ startIndex }` );
            }

            try {
                const indexedPoint = point.at(indexId);
                indexedPoint.orbitId = orbitId;
            } catch ( e ) {
                const msg = `Bad orbit point: ${ indexId }/${ orbitId }; ${ startIndex }; ${ e }`;
                consoleLog( msg );
                //
                //break;
                throw new Error( msg, { cause: e } );
            }

            tally[ startIndex ] = -1;
            const points = [ point ];

            var di = point.at(indexId).di;

            const alreadySeen = [];

            while ( di != startIndex ) {
                try {
                    tally[ di ] = -1;
                    point = idx[ di ];

                    if ( !point ) {
                        throw new Error( "No point for id: " + di );
                    }

                    const pointData = point.at( indexId );

                    if ( !pointData ) {
                        throw new Error( "No point data for point: " + point );
                    }

                    pointData.orbitId = orbitId;
                    points.push( point );

                    di = pointData.di;

                    if ( alreadySeen.includes( di ) ) {
                        throw new Error( `Already seen: di=${ di }`);
                    } else {
                        alreadySeen.push( di );
                    }
                } catch ( e ) {
                    const msg = `Bad orbit: ${ indexId }/${ orbitId }; ${ alreadySeen }; ${ e }`;
                    consoleLog( msg );
                    throw new Error( msg, { cause: e } );
                }
            }
            return points;
        }

        const doConjugateShortcut = true;

        for ( var i = 0; i < this.idx.length; i++) {
            if ( tally[ i ]!= -1 ) {
                const orbitId = this.orbits.length + 1;

                var orbit = new Orbit( this, orbitId, extractOrbitCoordsAndTally( orbitId, i, this.idx, tally ) );

                var identitiesTransposition = false;

                // check for identities transposition
                if ( orbit.order == 2 ) {
                    const fixedIds = [ 0, tally.length - 1 ];
                    identitiesTransposition = orbit
                        .points
                        .filter( p => fixedIds.includes( p.at( indexId ).id ) )
                        .length;

                }

                if ( identitiesTransposition ) {
                    orbit
                        .points
                        .forEach( p => {
                            const pI = p.at( indexId );
                            pI.di = pI.id;
                            pI.jump = 0;
                            pI.radiant = 0;
                            this.identities.push( new Orbit( this, orbitId, [ p ] ) );
                        } );

                } else if ( orbit.order == 1 ) {
                    this.identities.push( orbit );
                } else {
                    this.orbits.push( orbit );
                }

                if ( !doConjugateShortcut ) {
                    continue;
                }

                const point = this.idx[ i ];
                const partnerPoint = point.partner;

                if ( !partnerPoint ) {
                    const msg = `Bad point no partner: ${ point }`;
                    consoleLog( msg );
                    throw new Error( msg );
                }

                const partnerData = partnerPoint.at( indexId );

                if ( !partnerData || !partnerData.id ) {
                    const msg = `Bad point ${ point } partner ${ partnerPoint }; no data for index: ${ indexId }`;
                    consoleLog( msg );
                    throw new Error( msg );
                }


                if (tally[ partnerData.di ] == -1) {
                    // orbit is partner to self
                    orbit.partner = orbit;

                } else {
                    const orbitId = this.orbits.length + 1;

                    const partnerOrbit = new Orbit(
                        this,
                        orbitId,
                        extractOrbitCoordsAndTally( orbitId, partnerData.id, this.idx, tally ) );

                    partnerOrbit.partner = orbit;
                    orbit.partner = partnerOrbit;

                    if ( partnerOrbit.order == 1 ) {
                        this.identities.push( partnerOrbit );
                    } else {
                        this.orbits.push( partnerOrbit );
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

        var totalOrderSpace = 1;
        var totalNetOrderSpace = 1;
        var totalNet2Space = 0;

        const cycleIndexMonomial  = {};

        for ( var i = 0; i < this.orbits.length; i++ ) {
            var orbit = this.orbits[i];

            totalOrderSpace *= orbit.order;
            totalNetOrderSpace *= orbit.isSelfPartner()
                ? ( orbit.order / 2 )
                : orbit.isFirstConjugate()
                    ? orbit.order
                    : 1;
            totalNet2Space += orbit.isSelfPartner() || orbit.isFirstConjugate()
                ? 1
                : 0;


            cycleIndexMonomial[orbit.order] = ( orbit.order in cycleIndexMonomial )
                ? cycleIndexMonomial[orbit.order] + 1
                : 1

            totalEuclideanPerimeter += orbit.euclideanPerimeter();
            totalEuclideanRadiance += orbit.euclideanRadiance();

            totalIndexPerimeter += orbit.indexPerimeter();
            totalIndexRadiance += orbit.indexRadiance();
        }

        this.totalOrderSpace = totalOrderSpace;
        this.totalNetOrderSpace = totalNetOrderSpace;
        this.totalNet2Space = totalNet2Space;

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
        const varIds = ( d ) => [ "x", "y", "z", "w", "v", "u", "t", "s", "r", "q", "p" ].map( x => `<i>${ x }</i>` )[d];
        return this.identityPlane
              .map( ( x, i ) => `${ x < 0 ? i == 0 ? " " : " + " : " - " }${ Math.abs( x ) }${ varIds( i ) }` )
              .join("") + ` = ${ this.reverseFrom - this.forwardFrom }`;
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
                fixed: this.identities ? this.identities.length : 0,
                orbits: this.orbits ? this.orbits.length : 0,
                order: this.order
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

    // EUCLIDEAN RADIANCE
    identityEuclideanRadiance() {
        return this.identities
            ? this
                .identities
                .map( p => p.euclideanRadiance() )
                .reduce( (a,r) => a + r, 0)
            : '-';
    }

    orbitEuclideanRadiance() {
        return this.orbits
            ? this
                .orbits
                .map( p => p.euclideanRadiance() )
                .reduce( (a,r) => a + r, 0)
            : '-';
    }

    grossEuclideanRadiance() {
        return this.identityEuclideanRadiance() + this.orbitEuclideanRadiance();
    }


    // EUCLIDEAN PERIMETER
    identityEuclideanPerimeter() {
        return this.identities
           ? this
            .identities
            .map( orbit => orbit.points[0] )
            .map( p => p.at(this.key) )
            .map( p => 0 )
            .reduce( (a,r) => a + r, 0)
           : '-';
    }

    orbitEuclideanPerimeter() {
        return this.orbits
            ? this
                .orbits
                .map( p => p.euclideanPerimeter() )
                .reduce( (a,r) => a + r, 0)
            : '-';
    }

    grossEuclideanPerimeter() {
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
        return this.identities
            ? this
                .identities
                .map( x => x
                    .points
                    .map( p => Math.abs( p.at(this.key).radiant ) )
                    .reduce( (a,c) => a + c, 0 ) )
                .reduce( (a, c) => a + c, 0 ) / 2
            : '-';
    }

    orbitIndexRadiance() {
        return this.orbits
            ? this
                .orbits
                .map( x => x
                    .points
                    .map( p => Math.abs( p.at(this.id).radiant ) )
                    .reduce( (a,c) => a + c, 0 ) )
                .reduce( (a, c) => a + c, 0 ) / 2
            : '-';
    }

    grossIndexRadiance() {
        //return this.identityIndexRadiance() + this.orbitIndexRadiance();
        return this.identityIndexRadiance() + this.totalIndexRadiance;
    }

    // INDEX PERIMETER
    identityIndexPerimeter() {
        return this.identities
            ? this.identities
                .map( identityOrbit => identityOrbit.points[0] )
                .map( indexedIdentity => indexedIdentity.at(this.key) )
                .map( identity => identity.jump )
                .reduce( (a,c) => a + c, 0 )
            : '-';
    }

    orbitIndexPerimeter() {
        return this
            .orbits
            .reduce( (a, orbit) => a + orbit.indexPerimeter(), 0 );
    }

    grossIndexPerimeter() {
        return this.identityIndexPerimeter() + this.totalIndexPerimeter;
        //return this.identityIndexPerimeter() + this.orbitIndexPerimeter();
    }

    // INDEX TORSION
    identityIndexTorsion() {
        return this.identityIndexRadiance() - this.identityIndexPerimeter();
    }

    grossIndexTorsion() {
        return this.grossIndexRadiance() - this.grossIndexPerimeter();
    }

}
