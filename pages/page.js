

function includePage( element ) {
    element.insertAdjacentHTML( "afterend", ( element.contentDocument.body || element.contentDocument ).innerHTML );
    element.remove();
}

function drawBoxItems( bases = [ 3, 5 ] ) {

    const box = new Box( bases );
    const columns = box
        .points
        .map( p => [
            p.idx[0] == p.idx[1] ? ' class="fixed-point"' : '',
            p.idx[0],
            p.idx[1] ] );

    const upRow = columns
        .map( x => `<td${ x[0] }>${ x[1] }</td>` )
        .join( "\n" );

    const downRow = columns
        .map( x => `<td${ x[0] }>${ x[2] }</td>` )
        .join( "\n" );

    return `<table class="raw-permutation"><tr>${ downRow }</tr><tr>${ upRow }</tr></table>`;
}