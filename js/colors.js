
class ColorBasePlane extends IndexedBox {

    constructor( bases, colorOrbitIndex = 0, minPixel = 0 ) {
        super( bases );
        this.colorOrbitIndex = colorOrbitIndex;
        this.minPixel = minPixel;
        const orbits = this.indexPlanes[0].orbits;
        const orbit = orbits[ this.colorOrbitIndex % orbits.length ];
        this.colorPoints = orbit.getCoordArray();
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