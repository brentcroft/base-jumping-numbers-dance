
class RadiantAction extends BoxAction {
    constructor( box, id = 0, enforceTerminalIdentities = false ) {
        super( box, id );

        this.forwardFrom = 0;
        this.reverseFrom = ( this.box.volume - 1 );

        this.placesReverse = placeValuesReverseArray( this.box.bases );
        this.placesForward = [...this.placesReverse].map( i => -1 * i );

        // establish identity plane
        this.identityPlane = this.placesForward.map( ( x, i ) => x - this.placesReverse[i] );
        this.identityPlaneGcd = Math.abs( gcda( this.identityPlane ) );
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );

        // establish coord index functions
        this.indexReverse = ( coord ) => {
            const index = this.placesReverse.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c, this.forwardFrom );

            if ( enforceTerminalIdentities ) {
                return index == 0
                    ? this.reverseFrom
                    : index == this.reverseFrom
                        ? 0
                        : index;
            } else {
                return index;
            }
        };
        this.indexForward = ( coord ) => this.placesForward.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c, this.reverseFrom );

        this.label = 'r';
        this.symbols = [];
        this.alias = [];
        this.idx = [];
        this.dix = [];
    }

    indexPoint( point ) {
        const boxVolume = this.box.volume;
        const di = this.indexForward( point.coord );
        const id = this.indexReverse( point.coord );

        this.box.validateIds( [ id, di ] );

        const partnerId = ( boxVolume - id - 1 );

        const pointIndexData = {
            id: id,
            di: di,
            partnerId: partnerId,
            jump: ( di - id ),
            radiant: ( partnerId - id )
        };

        const existingPointIndexData = point.indexes[ this.key ];

        if ( existingPointIndexData ) {
            consoleLog( `Id already allocated in point for index[${ this.id }]; point=${ point }, data=${ JSON.stringify( pointIndexData ) }, existing=${ JSON.stringify( existingPointIndexData ) }` );
        }

        point.indexes[this.key] = pointIndexData;

        this.idx[ id ] = point;
        this.dix[ di ] = point;
    }

    getType() {
        return 'rad';
    }
}


class LiteralAction extends BoxAction {
    constructor( box, id = 0 ) {
        super( box, id );

        // establish identity plane
        this.identityPlane = [ 1, 0, 0 ];
        this.identityPlaneGcd = 1;
        this.identityPlaneNormal = [ 0, 1, 0 ];
        this.label = 'l';
        this.symbols = [];
        this.alias = [];
        this.idx = [];
        this.dix = [];
    }

    indexPoint( point ) {
        const boxVolume = this.box.volume;
        const di = point.coord[ 0 ];
        const id = ( di + 1 ) % boxVolume;

        const partnerId = ( boxVolume - id - 1 );

        const pointIndexData = {
            id: id,
            di: di,
            partnerId: partnerId,
            jump: ( di - id ),
            radiant: ( partnerId - id )
        };

        const existingPointIndexData = point.indexes[ this.key ];

        if ( existingPointIndexData ) {
            consoleLog( `Id already allocated in point for index[${ this.id }]; point=${ point }, data=${ JSON.stringify( pointIndexData ) }, existing=${ JSON.stringify( existingPointIndexData ) }` );
        }

        point.indexes[this.key] = pointIndexData;

        this.idx[ id ] = point;
        this.dix[ di ] = point;
    }

    getType() {
        return 'lit';
    }
}

const pvaIndex = [0];

class PlaceValuesAction extends BoxAction {
    constructor( box, id = 0, placeValuesPermutationPair ) {
        super( box, id );
        this.pair = placeValuesPermutationPair;
        this.identityPlane = this.pair.identityPlane;
        this.identityPlaneGcd = this.pair.echo;
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );

        this.label = `${ this.pair.label }_${ this.pair.id }${ this.pair.harmonic ? `h` : '' }${ this.pair.inverse ? 'i' : '' }`;
        this.symbols = [ this.pair.symbol ];

