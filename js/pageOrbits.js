

function getParam( defaultValues ) {

    var bases = defaultValues.bases;
    const toggles = defaultValues.toggles;

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const basesParam = urlParams.get('bases');
    if ( basesParam ) {
        bases = basesParam
            .split(',')
            .map( x => Number( x ) );
    }

    const indexParam = urlParams.get('planeIndex');
    const planeIndex = ( indexParam ) ? Number( indexParam ): defaultValues.planeIndex;

    const toggleParam = urlParams.get('toggles');
    if ( toggleParam ) {
        Object
            .keys( toggles )
            .forEach( k => toggles[k] = 0 );
        toggleParam
            .split(',')
            .forEach( x => toggles[x] = 1 );
    }

    return {
        planeIndex: planeIndex,
        id: urlParams.get('id'),
        bases: bases,
        orbits: urlParams.get('orbits'),
        toggles: toggles
    };
}

function getControlValues() {
    const planeIndex = Number( document.getElementById( 'planeIndex' ).value );
    const baseCount = Number( document.getElementById( 'bases' ).value );
    const emptyBases = new Array( baseCount ).fill( 0 );
    const bases = emptyBases.map( (x,i) => {
        try {
            return Number( document.getElementById( `b${i}` ).value );
        } catch ( e ) {
            console.log( `Bad base control [b${i}] value: ${ e }, returning 1.` );
            return 1;
        }
    } );

    const currentToggles = Object
            .keys( toggleKeys )
            .filter( k => isToggle( k ) );

    return {
        planeIndex: planeIndex,
        bases: bases,
        toggles: currentToggles
    };
}

function getCurrentQueryString( basePlaneKey, bases, planeIndex ) {
    const values = getControlValues();

    if ( !bases ) {
        bases = values.bases;
    }
    if ( !planeIndex ) {
        planeIndex = values.planeIndex;
    }

    return (basePlaneKey ? "id=" + basePlaneKey + "&" : "") + `bases=${ bases.join(',') }&planeIndex=${ values.planeIndex }&toggles=${ values.toggles.join( ',' ) }`;
}

function reopenWithArgs() {
    window.location.href = "?" + getCurrentQueryString(  );
}

function reopenWithLeftRotatedArgs() {
    const bases = getControlValues().bases;
    bases.push(bases.shift());
    window.location.href = "?" + getCurrentQueryString( null, bases );
}

function reopenWithRightRotatedArgs() {
    const bases = getControlValues().bases;
    bases.reverse();
    bases.push(bases.shift());
    bases.reverse();
    window.location.href = "?" + getCurrentQueryString( null, bases );
}


function reopenWithReversedArgs() {
    const bases = getControlValues().bases;
    bases.reverse();
    window.location.href = "?" + getCurrentQueryString( null, bases );
}


function distributeMessage( containerId, message = {} ) {
    const plotFrame = document.getElementById( containerId + "_plot_frame" );
    plotFrame.contentWindow.postMessage( message, "*" );
    window.postMessage( message, "*" );
}

function distributeMessages( containerId, messages = [] ) {
    messages.forEach( message => distributeMessage( containerId, message) );
}

function getSelectedOrbitIds( tableId  ) {

    const tableCells = document
        .getElementById( tableId )
        .querySelectorAll( "td.orbit" );

    const selectedOrbitIds = [];

    tableCells.forEach( tableCell => {
        const [ _, ...oIds ] = tableCell.id.split( "." );
        if ( tableCell.classList.contains( "selected" ) ) {
            oIds
                .forEach( oId => selectedOrbitIds.push( oId ) );
        }
    } )

    return selectedOrbitIds;
}

function showOrbit( containerId, basePlane, senderId, multi  ) {
    const tableCells = document
        .getElementById( containerId + "_table" )
        .querySelectorAll( "td.orbit" );

    const [ sourceId, ...oids ] = senderId.split( "." );

    tableCells.forEach( tableCell => {
        const [ cId, ...oId ] = tableCell.id.split( "." );
        if ( !arrayContains( oId, oids ) ) {
            if ( !(multi && tableCell.classList.contains( "selected" ) ) ) {
               tableCell.classList.remove("selected");
            }
        } else if ( tableCell.classList.contains( "selected" ) ) {
            tableCell.classList.remove("selected");
        } else {
            tableCell.classList.add("selected");
        }
    } );

    document
        .getElementById( containerId + "_riffler" )
        .value = oids[0];
}

