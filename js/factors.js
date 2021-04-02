
var MAXLIMIT = Math.pow( 10, 250 );



/*
    Calculate the prime factors of v.
*/
function primeFactors( v ) {
    if (v >= 2 & v < MAXLIMIT) {
        var k = 2;
        var f = 0;
        var c = new Array();
        var a = "";
        while (v >= k * k) {
            if (v % k == 0) {
                c[f] = k;
                v = v / k;
                f++
            } else {
                k++
            }
        }
        c[f] = v;
        var h = 0;
        for (var d = 0; d < c.length; d++) {
            b = c[d];
            h++;
            if (c[d] != c[d + 1]) {
                if (d == c.length - 1) {
                    if (h > 1) {
                        a += b + "<sup>" + h + "</sup>"
                    } else {
                        a += b
                    }
                } else {
                    if (h > 1) {
                        a += b + "<sup>" + h + "</sup>" + ", "
                    } else {
                        a += b + ", "
                    }
                }
                h = 0
            }
        }
        return a;

    } else if ( v == 1 ) {
        return "1";

    } else {
        return "~"
    }
}
