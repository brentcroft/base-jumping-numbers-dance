
colourPointIndexDefault = {
    bases: [ 11, 5, 7 ],
    planeIndex: 5,
    orbitIndex: 5,
    minPixel: 25,
    maxPixel: 200,
};

class ColorBasePlane extends IndexedBox {

    constructor( bases, colorPlaneIndex = 1, colorOrbitIndex = 0, minPixel = 0, maxPixel = 255 ) {
        super( bases, { toggles: ['palindromicPlanes','mixedPlanes','orthogonalPlanes'] } );
        this.colorPlaneIndex = colorPlaneIndex;
        this.colorOrbitIndex = colorOrbitIndex;
        this.minPixel = minPixel;
        this.maxPixel = maxPixel;
        const orbits = this.indexPlanes[ this.colorPlaneIndex % this.indexPlanes.length ].orbits;
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