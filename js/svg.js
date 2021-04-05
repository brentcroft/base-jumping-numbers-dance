


function setSvgViewBox( width, height, pad = 10 ) {
    var viewBox = [
        0 - pad,
        0 - pad,
        width + ( 3 * pad ),
        height + ( 3 * pad )
    ].join( " " );

    document
        .getElementById( 'svg' )
        .setAttribute( "viewBox", viewBox );
}



function buildSVGItem( elementType, attributes = {}, text = '' ) {
    const item = document.createElementNS( 'http://www.w3.org/2000/svg', elementType );
    Object
        .entries( attributes )
        .map( a => item.setAttribute( a[0], a[1] ) );
    if (text) {
        const textNode = document.createTextNode(text);
        item.appendChild(textNode);
    }
    return item;
}


function clearChainDrawings()
{
    var svg = document.getElementById( "svg" );
    var existingRiffle = document.getElementById( "chain-highlight" )

    while (svg.firstChild) {
        svg.removeChild(svg.lastChild);
    }

    if ( existingRiffle ) {
        svg.appendChild( existingRiffle );
    }
}



function getChainItem( index, chain, scales, color, strokeWidth = 1, fillRule ) {

    var coords = chain.coords;
    var coord = coords[0].coord;
    var item;

    if (coords.length == 1) {
        item = buildSVGItem(
                'circle',
                {
                    "cx": ( coord[1] * scales[1] ),
                    "cy": ( coord[0] * scales[0] ),
                    "r": 3,
                    "stroke": "black",
                    "stroke-width": strokeWidth,
                    "fill": color,
                    "id": "chain-" + index
                } );
    } else {
        var points = "";
        for ( var j = 0; j < coords.length; j++ ) {
            coord = coords[j].coord;
            points += ( coord[1] * scales[1] ) + "," + ( coord[0] * scales[0] ) + " ";
        }

        coord = coords[0].coord;
        points += (coord[1] * scales[1]) + "," + (coord[0] * scales[0]) + " ";

        item = buildSVGItem(
                'polyline',
                {
                    "points": points,
                    "stroke": color,
                    "stroke-width": strokeWidth,
                    "fill": ( fillRule ? color : "none" ),
                    "fill-rule": ( fillRule ? fillRule : "nonzero" ),
                    "id": "chain-" + index
                } );
    }
    return item;
}


function drawChains( chains, chainSystem ) {

    clearChainDrawings();

    var colorStep = ( 255 / chains.length ) * 0.5;


    var scales = getScales( chainSystem.mult, chainSystem.base );

    var autoDrawChains = document.getElementById( "autoDrawChains" );
    var svg = document.getElementById( "svg" );

    var locus = svg;

    if ( autoDrawChains.checked ) {

        for ( var i = 0; i < chains.length; i++ ) {

            locus
                .appendChild(
                    getChainItem( i, chains[ i ], scales, getColor( colorStep, i ) ) );
        }
    }
}

function removeGridChains( id ) {
    var svg_grid = document.getElementById( id );

    var nextItem = svg_grid.lastElementChild;
    while ( nextItem ) {
        var itemToRemove;
        if ( nextItem.classList.contains( "chain") ) {
            itemToRemove = nextItem;
        }
        nextItem = nextItem.previousElementSibling;
        if ( itemToRemove ) {
            try {
                svg_grid.removeChild( itemToRemove );
            } catch ( e ) {
                //console.log("Error: " + e);
            }
        }
    }
}

function drawGridChain( id, chain = [ [ 0, 0 ] ], chainSystem, color = "rgba( 255, 0, 0, 1 )" ) {

    const origin = chainSystem.origin;
    const scale = chainSystem.scale;

    var svg_grid = document.getElementById( id );

    if ( chain.length > 1 ) {
        var points = "";
        for ( var j = 0; j < chain.length; j++ ) {
                points += ( chain[j][1] * scale[1] + origin[1] ) + "," + ( chain[j][0] * scale[0] + origin[0] ) + " ";
        }
        points += ( chain[0][1] * scale[1] + origin[1] ) + "," + ( chain[0][0] * scale[0] + origin[0] );

        var gridLineItem = buildSVGItem(
                'polyline',
                {
                    "points": points,
                    "stroke": color,
                    "stroke-width": 1,
                    "fill": "none",
                    "fill-rule": "nonzero"
                } );

        gridLineItem.classList.add( "chain" );

        svg_grid.appendChild( gridLineItem );

    } else {
        var gridLineItem = buildSVGItem(
                        'circle',
                        {
                            "cx": chain[0][1] * scale[1] + origin[1],
                            "cy": chain[0][0] * scale[0] + origin[0],
                            "r": 3,
                            "stroke": "red",
                            "stroke-width": 1,
                            "fill": "yellow"
                        } );

        gridLineItem.classList.add( "chain" );

        svg_grid.appendChild( gridLineItem );
    }
}

function drawGrid( id, chainSystem ) {

    var svg_grid = document.getElementById( id );

    svg_grid.innerHTML = "";

    const b = chainSystem.base;
    const m = chainSystem.mult;
    const origin = chainSystem.origin;
    const scale = chainSystem.scale;


    for ( var j = 0; j < b; j++ ) {

        var points = "";
        for ( var i = 0; i < m; i++ ) {
            points += ( j * scale[1] + origin[1] ) + "," + ( i * scale[0] + origin[0] ) + " ";
        }

        var gridLineItem = buildSVGItem(
                'polyline',
                {
                    "points": points,
                    "stroke": "lightgray",
                    "stroke-width": 1,
                    "stroke-dasharray": "4 2",
                    "fill": "none",
                    "fill-rule": "nonzero"
                } );

        svg_grid.appendChild( gridLineItem );
    }


    for ( var i = 0; i < m; i++ ) {

        var points = "";
        for ( var j = 0; j < b; j++ ) {
            points += ( j * scale[1] + origin[1] ) + "," + ( i * scale[0] + origin[0] ) + " ";
        }

        var gridLineItem = buildSVGItem(
                'polyline',
                {
                    "points": points,
                    "stroke": "lightgray",
                    "stroke-width": 1,
                    "stroke-dasharray": "4 2",
                    "fill": "none",
                    "fill-rule": "nonzero"
                } );

        svg_grid.appendChild( gridLineItem );


        for ( var j = 0; j < b; j++ ) {

            var item = buildSVGItem(
                            'circle',
                            {
                                "cx": j * scale[1] + origin[1],
                                "cy": i * scale[0] + origin[0],
                                "r": 1,
                                "stroke": "black",
                                "stroke-width": 1,
                                "fill": "black"
                            } );

            svg_grid.appendChild( item );

            item = buildSVGItem(
                            'text',
                            {
                                "x": j * scale[1] + origin[1],
                                "y": i * scale[0] + origin[0] + 6,
                                "class": "small"
                            } );

            item.innerHTML = `(${i}, ${j})`;

            svg_grid.appendChild( item );
        }
    }
}