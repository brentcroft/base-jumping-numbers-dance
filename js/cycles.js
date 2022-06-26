
const pointId = ( point ) => point.id;
const pointCoord = ( point ) => `(${ point.coord.join( "," ) })`;
const pointLabel = pointId;


function isCycles( value ) {
    return value instanceof CyclesArray;
}

class CycleArray extends Array {

    getCycleNotation() {
        return `(${ this.map( p => p.id ).join( ', ' ) })`;
    }

    getStats() {
        const rank = this[0].coord.length;

        const order = this.length;
        const centre = new Array( rank ).fill( 0 );
        const coordSum = new Array( rank ).fill( 0 );
        this
            .map( point => point.coord )
            .forEach( coord => coord.forEach( (c,i) => coordSum[i] += c ) );

        coordSum
            .forEach( ( s, i ) => {
                centre[i] = s / order;
            } );

        const indexPerimeter = this
            .map( (point,i) => this[ ( i + 1 ) % order ].id - point.id )
            .map( jump => Math.abs( jump ) )
            .reduce( (a,c) => a + c, 0 );

        const euclideanPerimeter = this
            .map( (point,i) => distance2( point.coord, this[ ( i + 1 ) % order ].coord ) )
            .reduce( (a,c) => a + c, 0 );

        return {
            //cycle: this,
            order: order,
            centre: centre,
            coordSum: coordSum,
            gcd: coordSum.reduce( gcd ),
            lcm: coordSum.reduce( lcm ),
            indexPerimeter: indexPerimeter,
            euclideanPerimeter: euclideanPerimeter
        }
    }
}

class CyclesArray extends Array {

    static getCycles( factors ) {
        const [ coprime, cofactor ] = factors;
        const volume = factors.reduce( ( a, c ) => a * c, 1 );
        const terminal = volume - 1;
        const truncated = false;
        return getMultiplicativeGroupMember( terminal, coprime, truncated );
    }

    static magnifyPoint( c, magnification ) {
        const point = {
            id: c.id * magnification,
            di: c.di * magnification,
            coord: [ ...c.coord ]
        };
        point.toString = () => pointLabel( point );
        return point;
    }

    static offsetPoint( c, k, volume = 1 ) {
        const point = {
            id: ( c.id + ( k * volume ) ),
            di: ( c.di + ( k * volume ) ),
            coord: [ ...c.coord, k ]
        };
        point.toString = () => pointLabel( point );
        return point;
    }
//
//    constructor( ...items ) {
//        const nonCycles = items.filter( item => !( item instanceof CycleArray ) );
//        if ( nonCycles && nonCycles.length > 0 ) {
//            throw new Error( `Can only contain items of type CycleArray: ${ nonCycles.length } bad items.` );
//        }
//        super( ...items );
//    }

    push( ...items ) {
        const nonCycles = items.filter( item => !( item instanceof CycleArray ) );
        if ( nonCycles && nonCycles.length > 0 ) {
            throw new Error( `Can only add items of type CycleArray: ${ nonCycles.length } bad items.` );
        }
        super.push( ...items );
    }

    getOrigin() {
        return this[0][0];
    }

    getTerminal() {
        return this[ this.length - 1 ][0];
    }

    getDiagonal() {
        return [ this.getOrigin().coord, this.getTerminal().coord ];
    }

    getCentre() {
        return this.getTerminal().coord.map( c => c/2 );
    }

    getMetaData() {
        const terminal = this.getTerminal();
        return terminal.meta || {};
    }

    setMetaData( data = {} ) {
        const terminal = this.getTerminal();
        terminal.meta = data;
    }

    getMeta( key ) {
        const terminal = this.getTerminal();
        return terminal.meta
            ? terminal.meta[key]
            : null;
    }

    setMeta( key, value ) {
        const terminal = this.getTerminal();
        if ( terminal.meta ) {
            terminal.meta[key] = value;
        } else {
            terminal.meta = { key: value };
        }
        return value;
    }

    getBases() {
        return this.getTerminal().coord.map( i => i + 1 );
    }

    isHarmonic() {
        const meta = this.getMetaData();
        return meta.harmonic;
    }

    getVolume() {
        return this.reduce( ( a, c ) => a + c.length, 0 );
    }

    getRank() {
        return this.getBases().length;
    }

    getIdentities() {
        return this.filter( cycle => cycle.length == 1 );
    }

    getOrbits() {
        return this.filter( cycle => cycle.length > 1 );
    }


    getAction( id ) {
        return new IndexCyclesAction( id ? id : Math.round( Math.random() * 10000 + 1), this );
    }

    getCycleNotation() {
        return this.map( cycle => cycle.getCycleNotation() ).join( '' );
    }

    toString() {
        return this.map( cycle => "(" + cycle.map( p => p.id ).join(',') + ")" ).join( '' );
    }

