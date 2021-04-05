
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

/*
    Randomize array in-place using Durstenfeld shuffle algorithm
    https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
*/
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
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

  function Fraction( s ){
    s = s.trim();
    if ( s.startsWith( "(" ) && s.endsWith( ")" ) ) {
        s = s.substring( 1, s.length - 1 );
        s = s.trim();
    }
    var f = s.split( /\s*[\/,]\s*/ );
    return (f[0] == "0")
        ? 0
        : (f[0] == f[1])
            ? 1
            : ( Number(f[0] / Number(f[1]) ) )
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

function drawChainsTable( containerId, tableId, chains ) {

    var chainsText = `<table id="${ tableId }" class='chain-details summary sortable'>`;

    chainsText += "<tr>" +
        "<th onclick='sortTable( \"chain-details\", 0, true )'>Sum</th>" +
        "<th onclick='sortTable( \"chain-details\", 1, true )'>GCD</th>" +
//        "<th onclick='sortTable( \"chain-details\", 2, true, true )'>Harmonic</th>" +
//        "<th onclick='sortTable( \"chain-details\", 3, true, true )'>Weight</th>" +
        `<th onclick='sortTable( "${ tableId }", 2 )'>Chain</th>` +
        "<th>Twist</th>" +
        "</tr>";

    for ( var i = 0; i < chains.length; i++ ) {
        var chain = chains[ i ];

        var median = chainMedian( { "coords": chain } );

        var sum = [ median[0], median[1] ];
        var gcd = [ median[2] ];

        chainsText += `<tr id="chain-${ i }">`;
        chainsText += `<td align="center">( ${ sum[0] }, ${ sum[1] } )</td>`;
        chainsText += `<td align="center">${ gcd }</td>`;
//        chainsText += `<td align="center">${ chain.harmonic }</td>`;
//        chainsText += `<td align="center">${ chain.weight }</td>`;

        chainsText += "<td onclick='drawChainOnGrid( arrayFromChainText( this ) )'>";
        for ( var j = 0; j < chain.length; j++ ) {
            chainsText += `${ j > 0 ? ', ': '' }( ${ chain[j][0] }, ${ chain[j][1] } )`;
        }
        chainsText += "</td>";
        chainsText += "<td align='center' onclick='rotateChainText( this.previousElementSibling )'>&#8594;</td>";

        chainsText += "</tr>";
    }

    chainsText += "</table>"

    document.getElementById( containerId ).innerHTML = chainsText;
}


function drawChainSystemTable( containerId, chainSystem, cellClick, totalClick ) {

    var harmony = [ chainSystem.totalWeight, chainSystem.maxWeight, truncate( chainSystem.totalWeight / chainSystem.maxWeight ) ];

    var chainsText = `<table id="${ containerId }_i" class='chain-details summary sortable'>`;

    chainsText += `<caption>Chain System: b=${ chainSystem.base }, m=${ chainSystem.mult }, p=${ chainSystem.fundamental }, w=[ ${ harmony[0] } / ${ harmony[1] } / ${ harmony[2] } ]</caption>`;

    var colIndex = 0;
    chainsText += "<tr>";
    chainsText += `<th onclick='sortTable( "${ containerId }_i", ${ colIndex++ }, true, true )' width='8%'>Coord Sum</th>`;
    chainsText += `<th onclick='sortTable( "${ containerId }_i", ${ colIndex++ }, true )'>Harmonic</th>`;
    chainsText += `<th onclick='sortTable( "${ containerId }_i", ${ colIndex++ }, true, true )' width='10%'>Harmonic Sum</th>`;
    chainsText += `<th onclick='sortTable( "${ containerId }_i", ${ colIndex++ }, true )'>GCD</th>`;
    chainsText += `<th onclick='sortTable( "${ containerId }_i", ${ colIndex++ }, true )'>Weight</th>`;
    chainsText += `<th onclick='sortTable( "${ containerId }_i", ${ colIndex++ }, true, true )' width='8%'>Centre</th>`;
    chainsText += `<th onclick='sortTable( "${ containerId }_i", ${ colIndex++ }, true )'>Turns</th>`;
    chainsText += `<th onclick='sortTable( "${ containerId }_i", ${ colIndex++ } )' width='70%'>Chain</th>` +
        "<th>Twist</th>" +
        "</tr>";


    const chains = chainSystem.chains;

    for ( var i = 0; i < chains.length; i++ ) {

        var chain = chains[ i ].getTableRow();

        chainsText += `<tr id="chain-${ i }">`;
        chainsText += `<td align="center">${ chain.sum }</td>`;
        chainsText += `<td align="center">${ chain.harmonic }</td>`;
        chainsText += `<td align="center">${ chain.harmonicSum }</td>`;
        chainsText += `<td align="center">${ chain.gcd }</td>`;
        chainsText += `<td align="center">${ chain.weight }</td>`;
        chainsText += `<td align="center">${ chain.bias }</td>`;
        chainsText += `<td align="center">${ chain.rotation }</td>`;
        chainsText += `<td onclick="${ cellClick }">${ chain.members }</td>`;
        chainsText += "<td align='center' onclick='rotateChainText( this.previousElementSibling )'>&#8594;</td>";
        chainsText += "</tr>";
    }

    var tds = chainSystem.totalDigitSum;
    var ths = chainSystem.totalHarmonicSum;

    chainsText += "<tr>";
    chainsText += `<td class="sum-total" onclick="${ totalClick }"><span class="sum-total">( ${ tds[0] }, ${ tds[1] } )</span></td>`;
    chainsText += "<td></td>";
    chainsText += `<td class="sum-total" onclick="${ totalClick }"><span class="sum-total">( ${ ths[0] }, ${ ths[1] } )</span></td>`;
    chainsText += "<td colspan='6'></td>";
    chainsText += "</tr>";

    chainsText += "</table>"

    document.getElementById( containerId ).innerHTML = chainsText;
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

async function riffleChains( chains, chainSystem ) {

    if ( isHidden( 'svg-container' ) ) {
        return;
    }

    var svg = document.getElementById( 'svg' );

    var autoRiffle = document.getElementById( 'autoRiffle' ).checked;
    var delay = document.getElementById( 'delay' ).value;

    var scales = getScales( chainSystem.mult, chainSystem.base );

    var riffleEvenOdd = document.getElementById( "riffleEvenOdd" ).checked ? "evenodd" : null;

    var item = document.getElementById( "chain-highlight" );
    if ( item ) {
        svg.removeChild( item );
    }
    if ( autoRiffle ) {
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