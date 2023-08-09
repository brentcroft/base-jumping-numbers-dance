
const pointId = ( point ) => point.id;
const pointCoord = ( point ) => `(${ point.coord.join( "," ) })`;
const pointLabel = pointId;

const equalsCoord = ( p1, p2 ) => arrayExactlyEquals( p1.coord, p2.coord );


class Coord extends Array {
    key() {
        return this.join('.');
    }

    equals( other ) {
        //return this === other;
        return this === other || arrayExactlyEquals( this, other );
    }

    toString() {
        return `(${this.join(',')})`;
    }
}

class Coords {

    static boxes = {};

    static getCoords( bases ) {
        const canonicalBases = new Coord(bases.length);
        bases.forEach((b,i)=>canonicalBases[i]=b);
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
            const coord = new Coord(locusStack.length);
            locusStack.forEach((b,i)=>coord[i]=b);
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
        const value = this.coordMap[ coord.join('.') ];
        if (!value) {
            throw new Error(`The box [${this.bases.join(',')}] does not have coord [${coord.join(',')}]`);
        }
        return value;
    }
}

function isCycles( value ) {
    return value instanceof CyclesArray;
}

class CycleArray extends Array {

    getPointIndex( coord ) {
        for ( var i = 0; i < this.length; i++ ) {
            if ( arrayExactlyEquals( this[i].coord, coord ) ) {
                return i;
            }
        }
        return -1;
    }

    getPreviousPoint( i ) {
        return this[ ( i + this.length - 1 ) % this.length ];
    }

    getNextPoint( i ) {
        return this[ ( i + 1 ) % this.length ];
    }

    asCoords() {
        return this.map( p => `(${p.coord.join(',')})` );
    }

    getCycleNotation() {
        return `(${ this.map( p => p.id ).join( ', ' ) })`;
    }

    getEquations( bases, order ) {
        const v = bases.reduce( (b,c) => b * c, 1);
        return bases
            .map( (b,j) => {
            const r = [0];
            const m = [1];
            const d = [...this]
                .reverse()
                .map( (p,i) => {
               r[0] += p.coord[j] * m[0];
               m[0] = m[0] * b;
               return `${p.coord[j]}`
            } )
            .reverse()
            .join(' ');
            return d + "<sub>" + b + "</sub> = " + (r[0]);
        } );
    }

    equals( other, param = {} ) {
        if (!( other instanceof CycleArray ) ) {
            return false;
        }
        if ( this.length != other.length ) {
            return false;
        }

        const { sameEuclideanPerimeter = true, sameIndexPerimeter = true } = param;

        const stats = this.getStats();
        const otherStats = other.getStats();

        if ( sameEuclideanPerimeter && ( stats.euclideanPerimeter != otherStats.euclideanPerimeter ) ) {
            return false;
        } else if ( sameIndexPerimeter && ( stats.indexPerimeter != otherStats.indexPerimeter ) ) {
            return false;
        }

        var pointCoord = this[0].coord;
        const [ otherPoint, offset ] = other
            .map( ( p, i ) => [ p, i ] )
            .find( ( [ p, i ] ) => ( p.coord === pointCoord ) || arrayExactlyEquals( p.coord, pointCoord ) );

        if ( !otherPoint ) {
            return false;
        }

        for ( var i = 0; i < other.length; i++ ) {
            if ( !arrayExactlyEquals( this[i].coord, other[ ( i + offset ) % other.length ].coord ) ) {
                return false;
            }
        }

        return true;
    }

    getStats() {
        const rank = this[0].coord.length;

        const order = this.length;
        const centre = new Array( rank ).fill( 0 );
        const coordsSum = new Array( rank ).fill( 0 );

        this
            .map( point => point.coord )
            .forEach( coord => coord.forEach( (c,i) => coordsSum[i] += c ) );

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
            coordsSum: coordsSum,
            gcd: coordsSum.reduce( gcd ),
            lcm: coordsSum.reduce( lcm ),
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
        cycles.updateSymbols();

        return cycles;
    }