        // reference to component indexes
        this.idx = this.pair.idx;
        this.dix = this.pair.dix;
    }

    indexPoint( point ) {
        const boxVolume = this.box.volume;

        const id = point.getId( this.pair.leftId );
        const di = point.getId( this.pair.rightId );

        const partnerId = ( boxVolume - id - 1 );

        const pointIndexData = {
            id: id,
            di: di,
            partnerId: partnerId,
            jump: ( di - id ),
            radiant: ( partnerId - id )
        };

        const existingPointIndexData = point.indexes[ this.key ];

        point.indexes[this.key] = pointIndexData;

        if ( existingPointIndexData ) {
            throw new Error( `Id already allocated in point for index[${ this.id }]; point=${ point }, data=${ JSON.stringify( pointIndexData ) }, existing=${ JSON.stringify( existingPointIndexData ) }` );
        }
    }
}

class FlatAction extends BoxAction {
    constructor( index, label ) {
        super( index.box, Math.round( Math.random() * 10000 + 1) );
        this.index = index;
        this.boxGroup = this.index.boxGroup;

        this.idx = new Array( this.box.volume );
        this.dix = new Array( this.box.volume );

        // todo: no identity plane
        this.identityPlane = [ -1, -1, 1 ];
        this.identityPlaneGcd = 1;
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );

        //
        this.label = label
            ? label
            : this.index instanceof PlaceValuesAction
                ? `${ this.index.label }f`
                : `(${ this.index.label })f`;
        this.symbols = [ ...this.index.symbols ];
        this.alias = this.index.alias;

        this.indexPoints();

        this.initialise();

        this.index.boxGroup.registerCompositeAction( this.label, this );
    }

    indexPoint( point, id, di, partnerId ) {
        if ( this.key in point.indexes ) {
            return;
        }
        point.indexes[ this.key ] = {
           id: id,
           di: di,
           partnerId: partnerId,
           jump: ( di - id ),
           radiant: ( partnerId - id )
        };
        this.idx[ id ] = point;
        this.dix[ di ] = point;
    }

    indexPoints() {
        const boxVolume = this.box.volume;
        var di = 0;

        const orbits = [ ...this.index.orbits, ...this.index.identities ];

        function indexPartnerPoints( index, points, context ) {
            const [ p1, p2 ] = points;
            var [ idA, diB, idB ] = context;
            p1.forEach( ( pA, i ) => {
                    index.indexPoint( pA, idA, di, 0 );
                    index.indexPoint( p2[ i ], idB, diB, 0 );
                    idA = di;
                    idB = diB;
                    di++;
                    diB--;
                });
        }

        while ( orbits.length > 0 ) {
            // remove and capture the orbit
            const [ orbit ] = orbits.splice( 0, 1 );

            if ( orbit.order == 1 ) {
                orbit
                    .points
                    .forEach( (point, i) => {
                        this.indexPoint( point, di, di, 0 );
                        di++;
                    });

            } else if ( orbit.isSelfPartner() ) {

                // split orbit into two parts
                const halfLength = orbit.order / 2;

                indexPartnerPoints(
                    this,
                    [ orbit.points.slice( 0, halfLength ), orbit.points.slice( halfLength ) ],
                    [ di + halfLength, di + orbit.order - 1, di + halfLength - 1 ] );

                di += halfLength;

            } else {

                // remove and capture partner orbit
                const [ partnerOrbit ] = orbits.splice( orbits.indexOf( orbit.partner ), 1 );
                const halfLength = orbit.order;

                indexPartnerPoints(
                    this,
                    [ orbit.points, partnerOrbit.points ],
                    [ di + halfLength - 1, di + ( orbit.order * 2 ) - 1, di + halfLength ] );

                di += halfLength;
            }
        }
    }

    getType() {
        return 'flat';
    }

    getPlaneEquationTx() {
        return this.alias.join(" / ");
    }
}



class RootAction extends BoxAction {
    constructor( index, factor ) {
        super( index.box, Math.round( Math.random() * 10000 + 1) );
        this.index = index;
        this.boxGroup = this.index.boxGroup;

        this.idx = new Array( this.box.volume );
        this.dix = new Array( this.box.volume );

        // todo: no identity plane
        this.identityPlane = [ -1, -1, 1 ];
        this.identityPlaneGcd = 1;
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );

        //
        this.factor = factor;
        this.label = `${ this.index.label }r${ this.factor }`;
        this.symbols = ['root'];
        this.alias = this.index.alias;

