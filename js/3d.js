// Create a 3d scatter plot within d3 selection parent.


function createShape( emissiveColor ){
    var s = document.createElement('shape');
    var app = document.createElement('appearance');
    var mat = document.createElement('material');
    if (emissiveColor){
        mat.setAttribute( "emissiveColor", emissiveColor );
    }
    app.appendChild(mat);
    s.appendChild(app);
    return s;
}

function createTextShape( text = "", fontStyle ){
    var s = createShape();
    var b = document.createElement( "text" );
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
    var b = document.createElement( "box" );
    s.appendChild(b);

    b.setAttribute( "size", size );

    return s;
}


function createSphereShape( radius = "0.1", emissiveColor = "blue" ){
    var s = createShape( emissiveColor );
    var b = document.createElement( "sphere" );
    s.appendChild(b);

    b.setAttribute( "radius", radius );

    return s;
}


function createPolyLineShape( lineSegments, emissiveColor = "red" ){
    var s = createShape( emissiveColor );
    var polyline = document.createElement('polyline2d');
    s.appendChild(polyline);

    polyline.setAttribute("lineSegments", lineSegments );

    return s;
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


            var t = document.createElement('transform');
            t.setAttribute( "translation", i + " " + 0 + " " + j );

            t.appendChild( createFlatBoxShape() );

            if ( h > 0 ) {
                t.appendChild( createPolyLineShape( `0 ${ h }, 0 0` ) );

                var ty = document.createElement('transform');
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


function getChainSystemItems( chainSystem, harmonics ) {

    var chains = harmonics ? harmonics : chainSystem.chains;
    var items = [];

    var b = chainSystem.base;
    var m = chainSystem.mult;

    for ( var i = 0; i < chains.length; i++ ) {

        var grid = document.createElement('transform');
        grid.setAttribute( "translation", `0 0 ${ i }` );
        grid.appendChild( createPolyLineShape( `0 0, 0 ${b-1}, ${m-1} ${b-1}, ${m-1} 0, 0 0`, "gray" ) );

        items.push( grid );

        var coords = chains[i].coords;

        if (coords.length > 1 ) {

            var t = document.createElement('transform');
            t.setAttribute( "translation", `0 0 ${ i }` );

            var lineSegments = "";
            for ( var j = 0; j < coords.length; j++ ) {
                lineSegments += `${ coords[j].coord[0] } ${ coords[j].coord[1] }, `;
            }

            lineSegments += `${ coords[0].coord[0] } ${ coords[0].coord[1] }`;

            t.appendChild( createPolyLineShape( lineSegments ) );
        } else {
            var t = document.createElement('transform');
            t.setAttribute( "translation", `${ coords[0].coord[0] } ${ coords[0].coord[1] } ${ i }` );
            //t.appendChild( createFlatBoxShape( size = "0.1 0.1 0.1" ) );
            t.appendChild( createSphereShape( 0.1, "blue" ) );
        }

        items.push( t );
    }

    return items;
}