    static getIdentityCycles( volume ) {
        const terminal = volume - 1;
        const bases = [ volume ];
        const cycles = new CyclesArray();

        for (var i = 0; i < volume;i++){
            const cycle = new CycleArray();
            cycle.push( { id: i, di: i, coord: [ i ] } );
            cycles.push( cycle);
        }
        const box = extantBoxes.getBox( [ volume ] );
        cycles.setMetaData( {
            label: `${ volume }`,
            permPairs: [ new BoxPermPair( box, bases, [0], [0]) ]
        } );

        return cycles;
    }

//
//    constructor( ...items ) {
//        const nonCycles = items.filter( item => !( item instanceof CycleArray ) );
//        if ( nonCycles && nonCycles.length > 0 ) {
//            throw new Error( `Can only contain items of type CycleArray: ${ nonCycles.length } bad items.` );
//        }
//        super( ...items );
//    }



    equals( other, param = {} ) {
        if (!( other instanceof CyclesArray ) || this.length != other.length ) {
            return false;
        }

        const { sameEuclideanPerimeter = true, sameIndexPerimeter = true } = param;

        const totalEuclidean = [ 0, 0 ];
        const totalIndex = [ 0, 0 ];

        for ( var i = 0; i < this.length; i++ ) {
            const cycle = this[i];

            const [ otherCycle, offset ] = other.getCycleAndIndex( cycle[0].coord );
            if ( !cycle.equals( otherCycle, param ) ) {
                return false;
            }

            const cycleStats = cycle.getStats();
            const otherCycleStats = otherCycle.getStats();

            totalEuclidean[0] += cycleStats.euclideanPerimeter;
            totalEuclidean[1] += otherCycleStats.euclideanPerimeter;

            totalIndex[0] += cycleStats.indexPerimeter;
            totalIndex[1] += otherCycleStats.indexPerimeter;
        }

        if ( totalEuclidean[0] != totalEuclidean[1] ) {
            consoleLog( `${ this } != ${ other }; euclidean-perimeter: ${ totalEuclidean[0] } != ${ totalEuclidean[1] }` );
            return false;
        } else if ( totalIndex[0] != totalIndex[1] ) {
            return false;
        } else {
            return true;
        }
    }

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

    getBases() {
        var bases = this.getMeta( 'bases' );
        if ( bases ) {
            return bases;
        } else {
            const permPairs = this.getMeta( 'permPairs' );
            const permPair = permPairs[0];
            bases = permPair.right.getBases();
            this.setMeta( 'bases', bases );
            return bases
        }
    }
    getPermPairs() {
        return this.getMeta( 'permPairs' );
    }

    normaliseCoordinates() {
        if (!this.hasMeta( 'permPairs' )) {
            throw new Error("who threw this");
        }
        const permPairs = this.getMeta( 'permPairs' );
        const permPair = permPairs[0];
        const right = permPair.right;
        const boxCoords = Coords.getCoords( right.getBases() );

        this.forEach( cycle => cycle.forEach( point => {
            point.ncoord = boxCoords.getCoord( right.normalizeCoord( point.coord ) );
        } ) );
    }

    updateSymbols() {
        const permBox = extantBoxes.getBox(this.getBases());
        const permPair = this.getMeta( 'globalPermPair' );
        const [ leftPerm, rightPerm ] = [
            permBox.identifyPerm( permPair[0] ),
            permBox.identifyPerm( permPair[1] )
        ];
        this.setMeta( 'symbol', `${ leftPerm.symbols() }${ rightPerm.symbols() }` );
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
        const terminal = this.getOrigin();
        return terminal.meta || {};
    }

    setMetaData( data = {} ) {
        this.getOrigin().meta = data;
    }

    hasMeta( key ) {
        const terminal = this.getOrigin();
        return terminal.meta && key in terminal.meta;
    }