        if ( factor == 2 ) {
            this.indexPointsRoot2();
        } else if ( factor == 3 ) {
            this.indexPointsRoot3();
        } else {
            throw new Error( `Invalid root factor: ${ factor }` );
        }

        this.initialise();

        this.index.boxGroup.registerCompositeAction( this.label, this );
    }

    indexPoint( point, id, di, partnerId ) {
        if ( this.key in point.indexes ) {
            return;
        }
        point.indexes[ this.key ] = {
           id: id,
           di: di,
           partnerId: partnerId,
           jump: ( di - id ),
           radiant: ( partnerId - id )
        };
        this.idx[ id ] = point;
        this.dix[ di ] = point;
    }


    indexPointsRoot2() {
        const boxVolume = this.box.volume;
        const orbits = [ ...this.index.orbits, ...this.index.identities ];
        const sourceKey = this.index.key;

        function mergeAndIndexPartnerPoints( index, orbits, parity ) {
            const [ p1, p2 ] = [ [ ...orbits[ 0 ] ], [ ...orbits[ 1 ] ] ];

            // assuming orbits are aligned
            // to maintain alignment after interleaving
            if ( parity ) {
                rotateArray( p2, p2.length / 2 );
            } else {
                rotateArray( p2, ( Math.ceil( p2.length / 2 ) ) );
            }

            const pids = interleaveArrays(
                p1.map( p => p.at( sourceKey ) ),
                p2.map( p => p.at( sourceKey ) )
            );

            p1
                .forEach( ( x, i ) => {

                    const [ pA, pB ] = [ p1[ i ], p2[ i ] ];
                    const [
                        pidA,
                        pidB,
                        pidC
                    ] = [
                        pids[ ( 2 * i ) ],
                        pids[ ( 2 * i ) + 1 ],
                        ( i + 1 ) < p1.length ? pids[ ( 2 * i ) + 2 ] :  pids[ 0 ]
                    ];

                    index.indexPoint( pA, pidA.id, pidB.id, 0 );
                    index.indexPoint( pB, pidB.id, pidC.id, 0 );
                });
        }

        function appendPartnerPoints( index, points ) {
            const sequence = [ ...points[ 0 ], ...points[ 1 ] ];
            const [ e0, e1 ] = [ ( sequence.length / 2 ) - 1, sequence.length - 1 ];
            const [ di0, di1 ] = [
                sequence[ e0 ].at( sourceKey ).di,
                sequence[ e1 ].at( sourceKey ).di
            ];
            sequence
                .forEach( ( p, i ) => {
                    const sourceData = p.at( sourceKey );
                    if ( i == e0 ) {
                        index.indexPoint( p, sourceData.id, di1, 0 );
                    } else  if ( i == e1 ) {
                        index.indexPoint( p, sourceData.id, di0, 0 );
                    } else {
                        index.indexPoint( p, sourceData.id, sourceData.di, 0 );
                    }
                });
        }


        while ( orbits.length > 0 ) {
            // remove and capture next orbit
            const [ orbit ] = orbits.splice( 0, 1 );

            if ( orbit.order == 1 ) {
                orbit
                    .points
                    .forEach( (point, i) => {
                        const di = point.at( sourceKey ).id;
                        this.indexPoint( point, di, di, 0 );
                    });
            } else if ( orbit.isSelfPartner() ) {
                const partnerOrbits = orbits
                    .filter( partnerOrbit => partnerOrbit.isSelfPartner() )
                    .filter( partnerOrbit => partnerOrbit.order == orbit.order );

                if ( partnerOrbits.length == 0 ) {
                    if ( orbit.order == 2 ) {
                        // pick last fixed point
                        const smp = orbits
                            .filter( partnerOrbit => partnerOrbit.order == 1 );

                        if ( smp.length < 2 ) {
                            throw new Error( `No fixed points to root transposition ${ orbit }` );
                        }

                        // remove and capture fixed points
                        const [ [ e0 ], [ e1 ] ] = [
                            orbits.splice( orbits.indexOf( smp.pop() ), 1 ),
                            orbits.splice( orbits.indexOf( smp[0] ), 1 )
                        ];

                        const [ [ p00, p01 ], [ p10, p11 ] ] = [
                            [ e0.points[0], orbit.points[0] ],
                            [ e1.points[0], orbit.points[1] ]
                        ];

                        const [ di00, di01, di10, di11 ] = [
                            p00.at( sourceKey ),
                            p01.at( sourceKey ),
                            p10.at( sourceKey ),
                            p11.at( sourceKey )
                        ];

                        this.indexPoint( p00, di00.id, di11.id, 0 );
                        this.indexPoint( p01, di01.id, di00.id, 0 );
                        this.indexPoint( p10, di10.id, di01.id, 0 );
                        this.indexPoint( p11, di11.id, di10.id, 0 );

                    } else {
                        throw new Error( `No available partner for orbit ${ orbit }` );
                    }
                } else {
                    // remove and capture partner orbit
                    const [ partnerOrbit ] = orbits.splice( orbits.indexOf( partnerOrbits[0] ), 1 );
                    mergeAndIndexPartnerPoints( this, [ orbit.points, partnerOrbit.points ] );
                }

            } else {
                // remove and capture partner orbit
                const po00 = orbit;
                const [ po01 ] = orbits.splice( orbits.indexOf( po00.partner ), 1 );

                // is the order even
                const parity = !( orbit.order % 2 );

                if ( parity ) {
                    // odd order means interleave with partner
                   mergeAndIndexPartnerPoints( this, [ po00.points, po01.points ], parity );
                } else if ( true ) {
                    // even order means interleave with partner
                   mergeAndIndexPartnerPoints( this, [ po00.points, po01.points ], parity );
                   //appendPartnerPoints( this, [ po00.points, po01.points ] );
                } else if ( false ) {
                    // even order means interleave with another pair of partners
                    const partnerOrbits = orbits
                        .filter( partnerOrbit => !partnerOrbit.isSelfPartner() )
                        .filter( partnerOrbit => partnerOrbit.order == orbit.order );

                    if ( partnerOrbits.length == 0 ) {
                        // maybe a pair of self matching partners
                        const smp = orbits
                            .filter( partnerOrbit => partnerOrbit.isSelfPartner() )
                            .filter( partnerOrbit => partnerOrbit.order == orbit.order );

                        if ( smp.length < 2 ) {
                            throw new Error( `No partners for orbit ${ orbit }` );
                        }

                        partnerOrbits.push( ...smp );
                    }
                    else if ( partnerOrbits.length < 2 ) {
                        throw new Error( `Insufficient partners for orbit ${ orbit }` );
                    }

                    const [ po10 ] = orbits.splice( orbits.indexOf( partnerOrbits[0] ), 1 );
                    const [ po11 ] = orbits.splice( orbits.indexOf( partnerOrbits[1] ), 1 );

                    mergeAndIndexPartnerPoints( this, [ po00.points, po10.points ] );
                    mergeAndIndexPartnerPoints( this, [ po01.points, po11.points ] );
                }
            }
        }
    }

    indexPointsRoot3() {
        const boxVolume = this.box.volume;
        const orbits = [ ...this.index.orbits, ...this.index.identities ];
        const sourceKey = this.index.key;

        function mergeAndIndexPartnerPoints( index, points ) {
            const [ p1, p2, p3 ] = [ [ ...points[ 0 ] ], [ ...points[ 1 ] ], [ ...points[ 2 ] ] ];

            const ids = interleaveArrays(
                p1.map( p => p.at( sourceKey ).id ),
                p2.map( p => p.at( sourceKey ).id ),
                p3.map( p => p.at( sourceKey ).id )
            );

            var di = ids[ ids.length - 1 ];

            p1
                .forEach( ( x, i ) => {

                    const [ pA, pB, pC ] = [ p1[ i ], p2[ i ], p3[ i ] ];
                    const [ idA, idB, idC ] = [ ids[ ( 3 * i ) ], ids[ ( 3 * i ) + 1 ], ids[ ( 3 * i ) + 2 ] ];

                    index.indexPoint( pA, di, idA, 0 );
                    index.indexPoint( pB, idA, idB, 0 );
                    index.indexPoint( pC, idB, idC, 0 );

                    di = idC;
                });
        }

        function appendPartnerPoints( index, points ) {
            const sequence = [ ...points[ 0 ], ...points[ 1 ], [ ...points[ 2 ] ] ];
            const [ e0, e1, e2 ] = [ 0, sequence.length / 3, 2 * ( sequence.length / 3 ) ];
            const [ di0, di1, di2 ] = [
                a[ e0 ].at( sourceKey ).di,
                a[ e1 ].at( sourceKey ).di,
                a[ e2 ].at( sourceKey ).di
            ];
            sequence
                .forEach( ( p, i ) => {
                    const sourceData = p.at( sourceKey );
                    if ( i == e0 ) {
                        index.indexPoint( p, sourceData.id, di2, 0 );
                    } else  if ( i == e1 ) {
                        index.indexPoint( p, sourceData.id, di1, 0 );
                    } else  if ( i == e2 ) {
                        index.indexPoint( p, sourceData.id, di0, 0 );
                    } else {
                        index.indexPoint( p, sourceData.id, sourceData.di, 0 );
                    }
                });
        }

        while ( orbits.length > 0 ) {
            // remove and capture next orbit
            const [ orbit ] = orbits.splice( 0, 1 );

            if ( orbit.order == 1 ) {
                orbit
                    .points
                    .forEach( (point, i) => {
                        const di = point.at( sourceKey ).id;
                        this.indexPoint( point, di, di, 0 );
                    });
            } else if ( orbit.isSelfPartner() ) {
                const partnerOrbits = orbits
                    .filter( partnerOrbit => partnerOrbit.isSelfPartner() )
                    .filter( partnerOrbit => partnerOrbit.order == orbit.order );

                if ( partnerOrbits.length < 2 ) {
                    throw new Error( `No available partners for orbit ${ orbit }` );
                }
                // remove and capture partner orbits
                const [ partnerOrbit1 ] = orbits.splice( orbits.indexOf( partnerOrbits[0] ), 1 );
                const [ partnerOrbit2 ] = orbits.splice( orbits.indexOf( partnerOrbits[1] ), 1 );
                mergeAndIndexPartnerPoints( this, [ orbit.points, partnerOrbit1.points, partnerOrbit2.points ] );

            } else {
                // remove and capture partner orbit
                const po00 = orbit;
                const [ po01 ] = orbits.splice( orbits.indexOf( po00.partner ), 1 );

                // find two other pairs
                const partnerOrbits1 = orbits
                    .filter( partnerOrbit => !partnerOrbit.isSelfPartner() )
                    .filter( partnerOrbit => partnerOrbit.order == orbit.order );

                if ( partnerOrbits1.length < 4 ) {
                    throw new Error( `No available partners for orbit ${ orbit }` );
                }

                const [ po10 ] = orbits.splice( orbits.indexOf( partnerOrbits1[0] ), 1 );
                const [ po11 ] = orbits.splice( orbits.indexOf( po10.partner ), 1 );


                const partnerOrbits2 = orbits
                    .filter( partnerOrbit => !partnerOrbit.isSelfPartner() )
                    .filter( partnerOrbit => partnerOrbit.order == orbit.order );

                if ( partnerOrbits2.length < 2 ) {
                    throw new Error( `No available partners for orbit ${ orbit }` );
                }

                const [ po20 ] = orbits.splice( orbits.indexOf( partnerOrbits2[0] ), 1 );
                const [ po21 ] = orbits.splice( orbits.indexOf( po20.partner ), 1 );

                mergeAndIndexPartnerPoints( this, [ po00.points, po10.points, po20.points ] );
                mergeAndIndexPartnerPoints( this, [ po01.points, po11.points, po21.points ] );
            }
        }
    }

    getType() {
        return 'root';
    }

    getPlaneEquationTx() {
        return this.alias.join(" / ");
    }
}


