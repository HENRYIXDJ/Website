/**
 * lib/midiPresets.ts
 *
 * Pre-configured MIDI mapping schemas for physical DJ hardware controllers:
 * - XDJ-RX3 / XDJ-1000MK2 Hardware
 * - CDJ-3000 / CDJ-2000NXS2 Hardware
 * - DDJ-1000 / DDJ-800 / DDJ-FLX6 Hardware
 * - DDJ-400 / DDJ-FLX4 Hardware
 * - Numark Mixtrack Pro FX
 * - Hercules Inpulse Series
 * - Generic 2-Deck & 4-Deck Fallback Maps
 */

export type MIDICommandType = 
  | 'PLAY'
  | 'CUE'
  | 'HOT_CUE'
  | 'SYNC'
  | 'MASTER'
  | 'SLIP'
  | 'QUANTIZE'
  | 'JOG_TOUCH'
  | 'JOG_ROTATE'
  | 'PITCH_SLIDER'
  | 'PITCH_SLIDER_14BIT'
  | 'PITCH_BEND'
  | 'TRIM'
  | 'EQ_HIGH'
  | 'EQ_MID'
  | 'EQ_LOW'
  | 'FILTER'
  | 'VOLUME'
  | 'CROSSFADER'
  | 'BEAT_JUMP_LEFT'
  | 'BEAT_JUMP_RIGHT'
  | 'LOOP_IN'
  | 'LOOP_OUT'
  | 'LOOP_TOGGLE';

export interface MIDIMappingItem {
  id: string;
  type: MIDICommandType;
  channel: number; // 0-indexed (0 to 15)
  status: 'noteon' | 'noteoff' | 'cc' | 'pitchbend';
  number: number; // Note # or CC #
  deckId?: number; // 1, 2, 3, 4
  pad?: string; // 'A' through 'H'
  is14Bit?: boolean;
  lsbNumber?: number;
  relativeMode?: '2sComplement' | 'signMagnitude' | 'absolute';
}

export interface ControllerPreset {
  id: string;
  name: string;
  matchNames: string[];
  mappings: MIDIMappingItem[];
}

