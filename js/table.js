
function showHideCSS( selector ) {
    document
        .querySelectorAll( selector )
        .forEach( c => {
            var s = c.style.display;
            if ( s == '' ) {
                c.style.display  =  'none';
            } else {
                c.style.display  =  '';
            }
        } );
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

function showHideAll( ids = [] ) {
    ids.forEach( id => showHide( id ) );
}


function sortTable( tableId, columnIndex, isNumber = false, isFraction = false ) {
  var table, rows, switching, i, x, y, shouldSwitch;

  table = document.getElementById( tableId );

  table
      .dataset
      .sortColumn = columnIndex;

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
          var xT = x ? x.innerHTML : null;
          var yT = y ? y.innerHTML : null;

          if ( xT && yT ) {
              xT = xT.toLowerCase();
              yT = yT.toLowerCase();

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

function getCycleIndexMonomialTex( orbitSystem ) {
    var cimHtml = "";
    for (const [ k, e ] of Object.entries( orbitSystem.cycleIndexMonomial )) {
        if ( k > 1 ) {
            cimHtml = cimHtml + `a_{${ k }}^{${ e }}`;
        }
    }
    return cimHtml;
}

function getCycleIndexMonomialHtml( orbitSystem ) {
    var cimHtml = "";
    for (const [ k, e ] of Object.entries( orbitSystem.cycleIndexMonomial )) {
        if ( k > 1 ) {
            cimHtml = cimHtml + `<i>a</i><sup>${ e }</sup><sub style='position: relative; left: -.5em;'>${ k }</sub>`;
        }
    }
    return cimHtml;
}


function drawOrbitSystemTable( containerId, orbitSystem, cellClick, totalClick, midi = false ) {

    const tableContainerId = containerId + "_table";
    const tableId = tableContainerId + "_data";

    var chainsText = `<table id="${ tableId }" class='chain-details summary sortable'>`;

    chainsText += "<caption>Orbit System: ";
    chainsText += `b=[${ orbitSystem.basePlane.bases.join( ', ' ) }], `;
    chainsText += `v=${ orbitSystem.basePlane.volume }, `;
    chainsText += `w=${ orbitSystem.maxWeight }, `;
    chainsText += `f=${ orbitSystem.fundamental }, `;
    chainsText += "</caption>";

    var colIndex = 0;
    chainsText += "<tr>";
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>Index</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' class='midi' style='display: ${midi?"":"none"};'>Instrument</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' class='midi' style='display: ${midi?"":"none"};'>Channel</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' class='midi' style='display: ${midi?"":"none"};'>Percussion</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' class='midi' style='display: ${midi?"":"none"};'>Repeat</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' class='midi' style='display: ${midi?"":"none"};' width='20%'>Parity</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' width='70%'>Orbit</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' width='8%'>Point Sum</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )' width='5%'>Order</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )'>Line</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )'>Centre</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )'>Attack</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>Harmonic</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )' width='8%'>GCD / LCM</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>Weight</th>`;
    chainsText += "</tr>";

    const identityPoints = orbitSystem.identityPoints.map( p => "{ " + canonicalize( p.coords[0].coord ) + " }" ).join(", ");
    chainsText += "<tr>";
    chainsText += `<th align="center"><code>e</code></th>`;
    chainsText += `<th colspan='5' class='midi' style='display: ${midi?"":"none"};'></th>`;
    chainsText += `<th id="${ tableId }.e" align='center'><code>${ identityPoints }</code></th>`;
    chainsText += "<th colspan='7'></th>";
    chainsText += "</tr>";

    const orbits = orbitSystem.orbits;

    for ( var i = 0; i < orbits.length; i++ ) {

        var orbit = orbits[ i ].getTableRow();

        var onSelectInstrument = `setMidiInstrument( ${ orbit.id }, this.value )`;
        var onSelectPercussion = `setMidiInstrument( ${ orbit.id }, this.value, true )`;
        var onSelectChannel = `setMidiChannel( ${ orbit.id }, this.value )`;
        var onSelectRepeat = `setMidiRepeats( ${ orbit.id }, this.value )`;

        chainsText += `<tr>`;
        chainsText += `<td align="center">${ orbit.id }</td>`;
        chainsText += `<td align="center" class='midi' style='display: ${midi?"":"none"};'>${ getInstrumentSelectorHtml( orbit.midi.instrument, onSelectInstrument ) }</td>`;
        chainsText += `<td align="center" class='midi' style='display: ${midi?"":"none"};'>${ getChannelSelectorHtml( orbit.midi.channel, onSelectChannel ) }</td>`;
        chainsText += `<td align="center" class='midi' style='display: ${midi?"":"none"};'>${ getPercussionInstrumentSelectorHtml( orbit.midi.percussion, onSelectPercussion ) }</td>`;
        chainsText += `<td align="center" class='midi' style='display: ${midi?"":"none"};'>${ getRepeatSelectorHtml( orbit.midi.repeats, onSelectRepeat ) }</td>`;
        chainsText += `<td align="center" class='midi' style='display: ${midi?"":"none"};'>${ orbit.parity }</td>`;
        chainsText += `<td id="${ tableId }.${ orbit.id }" class='orbit' align='center' onclick="${ cellClick }">${ orbit.members }</td>`;
        chainsText += `<td align="center">${ orbit.sum }</td>`;
        chainsText += `<td align="center">${ orbit.order }</td>`;
        chainsText += `<td align="center">${ orbit.lineRef }</td>`;
        chainsText += `<td align="center">${ orbit.centreRef }</td>`;
        chainsText += `<td align="center">${ orbit.attack }</td>`;
        chainsText += `<td align="center">${ orbit.harmonic }</td>`;
        chainsText += `<td align="center">( ${ orbit.gcd }, ${ orbit.lcm } )</td>`;
        chainsText += `<td align="center">${ orbit.weight }</td>`;
        chainsText += "</tr>";
    }

    var tds = orbitSystem.totalDigitSum;
    var tos = orbitSystem.totalOrderSpace;

    chainsText += "<tr>";
    chainsText += "<td></td>";
    chainsText += `<td colspan='5' class='midi' style='display: ${midi?"":"none"};'></td>`;
    chainsText += "<td colspan='1'></td>";
    chainsText += `<td class="sum-total" onclick="${ totalClick }"><span class="sum-total">( ${ tds.join( ', ') } )</span></td>`;
    chainsText += `<td class="sum-total" onclick="${ totalClick }"><span class="sum-total">( ${ tos } )</span></td>`;
    chainsText += "<td colspan='6'></td>";
    chainsText += "</tr>";
    chainsText += "</table>";

    var legend = "Click on a cell to select or on a totals cell to redraw all.";
    chainsText += `<div class='chain-details-legend' class='noprint'>${ legend }</div>`;

    var sortColumn = [0];
    const existingTable = document
        .getElementById( tableId );

    if (existingTable && existingTable.dataset && existingTable.dataset.sortColumn ) {
        sortColumn = existingTable
            .dataset
            .sortColumn
            .split("\\s*,\\s*")
            .map( x => Number( x ) );
    }

    document
        .getElementById( tableContainerId )
        .innerHTML = chainsText;

    try {
        sortTable( tableId, sortColumn, true, true );
    } catch ( e ) {
        console.log(e);
    }
}
