
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
                throw new Error( `Failed to connect to port ${ this.portName }` );
            }
        }
        const unconnected = () => {
            console.log('Could not connect to MIDI');
        };
        navigator.requestMIDIAccess().then( connected, unconnected );
    }
    sendMessage( message ) {
        if (this.midiOutput) {
            this.midiOutput.send( message );
            //console.log( `send message ${ message } to ${ this.midiOutput.name }` );
        } else {
            console.log('Not connected');
        }
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

    playCycle( cycle ) {
        const noteOnOff = (v) => (v < MidiDrumKit.SIZE)
            ? MidiSource.NOTE_ON
            : MidiSource.NOTE_OFF;
        const noteValue = (v) => {
            const x = (v < MidiDrumKit.SIZE)
                ? v
                : (2 * MidiDrumKit.SIZE) - v;
            return MidiDrumKit.START + x;
        };
        const messages = cycle.map( (value,i) => [ noteOnOff( value ), noteValue( value), this.velocity ] );
        console.log( `sending messages: ${ messages.map( m => `[${ m }]`).join(', ') }` );
        messages.forEach( message => this.sendMessage( message ) );
    }

}


class MidiKeyboard extends MidiSource {
    static START = 21;
    static NOTE_DURATION = 100;

    constructor() {
        super();
    }

    playCycle( cycle ) {
        const messages = cycle.map( (value,i) => [ MidiSource.NOTE_ON, MidiKeyboard.START + (value % 88), this.velocity ] );
        console.log( `sending messages: ${ messages.map( m => `[${ m }]`).join(', ') }` );
        messages.forEach( message => this.sendMessage( message ) );
    }

}