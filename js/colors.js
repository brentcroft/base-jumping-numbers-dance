
class ColorBasePlane extends BasePlane {

    constructor( param, colorOrbitIndex = 0, minPixel = 0 ) {
        super( param );
        this.colorOrbitIndex = colorOrbitIndex;
        this.minPixel = minPixel;
        this.colorPoints = this.orbits[ this.colorOrbitIndex % this.orbits.length ].getCoordArray();
    }

    colorForIndex( index ) {
        const colorPoint = this.colorPoints[ index % this.colorPoints.length ];
        const picker = (x,i) => this.minPixel + Math.round( ( 256 - this.minPixel ) * x / this.box.bases[i] );
        return colorPoint
            .map( (x,i) => picker(x,i) )
            .map( x => x.toString( 16 ).padStart( 2, '0' ) )
            .reduce( (a,c) => a + c, "#" );
    }
}