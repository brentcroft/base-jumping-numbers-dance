
const pointId = ( point ) => point.id;
const pointCoord = ( point ) => `(${ point.coord.join( "," ) })`;
const pointLabel = pointId;

const equalsCoord = ( p1, p2 ) => arrayExactlyEquals( p1.coord, p2.coord );


class Coord extends Array {
    key() {
        return this.join('.');
    }

    equals( other ) {
        return this === other || arrayExactlyEquals( this, other );
    }

    toString() {
        return `(${this.join(',')})`;
    }
}

class Coords {

    static boxes = {};

    static getCoords( bases ) {
        const canonicalBases = new Coord(...bases);
        canonicalBases.sort( ( a, b ) => a - b );
        var box = Coords.boxes[ canonicalBases.key() ];
        if ( box ) {
            return box;
        }
        box = new Coords( canonicalBases );
        Coords.boxes[ canonicalBases.key() ] = box;
        return box;
    }

    static buildCoordMap( bases, place = 0, locusStack = [], coordMap = {} ) {
        if ( place == bases.length ) {
            const coord = new Coord(...locusStack);
            coordMap[coord.key()] = coord;
        } else {
            for ( var i = 0; i < bases[place]; i++) {
                locusStack.push( i );
                Coords.buildCoordMap( bases, place + 1, locusStack, coordMap );
                locusStack.pop();
            }
        }
        return coordMap;
    }

    constructor( bases ) {
        this.bases = bases;
        this.rank = bases.length;
        this.coordMap = Coords.buildCoordMap( bases );
    }

    getCoord( coord = [] ) {
        return this.coordMap[ coord.join('.') ];
    }
}




function isCycles( value ) {
    return value instanceof CyclesArray;
}

class CycleArray extends Array {


    getPointIndex( coord ) {
        for ( var i = 0; i < this.length; i++ ) {
            if ( this[i].coord.equals(coord) ) {
                return i;
            }
        }
        return -1;
    }

    asCoords() {
        return this.map( p => p.coord ).join('');
    }

    getPreviousPoint( i ) {
        return this[ ( i + this.length - 1 ) % this.length ];
    }

    getNextPoint( i ) {
        return this[ ( i + 1 ) % this.length ];
    }



    getCycleNotation() {
        return `(${ this.map( p => p.id ).join( ', ' ) })`;
    }

    equals( other ) {
        if (!( other instanceof CycleArray ) ) {
            return false;
        }
        if ( this.length != other.length ) {
            return false;
        }

        var pointCoord = this[0].coord;
        const [ otherPoint, offset ] = otherPoints
            .map( ( p, i ) => [ p, i ] )
            .find( ( [ p, i ] ) => arrayExactlyEquals( p.coord,pointCoord ) );

         if ( !offset ) {
             return false;
         }

        for ( var i = 0; i < otherPoints.length; i++ ) {
            if ( !arrayExactlyEquals( this[i].coord,otherPoints[ ( i + offset ) % otherPoints.length ].coord ) ) {
                return false;
            }
        }
        return true;
    }

