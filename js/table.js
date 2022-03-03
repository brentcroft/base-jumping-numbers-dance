
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

function showHide( id, control ) {
    const force = control ? control.checked ? 1 : -1 : 0;
    var c = document.getElementById( id );
    if ( c ) {
        var s = c.style.display;
        if ( ( force && force != -1 ) || s != '' ) {
            c.style.display  =  '';
        } else {
            c.style.display  =  'none';
        }
    }
}

function showHideAll( ids = [], control ) {
    ids.forEach( id => showHide( id, control ) );
}


function sortTable( tableId, columnIndex, isNumber = false, isFraction = false, isProduct = false ) {
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
    const f = s.split( /\s*[\/\|,\*]\s*/ );
    f[0] = Number( f[0].trim() );

    if ( f[0] == 0 ) {
        return 0;
    } else if( f.length == 1 ) {
        return f[0];
    }

    f[1] = Number( f[1].trim() );

    return ( f[0] == f[1] ) ? 1 : ( f[0] / f[1] );
  }

  function Product( s ) {
    s = s.trim();
    if ( s.startsWith( "(" ) && s.endsWith( ")" ) ) {
        s = s.substring( 1, s.length - 1 );
        s = s.trim();
    }
    return s
        .split( /<br[\/]?>/ )
        .map( x => x
            .split( /\s*[\*]\s*/ )
            .map( x => Number( x.trim() ) )
            .reduce( (a,c) => a * c, 1 ) )
        .reduce( (a,c) => a + c, 0 );
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

              var xV = isNumber ? isFraction ? Fraction( xT ) : isProduct ? Product( xT ) : Number( xT ) :  xT;
              var yV = isNumber ? isFraction ? Fraction( yT ) : isProduct ? Product( yT ) : Number( yT ) :  yT;

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

function getCycleIndexMonomialTex( currentAction ) {
    var cimHtml = "";
    for (const [ k, e ] of Object.entries( currentAction.cycleIndexMonomial )) {
        if ( k > 1 ) {
            cimHtml = cimHtml + `a_{${ k }}^{${ e }}`;
        }
    }
    return cimHtml;
}

function getCycleIndexMonomialHtml( currentAction ) {
    var cimHtml = "";

    if ( currentAction.identities ) {
        cimHtml += `(<code>e</code><sup>${ currentAction.identities.length }</sup>) `;
    }

    for (const [ k, e ] of Object.entries( currentAction.cycleIndexMonomial )) {
        if ( k > 1 ) {
            cimHtml = cimHtml + `<i>a</i><sup>${ e }</sup><sub style='position: relative; left: -.5em;'>${ k }</sub>`;
        }
    }
    return cimHtml;
}


function renderCurrentActionTable( tableArgs ) {

    const {
        containerId, currentAction, cellClick, clearClick, totalClick, midi = false,
        conj = false, perms = false, jumps = false, globalIds = false,
        minCols = false, maxCols = false, medCols = false
    } = tableArgs;

    //consoleLog( `orbits.table: ${ containerId }: id=${ currentAction.id }` );

    const optionalColumns = [ "maxEPer", "maxIPer" ];

    if ( minCols ) {
        optionalColumns.splice( 0, optionalColumns.length );
    }
    if ( medCols ) {
        optionalColumns.push( "line", "centre"  );
    }
    if ( maxCols ) {
        optionalColumns.push( "tension", "torsion" );
    }

    const gid = globalIds
        ? ( point ) => point.id
        : ( point ) => point.at( currentAction.key ).id;

    const tableContainerId = containerId + "_table";
    const tableId = tableContainerId + "_data";

    var chainsText = "";
    chainsText += `<table id="${ tableId }" class='chain-details summary sortable'><caption>Cycles</caption>`;

    var colIndex = 0;
    chainsText += "<tr>";
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>Id</th>`;

    if ( jumps ) {
        chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' width='20%'>Jumps</th>`;
    }

    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' width='30%'>Orbit</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' width='8%'>Point Sum</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, false, true )' width='8%'>Id Sum</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, false, true )' width='8%'>Order</th>`;
    if ( optionalColumns.includes( "line" ) ) {
        chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )'>Line</th>`;
    }
    if ( optionalColumns.includes( "centre" ) ) {
        chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )'>Centre</th>`;
    }

    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' title="">E-Per<sup>2</sup></th>`;
    if ( optionalColumns.includes( "maxEPer" ) ) {
        chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' title="">Max <sub>(E-Per<sup>2</sup>)</sub></th>`;
    }
    if ( optionalColumns.includes( "tension" ) ) {
        chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' title="">Tension</th>`;
    }
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' title="">I-Per</th>`;
    if ( optionalColumns.includes( "maxIPer" ) ) {
        chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' title="">Max <sub>(I-Per)</sub></th>`;
    }
    if ( optionalColumns.includes( "torsion" ) ) {
        chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' title="">Torsion</th>`;
    }
    chainsText += "</tr>";

    chainsText += "<tr>";
    chainsText += `<th align="center"><code>e</code></th>`;
    //chainsText += `<th colspan='4' class='midi' style='display: ${midi?"":"none"};'></th>`;

    if ( jumps ) {
        chainsText += `<td align="center">[ ${ currentAction.identities.map( p => p.getJumps() ).join( C_SEP ) } ]</td>`;
    }

    if ( perms ) {
        const identities = currentAction.identities ? currentAction.identities.map( p => "( " + p.points.map( gid ).join( ' ' ) + " )" ).join(" ") : '-';
        chainsText += `<th id="${ tableId }.e" align='center' onclick="${ clearClick }"><code>${ identities }</code></th>`;
    } else {
        const identities = currentAction.identities ? currentAction.identities.map( p => "{ " + canonicalize( p.points[0].coord ) + " }" ).join(", ") : '-';
        chainsText += `<th id="${ tableId }.e" align='center' onclick="${ clearClick }"><code>${ identities }</code></th>`;
    }

    const volume = currentAction.box.volume;
    const maxIndex = volume - 1;

    const initialPointsSum = new Array( currentAction.box.rank ).fill( 0 );
    const identityPointsSum = currentAction.identities ? currentAction.identities.reduce( (a, p) => addition( a, p.points[0].coord ), initialPointsSum ) : 0;
    const identityIdSum = currentAction.identities ? currentAction.identities.reduce( (a, p) => a + gid( p.points[0] ), 0 ) : 0;
    const identityIdSumGcd = gcd( maxIndex, identityIdSum );

    chainsText += `<th id="${ tableId }.f" align='center' onclick="${ clearClick }"><code>(${ identityPointsSum })</code></th>`;
    chainsText += `<th id="${ tableId }.g" align='center' onclick="${ clearClick }"><code>${ identityIdSum / identityIdSumGcd } * ${ identityIdSumGcd }</code></th>`;

    chainsText += `<th align='center' onclick="${ clearClick }"><code>1</code></th>`;
    if ( optionalColumns.includes( "line" ) ) {
        chainsText += `<th align='center' onclick="${ clearClick }"></th>`;
    }
    if ( optionalColumns.includes( "centre" ) ) {
        chainsText += `<th align='center' onclick="${ clearClick }"></th>`;
    }
    chainsText += `<th><code>${ currentAction.identityEuclideanPerimeter() }</code></th>`;
    if ( optionalColumns.includes( "maxEPer" ) ) {
        chainsText += `<th class="minuend"><code>${ currentAction.identityEuclideanRadiance() }</code></th>`;
    }
    if ( optionalColumns.includes( "tension" ) ) {
       chainsText += `<th class="difference"><code>${ currentAction.identityEuclideanTension() }</code></th>`;
    }
    chainsText += `<th><code>${ currentAction.identityIndexPerimeter() }</code></th>`;
    if ( optionalColumns.includes( "maxIPer" ) ) {
        chainsText += `<th class="minuend"><code>${ currentAction.identityIndexRadiance() }</code></th>`;
    }
    if ( optionalColumns.includes( "torsion" ) ) {
        chainsText += `<th class="difference"><code>${ currentAction.identityIndexTorsion() }</code></th>`;
    }
    chainsText += "</tr>";

    const orbits = currentAction.orbits;
    if ( orbits ) {

        for ( var i = 0; i < orbits.length; i++ ) {

            var orbit = orbits[ i ];

            // ignore later partner
            if ( !orbit.isSelfPartner() && !orbit.isFirstConjugate() && conj) {
                continue;
            }


            var orbitSpace = (orbit.isSelfPartner() && conj)
                ? maxIndex * orbit.order / 2
                : maxIndex * orbit.order;

            var orbitIdSum = orbit.getIdSum();
            var orbitSpaceGcd = gcd( maxIndex, orbitIdSum );

            chainsText += `<tr>`;
            chainsText += `<td align="center">${ orbit.isSelfPartner() ? orbit.index : orbit.isFirstConjugate() ? orbit.index : "<sup>(" + orbit.index + ")</sup>" }</td>`;

            if ( perms ) {
                if ( orbit.isSelfPartner() && conj ) {
                    // self-conjugates pair off so must have even order
                    const orbitJumps = orbit.getJumps();

                    const scValenceFirst = orbitJumps.slice( 0, Math.ceil( orbitJumps.length / 2 ) );
                    const scValenceRest = orbitJumps.slice( Math.ceil( orbitJumps.length / 2 ), orbitJumps.length );
                    const scMembersFirst = orbit.points.slice( 0, Math.ceil( orbit.points.length / 2 ) );
                    const scMembersRest = orbit.points.slice( Math.ceil( orbit.points.length / 2 ), orbit.points.length );

                    if ( jumps ) {
                        chainsText += `<td align="center">[ ${ scValenceFirst.join( C_SEP ) } &#8600;<br/>${ scValenceRest.join( C_SEP ) } &#8598;]</td>`;
                    }
                    chainsText += `<td id="${ tableId }.${ orbit.index }" class='orbit' align='center' onclick="${ cellClick }">( ${ scMembersFirst.map( gid ).join( ' ' ) } &#8600;<br/>${ scMembersRest.map( gid ).join( ' ' ) } &#8598;)</td>`;
                    chainsText += `<td align="center">(${ orbit.sum.join( C_SEP ) })</td>`;
                    chainsText += `<td align="center">${ orbitIdSum / orbitSpaceGcd } * ${ orbitSpaceGcd }</td>`;
                } else if ( orbit.isFirstConjugate() && conj ) {
                    var conjOrbit = orbits[ orbit.partner.index - 1 ];
                    var conjOrbitIdSum = 0
                    if ( conjOrbit ) {
                        conjOrbitIdSum = conjOrbit.getIdSum();
                    } else {
                        consoleLog( `partner orbit not found: ${ orbit }` );
                        conjOrbitIdSum = 0;
                    }

                    var conjOrbitSpaceGcd = gcd( maxIndex, conjOrbitIdSum );
                    if ( jumps ) {
                        chainsText += `<td align="center">[ ${ orbit.getJumps().join( C_SEP ) } ]<br/>[ ${ conjOrbit.getJumps().join( C_SEP ) } ]</td>`;
                    }
                    chainsText += `<td id="${ tableId }.${ orbit.index }.${ conjOrbit ? conjOrbit.index : 0 }" class='orbit' align='center' onclick="${ cellClick }">( ${ orbit.points.map( gid ).join( ' ' ) } )<br/>( ${ conjOrbit ? conjOrbit.points.map( gid ).join( ' ' ) : -1 } )</td>`;
                    chainsText += `<td align="center">(${ orbit.sum.join( C_SEP ) })<br/>(${ conjOrbit ? conjOrbit.sum.join( C_SEP ) : -1 })</td>`;
                    chainsText += `<td align="center">${ orbitIdSum / orbitSpaceGcd } * ${ orbitSpaceGcd }<br/>${ conjOrbitIdSum / conjOrbitSpaceGcd } * ${ conjOrbitSpaceGcd }</td>`;
                } else {
                    if ( jumps ) {
                        chainsText += `<td align="center">[ ${ orbit.getJumps().join( C_SEP ) } ]</td>`;
                    }
                    chainsText += `<td id="${ tableId }.${ orbit.index }" class='orbit' align='center' onclick="${ cellClick }">( ${ orbit.points.map( gid ).join( ' ' ) } )</td>`;
                    chainsText += `<td align="center">(${ orbit.sum.join( C_SEP ) })</td>`;
                    chainsText += `<td align="center">${ orbitIdSum / orbitSpaceGcd } * ${ orbitSpaceGcd }</td>`;
                }
            } else {
                if ( orbit.isSelfPartner() && conj ) {
                    // self-conjugates pair off so must have even order
                    const orbitJumps = orbit.getJumps();;
                    var scValenceFirst = orbitJumps.slice( 0, Math.ceil( orbitJumps.length / 2 ) );
                    var scValenceRest = orbitJumps.slice( Math.ceil( orbitJumps.length / 2 ), orbitJumps.length );
                    var scMembersFirst = orbit.points.slice( 0, Math.ceil( orbit.points.length / 2 ) );
                    var scMembersRest = orbit.points.slice( Math.ceil( orbit.points.length / 2 ), orbit.points.length );

                    if ( jumps ) {
                        chainsText += `<td align="center">[ ${ scValenceFirst.join( C_SEP ) } &#8600;<br/>${ scValenceRest.join( C_SEP ) } &#8598;]</td>`;
                    }

                    chainsText += `<td id="${ tableId }.${ orbit.index }" class='orbit' align='center' onclick="${ cellClick }">${ scMembersFirst.join( C_SEP ) } &#8600;<br/>${ scMembersRest.join( C_SEP ) } &#8598;</td>`;
                    chainsText += `<td align="center">(${ orbit.sum.join( C_SEP ) })</td>`;
                    chainsText += `<td align="center">${ orbitIdSum / orbitSpaceGcd } * ${ orbitSpaceGcd }</td>`;
                } else if ( orbit.isFirstConjugate() && conj ) {
                    var conjOrbit = orbits[ orbit.partner.index - 1 ];
                    var conjOrbitIdSum = conjOrbit.getIdSum();
                    var conjOrbitSpaceGcd = gcd( maxIndex, conjOrbitIdSum );

                    if ( jumps ) {
                        chainsText += `<td align="center">[ ${ orbit.getJumps().join( C_SEP ) } ]<br/>[ ${ conjOrbit.getJumps().join( C_SEP ) } ]</td>`;
                    }
                    chainsText += `<td id="${ tableId }.${ orbit.index }.${ conjOrbit.index }" class='orbit' align='center' onclick="${ cellClick }">${ orbit.getMembers() }<br/>${ conjOrbit.getMembers() }</td>`;
                    chainsText += `<td align="center">(${ orbit.sum.join( C_SEP ) })<br/>(${ conjOrbit.sum.join( ', ' ) })</td>`;
                    chainsText += `<td align="center">${ orbitIdSum / orbitSpaceGcd } * ${ orbitSpaceGcd }<br/>${ conjOrbitIdSum / conjOrbitSpaceGcd } * ${ conjOrbitSpaceGcd }</td>`;
                } else {
                    if ( jumps ) {
                        chainsText += `<td align="center">[ ${ orbit.getJumps().join( C_SEP ) } ]</td>`;
                    }
                    chainsText += `<td id="${ tableId }.${ orbit.index }" class='orbit' align='center' onclick="${ cellClick }">${ orbit.getMembers() }</td>`;
                    chainsText += `<td align="center">(${ orbit.sum.join( C_SEP ) })</td>`;
                    chainsText += `<td align="center">${ orbitIdSum / orbitSpaceGcd } * ${ orbitSpaceGcd }</td>`;
                }
            }

            chainsText += `<td align="center">${ orbit.order }</td>`;

            if ( optionalColumns.includes( "line" ) ) {
                chainsText += `<td align="center">${ orbit.getLineRef() }</td>`;
            }
            if ( optionalColumns.includes( "centre" ) ) {
                chainsText += `<td align="center">${ orbit.centreRef }</td>`;
            }
            if ( orbit.isFirstConjugate() && conj ) {
                chainsText += `<td align="center">${ orbit.euclideanPerimeter() * 2 }</td>`;
                if ( optionalColumns.includes( "maxEPer" ) ) {
                    chainsText += `<td align="center" class="minuend">${ orbit.euclideanRadiance() * 2 }</td>`;
                }
                if ( optionalColumns.includes( "tension" ) ) {
                    chainsText += `<td align="center" class="difference">${ orbit.tension() * 2 }</td>`;
                }
                chainsText += `<td align="center">${ orbit.indexPerimeter() * 2 }</td>`;
                if ( optionalColumns.includes( "maxIPer" ) ) {
                    chainsText += `<td align="center" class="minuend">${ orbit.indexRadiance() * 2 }</td>`;
                }
                if ( optionalColumns.includes( "torsion" ) ) {
                    chainsText += `<td align="center" class="difference">${ orbit.torsion() * 2 }</td>`;
                }
            } else {
                chainsText += `<td align="center">${ orbit.euclideanPerimeter() }</td>`;
                if ( optionalColumns.includes( "maxEPer" ) ) {
                    chainsText += `<td align="center" class="minuend">${ orbit.euclideanRadiance() }</td>`;
                }
                if ( optionalColumns.includes( "tension" ) ) {
                    chainsText += `<td align="center" class="difference">${ orbit.tension() }</td>`;
                }
                chainsText += `<td align="center">${ orbit.indexPerimeter() }</td>`;
                if ( optionalColumns.includes( "maxIPer" ) ) {
                    chainsText += `<td align="center" class="minuend">${ orbit.indexRadiance() }</td>`;
                }
                if ( optionalColumns.includes( "torsion" ) ) {
                    chainsText += `<td align="center" class="difference">${ orbit.torsion() }</td>`;
                }
            }
            chainsText += "</tr>";
        }
    }

    function factoredTableTotalBlock( value, trialFactors = [], totalClick, classList = [] ) {
        var block = `<td class="sum-total ${ classList.join(' ') }" onclick="${ totalClick }"><span class="sum-total ${ classList.join(' ') }">`;

        const factors = [];
        if ( value == 0 ) {
            factors.push( value );
        } else {
            var v = value;
            [ ...trialFactors ]
                .reverse()
                .forEach( (x,i) => {
                    const factor = gcd( v, x );
                    if ( factor == x ) {
                        factors.push( factor );
                        v = v / factor;
                    }
                } );
            if ( v != 1) {
                factors.push( v );
            }
        }
        block += factors.reverse().reduce( (a,c) => ( a ? a + " * " : "" ) + c, 0 );
        block += "</span></td>";
        return block;
    }

    var tds = currentAction.box.sum;
    var tis = currentAction.box.indexSum;
    var tisGcd = gcd( maxIndex, tis );

    chainsText += "<tr>";
    chainsText += "<td></td>";
    if ( jumps ) {
        chainsText += "<td></td>";
    }
    chainsText += "<td></td>";
    chainsText += `<td class="sum-total" onclick="${ totalClick }"><span class="sum-total">( ${ tds.join( ', ') } )</span></td>`;
    chainsText += `<td class="sum-total" onclick="${ totalClick }"><span class="sum-total">${ tis / tisGcd } * ${ tisGcd }</span></td>`;

    const order = currentAction.order;
    chainsText += `<td class="product-total" onclick="${ totalClick }"><span class="product-total">${ order }</span></td>`;

    if ( optionalColumns.includes( "line" ) ) {
        chainsText += "<td></td>";
    }
    if ( optionalColumns.includes( "centre" ) ) {
        chainsText += "<td></td>";
    }

    const edgeGcd = gcd( currentAction.box.bases[0], currentAction.box.bases[currentAction.box.rank - 1] );

    const euclideanRadiance = currentAction.box.euclideanRadiance;
    const euclideanRadianceGcd = gcd( euclideanRadiance, currentAction.grossEuclideanPerimeter() );

    const trialCommonDenominators = [
        volume + 1,
        volume,
        ( (volume % 2) == 0 ? ( volume / 2 ) : ( ( volume + 1 ) / 2 ) ),
        euclideanRadianceGcd
    ];

    chainsText += factoredTableTotalBlock( currentAction.grossEuclideanPerimeter(), [ ...trialCommonDenominators ], totalClick );
    if ( optionalColumns.includes( "maxEPer" ) ) {
        chainsText += factoredTableTotalBlock( currentAction.grossEuclideanRadiance(), [ ...trialCommonDenominators ], totalClick, classList = ['minuend' ] );
    }
    if ( optionalColumns.includes( "tension" ) ) {
        chainsText += factoredTableTotalBlock( currentAction.grossEuclideanTension(), [ ...trialCommonDenominators ], totalClick, classList = ['difference' ]  );
    }

    var indexRadiance = currentAction.grossIndexRadiance();
    var indexRadianceRoot = (maxIndex % 2) == 0 ? ( maxIndex / 2 ) : ( ( maxIndex + 1 ) / 2 );
    var indexRadianceGcd = gcd( indexRadiance, indexRadianceRoot );
    var torsionGcd = gcd( currentAction.grossIndexPerimeter(), currentAction.grossIndexTorsion() );

    chainsText += factoredTableTotalBlock( currentAction.grossIndexPerimeter(), [ torsionGcd ], totalClick );
    if ( optionalColumns.includes( "maxIPer" ) ) {
        chainsText += factoredTableTotalBlock( indexRadiance, [ indexRadianceRoot ], totalClick, classList = ['minuend' ] );
    }
    if ( optionalColumns.includes( "torsion" ) ) {
        chainsText += factoredTableTotalBlock( currentAction.grossIndexTorsion(), [ torsionGcd ], totalClick, classList = ['difference' ]  );
    }

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
        consoleLog(e);
    }
}