class CompositeAction extends BoxAction {

    static compositeLabel( leftAction, rightAction ) {
        return `${ leftAction.getLabel() } * ${ rightAction.getLabel() }`;
    }

    static compositeSymbol( leftAction, rightAction ) {
        const one = '1';
        return leftAction.symbols && leftAction.symbols.length > 0
            ? leftAction.symbols[0] == one
                ? rightAction.symbols[0]
                : rightAction.symbols[0] == one
                    ? leftAction.symbols[0]
                    : `${ leftAction.symbols[0] } * ${ rightAction.symbols[0] }`
            : one;
    }

    constructor( box, id = 0, leftAction, rightAction, autoInit = false, reverse = false ) {
        super( box, id );

        this.leftAction = leftAction;
        this.rightAction = rightAction;
        this.boxGroup = this.leftAction.boxGroup;
        this.reverse = reverse;

        this.idx = new Array( this.box.volume );
        this.dix = new Array( this.box.volume );

        // todo: no identity plane
        this.identityPlane = [ -1, -1, 1 ];
        this.identityPlaneGcd = 1;
        this.identityPlaneNormal = displacement( this.box.origin, this.identityPlane );

        //
        if ( leftAction instanceof BoxAction && rightAction instanceof BoxAction ) {
            this.label = CompositeAction.compositeLabel( leftAction, rightAction );
            this.symbols = [ CompositeAction.compositeSymbol( leftAction, rightAction ) ];
        }
        this.alias = [];

        if ( autoInit ) {
            this.indexPointsFromCycles();
            this.initialise();
        } else {
            this.unindexed = true;
        }
    }

