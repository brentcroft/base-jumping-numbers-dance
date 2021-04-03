


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
