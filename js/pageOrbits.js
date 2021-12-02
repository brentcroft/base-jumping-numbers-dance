

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

    const indexParam = urlParams.get('actionIndex');
    const actionIndex = ( indexParam ) ? Number( indexParam ): defaultValues.actionIndex;

    const toggleParam = urlParams.get('toggles');
    if ( toggleParam ) {
        Object
            .keys( toggles )
            .forEach( k => toggles[k] = 0 );
        toggleParam
            .split(',')
            .forEach( x => toggles[x] = 1 );
    }

    var layers = defaultValues.actionLayers;
    const layerParam = urlParams.get('layers');
    if ( layerParam ) {
        layers = layerParam
            .split(',')
            .map( x => Number( x ) );
    }

    return {
        actionIndex: actionIndex,
        actionLayers: layers,
        id: urlParams.get('id'),
        bases: bases,
        orbits: urlParams.get('orbits'),
        toggles: toggles
    };
}

function getControlValues() {
    const actionIndex = Number( document.getElementById( 'actionIndex' ).value );
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

    const monomialFilterEnabled = document.getElementById( 'monomialFilterEnabled' ).checked;
    const monomialFilter = monomialFilterEnabled
        ? JSON.parse( document.getElementById( 'monomialFilter' ).value )
        : 0;

    const actionLayers = [];
    document
            .querySelectorAll( ".box-layer-control" )
            .forEach( blc => blc.checked ? actionLayers.push( Number( blc.value ) ): 0 );

    const currentToggles = Object
            .keys( toggleKeys )
            .filter( k => isToggle( k ) );

    return {
        actionIndex: actionIndex,
        actionLayers: actionLayers,
        monomialFilter: monomialFilter,
        bases: bases,
        toggles: currentToggles
    };
}

function getCurrentQueryString( basePlaneKey, bases, actionIndex ) {
    const values = getControlValues();

    if ( !bases ) {
        bases = values.bases;
    }
    if ( !actionIndex ) {
        actionIndex = values.actionIndex;
    }

    return `id=${ basePlaneKey }&bases=${ bases.join(',') }&actionIndex=${ values.actionIndex }&layers=${ values.actionLayers }&toggles=${ values.toggles.join( ',' ) }`;
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

function screenshot( containerId ) {
    const plotFrameId = containerId + "_plot_frame";
    const plotFrame = document.getElementById( plotFrameId );
    if (plotFrame ) {
        plotFrame.contentWindow.screenshot();
    } else {
        throw new Error( `Can't find plotFrame: ${ plotFrameId }` );
    }
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
    const table = document.getElementById( containerId + "_table" )

    const tableCells = table.querySelectorAll( "td.box_index" );

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

    setNumberField( "actionIndex", param.actionIndex );

    const colourFields = [ "colour-red", "colour-green", "colour-blue", "colour-actionIndex", "colour-orbitIndex", "colour-minPixel" ];

    setNumberField( "colour-red", colourPointIndexDefault.bases[0] );
    setNumberField( "colour-green", colourPointIndexDefault.bases[1] );
    setNumberField( "colour-blue", colourPointIndexDefault.bases[2] );
    setNumberField( "colour-actionIndex", colourPointIndexDefault.actionIndex );
    setNumberField( "colour-orbitIndex", colourPointIndexDefault.orbitIndex );
    setNumberField( "colour-minPixel", colourPointIndexDefault.minPixel );
    setNumberField( "colour-maxPixel", colourPointIndexDefault.maxPixel );
}

function openPlot() {
    const basePlane = getBasePlane( basePlaneKey );
    openX3DomFrame( 'sample_cs_b_10_m_2', basePlane );
}


function processFormula( compositionFormulasText ) {

    document.getElementById( 'summaryEditorResult' ).innerHTML = "";
    document.getElementById( 'summaryEditorErrorMessage' ).innerHTML = "";

    const compositionFormulas = compositionFormulasText || document.getElementById( 'compositionFormulas' ).value;
    const compositionFormulaLines = ( compositionFormulas )
        .split( /\s*;\s*/ )
        .map( ft => ft.trim() )
        .filter( ft => ft.length > 0 )
        .filter( ft => !ft.startsWith( '#' ) );

    if ( compositionFormulaLines.length > 0 ) {
        try {
            function dump( index ) {
                const idxText = index.idx.map( p => String( p.id ).padStart( 2, ' ' ) ).join( ", " );
                const dixText = index.dix.map( p => String( p.id ).padStart( 2, ' ' ) ).join( ", " );
                return `\nidx: ${ idxText }\ndix: ${ dixText }`;
            }

            function label( index, key ) {
                index.label = key;
                return index;
            }

            const results = compositionFormulaLines
                .map( ft => new Formula( indexedBox, ft ) )
                .map( f => {
                    try {
                        const result = f.evaluate( { dump: dump, label: label } );
                        return [ f, result ];
                    } catch ( e ) {
                        consoleLog( e );
                        return [ f, e ];
                    }
                } );

            const report = results.map( r => `${ r[0] } = ${ r[1] }` ).join( "\n" );
            document.getElementById( 'summaryEditorResult' ).innerHTML = `${ report }`;

        } catch ( e ) {
            document.getElementById( 'summaryEditorErrorMessage' ).innerHTML = `<pre>${ e }</pre>`;
            consoleLog( e );
        }

        rebuildIndexedBoxSummary( indexedBox, getControlValues() );
    }
}



function isToggle( toggle ) {
    const toggleControl = document.getElementById( toggle + "Toggle" );
    if ( !toggleControl ) {
        throw new Error( `No such toggle control: ${ toggle }Toggle` );
    }
    return toggleControl.checked;
}


function updateJson() {

    consoleLog( `updateJson: id=${ basePlane.key }` );

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
        minCols: isToggle('minCols')
    };

    drawBasePlaneTable( tableArgs );

    insertX3DomFrame(
        'sample_cs_b_10_m_2',
        basePlane,
        framePage = "orbitsViewer.html?" + getCurrentQueryString( basePlane.key ) );
}

