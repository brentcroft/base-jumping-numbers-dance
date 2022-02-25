function getCyclesDiagram( cycles, toggles = {} ) {

    const fixedPointTransparency = 0.1;
    const colorBasePlane = new ColorBasePlane();

    // assume all fixed points are present - and appending 1 for terminal
    const volume = cycles.reduce( ( a, cycle ) => a + cycle.length, 0 );
    const terminal = ( volume - 1 );
    const indexCentre = terminal / 2;

    const zOff = 1;
    const scaleUnit = scale( [ 1, 1, 1 ], 10 / volume );

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
                    ...identities
                        .map( cycle => reify( "transform", { "translation": `${ cycle[0] } 0 ${ zOff * -1 }` },
                                [ createLineSet( [ [ 0, 0, 0 ], [ 0, 0, zOff * ( orbits.length ) ] ], "black", attr ) ]
                            )
                        ),

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
                    "translation": `${ entry } 0 ${ -1 * zOff }`,
                    "id": `identity.e.${ entry }`
                },
                [ createSphereShape( `point-${ entry }`, 0.17, "red", 0.3 ) ]
            )
        )
        .forEach( child => root.appendChild( child ) );


    // ORBITS
    cycles
        .filter( cycle => cycle.length > 1 )
        .map( ( cycle, cycleIndex ) => reify( "transform", { "translation": `0 0 ${ zOff * cycleIndex }` },
                [
                    ...cycle
                        .map( ( entry, entryIndex ) => {
                                const nextEntry = cycle[ ( entryIndex + 1 ) % cycle.length ];
                                const jump = ( nextEntry - entry );
                                const halfJump = jump / 2;
                                const color = colorBasePlane.colorForIndex( cycleIndex + 1 );
                                return reify(
                                    "transform", { "translation": `${ entry } 0 0` },
                                    [
                                        createSphereShape( `point-${ entry }`, 0.3, color , 0 ),
                                        reify(
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
                                                        cssClass: "orbitation",
                                                        toggles: toggles
                                                     } )
                                            ] )
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

