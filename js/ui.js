
var width = 1000;
var height = 400;

chainSystem = null;


function getScales( mult, base ) {
    return [
       Math.round( height / ( mult - 1 ) ),
       Math.round( width / ( base - 1 ) )
   ];
}

function isHidden( id ) {
    var c = document.getElementById( id );
    return c && c.style.display == 'none';
}

function showHide( id ) {
    var c = document.getElementById( id );
    if ( c ) {
        var s = c.style.display;
        if ( s == '' ) {
            c.style.display  =  'none';
        } else {
            c.style.display  =  '';
        }
    }
}

function getColor( colorStep, i ) {

//    switch( i )
//    {
//        case 0: return "rgba( 255, 0, 0, 1)";
//        case 1: return "rgba( 0, 255, 0, 1)";
//        case 2: return "rgba( 0, 0, 255, 1)";
//        case 3: return "rgba( 0, 255, 255, 1)";
//        case 4: return "rgba( 255, 0, 255, 1)";
//        case 5: return "rgba( 255, 255, 0, 1)";
//    }

    return "rgba("
        + ( 255 - ( i * colorStep ) ) + ","
        + ( 128 + ( i * colorStep * 0.75 ) ) + ","
        + ( 127 - ( i * colorStep * 0.5 ) ) + ","
        + "1 )";
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


function updateControls( chainSystem ) {

    document.getElementById( "bm-1" ).value = chainSystem.maxIndex;
    document.getElementById( "bm1-text" ).innerHTML = "( " + chainSystem.mult + "." + chainSystem.base + " - 1 )";
    document.getElementById( "bm1-pf" ).innerHTML = primeFactors( chainSystem.maxIndex );

    // chain[0] = ( 0, 0 )
    var chain = chainSystem.chains[1];

    document.getElementById( "n" ).value = chainSystem.chains.length;
    document.getElementById( "riffler" ).max = chainSystem.chains.length - 1;

    var p = chain.coords.length;

    document.getElementById( "p" ).value = p;

    document.getElementById( "bm" ).value = chainDown( chain, chainSystem.mult );
    document.getElementById( "bm-text" ).innerHTML = `<span class="numerator">( ${chainSystem.mult}<sup>${p}</sup> - 1 )</span><br/><span class="denominator">${chainSystem.maxIndex}</span>`;

    document.getElementById( "mb" ).value = chainUp( chain, chainSystem.base );
    document.getElementById( "mb-text" ).innerHTML = `<span class="numerator">( ${chainSystem.base}<sup>${p}</sup> - 1 )</span><br/><span class="denominator">${chainSystem.maxIndex}</span>`;

    writeHarmonics( chainSystem );
}

function writeHarmonics( chainSystem ) {

    var harmonics = chainSystem.harmonics;
    var hText = "<table id='harmonics'>";
    hText += "<tr><th>Items</th><th>Harmonics</th></tr>";

    for ( const h in harmonics ) {
        hText += "<tr>";
        hText += `<td id="harmonic-${ h }" onclick="filterHarmonic( '${ h }' )">${ harmonics[ h ] }</td>`;
        hText += `<td>${ h } / ${ chainSystem.fundamental / h }</td>`;
        hText += "</tr>";
    }

    hText += "<tr>";
    hText += `<td id="harmonic-all" class='selected' onclick="filterHarmonic()">(${ chainSystem.chains.length })</td>`;
    hText += `<td>* / *</td>`;
    hText += "</tr>";
    hText += "</table>";

    document.getElementById( "harmonics" ).innerHTML = hText;
}


function highlightChainTableRow( chainIndex ){
    var trTags = document.querySelectorAll( "table#chain-details tr" );
    for ( var i =0; i < trTags.length; i++) {
        trTags[i].classList.remove("selected");
    }
    var trTag = document.querySelector( `table#chain-details tr#chain-${ chainIndex }`);
    trTag.classList.add("selected");
}


function filterHarmonic( h ) {
    var chainSystem = getCurrentChainSystem();
    var chains = chainSystem.chains;

    var tdTags = document.querySelectorAll("table#harmonics td");
    for ( var i =0; i < tdTags.length; i++) {
        tdTags[i].classList.remove("selected");
    }

    var harmonics = [];

    if ( h ) {
        for ( var i = 0; i < chains.length; i++ ) {
            if ( chains[i].coords.length == h ) {
                harmonics.push( chains[i] );
            }
        }
        var tdTag = document.querySelector( `td#harmonic-${ h }`);
        tdTag.classList.add("selected");
    } else {
        harmonics = chains;

        var tdTag = document.querySelector( "td#harmonic-all" );
        tdTag.classList.add("selected");
    }

    drawChains( harmonics, chainSystem );
    writeChainTextLines( harmonics, chainSystem );
    riffleChains( harmonics, chainSystem );

    document.getElementById( "riffler" ).max = harmonics.length - 1;
}

function getCurrentHarmonic( chainSystem ) {
    try {
        var chains = chainSystem.chains;
        var selectedTag = document.querySelector( "table#harmonics td.selected" );
        if ( selectedTag ) {
            var x = selectedTag.id;
            x = x.substring( "harmonic-".length );
            var h = Number( x );

            if ( !isNaN( h ) ) {
                var harmonics = [];
                for ( var i = 0; i < chains.length; i++ ) {
                    if ( chains[i].coords.length == h ) {
                        harmonics.push( chains[i] );
                    }
                }
                return harmonics;
            }
        }
    } catch ( e ) {
        console.log( e );
    }
    return chainSystem.chains;
}

function writePrimeFactors() {
    if ( document.getElementById( "autoPrimeFactors" ).checked ) {
        document.getElementById( "bm-pf" ).innerHTML = primeFactors( document.getElementById( "bm" ).value );
        document.getElementById( "mb-pf" ).innerHTML = primeFactors( document.getElementById( "mb" ).value );
    } else {
        document.getElementById( "bm-pf" ).innerHTML = "";
        document.getElementById( "mb-pf" ).innerHTML = "";
    }
}

function writeChainText( chain ) {
    document.getElementById( "chains" ).innerHTML = `<p>${ chain.join(", ") }</p>`;
}



function sortTable( tableId, columnIndex, isNumber = false, isFraction = false ) {
  var table, rows, switching, i, x, y, shouldSwitch;

  table = document.getElementById( tableId );

  var th = table.rows[0].getElementsByTagName("TH")[columnIndex];

  // if already ascending then sort descending
  var descending = th.classList.contains( "sort-asc")
  var clear = th.classList.contains( "sort-desc")

  var thc = table.rows[0].getElementsByTagName("TH");
  for (var i = 0; i < thc.length; i++ ) {
    thc[i].classList.remove( "sort-asc");
    thc[i].classList.remove( "sort-desc");
  }

  if (clear) {
    return;
  } else if ( descending ) {
    th.classList.add( "sort-desc");
  } else {
    th.classList.add( "sort-asc");
  }

  switching = true;

  function Fraction( s ) {
    s = s.trim();
    if ( s.startsWith( "(" ) && s.endsWith( ")" ) ) {
        s = s.substring( 1, s.length - 1 );
        s = s.trim();
    }
    var f = s.split( /\s*[\/\|,]\s*/ );
    f[0] = Number( f[0].trim() );

    if ( f[0] == 0 ) {
        return 0;
    } else if( f.length == 1 ) {
        return f[0];
    }

    f[1] = Number( f[1].trim() );

    return ( f[0] == f[1] ) ? 1 : ( f[0] / f[1] );
  }

  /* Make a loop that will continue until
  no switching has been done: */
  while (switching) {
    // Start by saying: no switching is done:
    switching = false;
    rows = table.rows;
    /* Loop through all table rows (except the
    first, which contains table headers): */
    for ( i = 1; i < (rows.length - 1); i++) {
      // Start by saying there should be no switching:
      shouldSwitch = false;
      /* Get the two elements you want to compare,
      one from current row and one from the next: */
      x = rows[i].getElementsByTagName("TD")[columnIndex];
      y = rows[i + 1].getElementsByTagName("TD")[columnIndex];

      if (y && !y.classList.contains("sum-total") ) {
          var xT = x.innerHTML.toLowerCase();
          var yT = y.innerHTML.toLowerCase();

          if ( xT && yT ) {
              var xV = isNumber ? isFraction ? Fraction( xT ) :  Number( xT ) :  xT;
              var yV = isNumber ? isFraction ? Fraction( yT ) :  Number( yT ) :  yT;

              // Check if the two rows should switch place:
              if ( descending ? (xV < yV) : (xV > yV)) {
                // If so, mark as a switch and break the loop:
                shouldSwitch = true;
                break;
              }
          }
      }
    }
    if (shouldSwitch) {
      /* If a switch has been marked, make the switch
      and mark that a switch has been done: */
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
}

function writeChainTextLines( chains, chainSystem ) {

    var sortChains = [];

    for ( var i = 0; i < chains.length; i++ ) {
        sortChains[i] = chains[ i ].getTableRow();
    }

    var chainsText = "<table id='chain-details' class='summary sortable' width='100%'>";

    chainsText += "<tr>" +
        "<th width='8%'>Sum</th>" +
        "<th onclick='sortTable( \"chain-details\", 1, true )'>GCD</th>" +
        "<th onclick='sortTable( \"chain-details\", 2, true, true )'>Harmonic</th>" +
        "<th onclick='sortTable( \"chain-details\", 3, true, true )'>Weight</th>" +
        "<th onclick='sortTable( \"chain-details\", 4 )' width='92%'>Chain</th>" +
        "</tr>";

    for ( var i = 0; i < sortChains.length; i++ ) {
        var chain = sortChains[ i ];
        chainsText += `<tr id="chain-${ i }">`;
        chainsText += `<td align="center">${ chain.sum }</td>`;
        chainsText += `<td align="center">${ chain.gcd }</td>`;
        chainsText += `<td align="center">${ chain.harmonic }</td>`;
        chainsText += `<td align="center">${ chain.weight }</td>`;
        chainsText += `<td>${ chain.members }</td>`;
        chainsText += "</tr>";
    }

    chainsText += "</table>"

    document.getElementById( "chains" ).innerHTML = chainsText;
}




function drawChainSystemTable( containerId, chainSystem, cellClick, totalClick ) {

    const chains = chainSystem.chains;

    var harmony = [ chainSystem.totalWeight, chainSystem.maxWeight, truncate( chainSystem.totalWeight / chainSystem.maxWeight ) ];

    const tableContainerId = containerId + "_table";

    const tableId = tableContainerId + "_data";
    const rifflerId = tableContainerId + "_riffler";

    var cimHtml = "\\(" + getCycleIndexMonomialTex( chainSystem ) + "\\)";


    var chainsText = `<table id="${ tableId }" class='chain-details summary sortable'>`;

    chainsText += "<caption>Orbit System: ";
    chainsText += `cim=${ cimHtml }, `;
    chainsText += `b=${ chainSystem.base }, m=${ chainSystem.mult }, `;
    chainsText += `p=${ chainSystem.fundamental }, `;
    chainsText += `C=${ chainSystem.C }, D=${ chainSystem.D }, `;
    chainsText += `w=[ ${ harmony[0] } / ${ harmony[1] } / ${ harmony[2] } ]`;
    chainsText += "</caption>";

    var colIndex = 0;
    chainsText += "<tr>";
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' width='70%'>Orbit</th>`;
    chainsText += "<th>Twist</th>";
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' width='8%'>Coord Sum</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>Harmonic</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' width='10%'>Harmonic Sum</th>`;
//    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>GCD</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>Weight</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' width='8%'>Centre</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>Turn</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>Per<sup>2</sup></th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>DPer</th>`;
        "</tr>";


    for ( var i = 0; i < chains.length; i++ ) {

        var chain = chains[ i ].getTableRow();

        chainsText += `<tr>`;
        chainsText += `<td  align='center' onclick="${ cellClick };clickRiffler( '${ rifflerId }', ${ i } )">${ chain.members }</td>`;
        chainsText += "<td align='center' onclick='rotateChainText( this.previousElementSibling )'>&#8594;</td>";

        chainsText += `<td align="center">${ chain.sum }</td>`;
        chainsText += `<td align="center">${ chain.harmonic }</td>`;
        chainsText += `<td align="center">${ chain.harmonicSum }</td>`;
//        chainsText += `<td align="center">${ chain.gcd }</td>`;
        chainsText += `<td align="center">${ chain.weight }</td>`;
        chainsText += `<td align="center">${ chain.bias }</td>`;
        chainsText += `<td align="center">${ chain.rotation }</td>`;
        chainsText += `<td align="center">${ chain.perimeter }</td>`;
        chainsText += `<td align="center">${ chain.digitalPerimeter }</td>`;
        chainsText += "</tr>";
    }

    var tds = chainSystem.totalDigitSum;
    var ths = chainSystem.totalHarmonicSum;
    var turns = chainSystem.totalRotation;
    var perimeter = chainSystem.totalPerimeter;
    var digitalPerimeter = chainSystem.totalDigitalPerimeter;

    chainsText += "<tr>";
    chainsText += "<td></td>";
    chainsText += "<td></td>";
    chainsText += `<td class="sum-total" onclick="${ totalClick }"><span class="sum-total">( ${ tds[0] }, ${ tds[1] } )</span></td>`;
    chainsText += "<td></td>";
    chainsText += `<td class="sum-total" onclick="${ totalClick }"><span class="sum-total">( ${ ths[0] }, ${ ths[1] } )</span></td>`;
    chainsText += "<td></td>";
    chainsText += "<td></td>";
    chainsText += `<td class="sum-total" onclick="${ totalClick }"><span class="sum-total">${ turns }</span></td>`;
    chainsText += `<td class="sum-total" onclick="${ totalClick }"><span class="sum-total">${ perimeter }</span></td>`;
    chainsText += `<td class="sum-total" onclick="${ totalClick }"><span class="sum-total">${ digitalPerimeter }</span></td>`;
    chainsText += "</tr>";
    chainsText += "</table>";

    var legend = "Click on an orbit cell, or a coord in the grid, or on a totals cell to redraw all chains.";

    chainsText += `<div class='chain-details-legend' class='noprint'>${ legend }</div>`;

    var clickColumn = 1;
    var rifflerClick = `clickCell( '${ tableId }', Number(this.value), ${ clickColumn } )`;

    var riffler = "<input class='noprint'";
    riffler += ' type="range" min="0"';
    riffler += ` id="${ rifflerId }" max="${ chains.length - 1 }" onchange="${ rifflerClick }" oninput="${ rifflerClick }"`;
    riffler += ' value="0"';
    riffler += ' style="width: 95%;"/><br/>';

    const container = document.getElementById( tableContainerId );
    container.innerHTML = riffler + chainsText;

    try {
        MathJax.Hub.Queue( [ "Typeset", MathJax.Hub, container ] );
    } catch ( e ) {
        console.log( `Error: ${ e }: failed to typeset equation.` );
    }

    var sortColumn = 6;
    sortTable( tableId, sortColumn, true, true );
}


async function riffleChain( i ) {

    if ( isHidden( 'svg-container' ) ) {
        return;
    }

    var chainSystem = getCurrentChainSystem();
    var harmonic = getCurrentHarmonic( chainSystem );
    var scales = getScales( chainSystem.mult, chainSystem.base );

    var riffleEvenOdd = document.getElementById( "riffleEvenOdd" ).checked ? "evenodd" : null;

    var item = document.getElementById( "chain-highlight" );
    if ( item ) {
        svg.removeChild( item );
    }

    svg.appendChild( getChainItem( "highlight", harmonic[ i ], scales, "black", 2, riffleEvenOdd ) );

    highlightChainTableRow( i );
}

function clickRiffler( rifflerId, rowId ){
    const riffler = document.getElementById( rifflerId );
    const rifflerValue = Number( riffler.value );
    const isActive = ( riffler === document.activeElement );

    if ( !isActive && rifflerValue  != rowId ) {
        riffler.value = rowId;
    }
}


function clickCell( tableId, rowNo, colNo ){
    try {
        const table = document.getElementById( tableId );
        const rows = table.rows;
        const row = table.rows[ rowNo + 1 ];
        const cell = row.cells[ colNo ];
        const isActive = ( cell === document.activeElement );

        if ( !isActive ) {
            cell.click();
        }
    } catch ( e ) {
        console.log( `Error: ${ e }; clickCell( ${ tableId }, ${ rowNo }, ${ colNo } )` )
    }
}

async function riffle( tableId = null, rifflerId = null, delay = 500, clickColumn = 0 ){
    const riffler = document.getElementById( rifflerId );
    for ( var i = riffler.min; i <= riffler.max; i++ ){
        riffler.value = i;
        clickCell( tableId, Number( riffler.value ), clickColumn );
        await sleep( delay );
    }
}

async function riffleChains( chains, chainSystem, svgContainerId = 'svg-container' ) {

    if ( isHidden( svgContainerId ) ) {
        return;
    }

    const svg = document.getElementById( 'svg' );

    const autoRiffleElement = document.getElementById( 'autoRiffle' );
    const evenOddElement = document.getElementById( "riffleEvenOdd" );
    const delayElement = document.getElementById( 'delay' );

    const delay = delayElement ? delayElement.value : 1000;

    var riffleEvenOdd = evenOddElement && evenOddElement.checked ? "evenodd" : null;
    var scales = getScales( chainSystem.mult, chainSystem.base );


    var item = document.getElementById( "chain-highlight" );
    if ( item ) {
        svg.removeChild( item );
    }

    if ( !(autoRiffleElement) || autoRiffleElement.checked ) {
        for ( var i = 0; i < chains.length; i++ ) {

            item = getChainItem( "highlight", chains[i], scales, "white", 2, riffleEvenOdd );
            svg.appendChild( item );
            await sleep( delay );
            try {
                svg.removeChild( item );
            } catch ( exception ) {
                break;
            }
        }
    }
}


function getCurrentChainSystem() {
    var base = Number( document.getElementById( "base" ).value );
    var mult = Number( document.getElementById( "mult" ).value );
    return getChainSystem( base, mult );
}


function drawCurrentChainSystem( ) {
    var chainSystem = getCurrentChainSystem();
    var harmonic = getCurrentHarmonic( chainSystem );
    drawChains( harmonic, chainSystem );
}


function riffleCurrentChainSystem(){
    var chainSystem = getCurrentChainSystem();
    var harmonic = getCurrentHarmonic( chainSystem );
    riffleChains( harmonic, chainSystem );
}

function writeCurrentChainSystemTextLines(){
    var chainSystem = getCurrentChainSystem();
    var harmonic = getCurrentHarmonic( chainSystem );
    writeChainTextLines( harmonic, chainSystem );
}


function setChainSystemSvg( id, chainSystem, dimensions = [ 600, 150 ], oversize = [ 1, 1 ], origin = [ 0, 0 ], margin = 10 ) {

    if ( ! chainSystem.svg ) {
        chainSystem.svg = {};
    }
    if ( ! ( id in chainSystem.svg ) ) {
        chainSystem.svg[id] = {};
    }

    const svgInfo = chainSystem.svg[id];

    svgInfo.margin = margin;
    svgInfo.width = dimensions[0];
    svgInfo.height = dimensions[1];

    svgInfo.viewBox = `-${ margin } -${ margin } ${ dimensions[0] + margin } ${  dimensions[1] + margin }`;

    svgInfo.oversize = oversize;
    svgInfo.origin = origin;

    svgInfo.scale = [
        dimensions[1] / ( chainSystem.mult * oversize[1]),
        dimensions[0] / ( chainSystem.base * oversize[0])
    ];
}


function redrawGrid( id, chainSystem, margin = 10 ){

    const container = document.getElementById( id );

    var svg = document.getElementById( id + "_grid" );
    container.removeChild( svg );

    const svgInfo = chainSystem.svg[id];

    svgInfo.oversize = [
        Number( document.getElementById( id + "_grid_controls_oversize_0" ).value ),
        Number( document.getElementById( id + "_grid_controls_oversize_1" ).value )
    ];

    svgInfo.width = Number( document.getElementById( id + "_grid_controls_width" ).value );
    svgInfo.height = Number( document.getElementById( id + "_grid_controls_height" ).value );

    svgInfo.scale = [
        svgInfo.height / ( chainSystem.mult * svgInfo.oversize[1]),
        svgInfo.width / ( chainSystem.base * svgInfo.oversize[0])
    ];

    svgInfo.viewBox = `-${ margin } -${ margin } ${ svgInfo.width + margin } ${ svgInfo.height + margin }`;


    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute( "id", `${ id }_grid` );
    svg.setAttribute( "viewBox", svgInfo.viewBox );

    var gridControls = document.getElementById( id + "_grid_controls_container" );
    container.insertBefore( svg, gridControls.nextSibling );


    const stroke = "lightgray";
    const strokeWidth = 0.5;
    const strokeDashArray = "2";

    drawGrid( id, chainSystem, stroke, strokeWidth, strokeDashArray );
}


function writeChainSystemBlock( id, chainSystem, drawTable = false, drawControls = false, drawEquation = false  ) {

    const container = document.getElementById( id );

    container.innerHTML = "";

    const svgInfo = chainSystem.svg[id];

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute( "id", `${ id }_grid` );
    svg.setAttribute( "viewBox", svgInfo.viewBox );
    svg.setAttribute( "title", "Click on a coordinate to draw the associated chain and paths." );

    container.appendChild( svg );

    if ( drawControls ) {
        drawGridControls( id, chainSystem );
    }

    const stroke = "lightgray";
    const strokeWidth = 0.5;
    const strokeDashArray = "2";

    drawGrid( id , chainSystem, stroke, strokeWidth, strokeDashArray );

    if ( drawTable ) {
        container.appendChild( document.createElement( "br") );

        const tableDiv = document.createElement( "div");
        container.appendChild( tableDiv );

        tableDiv.setAttribute( "id", `${ id }_table` );
    }

    if ( drawEquation ) {
        container.appendChild( document.createElement( "br") );

        const equationDiv = document.createElement( "div");
        container.appendChild( equationDiv );

        equationDiv.setAttribute( "id", `${ id }_equation` );
    }
}

function getCycleIndexMonomialTex( chainSystem ) {
    var cimHtml = "";
    for (const [ k, e ] of Object.entries( chainSystem.cycleIndexMonomial )) {
        if ( k > 1 ) {
            cimHtml = cimHtml + `a_{${ k }}^{${ e }}`;
        }
    }
    return cimHtml;
}

function getCyclePolynomialsTex( chainSystem, chain ) {

    var b = chainSystem.base;
    var m = chainSystem.mult;
    var c = chainSystem.C;
    var d = chainSystem.D;
    var p = chainSystem.fundamental;
    var f = chain.length;

    var mHtml = "";
    var bHtml = "";

    for ( var i = 0; i < p; i++ ) {
        var coord = chain[i % f];
        if ( coord[0] > 0 ) {
            mHtml = mHtml + (mHtml ? " + " : "") +  coord[0] + ( i == p-1 ? "" : `m^${ p - 1 - i }` );
        }
        if ( coord[1] > 0 ) {
            bHtml = coord[1] + ( i == 0 ? "" : `b^${ i }` ) + ( bHtml ? " + " : "") + bHtml;
        }
    }

    mHtml = `${ mHtml } &amp;= ${ b * chain[0][0] + chain[0][1] }.${ c }`;
    bHtml = `${ bHtml } &amp;= ${ chain[f-1][0] + m * chain[f-1][1] }.${ d }`;

    return [ mHtml, bHtml ];
}

function updateChainSystemEquation( id, chainSystem, chain ) {

    const equationId = id + "_equation";

    var equation = document.getElementById( equationId );

    if ( ! equation ){
        return;
    }

    if ( ! chain ) {
        chain = chainSystem.chains[1].coordsArray();
    }

    const [ mHtml, bHtml ] = getCyclePolynomialsTex( chainSystem, chain );

    equation.innerHTML = "";

    var equationHtml = "\\begin{align*}";
    equationHtml += mHtml + " \\\\";
    equationHtml += "<br/>";
    equationHtml += bHtml + " \\\\";
    equationHtml += "\\end{align*}";

    equation.innerHTML = equationHtml;

    try {
        MathJax.Hub.Queue( [ "Typeset", MathJax.Hub, equation ] );
    } catch ( e ) {
        console.log( `Error: ${ e }: failed to typeset equation.` );
    }

    //console.log( `Typeset equation: ${ equationHtml }` )
}