
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

function getCycleIndexMonomialTex( basePlane ) {
    var cimHtml = "";
    for (const [ k, e ] of Object.entries( basePlane.cycleIndexMonomial )) {
        if ( k > 1 ) {
            cimHtml = cimHtml + `a_{${ k }}^{${ e }}`;
        }
    }
    return cimHtml;
}

function getCycleIndexMonomialHtml( basePlane ) {
    var cimHtml = "";

    cimHtml += `(<code>e</code><sup>${ basePlane.identities.length }</sup>) `;

    for (const [ k, e ] of Object.entries( basePlane.cycleIndexMonomial )) {
        if ( k > 1 ) {
            cimHtml = cimHtml + `<i>a</i><sup>${ e }</sup><sub style='position: relative; left: -.5em;'>${ k }</sub>`;
        }
    }
    return cimHtml;
}


function drawBasePlaneTable( tableArgs ) {

    var { containerId, basePlane, cellClick, clearClick, totalClick, midi = false, conj = false, perms = false, jumps = false } = tableArgs;

    const tableContainerId = containerId + "_table";
    const tableId = tableContainerId + "_data";

    var chainsText = "";
    chainsText += `<table id="${ tableId }" class='chain-details summary sortable'>`;

//    chainsText += "<caption>Orbit System: ";
//    chainsText += `b=[${ basePlane.box.bases.join( ', ' ) }], `;
//    chainsText += `t=${ basePlane.box.volume - 1 }, `;
//    chainsText += `f=${ basePlane.fundamental }, `;
//    chainsText += "</caption>";

    var colIndex = 0;
    chainsText += "<tr>";
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>Index</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' class='midi' style='display: ${midi?"":"none"};'>Instrument</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' class='midi' style='display: ${midi?"":"none"};'>Channel</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' class='midi' style='display: ${midi?"":"none"};'>Percussion</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' class='midi' style='display: ${midi?"":"none"};'>Repeat</th>`;

    if ( jumps ) {
        chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' width='30%'>Jumps</th>`;
    }
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' width='40%'>Orbit</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' width='8%'>Point Sum</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' width='8%'>Id Sum</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )' width='8%'>Order</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>Harmonic</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )'>Line</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )'>Centre</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' title="The sum of the squares of the (euclidean) distance between each coordinate and its reflection in the box centre.">Brilliance</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' title="The sum of the squares of the (euclidean) distance between adjacent coordinates in an orbit.">Per<sup>2</sup></th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' title="The Brilliance minus the sum of the squares of the Perimeters.">Tension</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' title="The sum of the index radiant (distance from the index centre) of each coordinate.">Radiance</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' title="The sum of the index distance between adjacent coordinates in an orbit.">Jumpage</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' title="The Radiance minus the Jumpage.">Torsion</th>`;
//    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )' width='8%'>GCD / LCM</th>`;
//    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>Weight</th>`;
    chainsText += "</tr>";

    chainsText += "<tr>";
    chainsText += `<th align="center"><code>e</code></th>`;
    chainsText += `<th colspan='4' class='midi' style='display: ${midi?"":"none"};'></th>`;

    if ( jumps ) {
        chainsText += `<td align="center">[ ${ basePlane.identities.map( p => p.coords[0].jump ).join( C_SEP ) } ]</td>`;
    }

    if ( perms ) {
        const identities = basePlane.identities.map( p => "( " + p.coords.map( c => c.id ).join( ' ' ) + " )" ).join(" ");
        chainsText += `<th id="${ tableId }.e" align='center' onclick="${ clearClick }"><code>${ identities }</code></th>`;
    } else {
        const identities = basePlane.identities.map( p => "{ " + canonicalize( p.coords[0].coord ) + " }" ).join(", ");
        chainsText += `<th id="${ tableId }.e" align='center' onclick="${ clearClick }"><code>${ identities }</code></th>`;
    }

    const maxIndex = basePlane.box.volume - 1;

    const initialPointsSum = new Array( basePlane.box.bases.length ).fill( 0 );
    const identityPointsSum = basePlane.identities.reduce( (a, p) => addition( a, p.coords[0].coord ), initialPointsSum );
    const identityIdSum = basePlane.identities.reduce( (a, p) => a + p.coords[0].id, 0 );
    const identityIdSumGcd = gcd( maxIndex, identityIdSum );

    chainsText += `<th id="${ tableId }.f" align='center' onclick="${ clearClick }"><code>(${ identityPointsSum })</code></th>`;
    chainsText += `<th id="${ tableId }.g" align='center' onclick="${ clearClick }"><code>${ identityIdSum / identityIdSumGcd } * ${ identityIdSumGcd }</code></th>`;

    chainsText += `<th align='center' onclick="${ clearClick }"><code>( 1 * ${ basePlane.identities.length } )</code></th>`;
    chainsText += "<th colspan='1'></th>";
    chainsText += `<th align='center' onclick="${ clearClick }"></th>`;
    chainsText += "<th colspan='1'></th>";

    const identityDiameterSum = basePlane.identityDiameterSum();
    chainsText += `<th colspan='1'><code>${ identityDiameterSum }</code></th>`;
    chainsText += "<th colspan='1'></th>";
    chainsText += `<th colspan='1' class="difference"><code>${ identityDiameterSum }</code></th>`;

    const identityRadiance = basePlane.identityRadiance();
    chainsText += `<th colspan='1'><code>${ identityRadiance }</code></th>`;
    chainsText += "<th colspan='1'></th>";
    chainsText += `<th colspan='1' class="difference"><code>${ identityRadiance }</code></th>`;

    chainsText += "</tr>";

    const orbits = basePlane.orbits;

    for ( var i = 0; i < orbits.length; i++ ) {

        var orbit = orbits[ i ];

        // ignore later conjugate
        if ( !orbit.isSelfConjugate() && !orbit.isFirstConjugate() && conj) {
            continue;
        }


        var orbitSpace = (orbit.isSelfConjugate() && conj)
            ? maxIndex * orbit.order / 2
            : maxIndex * orbit.order;

        var orbitIdSum = orbit.getIdSum();
        var orbitSpaceGcd = gcd( maxIndex, orbitIdSum );

        var onSelectInstrument = `setMidiInstrument( ${ orbit.index }, this.value )`;
        var onSelectPercussion = `setMidiInstrument( ${ orbit.index }, this.value, true )`;
        var onSelectChannel = `setMidiChannel( ${ orbit.index }, this.value )`;
        var onSelectRepeat = `setMidiRepeats( ${ orbit.index }, this.value )`;

        chainsText += `<tr>`;
        chainsText += `<td align="center">${ orbit.isSelfConjugate() ? orbit.index : orbit.isFirstConjugate() ? orbit.index : "<sup>(" + orbit.index + ")</sup>" }</td>`;
        chainsText += `<td align="center" class='midi' style='display: ${midi?"":"none"};'>${ getInstrumentSelectorHtml( orbit.midi.instrument, onSelectInstrument ) }</td>`;
        chainsText += `<td align="center" class='midi' style='display: ${midi?"":"none"};'>${ getChannelSelectorHtml( orbit.midi.channel, onSelectChannel ) }</td>`;
        chainsText += `<td align="center" class='midi' style='display: ${midi?"":"none"};'>${ getPercussionInstrumentSelectorHtml( orbit.midi.percussion, onSelectPercussion ) }</td>`;
        chainsText += `<td align="center" class='midi' style='display: ${midi?"":"none"};'>${ getRepeatSelectorHtml( orbit.midi.repeats, onSelectRepeat ) }</td>`;

        if ( perms ) {
            if ( orbit.isSelfConjugate() && conj ) {
                // self-conjugates pair off so must have even order
                var scValenceFirst = orbit.jumps.slice( 0, Math.ceil( orbit.jumps.length / 2 ) );
                var scValenceRest = orbit.jumps.slice( Math.ceil( orbit.jumps.length / 2 ), orbit.jumps.length );
                var scMembersFirst = orbit.coords.slice( 0, Math.ceil( orbit.coords.length / 2 ) );
                var scMembersRest = orbit.coords.slice( Math.ceil( orbit.coords.length / 2 ), orbit.coords.length );

                if ( jumps ) {
                    chainsText += `<td align="center">[ ${ scValenceFirst.join( C_SEP ) } &#8600;<br/>${ scValenceRest.join( C_SEP ) } &#8598;]</td>`;
                }
                chainsText += `<td id="${ tableId }.${ orbit.index }" class='orbit' align='center' onclick="${ cellClick }">( ${ scMembersFirst.map( c => c.id ).join( ' ' ) } &#8600;<br/>${ scMembersRest.map( c => c.id ).join( ' ' ) } &#8598;)</td>`;
                chainsText += `<td align="center">(${ orbit.sum.join( C_SEP ) })</td>`;
                chainsText += `<td align="center">${ orbitIdSum / orbitSpaceGcd } * ${ orbitSpaceGcd }</td>`;
            } else if ( orbit.isFirstConjugate() && conj ) {
                var conjOrbit = orbits[ orbit.conjugate.index - 1 ];
                var conjOrbitIdSum = conjOrbit.getIdSum();
                var conjOrbitSpaceGcd = gcd( maxIndex, conjOrbitIdSum );
                if ( jumps ) {
                    chainsText += `<td align="center">[ ${ orbit.jumps.join( C_SEP ) } ]<br/>[ ${ conjOrbit.jumps.join( C_SEP ) } ]</td>`;
                }
                chainsText += `<td id="${ tableId }.${ orbit.index }.${ conjOrbit.index }" class='orbit' align='center' onclick="${ cellClick }">( ${ orbit.coords.map( c => c.id ).join( ' ' ) } )<br/>( ${ conjOrbit.coords.map( c => c.id ).join( ' ' ) } )</td>`;
                chainsText += `<td align="center">(${ orbit.sum.join( C_SEP ) })<br/>(${ conjOrbit.sum.join( C_SEP ) })</td>`;
                chainsText += `<td align="center">${ orbitIdSum / orbitSpaceGcd } * ${ orbitSpaceGcd }<br/>${ conjOrbitIdSum / conjOrbitSpaceGcd } * ${ conjOrbitSpaceGcd }</td>`;
            } else {
                if ( jumps ) {
                    chainsText += `<td align="center">[ ${ orbit.jumps.join( C_SEP ) } ]</td>`;
                }
                chainsText += `<td id="${ tableId }.${ orbit.index }" class='orbit' align='center' onclick="${ cellClick }">( ${ orbit.coords.map( c => c.id ).join( ' ' ) } )</td>`;
                chainsText += `<td align="center">(${ orbit.sum.join( C_SEP ) })</td>`;
                chainsText += `<td align="center">${ orbitIdSum / orbitSpaceGcd } * ${ orbitSpaceGcd }</td>`;
            }
        } else {
            if ( orbit.isSelfConjugate() && conj ) {
                // self-conjugates pair off so must have even order
                var scValenceFirst = orbit.jumps.slice( 0, Math.ceil( orbit.jumps.length / 2 ) );
                var scValenceRest = orbit.jumps.slice( Math.ceil( orbit.jumps.length / 2 ), orbit.jumps.length );
                var scMembersFirst = orbit.coords.slice( 0, Math.ceil( orbit.coords.length / 2 ) );
                var scMembersRest = orbit.coords.slice( Math.ceil( orbit.coords.length / 2 ), orbit.coords.length );

                if ( jumps ) {
                    chainsText += `<td align="center">[ ${ scValenceFirst.join( C_SEP ) } &#8600;<br/>${ scValenceRest.join( C_SEP ) } &#8598;]</td>`;
                }
                chainsText += `<td id="${ tableId }.${ orbit.index }" class='orbit' align='center' onclick="${ cellClick }">${ scMembersFirst.join( C_SEP ) } &#8600;<br/>${ scMembersRest.join( C_SEP ) } &#8598;</td>`;
                chainsText += `<td align="center">(${ orbit.sum.join( C_SEP ) })</td>`;
                chainsText += `<td align="center">${ orbitIdSum / orbitSpaceGcd } * ${ orbitSpaceGcd }</td>`;
            } else if ( orbit.isFirstConjugate() && conj ) {
                var conjOrbit = orbits[ orbit.conjugate.index - 1 ];
                var conjOrbitIdSum = conjOrbit.getIdSum();
                var conjOrbitSpaceGcd = gcd( maxIndex, conjOrbitIdSum );

                if ( jumps ) {
                    chainsText += `<td align="center">[ ${ orbit.jumps.join( C_SEP ) } ]<br/>[ ${ conjOrbit.jumps.join( C_SEP ) } ]</td>`;
                }
                chainsText += `<td id="${ tableId }.${ orbit.index }.${ conjOrbit.index }" class='orbit' align='center' onclick="${ cellClick }">${ orbit.getMembers() }<br/>${ conjOrbit.getMembers() }</td>`;
                chainsText += `<td align="center">(${ orbit.sum.join( C_SEP ) })<br/>(${ conjOrbit.sum.join( ', ' ) })</td>`;
                chainsText += `<td align="center">${ orbitIdSum / orbitSpaceGcd } * ${ orbitSpaceGcd }<br/>${ conjOrbitIdSum / conjOrbitSpaceGcd } * ${ conjOrbitSpaceGcd }</td>`;
            } else {
                if ( jumps ) {
                    chainsText += `<td align="center">[ ${ orbit.jumps.join( C_SEP ) } ]</td>`;
                }
                chainsText += `<td id="${ tableId }.${ orbit.index }" class='orbit' align='center' onclick="${ cellClick }">${ orbit.getMembers() }</td>`;
                chainsText += `<td align="center">(${ orbit.sum.join( C_SEP ) })</td>`;
                chainsText += `<td align="center">${ orbitIdSum / orbitSpaceGcd } * ${ orbitSpaceGcd }</td>`;
            }
        }

        if ( orbit.isSelfConjugate() && conj ) {
            chainsText += `<td align="center">${ orbit.order / 2 } * 2</td>`;
        } else if ( orbit.isFirstConjugate() && conj ) {
            chainsText += `<td align="center">${ orbit.order } * 2</td>`;
        } else {
            chainsText += `<td align="center">${ orbit.order } * 1</td>`;
        }

        chainsText += `<td align="center">${ orbit.harmonic }</td>`;
        chainsText += `<td align="center">${ orbit.getLineRef() }</td>`;
        chainsText += `<td align="center">${ orbit.centreRef }</td>`;

        if ( orbit.isSelfConjugate() && conj ) {
            chainsText += `<td align="center">${ orbit.diameterSum }</td>`;
            chainsText += `<td align="center">${ orbit.perimeter }</td>`;
            chainsText += `<td align="center" class="difference">${ orbit.tension() }</td>`;
            chainsText += `<td align="center">${ orbit.radiance }</td>`;
            chainsText += `<td align="center">${ orbit.jumpage }</td>`;
            chainsText += `<td align="center" class="difference">${ orbit.torsion() }</td>`;
        } else if ( orbit.isFirstConjugate() && conj ) {
            chainsText += `<td align="center">${ orbit.diameterSum * 2 }</td>`;
            chainsText += `<td align="center">${ orbit.perimeter * 2 }</td>`;
            chainsText += `<td align="center" class="difference">${ orbit.tension() * 2 }</td>`;
            chainsText += `<td align="center">${ orbit.radiance * 2 }</td>`;
            chainsText += `<td align="center">${ orbit.jumpage * 2 }</td>`;
            chainsText += `<td align="center" class="difference">${ orbit.torsion() * 2 }</td>`;
        } else {
            chainsText += `<td align="center">${ orbit.diameterSum }</td>`;
            chainsText += `<td align="center">${ orbit.perimeter }</td>`;
            chainsText += `<td align="center" class="difference">${ orbit.tension() }</td>`;
            chainsText += `<td align="center">${ orbit.radiance }</td>`;
            chainsText += `<td align="center">${ orbit.jumpage }</td>`;
            chainsText += `<td align="center" class="difference">${ orbit.torsion() }</td>`;
        }

//        chainsText += `<td align="center">( ${ orbit.gcd }, ${ orbit.lcm } )</td>`;
//        chainsText += `<td align="center">${ formattedWeight( orbit.bias ) }</td>`;
        chainsText += "</tr>";
    }



    function factoredTableTotalBlock( value, trialFactors = [], totalClick, classList = [] ) {
        var block = `<td class="sum-total ${ classList.join(' ') }" onclick="${ totalClick }"><span class="sum-total ${ classList.join(' ') }">`;
        var v = value;
        const factors = [];
        [ ...trialFactors ]
            .reverse()
            .forEach( (x,i) => {
                const factor = gcd( v, x );
                if ( factor != 1 ) {
                    factors.push( factor );
                    v = v / factor;
                }
            } );
        if ( v != 1) {
            factors.push( v );
        }
        block += factors.reverse().reduce( (a,c) => (a?a + " * ":"") + c );
        block += "</span></td>";
        return block;
    }



    var tds = basePlane.box.sum;
    var tis = basePlane.box.indexSum;
    var tisGcd = gcd( maxIndex, tis );

    const fundamental = basePlane.fundamental;

    var tos = basePlane.totalNetOrderSpace;
    var tosGcd = gcd( fundamental, tos );
    var tosGcd2 =  gcd( fundamental,  tos / tosGcd );

    var tn2s = basePlane.totalNet2Space;

    chainsText += "<tr>";
    chainsText += "<td></td>";
    chainsText += `<td colspan='4' class='midi' style='display: ${midi?"":"none"};'></td>`;
    if ( jumps ) {
        chainsText += "<td colspan='1'></td>";
    }
    chainsText += "<td colspan='1'></td>";
    chainsText += `<td class="sum-total" onclick="${ totalClick }"><span class="sum-total">( ${ tds.join( ', ') } )</span></td>`;
    chainsText += `<td class="sum-total" onclick="${ totalClick }"><span class="sum-total">${ tis / tisGcd } * ${ tisGcd }</span></td>`;

    if ( tosGcd2 != 1 && ( tos / tosGcd / tosGcd2 != 1 ) ) {
        chainsText += `<td class="product-total" onclick="${ totalClick }"><span class="product-total">${ tos / tosGcd / tosGcd2  } * ${ tosGcd2 } * ${ tosGcd } ( * 2<sup>${ tn2s } )</sup></span></td>`;
    } else if ( tosGcd != 1 && tosGcd != tos) {
        chainsText += `<td class="product-total" onclick="${ totalClick }"><span class="product-total">${ tos / tosGcd  } * ${ tosGcd } ( * 2<sup>${ tn2s } )</sup></span></td>`;
    } else {
        chainsText += `<td class="product-total" onclick="${ totalClick }"><span class="product-total">${ tos } ( * 2<sup>${ tn2s } )</sup></span></td>`;
    }

    const trialCommonDenominators = [
        maxIndex,
        maxIndex + 1,
        ( (maxIndex % 2) == 0 ? ( maxIndex / 2 ) : ( ( maxIndex + 1 ) / 2 ) ),
    ];

    chainsText += "<td colspan='3'></td>";
    chainsText += factoredTableTotalBlock( basePlane.box.brilliance, trialCommonDenominators, totalClick );
    chainsText += factoredTableTotalBlock( basePlane.totalPerimeter, trialCommonDenominators, totalClick );
    chainsText += factoredTableTotalBlock( basePlane.tension(), trialCommonDenominators, totalClick, classList = ['difference' ]  );

    var radiance = basePlane.grossRadiance();
    var radianceRoot = (maxIndex % 2) == 0 ? ( maxIndex / 2 ) : ( ( maxIndex + 1 ) / 2 );
    var radianceGcd = gcd( radiance, radianceRoot );

    chainsText += factoredTableTotalBlock( radiance, [ radianceRoot, 2 ], totalClick );
    chainsText += factoredTableTotalBlock( basePlane.jumpage(), trialCommonDenominators, totalClick );
    chainsText += factoredTableTotalBlock( basePlane.torsion(), trialCommonDenominators, totalClick, classList = ['difference' ]  );


    chainsText += "</tr>";
    chainsText += "</table>";

    var legend = "Click on a cell to select/deselect or on a totals cell to draw all.";
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