    indexPointsFromCycles() {
        this.cycles = composePermutations( this.leftAction.getCycles(), this.rightAction.getCycles() );
        this.box.points.forEach( point => this.indexPointFromCycles( point ) );
        delete this.unindexed;
    }

    indexPointFromCycles( point ) {
        var cycle = this
            .cycles
            .find( cycle => cycle.find( c => c == point ) );

        if ( !cycle || cycle.length == 0 ) {
            throw new Error( `No cycle for point: ${ point }` );
        }

        const nextIndex = ( 1 + cycle.indexOf( point ) ) % cycle.length;
        const endPoint = cycle[ nextIndex ];

        // using common ids from leftAction
        const id = point.at( this.leftAction.key ).id;
        const di = endPoint.at( this.leftAction.key ).id;

        this.box.validateIds( [ id, di ] );

        const partnerId = ( this.box.volume - id - 1 );

        const pointIndexData = {
           id: id,
           di: di,
           partnerId: partnerId,
           jump: ( di - id ),
           radiant: ( partnerId - id )
        };

        point.indexes[this.key] = pointIndexData;

        this.idx[ id ] = point;
        this.dix[ di ] = point;
    }


    indexPoints() {
        this.box.points.forEach( point => this.indexPoint( point ) );
        delete this.unindexed;
    }

