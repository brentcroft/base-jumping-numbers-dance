function getCyclesDiagram( cycles, param = {} ) {

    const { scaleBase = [ 1, 1, 1 ], scaleVolume = 10, toggles = [ 'lines' ] } = param;

    if ( !Array.isArray( cycles ) ) {
        throw new Error( `Cycles is not an array: ${ cycles }` );
    }

    const fixedPointTransparency = 0.1;
    const colorBasePlane = new ColorBasePlane();

    // assume all fixed points are present - and appending 1 for terminal
    const volume = cycles.reduce( ( a, cycle ) => a + cycle.length, 0 );
    const terminal = ( volume - 1 );
    const indexCentre = terminal / 2;

    const zOff = 1;
    const scaleUnit = scale( scaleBase, scaleVolume / volume );

    const root = reify( "transform", { "translation": `${ -1 * volume / 2 } 0 0` } );

    const attr = { "linetype": "0" };

    const identities = cycles.filter( cycle => cycle.length == 1 );
    const orbits = cycles.filter( cycle => cycle.length > 1 );

    root
        .appendChild(
            reify(
                "collision",
                {
                    "class": "stave",
                    "enabled": false,
                    "render": true
                },
                [
                    // identity z-lines
                    ...( orbits.length > 0 )
                        ? identities
                            .map( cycle => reify( "transform", { "translation": `${ cycle[0].id } 0 ${ zOff * -1 }` },
                                    [ createLineSet( [ [ 0, 0, 0 ], [ 0, 0, zOff * ( orbits.length ) ] ], "black", attr ) ]
                                )
                            )
                        : [],

                    // identity x-line
                    createLineSet( [ [ 0, 0, zOff * ( -1 ) ], [ terminal, 0, zOff * ( -1 ) ] ], "black", attr ),

                    // orbit x-lines
                    ...orbits
                        .map( ( _, i ) => i )
                        .map( i => createLineSet(
                                [ [ 0, 0, zOff * ( i ) ], [ terminal, 0, zOff * ( i ) ] ],
                                colorBasePlane.colorForIndex( i ),
                                attr
                            )
                        )
                ]
            )
        );

    // FIXED POINTS
    identities
        .map( cycle => cycle[0] )
        .map( entry => reify( "transform", {
                    "translation": `${ entry.id } 0 ${ -1 * zOff }`,
                    "id": `identity.e.${ entry.id }`
                },
                [ createSphereShape( `point-${ entry.id }`, 0.17, "red", 0.3 ) ]
            )
        )
        .forEach( child => root.appendChild( child ) );


    // ORBITS
    orbits
        .map( ( cycle, cycleIndex ) => reify( "transform", { "translation": `0 0 ${ zOff * cycleIndex }` },
                [
                    ...cycle
                        .map( ( entry, entryIndex ) => {
                                const nextEntry = cycle[ ( entryIndex + 1 ) % cycle.length ];
                                const jump = ( nextEntry.id - entry.id );
                                const halfJump = jump / 2;
                                const color = colorBasePlane.colorForIndex( cycleIndex + 1 );
                                return reify(
                                    "transform", { "translation": `${ entry.id } 0 0` },
                                    [
                                        createSphereShape( `point-${ entry.id }`, 0.3, color , 0 ),
                                        toggles.includes( 'lines' )
                                            ? reify(
                                                "transform", {
                                                    "translation": `${ halfJump } 0 0`,
                                                    "class": "orbit-line"
                                                },
                                                [
                                                    createTorusShape( {
                                                            outerRadius: halfJump,
                                                            size: 0.1,
                                                            emissiveColor: color,
                                                            transparency: 0,
                                                            angle: PI,
                                                            cssClass: "orbitation"
                                                         } )
                                                ] )
                                            : null
                                    ]
                                );
                            }
                        )
                ] ) )
        .forEach( child => root.appendChild( child ) );

    return reify(
        "collision",
        { "enabled": false },
        [ reify( "transform", { "scale": `${ scaleUnit.join( ' ' ) }` }, [ root ] ) ]
    );
}



