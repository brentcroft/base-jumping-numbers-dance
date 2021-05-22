

function extendLine( p1, p2, pad = 1 ) {

     const distance = Math.sqrt( p1
        .map( ( x, i ) => Math.abs( x - p2[i] ) )
        .reduce( ( total, value ) => { return total + value**2; }) );

    if ( distance < 0.001 ) {
        throw `The points [${ p1.join(',')}] and [${ p2.join(',')}] have no distance between them.`;
    }

    const scale = ( distance + ( 2 * pad ) ) / distance;

    const [ x1, y1, z1 ] = p1;
    const [ x2, y2, z2 ] = p2;
    const p0 = [
        x1 + ( scale * (x1 - x2) ),
        y1 + ( scale * (y1 - y2) ),
        z1 + ( scale * (z1 - z2) )
    ];
    const p3 = [
        x2 + ( scale * (x2 - x1) ),
        y2 + ( scale * (y2 - y1) ),
        z2 + ( scale * (z2 - z1) )
    ];

    return [ p0, p3 ];
}

function createShape( emissiveColor, lineType ){
    var s = document.createElement('shape');
    var app = document.createElement('appearance');
    var mat = document.createElement('material');
    if (emissiveColor){
        mat.setAttribute( "emissiveColor", emissiveColor );
    }
    app.appendChild(mat);
    if (lineType){
        var lp = document.createElement('LineProperties');
        lp.setAttribute( "linetype", `${ lineType }` );
        lp.setAttribute( "containerField", 'lineProperties' );
        app.appendChild(lp);
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

function createFlatBoxShape( size = "0.1 0 0.1" ){
    var s = createShape();
    var b = document.createElement( "Box" );
    s.appendChild(b);

    b.setAttribute( "size", size );

    return s;
}


function createSphereShape( radius = "0.1", emissiveColor = "blue" ){
    var s = createShape( emissiveColor );
    var b = document.createElement( "Sphere" );
    s.appendChild(b);

    b.setAttribute( "radius", radius );

    return s;
}


function createPolyLineShape( lineSegments, emissiveColor = "red" ){
    var s = createShape( emissiveColor );
    var polyline = document.createElement('Polyline2d');
    s.appendChild(polyline);

    polyline.setAttribute("lineSegments", lineSegments );

    return s;
}

function createLineSet( coords, emissiveColor ){

    var shape = createShape( emissiveColor, 1 );
    shape.classList.add( "orbit" );

    var lineSet = document.createElement( "LineSet" );
    shape.appendChild( lineSet );

    lineSet.setAttribute( 'vertexCount', `${ coords.length + 1 }` );

    var point = "";
    for ( var j = 0; j < coords.length; j++ ) {
        point += `${ coords[j].coord.join( ' ' ) } `;
    }
    point += `${ coords[0].coord.join( ' ' ) }`;

    var coordinate = document.createElement( 'Coordinate' );
    coordinate.setAttribute( 'point', `${ point }` );
    lineSet.append( coordinate );

    return shape;
}


function createLineSetFromPoints( points, emissiveColor, lineType ) {

    var shape = createShape( emissiveColor, lineType );
    shape.classList.add( "orbitCentreLine" );

    var lineSet = document.createElement( "LineSet" );
    shape.appendChild( lineSet );

    lineSet.setAttribute( 'vertexCount', `${ points.length }` );

    var point = "";
    for ( var j = 0; j < points.length; j++ ) {
        point += `${ points[j].join( ' ' ) } `;
    }

    var coordinate = document.createElement( 'Coordinate' );
    coordinate.setAttribute( 'point', `${ point }` );
    lineSet.append( coordinate );

    return shape;
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



function buildPlot( chainSystems, maxI, maxJ ) {
    var items = [];

    for (var i = 0; i <= maxI; i++) {
        for (var j = 0; j <= maxJ; j++) {

            var f = 0;
            var h = 0;
            var n = 0;

            if ( hasChainSystem( i, j ) ){
                var cs = chainSystems[ i ][ j ];

                f = cs.fundamental / 10;
                h = ( Object.keys( cs.harmonics ).length - 2) / 1;
                n = ( cs.chains.length - 2 ) / 10;
            }


            var t = document.createElement('Transform');
            t.setAttribute( "translation", i + " " + 0 + " " + j );

            t.appendChild( createFlatBoxShape() );

            if ( h > 0 ) {
                t.appendChild( createPolyLineShape( `0 ${ h }, 0 0` ) );

                var ty = document.createElement('Transform');
                ty.setAttribute( "translation",  `0 ${ h } 0` );
                ty.appendChild( createFlatBoxShape() );
                t.appendChild(ty);

                var label = createTextShape(
                    `(${ cs.base },${ cs.mult }) ${ h }`,
                     {
                        "family": "'Arial' 'San Serif'",
                        "size": 0.2
                     });
                ty.appendChild(label);
            }

            items.push( t );
        }
    }
    return items;
}

var colors = [
    "black", "red", "teagreen", "blue", "vanilla",
    "pink", "yellow", "lime", "magenta", "cobaltblue",
    "brown", "lightblue", "maroon", "green", "olive",
    "bluejay", "lightseagreen", "cyan", "sand",
    "orange", "venomgreen", "goldenrod", "saffron", "rust",
    "coral", "mahogany", "puce", "darkblue", "grape", "purple"
];

function colorForIndex( i ){
    return colors[ i % colors.length ];
}


function getChainSystemItems( chainSystem, harmonics ) {

    var chains = harmonics ? harmonics : chainSystem.chains;
    var items = [];

    var b = chainSystem.base;
    var m = chainSystem.mult;

    var fudge = chainSystem.hypo;

    for ( var i = 0; i < chains.length; i++ ) {

        const orbit = chains[i];

        var coords = orbit.coords;

        if (coords.length > 1 ) {

            var t = document.createElement('Transform');
            t.setAttribute( "translation", `${ -1 * orbit.centre[0] } ${ -1 * orbit.centre[1] } ${ fudge * orbit.biasFactor }` );

            var lineSegments = "";
            for ( var j = 0; j < coords.length; j++ ) {
                lineSegments += `${ coords[j].coord[0] } ${ coords[j].coord[1] }, `;
            }

            lineSegments += `${ coords[0].coord[0] } ${ coords[0].coord[1] }`;

            t.appendChild( createPolyLineShape( lineSegments, colorForIndex( i ) ) );

        } else {
            var t = document.createElement('Transform');
            t.setAttribute( "translation", `0 0 ${ fudge * orbit.biasFactor }` );

            t.appendChild( createSphereShape( 0.1, "blue" ) );
        }

        items.push( t );
    }

    return items;
}

