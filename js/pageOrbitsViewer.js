
function getParam() {

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const basesParam = urlParams.get('bases');

    const toggles = { ...toggleKeys };

    const toggleParam = urlParams.get('toggles');
    if ( toggleParam ) {
        Object
            .keys( toggles )
            .forEach( k => toggles[k] = 0 );
        toggleParam
            .split(',')
            .forEach( x => toggles[x] = 1 );
    }

    return {
        id: urlParams.get('id'),
        bases: basesParam.split(",").map(x=> Number(x)),
        orbits: urlParams.get('orbits'),
        toggles: toggles
    };
}

function clearSelected() {
    document
        .querySelectorAll( ".selected" )
        .forEach( item => item.classList.remove('selected') );
}

function toggleLines( containerId ) {
    toggleBySelector( containerId, ".orbit-line"  );
}
function toggleLocus( containerId ) {
    toggleBySelector( containerId, ".orbit-system-locus"  );
}
function toggleGrid( containerId ) {
    toggleBySelector( containerId, ".grid-coords" );
}
function toggleCentres( containerId ) {
    toggleBySelector( containerId, ".orbit-centre" );
}
function togglePlane( containerId ) {
    toggleBySelector( containerId, ".orbit-plane" );
}


function toggleBySelector( containerId, cssSelector, translator = (x) => x ) {
    const selectedElements = document
        .getElementById( containerId )
        .querySelectorAll( cssSelector );

    selectedElements.forEach( selectedElement => {
            const element = ( translator )
                ? translator( selectedElement )
                : selectedElement;
            const render = ("false" == element.getAttribute( "render" ) );
            element.setAttribute( "render", render );
        });
}


function showLocus( containerId, currentAction, locusPoints, multi ) {
    const locusGroup = document
        .getElementById( containerId )
        .querySelector( "group.orbit-system-locus" );

    while ( locusGroup.firstChild ) {
        locusGroup.removeChild( locusGroup.lastChild );
    }

    locusGroup.appendChild( createLineSetFromPoints( currentAction.getLocusPoints( locusPoints ) ) );
}





function showOrbit( containerId, currentAction, senderId, multi ) {
    const [ tableId, ...orbitIds ] = senderId.split( "." );
    const orbits = document
        .getElementById( containerId )
        .querySelectorAll( ".orbit-line" );

    orbits.forEach( orbitElement => {
            const [ cId, oId ] = orbitElement.id.split( "." );
            if ( !orbitIds.includes( oId ) ) {
                if ( multi && orbitElement.classList.contains( "selected" ) ) {
                } else {
                    orbitElement.setAttribute( "render", false );
                    orbitElement.classList.remove("selected");
                }
            } else if ( orbitElement.classList.contains( "selected" ) ) {
                orbitElement.setAttribute( "render", false );
                orbitElement.classList.remove("selected");
            } else {
                orbitElement.setAttribute( "render", true );
                orbitElement.classList.add("selected");
            }
        });
}

function showAllOrbits( containerId, currentAction ) {
    const orbits = document
        .getElementById( containerId )
        .querySelectorAll( ".orbit-line" )
        .forEach( orbitElement => {
            orbitElement.setAttribute( "render", true );
            orbitElement.classList.remove("selected");
        });
}


