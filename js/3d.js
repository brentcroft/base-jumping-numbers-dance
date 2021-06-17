
function newMaterial( data = {} ) {
    return reifyData( "material", data );
}


function newAppearance( data = {} ) {
    return reifyData( "appearance", data );
}

function newShape( data = {} ) {
    return reifyData( "shape", data );
}


function createShape( emissiveColor, lineType, attr = {} ) {

    var s = document.createElement('Shape');

    Object.entries( attr ).forEach( x => {
        const [ key, value ] = x;
        s.setAttribute( key, value );
    });

    var app = document.createElement('Appearance');
    var mat = document.createElement('Material');
    if (emissiveColor){
        mat.setAttribute( "emissiveColor", emissiveColor );
    }
    app.appendChild(mat);
    if (lineType) {
        app.appendChild(  reify( "LineProperties", { "linetype": `${ lineType }` } ) );
    }
    s.appendChild(app);
    return s;
}

function createTextShape( text = "", fontStyle ){
    var s = createShape();
    var b = document.createElement( "Text" );
    s.appendChild(b);

    b.setAttribute( "string", text );

    if ( fontStyle ) {
        var f = document.createElement( "fontStyle" );
        b.appendChild( f );
        for ( k in fontStyle ) {
            f.setAttribute( k, fontStyle[k] );
        }
    }

    return s;
}

function createPlaneShape( size = "0.1 0 0.1", emissiveColor = "yellow", transparency = 0.95 ) {
    return reify(
        "shape",
        {},
        [
            reify( "appearance", {}, [ reify( "material", { "emissiveColor": emissiveColor, "transparency": transparency } ) ] ),
            reify( "box", { "size": size } )
        ]
    );
}

function createPlaneItem(
        centre = [0,0,0], unitNormal = [0,1,0],
        scaleUnit = [1,1,1],
        rotationAxis = [0,1,0], rotationAngle = 0,
        size = [1,0,1],
        planeColor = "gray", planeTransparency = 0.95 ) {
    return reify(
       "transform",
       {
           "translation": centre.join( ' ' ),
           "scale": scaleUnit.join( ' ' ),
           "class": "orbit-plane"
       },
       [
           reify(
               "transform", { "rotation": rotationAxis.join( ' ' ) + ' ' + rotationAngle },
               [ createPlaneShape( size.join( ' ' ), planeColor, planeTransparency ) ]
           ),
           reify(
               "group",
               {},
               [ createLineSetFromPoints( [ [0,0,0], unitNormal ], planeColor, "3" ) ]
           ),
           reify(
               "transform",
               { "translation": unitNormal.join( ' ' ) },
               [ createSphereShape( 0.1, "black" ) ]
           )
       ]
   );
}


function createSphereShape( radius = "0.1", emissiveColor = "blue", transparency = 0) {
    return reify(
        "shape",
        {},
        [
            reify( "appearance", {}, [ reify( "material", { "emissiveColor": emissiveColor, "transparency": transparency } ) ] ),
            reify( "sphere", { "radius": radius } )
        ]
    );
}

function createPolyLineShape( lineSegments, emissiveColor = "red" ){
    var s = createShape( emissiveColor );
    var polyline = document.createElement('Polyline2d');
    s.appendChild(polyline);

    polyline.setAttribute("lineSegments", lineSegments );

    return s;
}

function createLineSet( coords, emissiveColor, attr = {} ){

    var shape = createShape( emissiveColor, "1", attr );
    var lineSet = document.createElement( "LineSet" );
    shape.appendChild( lineSet );

    lineSet.setAttribute( 'vertexCount', `${ coords.length + 1 }` );

    var point = "";
    for ( var j = 0; j < coords.length; j++ ) {
        point += `${ coords[j].coord.join( ' ' ) } `;
    }
    point += `${ coords[0].coord.join( ' ' ) } -1`;

    var coordinate = document.createElement( 'Coordinate' );
    coordinate.setAttribute( 'point', `${ point }` );
    lineSet.append( coordinate );

    return shape;
}


function createDialLineSet( coords, emissiveColor, attr = {} ){

    var shape = createShape( emissiveColor, "1", attr );
    var lineSet = document.createElement( "lineset" );
    shape.appendChild( lineSet );

    const theta = 2 * Math.PI / coords.length;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    const rotator = [
        [ 1, 0, 0 ],
        [ 0, cosTheta, -1 * sinTheta],
        [ 0, sinTheta, cosTheta ]
    ];

    function rotate( rotator, point ) {
        return [
            dotProduct( rotator[0], point ),
            dotProduct( rotator[1], point ),
            dotProduct( rotator[2], point )
        ];
    }

    var currentPoint = [ 0, 2, 2 ];
    var point = "";
    for ( var j = 0; j < coords.length; j++ ) {
        point += `${ currentPoint.join( ' ' ) } `;
        currentPoint = rotate( rotator, currentPoint );
    }
    point += `${ currentPoint.join( ' ' ) } -1`;

    lineSet.setAttribute( 'vertexCount', `${ coords.length + 1 }` );

    var coordinate = document.createElement( 'coordinate' );
    coordinate.setAttribute( 'point', `${ point }` );
    lineSet.append( coordinate );

    return shape;
}



function createLineSetFromPoints( points, emissiveColor, lineType ) {

    if ( points.length == 0 ) {
        return null;
    }

    var shape = createShape( emissiveColor, lineType );
    var lineSet = document.createElement( "lineset" );
    shape.appendChild( lineSet );

    lineSet.setAttribute( 'vertexCount', `${ points.length }` );

    var pointText = "";
    for ( var j = 0; j < points.length; j++ ) {
        pointText += `${ points[j].join( ' ' ) } `;
    }

    var coordinate = document.createElement( 'coordinate' );
    coordinate.setAttribute( 'point', `${ pointText }` );
    lineSet.append( coordinate );

    return shape;
}


function createCentreLine( p1, p2, pad = 0 ) {
    return createLineSetFromPoints( extendLine( p1, p2, pad ), "gray", 3 );
}






function insertX3DomFrame( containerId, orbitSystem, framePage ) {
    const viewerContainerId = containerId + "_plot";
    const viewerContainer = document.getElementById( viewerContainerId );
    if ( viewerContainer ) {
        var frameId = containerId + "_plot_frame";
        var iframeHtml = `<iframe id="${ frameId }" class="plot_frame" src="${ framePage }"></iframe>`;
        viewerContainer.innerHTML = iframeHtml;
    }
}



function openX3DomFrame( containerId, orbitSystem, framePage = 'orbitsViewer.html' ) {
    const windowFeatures = "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes";

    window.open( `${ framePage }?id=${ orbitSystem.key }`, containerId, windowFeatures );
}
