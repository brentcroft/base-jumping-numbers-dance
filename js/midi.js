
var percussionInstruments = {
     "": 0,
     "High Q": 27,
     "Slap": 28,
     "Scratch Push": 29,
     "Scratch Pull": 30,
     "Sticks": 31,
     "Square Click": 32,
     "Metronome Click": 33,
     "Metronome Bell": 34,
     "Acoustic Bass Drum": 35,
     "Electric Bass Drum": 36,
     "Side Stick": 37,
     "Acoustic Snare": 38,
     "Hand Clap": 39,
     "Electric Snare": 40,
     "Low Floor Tom": 41,
     "Closed Hi-hat": 42,
     "High Floor Tom": 43,
     "Pedal Hi-hat": 44,
     "Low Tom": 45,
     "Open Hi-hat": 46,
     "Low-Mid Tom": 47,
     "Hi-Mid Tom": 48,
     "Crash Cymbal 1": 49,
     "High Tom": 50,
     "Ride Cymbal 1": 51,
     "Chinese Cymbal": 52,
     "Ride Bell": 53,
     "Tambourine": 54,
     "Splash Cymbal": 55,
     "Cowbell": 56,
     "Crash Cymbal 2": 57,
     "Vibra Slap": 58,
     "Ride Cymbal 2": 59,
     "High Bongo": 60,
     "Low Bongo": 61,
     "Mute High Conga": 62,
     "Open High Conga": 63,
     "Low Conga": 64,
     "High Timbale": 65,
     "Low Timbale": 66,
     "High Agogô": 67,
     "Low Agogô": 68,
     "Cabasa": 69,
     "Maracas": 70,
     "Short Whistle": 71,
     "Long Whistle": 72,
     "Short Guiro": 73,
     "Long Guiro": 74,
     "Claves": 75,
     "High Woodblock": 76,
     "Low Woodblock": 77,
     "Mute Cuica": 78,
     "Open Cuica": 79,
     "Mute Triangle": 80,
     "Open Triangle": 81,
     "Shaker": 82,
     "Jingle Bell": 83,
     "Belltree": 84,
     "Castanets": 85,
     "Mute Surdo": 86,
     "Open Surdo": 87
 };

function getPercussionInstrumentSelectorHtml( id, onchangeScript ) {
    return `<select onchange="${ onchangeScript }">`
        + Object
            .entries( percussionInstruments )
            .map( ( instrument ) => String( id ) == String( instrument[1] )
                ? `<option value="${ instrument[1] }" selected="selected">${ instrument[0] }</option>`
                : `<option value="${ instrument[1] }">${ instrument[0] }</option>` )
            .join("")
        + "</select>";
}