    getStats() {
        const stats = this.getMeta( 'stats' );
        if ( stats ) {
            return stats;
        }

        const allowance = 0.00000000001;
        const boxCentre = this.getCentre();

        var centreLines = [
            { "points": this.getDiagonal(), "unit": unitDisplacement( ...this.getDiagonal() ), "pd": 0 }
        ];
        var centrePoints = [
            { "point": [0,0,0], "lineRef": 0, "hyp2": 0 }
        ];

        function assignCentreRef( cycleStats ) {
            const centreDist = distance2( centrePoints[0].point, cycleStats.centre );
            if ( centreDist < allowance ) {
                cycleStats.centreRef = 0;
                return;
            }
            for ( var i = 1; i < centrePoints.length; i++) {
                const d = distance2( centrePoints[i].point, cycleStats.centre );
                if ( d < allowance ) {
                    cycleStats.centreRef = i;
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
                                subtraction( subtraction( boxCentre, unit ), scaledUnit),
                                addition( addition( boxCentre, unit ), scaledUnit)
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
                "point": cycleStats.centre,
                "lineRef": getCentreLineRef( cycleStats.centre ),
                "hyp2": centreDist
            } );

            cycleStats.centreRef = centrePoints.length - 1;
        }

        this.forEach( cycle => assignCentreRef( cycle.getStats() ) );

        return this.setMeta( 'stats', {
            centreLines: centreLines,
            centrePoints: centrePoints
        } );
    }

    getIdentityPlane() {
        var plane = this.getMeta( 'identityPlane' );
        if ( plane ) {
            return plane;
        }

        const bases = this.getBases();
        
        const placesReverse = placeValuesReverseArray( bases );
        const placesForward = [...placesReverse].map( i => -1 * i );


        // establish identity plane
        const identityPlane = placesForward.map( ( x, i ) => x - placesReverse[i] );
        const identityPlaneGcd = Math.abs( gcda( identityPlane ) );
        const identityPlaneNormal = displacement( this.getOrigin().coord, identityPlane );

        return this.setMeta( 'identityPlane', {
            coord: identityPlane,
            gcd: identityPlaneGcd,
            normal: identityPlaneNormal
        } );
    }


    monomial() {
        const monomial  = {};
        this.forEach( cycle => monomial[cycle.length] = ( cycle.length in monomial )
            ? monomial[cycle.length] + 1
            : 1 );
        Object.entries( monomial ).sort( (a, b) => a < b );
        return monomial;
    }

    expand( copies = 1, harmonic = false ) {
        if ( copies < 2 ) {
            return this;
        }
        const cycles = new CyclesArray();
        if ( harmonic ) {
            const template = this.map( cycle => cycle.map( c => CyclesArray.magnifyPoint( c, copies ) ) );
            for ( var k = 0; k < copies; k++ ) {
                template.forEach( cycle => cycles.push( cycle.map( c => CyclesArray.offsetPoint( c, k ) ) ) );
            }
        } else {
            const volume = this.getVolume();
            for ( var k = 0; k < copies; k++ ) {
                this.forEach( cycle => cycles.push( cycle.map( c => CyclesArray.offsetPoint( c, k, volume ) ) ) );
            }
        }
        cycles.setMetaData( { harmonic: true } );
        return cycles;
    }

    htmlMonomial() {
        return reify( "span", { 'class': 'monomial' }, Object
            .entries( this.monomial() )
            .filter( ( [ k, e ] ) => k > 1 )
            .flatMap( ( [ k, e ] ) => [
                reify( "i", {}, [ reifyText( k == 1 ? "e" : "a" )  ] ),
                reify( "sup", {}, [ reifyText( `${ e }` ) ] ),
                k == 1
                    ? null
                    : reify( "sub", { 'style': 'position: relative; left: -.5em;'}, [ reifyText( `${ k }` ) ] )
            ] ) );
    }