// Helper builder for Pioneer DDJ-400 / DDJ-FLX4 2-Deck hardware controller (Always maps to Deck 1 & Deck 2)
function createDDJ400ChannelMap(deckId: 1 | 2, ch: number): MIDIMappingItem[] {
  const altCh = ch + 7;
  return [
    // Transport Play/Cue aliases
    { id: `d${deckId}_play_1`, type: 'PLAY', channel: ch, status: 'noteon', number: 11, deckId },
    { id: `d${deckId}_play_2`, type: 'PLAY', channel: ch, status: 'noteon', number: 0, deckId },
    { id: `d${deckId}_play_alt`, type: 'PLAY', channel: altCh, status: 'noteon', number: 11, deckId },
    { id: `d${deckId}_cue_1`, type: 'CUE', channel: ch, status: 'noteon', number: 12, deckId },
    { id: `d${deckId}_cue_2`, type: 'CUE', channel: ch, status: 'noteon', number: 1, deckId },
    { id: `d${deckId}_cue_alt`, type: 'CUE', channel: altCh, status: 'noteon', number: 12, deckId },

    // Pitch Slider (Pitch Bend + CC 0/32 14-bit + CC 9 7-bit)
    { id: `d${deckId}_pitch_bend`, type: 'PITCH_BEND', channel: ch, status: 'pitchbend', number: 0, deckId },
    { id: `d${deckId}_pitch_14bit`, type: 'PITCH_SLIDER_14BIT', channel: ch, status: 'cc', number: 0, lsbNumber: 32, is14Bit: true, deckId },
    { id: `d${deckId}_pitch_7bit`, type: 'PITCH_SLIDER', channel: ch, status: 'cc', number: 9, deckId },

    // Mixer Knobs (TRIM, HI, MID, LOW, FILTER) & Volume Faders
    { id: `d${deckId}_trim_1`, type: 'TRIM', channel: ch, status: 'cc', number: 16, deckId },
    { id: `d${deckId}_trim_2`, type: 'TRIM', channel: ch, status: 'cc', number: 4, deckId },
    { id: `d${deckId}_trim_master`, type: 'TRIM', channel: 6, status: 'cc', number: 4, deckId },

    { id: `d${deckId}_eq_hi_1`, type: 'EQ_HIGH', channel: ch, status: 'cc', number: 7, deckId },
    { id: `d${deckId}_eq_hi_2`, type: 'EQ_HIGH', channel: ch, status: 'cc', number: 17, deckId },

    { id: `d${deckId}_eq_mid_1`, type: 'EQ_MID', channel: ch, status: 'cc', number: 11, deckId },
    { id: `d${deckId}_eq_mid_2`, type: 'EQ_MID', channel: ch, status: 'cc', number: 18, deckId },

    { id: `d${deckId}_eq_low_1`, type: 'EQ_LOW', channel: ch, status: 'cc', number: 15, deckId },
    { id: `d${deckId}_eq_low_2`, type: 'EQ_LOW', channel: ch, status: 'cc', number: 19, deckId },

    { id: `d${deckId}_filter_1`, type: 'FILTER', channel: ch, status: 'cc', number: 23, deckId },
    { id: `d${deckId}_filter_2`, type: 'FILTER', channel: ch, status: 'cc', number: 26, deckId },

    { id: `d${deckId}_vol_1`, type: 'VOLUME', channel: ch, status: 'cc', number: 19, deckId },
    { id: `d${deckId}_vol_2`, type: 'VOLUME', channel: ch, status: 'cc', number: 2, deckId },

    // Looping Controls
    { id: `d${deckId}_loop_in_1`, type: 'LOOP_IN', channel: ch, status: 'noteon', number: 16, deckId },
    { id: `d${deckId}_loop_in_2`, type: 'LOOP_IN', channel: ch, status: 'noteon', number: 76, deckId },
    { id: `d${deckId}_loop_out_1`, type: 'LOOP_OUT', channel: ch, status: 'noteon', number: 17, deckId },
    { id: `d${deckId}_loop_out_2`, type: 'LOOP_OUT', channel: ch, status: 'noteon', number: 77, deckId },
    { id: `d${deckId}_loop_toggle_1`, type: 'LOOP_TOGGLE', channel: ch, status: 'noteon', number: 18, deckId },
    { id: `d${deckId}_loop_toggle_2`, type: 'LOOP_TOGGLE', channel: ch, status: 'noteon', number: 78, deckId },

    // Beat Jump Controls (-4B / +4B)
    { id: `d${deckId}_bj_left_1`, type: 'BEAT_JUMP_LEFT', channel: ch, status: 'noteon', number: 32, deckId },
    { id: `d${deckId}_bj_left_2`, type: 'BEAT_JUMP_LEFT', channel: ch, status: 'noteon', number: 80, deckId },
    { id: `d${deckId}_bj_right_1`, type: 'BEAT_JUMP_RIGHT', channel: ch, status: 'noteon', number: 33, deckId },
    { id: `d${deckId}_bj_right_2`, type: 'BEAT_JUMP_RIGHT', channel: ch, status: 'noteon', number: 81, deckId },

    // Sync & Master
    { id: `d${deckId}_sync`, type: 'SYNC', channel: ch, status: 'noteon', number: 88, deckId },
    { id: `d${deckId}_master`, type: 'MASTER', channel: ch, status: 'noteon', number: 89, deckId },

    // Jogwheel (Touch + Rotation)
    { id: `d${deckId}_jog_touch`, type: 'JOG_TOUCH', channel: ch, status: 'noteon', number: 54, deckId },
    { id: `d${deckId}_jog_rotate`, type: 'JOG_ROTATE', channel: ch, status: 'cc', number: 33, deckId, relativeMode: '2sComplement' },

    // Hot Cues A-H (Channel ch and Channel altCh aliases)
    ...(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const).map((pad, idx) => ({
      id: `d${deckId}_hotcue_${pad}_1`,
      type: 'HOT_CUE' as MIDICommandType,
      channel: ch,
      status: 'noteon' as const,
      number: 0 + idx,
      deckId,
      pad
    })),
    ...(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const).map((pad, idx) => ({
      id: `d${deckId}_hotcue_${pad}_2`,
      type: 'HOT_CUE' as MIDICommandType,
      channel: altCh,
      status: 'noteon' as const,
      number: 64 + idx,
      deckId,
      pad
    })),
  ];
}

