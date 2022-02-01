
function getBarGlyphBitmap( perm, maxBar, width = 2, height = 50 ) {

    const bmp = new Bitmap( perm.length * width, height );

    //
    const top = 1 + ( maxBar | perm.reduce( (a,c) => Math.max( a,c ), 0 ) );

    perm
        .forEach( (p,i) => {
            const offset = i * width;
            for ( var x = 0; x < width; x = x + 4 ) {
                //bmp.pixel[ x + offset ][ height - 1 ] = [ 255, 0, 0, 255 ];
                bmp.pixel[ x + offset ][ 0 ] = [ 255, 0, 0, 255 ];
            }
            const barOffset = Math.floor( ( 1 - ( p / top ) ) * height );
            //const barOffset = Math.floor( ( p / top ) * height );
            for ( var x = 0; x < width; x++ ) {
                bmp.pixel[ x + offset ][ barOffset - 1 ] = [ 0, 0, 0, 255 ];
            }
        } );

    return bmp;
}


function getTubeGlyphBitmap( perm, maxBar, width = 2, height = 50 ) {

    const bmp = new Bitmap( perm.length * width, height );

    //
    const RED_PIXEL = [ 255, 0, 0, 255 ];
    const GREEN_PIXEL = [ 0, 255, 0, 255 ];
    const BLUE_PIXEL = [ 0, 0, 255, 255 ];
    const BLACK_PIXEL = [ 0, 0, 0, 255 ];
    const FRONT_PIXEL = [ 10, 0, 0, 255 ];
    const BACK_PIXEL = [ 0, 0, 10, 255 ];
    const top = 1 + ( maxBar | perm.reduce( (a,c) => Math.max( a,c ), 0 ) );
    const halfHeight = height / 2;

    perm
        .forEach( (p,i) => {
            const offset = i * width;
            for ( var x = 0; x < width; x = x + 4 ) {
                bmp.pixel[ x + offset ][ 0 ] = BLACK_PIXEL;
            }

            const barOffset = Math.floor( ( 1 - ( p / top ) ) * height );

            if ( barOffset >= halfHeight ) {
                for ( var x = 0; x < width; x++ ) {
                    bmp.pixel[ x + offset ][ 2 * ( height - barOffset ) ] = BACK_PIXEL;
                }
            } else {
                for ( var x = 0; x < width; x++ ) {
                    bmp.pixel[ x + offset ][ 2 * ( barOffset - 1 ) ] = FRONT_PIXEL;
                }
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
                    { src: getTubeGlyphBitmap( perm, maxBar, width, height ).dataURL() } )
            ]
        ) );
}

// writeBarGlyphs( [ 1,2,3,4,5,6,7,8] );