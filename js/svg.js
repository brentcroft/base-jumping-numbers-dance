


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


//
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



function removeGridChains( id, cssClass = "chain" ) {

    const svg_grid = document.getElementById( id + "_grid" );

    if ( svg_grid ) {
        var nextItem = svg_grid.lastElementChild;
        while ( nextItem ) {
            var itemToRemove;
            if ( nextItem.classList.contains( cssClass ) ) {
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
}


function drawGridPath( id, path = [ [ 0, 0 ] ], chainSystem, color = "rgba( 255, 0, 0, 1 )", cssClass = "chain", joinEnds = false ) {

    const svg = chainSystem.svg[id];
    const origin = svg.origin;
    const scale = svg.scale;

    var svg_grid = document.getElementById( id + "_grid" );

    if ( path.length > 1 ) {
        var points = "";
        for ( var j = 0; j < path.length; j++ ) {
                points += ( path[j][1] * scale[1] + origin[1] ) + "," + ( path[j][0] * scale[0] + origin[0] ) + " ";
        }
        if ( joinEnds ) {
            points += ( path[0][1] * scale[1] + origin[1] ) + "," + ( path[0][0] * scale[0] + origin[0] );
        }

        var gridLineItem = buildSVGItem(
                'polyline',
                {
                    "points": points,
                    "stroke": color,
                    "stroke-width": 1,
                    "stroke-dasharray": "4 1",
                    "fill": "none",
                    "fill-rule": "nonzero"
                } );

        gridLineItem.classList.add( cssClass );

        svg_grid.appendChild( gridLineItem );

    } else {
        var gridLineItem = buildSVGItem(
                        'circle',
                        {
                            "cx": path[0][1] * scale[1] + origin[1],
                            "cy": path[0][0] * scale[0] + origin[0],
                            "r": 3,
                            "stroke": "black",
                            "stroke-width": 1,
                            "fill": "lightgray"
                        } );

        gridLineItem.classList.add( cssClass );

        svg_grid.appendChild( gridLineItem );
    }
}

function drawGridChain( id, chain = [ [ 0, 0 ] ], chainSystem, color = "rgba( 255, 0, 0, 1 )", cssClass = "chain" ) {

    const svg = chainSystem.svg[id];
    const origin = svg.origin;
    const scale = svg.scale;

    var svg_grid = document.getElementById( id + "_grid" );

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
                    "stroke-dasharray": "4 1",
                    "fill": "none",
                    "fill-rule": "nonzero"
                } );

        gridLineItem.classList.add( cssClass );

        svg_grid.appendChild( gridLineItem );

    } else {
        var gridLineItem = buildSVGItem(
                        'circle',
                        {
                            "cx": chain[0][1] * scale[1] + origin[1],
                            "cy": chain[0][0] * scale[0] + origin[0],
                            "r": 3,
                            "stroke": "black",
                            "stroke-width": 1,
                            "fill": "lightgray"
                        } );

        gridLineItem.classList.add( cssClass );

        svg_grid.appendChild( gridLineItem );
    }
}

function drawGridChainCentre( id, chain = [ [ 0, 0 ] ], chainSystem, color = "rgba( 255, 0, 0, 1 )", cssClass = "chain" ) {

    const svg = chainSystem.svg[id];
    const origin = svg.origin;
    const scale = svg.scale;

    var svg_grid = document.getElementById( id + "_grid" );

    var n = chain.length;
    var centrum = [ chain[0][0], chain[0][1] ];
    for ( var j = 1; j < n; j++ ) {
        centrum[0] += chain[j][0];
        centrum[1] += chain[j][1];
    }
    centrum[0] = centrum[0] / n;
    centrum[1] = centrum[1] / n;

    var gridLineItem = buildSVGItem(
                    'circle',
                    {
                        "cx": centrum[1] * scale[1] + origin[1],
                        "cy": centrum[0] * scale[0] + origin[0],
                        "r": 3,
                        "stroke": "red",
                        "stroke-width": 1,
                        "fill": "yellow"
                    } );

    gridLineItem.classList.add( cssClass );

    svg_grid.appendChild( gridLineItem );
}