function drawProductTable( index, toggles ) {

    document.getElementById( 'products' ).innerHTML = "";

    if ( !toggles.includes( 'products' ) ) {
        return;
    }

    const gid = toggles.includes( 'globalIds' )
        ? ( point ) => point.id
        : ( point ) => point.at( index.id ).id;

    const blanks = toggles.includes( 'productBlankIdentity' );
    const commuteIdentity = toggles.includes( 'productCommuteIdentity' );
    const tab = " ";

    const points = [
        index.getIdentityPoint(),
        ...index
            .orbits
            .flatMap( orbit => orbit.points )
    ];

    if ( !toggles.includes( 'productByOrbits' ) ) {
        points.sort( (a,b) => gid(a) - gid(b) );
    }

    const header = " *" + tab + points
        .map( a => String( gid(a) ).padStart( 2 ) )
        .join( tab );

    const columns = points
        .map( a => String( gid( a ) ).padStart( 2 ) + tab + points
            .map( b => {
                const c = index.convolve( a, b ) || ( commuteIdentity ? index.getIdentityPoint() : a );
                return ( blanks && gid( c ) == 0 )
                    ? "  "
                    : String( gid( c ) ).padStart( 2 );
            } )
            .join( tab )
        );

    const identityIds = index
        .identities
        .flatMap( i => i.points )
        .map( e => gid( e ) );

    document.getElementById( 'products' ).innerHTML = `<span class='summaryRight'>e = { ${ identityIds } }</span><br/><pre>${ header }\n${ columns.join('\n') }</pre>`;
}

