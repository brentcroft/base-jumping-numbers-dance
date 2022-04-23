
/*
const pages = {
    'page-0-1': '0.1-the-multiplicative-group.html',
    'page-1-0': '1.0-tally-ho.html',
    'page-2-0': '2.0-place-value-tables.html',
    'page-3-0': '3.0-conjugate-points-radiance.html',
    'page-4-0': '4.0-two-dimensional-boxes.html',
    'page-4-1': '4.1-two-more-boxes.html',
    'page-5-0': '5.0-three-dimensional-boxes.html'
};
*/
function includePages( pagesElementId, errorElementId, pages ) {

    const pagesElement = document.getElementById( pagesElementId );
    const errorElement = document.getElementById( errorElementId );

    const tally = Object.keys( pages );

    const urlParam = new URLSearchParams( window.location.search );

    Object
        .entries( pages )
        .forEach( entry => {
            const [ id, src ] = entry;

            const entryElement = reify( "div", { id: id } );
            pagesElement.appendChild( entryElement );

            const request = new XMLHttpRequest();

            const includer = () => {

                try {
                    entryElement.innerHTML = request.responseText;

                    const scripts = [];

                    entryElement
                        .querySelectorAll( "script" )
                        .forEach( s => scripts.push( s.textContent ) );

                    // scripts do not run concurrently
                    const pageScope = {
                        id: id,
                        src: src
                    };

                    scripts
                        .filter( s => s.length > 0 )
                        .forEach( ( s, i ) => {
                            try {
                                const scriptLines = [
                                    '"use strict";',
                                    "const [ pageScope, urlParam ] = arguments;",
                                    "try {", s, "} catch ( e ) {",
                                    `  const msg = "Script [${ src }#${ id }#${ i + 1 }]; " + e;`,
                                    "  console.log( msg );",
                                    "  console.trace();",
                                    "  throw new Error( msg, { cause: e } );",
                                    "}",
                                    ];

                                Function( scriptLines.join( "\n" ) )( pageScope, urlParam );
                            } catch ( e ) {
                                errorElement
                                    .appendChild( reify( "div", {}, [], [ c => c.innerHTML = e.toString() ] ) )
                            }
                        } );

                    entryElement
                        .querySelectorAll( ".eval" )
                        .forEach( ( ref, i ) => {
                            try {
                                const t = eval( ref.title );
                                if ( t ) {
                                    ref.innerHTML = t;
                                } else {
                                    throw new Error( "Invalid Object: " + t );
                                }
                            } catch ( e ) {

                                const msg = `Bad Eval [${ src }#${ id }#${ i + 1 }]: title=${ ref.title }; ${ e }`;
                                console.log( msg );
                                ref
                                    .appendChild( reify( "div", { class: "error" }, [], [ c => c.innerHTML = msg ] ) )
                            }
                        } );

                    entryElement
                        .querySelectorAll( ".evalNode" )
                        .forEach( ( ref, i ) => {
                            try {
                                const t = eval( ref.title );
                                if ( t instanceof Element ) {
                                    ref.appendChild( t );
                                } else if ( Array.isArray( t ) && ( t.length > 0 ) && ( t[0] instanceof Element ) ) {
                                    t.forEach( t0 => ref.appendChild( t0 ) );
                                } else {
                                    throw new Error( "Invalid Node: " + t );
                                }
                            } catch ( e ) {
                                const errorDetail = ` ${ e.stack }`;
                                const msg = `Bad Eval Node [${ src }#${ id }#${ i + 1 }]; title=${ ref.title }; ${ e }; ${ errorDetail }`;
                                console.log( msg );
                                ref
                                    .appendChild( reify( "div", { class: "error" }, [], [ c => c.innerHTML = msg ] ) )
                            }
                        } );

                } catch ( e ) {
                    console.log( e );
                    console.trace();
                    errorElement
                        .appendChild( reify( "div", { class: "error" }, [], [ c => c.innerHTML = e.toString() ] ) );

                } finally {

                    tally.pop();

                    if ( tally.length == 0 ) {
                        x3dom.reload();
                    }
                }
            };

            request.addEventListener( "load", includer );
            request.open( "GET", src );
            request.send();
        } );
}