function drawGridControls( id, chainSystem ){

    var gridId = id + "_grid";

    const svg = chainSystem.svg[id];

    var gridControlsId = gridId + "_controls";
    var gridControlsContainerId = gridId + "_controls_container";
    var svg_grid = document.getElementById( gridId );
    var svg_grid_controls_container = document.getElementById( gridControlsContainerId );

    if ( !svg_grid_controls_container ) {
        svg_grid_controls_container = document.createElement("div");
        svg_grid_controls_container.setAttribute( "id", gridControlsContainerId );
        svg_grid_controls_container.classList.add( "grid-controls-container" );
        svg_grid.parentNode.insertBefore( svg_grid_controls_container, svg_grid );
    }

    var redrawGridScript = `redrawGrid( '${ id }', getChainSystem( ${ chainSystem.base }, ${ chainSystem.mult } ) )`;
    var oversize = svg.oversize;

    gridHtml = "<i>grid-controls</i> ";
    gridHtml += `<input type="checkbox" onclick="showHide( '${ gridControlsId }' )"/>`;

    gridHtml += `<div id="${ gridControlsId }" class="grid-controls" style="display: none">: `;
    gridHtml += `aspect: <input class="controls" id="${ gridControlsId }_oversize_0" type="number" value="${oversize[0]}" step="0.1" min="0.1" max="10" onchange="${ redrawGridScript }"/>, `;
    gridHtml += `<input class="controls" id="${ gridControlsId }_oversize_1"  type="number" value="${oversize[0]}" step="0.1" min="0.1" max="10" onchange="${ redrawGridScript }"/> `;

    gridHtml += `| viewport: <input class="controls" id="${ gridControlsId }_width" type="number" value="${svg.width}" step="10" min="100" max="2000" onchange="${ redrawGridScript }"/>,`;
    gridHtml += `<input class="controls" id="${ gridControlsId }_height" type="number" value="${svg.height}" step="10" min="100" max="2000" onchange="${ redrawGridScript }"/> `;

    gridHtml += "</div>";

    svg_grid_controls_container.innerHTML = gridHtml;
}



function drawLegend( id, chainSystem, stroke = "lightgray", strokeWidth = 0.5, strokeDashArray = "2" ) {

    var containerId = document.getElementById( id );

    const svg = chainSystem.svg[id];
    const origin = svg.origin;
    const scale = svg.scale;
    const oversize = svg.oversize;

    var svg_grid = document.getElementById( id + "_grid" );

    const legend = buildSVGItem(
                    'text',
                    {
                        "x": chainSystem.base * scale[1] + origin[1],
                        "y": chainSystem.mult * scale[0] + origin[0] + 6,
                        "class": "small",
                        "alignment-baseline": "baseline"
                    } );

    svg_grid.appendChild( legend );
}


function drawGrid( id, chainSystem, stroke = "lightgray", strokeWidth = 0.5, strokeDashArray = "2" ) {

    var gridId = id + "_grid";

    const svg = chainSystem.svg[id];
    const origin = svg.origin;
    const scale = svg.scale;
    const oversize = svg.oversize;

    var svg_grid = document.getElementById( gridId );

    svg_grid.innerHTML = "";

    const b = chainSystem.base * oversize[0];
    const m = chainSystem.mult * oversize[1];

    for ( var j = 0; j < b; j++ ) {

        var points = "";
        for ( var i = 0; i < m; i++ ) {
            points += ( j * scale[1] + origin[1] ) + "," + ( i * scale[0] + origin[0] ) + " ";
        }

        var gridLineItem = buildSVGItem(
                'polyline',
                {
                    "points": points,
                    "stroke": stroke,
                    "stroke-width": strokeWidth,
                    "stroke-dasharray": strokeDashArray,
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
                    "stroke": stroke,
                    "stroke-width": strokeWidth,
                    "stroke-dasharray": strokeDashArray,
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

            item.chainCoord = [ i, j ];

            const coordClick = (evt) => {

                var target = evt.target;

                chainSystem = getChainSystem( chainSystem.base, chainSystem.mult );

                const chains = navigate( target.chainCoord, chainSystem );

                drawChainOnGrid( id, chainSystem, chains[1], null, color = "rgba( 255, 0, 0, 1 )", cssClass = "chain", false );
                drawPathOnGrid( id, chainSystem, chains[0], null, color = "rgba( 0, 0, 255, 1 )", cssClass = "chain", false );

                //updateChainSystemEquation( id, chainSystem, chains[1] );
            };


            item.addEventListener( "click", coordClick, false );

            item = buildSVGItem(
                            'text',
                            {
                                "x": j * scale[1] + origin[1],
                                "y": i * scale[0] + origin[0] + 6,
                                "class": "small"
                            } );

            item.innerHTML = `(${i}, ${j})`;
            item.chainCoord = [ i, j ];

            item.addEventListener( "click", coordClick, false );

            svg_grid.appendChild( item );
        }
    }
}