function showAllOrbits( containerId, basePlane ) {
    showOrbit( containerId, basePlane, "." );
}

function toggleSelected( item ) {
    if ( item.classList.contains('selected') ) {
        item.classList.remove('selected');
    } else {
        item.classList.add('selected');
    }
}

function clearSelected() {
    document
        .querySelectorAll( ".selected" )
        .forEach( item => item.classList.remove('selected') );
}


function initialiseCheckBox( controlId, checked ) {
    const control = document.getElementById( controlId );
    if (!control) {
        console.log( `No such checkbox: ${ controlId }` );
    }
    control.checked = checked;
}


function applyExpression( control, id, size, incrementPlaces = true ) {

    function maybeIncrementPlaces( control, id ) {
        if ( Number( control.value ) >= Number( control.max ) ) {
            control.value = 0;
            const nextId = (id+1) % size;
            const nextPlace = document.getElementById( "o" + nextId );
            nextPlace.value = Number( nextPlace.value ) + 1;
            maybeIncrementPlaces( nextPlace, nextId );
        } else if ( Number( control.value ) < 0 ) {
            control.value = Number( control.max ) - 1;
            const nextId = (id+1) % size;
            const nextPlace = document.getElementById( "o" + nextId );
            nextPlace.value = Number( nextPlace.value ) - 1;
            maybeIncrementPlaces( nextPlace, nextId );
        }
    }

    if ( incrementPlaces ) {
        maybeIncrementPlaces( control, id );
    }

    var locus = basePlane
        .orbits
        .map( (x, i) => Number( document.getElementById( "o" + i ).value ) );

    distributeMessage( 'sample_cs_b_10_m_2', { basePlaneKey: basePlane.key, locus: locus } );
}


function initialiseExpressor( basePlane, redraw = true ) {
    var expressor = document.getElementById( 'expressor' );
    while ( expressor.firstChild ) {
        expressor.removeChild( expressor.lastChild );
    }
    if ( redraw ) {
        expressor.appendChild( reify( "hr" ) );
        expressor.appendChild( reify(
                "span",
                {},
                [],
                [ s => s.innerHTML = "phase: " ]
            )
        );
        basePlane.orbits.forEach( (orbit, i) => {
            expressor.appendChild(
                reify(
                    "input",
                    { "type": "number", "class": "colourField", "min": -1, "max": orbit.order, "id": ("o" + i), "value":0 },
                    [],
                    [ ( control ) => control.onchange = () => applyExpression( control, i, basePlane.orbits.length ) ]
                )
            );
        } );
    }
}

function initialiseBases( bases ) {
    document.getElementById( "bases" ).value = bases.length;
    const container = document.getElementById( "baseValues" );
    while (container.firstChild ) {
        container.removeChild( container.lastChild );
    }

    bases.forEach( (x,i) => {
        if ( i > 0 ) {
            container
                .appendChild(
                    reify(
                        "span",
                        {},
                        [],
                        [ (span) => span.innerHTML = " x " ]
                    ) );
        }
        container
            .appendChild(
                reify(
                    "input",
                    { "id": "b" + i, "type": "number", "min": 1 },
                    [],
                    [
                        (control) => control.value = x,
                        (control) => control.onchange = updatePage
                    ] ) );
    } );
}

function initialiseControls( param ) {

    initialiseBases( param.bases );

    Object
        .entries(param.toggles)
        .forEach( ([key, value]) => {
            initialiseCheckBox( `${ key }Toggle`, Boolean( value ) );
        } );

    function setNumberField( id, value ) {
        document.getElementById( id ).value = value;
    }

    setNumberField( "planeIndex", param.planeIndex );

    const colourFields = [ "colour-red", "colour-green", "colour-blue", "colour-orbitIndex", "colour-minPixel" ];

    setNumberField( "colour-red", colourPointIndexDefault.bases[0] );
    setNumberField( "colour-green", colourPointIndexDefault.bases[1] );
    setNumberField( "colour-blue", colourPointIndexDefault.bases[2] );
    setNumberField( "colour-orbitIndex", colourPointIndexDefault.orbitIndex );
    setNumberField( "colour-minPixel", colourPointIndexDefault.minPixel );
    setNumberField( "colour-maxPixel", colourPointIndexDefault.maxPixel );

}

function openPlot() {
    const basePlane = getBasePlane( basePlaneKey );
    openX3DomFrame( 'sample_cs_b_10_m_2', basePlane );
}