function getPointsDiagram( action, param = {} ) {

    const { scaleBase = [ 1, 1, 1 ], scaleVolume = 10, toggles = [ 'lines', 'grid', 'plane', 'centres' ] } = param;

    const fixedPointTransparency = 0.1;
    const colorBasePlane = new ColorBasePlane();

    const orbits = action.orbits;

    const [ p1, p2 ] = action.box.diagonal.map( p => to3D(p) );

    const scaleUnit = scale( scaleBase, scaleVolume / action.box.volume );

    // move origin to system centre and scale by scaleUnit
    const root = reify(
        "transform", {
            "translation": scale( to3D( action.box.centre ), -1 ).join( ' ' ),
            "scale": scaleUnit.map( x => x==0 ? 1 : 1 / x ).join( ' ' )
        } );

    function appendGridChildren( grid ) {
        const [ b0, b1, b2 ] = action.box.bases;
        const gridCoordStyle = { "family": "'San Serif'", "size": 0.05 };
        const gridPointRadius = 0.05;

        for ( var i = 0; i < b0; i++ ) {
            for ( var j = 0; j < b1; j++ ) {
                for ( var k = 0; k < b2; k++ ) {
                    grid
                        .appendChild(
                            reify(
                                "transform",
                                {
                                    "translation": [ i, j, k ].join( ' ' ),
                                    "scale": scaleUnit.join( ' ' )
                                },
                                [
                                    createSphereShape( `grid-point-${ [ i, j, k ].join( '.' ) }`, gridPointRadius, 'black', 0.10, `(${ [ i, j, k ].join( ',' ) })` ),
                                    createTextShape( `(${ [ i, j, k ].join( ',' ) })`, gridCoordStyle )
                                ]
                            )
                        );
                }
            }
        }
    }

    // GRID
    root
        .appendChild(
            reify(
                "group",
                {
                    "class": "grid-coords",
                    "render": toggles.includes( 'grid' )
                },
                [],
                [ appendGridChildren ]
            )
        );


    // PLANE
    var currentDirection = [0,1,0];
    currentDirection[ 1 ] = 1;
    var planeColor = "black";
    var planeTransparency = 0.95;

    var planeItem = createPlaneItemWithNormal( {
            centre: to3D( action.box.centre ),
            planeNormal: to3D( action.identityPlaneNormal ),
            scaleUnit: [1,1,1],
            currentDirection: [0,1,0],
            origin: [0,0,0],
            size: [ action.box.bases[0], 0, action.box.bases[action.box.bases.length-1] ],
            planeColor: planeColor,
            planeTransparency: planeTransparency
        } );

    planeItem.setAttribute( "render", toggles.includes( 'plane' ) );
    root.appendChild( planeItem );



    // CENTRE LINES
    try {
        const centrePoints = action
            .centrePoints
            .map( x => reify(
                            "transform",
                            {
                                "translation": to3D( x.point ).join( ' ' ),
                                "scale": scaleUnit.join( ' ' )
                            },
                            [ createSphereShape( null, 0.1, "yellow", 0, `centre-${ x.point }` ) ]
                        ) );

        const centreLines = action
            .centreLines
            .map( centreLine => createLineSetFromCoords( extendLine( to3D( centreLine.points[0] ), to3D( centreLine.points[1] ), 0.5 ), "gray" ) );

        const centreItems = reify(
            "group",
            { "class": "orbit-centre", "render": toggles.includes( 'centres' ) },
            centrePoints.concat( centreLines )
        );

        root.appendChild( centreItems );

    } catch ( e ) {
        console.log( e );
    }

    // FIXED POINTS
    action
        .identities
        .forEach(
            orbit => orbit
                .points
                .map( point => {
                    return {
                            "id": "point-" + to3D( point.coord ).join( '.' ),
                            "translation": to3D( point.coord ).join( ' ' ),
                            "scale": scaleUnit.join( ' ' ),
                            "report": point.report(),
                            "json": point.getJson()
                        };
                    }
                )
                .forEach( identityPoint => root
                    .appendChild(
                        reify(
                            "transform",
                            identityPoint,
                            [ createSphereShape( identityPoint.pointId, 0.1, "red", fixedPointTransparency, JSON.stringify( identityPoint.json ) ) ] )
                        )
                    )
                );


    // ORBITS
    for ( var i = 0; i < orbits.length; i++ ) {
        const orbit = orbits[i];
        const orbitColor = colorBasePlane.colorForIndex( orbit.index );
        root
            .appendChild(
                reify(
                    "group",
                    { "class": "orbit-line", "id": ("orbit." + orbit.index ) },
                    [
                        createCylinderSet(
                            orbit.points,
                            orbitColor,
                            {
                                "scaleUnit": scaleUnit
                            }
                        ),
                        reify(
                            "transform",
                            {
                                "translation": to3D( orbit.centre ).join( ' ' ),
                                "scale": scaleUnit.join( ' ' )
                            },
                            [ createSphereShape( "orbit." + orbit.index + ".0" , 0.09, "gray" ) ]
                        ),
                        ...orbit.points.map( (x,i) => reify(
                            "transform",
                            {
                                "translation": to3D( x.coord ).join( ' ' ),
                                "scale": scaleUnit.join( ' ' ),
                                "class": "orbitCoord",
                                "id": `orbitCoord.${ x.index }.${ i }`
                            },
                            [ createSphereShape( "orbit." + orbit.index + "." + i, 0.07, orbitColor, 0, JSON.stringify( x.getJson() ) ) ] ) )
                    ],
                    [ ( e ) => e.setAttribute( "render", toggles.includes( 'lines' ) ) ]
                )
            );
    }

    return reify( "collision", { "enabled": false }, [ root ] );
}


