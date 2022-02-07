
/*
    columnType = [ 'number', 'fraction', 'product' ]
*/

const sortableColumnTypes = [ 'number', 'fraction', 'product', 'monomial', 'cycles', 'text' ];

function sortTable( tableId, columnIndex, columnType ) {
    var table, rows, switching, i, x, y, shouldSwitch;

    if ( columnType && !sortableColumnTypes.includes( columnType ) ) {
        throw new Error( `Unknown column type: ${ columnType }` );
    }

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

    function Cycles( s ) {
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

                    switch( columnType ) {
                        case 'number':
                          var xV = Number( xT );
                          var yV = Number( yT );
                          break;

                        case 'fraction':
                          var xV = Fraction( xT );
                          var yV = Fraction( yT );
                          break;

                        case 'product':
                          var xV = Product( xT );
                          var yV = Product( yT );
                          break;

                        default:
                          var xV = xT;
                          var yV = yT;
                          break;
                    }

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