// Helper builder to standardise 4-deck hardware control mappings
function createHardwareChannelMap(deckId: number, midiChannel: number): MIDIMappingItem[] {
  return [
    { id: `d${deckId}_play`, type: 'PLAY', channel: midiChannel, status: 'noteon', number: 11, deckId },
    { id: `d${deckId}_cue`, type: 'CUE', channel: midiChannel, status: 'noteon', number: 12, deckId },
    { id: `d${deckId}_sync`, type: 'SYNC', channel: midiChannel, status: 'noteon', number: 88, deckId },
    { id: `d${deckId}_master`, type: 'MASTER', channel: midiChannel, status: 'noteon', number: 89, deckId },
    { id: `d${deckId}_slip`, type: 'SLIP', channel: midiChannel, status: 'noteon', number: 64, deckId },
    { id: `d${deckId}_quantize`, type: 'QUANTIZE', channel: midiChannel, status: 'noteon', number: 65, deckId },

    ...(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const).map((pad, idx) => ({
      id: `d${deckId}_hotcue_${pad}`,
      type: 'HOT_CUE' as MIDICommandType,
      channel: midiChannel,
      status: 'noteon' as const,
      number: 0 + idx,
      deckId,
      pad
    })),

    { id: `d${deckId}_jog_touch`, type: 'JOG_TOUCH', channel: midiChannel, status: 'noteon', number: 54, deckId },
    { id: `d${deckId}_jog_rotate`, type: 'JOG_ROTATE', channel: midiChannel, status: 'cc', number: 33, deckId, relativeMode: '2sComplement' },

    { id: `d${deckId}_pitch_bend`, type: 'PITCH_BEND', channel: midiChannel, status: 'pitchbend', number: 0, deckId },
    { id: `d${deckId}_pitch`, type: 'PITCH_SLIDER_14BIT', channel: midiChannel, status: 'cc', number: 0, lsbNumber: 32, is14Bit: true, deckId },

    // Looping & Beat Jump Controls
    { id: `d${deckId}_loop_in`, type: 'LOOP_IN', channel: midiChannel, status: 'noteon', number: 16, deckId },
    { id: `d${deckId}_loop_out`, type: 'LOOP_OUT', channel: midiChannel, status: 'noteon', number: 17, deckId },
    { id: `d${deckId}_loop_toggle`, type: 'LOOP_TOGGLE', channel: midiChannel, status: 'noteon', number: 18, deckId },
    { id: `d${deckId}_bj_left`, type: 'BEAT_JUMP_LEFT', channel: midiChannel, status: 'noteon', number: 32, deckId },
    { id: `d${deckId}_bj_right`, type: 'BEAT_JUMP_RIGHT', channel: midiChannel, status: 'noteon', number: 33, deckId },

    { id: `d${deckId}_trim`, type: 'TRIM', channel: midiChannel, status: 'cc', number: 16, deckId },
    { id: `d${deckId}_eq_hi`, type: 'EQ_HIGH', channel: midiChannel, status: 'cc', number: 7, deckId },
    { id: `d${deckId}_eq_mid`, type: 'EQ_MID', channel: midiChannel, status: 'cc', number: 11, deckId },
    { id: `d${deckId}_eq_low`, type: 'EQ_LOW', channel: midiChannel, status: 'cc', number: 15, deckId },
    { id: `d${deckId}_filter`, type: 'FILTER', channel: midiChannel, status: 'cc', number: 23, deckId },
    { id: `d${deckId}_volume`, type: 'VOLUME', channel: midiChannel, status: 'cc', number: 19, deckId },
  ];
}

