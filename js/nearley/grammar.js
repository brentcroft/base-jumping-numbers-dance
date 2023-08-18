// Generated automatically by nearley, version undefined
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

	// Moo lexer documention is here:
	// https://github.com/no-context/moo

//	const moo = require("moo")
	const lexer = moo.compile({
        WS: /[ \t]+/,
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
        NL:    { match: /\n+/, lineBreaks: true },
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
				'NL', 'WS', 'comment',
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
			? t.flatMap( c => Array.isArray( c ) ? c : [ c ] )
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
		const t = flatten(trimTree(d));
		if (Array.isArray(t) && t.length == 2 ) {
			return { 'op': op, 'l': t[0], 'r': t[1] };
		}
		return t;
	};
	const buildPerm = ( d, l, r ) => {
		var t = flatten(trimTree(d));
		if ( Array.isArray(t) ) {
			t = t.flatMap( c => Array.isArray( c ) ? c : [ c ] );
			const missingIndexes = t.filter( (c,i) => t.indexOf(i) < 0 );
			if ( missingIndexes.length > 0 ) {
				throw new Error( `Invalid index [${ t }]: missing values: ${ missingIndexes }` );
			}
		}
		return { 'op': 'perm', 'perm': t };
	};
	const buildPerms = ( d, l, r ) => {
		var t = flatten(trimTree(d));
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
				throw new Error( `Invalid index [${ x }]: missing values: ${ missingIndexes }` );
			}
		} );
		//console.log( `perms: ${JSON.stringify(t)}`);
		return { 'op': 'perms', 'perms': t };
	};
	const buildFactuples = ( d, l, r ) => {
		var t = flatten(trimTree(d));
		console.log( `factuples-raw: ${JSON.stringify(t)}`);
		if ( Array.isArray(t) && t.length > 0 && !Array.isArray(t[0])  ) {
			t = [ t ];
		} else if ( Array.isArray(t) ) {
			t = t.map( c => Array.isArray( c ) ? c : [ c ] );
		} else {
			t = [[ t ]];
		}
		console.log( `factuples: ${JSON.stringify(t)}`);
		t.forEach( x => {
        	const invalidIndexes = x.filter( (c,i) => c > i + 1 );
			if ( invalidIndexes.length > 0 ) {
				throw new Error( `Invalid factorial point [${ x }]: values: ${ invalidIndexes }` );
			}
		} );		
		console.log( `factuples: ${JSON.stringify(t)}`);
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
		if (Array.isArray(t)) {
			if ( t[1].name ) {
				throw new Error( `Invalid Assignment: item named "${ t[1].name }" cannot be renamed "${ t[0].text }` );
			}
			t[1].name = t[0].text;
			return t[1];
		}
		return t;
	};
	const buildIndex = ( d, isFactIndex ) => {
		const t = trimTree(d);
		console.log(`boxIndex-raw: ${JSON.stringify(t)}`);
		if ( Array.isArray( t ) ) {
		    const boxIndex = { 'op': 'index', 'box': t[0] };
			if (t.length > 1) {
				const selectors = t[1];
				const payload = hoister(selectors.map( selector => flatten(selector) ) )[0];
				
				console.log(`boxIndex-payload: ${JSON.stringify(payload)}`);
				
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
			console.log(`boxIndex: ${JSON.stringify(boxIndex)}`);
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
		const index = buildPerm( hasCycles ? t.slice(1) : t).perm;
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
		return { 'op': 'index', 'index': index, 'hasCycles': t[0][0].cycles, 'box': { 'op': 'box', 'bases': [index.length] } };
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
var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "main", "symbols": ["lines"], "postprocess": d => d[0]},
    {"name": "lines$ebnf$1", "symbols": []},
    {"name": "lines$ebnf$1$subexpression$1", "symbols": [(lexer.has("NL") ? {type: "NL"} : NL), "line"]},
    {"name": "lines$ebnf$1", "symbols": ["lines$ebnf$1$subexpression$1", "lines$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "lines", "symbols": ["line", "lines$ebnf$1"], "postprocess":  d => {
        	const t = flatten(trimTree(d));
        	if (Array.isArray(t) && t.length == 2 && Array.isArray(t[1]) ) {
        		return [t[0],...t[1]];
        	}
        	return t;
        } },
    {"name": "line$subexpression$1", "symbols": ["content"]},
    {"name": "line$subexpression$1", "symbols": [(lexer.has("comment") ? {type: "comment"} : comment)]},
    {"name": "line$subexpression$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)]},
    {"name": "line$subexpression$1", "symbols": []},
    {"name": "line", "symbols": ["line$subexpression$1"]},
    {"name": "content$subexpression$1$ebnf$1", "symbols": []},
    {"name": "content$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "content$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "content$subexpression$1$subexpression$1", "symbols": ["expression"]},
    {"name": "content$subexpression$1$subexpression$1", "symbols": ["namedIntegers"]},
    {"name": "content$subexpression$1$ebnf$2", "symbols": []},
    {"name": "content$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "content$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "content$subexpression$1$ebnf$3", "symbols": [(lexer.has("comment") ? {type: "comment"} : comment)], "postprocess": id},
    {"name": "content$subexpression$1$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "content$subexpression$1", "symbols": ["content$subexpression$1$ebnf$1", "content$subexpression$1$subexpression$1", "content$subexpression$1$ebnf$2", "content$subexpression$1$ebnf$3"]},
    {"name": "content", "symbols": ["content$subexpression$1"], "postprocess": trimTree},
    {"name": "expression$subexpression$1", "symbols": ["composition"]},
    {"name": "expression", "symbols": ["expression$subexpression$1"], "postprocess": d => flatten(trimTree(d))},
    {"name": "namedIntegers$ebnf$1", "symbols": []},
    {"name": "namedIntegers$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "namedIntegers$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "namedIntegers$ebnf$2", "symbols": []},
    {"name": "namedIntegers$ebnf$2$subexpression$1$ebnf$1", "symbols": []},
    {"name": "namedIntegers$ebnf$2$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "namedIntegers$ebnf$2$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "namedIntegers$ebnf$2$subexpression$1$ebnf$2", "symbols": []},
    {"name": "namedIntegers$ebnf$2$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "namedIntegers$ebnf$2$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "namedIntegers$ebnf$2$subexpression$1", "symbols": ["namedIntegers$ebnf$2$subexpression$1$ebnf$1", (lexer.has("comma") ? {type: "comma"} : comma), "namedIntegers$ebnf$2$subexpression$1$ebnf$2", "namedInteger"]},
    {"name": "namedIntegers$ebnf$2", "symbols": ["namedIntegers$ebnf$2$subexpression$1", "namedIntegers$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "namedIntegers", "symbols": [(lexer.has("ampersand") ? {type: "ampersand"} : ampersand), {"literal":"vars","pos":107}, "namedIntegers$ebnf$1", "namedInteger", "namedIntegers$ebnf$2"], "postprocess": d => null},
    {"name": "namedInteger$ebnf$1", "symbols": []},
    {"name": "namedInteger$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "namedInteger$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "namedInteger$ebnf$2", "symbols": []},
    {"name": "namedInteger$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "namedInteger$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "namedInteger", "symbols": [(lexer.has("name") ? {type: "name"} : name), "namedInteger$ebnf$1", (lexer.has("equals") ? {type: "equals"} : equals), "namedInteger$ebnf$2", "zinteger"], "postprocess": buildNamedInteger},
    {"name": "composition$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "composition$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "composition$ebnf$1$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "composition$ebnf$1$subexpression$1$ebnf$2", "symbols": []},
    {"name": "composition$ebnf$1$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "composition$ebnf$1$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "composition$ebnf$1$subexpression$1", "symbols": ["composition$ebnf$1$subexpression$1$ebnf$1", (lexer.has("star") ? {type: "star"} : star), "composition$ebnf$1$subexpression$1$ebnf$2", "expression"]},
    {"name": "composition$ebnf$1", "symbols": ["composition$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "composition$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "composition", "symbols": ["production", "composition$ebnf$1"], "postprocess": d => buildOp( d, 'compose' )},
    {"name": "production$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "production$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "production$ebnf$1$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "production$ebnf$1$subexpression$1$ebnf$2", "symbols": []},
    {"name": "production$ebnf$1$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "production$ebnf$1$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "production$ebnf$1$subexpression$1", "symbols": ["production$ebnf$1$subexpression$1$ebnf$1", (lexer.has("tilda") ? {type: "tilda"} : tilda), "production$ebnf$1$subexpression$1$ebnf$2", "expression"]},
    {"name": "production$ebnf$1", "symbols": ["production$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "production$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "production", "symbols": ["exponentiation", "production$ebnf$1"], "postprocess": d => buildOp( d, 'product' )},
    {"name": "exponentiation$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "exponentiation$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "exponentiation$ebnf$1$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "exponentiation$ebnf$1$subexpression$1$ebnf$2", "symbols": []},
    {"name": "exponentiation$ebnf$1$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "exponentiation$ebnf$1$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "exponentiation$ebnf$1$subexpression$1", "symbols": ["exponentiation$ebnf$1$subexpression$1$ebnf$1", (lexer.has("exp") ? {type: "exp"} : exp), "exponentiation$ebnf$1$subexpression$1$ebnf$2", "zinteger"]},
    {"name": "exponentiation$ebnf$1", "symbols": ["exponentiation$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "exponentiation$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "exponentiation", "symbols": ["action", "exponentiation$ebnf$1"], "postprocess": d => buildOp( d, 'power' )},
    {"name": "action$subexpression$1", "symbols": ["cbrackets"]},
    {"name": "action$subexpression$1", "symbols": ["cassignment"]},
    {"name": "action$subexpression$1", "symbols": ["litindex"]},
    {"name": "action$subexpression$1", "symbols": ["index"]},
    {"name": "action$subexpression$1", "symbols": ["mg"]},
    {"name": "action$subexpression$1", "symbols": ["mgraw"]},
    {"name": "action$subexpression$1", "symbols": [(lexer.has("name") ? {type: "name"} : name)], "postprocess": buildNamedAction},
    {"name": "action", "symbols": ["action$subexpression$1"], "postprocess": id},
    {"name": "cbrackets$ebnf$1", "symbols": []},
    {"name": "cbrackets$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "cbrackets$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "cbrackets$ebnf$2", "symbols": []},
    {"name": "cbrackets$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "cbrackets$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "cbrackets", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "cbrackets$ebnf$1", "expression", "cbrackets$ebnf$2", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": trimTree},
    {"name": "cassignment$ebnf$1", "symbols": []},
    {"name": "cassignment$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "cassignment$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "cassignment$ebnf$2", "symbols": []},
    {"name": "cassignment$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "cassignment$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "cassignment", "symbols": [(lexer.has("name") ? {type: "name"} : name), "cassignment$ebnf$1", (lexer.has("equals") ? {type: "equals"} : equals), "cassignment$ebnf$2", "expression"], "postprocess": buildAssignment},
    {"name": "index$subexpression$1$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "index$subexpression$1$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "index$subexpression$1$ebnf$1$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "index$subexpression$1$ebnf$1$subexpression$1", "symbols": ["index$subexpression$1$ebnf$1$subexpression$1$ebnf$1", "perms"]},
    {"name": "index$subexpression$1$ebnf$1", "symbols": ["index$subexpression$1$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "index$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "index$subexpression$1", "symbols": ["index$subexpression$1$ebnf$1"]},
    {"name": "index$subexpression$1$ebnf$2$subexpression$1$ebnf$1", "symbols": []},
    {"name": "index$subexpression$1$ebnf$2$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "index$subexpression$1$ebnf$2$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "index$subexpression$1$ebnf$2$subexpression$1", "symbols": ["index$subexpression$1$ebnf$2$subexpression$1$ebnf$1", "factuples"]},
    {"name": "index$subexpression$1$ebnf$2", "symbols": ["index$subexpression$1$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "index$subexpression$1$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "index$subexpression$1", "symbols": ["index$subexpression$1$ebnf$2"]},
    {"name": "index$subexpression$1", "symbols": []},
    {"name": "index", "symbols": ["box", "index$subexpression$1"], "postprocess": d => buildIndex(d)},
    {"name": "box$subexpression$1$ebnf$1", "symbols": []},
    {"name": "box$subexpression$1$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "box$subexpression$1$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "box$subexpression$1$ebnf$1$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "box$subexpression$1$ebnf$1$subexpression$1$ebnf$2", "symbols": []},
    {"name": "box$subexpression$1$ebnf$1$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "box$subexpression$1$ebnf$1$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "box$subexpression$1$ebnf$1$subexpression$1", "symbols": ["box$subexpression$1$ebnf$1$subexpression$1$ebnf$1", (lexer.has("colon") ? {type: "colon"} : colon), "box$subexpression$1$ebnf$1$subexpression$1$ebnf$2", "zinteger"]},
    {"name": "box$subexpression$1$ebnf$1", "symbols": ["box$subexpression$1$ebnf$1$subexpression$1", "box$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "box$subexpression$1", "symbols": ["zinteger", "box$subexpression$1$ebnf$1"]},
    {"name": "box", "symbols": ["box$subexpression$1"], "postprocess": buildBox},
    {"name": "litindex$ebnf$1", "symbols": []},
    {"name": "litindex$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "litindex$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "litindex$ebnf$2$subexpression$1$ebnf$1", "symbols": []},
    {"name": "litindex$ebnf$2$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "litindex$ebnf$2$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "litindex$ebnf$2$subexpression$1", "symbols": ["cycles", "litindex$ebnf$2$subexpression$1$ebnf$1"]},
    {"name": "litindex$ebnf$2", "symbols": ["litindex$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "litindex$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "litindex$ebnf$3", "symbols": []},
    {"name": "litindex$ebnf$3$subexpression$1$ebnf$1", "symbols": []},
    {"name": "litindex$ebnf$3$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "litindex$ebnf$3$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "litindex$ebnf$3$subexpression$1$ebnf$2", "symbols": []},
    {"name": "litindex$ebnf$3$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "litindex$ebnf$3$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "litindex$ebnf$3$subexpression$1", "symbols": ["litindex$ebnf$3$subexpression$1$ebnf$1", (lexer.has("comma") ? {type: "comma"} : comma), "litindex$ebnf$3$subexpression$1$ebnf$2", "range"]},
    {"name": "litindex$ebnf$3", "symbols": ["litindex$ebnf$3$subexpression$1", "litindex$ebnf$3"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "litindex$ebnf$4", "symbols": []},
    {"name": "litindex$ebnf$4", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "litindex$ebnf$4"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "litindex", "symbols": [(lexer.has("lsquare") ? {type: "lsquare"} : lsquare), "litindex$ebnf$1", "litindex$ebnf$2", "range", "litindex$ebnf$3", "litindex$ebnf$4", (lexer.has("rsquare") ? {type: "rsquare"} : rsquare)], "postprocess": buildLitIndex},
    {"name": "range$subexpression$1$ebnf$1", "symbols": []},
    {"name": "range$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "range$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "range$subexpression$1$ebnf$2", "symbols": []},
    {"name": "range$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "range$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "range$subexpression$1", "symbols": ["pinteger", "range$subexpression$1$ebnf$1", (lexer.has("between") ? {type: "between"} : between), "range$subexpression$1$ebnf$2", "pinteger"]},
    {"name": "range", "symbols": ["range$subexpression$1"], "postprocess": buildRange},
    {"name": "range", "symbols": ["pinteger"], "postprocess": id},
    {"name": "cycles$subexpression$1$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "cycles$subexpression$1$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "cycles$subexpression$1$ebnf$1$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "cycles$subexpression$1$ebnf$1$subexpression$1", "symbols": ["cycle", "cycles$subexpression$1$ebnf$1$subexpression$1$ebnf$1"]},
    {"name": "cycles$subexpression$1$ebnf$1", "symbols": ["cycles$subexpression$1$ebnf$1$subexpression$1"]},
    {"name": "cycles$subexpression$1$ebnf$1$subexpression$2$ebnf$1", "symbols": []},
    {"name": "cycles$subexpression$1$ebnf$1$subexpression$2$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "cycles$subexpression$1$ebnf$1$subexpression$2$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "cycles$subexpression$1$ebnf$1$subexpression$2", "symbols": ["cycle", "cycles$subexpression$1$ebnf$1$subexpression$2$ebnf$1"]},
    {"name": "cycles$subexpression$1$ebnf$1", "symbols": ["cycles$subexpression$1$ebnf$1$subexpression$2", "cycles$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "cycles$subexpression$1", "symbols": ["cycles$subexpression$1$ebnf$1"]},
    {"name": "cycles", "symbols": ["cycles$subexpression$1"], "postprocess": buildCycles},
    {"name": "cycle$ebnf$1", "symbols": []},
    {"name": "cycle$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "cycle$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "cycle$ebnf$2", "symbols": []},
    {"name": "cycle$ebnf$2$subexpression$1$ebnf$1", "symbols": []},
    {"name": "cycle$ebnf$2$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "cycle$ebnf$2$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "cycle$ebnf$2$subexpression$1$ebnf$2", "symbols": []},
    {"name": "cycle$ebnf$2$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "cycle$ebnf$2$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "cycle$ebnf$2$subexpression$1", "symbols": ["cycle$ebnf$2$subexpression$1$ebnf$1", (lexer.has("comma") ? {type: "comma"} : comma), "cycle$ebnf$2$subexpression$1$ebnf$2", "pinteger"]},
    {"name": "cycle$ebnf$2", "symbols": ["cycle$ebnf$2$subexpression$1", "cycle$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "cycle$ebnf$3", "symbols": []},
    {"name": "cycle$ebnf$3", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "cycle$ebnf$3"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "cycle", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "cycle$ebnf$1", "pinteger", "cycle$ebnf$2", "cycle$ebnf$3", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": buildCycle},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$2", "symbols": []},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$1", "symbols": []},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$2", "symbols": []},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$2$subexpression$1", "symbols": ["factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$1", (lexer.has("comma") ? {type: "comma"} : comma), "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$2", "zinteger"]},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$2", "symbols": ["factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$2$subexpression$1", "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$3", "symbols": []},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$3", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$3"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$4", "symbols": []},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$4", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$4"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$1", "symbols": [(lexer.has("lcurly") ? {type: "lcurly"} : lcurly), "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$1", "zinteger", "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$2", "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$3", (lexer.has("rcurly") ? {type: "rcurly"} : rcurly), "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$4"]},
    {"name": "factuples$subexpression$1$ebnf$1", "symbols": ["factuples$subexpression$1$ebnf$1$subexpression$1"]},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$1", "symbols": []},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$2", "symbols": []},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$2$subexpression$1$ebnf$1", "symbols": []},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$2$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$2$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$2$subexpression$1$ebnf$2", "symbols": []},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$2$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$2$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$2$subexpression$1", "symbols": ["factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$2$subexpression$1$ebnf$1", (lexer.has("comma") ? {type: "comma"} : comma), "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$2$subexpression$1$ebnf$2", "zinteger"]},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$2", "symbols": ["factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$2$subexpression$1", "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$3", "symbols": []},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$3", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$3"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$4", "symbols": []},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$4", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$4"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$2", "symbols": [(lexer.has("lcurly") ? {type: "lcurly"} : lcurly), "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$1", "zinteger", "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$2", "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$3", (lexer.has("rcurly") ? {type: "rcurly"} : rcurly), "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$4"]},
    {"name": "factuples$subexpression$1$ebnf$1", "symbols": ["factuples$subexpression$1$ebnf$1$subexpression$2", "factuples$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuples$subexpression$1", "symbols": ["factuples$subexpression$1$ebnf$1"]},
    {"name": "factuples", "symbols": ["factuples$subexpression$1"], "postprocess": buildFactuples},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$2", "symbols": []},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$1", "symbols": []},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$2", "symbols": []},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$2$subexpression$1", "symbols": ["perms$subexpression$1$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$1", (lexer.has("comma") ? {type: "comma"} : comma), "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$2", "zinteger"]},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$2", "symbols": ["perms$subexpression$1$ebnf$1$subexpression$1$ebnf$2$subexpression$1", "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$3", "symbols": []},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$3", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$3"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$4", "symbols": []},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$4", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$4"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$1", "symbols": [(lexer.has("lsquare") ? {type: "lsquare"} : lsquare), "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$1", "zinteger", "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$2", "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$3", (lexer.has("rsquare") ? {type: "rsquare"} : rsquare), "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$4"]},
    {"name": "perms$subexpression$1$ebnf$1", "symbols": ["perms$subexpression$1$ebnf$1$subexpression$1"]},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$1", "symbols": []},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$2", "symbols": []},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$2$subexpression$1$ebnf$1", "symbols": []},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$2$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$2$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$2$subexpression$1$ebnf$2", "symbols": []},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$2$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$2$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$2$subexpression$1", "symbols": ["perms$subexpression$1$ebnf$1$subexpression$2$ebnf$2$subexpression$1$ebnf$1", (lexer.has("comma") ? {type: "comma"} : comma), "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$2$subexpression$1$ebnf$2", "zinteger"]},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$2", "symbols": ["perms$subexpression$1$ebnf$1$subexpression$2$ebnf$2$subexpression$1", "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$3", "symbols": []},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$3", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$3"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$4", "symbols": []},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$4", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$4"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$2", "symbols": [(lexer.has("lsquare") ? {type: "lsquare"} : lsquare), "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$1", "zinteger", "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$2", "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$3", (lexer.has("rsquare") ? {type: "rsquare"} : rsquare), "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$4"]},
    {"name": "perms$subexpression$1$ebnf$1", "symbols": ["perms$subexpression$1$ebnf$1$subexpression$2", "perms$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perms$subexpression$1", "symbols": ["perms$subexpression$1$ebnf$1"]},
    {"name": "perms", "symbols": ["perms$subexpression$1"], "postprocess": buildPerms},
    {"name": "mg$ebnf$1", "symbols": []},
    {"name": "mg$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "mg$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "mg$ebnf$2", "symbols": []},
    {"name": "mg$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "mg$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "mg", "symbols": ["zinteger", "mg$ebnf$1", (lexer.has("percent") ? {type: "percent"} : percent), "mg$ebnf$2", "zinteger"], "postprocess": d => buildMultiplicativeGroup(d)},
    {"name": "mgraw$ebnf$1", "symbols": []},
    {"name": "mgraw$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "mgraw$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "mgraw$ebnf$2", "symbols": []},
    {"name": "mgraw$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "mgraw$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "mgraw", "symbols": ["zinteger", "mgraw$ebnf$1", (lexer.has("at") ? {type: "at"} : at), "mgraw$ebnf$2", "zinteger"], "postprocess": d => buildMultiplicativeGroup(d, true)},
    {"name": "zinteger$subexpression$1", "symbols": [(lexer.has("name") ? {type: "name"} : name)], "postprocess": buildNamedZInteger},
    {"name": "zinteger$subexpression$1", "symbols": ["zbrackets"]},
    {"name": "zinteger$subexpression$1", "symbols": ["zpower"]},
    {"name": "zinteger$subexpression$1", "symbols": ["ninteger"]},
    {"name": "zinteger$subexpression$1", "symbols": ["pinteger"]},
    {"name": "zinteger", "symbols": ["zinteger$subexpression$1"], "postprocess": d => flatten(trimTree(d))},
    {"name": "zbrackets$ebnf$1", "symbols": []},
    {"name": "zbrackets$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "zbrackets$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "zbrackets$ebnf$2", "symbols": []},
    {"name": "zbrackets$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "zbrackets$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "zbrackets", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "zbrackets$ebnf$1", "zinteger", "zbrackets$ebnf$2", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": trimTree},
    {"name": "zpower$subexpression$1", "symbols": ["pinteger"]},
    {"name": "zpower$subexpression$1", "symbols": ["ninteger"]},
    {"name": "zpower$ebnf$1", "symbols": []},
    {"name": "zpower$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "zpower$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "zpower$ebnf$2", "symbols": []},
    {"name": "zpower$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "zpower$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "zpower", "symbols": ["zpower$subexpression$1", "zpower$ebnf$1", (lexer.has("exp") ? {type: "exp"} : exp), "zpower$ebnf$2", "zinteger"], "postprocess": buildExponentation},
    {"name": "ninteger", "symbols": [(lexer.has("minus") ? {type: "minus"} : minus), "pinteger"], "postprocess": buildNegation},
    {"name": "pinteger$ebnf$1", "symbols": [(lexer.has("plus") ? {type: "plus"} : plus)], "postprocess": id},
    {"name": "pinteger$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "pinteger", "symbols": ["pinteger$ebnf$1", "division"], "postprocess": trimTree},
    {"name": "division$ebnf$1", "symbols": []},
    {"name": "division$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "division$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "division$ebnf$1$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "division$ebnf$1$subexpression$1$ebnf$2", "symbols": []},
    {"name": "division$ebnf$1$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "division$ebnf$1$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "division$ebnf$1$subexpression$1", "symbols": ["division$ebnf$1$subexpression$1$ebnf$1", (lexer.has("slash") ? {type: "slash"} : slash), "division$ebnf$1$subexpression$1$ebnf$2", "zinteger"]},
    {"name": "division$ebnf$1", "symbols": ["division$ebnf$1$subexpression$1", "division$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "division", "symbols": ["multiplication", "division$ebnf$1"], "postprocess": buildDivision},
    {"name": "multiplication$ebnf$1", "symbols": []},
    {"name": "multiplication$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "multiplication$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "multiplication$ebnf$1$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "multiplication$ebnf$1$subexpression$1$ebnf$2", "symbols": []},
    {"name": "multiplication$ebnf$1$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "multiplication$ebnf$1$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "multiplication$ebnf$1$subexpression$1", "symbols": ["multiplication$ebnf$1$subexpression$1$ebnf$1", (lexer.has("period") ? {type: "period"} : period), "multiplication$ebnf$1$subexpression$1$ebnf$2", "zinteger"]},
    {"name": "multiplication$ebnf$1", "symbols": ["multiplication$ebnf$1$subexpression$1", "multiplication$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "multiplication", "symbols": ["addition", "multiplication$ebnf$1"], "postprocess": buildProduct},
    {"name": "addition$ebnf$1", "symbols": []},
    {"name": "addition$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "addition$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "addition$ebnf$1$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "addition$ebnf$1$subexpression$1$ebnf$2", "symbols": []},
    {"name": "addition$ebnf$1$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "addition$ebnf$1$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "addition$ebnf$1$subexpression$1", "symbols": ["addition$ebnf$1$subexpression$1$ebnf$1", (lexer.has("plus") ? {type: "plus"} : plus), "addition$ebnf$1$subexpression$1$ebnf$2", "zinteger"]},
    {"name": "addition$ebnf$1", "symbols": ["addition$ebnf$1$subexpression$1", "addition$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "addition", "symbols": ["subtraction", "addition$ebnf$1"], "postprocess": buildAddition},
    {"name": "subtraction$ebnf$1", "symbols": []},
    {"name": "subtraction$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "subtraction$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "subtraction$ebnf$1$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "subtraction$ebnf$1$subexpression$1$ebnf$2", "symbols": []},
    {"name": "subtraction$ebnf$1$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "subtraction$ebnf$1$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "subtraction$ebnf$1$subexpression$1", "symbols": ["subtraction$ebnf$1$subexpression$1$ebnf$1", (lexer.has("minus") ? {type: "minus"} : minus), "subtraction$ebnf$1$subexpression$1$ebnf$2", "zinteger"]},
    {"name": "subtraction$ebnf$1", "symbols": ["subtraction$ebnf$1$subexpression$1", "subtraction$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "subtraction", "symbols": [(lexer.has("number") ? {type: "number"} : number), "subtraction$ebnf$1"], "postprocess": buildSubtraction}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
