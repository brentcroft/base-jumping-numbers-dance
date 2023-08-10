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
        number:     /-?[0-9]+/,
        string:     /"(?:\\["\\]|[^\n"\\])*"/,
        exp:        '^',
        star:       '*',
        colon:      ':',
        tilda:      '~',
        pipe:       '|',
        percent:    '%',
        comma:      ',',
        lparen:     '(',
        rparen:     ')',
        lsquare:    '[',
        rsquare:    ']',
        lcurly:     '{',
        rcurly:     '}',
        NL:    { match: /\n|;+/, lineBreaks: true },
	});
    const trimTree = ( a ) => {
		if ( a == null ) {
			return null;
		} else if ( Number.isInteger( a ) ) {
			return a;
		} else if ( Array.isArray( a ) ) {
			const candidate = a
				.map( b => trimTree( b ) )
				.filter( b => b != null )
				.filter( b => (!Array.isArray(b) || b.length > 0) );
			return Array.isArray(candidate) && candidate.length == 1
				? candidate[0]
				: candidate;
		} else if ( 'number' == a.type ) {
			return parseInt( a.text );
		} else if ( [
				'NL', 'WS', 'comment', 
				'comma', 'lsquare', 'rsquare', 'lparen', 'rparen', 'lcurly', 'rcurly',
				'exp', 'star', 'colon', 'tilda', 'pipe', 'percent' 
			].includes( a.type ) ) {
			return null;
		} else {
			return a;
		}
	};
	const buildOp = ( d, op ) => {
		const t = trimTree(d);
		if (Array.isArray(t) && t.length == 2 ) {
			return { 'op': op, 'l': t[0], 'r': t[1] };
		}
		return [ t ];
	};
	const buildFactuple = ( d ) => {
		var t = trimTree(d);
		//if ( Array.isArray(t) ) {
		//	t = t.flatMap( c => Array.isArray( c ) ? c : [ c ] );
		//}
		return t;
	};
	const buildPerm = ( d, l, r ) => {
		var t = trimTree(d);
		if ( Array.isArray(t) ) {
			t = t.flatMap( c => Array.isArray( c ) ? c : [ c ] );
			// check every index occurs
			if ( t.filter( (c,i) => t.indexOf(i) < 0 ).length > 0 ) {
				return r;
			}
		}
		return t;
	};
	const buildBox = ( d ) => {
		const t = trimTree(d);
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
	const buildIndex = ( d, isFactIndex ) => {
		const t = trimTree(d);
		if ( Array.isArray( t ) ) {
			if (Array.isArray(t[1][0])) {
				return isFactIndex
					? { 'op': 'index', 'box': t[0], 'facts': t[1] }
					: { 'op': 'index', 'box': t[0], 'perms': t[1] };
			} else {
				return isFactIndex
					? { 'op': 'index', 'box': t[0], 'facts': [t[1]] }
					: { 'op': 'index', 'box': t[0], 'perms': [t[1]] };
			}			
		} else {
			return { 'op': 'index', 'box': t };
		}
	};
var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "main", "symbols": ["lines"], "postprocess": d => d[0]},
    {"name": "lines$ebnf$1", "symbols": []},
    {"name": "lines$ebnf$1$subexpression$1", "symbols": [(lexer.has("NL") ? {type: "NL"} : NL), "line"]},
    {"name": "lines$ebnf$1", "symbols": ["lines$ebnf$1$subexpression$1", "lines$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "lines", "symbols": ["line", "lines$ebnf$1"], "postprocess":  d => {
        	const t = trimTree(d);
        	if (Array.isArray(t) && t.length == 2 && Array.isArray(t[1]) ) {
        		return [t[0],...t[1]];
        	}
        	return t;
        } },
    {"name": "line", "symbols": ["content"]},
    {"name": "line", "symbols": [(lexer.has("comment") ? {type: "comment"} : comment)]},
    {"name": "line", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)]},
    {"name": "line", "symbols": []},
    {"name": "content$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "content$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "content$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "content$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "content$ebnf$3", "symbols": [(lexer.has("comment") ? {type: "comment"} : comment)], "postprocess": id},
    {"name": "content$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "content", "symbols": ["content$ebnf$1", "expression", "content$ebnf$2", "content$ebnf$3"]},
    {"name": "expression$subexpression$1", "symbols": ["cycles"]},
    {"name": "expression$subexpression$1", "symbols": ["brackets"]},
    {"name": "expression", "symbols": ["expression$subexpression$1"]},
    {"name": "cycles$subexpression$1", "symbols": ["factindex"]},
    {"name": "cycles$subexpression$1", "symbols": ["index"]},
    {"name": "cycles$subexpression$1", "symbols": ["product"]},
    {"name": "cycles$subexpression$1", "symbols": ["product2"]},
    {"name": "cycles$subexpression$1", "symbols": ["compose"]},
    {"name": "cycles$subexpression$1", "symbols": ["power"]},
    {"name": "cycles", "symbols": ["cycles$subexpression$1"]},
    {"name": "brackets$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "brackets$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "brackets$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "brackets$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "brackets", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "brackets$ebnf$1", "cycles", "brackets$ebnf$2", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": trimTree},
    {"name": "index$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "index$ebnf$1$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "index$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "index$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "index$ebnf$1$subexpression$1$ebnf$2$subexpression$1", "symbols": ["index$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$1", "perm"]},
    {"name": "index$ebnf$1$subexpression$1$ebnf$2", "symbols": ["index$ebnf$1$subexpression$1$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "index$ebnf$1$subexpression$1$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "index$ebnf$1$subexpression$1", "symbols": ["index$ebnf$1$subexpression$1$ebnf$1", "perm", "index$ebnf$1$subexpression$1$ebnf$2"]},
    {"name": "index$ebnf$1", "symbols": ["index$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "index$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "index", "symbols": ["box", "index$ebnf$1"], "postprocess": d => buildIndex(d, false)},
    {"name": "factindex$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "factindex$ebnf$1$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "factindex$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "factindex$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "factindex$ebnf$1$subexpression$1$ebnf$2$subexpression$1", "symbols": ["factindex$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$1", "factuple"]},
    {"name": "factindex$ebnf$1$subexpression$1$ebnf$2", "symbols": ["factindex$ebnf$1$subexpression$1$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "factindex$ebnf$1$subexpression$1$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "factindex$ebnf$1$subexpression$1", "symbols": ["factindex$ebnf$1$subexpression$1$ebnf$1", "factuple", "factindex$ebnf$1$subexpression$1$ebnf$2"]},
    {"name": "factindex$ebnf$1", "symbols": ["factindex$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "factindex$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "factindex", "symbols": ["box", "factindex$ebnf$1"], "postprocess": d => buildIndex(d, true)},
    {"name": "box$ebnf$1", "symbols": []},
    {"name": "box$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "box$ebnf$1$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "box$ebnf$1$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "box$ebnf$1$subexpression$1$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "box$ebnf$1$subexpression$1", "symbols": ["box$ebnf$1$subexpression$1$ebnf$1", (lexer.has("colon") ? {type: "colon"} : colon), "box$ebnf$1$subexpression$1$ebnf$2", (lexer.has("number") ? {type: "number"} : number)]},
    {"name": "box$ebnf$1", "symbols": ["box$ebnf$1$subexpression$1", "box$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "box", "symbols": [(lexer.has("number") ? {type: "number"} : number), "box$ebnf$1"], "postprocess": buildBox},
    {"name": "factuple$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "factuple$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "factuple$ebnf$2", "symbols": []},
    {"name": "factuple$ebnf$2$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "factuple$ebnf$2$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "factuple$ebnf$2$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "factuple$ebnf$2$subexpression$1$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "factuple$ebnf$2$subexpression$1", "symbols": ["factuple$ebnf$2$subexpression$1$ebnf$1", (lexer.has("comma") ? {type: "comma"} : comma), "factuple$ebnf$2$subexpression$1$ebnf$2", (lexer.has("number") ? {type: "number"} : number)]},
    {"name": "factuple$ebnf$2", "symbols": ["factuple$ebnf$2$subexpression$1", "factuple$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuple$ebnf$3", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "factuple$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "factuple", "symbols": [(lexer.has("lcurly") ? {type: "lcurly"} : lcurly), "factuple$ebnf$1", (lexer.has("number") ? {type: "number"} : number), "factuple$ebnf$2", "factuple$ebnf$3", (lexer.has("rcurly") ? {type: "rcurly"} : rcurly)], "postprocess": buildFactuple},
    {"name": "perm$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "perm$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "perm$ebnf$2", "symbols": []},
    {"name": "perm$ebnf$2$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "perm$ebnf$2$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "perm$ebnf$2$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "perm$ebnf$2$subexpression$1$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "perm$ebnf$2$subexpression$1", "symbols": ["perm$ebnf$2$subexpression$1$ebnf$1", (lexer.has("comma") ? {type: "comma"} : comma), "perm$ebnf$2$subexpression$1$ebnf$2", (lexer.has("number") ? {type: "number"} : number)]},
    {"name": "perm$ebnf$2", "symbols": ["perm$ebnf$2$subexpression$1", "perm$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perm$ebnf$3", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "perm$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "perm", "symbols": [(lexer.has("lsquare") ? {type: "lsquare"} : lsquare), "perm$ebnf$1", (lexer.has("number") ? {type: "number"} : number), "perm$ebnf$2", "perm$ebnf$3", (lexer.has("rsquare") ? {type: "rsquare"} : rsquare)], "postprocess": buildPerm},
    {"name": "product$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "product$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "product$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "product$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "product", "symbols": ["expression", "product$ebnf$1", (lexer.has("tilda") ? {type: "tilda"} : tilda), "product$ebnf$2", "expression"], "postprocess": d => buildOp( d, 'product' )},
    {"name": "product2$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "product2$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "product2$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "product2$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "product2", "symbols": ["expression", "product2$ebnf$1", (lexer.has("pipe") ? {type: "pipe"} : pipe), "product2$ebnf$2", "expression"], "postprocess": d => buildOp( d, 'product2' )},
    {"name": "power$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "power$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "power$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "power$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "power", "symbols": ["expression", "power$ebnf$1", (lexer.has("exp") ? {type: "exp"} : exp), "power$ebnf$2", (lexer.has("number") ? {type: "number"} : number)], "postprocess": d => buildOp( d, 'power' )},
    {"name": "compose$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "compose$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "compose$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "compose$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "compose", "symbols": ["expression", "compose$ebnf$1", (lexer.has("star") ? {type: "star"} : star), "compose$ebnf$2", "expression"], "postprocess": d => buildOp( d, 'compose' )}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
