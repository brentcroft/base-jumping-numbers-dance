
/**
    reify the data to a new document element of type tag
*/
function reify( tag, attr = {}, children = [], ops = [] ) {
    const e = document.createElement( tag );
    if ( attr ) {
        Object.entries(attr).forEach( x => {
            const [ key, value ] = x;
            if ( value === null || value === "" || typeof value === 'undefined' ) {
                // do nothing
            } else if ( "class" == key || "cssClass" == key ) {
                ( Array.isArray( value ) ? value : [ value ] )
                    .flatMap( v => v.split( /\s*,\s*/ ) )
                    .forEach( c => e.classList.add( c ) );
            } else if ( "type" == key ) {
                e.type = value;
            } else {
                e.setAttribute( key, value );
            }
        });
    }
    if ( children ) {
        if ( !Array.isArray(children) ) {
            throw new Error( `Children is not an array: tag=${ tag }, attr=${ attr }, children=${ children }` );
        }
        try {
            children
                .filter( x => x )
                .forEach( x => e.appendChild( x ) );
        } catch ( e ) {
            throw new Error( `Bad Child: tag=${ tag }, attr=${ attr }, children=${ children }`, { 'cause': e } );
        }
    }
    if ( ops ) {
        if ( !Array.isArray(ops) ) {
            throw new Error( `Ops is not an array: tag=${ tag }, attr=${ attr }, ops=${ ops }` );
        }
        ops.forEach( x => x( e ) );
    }
    return e;
}

function reifyData( tag, data ) {
    return reify(
        tag,
        data.attr ? data.attr : {},
        data.children ? data.children : [],
        data.ops ? data.ops : []
    );
}

function reifyInput( label, attr = { type: 'text' }, onChangeValue ) {
    return reify( "div", {}, [
        reify( "label", {}, [
            reify( "span",{},[],[ c => c.textContent = label ] ),
            reify( "input", attr, [], [
                c => onChangeValue
                    ? c.onchange = () => onChangeValue( c.value )
                    : null ] )
        ] ) ] );
}

function reifyText( text, cssClass = [] ) {
    return reify( "span", { 'cssClass': cssClass }, [], [ c => c.innerHTML = text ] );
}