export const PRESET_XDJ_RX3: ControllerPreset = {
  id: 'xdj_rx3_hardware',
  name: 'XDJ-RX3 Hardware',
  matchNames: ['xdj-rx3', 'rx3'],
  mappings: [
    ...createHardwareChannelMap(1, 0),
    ...createHardwareChannelMap(2, 1),
    { id: 'crossfader', type: 'CROSSFADER', channel: 0, status: 'cc', number: 31 }
  ]
};

export const PRESET_CDJ3000: ControllerPreset = {
  id: 'cdj_3000_hardware',
  name: 'CDJ-3000 / CDJ-2000NXS2 Hardware',
  matchNames: ['cdj-3000', 'cdj-2000nxs2', 'cdj'],
  mappings: [
    ...createHardwareChannelMap(1, 0),
    ...createHardwareChannelMap(2, 1),
    ...createHardwareChannelMap(3, 2),
    ...createHardwareChannelMap(4, 3)
  ]
};

export const PRESET_DDJ1000: ControllerPreset = {
  id: 'ddj_1000_hardware',
  name: 'DDJ-1000 / DDJ-800 / DDJ-FLX6 Hardware',
  matchNames: ['ddj-1000', 'ddj-800', 'ddj-flx6'],
  mappings: [
    ...createHardwareChannelMap(1, 0),
    ...createHardwareChannelMap(2, 1),
    ...createHardwareChannelMap(3, 2),
    ...createHardwareChannelMap(4, 3),
    { id: 'crossfader', type: 'CROSSFADER', channel: 0, status: 'cc', number: 31 }
  ]
};

export const PRESET_DDJ400: ControllerPreset = {
  id: 'ddj_400_hardware',
  name: 'DDJ-400 / DDJ-FLX4 Hardware',
  matchNames: ['ddj-400', 'ddj-flx4', 'flx4', 'ddj'],
  mappings: [
    ...createDDJ400ChannelMap(1, 0),
    ...createDDJ400ChannelMap(2, 1),
    { id: 'crossfader_1', type: 'CROSSFADER', channel: 0, status: 'cc', number: 31 },
    { id: 'crossfader_2', type: 'CROSSFADER', channel: 0, status: 'cc', number: 8 }
  ]
};

export const PRESET_NUMARK_MIXTRACK: ControllerPreset = {
  id: 'numark_mixtrack',
  name: 'Numark Mixtrack Pro FX',
  matchNames: ['numark', 'mixtrack'],
  mappings: [
    ...createHardwareChannelMap(1, 0),
    ...createHardwareChannelMap(2, 1),
    { id: 'crossfader', type: 'CROSSFADER', channel: 0, status: 'cc', number: 31 }
  ]
};

export const PRESET_HERCULES_INPULSE: ControllerPreset = {
  id: 'hercules_inpulse',
  name: 'Hercules Inpulse Series',
  matchNames: ['hercules', 'inpulse'],
  mappings: [
    ...createHardwareChannelMap(1, 0),
    ...createHardwareChannelMap(2, 1),
    { id: 'crossfader', type: 'CROSSFADER', channel: 0, status: 'cc', number: 31 }
  ]
};

export const PRESET_GENERIC_4DECK: ControllerPreset = {
  id: 'generic_4deck',
  name: 'Generic Universal 4-Deck Mapping',
  matchNames: ['generic', 'midi', 'controller'],
  mappings: [
    ...createHardwareChannelMap(1, 0),
    ...createHardwareChannelMap(2, 1),
    ...createHardwareChannelMap(3, 2),
    ...createHardwareChannelMap(4, 3),
    { id: 'crossfader', type: 'CROSSFADER', channel: 0, status: 'cc', number: 31 }
  ]
};

export const ALL_HARDWARE_PRESETS: ControllerPreset[] = [
  PRESET_XDJ_RX3,
  PRESET_CDJ3000,
  PRESET_DDJ1000,
  PRESET_DDJ400,
  PRESET_NUMARK_MIXTRACK,
  PRESET_HERCULES_INPULSE,
  PRESET_GENERIC_4DECK
];