    htmlTable( param = {} ) {

        const { caption = 'Cycles' } = param;

        const volume = this.getVolume();
        const maxIndex = volume - 1;

        const initialPointsSum = new Array( this.getRank() ).fill( 0 );

        const identities =  this.getIdentities();
        const identityPointsSum = identities
            .map( cycle => cycle[0].coord )
            .reduce( (a, coord) => addition( a, coord ), initialPointsSum );
        const identityIdSum = identities
            .map( cycle => cycle[0].id )
            .reduce( (a, id) => a + id, 0 );
        const identityIdSumGcd = gcd( maxIndex, identityIdSum );

        const headerRow = [
            [ 'Id', [ true ] ],
            [ 'Cycle', [] ],
            //[ 'Cycle Coords', [] ],
            [ 'Coord Sum', [ true, true ] ],
            //[ 'Id Sum', [ true, false, true ] ],
            [ 'Order', [ true, false, true ] ],
            [ 'Perimeter<sup>2</sup>', [ true, true ] ],
            [ 'Radiance', [ true, true ] ],
        ];

        const identityRow = [
            [ '<code>e</code>', [] ],
            [ identities.map( cycle => `( ${ cycle[0].id } )` ).join( ', ' ), [] ],
            //[ this.identities.map( orbit => `(${ orbit.points[0].coord.join(', ') })` ).join( ', ' ), [] ],
            [ `<code>( ${ identityPointsSum } )</code>`, [] ],
            //[ `<code>( ${ identityIdSum } )</code>`, [] ],
            [ `<code>1</code>`, [] ],
            [ `<code>0</code>`, [] ],
            [ `<code>0</code>`, [] ],
        ];

        const orbits =  this.filter( cycle => cycle.length > 1 );

        return reify(
            "table",
             { 'cssClass': [ 'box-action' ] },
             [
                reify( "caption", {}, [ reifyText( caption ) ] ),
                reify( "tr", {}, headerRow.map( ( h, colIndex ) => reify( "th", {}, [ reifyText( h[0] ) ] ) ) ),
                reify( "tr", {}, identityRow.map( ir => reify( "td", {}, [ reifyText( ir[0] ) ] ) ) ),
                ...orbits
                    .map( orbit => [ orbit, orbit.getStats() ] )
                    .map( ( [ orbit, stats ], i ) => reify(
                        "tr",
                        {},
                        [
                            reify( "td", {}, [ reify( "sup", {}, [ reifyText( `${ orbit.length }` ) ] ) ] ),
                            reify( "td", { cssClass: [ 'orbit' ] }, [
                                reifyText( orbit.getCycleNotation() )
                            ] ),
                            reify( "td", {}, [ reifyText( `( ${ stats.coordSum.join( ', ' ) } )` ) ] ),
                            //reify( "td", {}, [ reifyText( `${ orbit.getIdSum() }` ) ] ),
                            reify( "td", {}, [ reifyText( `${ orbit.length }` ) ] ),
                            reify( "td", {}, [ reifyText( `${ stats.euclideanPerimeter }` ) ] ),
                            reify( "td", {}, [ reifyText( `${ stats.indexPerimeter }` ) ] ),
                        ]
                ) ),
                //reify( "tr", {}, footerRow.map( f => reify( "td", { 'cssClass': f[1] }, [ reifyText( f[0] ) ] ) ) ),
             ] );
    }
}

function composeCyclesArrays() {
    const args = [ ...arguments ];
    const p0 = args[ 0 ];
    var p1 = args.pop();

    while ( args.length > 1 ) {
        const nextPair = [ p1, args.pop() ];
        p1 = composePermutations( ...nextPair );
    }

    if ( !( p0 instanceof CyclesArray && p1 instanceof CyclesArray ) ) {
        throw new Error( `Can only compose CyclesArrays: p0=${ typeof p0 }, p1=${ typeof p1 }` );
    }

    // build tally index of terms
    const tallyIndex = [];
    p0.forEach( c0 => tallyIndex.push( ...c0.filter( x => !tallyIndex.includes( x ) ) ) );
    p1.forEach( c0 => tallyIndex.push( ...c0.filter( x => !tallyIndex.includes( x ) ) ) );
    tallyIndex.sort();

    const p1Copy = p1.map( x => [...x]);

    // build next row from tallyIndex to p1
    const index1 = tallyIndex.map( i => {
        var engagedCycle = p1.find( c1 => c1.includes( i ) );

        var stageValue = i;

        if ( engagedCycle ) {
            const j = engagedCycle.indexOf( i );
            stageValue = engagedCycle[ ( j + 1 ) % engagedCycle.length ];
        }

        engagedCycle = p0.find( c0 => c0.includes( stageValue ) );

        if ( engagedCycle ) {
            const j = engagedCycle.indexOf( stageValue );
            stageValue = engagedCycle[ ( j + 1 ) % engagedCycle.length ];
        }
        return stageValue;
    } );
    const extractNextLink = ( i ) => [ ...tallyIndex.splice( i, 1 ), ...index1.splice( i, 1 ) ];

    const cycles = new CyclesArray();
    while ( tallyIndex.length > 0 ) {
        var link = extractNextLink( 0 );
        if ( link[0] == link[1] ) {
            cycles.push( new CycleArray( link[0] ) );
        } else {
            const cycle = new CycleArray( link[0] );
            while ( link[1] != cycle[0] ) {
                link = extractNextLink( tallyIndex.indexOf( link[1] ) );
                cycle.push( link[0] );
            }
            cycles.push( cycle );
        }
    }

    return canonicalizePermutation( cycles, 0 );
}