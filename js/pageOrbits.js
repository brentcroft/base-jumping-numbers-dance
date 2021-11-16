

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
            consoleLog( `Bad base control [b${i}] value: ${ e }, returning 1.` );
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
    const canonicalMessage = JSON.parse( JSON.stringify( message ) );
    const plotFrame = document.getElementById( containerId + "_plot_frame" );
    if (plotFrame ) {
        plotFrame.contentWindow.postMessage( canonicalMessage, "*" );
    }
    window.postMessage( canonicalMessage, "*" );
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

function showIndex( containerId, senderId  ) {
    const tableCells = document
        .getElementById( containerId + "_table" )
        .querySelectorAll( "td.box_index" );

    const [ sourceId, ...oids ] = senderId.split( "." );

    tableCells.forEach( tableCell => {
        const [ cId, ...oId ] = tableCell.id.split( "." );
        if ( !arrayContains( oId, oids ) ) {
            tableCell.classList.remove("selected");
        } else if ( tableCell.classList.contains( "selected" ) ) {
            tableCell.classList.remove("selected");
        } else {
            tableCell.classList.add("selected");
        }
    } );
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
        consoleLog( `No such checkbox: ${ controlId }` );
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

    const colourFields = [ "colour-red", "colour-green", "colour-blue", "colour-planeIndex", "colour-orbitIndex", "colour-minPixel" ];

    setNumberField( "colour-red", colourPointIndexDefault.bases[0] );
    setNumberField( "colour-green", colourPointIndexDefault.bases[1] );
    setNumberField( "colour-blue", colourPointIndexDefault.bases[2] );
    setNumberField( "colour-planeIndex", colourPointIndexDefault.planeIndex );
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




function isToggle( toggle ) {
    const toggleControl = document.getElementById( toggle + "Toggle" );
    if ( !toggleControl ) {
        throw `No such toggle control: ${ toggle }Toggle`;
    }
    return toggleControl.checked;
}


function updateJson() {

    consoleLog( `updateJson: id=${ basePlane.id }` );

    document
        .getElementById( "sample_cs_b_10_m_2_riffler" )
        .setAttribute( "max", `${ basePlane.orbits.length }` );

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
        //midi: isToggle('midi'),
        conj: isToggle('conj'),
        globalIds: isToggle('globalIds'),
        jumps: isToggle('jumps'),
        perms: !isToggle('coords'),
    };

    drawBasePlaneTable( tableArgs );

    insertX3DomFrame(
        'sample_cs_b_10_m_2',
        basePlane,
        framePage = "orbitsViewer.html?" + getCurrentQueryString( basePlane.key ) );
}

function selectIndexPlane() {

    const param = getControlValues();

    const planeIndex = param.planeIndex % indexedBox.indexPlanes.length;
    basePlane = indexedBox.indexPlanes[ planeIndex ];
    putBasePlane( basePlane.key, basePlane );

    consoleLog( `selectIndexPlane: id=${ basePlane.id }` );

    drawProductTable( basePlane, param.toggles );

    updateJson();
}

function rebuildIndexedBoxSummary() {

    document
            .getElementById( "planeIndex" )
            .max = indexedBox.indexPlanes.length - 1;

    document
            .getElementById("captionTex")
            .innerHTML = JSON.stringify( indexedBox.box.getJson() );

    document
            .getElementById( "summary" )
            .innerHTML = drawBoxSummaryTable( indexedBox, "sample_cs_b_10_m_2", 1 );
}

function updatePage() {

    consoleLog( `updatePage:` );

    const param = getControlValues();

    // TODO: global access
    indexedBox = new IndexedBox( param.bases, param );

    document
            .getElementById( "basesVolume" )
            .value = indexedBox.box.volume;

    rebuildIndexedBoxSummary();

    selectIndexPlane();

    distributeMessages( 'sample_cs_b_10_m_2', [
        { 'indexKey': param.planeIndex, 'sender': 'updatePage.' + (param.planeIndex || 1 ) },
        { 'basePlaneKey': basePlane.key, 'multi': isToggle('multi'), 'sender': 'updatePage.' + (param.id || 1 ) }
    ] );
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
        showHideAll( [ 'selectedPoint', 'summary', 'summaryControls' ] );
    }
    if ( param.toggles.indexComposer ) {
        showHideAll( [ 'indexComposer' ] );
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
    if ( param.toggles.orbitEditor ) {
        showHideAll( ['orbitEditor'] );
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

            consoleLog( `event.data: ${ JSON.stringify( data ) }` );

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
            } else if ( data.indexKey ) {

                const nextPlane = indexedBox.indexPlanes[ Number( data.indexKey ) ];

                if ( nextPlane ) {
                    document.getElementById( 'planeIndex' ).value = data.indexKey;

                    // swap global basePlane and register
                    // so child frames can access it.
                    basePlane = indexedBox.indexPlanes[ Number( data.indexKey ) ];
                    putBasePlane( basePlane.key, basePlane );

                    showIndex( "indexSummary", data.sender );
                    updateJson();
                } else {
                    consoleLog( `Select Index: No such index: ${ data.indexKey }` );
                }

            } else if ( data.basePlaneKey ) {
                const basePlane = getBasePlane( data.basePlaneKey );
                if ( data.sender ) {
                    showOrbit( "sample_cs_b_10_m_2", basePlane, data.sender, data.multi );
                } else {
                    showAllOrbits( "sample_cs_b_10_m_2", basePlane );
                }
            } else if ( data.colors ) {

                const [ bases, colorOrbitIndex, minPixel ] = data.colors;
                putBasePlane( "COLOR_ORBITS", new ColorBasePlane( bases, colorOrbitIndex, minPixel ) );
                selectIndexPlane();

            } else if ( data.toggleCentres ) {
            } else if ( data.toggleLines ) {
            } else if ( data.clearSelected ) {
                clearSelected();
            }
        }
    });
}