function getPointsDiagram2( cycles, param = {} ) {

    const { scaleBase = [ 1, 1, 1 ], scaleVolume = 10, toggles = [ 'lines', 'grid', 'plane', 'centres' ] } = param;

    const fixedPointTransparency = 0.1;
    const colorBasePlane = new ColorBasePlane();

    const [ p1, p2 ] = cycles.getDiagonal().map( coord => to3D( coord ) );
    const scaleUnit = scale( scaleBase, scaleVolume / cycles.getVolume() );

    const bases = cycles.getBases();
    const centre = cycles.getCentre();

    // move origin to system centre and scale by scaleUnit
    const root = reify(
        "transform", {
            "translation": scale( to3D( centre ), -1 ).join( ' ' ),
            "scale": scaleUnit.map( x => x==0 ? 1 : 1 / x ).join( ' ' )
        } );

    function appendGridChildren( grid ) {
        const [ b0, b1, b2 ] = bases;
        const gridCoordStyle = { "family": "'San Serif'", "size": 0.05 };
        const gridPointRadius = 0.05;

        for ( var i = 0; i < b0; i++ ) {
            for ( var j = 0; j < b1; j++ ) {
                for ( var k = 0; k < b2; k++ ) {
                    grid
                        .appendChild(
                            reify(
                                "transform",
                                {
                                    "translation": [ i, j, k ].join( ' ' ),
                                    "scale": scaleUnit.join( ' ' )
                                },
                                [
                                    createSphereShape( `grid-point-${ [ i, j, k ].join( '.' ) }`, gridPointRadius, 'black', 0.10, `(${ [ i, j, k ].join( ',' ) })` ),
                                    createTextShape( `(${ [ i, j, k ].join( ',' ) })`, gridCoordStyle )
                                ]
                            )
                        );
                }
            }
        }
    }

    // GRID
    root
        .appendChild(
            reify(
                "group",
                {
                    "class": "grid-coords",
                    "render": toggles.includes( 'grid' )
                },
                [],
                [ appendGridChildren ]
            )
        );


    // PLANE
    var currentDirection = [0,1,0];
    currentDirection[ 1 ] = 1;
    var planeColor = "black";
    var planeTransparency = 0.95;

    var planeItem = createPlaneItemWithNormal( {
            centre: to3D( centre ),
            planeNormal: to3D( cycles.getIdentityPlane().normal ),
            scaleUnit: [1,1,1],
            currentDirection: [0,1,0],
            origin: [0,0,0],
            size: [ bases[0], 0, bases[bases.length-1] ],
            planeColor: planeColor,
            planeTransparency: planeTransparency
        } );

    planeItem.setAttribute( "render", toggles.includes( 'plane' ) );
    root.appendChild( planeItem );



    // CENTRE LINES
    try {
        const cyclesCentres = cycles.getCentres();
        const centrePoints = cyclesCentres
            .centrePoints
            .map( x => reify(
                            "transform",
                            {
                                "translation": to3D( x.point ).join( ' ' ),
                                "scale": scaleUnit.join( ' ' )
                            },
                            [ createSphereShape( null, 0.1, "yellow", 0, `centre-${ x.point }` ) ]
                        ) );

        const centreLines = cyclesCentres
            .centreLines
            .map( centreLine => createLineSetFromCoords( extendLine( to3D( centreLine.points[0] ), to3D( centreLine.points[1] ), 0.5 ), "gray" ) );

        const centreItems = reify( "group", { "class": "orbit-centre", "render": toggles.includes( 'centres' ) }, centrePoints.concat( centreLines ));

        root.appendChild( centreItems );

    } catch ( e ) {
        console.log( e );
    }

    // FIXED POINTS
    cycles
        .getIdentities()
        .forEach(
            cycle => cycle
                .map( point => {
                    return {
                            "id": "point-" + to3D( point.coord ).join( '.' ),
                            "translation": to3D( point.coord ).join( ' ' ),
                            "scale": scaleUnit.join( ' ' )
                        };
                    }
                )
                .forEach( identityPoint => root
                    .appendChild(
                        reify(
                            "transform",
                            identityPoint,
                            [ createSphereShape( identityPoint.id, 0.1, "red", fixedPointTransparency, '' ) ] )
                        )
                    )
                );


    // ORBITS
    cycles
        .getOrbits()
        .forEach( ( orbit, orbitIndex ) =>  {

            const orbitColor = colorBasePlane.colorForIndex( orbitIndex );

            const stats = orbit.getStats();

            root
                .appendChild(
                    reify(
                        "group",
                        { "class": "orbit-line", "id": ("orbit." + orbitIndex ) },
                        [
                            createCylinderSet( orbit, orbitColor, { "scaleUnit": scaleUnit } ),
                            reify(
                                "transform",
                                {
                                    "translation": to3D( stats.centre ).join( ' ' ),
                                    "scale": scaleUnit.join( ' ' )
                                },
                                [ createSphereShape( "orbit." + orbitIndex + ".0" , 0.09, "gray" ) ]
                            ),
                            ...orbit.map( ( point, pointIndex ) => reify(
                                "transform",
                                {
                                    "translation": to3D( point.coord ).join( ' ' ),
                                    "scale": scaleUnit.join( ' ' ),
                                    "class": "orbitCoord",
                                    "id": `orbitCoord.${ point.id }.${ pointIndex }`
                                },
                                [ createSphereShape( "orbit." + orbitIndex + "." + pointIndex, 0.07, orbitColor, 0, '' ) ] ) )
                        ],
                        //[ ( e ) => e.setAttribute( "render", toggles.includes( 'lines' ) ) ]
                    )
                );
        } );


    return reify( "collision", { "enabled": false }, [ root ] );
}
