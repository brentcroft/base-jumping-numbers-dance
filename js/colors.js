
colourPointIndexDefault = {
    bases: [ 11, 5, 7 ],
    actionIndex: 5,
    orbitIndex: 5,
    minPixel: 25,
    maxPixel: 200,
    colorPoints: [[10,1,6],[10,1,0],[0,1,4,],[6,1,4],[6,2,5],[8,3,4],[7,1,3],[5,3,1],[2,3,4],[7,0,2],[3,2,2],[3,0,6],[9,3,3],[5,2,6],[10,2,1],[2,2,3],[5,4,2],[4,4,3],[6,3,0],[1,4,0],[1,0,2],[3,1,1],[1,4,6],[10,0,5],[8,0,1],[1,3,5],[8,4,5],[9,2,2],[4,1,0],[0,0,3],[4,0,5],[7,4,6]]
};

class ColorBasePlane  {

//    constructor( bases, colorPlaneIndex = 1, colorOrbitIndex = 0, minPixel = 0, maxPixel = 255 ) {
//        super( bases, { toggles: ['palindromicPlanes','mixedPlanes','orthogonalPlanes'] } );
//        this.colorPlaneIndex = colorPlaneIndex;
//        this.colorOrbitIndex = colorOrbitIndex;
//        this.minPixel = minPixel;
//        this.maxPixel = maxPixel;
//        const orbits = this.boxActions[ this.colorPlaneIndex % this.boxActions.length ].orbits;
//        const orbit = orbits[ this.colorOrbitIndex % orbits.length ];
//        this.colorPoints = orbit.getCoordArray();
//    }

    constructor(  bases = [ 11, 5, 7 ], colorPlaneIndex = 1, colorOrbitIndex = 0, minPixel = 0, maxPixel = 255  ) {
        this.bases = bases;
        this.minPixel = minPixel;
        this.maxPixel = maxPixel;
        this.colorPoints = colourPointIndexDefault.colorPoints;
    }

    colorForIndex( index ) {
        const colorPoint = this.colorPoints[ index % this.colorPoints.length ];
        const picker = (x,i) => this.minPixel + Math.round( ( this.maxPixel - this.minPixel ) * x / this.bases[i] );
        return colorPoint
            .map( (x,i) => picker(x,i) )
            .map( x => x.toString( 16 ).padStart( 2, '0' ) )
            .reduce( (a,c) => a + c, "#" );
    }
}