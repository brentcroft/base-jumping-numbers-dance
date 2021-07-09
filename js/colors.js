
class ColorOrbitSystem extends OrbitSystem {

    constructor( param, colorOrbitIndex = 1, minPixel = 0 ) {
        super( param );
        this.colorOrbitIndex = colorOrbitIndex;
        this.minPixel = minPixel;
    }

    colorForIndex( index ) {
        const colorPoints = this.orbits[ this.colorOrbitIndex % this.orbits.length ].getCoordArray();
        const colorPoint = colorPoints[ index % colorPoints.length ];
        return "#" + colorPoint
            .map( (x,i) => this.minPixel + Math.round( ( 256 - this.minPixel ) * x / this.box.bases[i] ) )
            .map( x => x.toString( 16 ).padStart( 2, '0' ) )
            .reduce( (a,c) => a + c );
    }
}