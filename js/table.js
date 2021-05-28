

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

function getCycleIndexMonomialTex( orbitSystem ) {
    var cimHtml = "";
    for (const [ k, e ] of Object.entries( orbitSystem.cycleIndexMonomial )) {
        if ( k > 1 ) {
            cimHtml = cimHtml + `a_{${ k }}^{${ e }}`;
        }
    }
    return cimHtml;
}


function drawOrbitSystemTable( containerId, orbitSystem, cellClick, totalClick ) {

    const tableContainerId = containerId + "_table";
    const tableId = tableContainerId + "_data";

    var chainsText = `<table id="${ tableId }" class='chain-details summary sortable'>`;

    chainsText += "<caption>Orbit System: ";
    chainsText += `b=[${ orbitSystem.bases.join( ', ' ) }], `;
    chainsText += `v=${ orbitSystem.volume }, `;
    chainsText += `w=${ orbitSystem.maxWeight }, `;
    chainsText += `p=${ orbitSystem.fundamental }, `;
    chainsText += "</caption>";

    var colIndex = 0;
    chainsText += "<tr>";
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>Index</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' width='70%'>Orbit</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' width='8%'>Coord Sum</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>Length</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>Harmonic</th>`;
    //chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' width='10%'>Harmonic Sum</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )' width='8%'>GCD / LCM</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>Weight</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' width='8%'>Bias</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )'>Line</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )'>Centre</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>P<sup>2</sup></th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>H<sup>2</sup></th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>O<sup>2</sup></th>`;
    chainsText += "</tr>";

    const orbits = orbitSystem.orbits;

    for ( var i = 0; i < orbits.length; i++ ) {

        var orbit = orbits[ i ].getTableRow();

        chainsText += `<tr>`;
        chainsText += `<td align="center">${ orbit.id }</td>`;
        chainsText += `<td id="${ tableId }.${ orbit.id }" class='orbit' align='center' onclick="${ cellClick }">${ orbit.members }</td>`;
        chainsText += `<td align="center">${ orbit.sum }</td>`;
        chainsText += `<td align="center">${ orbit.length }</td>`;
        chainsText += `<td align="center">${ orbit.harmonic }</td>`;
        //chainsText += `<td align="center">${ orbit.harmonicSum }</td>`;
        chainsText += `<td align="center">( ${ orbit.gcd }, ${ orbit.lcm } )</td>`;
        chainsText += `<td align="center">${ orbit.weight }</td>`;
        chainsText += `<td align="center">${ orbit.bias }</td>`;
        chainsText += `<td align="center">${ orbit.lineRef }</td>`;
        chainsText += `<td align="center">${ orbit.centreRef }</td>`;
        chainsText += `<td align="center">${ orbit.perimeter }</td>`;
        chainsText += `<td align="center">${ orbit.centreHypoteneuse }</td>`;
        chainsText += `<td align="center">${ orbit.centreOpposite }</td>`;
        chainsText += "</tr>";
    }

    var tds = orbitSystem.totalDigitSum;
    var perimeter = orbitSystem.totalPerimeter;

    chainsText += "<tr>";
    chainsText += "<td></td>";
    chainsText += "<td></td>";
    chainsText += `<td class="sum-total" onclick="${ totalClick }"><span class="sum-total">( ${ tds.join( ', ') } )</span></td>`;
    chainsText += "<td></td>";
    chainsText += "<td></td>";
    chainsText += "<td></td>";
    chainsText += "<td></td>";
    chainsText += "<td></td>";
    chainsText += "<td></td>";
    chainsText += "<td></td>";
    chainsText += `<td class="sum-total" onclick="${ totalClick }"><span class="sum-total">${ perimeter }</span></td>`;
    chainsText += "<td></td>";
    chainsText += "<td></td>";
    chainsText += "</tr>";
    chainsText += "</table>";

    var legend = "Click on a cell to select or on a totals cell to redraw all.";
    chainsText += `<div class='chain-details-legend' class='noprint'>${ legend }</div>`;

    document
        .getElementById( tableContainerId )
        .innerHTML = chainsText;

    var sortColumn = 7;
    sortTable( tableId, sortColumn, true, true );
}
