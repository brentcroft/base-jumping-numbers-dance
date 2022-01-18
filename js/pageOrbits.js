

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
    toggles == ( toggleParam )
        ? toggleParam
            .split(',')
            .map( x => x.trim() )
        : defaultValues.toggles;

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

    const filterLayers = [];
    document
            .querySelectorAll( ".box-layer-control-filter" )
            .forEach( blc => blc.checked ? filterLayers.push( Number( blc.value ) ) : 0 );

    const actionLayers = [];
    document
            .querySelectorAll( ".box-layer-control" )
            .forEach( blc => blc.checked ? actionLayers.push( Number( blc.value ) ) : 0 );

    const currentToggles = Object
            .keys( toggleKeys )
            .filter( k => isToggle( k ) );

    return {
        actionIndex: actionIndex,
        actionLayers: actionLayers,
        filterLayers: filterLayers,
        monomialFilter: monomialFilter,
        bases: bases,
        toggles: currentToggles
    };
}

function getCurrentQueryString( actionKey, bases, actionIndex ) {
    const values = getControlValues();

    if ( !bases ) {
        bases = values.bases;
    }
    if ( !actionIndex ) {
        actionIndex = values.actionIndex;
    }

    return `id=${ actionKey }&bases=${ bases.join(',') }&actionIndex=${ values.actionIndex }&layers=${ values.actionLayers }&toggles=${ values.toggles.join( ',' ) }`;
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

function showOrbit( containerId, currentAction, senderId, multi  ) {
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

function showAllOrbits( containerId, currentAction ) {
    showOrbit( containerId, currentAction, "." );
}

function showIndex( containerId, senderId, param = { toggles:[]}  ) {
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

    const sceneRoot = document.getElementById( "box_action_vectors" );

    if ( sceneRoot ) {


        const [ bottomRadius, height ] = [ 0.1, 0.16 ];
        const [ selectedBottomRadius, selectedHeight ] = [ 0.2, 0.32 ];

        const boxActionLines = sceneRoot.querySelectorAll( ".box-action-line" );

        boxActionLines
            .forEach( boxActionLine => {
                const [ cId, ...oId ] = boxActionLine.id.split( "." );
                const cones = boxActionLine.querySelectorAll( "cone" );
                cones.forEach( cone => {

                    if ( arrayContains( oId, oids ) ) {


                        //cone.setAttribute( "bottomRadius", selectedBottomRadius );
                        //cone.setAttribute( "height", selectedHeight );

                        if ( sourceId != "box-action-line" && param.toggles.includes( "boxActionZoom" ) ) {
                            sceneRoot.runtime.showObject( cone );
                        }
                    } else {
                            //cone.setAttribute( "bottomRadius", bottomRadius );
                            //cone.setAttribute( "height", height );
                    }
                });
        } );
    }
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
        .keys( toggleKeys )
        .forEach( key => {
            initialiseCheckBox( `${ key }Toggle`, param.toggles.includes( key ) );
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
    const currentAction = getBasePlane( actionKey );
    openX3DomFrame( 'sample_cs_b_10_m_2', currentAction );
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

            function flat( index, label ) {
                return new FlatAction( index );
            }

            function root( index, factor ) {
                return new RootAction( index, factor );
            }

            const results = compositionFormulaLines
                .map( ft => new Formula( indexedBox, ft ) )
                .map( f => {
                    try {
                        return [ f, f.evaluate( { root: root, flat: flat, dump: dump, label: label } ) ];
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

    //consoleLog( `updateJson: id=${ currentAction.key }` );

    document
        .getElementById( "sample_cs_b_10_m_2_riffler" )
        .setAttribute( "max", `${ currentAction.orbits ? currentAction.orbits.length : 0 }` );

    document
            .getElementById("orbit-system-data-text-area")
            .innerHTML = JSON.stringify( currentAction.getJson(), null, 2 );

    var cellClick = "distributeMessages( 'sample_cs_b_10_m_2', [ { 'actionKey': String( currentAction.key ), 'multi': isToggle('multi'), 'sender': String( this.id ) } ] )";
    var clearClick = "distributeMessages( 'sample_cs_b_10_m_2', [ { 'actionKey': String( currentAction.key ), 'multi': false, 'sender': String( this.id ) } ] )";
    var totalClick = "distributeMessages( 'sample_cs_b_10_m_2', [ { 'actionKey': String( currentAction.key ) } ] )";

    const tableArgs = {
        containerId: "sample_cs_b_10_m_2",
        currentAction: currentAction,
        cellClick: cellClick,
        clearClick: clearClick,
        totalClick: totalClick,
        conj: isToggle('conj'),
        globalIds: isToggle('globalIds'),
        jumps: isToggle('jumps'),
        perms: !isToggle('coords'),
        minCols: isToggle('minCols'),
        maxCols: isToggle('maxCols'),
        medCols: isToggle('medCols')
    };

    renderCurrentActionTable( tableArgs );

    insertX3DomFrame(
        'sample_cs_b_10_m_2',
        currentAction,
        framePage = "orbitsViewer.html?" + getCurrentQueryString( currentAction.key ) );
}

function selectBoxAction() {

    const param = getControlValues();
    const actionIndex = param.actionIndex % indexedBox.boxActions.length;

    //consoleLog( `selectBoxAction: id=${ actionIndex }` );
    currentAction = indexedBox.boxActions[ actionIndex ];

    if ( currentAction ) {
        putBasePlane( currentAction.key, currentAction );

        drawProductTable( currentAction, param.toggles );

        showIndex( "indexSummary", "action."+ actionIndex, param );

        updateJson();
    }
}

function rebuildIndexedBoxSummary( indexedBox, param ) {

    document
            .getElementById( "actionIndex" )
            .max = indexedBox.boxActions.length - 1;

    document
            .getElementById( "actionsTable" )
            .innerHTML = drawBoxSummaryTable( indexedBox, "sample_cs_b_10_m_2", param );
}


function buildBoxLayersSelectors( indexedBox, param, containerId = "boxLayerSelectors", filter = false ) {

    const container = document.getElementById( containerId );
    while (container.firstChild ) {
        container.removeChild( container.lastChild );
    }

    if ( !filter ) {
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
    }

    if ( indexedBox.layerLabels ) {
        const actionLayers = param.actionLayers || [];
        const filterLayers = param.filterLayers || [];
        indexedBox.layerLabels.forEach( ( layerLabel, i ) => {
            const [ id, label ] = layerLabel;
            container.append( " " );
            const checked = actionLayers.includes( id );
            if (!filter || checked) {
                container
                    .appendChild(
                        reify(
                            "label",
                            { "title": `${ label }${ filter ? " filter" : "" }` },
                            [
                                reify( "text", {}, [], [ t => t.innerHTML = `${ label }` ] ),
                                reify(
                                    "input",
                                    {
                                        "id": `box-layer${ filter ? ".filter" : "" }.${ i }`,
                                        "type": "checkbox",
                                        "class": `box-layer-control${ filter ? "-filter" : "" }`,
                                        "value": id
                                    },
                                    [],
                                    [
                                        (control) => control.checked = filter ? filterLayers.includes( id ) : checked,
                                        (control) => control.onchange = updatePage
                                    ]
                                )
                            ]
                        )
                    );
            }
        } );
    }
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

function buildOctahedralNavigator( boxGroup, param ) {
    var x3domContainerId =  'box_action_vectors';
    const container = document.getElementById( x3domContainerId );
    const sceneRootId = `${ x3domContainerId }_scene_root`;
    const sceneRoot = document.getElementById( sceneRootId );

    if ( !sceneRoot ) {
        throw new Error( `No such scene root: ${ sceneRootId }` );

    }
    //
    while (sceneRoot.firstChild ) {
        sceneRoot.removeChild( sceneRoot.lastChild );
    }

    if ( param.toggles.includes( "boxActionNavigator" ) ) {
        sceneRoot.appendChild( getOctahedralItems( boxGroup, param ) );
        x3dom.reload();
    }
}


function updatePage() {

    const param = getControlValues();

    // TODO: global access
    indexedBox = new BoxGroup( param.bases, param );

    document
            .getElementById( "basesVolume" )
            .value = indexedBox.box.volume;

    const symbology = "symbols: " + indexedBox
                .box
                .placeValuePermutations
                .map( p => `<b>${ p.symbol }🠇</b>=${ p.perm.join("") }` )
                .join( ", ");

    document
            .getElementById( "permutation-roots" )
            .innerHTML = symbology;


    buildOctahedralNavigator( indexedBox, param );

    buildBoxLayersSelectors( indexedBox, param );
    buildBoxLayersSelectors( indexedBox, param, "boxLayerFilterSelectors", true );

    buildCompositionSelectors( indexedBox, param );
    rebuildIndexedBoxSummary( indexedBox, param );

    selectBoxAction();

    if ( param.toggles.includes( "autoCompose" ) ) {
        const compositionFormulas = document.getElementById( "compositionFormulas" ).value;
        processFormula( compositionFormulas );
    }
}

function initPage( urlParam = true ) {

    const cv = getControlValues();

    if ( urlParam ) {
        cv.toggles = Object.entries( toggleKeys ).filter( entry => entry[1] ).map( entry => entry[0] );
        cv.actionLayers = [ 1 ];
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

    if ( param.toggles.includes( 'actions' ) ) {
        showHideAll( [ 'selectedPoint', 'actionsTable', 'actionControls' ] );
    }
    if ( param.toggles.includes( 'cycles' ) ) {
        showHideAll(['cyclesControls','sample_cs_b_10_m_2_table']);
    }
    if ( param.toggles.includes( 'monomialFilter' ) ) {
        showHideAll( [ 'monomialFilterControls' ] );
    }
    if ( param.toggles.includes( 'boxActionNavigator' ) ) {
        showHideAll( [ 'boxActionNavigator' ] );
    }

    if ( param.toggles.includes( 'indexComposer' ) ) {
        showHideAll( [ 'indexComposer' ] );
    }
    if ( param.toggles.includes( 'chart' ) ) {
        showHideAll(['chartControls','sample_cs_b_10_m_2_plot','sample_cs_b_10_m_2_plot_legend','sample_cs_b_10_m_2_riffler']);
    }
    if ( param.toggles.includes( 'more' ) ) {
        showHideAll( ['more-options'] );
    }
    if ( param.toggles.includes( 'orbitEditor' ) ) {
        showHideAll( ['orbitEditor'] );
    }
    if ( param.toggles.includes( 'colours' ) ) {
        showHideAll( ['colours'] );
    }
    if ( param.toggles.includes( 'products' ) ) {
        showHideAll( ['productsTable'] );
    }

    selectedPoints = [];

    window.addEventListener( "message", ( event ) => {
        if ( event.data ) {
            var data = event.data;

            //consoleLog( `event.data: ${ JSON.stringify( data ) }` );

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
                    if ( selectedPointIds ) {
                        selectedPointIds.value = selectedPoints.map( p => p.indexes[currentAction.key].id ).join( ", ");
                    }

                    distributeMessages(
                        'sample_cs_b_10_m_2', [
                            { 'basis': 'selected-points', 'points': selectedPoints }
                        ] );
                }
            } else if ( data.indexKey ) {

                const key =  Number( data.indexKey );
                var nextPlane = indexedBox.boxActions[ key ];

                if ( !nextPlane ) {
                    // check for  action
                    const boxActions = Object
                        .values( indexedBox.boxActions )
                        .filter( ca => ca.id == key );

                    if (boxActions.length > 0 ) {
                        nextPlane = boxActions[0];
                    }

                    // check for composite action
                    const compositeActions = Object
                        .values( indexedBox.compositeActions )
                        .filter( ca => ca.id == key );

                    if (compositeActions.length > 0 ) {
                        nextPlane = compositeActions[0];
                    }
                }


                if ( nextPlane ) {
                    const actionIndexElement = document.getElementById( 'actionIndex' );
                    actionIndexElement.value = data.indexKey;

                    // swap global currentAction and register
                    // so child frames can access it.
                    currentAction = nextPlane;
                    putBasePlane( currentAction.key, currentAction );

                    document.getElementById( 'monomialFilter' ).value = JSON.stringify( currentAction.cycleIndexMonomial );
                    document.getElementById( 'monomialFilterDisplay' ).innerHTML = getCycleIndexMonomialHtml( currentAction );

                    const param = getControlValues();

                    showIndex( "indexSummary", data.sender, param );
                    updateJson();
                } else {
                    consoleLog( `Select BoxAction: No such index: ${ data.indexKey }` );
                }

            } else if ( data.actionKey ) {
                const currentAction = getBasePlane( data.actionKey );
                if ( data.sender ) {
                    showOrbit( "sample_cs_b_10_m_2", currentAction, data.sender, data.multi );
                } else {
                    showAllOrbits( "sample_cs_b_10_m_2", currentAction );
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