    getType() {
        return 'comp';
    }

    getPlaneEquationTx() {
        return this.alias.join(" / ");
    }
}

class CoprimesAction extends CompositeAction {
    constructor( box, id = 0, label, cyclesObject ) {
        super( box, id, -1, -1 );

        const key = [ cyclesObject.rightCoprime, cyclesObject.leftCoprime, cyclesObject.multiplier ];

        const bases = this.box.bases;
        this.box.placeValuePermutations.filter( pvp => {
            const a0 = pvp.perm.map( i => bases[i] );
            if ( arrayExactlyEquals( key, a0 ) ) {
                this.pvp = pvp;
                this.pvpAnti = false;
                return true;
            }
            const a1 = pvp.antiPerm.map( i => bases[i] );
            if ( arrayExactlyEquals( key, a1 ) ) {
                this.pvp = pvp;
                this.pvpAnti = true;
                return true;
            }
            return false;
        } );

        if ( !this.pvp ) {
            throw new Error( `No PVP found for cyclesObject: ${ cyclesObject }` );
        }

        this.cycles = this.pvpAnti
            ? cyclesObject
                .cycles
                .map( cycle => cycle
                    .map( c => this.pvp.dix[ c ] ) )
            : cyclesObject
                .cycles
                .map( cycle => cycle
                    .map( c => this.pvp.idx[ c ] ) );

        this.label = label;
        this.symbols = [];

        this.indexPointsFromCycles();
        this.initialise();
    }

    indexPointsFromCycles() {
        this.box.points.forEach( point => this.indexPointFromCycles( point ) );
        delete this.unindexed;
    }