function selectBoxAction() {

    const param = getControlValues();
    const actionIndex = param.actionIndex % indexedBox.indexPlanes.length;

    consoleLog( `selectBoxAction: id=${ actionIndex }` );
    basePlane = indexedBox.indexPlanes[ actionIndex ];

    if ( basePlane ) {
        putBasePlane( basePlane.key, basePlane );

        drawProductTable( basePlane, param.toggles );

        showIndex( "indexSummary", "action."+ actionIndex );

        updateJson();
    }
}

function rebuildIndexedBoxSummary( indexedBox, param ) {

    document
            .getElementById( "actionIndex" )
            .max = indexedBox.indexPlanes.length - 1;

    document
            .getElementById( "actionsTable" )
            .innerHTML = drawBoxSummaryTable( indexedBox, "sample_cs_b_10_m_2", param );
}


function buildBoxLayersSelectors( indexedBox, param ) {

    const container = document.getElementById( "boxLayerSelectors" );
    while (container.firstChild ) {
        container.removeChild( container.lastChild );
    }

    const switchAllLayersOn = () => {
        document
                .querySelectorAll( ".box-layer-control" )
                .forEach( blc => {
                    if ( blc.value == "*" ) {
                       blc.checked = false;
                    } else if ( !blc.checked ) {
                        blc.checked = true;
                    }
                } );
        [ "inversesToggle", "harmonicsToggle", "degeneratesToggle" ]
            .forEach( toggleId => {
                const toggle = document.getElementById( toggleId );
                if ( !toggle.checked ) {
                    toggle.checked = true;
                }
            } );
        updatePage();
    };


    container
        .appendChild(
            reify( "label", { "title": "All layers" },
                [
                    reify( "text", {}, [], [ t => t.innerHTML = "*" ] ),
                    reify( "input",
                        {
                            "id": "box-layer.*",
                            "type": "checkbox",
                            "class": "box-layer-control",
                            "value": "*"
                        }, [], [
                            (control) => control.onchange = switchAllLayersOn
                        ]
                    )
                ]
            )
        );

    if ( indexedBox.layerLabels ) {
        container.append( " | " );
        const actionLayers = param.actionLayers || [];
        indexedBox.layerLabels.forEach( ( layerLabel, i ) => {
            const [ id, label ] = layerLabel;
            container.append( " " );
            const checked = actionLayers.includes( id );
            container
                .appendChild(
                    reify(
                        "label",
                        { "title": `${ label }` },
                        [
                            reify( "text", {}, [], [ t => t.innerHTML = `${ label }` ] ),
                            reify(
                                "input",
                                {
                                    "id": "box-layer." + i,
                                    "type": "checkbox",
                                    "class": "box-layer-control",
                                    "value": id
                                },
                                [],
                                [
                                    (control) => control.checked = checked,
                                    (control) => control.onchange = updatePage
                                ]
                            )
                        ]
                    )
                );
        } );
    }
    container.append( " | " );
}



