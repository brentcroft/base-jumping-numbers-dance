
class MidiSource {
    static NOTE_ON = 0x92;
    static NOTE_OFF = 0x82;

    constructor( tick = 200 ) {
        this.tick = tick;
        this.midiOutput = null;
        this.quitPlayTask = false;
        this.velocity = 0x7f;
        this.portName = 'loopMIDI Port';
        this.getOutputs();
    }

    getOutputs() {
        const connected = ( midiAccess ) => {
            console.log( midiAccess );
            const outputs = midiAccess.outputs;
            console.log( outputs );
            const updateDevices = (event) => console.log(event);
            const handleOutput = (event) => console.log(event);
            midiAccess.addEventListener( 'statechange', updateDevices );
            outputs.forEach( output => {
                if ( output.name == this.portName ) {
                    console.log( `Connected to ${ output.name }` );
                    output.onmidimessage = handleOutput;
                    this.midiOutput = output;
                }
            } );
            if (!this.midiOutput) {
                console.log( `Failed to connect to port ${ this.portName }` );
            }
        }
        const unconnected = () => {
            console.log('Could not connect to MIDI');
        };
        navigator.requestMIDIAccess().then( connected, unconnected );
    }
    sendMessage( message ) {
        if (!this.midiOutput) {
            this.getOutputs();
            this.midiOutput.send( message );
        }
        if (this.midiOutput) {
           this.midiOutput.send( message );
        } else {
            console.log('Not connected');
        }
    }
    playCycle( cycle ) {
        const messages = cycle.map( (value,i) => [ this.noteOnOff( value ), this.noteValue( value), this.velocity ] );
        console.log( `sending messages: ${ messages.map( m => `[${ m }]`).join(', ') }` );
        messages.forEach( message => this.sendMessage( message ) );
    }
}

class MidiDrumKit extends MidiSource {
    static START = 36;
    static NOTE_DURATION = 100;
    static SIZE = 16;

    constructor( tick ) {
        super( tick );
        this.box = Box.of([ 32 ]);
    }

    noteOnOff(v){
        return (v < MidiDrumKit.SIZE)
                ? MidiSource.NOTE_ON
                : MidiSource.NOTE_OFF;
    }
    noteValue(v) {
        const x = (v < MidiDrumKit.SIZE)
            ? v
            : (2 * MidiDrumKit.SIZE) - v;
        return MidiDrumKit.START + x;
    }
}


class MidiKeyboard extends MidiSource {
    static START = 21;
    static NOTE_DURATION = 100;
    static SIZE = 16;

    constructor() {
        super();
    }

    noteOnOff(v){
        return (v < MidiKeyboard.SIZE)
                ? MidiSource.NOTE_ON
                : MidiSource.NOTE_OFF;
    }
    noteValue(v) {
        const x = (v < MidiKeyboard.SIZE)
            ? v
            : (2 * MidiKeyboard.SIZE) - v;
        return MidiKeyboard.START + x;
    }
}