function setMidiRepeats( orbitId, repeats ) {
    var orbit = basePlane.orbits.filter( x => x.index == orbitId );
    if ( orbit ) {
        orbit[0].midi.repeats = repeats;

        updateJson();
    }
}

function setMidiChannel( orbitId, channel ) {
    var orbit = basePlane.orbits.filter( x => x.index == orbitId );
    if ( orbit ) {
        orbit[0].midi.instrument = isPercussion ? 0 : instrument;
        if ( orbit[0].midi.percussion == 0 ) {
            orbit[0].midi.channel = channel;
        }

        updateJson();
    }
}

function setMidiInstrument( orbitId, instrument, isPercussion = false ) {
    var orbit = basePlane.orbits.filter( x => x.index == orbitId );
    if ( orbit ) {
        orbit[0].midi.instrument = isPercussion ? 0 : instrument;
        orbit[0].midi.percussion = isPercussion ? instrument : 0;

        if ( isPercussion ) {
            orbit[0].midi.channel = 9;
        } else if ( orbit[0].midi.channel == 9 ){
            orbit[0].midi.channel = 0;
        }

        updateJson();
    }
}


function drawProductTable( index, toggles ) {

    document.getElementById( 'products' ).innerHTML = "";

    if ( !toggles.includes( 'products' ) ) {
        return;
    }

    const blanks = toggles.includes( 'productBlankIdentity' );
    const commuteIdentity = toggles.includes( 'productCommuteIdentity' );
    const tab = " ";

    const identityIds = index
        .identities
        .flatMap( i => i.coords )
        .map( e => index.pointAt(e).id );

    const points = [
        index.getIdentityPoint(),
        ...index
            .orbits
            .flatMap( orbit => orbit.coords )
    ];

    if ( !toggles.includes( 'productByOrbits' ) ) {
        points.sort( (a,b) => index.pointAt(a).id - index.pointAt(b).id );
    }

    const header = " *" + tab + points
        .map( a => String( index.pointAt(a).id ).padStart( 2 ) )
        .join( tab );

    const columns = points
        .map( a => String( index.pointAt(a).id ).padStart( 2 ) + tab + points
            .map( b => {
                const c = index.convolve( a, b ) || ( commuteIdentity ? index.getIdentityPoint() : a );
                const cid = index.pointAt(c).id;
                return ( blanks && cid == 0 )
                    ? "  "
                    : String( cid ).padStart( 2 );
            } )
            .join( tab )
        );

    document.getElementById( 'products' ).innerHTML = `Products: <span class='toolbar'>0 = [${ identityIds }]</span><br/><pre>${ header }\n${ columns.join('\n') }</pre>`;
}




function isToggle( toggle ) {
    const toggleControl = document.getElementById( toggle + "Toggle" );
    if ( !toggleControl ) {
        throw `No such toggle control: ${ toggle }Toggle`;
    }
    return toggleControl.checked;
}


function updateJson() {

    document
        .getElementById( "sample_cs_b_10_m_2_riffler" )
        .setAttribute( "max", `${ basePlane.orbits.length - 1 }` );

    document
            .getElementById("orbit-system-data-text-area")
            .innerHTML = JSON.stringify( basePlane.getJson(), null, 2 );

    var cellClick = "distributeMessages( 'sample_cs_b_10_m_2', [ { 'basePlaneKey': basePlane.key, 'multi': isToggle('multi'), 'sender': this.id } ] )";
    var clearClick = "distributeMessages( 'sample_cs_b_10_m_2', [ { 'basePlaneKey': basePlane.key, 'multi': false, 'sender': this.id } ] )";
    var totalClick = "distributeMessages( 'sample_cs_b_10_m_2', [ { 'basePlaneKey': basePlane.key } ] )";

    const tableArgs = {
        containerId: "sample_cs_b_10_m_2",
        basePlane: basePlane,
        cellClick: cellClick,
        clearClick: clearClick,
        totalClick: totalClick,
        midi: isToggle('midi'),
        conj: isToggle('conj'),
        jumps: isToggle('jumps'),
        perms: !isToggle('coords'),
    };

    drawBasePlaneTable( tableArgs );

    insertX3DomFrame(
        'sample_cs_b_10_m_2',
        basePlane,
        framePage = "orbitsViewer.html?" + getCurrentQueryString( basePlane.key ) );
}

