@{%
	// Moo lexer documention is here:
	// https://github.com/no-context/moo

	const moo = require("moo")
	const lexer = moo.compile({
		WS:         { match: /[\s]+/, lineBreaks: true },
        comment:    /\/\/.*?$|#.*?$/,
        number:     /[0-9]+/,
        name:       /[a-zA-Z$][a-zA-Z0-9$_]*/,
        string:     /"(?:\\["\\]|[^\n"\\])*"/,
		between:    /[.]{2}/,
		ampersand:  '&',
        equals:     '=',
        exp:        '^',
        star:       '*',
		slash:      '/',
		minus:      '-',
		plus:       '+',
        colon:      ':',
        tilda:      '~',
        pipe:       '|',
		period:     '.',
        percent:    '%',
		at:         '@',
		between:    '..',
        comma:      ',',
        lparen:     '(',
        rparen:     ')',
        lsquare:    '[',
        rsquare:    ']',
        lcurly:     '{',
        rcurly:     '}',
        NL:         ';',
	});

	const localVars = {};
	const cycleVars = {};
    const trimTree = ( a ) => {
		if ( a == null ) {
			return null;
		} else if ( Number.isInteger( a ) ) {
			return a;
		} else if ( Array.isArray( a ) ) {
			return a.length == 0
				? null
				: a
					.map( b => trimTree( b ) )
					.filter( b => b != null )
					.filter( b => (!Array.isArray(b) || b.length > 0) );
		} else if ( 'number' == a.type ) {
			return parseInt( a.text );
		} else if ( [
				'NL', 'comment',
				'comma', 'lsquare', 'rsquare', 'lparen', 'rparen', 'lcurly', 'rcurly',
				'exp', 'star', 'colon', 'tilda', 'pipe', 'percent',
				'period', 'at', 'equals', 'slash', 'ampersand', 'between',
				'minus', 'plus'
			].includes( a.type ) ) {
			return null;
		} else {
			return a;
		}
	};
	const trimArith = (d) => {
		const t = trimTree(d);
		return Array.isArray(t)
			? t.flatMap( c => Array.isArray( c ) ? trimArith( c ) : [ c ] )
			: [ t ]
	};
	const flatten = (d) => {
		if ( !Array.isArray(d) ) {
			return d;
		}
		const candidate = d
				.map( b => flatten( b ) )
				.filter( b => b != null )
				.filter( b => (!Array.isArray(b) || b.length > 0) );
		return Array.isArray(candidate) && candidate.length == 1
				? candidate[0]
				: candidate;
	};
	const hoister = (h) => {
		return h.length == 0
			? null
			: h.length == 1 && Array.isArray(h[0])
				&& h[0].length > 0 && Array.isArray(h[0][0])
				? hoister(h[0])
				: h;
	};
	const buildOp = ( d, op ) => {
		const t = trimTree(d);
		if (Array.isArray(t) && t.length == 2 ) {
			return { 'op': op, 'l': flatten(t[0]), 'r': flatten(t[1]) };
		}
		return t[0];
	};
	const buildPerm = ( d, l, r ) => {
		var t = flatten(trimArith(d));
		//console.log( `perm-raw: ${JSON.stringify(t)}`);
		const missingIndexes = t.filter( (c,i) => t.indexOf(i) < 0 );
		if ( missingIndexes.length > 0 ) {
			throw new Error( `Invalid index [${ t }]: missing values: ${ missingIndexes }` );
		}
		//console.log( `perm: ${JSON.stringify(t)}`);
		return t;
	};
	const buildPerms = ( d, l, r ) => {
		var t = hoister(trimTree(d));
		//console.log( `perms-raw: ${JSON.stringify(t)}`);
		if ( Array.isArray(t) && t.length > 0 && !Array.isArray(t[0])  ) {
			t = [ t ];
		} else if ( Array.isArray(t) ) {
			t = t.map( c => Array.isArray( c ) ? c : [ c ] );
		} else {
			t = [[ t ]];
		}
		t.forEach( x => {
			const missingIndexes = x.filter( (c,i) => x.indexOf(i) < 0 );
			if ( missingIndexes.length > 0 ) {
				throw new Error( `Invalid index [${ x }]: missing indexes: ${ missingIndexes }` );
			}
		} );
		//console.log( `perms: ${JSON.stringify(t)}`);
		return { 'op': 'perms', 'perms': t };
	};
	const buildFactuple = ( d, l, r ) => {
		var t = trimArith(d);
		//console.log( `factuple-raw: ${JSON.stringify(t)}`);
		const invalidIndexes = t.filter( (c,i) => c > i + 1 );
		if ( invalidIndexes.length > 0 ) {
			throw new Error( `Invalid factorial point [${ t }]: values: ${ invalidIndexes }` );
		}
		//console.log( `factuple: ${JSON.stringify(t)}`);
		return t;
	};
	const buildFactuples = ( d, l, r ) => {
		var t = flatten(trimTree(d));
		//console.log( `factuples-raw: ${JSON.stringify(t)}`);
		if ( Array.isArray(t) && t.length > 0 && !Array.isArray(t[0])  ) {
			t = [ t ];
		} else if ( Array.isArray(t) ) {
			t = t.map( c => Array.isArray( c ) ? c : [ c ] );
		} else {
			t = [[ t ]];
		}
		//console.log( `factuples: ${JSON.stringify(t)}`);
		t.forEach( x => {
        	const invalidIndexes = x.filter( (c,i) => c > i + 1 );
			if ( invalidIndexes.length > 0 ) {
				throw new Error( `Invalid factorial point [${ x }]: values: ${ invalidIndexes }` );
			}
		} );
		//console.log( `factuples: ${JSON.stringify(t)}`);
		return { 'op': 'factuples', 'factuples': t };
	};
	const buildBox = ( d ) => {
		const t = flatten(trimTree(d));
		//console.log( `box-raw: ${JSON.stringify(t)}`);
		if (Array.isArray(t) && t.length == 2 ) {
			if (Array.isArray(t[1])) {
				return { 'op': 'box', 'bases': [ t[0], ...t[1] ] };
			} else {
				return { 'op': 'box', 'bases': [ t[0], t[1] ] };
			}
		} else {
			return { 'op': 'box', 'bases': [ t ] };
		}
	};
	const buildAssignment = ( d ) => {
		const t = trimTree(d);
		//console.log(t);
		if (Array.isArray(t)) {
			if ( t[1].name ) {
				throw new Error( `Invalid Assignment: item named "${ t[1].name }" cannot be renamed "${ t[0].text }` );
			}
			const target = flatten(t[1]);
			target.name = t[0].text;
			return target;
		}
		return t[0];
	};
	const buildIndex = ( d, isFactIndex ) => {
		const t = trimTree(d);
		//console.log(`boxIndex-raw: ${JSON.stringify(t)}`);
		if ( Array.isArray( t ) ) {
		    const boxIndex = { 'op': 'index', 'box': t[0] };
			if (t.length > 1) {
				const selectors = t[1];
				const payload = hoister(selectors.map( selector => flatten(selector) ) )[0];

				//console.log(`boxIndex-payload: ${JSON.stringify(payload)}`);

				if ( 'factuples' == payload.op ) {
					const requiredLength = boxIndex.box.bases.length - 1;
					const badFacts = payload.factuples.filter( p => p.length != requiredLength ).map( p => `${ p }`);
					if ( badFacts.length > 0 ) {
						throw new Error( `Invalid factorial points for box [${ boxIndex.box.bases }]: require length ${ requiredLength }: ${ badFacts }` );
					}
					boxIndex.factuples = payload.factuples;
				} else {
					const requiredLength = boxIndex.box.bases.length;
					const badPerms = payload.perms.filter( p => p.length != requiredLength ).map( p => `{${ p }}`);
					if ( badPerms.length > 0 ) {
						throw new Error( `Invalid factorial perm for box [${ boxIndex.box.bases }]: require length ${ requiredLength }: ${ badPerms }` );
					}
					boxIndex.perms = payload.perms;
				}
			}
			//console.log(`boxIndex: ${JSON.stringify(boxIndex)}`);
		    return boxIndex;
		} else {
			return { 'op': 'index', 'box': t };
		}
	};
	const buildMultiplicativeGroup = ( d, raw ) => {
		const t = trimTree(d);
		const spec = `${ t[0] } ${ raw ? '@' : '%' } ${ t[1] }`;
		const mg = {
			'op': 'mg',
			'key': spec,
			'coprime': t[0],
		};
		if (raw) {
			if (t[1] < 2) {
				throw new Error( `Invalid group spec: ${ spec } right side must be 2 or greater.` );
			}
			if (t[0] < 1) {
				throw new Error( `Invalid group spec: ${ spec } left side must be 1 or greater.` );
			}
			if (t[1] <= t[0]) {
				throw new Error( `Invalid group spec: ${ spec } left side must be less than right side.` );
			}
			const gcd = (a, b) => a ? gcd( b % a, a) : b;
			const divisor = gcd( t[1], t[0] );
			if ( divisor > 1 ) {
            	throw new Error( `Invalid group spec: ${ spec } (gcd = ${ divisor }) left side and right side must be coprime.` );
        	}
			mg.cofactor = (t[1] + 1) / t[0];
			mg.group = t[1];

		} else {
			mg.cofactor = t[1];
			mg.group =  (t[0] * t[1]) - 1;
		}
		return mg;
	};

	const buildNegation = ( d ) => -1 * trimTree(d);
	const buildProduct = ( d ) => trimArith(d).reduce( (a,c) => a * c, 1 );
	const buildAddition = ( d ) => trimArith(d).reduce( (a,c) => a + c, 0 );
	const buildDivision = ( d ) => {
		const t = trimArith(d);
		return t.length > 1 ? t.slice(1).reduce( (a,c) => a / c, t[0] ): t[0];
	};
	const buildSubtraction = ( d ) => {
		const t = trimArith(d);
		return t.length > 1 ? t.slice(1).reduce( (a,c) => a - c, t[0] ) : t[0];
	};
	const buildExponentation = ( d ) => {
		var t = trimTree(d);
		return t[0] ** t[1];
	};
	const buildNamedInteger = ( d ) => {
		var t = trimTree(d);
		localVars[t[0].text] = t[1];
		return null;
	};
	const buildNamedZInteger = (d,l,r) => {
		const t = trimTree(d);
		return t in localVars ? localVars[t] : r;
	}
	const buildNamedAction = (d,l,r) => trimTree(d) in localVars ? r : d;
	const buildCycle = d => {
		const t = flatten(trimTree(d));
		//console.log( `cycle-raw: ${JSON.stringify(t)}`);
		const c = Array.isArray(t)
			? t.flatMap( x => Array.isArray(x) ? x : [ x ] )
			: [ t ];
		if ( new Set(c).size !== c.length ) {
			throw new Error( `Invalid cycle: ${ t } must not contain repeated values.` );
		}
		//console.log( `cycle: ${JSON.stringify(c)}`);
		return c;
	};
	const buildCycles = d => {
		const t = trimTree(d);
		//console.log(`cycles-raw: ${JSON.stringify(t)}`);

		const c = hoister(t).map( h => flatten(h));
		//console.log(`cycles: ${JSON.stringify(c)}`);
		return { 'op': 'cycles', 'cycles': c };
	};
	const buildLitIndex = (d) => {
		const t = trimTree(d);
		//console.log(`buildLitIndex: ${JSON.stringify(t)}`);
		const hasCycles = Array.isArray(t[0]) && t[0][0].op === 'cycles';
		const index = buildPerm( hasCycles ? t.slice(1) : t);
		if (hasCycles) {
			//console.log(`cycles: ${JSON.stringify(t[0][0])}`);
			const cycles = t[0][0].cycles;
			cycles
			    .filter(cycle => Array.isArray(cycle) && cycle.length > 1)
			    .forEach( cycle => cycle.map( c => index.indexOf( c ) ).forEach((p,i) => {
                    index[ p ] = (i < (cycle.length-1) ? cycle[i+1] : cycle[0]);
                } ) );
		}
		//console.log(`cycles-index: ${JSON.stringify(index)}`);
		return { 'op': 'index', 'index': index, 'key': '?', 'hasCycles': t[0][0].cycles, 'box': { 'op': 'box', 'bases': [index.length] } };
	};
	const buildRange = (d,l,r) => {
		const t = flatten(trimTree(d));
		//console.log(`buildRange  ${t.length}: ${t}`);
		const idx = [];
		if (t[0] < t[1]) {
			for (var i = t[0]; i <= t[1]; i++ ) {
				idx.push(i);
			}
		} else {
			for (var i = t[0]; i >= t[1]; i-- ) {
				idx.push(i);
			}
		}
		//console.log(`buildRange: ${idx}`);
		return idx;
	}
%}