var instruments = {
    "Silence": { "": 0 },
    "Piano": {
        "Acoustic Grand Piano": 1,
        "Bright Acoustic Piano": 2,
        "Electric Grand Piano": 3,
        "Honky-tonk Piano": 4,
        "Electric Piano 1": 5,
        "Electric Piano 2": 6,
        "Harpsichord": 7,
        "Clavi": 8
    },
    "Chromatic Percussion": {
        "Celesta": 9,
        "Glockenspiel": 10,
        "Music Box": 11,
        "Vibraphone": 12,
        "Marimba": 13,
        "Xylophone": 14,
        "Tubular Bells": 15,
        "Dulcimer": 16
    },
    "Organ": {
        "Drawbar Organ": 17,
        "Percussive Organ": 18,
        "Rock Organ": 19,
        "Church Organ": 20,
        "Reed Organ": 21,
        "Accordion": 22,
        "Harmonica": 23,
        "Tango Accordion": 24
    },
    "Guitar": {
        "Acoustic Guitar (nylon)": 25,
        "Acoustic Guitar (steel)": 26,
        "Electric Guitar (jazz)": 27,
        "Electric Guitar (clean)": 28,
        "Electric Guitar (muted)": 29,
        "Overdriven Guitar": 30,
        "Distortion Guitar": 31,
        "Guitar Harmonics": 32
    },
    "Bass": {
        "Acoustic Bass": 33,
        "Electric Bass (finger)": 34,
        "Electric Bass (pick)": 35,
        "Fretless Bass": 36,
        "Slap Bass 1": 37,
        "Slap Bass 2": 38,
        "Synth Bass 1": 39,
        "Synth Bass 2": 40
    },
    "Strings": {
        "Violin": 41,
        "Viola": 42,
        "Cello": 43,
        "Contrabass": 44,
        "Tremolo Strings": 45,
        "Pizzicato Strings": 46,
        "Orchestral Harp": 47,
        "Timpani": 48
    },
    "Ensemble": {
        "String Ensemble 1": 49,
        "String Ensemble 2": 50,
        "Synth Strings 1": 51,
        "Synth Strings 2": 52,
        "Choir Aahs": 53,
        "Voice Oohs": 54,
        "Synth Voice": 55,
        "Orchestra Hit": 56
    },
    "Brass": {
        "Trumpet": 57,
        "Trombone": 58,
        "Tuba": 59,
        "Muted Trumpet": 60,
        "French Horn": 61,
        "Brass Section": 62,
        "Synth Brass 1": 63,
        "Synth Brass 2": 64
    },
    "Reed": {
        "Soprano Sax": 65,
        "Alto Sax": 66,
        "Tenor Sax": 67,
        "Baritone Sax": 68,
        "Oboe": 69,
        "English Horn": 70,
        "Bassoon": 71,
        "Clarinet": 72
    },
    "Pipe": {
        "Piccolo": 73,
        "Flute": 74,
        "Recorder": 75,
        "Pan Flute": 76,
        "Blown bottle": 77,
        "Shakuhachi": 78,
        "Whistle": 79,
        "Ocarina": 80
    },
    "Synth Lead": {
        "Lead 1 (square)": 81,
        "Lead 2 (sawtooth)": 82,
        "Lead 3 (calliope)": 83,
        "Lead 4 (chiff)": 84,
        "Lead 5 (charang)": 85,
        "Lead 6 (voice)": 86,
        "Lead 7 (fifths)": 87,
        "Lead 8 (bass + lead)": 88
    },
    "Synth Pad": {
        "Pad 1 (new age)": 89,
        "Pad 2 (warm)": 90,
        "Pad 3 (polysynth)": 91,
        "Pad 4 (choir)": 92,
        "Pad 5 (bowed)": 93,
        "Pad 6 (metallic)": 94,
        "Pad 7 (halo)": 95,
        "Pad 8 (sweep)": 96
    },
    "Synth Effects": {
        "FX 1 (rain)": 97,
        "FX 2 (soundtrack)": 98,
        "FX 3 (crystal)": 99,
        "FX 4 (atmosphere)": 100,
        "FX 5 (brightness)": 101,
        "FX 6 (goblins)": 102,
        "FX 7 (echoes)": 103,
        "FX 8 (sci-fi)": 104
    },
    "Ethnic": {
        "Sitar": 105,
        "Banjo": 106,
        "Shamisen": 107,
        "Koto": 108,
        "Kalimba": 109,
        "Bag pipe": 110,
        "Fiddle": 111,
        "Shanai": 112
    },
    "Percussive": {
        "Tinkle Bell": 113,
        "Agogô": 114,
        "Steel Drums": 115,
        "Woodblock": 116,
        "Taiko Drum": 117,
        "Melodic Tom": 118,
        "Synth Drum": 119,
        "Reverse Cymbal": 120
    },
    "Sound Effects": {
        "Guitar Fret Noise": 121,
        "Breath Noise": 122,
        "Seashore": 123,
        "Bird Tweet": 124,
        "Telephone Ring": 125,
        "Helicopter": 126,
        "Applause": 127,
        "Gunshot": 128
    }
};

function getInstrumentForOrder( order ) {
    switch ( order ) {
        case 2:
            // acoustic grand piano
            return [0,38,9,0];

        case 3:
            // open hi-hat
            return [0,46,9,0];

        case 4:
        case 5:
            // sticks
            return [0,31,9,0];

        case 6:
            // acoustic base
            return [33,0,2,0];

        case 7:
        case 8:
        case 9:
            // side stick
            return [0,37,9,0];

        case 10:
        case 11:
        case 12:
            // Ride Cymbal 1
            return [0,51,9,0];

        default:
            return [0,0,0,0];
    }
}


