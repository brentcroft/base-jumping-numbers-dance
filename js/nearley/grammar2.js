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
		} else if ( Array.isArray( a ) ) {
			const candidate = a
				.map( b => trimTree( b ) )
				.filter( b => b != null )
				.filter( b => (!Array.isArray(b) || b.length > 0) );
			return Array.isArray(candidate) && candidate.length == 1
				? candidate[0]
				: candidate;
		} else if ( 'NL' == a.type ) {
			return null;
		} else if ( 'WS' == a.type ) {
			return null;
		} else if ( 'comment' == a.type ) {
			return null;
		} else if ( 'comma' == a.type ) {
			return null;
		} else if ( 'number' == a.type ) {
			return parseInt( a.text );
		} else {
			return a;
		}
	};
	const buildTuple = ( d ) => {
		const t = trimTree(d);
		if (Array.isArray(t) && t.length == 10 ) {
			return [t[1],...t[2]];
		}
		return t;
	};
	const buildOp = ( d, op ) => {
		const t = trimTree(d);
		if (Array.isArray(t) && t.length == 3 ) {
			return { 'op': op, 'l': t[0], 'r': t[2] };
		}
		return t;
	};
	const buildBox = ( d ) => {
		const t = trimTree(d);
		if (Array.isArray(t) && t.length == 4 ) {
			return { 'op': 'box', 'bases': [t[1],...t[2]] };
		}
		return t;
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
    {"name": "expression$subexpression$1", "symbols": ["box"]},
    {"name": "expression$subexpression$1", "symbols": ["cycles"]},
    {"name": "expression$subexpression$1", "symbols": ["brackets"]},
    {"name": "expression$subexpression$1", "symbols": [(lexer.has("number") ? {type: "number"} : number)]},
    {"name": "expression", "symbols": ["expression$subexpression$1"]},
    {"name": "operation$subexpression$1", "symbols": ["twist"]},
    {"name": "operation$subexpression$1", "symbols": ["compose"]},
    {"name": "operation$subexpression$1", "symbols": ["power"]},
    {"name": "operation$subexpression$1", "symbols": ["product"]},
    {"name": "operation$subexpression$1", "symbols": ["product2"]},
    {"name": "operation", "symbols": ["operation$subexpression$1"]},
    {"name": "cycles$subexpression$1", "symbols": ["compose"]},
    {"name": "cycles$subexpression$1", "symbols": ["twist"]},
    {"name": "cycles$subexpression$1", "symbols": ["power"]},
    {"name": "cycles$subexpression$1", "symbols": ["product"]},
    {"name": "cycles$subexpression$1", "symbols": ["product2"]},
    {"name": "cycles", "symbols": ["cycles$subexpression$1"]},
    {"name": "power$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "power$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "power$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "power$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "power", "symbols": ["expression", "power$ebnf$1", (lexer.has("exp") ? {type: "exp"} : exp), "power$ebnf$2", (lexer.has("number") ? {type: "number"} : number)], "postprocess": d => buildOp( d, 'power' )},
    {"name": "compose$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "compose$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "compose$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "compose$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "compose", "symbols": ["expression", "compose$ebnf$1", (lexer.has("star") ? {type: "star"} : star), "compose$ebnf$2", "expression"], "postprocess": d => buildOp( d, 'compose' )},
    {"name": "twist$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "twist$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "twist$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "twist$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "twist", "symbols": [(lexer.has("number") ? {type: "number"} : number), "twist$ebnf$1", (lexer.has("colon") ? {type: "colon"} : colon), "twist$ebnf$2", (lexer.has("number") ? {type: "number"} : number)], "postprocess": d => buildOp( d, 'twist' )},
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
    {"name": "brackets$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "brackets$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "brackets$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "brackets$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "brackets", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "brackets$ebnf$1", "operation", "brackets$ebnf$2", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess":  d => {
        	const t = trimTree(d)
        	return t[1];
        } },
    {"name": "box$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "box$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "box$ebnf$2", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": id},
    {"name": "box$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "box$ebnf$3", "symbols": []},
    {"name": "box$ebnf$3$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "box$ebnf$3$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "box$ebnf$3$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "box$ebnf$3$subexpression$1$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "box$ebnf$3$subexpression$1", "symbols": ["box$ebnf$3$subexpression$1$ebnf$1", (lexer.has("comma") ? {type: "comma"} : comma), "box$ebnf$3$subexpression$1$ebnf$2", (lexer.has("number") ? {type: "number"} : number)]},
    {"name": "box$ebnf$3", "symbols": ["box$ebnf$3$subexpression$1", "box$ebnf$3"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "box$ebnf$4", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "box$ebnf$4", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "box", "symbols": [(lexer.has("lsquare") ? {type: "lsquare"} : lsquare), "box$ebnf$1", "box$ebnf$2", "box$ebnf$3", "box$ebnf$4", (lexer.has("rsquare") ? {type: "rsquare"} : rsquare)], "postprocess": buildBox},
    {"name": "tuple$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "tuple$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "tuple$ebnf$2", "symbols": []},
    {"name": "tuple$ebnf$2$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "tuple$ebnf$2$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "tuple$ebnf$2$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "tuple$ebnf$2$subexpression$1$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "tuple$ebnf$2$subexpression$1", "symbols": ["tuple$ebnf$2$subexpression$1$ebnf$1", (lexer.has("comma") ? {type: "comma"} : comma), "tuple$ebnf$2$subexpression$1$ebnf$2", (lexer.has("number") ? {type: "number"} : number)]},
    {"name": "tuple$ebnf$2", "symbols": ["tuple$ebnf$2$subexpression$1", "tuple$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "tuple$ebnf$3", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "tuple$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "tuple", "symbols": [(lexer.has("lsquare") ? {type: "lsquare"} : lsquare), "tuple$ebnf$1", (lexer.has("number") ? {type: "number"} : number), "tuple$ebnf$2", "tuple$ebnf$3", (lexer.has("rsquare") ? {type: "rsquare"} : rsquare)], "postprocess": buildTuple}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
