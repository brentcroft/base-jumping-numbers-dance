
function getBarGlyphBitmap( perm, maxBar, width = 2, height = 50 ) {

    const bmp = new Bitmap( perm.length * width, height );

    maxBar = maxBar | perm.reduce( (a,c) => Math.max( a,c ), 0 );

    perm
        .forEach( (p,i) => {
            const offset = i * width;
            for ( var x = 0; x < width; x = x + 4 ) {
                bmp.pixel[ x + offset ][ height - 1 ] = [ 255, 0, 0, 255 ];
            }
            const barOffset = Math.floor( ( 1 - ( p / maxBar ) ) * height );
            for ( var x = 0; x < width; x++ ) {
                bmp.pixel[ x + offset ][ barOffset - 1 ] = [ 0, 0, 0, 255 ];
            }
        } );

    return bmp;
}

function writeBarGlyphs( sourceElement, perm, maxBar, width, height ) {
    sourceElement
        .parentNode
        .appendChild( reify(
            "div",
            { class: 'scriptPanelResult' },
            [
                reify(
                    "img",
                    { src: getBarGlyphBitmap( perm, maxBar, width, height ).dataURL() } )
            ]
        ) );
}

// writeBarGlyphs( [ 1,2,3,4,5,6,7,8] );