function getInstrumentSelector( id ) {
    return reify(
        "select",
        { "size": 10 },
        Object
                .entries( instruments )
                .map( ( instrumentGroup, k ) => reify(
                    "optgroup",
                    { "label": k },
                    Object
                        .entries( instrumentGroup )
                        .map( ( instrumentId, instrumentName ) => reify( "option", { "value": instrumentId }, [], [ (c)=> c.text = instrumentName ]) )
                ) )
    );
}

function getRepeatSelectorHtml( id, onchangeScript ) {
    return `<select onchange="${ onchangeScript }">`
        + new Array( 2 )
            .fill( 0 )
            .map( ( x, i ) => String( id ) == String( i )
                ? `<option value="${ i }" selected="selected">${ i }</option>`
                : `<option value="${ i }">${ i }</option>` )
            .join("")
        + "</select>";
}


function getChannelSelectorHtml( id, onchangeScript ) {
    return `<select onchange="${ onchangeScript }">`
        + new Array( 16 )
            .fill( 0 )
            .map( ( x, i ) => String( id ) == String( i )
                ? `<option value="${ i }" selected="selected">${ i }</option>`
                : `<option value="${ i }">${ i }</option>` )
            .join("")
        + "</select>";
}

function getInstrumentSelectorHtml( id, onchangeScript ) {
    return `<select onchange="${ onchangeScript }">`
        + Object
            .entries( instruments )
            .map( ( instrumentGroup ) => `<optgroup label="${ instrumentGroup[0] }">`
                + Object
                    .entries( instrumentGroup[1] )
                    .map( ( instrument ) => String( id ) == String( instrument[1] )
                        ? `<option value="${ instrument[1] }" selected="selected">${ instrument[0] }</option>`
                        : `<option value="${ instrument[1] }">${ instrument[0] }</option>` )
                    .join("")
                + "</optgroup>"
            )
            .join("")
        + "</select>";
}

function playMidi( basePlane ) {

    if (!navigator.requestMIDIAccess) {
        throw new Error('WebMIDI is not supported in this browser.');
    }

    let midiOutput = null;
    let currentSequenceId = -1;

    const START = 41;

    let intervals = [0, 4, 7, 11, 12, 11, 7, 4];
    sequence =  intervals.map(x => x + START);

    const NOTE_ON = 0x90;
    const NOTE_OFF = 0x80;

    const NOTE_DURATION = 300;

    var midi = null;  // global MIDIAccess object

    const playNote = function() {
      if (currentSequenceId >= 0) {
        midiOutput.send([NOTE_OFF, sequence[currentSequenceId], 0x7f]);
      }

      currentSequenceId++;
      if (currentSequenceId >= sequence.length) {
        currentSequenceId = 0;
      }
      midiOutput.send([NOTE_ON, sequence[currentSequenceId], 0x7f]);

      setTimeout(playNote, NOTE_DURATION);
    }


    function onMIDISuccess( midiAccess ) {
        consoleLog( "MIDI ready!" );
        midi = midiAccess;  // store in the global (in real usage, would probably keep in an object instance)
        consoleLog( "midiAccess: " + midiAccess  );
        for (var entry of midi.inputs ) {
            var input = entry[1];
            consoleLog( "Input port [type:'" + input.type + "'] id:'" + input.id +
            "' manufacturer:'" + input.manufacturer + "' name:'" + input.name +
            "' version:'" + input.version + "'" );
        }
        for (var entry of midi.outputs ) {
            var output = entry[1];
            consoleLog( "Output port [type:'" + output.type + "'] id:'" + output.id +
            "' manufacturer:'" + output.manufacturer + "' name:'" + output.name +
            "' version:'" + output.version + "'" );
        }
    }

    function onMIDIFailure(msg) {
      consoleLog( "Failed to get MIDI access - " + msg );
    }

    navigator.requestMIDIAccess().then( onMIDISuccess, onMIDIFailure );

}
