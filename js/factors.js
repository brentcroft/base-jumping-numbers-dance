
var MAXLIMIT = Math.pow( 10, 250 );

// https://stackoverflow.com/questions/39899072/how-can-i-find-the-prime-factors-of-an-integer-in-javascript
function primeFactors(n) {
  const factors = [];
  let divisor = 2;
  while (n >= 2) {
    if (n % divisor == 0) {
      factors.push(divisor);
      n /= divisor;
    } else {
      divisor++;
    }
  }
  return factors;
}

function primeFactorsHtml( n ) {
    const f = [];
    primeFactors( n ).forEach( x => {
        const c = f.find( y => y[0] == x );
        if ( c ) {
            c[1]++;
        } else {
            f.push( [ x, 1 ] );
        }
    } );
    const parts = f.map( c => `${ c[0] }` + (c[1] == 1 ? '' : `<sup>${ c[1] }</sup>` ));
    return parts.join('*');
}


function primeFactors2(n) {
    var factors = [], i;
    for (i = 2; i <= n; i++) {
        while ((n % i) === 0) {
            factors.push(i);
            n /= i;
        }
    }
    return factors;
}


/*
    Calculate the prime factors of v.
*/
function primeFactorsHtml2( v ) {
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
                        a += b + "<sup>" + h + "</sup>" + " * "
                    } else {
                        a += b + " * "
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