function getBasePlaneItems( currentAction, toggles ) {

    const orbits = currentAction.orbits;
    const fixedPointTransparency = 0.2;
    const colorBasePlane = window.parent.window.getBasePlane( "COLOR_ORBITS" );

    const [ p1, p2 ] = currentAction.box.diagonal.map( p => to3D(p) );
    const maxBase = currentAction.box.bases.reduce( (a,c) => c > a ? c : a, 0 );

    const scaleUnit = toggles.scale3d ? scale( unitDisplacement( p1, p2 ), 2 ) : [ .8, .8, .8 ];

    // move origin to system centre and scale by scaleUnit
    const root = reify(
        "transform", {
            "translation": scale( to3D( currentAction.box.centre ), -1 ).join( ' ' ),
            "scale": scaleUnit.map( x => x==0 ? 1 : 1/x ).join( ' ' )
        } );

    function appendGridChildren( grid ) {
        const [ b0, b1, b2 ] = currentAction.box.bases;
        const gridCoordStyle = { "family": "'San Serif'", "size": 0.05 };
        const gridPointRadius = 0.05;

        for ( var i = 0; i < b0; i++ ) {
            for ( var j = 0; j < b1; j++ ) {
                for ( var k = 0; k < b2; k++ ) {
                    grid
                        .appendChild(
                            reify(
                                "Transform",
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
                "Collision",
                {
                    "class": "grid-coords",
                    "enabled": false,
                    "render": toggles.grid == 1
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
            centre: to3D( currentAction.box.centre ),
            planeNormal: to3D( currentAction.identityPlaneNormal ),
            scaleUnit: [1,1,1],
            currentDirection: [0,1,0],
            origin: [0,0,0],
            size: [ currentAction.box.bases[0], 0, currentAction.box.bases[currentAction.box.bases.length-1] ],
            planeColor: planeColor,
            planeTransparency: planeTransparency
        } );

    planeItem.setAttribute( "render", toggles.plane == 1 );
    root.appendChild( planeItem );



    // CENTRE LINES
    try {
        const centrePoints = currentAction
            .centrePoints
            .map( x => reify(
                            "transform",
                            {
                                "translation": to3D( x.point ).join( ' ' ),
                                "scale": scaleUnit.join( ' ' )
                            },
                            [ createSphereShape( null, 0.1, "yellow", 0, `centre-${ x.point }` ) ]
                        ) );

        const centreLines = currentAction
            .centreLines
            .map( centreLine => createLineSetFromCoords( extendLine( to3D( centreLine.points[0] ), to3D( centreLine.points[1] ), maxBase / 2 ), "gray" ) );

        const centreItems = reify(
            "group",
            { "class": "orbit-centre", "render": toggles.centres == 1 },
            centrePoints.concat( centreLines )
        );

        root.appendChild( centreItems );

    } catch ( e ) {
        console.log( e );
    }

    // FIXED POINTS
    currentAction
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
                    [ ( e ) => e.setAttribute( "render", toggles.lines == 1 ) ]
                )
            );
    }

    return reify( "collision", { "enabled": false }, [ root ] );
}



function setSelectedPoints( containerId, selectedPoints, currentAction ) {
    const existingSelectedPoints = [ ...document
        .getElementById( containerId )
        .querySelectorAll( "sphere.selected" ) ];

    const standardRadius = 0.3;
    const selectedRadius = 0.5;

    existingSelectedPoints
        .forEach( sphereElement => {
            sphereElement.setAttribute( "radius", standardRadius );
            sphereElement.classList.remove("selected");
            //consoleLog( `de-selected point: ${ sphereElement.id }` );
        });

    selectedPoints
        .forEach( p => {
            const idSuffix = p.coord.join("-");
            const sphereElement = document.querySelector( `sphere#point-${ idSuffix }` );

            if ( sphereElement && sphereElement.tagName == "SPHERE" ) {
                sphereElement.setAttribute( "radius", selectedRadius );
                sphereElement.classList.add("selected")
                //consoleLog( `selected point: ${ JSON.stringify( p ) }` );
            } else {
                consoleLog( `selected point not found: ${ JSON.stringify( p ) }` );
            }
        } );

    const selectedPointsInfo = selectedPoints
        .map( ( point, i ) => ( i + 1 ) + ": " + JSON.stringify( point.coord ) + " " + point.id + " " + JSON.stringify( point.indexes[currentAction.key] ) )
        .join( "\n" );

    document
        .getElementById("selectedPointsInfo")
        .innerHTML = "<pre>" + selectedPointsInfo + "</pre>";
}


function getBasePlaneCycles( currentAction, toggles ) {

    const indexId = currentAction.key;
    const orbits = currentAction.orbits;
    const fixedPointTransparency = 0.1;
    const colorBasePlane = window.parent.window.getBasePlane( "COLOR_ORBITS" );
    const indexCentre = currentAction.box.indexCentre;

    const zOff = 1;
    const scaleUnit = scale( [ 1, 1, 1 ], 15 / currentAction.box.volume );

    const root = reify( "transform", { "translation": `${ -1 * currentAction.box.volume / 2 } 0 0` } );

    const gid = ( point ) => point.at( indexId ).id;
    const gidJump = ( point ) => point.at( indexId ).jump;

    // IDENTITIES GRID
    const attr = { "linetype": "0" };

    root
        .appendChild(
            reify(
                "collision",
                {
                    "class": "grid-coords",
                    "enabled": false,
                    "render": toggles.grid == 1
                },
                [
                    ...currentAction
                        .identities
                        .map( identity => reify(
                                "transform",
                                {
                                    "translation": `${ gid( identity.points[0] ) } 0 ${ zOff * -1 }`
                                },
                                [
                                    createLineSetFromPoints( [ new Point( -1, [ 0, 0, 0 ] ), new Point( -1, [ 0, 0, zOff * ( orbits.length ) ] ) ], "black", attr )
                                ]
                            )
                        ),

                    createLineSetFromPoints(
                                [ new Point( -1, [ 0, 0, zOff * ( -1 ) ] ), new Point( -1, [ currentAction.box.volume - 1, 0, zOff * ( -1 ) ] ) ],
                                "black",
                                attr
                            ),

                    ...currentAction
                        .orbits
                        .map( ( orbit, i ) => createLineSetFromPoints(
                                [ new Point( -1, [ 0, 0, zOff * ( i ) ] ), new Point( -1, [ currentAction.box.volume - 1, 0, zOff * ( i ) ] ) ],
                                colorBasePlane.colorForIndex( orbit.index ),
                                attr
                            )
                        )
                ]
            )
        );

    // PLANE
    var currentDirection = [0,1,0];
    var planeColor = "black";
    var planeTransparency = 0.6;

    var planeItem = createPlaneItem(
            [ indexCentre, 0, zOff * (orbits.length - 2) / 2 ],
            [ 1, 0, 0 ],
            //scale( [ 0.001, -1 * zOff, 1 + orbits.length ], 1 ),
            [ 0, 1, 0 ],
            0,
            [ 1, 1, 1 ],
            planeColor,
            planeTransparency);

    root
        .appendChild( planeItem );


    // ORBITS
    currentAction
        .identities
        .map( identityOrbit => identityOrbit.points[0] )
        .map( identityPoint => {
            return {
                "id": gid( identityPoint ),
                "report": identityPoint.report( currentAction.id ),
                "json": identityPoint.getJson(),
                "coord": identityPoint.coord,
                "jump": gidJump( identityPoint )
             };
        })
        .map( identity => reify(
                "transform",
                {
                    "translation": `${ identity.id } 0 ${ -1 * zOff }`,
                    "id": `identity.e.${ identity.id }`
                },
                [
                    createSphereShape( `point-${ identity.coord.join("-") }`, 0.17, "red", 0.3, JSON.stringify( identity.json ) ),
                    reify(
                        "transform",
                        {
                            "rotation": `0 1 0 ${ PI / 2 }`
                        },
                        [
                            createTorusShape( {
                                outerRadius: ( identity.jump / 2),
                                size: 0.05,
                                emissiveColor: "yellow",
                                transparency: 0,
                                angle: 2 * PI,
                                cssClass: "identity-line",
                                toggles: toggles
                             } )
                        ] )
                ]
            )
        )
        .forEach( x => root.appendChild(x) );

    for ( var i = 0; i < orbits.length; i++ ) {
        const orbit = orbits[i];
        const color = colorBasePlane.colorForIndex( orbit.index );
        if (orbit.points.length > 1 ) {
            root
                .appendChild(
                    reify(
                        "transform",
                        {
                            "translation": `0 0 ${ zOff * i }`
                        },
                        [
                            ...orbit
                                .points
                                .map( ( entry, i ) => {
                                        const halfJump = gidJump( entry ) / 2;
                                        return reify(
                                            "transform", { "translation": `${ gid( entry ) } 0 0` },
                                            [
                                                createSphereShape( `point-${ entry.coord.join("-") }`, 0.3, color, 0, JSON.stringify( entry.getJson() ) ),
                                                reify(
                                                    "transform", {
                                                        "translation": `${ halfJump } 0 0`,
                                                        "class": "orbit-line",
                                                        "id": ("orbit." + orbit.index )
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
                        ]
                    )
                );
        }
    }

    return reify(
        "collision",
        { "enabled": false },
        [ reify( "transform", { "scale": `${ scaleUnit.join( ' ' ) }` }, [ root ] ) ]
    );
}








function plotData( duration ) {
    const param = getParam();
    const currentAction = window.parent.window.getBasePlane( param.id );
}


function plotBasePlane( currentAction, param ) {

    var x3domContainerId =  'testContainer001_plot';
    const sceneRootId = `${ x3domContainerId }_scene_root`;
    const sceneRoot = document.getElementById( sceneRootId );

    var osi = (param.toggles.chart3d == 1 )
        ? getBasePlaneItems( currentAction, param.toggles )
        : getBasePlaneCycles( currentAction, param.toggles );

    sceneRoot.appendChild( osi );

    var x3dRuntime = document.getElementById( x3domContainerId );
    //x3dRuntime.runtime.showAll( "negZ");
    x3dRuntime.runtime.resetView();

    //consoleLog( "Created X3DOM container: " + x3domContainerId );
}



function distributeMessage( message = {} ) {
    window.postMessage( message, "*" );
    window.parent.window.postMessage( message, "*" );
}

function distributeMessages( messages = [] ) {
    messages.forEach( message => distributeMessage( message) );
}

var screenshotCount = 0;

function screenshot() {

    const filename = `snap_${ screenshotCount++ }`;
    const x3dId = 'testContainer001_plot';
    const x3dElement = document.getElementById( x3dId );
    const imgUrl = x3dElement.runtime.getScreenshot();

    const link = document.createElement( 'a' );
    link.href = imgUrl;
    link.download = filename + ".png";
    link.innerHTML = filename;

    const snaps = document.getElementById("snaps");
    snaps.append( " " );
    snaps.append( link );
}


function initPage() {

    const param = getParam();
    currentAction = window.parent.window.getBasePlane( param.id );

    plotBasePlane( currentAction, param );

    // set events
    const spheres = [ ...document
        .querySelectorAll( "sphere" ) ];
    const shapes = spheres
        .map( s => s.parentNode );
    const tooltipped = shapes
        .filter( s => s.getAttribute( "tooltip" ) );

    tooltipped
        .forEach( s => {
                s.onclick = function( event ) {
                    const tooltipData = s.getAttribute( "tooltip" );
                    const point = JSON.parse( tooltipData );

                    consoleLog( `selected point: [${ point.coord }] ${ point.id }; index-${currentAction.id}: ${ JSON.stringify( point.indexes[currentAction.key] ) }` );

                    distributeMessage( {
                        basis: "point",
                        json: point
                    } );
                };
        });


    window.addEventListener( "message", ( event ) => {
        if ( event.data ) {
            var data = event.data;

            //cconsoleLog( `data: ${ JSON.stringify( data ) }` );

            if ( data.basis ) {

                if ( "selected-points" == data.basis ) {
                    setSelectedPoints( "testContainer001", data.points, currentAction );
                }

            } else if ( data.actionKey ) {
                const currentAction = window.parent.window.getBasePlane( data.actionKey );
                if ( data.sender ) {
                    showOrbit( "testContainer001", currentAction, data.sender, data.multi );
                } else if ( data.locus ) {
                    showLocus( "testContainer001", currentAction, data.locus, data.multi );
                } else {
                    showAllOrbits( "testContainer001", currentAction );
                }
            } else if ( data.toggleGrid ) {
                toggleGrid( "testContainer001" );
            } else if ( data.toggleCentres ) {
                toggleCentres( "testContainer001" );
            } else if ( data.togglePlane ) {
                togglePlane( "testContainer001" );
            } else if ( data.toggleLines ) {
                toggleLines( "testContainer001" );
            } else if ( data.toggleLocus ) {
                toggleLocus( "testContainer001" );
            } else if ( data.clearSelected ) {
                clearSelected();
            }
        }
    });
}