# Pass your lexer with @lexer:
@lexer lexer

main -> lines {% d => d[0] %}
lines -> line (%NL line):* {% d => {
	const t = flatten(trimTree(d));
	if (Array.isArray(t) && t.length == 2 && Array.isArray(t[1]) ) {
		return [t[0],...t[1]];
	}
	return t;
} %}
line            -> ( content | %comment | _ | null )
content         -> ( _ (expression | namedIntegers) _ %comment:? ) {% trimTree %}

namedIntegers   -> %ampersand "vars" _ namedInteger (_ %comma _ namedInteger):* {% d => null %}
namedInteger    -> %name _ %equals _ zinteger {% buildNamedInteger %}

expression      -> ( composition ) {% id %}
composition     -> truncation (_ %star _ expression):? {% d => buildOp( d, 'compose' ) %}
truncation      -> reduction (_ %percent _ expression):? {% d => buildOp( d, 'truncate' ) %}
reduction       -> production (_ %slash _ expression):? {% d => buildOp( d, 'reduce' ) %}
production      -> exponentiation (_ %tilda _ expression):? {% d => buildOp( d, 'product' ) %}
exponentiation  -> action (_ %exp _ zinteger):? {% d => buildOp( d, 'power' ) %}

action          -> ( brackets | assignment | litindex | index | mg | mgraw | %name {% buildNamedAction %} ) {% trimTree %}
assignment      -> %name _ %equals _ expression {% buildAssignment %}
brackets 		-> %lparen _ expression _ %rparen {% trimTree %}

