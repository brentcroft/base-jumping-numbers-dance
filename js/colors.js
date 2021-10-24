
colourPointIndexDefault = {
    bases: [ 8, 3, 6 ],
    orbitIndex: 1,
    minPixel: 25,
    maxPixel: 200,
};

class ColorBasePlane extends IndexedBox {

    constructor( bases, colorOrbitIndex = 0, minPixel = 0, maxPixel = 255 ) {
        super( bases );
        this.colorOrbitIndex = colorOrbitIndex;
        this.minPixel = minPixel;
        this.maxPixel = maxPixel;
        const orbits = this.indexPlanes[1].orbits;
        const orbit = orbits[ this.colorOrbitIndex % orbits.length ];
        this.colorPoints = orbit.getCoordArray();
    }

    colorForIndex( index ) {
        const colorPoint = this.colorPoints[ index % this.colorPoints.length ];
        const picker = (x,i) => this.minPixel + Math.round( ( this.maxPixel - this.minPixel ) * x / this.box.bases[i] );
        return colorPoint
            .map( (x,i) => picker(x,i) )
            .map( x => x.toString( 16 ).padStart( 2, '0' ) )
            .reduce( (a,c) => a + c, "#" );
    }
}