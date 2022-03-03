
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