index           -> box ( (_ perms):? | (_ factuples):? | null ) {% d => buildIndex(d) %}

box             -> (zinteger (_ %colon _ zinteger):*) {% buildBox %}
litindex        -> %lsquare _ ( cycles _):? range (_ %comma _ range):* _ %rsquare {% buildLitIndex %}
range           -> ( pinteger _ %between _ pinteger ) {% buildRange %} | pinteger {% id %}
cycles          -> ((cycle _):+) {% buildCycles %}
cycle           -> %lparen _ pinteger (_ %comma _ pinteger):* _ %rparen {% buildCycle %}

factuples       -> (( %lcurly _ zinteger (_ %comma _ zinteger):* _ %rcurly _ {% buildFactuple %} ):+) {% buildFactuples %}
perms           -> (( %lsquare _ zinteger (_ %comma _ zinteger):* _ %rsquare _ {% buildPerm %} ):+) {% buildPerms %}
mg              -> zinteger _ %percent _ zinteger {% d => buildMultiplicativeGroup(d) %}
mgraw           -> zinteger _ %at _ zinteger {% d => buildMultiplicativeGroup(d, true) %}

zinteger 		-> ( %name {% buildNamedZInteger %} | zbrackets | zpower | ninteger | pinteger ) {% d => flatten(trimTree(d)) %}
zbrackets 		-> %lparen _ zinteger _ %rparen {% trimTree %}
zpower 			-> ( pinteger | ninteger ) _ %exp _ zinteger {% buildExponentation %}
ninteger 		-> %minus pinteger {% buildNegation %}
pinteger 		-> %plus:? division {% trimTree %}
division 	    -> multiplication (_ %slash _ zinteger):* {% buildDivision %}
multiplication 	-> addition (_ %period _ zinteger):* {% buildProduct %}
addition 		-> subtraction (_ %plus _ zinteger):* {% buildAddition %}
subtraction 	-> %number (_ %minus _ zinteger):* {% buildSubtraction %}
_               -> %WS:*     {% function(d) {return null } %}