function updatePlane() {

    const param = getControlValues();

    const planeIndex = param.planeIndex % indexedBox.indexPlanes.length;

    document
            .getElementById( "summary" )
            .innerHTML = indexedBox.getDataHtml( planeIndex );


    basePlane = indexedBox.indexPlanes[ planeIndex ];
    putBasePlane( basePlane.key, basePlane );

    //initialiseExpressor( basePlane, isToggle( 'locus' ) );

    document
            .getElementById("captionTex")
            .innerHTML = basePlane.getCaptionHtml();

    drawProductTable( basePlane, param.toggles );

    updateJson();
}

function updatePage() {

    const param = getControlValues();

    // TODO: global access
    indexedBox = new IndexedBox( param.bases, param );

    document
            .getElementById( "basesVolume" )
            .value = indexedBox.box.volume;

    document
            .getElementById( "planeIndex" )
            .max = indexedBox.indexPlanes.length - 1;

    updatePlane();
}

function initPage( urlParam = true ) {

    const cv = getControlValues();

    if ( urlParam ) {
        cv.toggles = { ...toggleKeys };
    } else {
        const toggles = cv.toggles;
        cv.toggles = {};
        Object
            .keys( toggleKeys )
            .forEach( k => cv.toggles[k] = toggles.includes( k ) ? 1 : 0 );
    }

    const param = urlParam
        ? getParam( cv )
        : cv;

    initialiseControls( param );


    const [ bases, orbitIndex, minPixel ] = getColorConfiguration();
    putBasePlane( "COLOR_ORBITS", new ColorBasePlane( bases, orbitIndex, minPixel ) );

    updatePage();

    if ( !urlParam ) {
        return;
    }

    if ( param.toggles.summary ) {
        showHideAll( [ 'selectedPoint', 'summary' ] );
    }
    if ( param.toggles.table ) {
        showHideAll(['tableControls','sample_cs_b_10_m_2_table']);
    }
    if ( param.toggles.chart ) {
        showHideAll(['chartControls','sample_cs_b_10_m_2_plot','sample_cs_b_10_m_2_plot_legend','sample_cs_b_10_m_2_riffler']);
    }
    if ( param.toggles.more ) {
        showHideAll( ['more-options'] );
    }
    if ( param.toggles.editor ) {
        showHideAll( ['editor'] );
    }
    if ( param.toggles.colours ) {
        showHideAll( ['colours'] );
    }
    if ( param.toggles.midi ) {
        showHideCSS( '.midi' );
    }

    if ( param.toggles.products ) {
        showHideAll( ['productsTable'] );
    }

    selectedPoints = [];

    window.addEventListener( "message", ( event ) => {
        if ( event.data ) {
            var data = event.data;

            //console.log( `data: ${ JSON.stringify( data ) }` );

            if ( data.basis ) {
                if ( "point" == data.basis ) {
                    const matchingPoints = selectedPoints.filter( x => x.coord.every( (v,i) => v === data.json.coord[i] ) );
                    if ( matchingPoints.length > 0 ) {
                        matchingPoints.forEach( x => selectedPoints.splice( selectedPoints.indexOf( x ), 1 ) );
                    } else if ( selectedPoints.length > 1 ) {
                        selectedPoints[0] = selectedPoints[1];
                        selectedPoints[1] = data.json;
                    } else {
                        selectedPoints.push( data.json );
                    }

                    const selectedPointIds = document.getElementById( "selectedPointIds" );
                    selectedPointIds.value = selectedPoints.map( p => p.indexes[basePlane.id].id ).join( ", ");

                    distributeMessages(
                        'sample_cs_b_10_m_2', [
                            { 'basis': 'selected-points', 'points': selectedPoints }
                        ] );
                }

            } else if ( data.basePlaneKey ) {
                const basePlane = getBasePlane( data.basePlaneKey );
                if ( event.data.sender ) {
                    showOrbit( "sample_cs_b_10_m_2", basePlane, data.sender, data.multi );
                } else {
                    showAllOrbits( "sample_cs_b_10_m_2", basePlane );
                }
            } else if ( data.colors ) {

                const [ bases, colorOrbitIndex, minPixel ] = data.colors;
                putBasePlane( "COLOR_ORBITS", new ColorBasePlane( bases, colorOrbitIndex, minPixel ) );
                updatePlane();

            } else if ( data.toggleCentres ) {
            } else if ( data.toggleLines ) {
            } else if ( data.clearSelected ) {
                clearSelected();
            }
        }
    });

    if ( param.id ) {
        distributeMessages( 'sample_cs_b_10_m_2', [ { 'basePlaneKey': basePlane.key, 'multi': isToggle('multi'), 'sender': 'dummy.' + param.id } ] );
    }
}