    indexPointFromCycles( point ) {
        var cycle = this
            .cycles
            .find( cycle => cycle.find( c => c == point ) );

        if ( !cycle || cycle.length == 0 ) {
            cycle = [ point ];
            this.cycles.push( cycle );
        }

        const nextIndex = ( 1 + cycle.indexOf( point ) ) % cycle.length;
        const endPoint = cycle[ nextIndex ];

        const id = point.id;
        const di = endPoint.id;

        this.box.validateIds( [ id, di ] );

        const partnerId = ( this.box.volume - id - 1 );

        const pointIndexData = {
           id: id,
           di: di,
           partnerId: partnerId,
           jump: ( di - id ),
           radiant: ( partnerId - id )
        };

        point.indexes[this.key] = pointIndexData;

        this.idx[ id ] = point;
        this.dix[ di ] = point;
    }

}


class BoxGroup {

    constructor( bases = [], param = {} ) {

        const toggles = param.toggles || [];
        const actionLayers = param.actionLayers || [];

        this.compositeActions = [];

        [
            this.alternatePerms,
            this.compositionRules,
            this.ignoreOrbitOffsets,
            this.ignoreIndexPerimeters,
            this.ignoreEuclideanPerimeters
        ] = [
            toggles.includes( "alternatePerms" ),
            toggles.includes( "compositionRules" ),
            toggles.includes( "ignoreOrbitOffsets" ),
            toggles.includes( "ignoreIndexPerimeters" ),
            toggles.includes( "ignoreEuclideanPerimeters" )
        ];

        const [ identities, inverses, harmonics, degenerates, compositionRules, ignoreOrbitOffsets ] = [
            toggles.includes( "identities" ),
            toggles.includes( "inverses" ),
            toggles.includes( "harmonics" ),
            toggles.includes( "degenerates" )
        ];


        this.box = new PermBox( bases );
        this.key = "box-group" + this.box.bases.join( "." );

        if (toggles.includes( "radiance" )) {

            this.box.radiance = new RadiantAction( this.box, 0, toggles.includes( "fixedRad" ) );
            this.box.unity = new CompositeAction( this.box, 1, this.box.radiance, this.box.radiance );
            this.box.unity.label = 'e';

            this.boxActions = [ this.box.radiance, this.box.unity ];
        } else {
            this.boxActions = [];
        }

        if ( bases.length == 1 ) {
            this.boxActions.push( new LiteralAction( this.box, this.boxActions.length ) );

        } else if ( bases.length > 1 ) {

            const [ DD, DU, UD, UU ] = [
                [ 0, 0, 'DD' ],
                [ 0, 1, 'DU' ],
                [ 1, 0, 'UD' ],
                [ 1, 1, 'UU' ]
            ];

            const indexors = [];

            var identityId = 0;
            var palindromeId = 0;

            this.box.placeValuePermutations
                .forEach( ( pvp, i ) => {

                    const identity = new PlaceValuesPermutationPair( identityId++, bases, pvp, pvp, DD );
                    const palindrome = new PlaceValuesPermutationPair( palindromeId++, bases, pvp, pvp, UD );

                    indexors.push( identity );
                    indexors.push( palindrome );

                    if ( inverses ) {
                        // same pair id
                        indexors.push( new PlaceValuesPermutationPair( identity.id, bases, pvp, pvp, UU, identity ) );
                        indexors.push( new PlaceValuesPermutationPair( palindrome.id, bases, pvp, pvp, DU, palindrome ) );
                    }
                });


            var uppers = 0;

            pairs( this.box.placeValuePermutations )
                .forEach( ( p, i ) => {

                    // rotate every iteration
                    const pair = this.alternatePerms && (i % 2) ? [ p[1], p[0] ] : [ p[0], p[1] ];

                    var dd = null;
                    var uu = null;
                    var idd = null;
                    var iuu = null;

                    var du = null;
                    var duh = null;

                    var idu = null;
                    var iduh = null;

                    dd = new PlaceValuesPermutationPair( uppers, bases, pair[0], pair[1], DD );
                    uu = new PlaceValuesPermutationPair( uppers + 1, bases, pair[0], pair[1], UU );

                    idu = new PlaceValuesPermutationPair( i, bases, pair[0], pair[1], UD, duh, false );
                    iduh = new PlaceValuesPermutationPair( i, bases, pair[1], pair[0], UD, du, true );

                    if ( inverses ) {
                        idd = new PlaceValuesPermutationPair( uppers, bases, pair[1], pair[0], DD, dd );
                        iuu = new PlaceValuesPermutationPair( uppers + 1, bases, pair[1], pair[0], UU, uu );

                        // swap places && swap state
                        duh = new PlaceValuesPermutationPair( i, bases, pair[1], pair[0], DU, iduh, false );
                        du = new PlaceValuesPermutationPair( i, bases, pair[0], pair[1], DU, idu, true );
                    }

                    [ dd, idd, uu, iuu ]
                        .filter( p => p )
                        .forEach( p => indexors.push( p ) );

                    [ idu, iduh, duh, du ]
                        .filter( p => p )
                        .forEach( p => indexors.push( p ) );

                    uppers += 2;
                } );

            //indexors.sort( ( p1, p2 ) => p1.compareTo( p2 ) );

            // capture all labels
            this.layerLabels = [];
            indexors.forEach( pair => this.layerLabels.filter( l => l[1] == pair.label ).length > 0 ? 0 : this.layerLabels.push( [ pair.layer, pair.label ] ) );
            this.layerLabels.sort( (a,b) => a[0]- b[0] );

            const layers = new Array( indexors.length + 2 ).fill( 0 );
            layers.forEach( (x,i) => layers[i] = [] );

            // filter and group by layers
            indexors
                .filter( pair => actionLayers.includes( pair.layer ) )
                .filter( pair => harmonics || !pair.harmonic )
                .filter( pair => degenerates || !pair.degenerate )
                .forEach( pair => {
                    layers[ pair.layer ].push( pair );
                } );

            // remove empty layers
            this.layers = layers.filter( layer => layer.length > 0 );

            this.layers
                .forEach( layer => {
                    var actionIndex = 0;
                    layer
                        .forEach( (pair , i) => this.boxActions
                            .push( new PlaceValuesAction( this.box, this.boxActions.length, pair, pair.id ) )
                        );
                } );
        }

        this.box.points
            .forEach( point => this.boxActions
                  .filter( i => !( i instanceof CompositeAction ) )
                  .forEach( indexer => indexer.indexPoint( point ) ) );

        if (toggles.includes( "radiance" )) {
            // unity is composite so has not yet been indexed
            this.box.unity.indexPoints();
        }

        this.boxActions.forEach( plane => {
            plane.ignoreEuclideanPerimeters = this.ignoreEuclideanPerimeters;
            plane.ignoreIndexPerimeters = this.ignoreIndexPerimeters;
            plane.ignoreOrbitOffsets = this.ignoreOrbitOffsets;
            plane.boxGroup = this;
        } );

        this.boxActions.forEach( plane => plane.initialise() );
    }

