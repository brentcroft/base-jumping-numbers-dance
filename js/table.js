
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

    var { containerId, basePlane, cellClick, clearClick, totalClick, midi = false, conj = false, perms = false, jumps = false, globalIds = false } = tableArgs;

    consoleLog( `orbits.table: ${ containerId }: id=${ basePlane.id }` );


    const gid = globalIds
        ? ( point ) => point.id
        : ( point ) => point.at( basePlane.id ).id;

    const tableContainerId = containerId + "_table";
    const tableId = tableContainerId + "_data";

    var chainsText = "";
    chainsText += `<table id="${ tableId }" class='chain-details summary sortable'>`;

    var colIndex = 0;
    chainsText += "<tr>";
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>Id</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' class='midi' style='display: ${midi?"":"none"};'>Instrument</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' class='midi' style='display: ${midi?"":"none"};'>Channel</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' class='midi' style='display: ${midi?"":"none"};'>Percussion</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' class='midi' style='display: ${midi?"":"none"};'>Repeat</th>`;

    if ( jumps ) {
        chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' width='20%'>Jumps</th>`;
    }

    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ } )' width='30%'>Orbit</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' width='8%'>Point Sum</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, false, true )' width='8%'>Id Sum</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, false, true )' width='8%'>Order</th>`;
    //chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true )'>Harmonic</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )'>Line</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )'>Centre</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' title="The Euclidean Radiance is the sum of the squares of the (euclidean) distance between each coordinate and its reflection in the box centre.">E-Rad</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' title="The Euclidean Perimeter is the sum of the squares of the (euclidean) distance between adjacent coordinates in an orbit.">E-Per<sup>2</sup></th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' title="The Euclidean Radiance minus the sum of the squares of the Perimeters.">Tension</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' title="The Index Radiance is the sum of the index radiants (distance from the index centre) from each coordinate.">I-Rad</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' title="The Index Perimeter is the sum of the index distance between adjacent coordinates in an orbit.">I-Per</th>`;
    chainsText += `<th onclick='sortTable( "${ tableId }", ${ colIndex++ }, true, true )' title="The Index Radiance minus the Index Perimeter.">Torsion</th>`;
    chainsText += "</tr>";

    chainsText += "<tr>";
    chainsText += `<th align="center"><code>e</code></th>`;
    chainsText += `<th colspan='4' class='midi' style='display: ${midi?"":"none"};'></th>`;

    if ( jumps ) {
        chainsText += `<td align="center">[ ${ basePlane.identities.map( p => p.getJumps() ).join( C_SEP ) } ]</td>`;
    }

    if ( perms ) {
        const identities = basePlane.identities.map( p => "( " + p.points.map( gid ).join( ' ' ) + " )" ).join(" ");
        chainsText += `<th id="${ tableId }.e" align='center' onclick="${ clearClick }"><code>${ identities }</code></th>`;
    } else {
        const identities = basePlane.identities.map( p => "{ " + canonicalize( p.points[0].coord ) + " }" ).join(", ");
        chainsText += `<th id="${ tableId }.e" align='center' onclick="${ clearClick }"><code>${ identities }</code></th>`;
    }

    const volume = basePlane.box.volume;
    const maxIndex = volume - 1;

    const initialPointsSum = new Array( basePlane.box.rank ).fill( 0 );
    const identityPointsSum = basePlane.identities.reduce( (a, p) => addition( a, p.points[0].coord ), initialPointsSum );
    const identityIdSum = basePlane.identities.reduce( (a, p) => a + gid( p.points[0] ), 0 );
    const identityIdSumGcd = gcd( maxIndex, identityIdSum );

    chainsText += `<th id="${ tableId }.f" align='center' onclick="${ clearClick }"><code>(${ identityPointsSum })</code></th>`;
    chainsText += `<th id="${ tableId }.g" align='center' onclick="${ clearClick }"><code>${ identityIdSum / identityIdSumGcd } * ${ identityIdSumGcd }</code></th>`;

    chainsText += `<th align='center' onclick="${ clearClick }"><code>( 1<sup>${ basePlane.identities.length }</sup> )</code></th>`;
    //chainsText += "<th colspan='1'></th>";
    chainsText += `<th align='center' onclick="${ clearClick }"></th>`;
    chainsText += "<th colspan='1'></th>";

    chainsText += `<th colspan='1'><code>${ basePlane.identityEuclideanRadiance() }</code></th>`;
    chainsText += `<th colspan='1'><code>${ basePlane.identityEuclideanPerimeter() }</code></th>`;
    chainsText += `<th colspan='1' class="difference"><code>${ basePlane.identityEuclideanTension() }</code></th>`;

    chainsText += `<th colspan='1'><code>${ basePlane.identityIndexRadiance() }</code></th>`;
    chainsText += `<th colspan='1'><code>${ basePlane.identityIndexPerimeter() }</code></th>`;
    chainsText += `<th colspan='1' class="difference"><code>${ basePlane.identityIndexTorsion() }</code></th>`;

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
                var conjOrbit = orbits[ orbit.conjugate.index - 1 ];
                var conjOrbitIdSum = 0
                try {
                    conjOrbitIdSum = conjOrbit.getIdSum();
                } catch ( e ) {
                    throw `Error: ${ e }`;
                }

                var conjOrbitSpaceGcd = gcd( maxIndex, conjOrbitIdSum );
                if ( jumps ) {
                    chainsText += `<td align="center">[ ${ orbit.getJumps().join( C_SEP ) } ]<br/>[ ${ conjOrbit.getJumps().join( C_SEP ) } ]</td>`;
                }
                chainsText += `<td id="${ tableId }.${ orbit.index }.${ conjOrbit.index }" class='orbit' align='center' onclick="${ cellClick }">( ${ orbit.points.map( gid ).join( ' ' ) } )<br/>( ${ conjOrbit.points.map( gid ).join( ' ' ) } )</td>`;
                chainsText += `<td align="center">(${ orbit.sum.join( C_SEP ) })<br/>(${ conjOrbit.sum.join( C_SEP ) })</td>`;
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
            if ( orbit.isSelfConjugate() && conj ) {
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
                var conjOrbit = orbits[ orbit.conjugate.index - 1 ];
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

        if ( orbit.isSelfConjugate() && conj ) {
            chainsText += `<td align="center">${ orbit.order / 2 } * 2</td>`;
        } else if ( orbit.isFirstConjugate() && conj ) {
            chainsText += `<td align="center">${ orbit.order } * 2</td>`;
        } else {
            chainsText += `<td align="center">${ orbit.order } * 1</td>`;
        }

        //chainsText += `<td align="center">${ orbit.harmonic }</td>`;
        chainsText += `<td align="center">${ orbit.getLineRef() }</td>`;
        chainsText += `<td align="center">${ orbit.centreRef }</td>`;

        if ( orbit.isFirstConjugate() && conj ) {
            chainsText += `<td align="center">${ orbit.euclideanRadiance() * 2 }</td>`;
            chainsText += `<td align="center">${ orbit.euclideanPerimeter() * 2 }</td>`;
            chainsText += `<td align="center" class="difference">${ orbit.tension() * 2 }</td>`;
            chainsText += `<td align="center">${ orbit.indexRadiance() * 2 }</td>`;
            chainsText += `<td align="center">${ orbit.indexPerimeter() * 2 }</td>`;
            chainsText += `<td align="center" class="difference">${ orbit.torsion() * 2 }</td>`;
        } else {
            chainsText += `<td align="center">${ orbit.euclideanRadiance() }</td>`;
            chainsText += `<td align="center">${ orbit.euclideanPerimeter() }</td>`;
            chainsText += `<td align="center" class="difference">${ orbit.tension() }</td>`;
            chainsText += `<td align="center">${ orbit.indexRadiance() }</td>`;
            chainsText += `<td align="center">${ orbit.indexPerimeter() }</td>`;
            chainsText += `<td align="center" class="difference">${ orbit.torsion() }</td>`;
        }
        chainsText += "</tr>";
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

    const edgeGcd = gcd( basePlane.box.bases[0], basePlane.box.bases[basePlane.box.rank - 1] );

    const euclideanRadiance = basePlane.box.euclideanRadiance;
    const euclideanRadianceGcd = gcd( euclideanRadiance, basePlane.grossEuclideanPerimeter() );

    const trialCommonDenominators = [
        volume + 1,
        volume,
        ( (volume % 2) == 0 ? ( volume / 2 ) : ( ( volume + 1 ) / 2 ) ),
        euclideanRadianceGcd
    ];

    chainsText += "<td colspan='2'></td>";
    chainsText += factoredTableTotalBlock( basePlane.grossEuclideanRadiance(), [ ...trialCommonDenominators ], totalClick );
    chainsText += factoredTableTotalBlock( basePlane.grossEuclideanPerimeter(), [ ...trialCommonDenominators ], totalClick );
    chainsText += factoredTableTotalBlock( basePlane.grossEuclideanTension(), [ ...trialCommonDenominators ], totalClick, classList = ['difference' ]  );

    var indexRadiance = basePlane.grossIndexRadiance();
    var indexRadianceRoot = (maxIndex % 2) == 0 ? ( maxIndex / 2 ) : ( ( maxIndex + 1 ) / 2 );
    var indexRadianceGcd = gcd( indexRadiance, indexRadianceRoot );
    var torsionGcd = gcd( basePlane.grossIndexPerimeter(), basePlane.grossIndexTorsion() );

    chainsText += factoredTableTotalBlock( indexRadiance, [ indexRadianceRoot ], totalClick );
    chainsText += factoredTableTotalBlock( basePlane.grossIndexPerimeter(), [ torsionGcd ], totalClick );
    chainsText += factoredTableTotalBlock( basePlane.grossIndexTorsion(), [ torsionGcd ], totalClick, classList = ['difference' ]  );


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

function drawBoxSummaryTable( indexedBox, containerId, selectedIndex = -1 ) {

    consoleLog( `drawBoxSummaryTable: id=${ selectedIndex }` );


    indexedBox
            .indexPlanes
            .filter( index => !index.alias )
            .forEach( index => {
                try {
                    index.alias = new Formula( indexedBox, `${ index.getLabel() }^1` ).evaluate();
                } catch ( e ) {
                    consoleLog( `Error getting alias: ${ e }`);
                }
            } );

    const sep = ", ";
    const tableId = 'indexSummary_table';
    var columnId = 0;

    var dataHtml = "";
    dataHtml += `<table id='${ tableId }' class='chain-details summary sortable'><tr>`;
    dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Id</th>`;
    dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Type</th>`;
    dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Label</th>`;
    dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Alias</th>`;
    dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Place Perm. Pair</th>`;
    dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Places</th>`;
    dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Identity Equation</th>`;
    dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Monomial</th>`;
    dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Identities</th>`;
    dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Orbits</th>`;
    dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>Order</th>`;
    dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>E-Rad</th>`;
    dataHtml += `<th onclick='sortTable( "${ tableId }", ${ columnId++ }, true )'>I-Rad</th>`;
    dataHtml += "</tr><tr>";
    dataHtml += indexedBox
        .indexPlanes
        .map( index => {
            const clickAction = `distributeMessages( '${ containerId }', [ { 'indexKey': '${ index.id }', 'sender': 'index.${ index.id }' } ] )`;
            const selectedClass = selectedIndex == index.id ? "class='selected'" : "";
            const clickAttr = `id="index.${ index.id }" class="box_index" onclick="${ clickAction }" ${selectedClass}`;

            var rowHtml = `<td>${ index.id }</td>`;
            rowHtml += `<td align='center' ${clickAttr}>${ index.getType() }</td>`;
            rowHtml += `<td align='center' ${clickAttr}>${ index.getLabel() }</td>`;
            rowHtml += `<td align='center' ${clickAttr}>${ !index.alias || index.alias == index.getLabel() ? '' : index.alias }</td>`;
            rowHtml += `<td align='center' ${clickAttr}>[${ index.permReverse || '' }] - [${ index.permForward || '' }]</td>`;
            rowHtml += `<td align='center' ${clickAttr}>[${ index.placesReverse || '' }] - [${ index.placesForward || '' }]</td>`;
            rowHtml += `<td align='center' ${clickAttr}>${ index.getPlaneEquationTx() }</td>`;
            rowHtml += `<td align='center' ${clickAttr}>${ getCycleIndexMonomialHtml( index ) }</td>`;
            rowHtml += `<td align='center'>${ index.identities.length }</td>`;
            rowHtml += `<td align='center'>${ index.orbits.length }</td>`;
            rowHtml += `<td align='center'>${ index.fundamental }</td>`;
            rowHtml += `<td align='center'>${ index.grossEuclideanPerimeter() }</td>`;
            rowHtml += `<td align='center'>${ index.grossIndexPerimeter() }</td>`;
            return rowHtml;
        } )
        .join( "</tr><tr>" );
    dataHtml += "</tr></table>";
    return dataHtml;
}