    getMeta( key ) {
        const terminal = this.getOrigin();
        return terminal.meta
            ? terminal.meta[key]
            : null;
    }

    setMeta( key, value ) {
        const terminal = this.getOrigin();
        if ( terminal.meta ) {
            terminal.meta[key] = value;
        } else {
            terminal.meta = { key: value };
        }
        return value;
    }

    getOrder() {
        return gcda( this.map( a => a.length ).filter( a => a > 1 ) );
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
        return this.getMeta('label');
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


    getEquations( cycle ) {
        const v = this.getVolume();

        const repeats = this.getOrder() / cycle.length;

        const permPairs = this.getMeta( 'permPairs' );
        const permPair = permPairs[0];

        return this
            .getBases()
            .map( (b,j) => {
                const r = [0];
                const m = [1];
                const d = [];
                for ( var x = 0; x < repeats; x++ ) {
                    // TODO: rubbish...
                    const points = (j % 2 == 0)
                        ? [...cycle]
                        : [...cycle].reverse();
                    const x = points
                        .map( (p,i) => {
                           const coord = permPair.right.denormalizeCoord(p.coord);
                           r[0] += coord[j] * m[0];
                           m[0] = m[0] * b;
                           return `${coord[j]}`
                        } )
                        .join('');
                    d.push(x);
                }
                return d.join('') + "<sub>" + b + "</sub> = " + (r[0]);
            } );
    }

    htmlSummary() {
        return reify( "div",{}, [
            reifyText( this.getMeta('label') ),
            reifyText( " = " ),
            reifyText( `(v=${this.getVolume()}, o=${this.getOrder()}) ` ),
            reifyText( " : " ),
            reifyText( this.hasMeta( 'permPairs' )
                ? this.getMeta( 'permPairs' ).map( p => `[${p}]`).join(',')
                : "no-perm-pairs" ),
            reifyText( " &rarr; " ),
            this.htmlMonomial(),
//            reify("br"),
//            ...this.getEquations(this[this.length-1])
//                .flatMap( eqn => [ reifyText( eqn ), reify("br") ] )
         ] );
    }

    htmlTable( param = {} ) {

        const { coords = false } = param;

        const bases = this.getBases();
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
            [ `<code>${ identityPointsSum }</code>`, [] ],
            [ `<code>${ identityIdSum }</code>`, [] ],
            [ `<code>1</code>`, [] ],
            [ `<code>0</code>`, [] ],
            [ `<code>0</code>`, [] ],
        ];

        const orbits =  this.filter( cycle => cycle.length > 1 );

        return reify(
            "table",
             { 'cssClass': [ 'box-action' ] },
             [
                reify( "caption", {}, [ this.htmlSummary() ] ),
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
                            reify( "td", {}, [ reifyText( `(${ stats.coordsSum.join( ', ' ) })` ) ] ),
                            reify( "td", {}, [ reifyText( `${ stats.idSum }` ) ] ),
                            reify( "td", {}, [ reifyText( `${ orbit.length }` ) ] ),
                            reify( "td", {}, [ reifyText( `${ stats.euclideanPerimeter }` ) ] ),
                            reify( "td", {}, [ reifyText( `${ stats.indexPerimeter }` ) ] ),
//                            reify( "td", {}, [ ...this.getEquations(orbit)
//                                .flatMap( eqn => [ reifyText( eqn ), reify( "br" ) ] ) ] )
                        ]
                ) ),
                //reify( "tr", {}, footerRow.map( f => reify( "td", { 'cssClass': f[1] }, [ reifyText( f[0] ) ] ) ) ),
             ] );
    }

    directProduct( leftCycles, twist = false ) {
        const rightCycles = this;
        const leftBases = [ ...leftCycles.getBases() ];
        const rightBases = [ ...rightCycles.getBases() ];
        const [ leftPermPair, rightPermPair] = [
            leftCycles.getMeta('permPairs')[0],
            rightCycles.getMeta('permPairs')[0]
        ];

        const bases = [ ...leftBases, ...rightBases ];
        const box = extantBoxes.getBox( bases );
        const productPairs = BoxPermPair.directProduct( box, leftBases, leftPermPair, rightBases, rightPermPair, twist );

        const ids = new CycleArray( leftCycles.getVolume() * rightCycles.getVolume() );

        rightCycles.forEach( rightCycle => {
            rightCycle.forEach( rightPoint => {
                const rightCoord = rightPoint.coord;
                leftCycles.forEach( leftCycle => {
                    leftCycle.forEach( leftPoint => {
                        const coord = [ ...leftPoint.coord, ...rightPoint.coord ];
                        const point = {
                            di: productPairs.indexRev(coord),
                            id: productPairs.indexFwd(coord),
                            coord: coord
                        };
                        ids[point.id] = point;
                    } );
                } );
            } );
        });

        // output cycles array
        const cycles = new CyclesArray();
        const usedId = {id:-1};
        ids.forEach( cyclePoint => {
            if ( cyclePoint.id >= 0 ) {
                 const newCycle = new CycleArray( cyclePoint );
                 var lastPoint = cyclePoint;
                 var nextPoint = ids[lastPoint.di];
                 ids[nextPoint.id] = usedId;
                 while ( nextPoint.id != cyclePoint.id ) {
                     newCycle.push( nextPoint );
                     lastPoint = nextPoint;
                     nextPoint = ids[lastPoint.di];
                     ids[nextPoint.id] = usedId;
                 }
                 cycles.push( newCycle );
            }
        });

        cycles.canonicalize();
        cycles.setMetaData( {
            label: `(${ leftCycles.getMeta('label') }${twist?':':'|'}${ rightCycles.getMeta('label') })`,
            permPairs: [ productPairs ],
            identityPlane: {
                coord: productPairs.ip_coord,
                gcd: Math.abs( gcda( productPairs.ip_coord ) ),
                normal: displacement( cycles.getOrigin().coord, productPairs.ip_coord )
            }
        } );
//        cycles.normaliseCoordinates();
        cycles.setMeta( 'identityPlane', {
                coord: productPairs.ip_coord,
                gcd: Math.abs( gcda( productPairs.ip_coord ) ),
                normal: displacement( cycles.getOrigin().coord, productPairs.ip_coord )
            } );
        return cycles;
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


        cycles.canonicalize();

        try {
//
//
            const bases = cycles.getBases();

            const lpp = leftCycles.getMeta('permPair');
            const rpp = rightCycles.getMeta('permPair');

            const permPair = [
                [...lpp[1]].reverse(),
                rpp[1]
            ];
//
//            // TODO: figure out a better solution
//            // not clear if this picks up all cases
//            // and what if it's meant to be an identity
            if ( arrayExactlyEquals( permPair[0], permPair[1] ) ) {
                permPair[0] = lpp[0];
                permPair[1] = rpp[0].reverse();
            }

            const p_fwd = placeValuesPermutation( bases, permPair[0] );
            const p_rev = placeValuesPermutation( bases, permPair[1] );
            const ip_coord = p_fwd.map( ( x, i ) => x - p_rev[i] );

            cycles.setMetaData( {
                label: `${ leftCycles.getMeta( 'label' ) }*${ rightCycles.getMeta( 'label' ) }`,
                globalPermPair: permPair,
                permPair: permPair,

                placesForward: p_fwd,
                placesReverse: p_rev,
                identityPlane: {
                    coord: ip_coord,
                    gcd: Math.abs( gcda( ip_coord ) ),
                    normal: displacement( cycles.getOrigin().coord, ip_coord )
                }
            } );
        } catch (e) {
            throw e;
        }

//        cycles.normaliseCoordinates();
        cycles.updateSymbols();

        while ( args.length > 0 ) {
            cycles = cycles.compose( ...args );
        }

        return cycles;
    }
}