    getIndexMap() {
        const keys = {};
        this.boxActions.forEach( p => keys[ p.label ] = p );
        this.compositeActions.forEach( p => keys[ p.label ] = p );
        return keys;
    }

    findMatchingActions( boxAction ) {
        return this.boxActions.filter( p => p.equals( boxAction ) );
    }

    removeEqualCompositeAction( boxAction ) {
        const equalCompositeActions = this.compositeActions.filter( p => p.equals( boxAction ) );
        equalCompositeActions
            .forEach( eca => this.compositeActions.splice( this.compositeActions.indexOf( eca ), 1 ) );
    }

    findActionByPermPair( permPair ) {
        const matches = this
            .boxActions
            .filter( p => p instanceof PlaceValuesAction )
            .filter( p => arrayExactlyEquals( p.pair.permPair[0], permPair[0] ) && arrayExactlyEquals( p.pair.permPair[1], permPair[1] ) );
        return matches.length > 0 ? matches[0] : null;
    }

    registerCompositeAction( alias, compositeAction ) {
        if ( !this.findActionByAlias( alias ) ) {
            this.compositeActions.push( compositeAction );
        }
        //consoleLog( `registered composite action: ${ alias }`);
    }

    findActionByAlias( alias ) {

        const matchingCompositeAlias = this.compositeActions
            .filter( a => a.alias.includes( alias ) );

        if ( matchingCompositeAlias.length > 0 ) {
            //consoleLog( `found matching composite alias: ${ matchingCompositeAlias }`);
            return matchingCompositeAlias[0];
        }

        const matchingAlias = this.boxActions
            .filter( a => a.alias.includes( alias ) );

        if ( matchingAlias.length > 0 ) {
            //consoleLog( `found matching alias: ${ matchingAlias }`);
            return matchingAlias[0];
        }

        return null;
    }
}