function buildCompositionSelectors( indexedBox, param ) {

    const container = document.getElementById( "compositionSelectors" );
    while (container.firstChild ) {
        container.removeChild( container.lastChild );
    }

    const SC = SYMBOLIC_COMPOSITIONS[ indexedBox.box.rank ];

    const selectSymbolicRepresentation = ( key ) => {
        document.getElementById( "compositionFormulas" ).value = SC[ key ].join( "\n" );
        updatePage();
    };

    Object
        .entries( SC )
        .map( sc => reify( "a", { "class": "symbolic-composition-control", "title": `Prepare SYMBOLIC_COMPOSITIONS[ "${ sc[0] }" ]` }, [],
                [
                    (control) => control.innerHTML = sc[0],
                    (control) => control.onclick = () => selectSymbolicRepresentation( sc[0] )
                ]
            ) )
        .forEach( ( scLink, i ) => {
            if ( i > 0 ) {
                container.append( " " );
            }
            container.appendChild( scLink )
        } );
}


function updatePage() {

    const param = getControlValues();

    // TODO: global access
    indexedBox = new IndexedBox( param.bases, param );

    document
            .getElementById( "basesVolume" )
            .value = indexedBox.box.volume;

    buildBoxLayersSelectors( indexedBox, param );
    buildCompositionSelectors( indexedBox, param );
    rebuildIndexedBoxSummary( indexedBox, param );

    selectBoxAction();

    if ( param.toggles.includes( "autoFormula" ) ) {
        const compositionFormulas = document.getElementById( "compositionFormulas" ).value;
        processFormula( compositionFormulas );
    }
}

function initPage( urlParam = true ) {

    const cv = getControlValues();

    if ( urlParam ) {
        cv.toggles = { ...toggleKeys };
        cv.actionLayers = [ 1 ];
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

    if ( param.toggles.actions ) {
        showHideAll( [ 'selectedPoint', 'actionsTable', 'actionControls' ] );
    }
    if ( param.toggles.cycles ) {
        showHideAll(['cyclesControls','sample_cs_b_10_m_2_table']);
    }
    if ( param.toggles.monomialFilter ) {
        showHideAll( [ 'monomialFilterControls' ] );
    }
    if ( param.toggles.indexComposer ) {
        showHideAll( [ 'indexComposer' ] );
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
                    selectedPointIds.value = selectedPoints.map( p => p.indexes[basePlane.key].id ).join( ", ");

                    distributeMessages(
                        'sample_cs_b_10_m_2', [
                            { 'basis': 'selected-points', 'points': selectedPoints }
                        ] );
                }
            } else if ( data.indexKey ) {

                const nextPlane = indexedBox.indexPlanes[ Number( data.indexKey ) ];

                if ( nextPlane ) {
                    const actionIndexElement = document.getElementById( 'actionIndex' );
                    actionIndexElement.value = data.indexKey;

                    // swap global basePlane and register
                    // so child frames can access it.
                    basePlane = indexedBox.indexPlanes[ Number( data.indexKey ) ];
                    putBasePlane( basePlane.key, basePlane );

                    document.getElementById( 'monomialFilter' ).value = JSON.stringify( basePlane.cycleIndexMonomial );
                    document.getElementById( 'monomialFilterDisplay' ).innerHTML = getCycleIndexMonomialHtml( basePlane );

                    showIndex( "indexSummary", data.sender );
                    updateJson();
                } else {
                    consoleLog( `Select ActionElement: No such index: ${ data.indexKey }` );
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
                selectBoxAction();

            } else if ( data.toggleCentres ) {
            } else if ( data.toggleLines ) {
            } else if ( data.clearSelected ) {
                clearSelected();
            }
        }
    });
}