    getStats() {
        const rank = this[0].coord.length;

        const order = this.length;
        const centre = new Array( rank ).fill( 0 );
        const coordSum = new Array( rank ).fill( 0 );

        this
            .map( point => point.coord )
            .forEach( coord => coord.forEach( (c,i) => coordSum[i] += c ) );

        centre
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

        const idSum = this.reduce( (a,point) => a + point.id, 0 );

        return {
            //cycle: this,
            order: order,
            centre: centre,
            idSum: idSum,
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
        const cycles = getMultiplicativeGroupMember( terminal, coprime, truncated );

        cycles.canonicalize();
        cycles.normaliseCoordinates();

        return cycles;
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

    duplicate() {
        return this.map( cycle => new CycleArray(...cycle) );
    }

    canonicalize() {
        function ios( cycle ) {
            var l = 0;
            for (var i = 1; i < cycle.length; i++) {
                if ( cycle[ i ].id < cycle[ l ].id ) {
                    l = i;
                }
            }
            return l;
        }
        this.forEach( cycle => rotateArray( cycle, ios( cycle ) ) );
        this.sort( ( a, b ) => a[0].id - b[0].id );
    }

    normaliseCoordinates() {
        if ( this.getMeta( 'perm') ) {
            throw new Error("Called twice!");
        } else {
            const perm = canonicalCoordinateMap( this.getBases() );
            const coords = Coords.getCoords( this.getBases() );
            const transformCoord = ( coord ) => coords.getCoord( perm.map( p => coord[ p ] ) );
            this.forEach( cycle => cycle.forEach( point => point.coord = transformCoord( point.coord ) ) );
            this.setMeta( 'perm', perm );
            this.setMeta( 'box', coords );
        }
    }

    getCycleAndIndex( coord ) {
        for ( var i = 0; i < this.length; i++ ) {
            const cycle = this[i];
            const pointIndex = cycle.getPointIndex( coord );
            if ( pointIndex > -1 ) {
                return [ cycle, pointIndex ];
            }
        }
        throw new Error( `The supplied coord ${ coord } does not exist in any cycle.` );
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

    getCentres() {
        const centres = this.getMeta( 'centres' );
        if ( centres ) {
            return centres;
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

        this
            .filter( cycle => cycle.length > 1 )
            .forEach( cycle => assignCentreRef( cycle.getStats() ) );

        return this.setMeta( 'centres', {
            centreLines: centreLines,
            centrePoints: centrePoints
        } );
    }

    getIdentityPlane() {
        var plane = this.getMeta( 'identityPlane' );
        if ( plane ) {
            return plane;
        }

        const { centreLines, centrePoints } = this.getCentres();

        if ( centreLines.length > 1 ) {

            const diagonal = centreLines[0].points;
            const otherLine = centreLines[ centreLines.length - 1 ].points;

            // establish identity plane
            const identityPlane = otherLine.map( ( coord, i ) => subtraction( coord, diagonal[i] ) );
            const identityPlaneGcd = Math.abs( gcda( identityPlane ) );
            const identityPlaneNormal = displacement( this.getOrigin().coord, identityPlane );

            return this.setMeta( 'identityPlane', {
                coord: identityPlane,
                gcd: identityPlaneGcd,
                normal: identityPlaneNormal
            } );

        } else {
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

        const [ l, r, m = 1 ] = cycles.getBases();
        const permKeys = harmonic
                ? [ [ m, r, l ], [ m, l, r ] ]
                : [ [ r, l, m ], [ l, r, m ] ];

        cycles.setMetaData( {
            harmonic: harmonic,
            permKeys: permKeys
        } );

        cycles.normaliseCoordinates();

        return cycles;
    }

    htmlMonomial() {
        return reify( "span", { 'class': 'monomial' }, Object
            .entries( this.monomial() )
            .flatMap( ( [ k, e ] ) => [
                reify( "i", {}, [ reifyText( k == 1 ? "e" : "a" )  ] ),
                reify( "sup", {}, [ reifyText( `${ e }` ) ] ),
                k == 1
                    ? null
                    : reify( "sub", { 'style': 'position: relative; left: -.5em;'}, [ reifyText( `${ k }` ) ] )
            ] ) );
    }


    htmlTable( param = {} ) {

        const { coords = false } = param;

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
            coords ? [ 'Cycle Coords', [] ] : [ 'Cycle', [] ],
            [ 'Coord Sum', [ true, true ] ],
            [ 'Id Sum', [ true, false, true ] ],
            [ 'Order', [ true, false, true ] ],
            [ 'Perimeter<sup>2</sup>', [ true, true ] ],
            [ 'Radiance', [ true, true ] ],
        ];

        const identityRow = [
            [ '<code>e</code>', [] ],
            coords
                ? [ identities.map( cycle => cycle.asCoords() ).join( ', ' ), [] ]
                : [ identities.map( cycle => cycle.getCycleNotation() ).join( ', ' ), [] ],
            [ `<code>( ${ identityPointsSum } )</code>`, [] ],
            [ `<code>( ${ identityIdSum } )</code>`, [] ],
            [ `<code>1</code>`, [] ],
            [ `<code>0</code>`, [] ],
            [ `<code>0</code>`, [] ],
        ];

        const orbits =  this.filter( cycle => cycle.length > 1 );

        return reify(
            "table",
             { 'cssClass': [ 'box-action' ] },
             [
                reify( "caption", {}, [ reifyText( `${ this.getMeta('label') } &rarr; ` ), this.htmlMonomial() ] ),
                reify( "tr", {}, headerRow.map( ( h, colIndex ) => reify( "th", {}, [ reifyText( h[0] ) ] ) ) ),
                reify( "tr", {}, identityRow.map( ir => reify( "td", {}, [ reifyText( ir[0] ) ] ) ) ),
                ...orbits
                    .map( orbit => [ orbit, orbit.getStats() ] )
                    .map( ( [ orbit, stats ], i ) => reify(
                        "tr",
                        {},
                        [
                            reify( "td", {}, [ reify( "sup", {}, [ reifyText( `${ i }` ) ] ) ] ),
                            reify( "td", { cssClass: [ 'orbit' ] }, [
                                coords
                                    ? reifyText( orbit.asCoords() )
                                    : reifyText( orbit.getCycleNotation() )
                            ] ),
                            reify( "td", {}, [ reifyText( `( ${ stats.coordSum.join( ', ' ) } )` ) ] ),
                            reify( "td", {}, [ reifyText( `${ stats.idSum }` ) ] ),
                            reify( "td", {}, [ reifyText( `${ orbit.length }` ) ] ),
                            reify( "td", {}, [ reifyText( `${ stats.euclideanPerimeter }` ) ] ),
                            reify( "td", {}, [ reifyText( `${ stats.indexPerimeter }` ) ] ),
                        ]
                ) ),
                //reify( "tr", {}, footerRow.map( f => reify( "td", { 'cssClass': f[1] }, [ reifyText( f[0] ) ] ) ) ),
             ] );
    }


    compose() {
        const args = [ ...arguments ];

        const rightCycles = this;
        var leftCycles = args.pop();

        if ( !( leftCycles instanceof CyclesArray && rightCycles instanceof CyclesArray ) ) {
            throw new Error( `Can only compose CyclesArrays: leftCycles=${ typeof leftCycles }, rightCycles=${ typeof rightCycles }` );
        }

        const leftBox = leftCycles.getMeta('box');
        const rightBox = rightCycles.getMeta('box');

        if ( !( leftBox == rightBox ) ) {
            throw new Error( "Can only compose CyclesArrays with points from the same box" );
        }


        const composedPoints = rightCycles
            .flatMap( cycle => cycle.map( ( point, id ) => {
                var nextPoint = cycle.getNextPoint( id );
                const nextCoord = nextPoint.coord;
                const [ leftCycle, lpi ] = leftCycles.getCycleAndIndex( nextCoord );
                const lpn = leftCycle.getNextPoint( lpi );
                const lpnCoord = lpn.coord ;
                const [ rpc, rpin ] = rightCycles.getCycleAndIndex( lpnCoord );
                nextPoint = rpc[rpin];
                return [ point, nextPoint ];
            } ) );

        function composeCycle( cycle, composedPoint ) {
            const [ point, nextPoint ] = composedPoint;

            var index = composedPoints.indexOf( composedPoint );
            if (index !== -1) {
                composedPoints.splice(index, 1);
            } else {
                throw new Error( `Composed point not found in graph: ${ composedPoint }`);
            }

            cycle.push( { "id": point.di, "di": nextPoint.di, "coord": point.coord } );

            if ( cycle[0].coord.equals( nextPoint.coord ) ) {
                return cycle;
            }

            const [ nextComposedPoint ] = composedPoints.filter( ([rp,rpc]) => rp.coord.equals( nextPoint.coord ) );

            if ( !nextComposedPoint ){
                 throw new Error( `Composed point not found in graph for coord: ${ nextPoint.coord }`);
             }

            return composeCycle( cycle, nextComposedPoint );
        }

        const cycles = new CyclesArray();
        while ( composedPoints.length > 0 ) {
            const cycle = composeCycle( new CycleArray(), composedPoints[0] );
            // TODO: explain
            if ( cycle.length > 1 ) {
                const coord = cycle[0].coord;
                cycle.forEach( ( point, i ) => {
                    const nextPoint = cycle.getNextPoint( i );
                    point.coord = ( i == cycle.length - 1 )
                        ? coord
                        : nextPoint.coord ;
                } );
            }
            rotateArray( cycle, -1 );
            cycles.push( cycle );
        }

        const rPerm = rightCycles.getMeta('perm');
        const lPerm = leftCycles.getMeta('perm');

        cycles.setMetaData( {
            'harmonic': false,
            'perm': rPerm.map( b => lPerm[b] ),
            'box': rightBox,
            'permKeys': [ leftCycles.getBases(), rightCycles.getBases() ]
        } );

        cycles.canonicalize();

        while ( args.length > 0 ) {
            cycles = cycles.compose( ...args );
        }

        return cycles;
    }
}