function drawBoxSummaryTable( indexedBox, containerId, param ) {

    //consoleLog( `drawBoxSummaryTable: id=${ JSON.stringify( param ) }` );

    var monomialFilter = param.monomialFilter || 0;
    monomialFilter = Object.keys( monomialFilter ).length == 0
        ? 0
        : monomialFilter;

    var filterLayers = param.filterLayers || [];

    const selectedIndex = param.actionIndex || -1;
    const toggles = param.toggles || [];

    const optionalColumns = [ "stats", "monomial", "composition" ];

    if ( toggles.includes( "minCols" ) ) {
        optionalColumns.pop();
        optionalColumns.pop();
    }
    if ( toggles.includes( "medCols" ) ) {
        optionalColumns.pop();
        optionalColumns.pop();
        optionalColumns.pop();
        optionalColumns.pop();
        optionalColumns.push( "composition", "stats", "permutation-pair" );
    }
    if ( toggles.includes( "maxCols" ) ) {
        optionalColumns.push( "permutation-pair", "place-values-pair", "identity-equation" );
    }

    const sep = ", ";
    const tableId = 'indexSummary_table';
    var columnId = 0;

    var dataHtml = "";
    dataHtml += `<table id='${ tableId }' class='chain-details summary sortable'><caption>Actions</caption><tr>`;
    dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Id</th>`;
    dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Label</th>`;
    if ( optionalColumns.includes(  "composition" ) ) {
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Composition</th>`;
    }
    dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Symbolic</th>`;
    if ( optionalColumns.includes(  "permutation-pair" ) ) {
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Permutations</th>`;
    }
    if ( optionalColumns.includes(  "signature" ) ) {
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Signature</th>`;
    }
    if ( optionalColumns.includes(  "place-values-pair" ) ) {
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Place Values</th>`;
    }
    if ( optionalColumns.includes(  "identity-equation" ) ) {
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Identity Surface</th>`;
    }
    if ( optionalColumns.includes( "monomial" ) ) {
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Cycle Monomial</th>`;
    }

    if ( optionalColumns.includes(  "stats" ) ) {
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Fixed Points</th>`;
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Orbits</th>`;
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Order</th>`;
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>E-Per<sup>2</sup></th>`;
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>I-Per</th>`;
    } else {
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Order</th>`;
        dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Stats</th>`;
    }

    dataHtml += "</tr>\n<tr>";

    const monomialFilterMatches = ( m1, m2 ) => {
        const k1 = Object.keys( m1 );
        const k2 = Object.keys( m2 );
        if ( k1.length != k2.length ) {
            return false;
        } else {
            return k1.filter( k => m1[k] == m2[k] ).length == k1.length;
        }
    };


    var totalRows = 0;

    const boxActions = [ ...indexedBox.boxActions ];

    if ( toggles.includes( "showCompositions" ) ) {
        boxActions.push( ...Object.values( indexedBox.compositeActions ) );
    }

    dataHtml += boxActions
        .filter( actionElement => !( actionElement instanceof PlaceValuesAction )
                                    || filterLayers.length == 0
                                    || filterLayers.includes( actionElement.pair.layer ) )
        .filter( actionElement => !monomialFilter
                                    || monomialFilterMatches( actionElement.cycleIndexMonomial, monomialFilter ) )
        .map( actionElement => {

            totalRows++;

            const clickAction = `distributeMessages( '${ containerId }', [ { 'indexKey': '${ actionElement.id }', 'sender': 'actionElement.${ actionElement.id }' } ] )`;
            const selectedClass = selectedIndex == actionElement.id ? "class='selected'" : "";
            const clickAttr = `id="actionElement.${ actionElement.id }" class="box_index" onclick="${ clickAction }" ${selectedClass}`;

            const actionAlias = ( actionElement.alias && actionElement.alias.length > 0 )
                ? actionElement.alias.join( " = " )
                : "";

            var rowHtml = `<td>${ actionElement.id }</td>`;
            rowHtml += `<td align='center' ${clickAttr}>${ actionElement.getLabel() }</td>`;
            if ( optionalColumns.includes(  "composition" ) ) {
                rowHtml += `<td align='center' ${clickAttr}>${ actionElement.alias }</td>`;
            }
            rowHtml += `<td align='center' ${clickAttr}>${ actionElement.symbols.join( " = " ) }</td>`;
            if ( actionElement.pair ) {
                const pair = actionElement.pair;
                if ( optionalColumns.includes(  "permutation-pair" ) ) {
                    rowHtml += `<td align='center' ${clickAttr}>${ pair }</td>`;
                }
                if ( optionalColumns.includes(  "signature" ) ) {
                    rowHtml += `<td align='center' ${clickAttr}>${ pair.signature }</td>`;
                }
                if ( optionalColumns.includes(  "place-values-pair" ) ) {
                    rowHtml += `<td align='center' ${clickAttr}>[${ pair.leftPlaceValues || '' }], [${ pair.rightPlaceValues || '' }]</td>`;
                }
            } else {
                if ( optionalColumns.includes(  "permutation-pair" ) ) {
                    rowHtml += `<td align='center' ${clickAttr}></td>`;
                }
                if ( optionalColumns.includes(  "signature" ) ) {
                    rowHtml += `<td align='center' ${clickAttr}></td>`;
                }
                if ( optionalColumns.includes(  "place-values-pair" ) ) {
                    rowHtml += `<td align='center' ${clickAttr}></td>`;
                }
            }
            if ( optionalColumns.includes(  "identity-equation" ) ) {
                rowHtml += `<td align='center' ${clickAttr}>${ actionElement.getPlaneEquationTx() }</td>`;
            }
            if ( optionalColumns.includes( "monomial" ) ) {
                rowHtml += `<td align='center' ${clickAttr}>${ getCycleIndexMonomialHtml( actionElement ) }</td>`;
            }

            if ( optionalColumns.includes(  "stats" ) ) {

                rowHtml += `<td align='center' ${clickAttr}>${ actionElement.identities ? actionElement.identities.length : '-' }</td>`;
                rowHtml += `<td align='center' ${clickAttr}>${ actionElement.orbits ? actionElement.orbits.length : '-' }</td>`;
                rowHtml += `<td align='center' ${clickAttr}>${ actionElement.order }</td>`;
                rowHtml += `<td align='center' ${clickAttr}>${ actionElement.grossEuclideanPerimeter() }</td>`;

                const gip = actionElement.grossIndexPerimeter();
                const gipGcd = actionElement.pair
                    ? gcd( actionElement.pair.echo, actionElement.grossIndexPerimeter() )
                    : 1;

                if ( gipGcd > 1 ) {
                    rowHtml += `<td align='center' ${clickAttr}>${ gip / actionElement.pair.echo } * ${ gipGcd }</td>`;
                } else {
                    rowHtml += `<td align='center' ${clickAttr}>${ gip }</td>`;
                }
            } else {
                rowHtml += `<td align='center' ${clickAttr}>${ actionElement.order }</td>`;
                if ( toggles.includes( "ignoreIndexPerimeters" ) ) {
                    rowHtml += `<td align='center' ${clickAttr}>${ actionElement.grossEuclideanPerimeter() }</td>`;
                } else {
                    rowHtml += `<td align='center' ${clickAttr}>${ actionElement.grossEuclideanPerimeter() } ( ${ actionElement.grossIndexPerimeter() } )</td>`;
                }
            }
            return rowHtml;
        } )
        .join( "</tr><tr>" );
    dataHtml += "</tr></table>";
    dataHtml += `<span class="summaryLeft">Total rows: ${ totalRows }</span>`;
    return dataHtml;
}