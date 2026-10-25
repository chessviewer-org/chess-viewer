/** Piece codes, names and conventional diagram glyphs from Popeye's English
 * manual and piecenam.txt. These are composition identities, not inferred moves.
 * https://github.com/thomas-maeder/popeye/blob/develop/py-engl.txt
 * https://github.com/thomas-maeder/popeye/blob/develop/piecenam.txt
 */
export interface FairyWalk {
  code: string;
  name: string;
  glyph?: string;
}
export const FAIRY_WALKS: readonly FairyWalk[] = [
  {
    code: 'DS',
    name: 'Diagonal Spiral Springer',
    glyph: 'N270'
  },
  {
    code: 'S1',
    name: 'Diagonal Spiral Springer (1,1)',
    glyph: 'N90'
  },
  {
    code: 'S2',
    name: 'Spiral Springer (2,0)',
    glyph: 'N90'
  },
  {
    code: 'S3',
    name: 'Diagonal Spiral Springer (3,3)',
    glyph: 'N90'
  },
  {
    code: 'S4',
    name: 'Spiral Springer (4,0)',
    glyph: 'N90'
  },
  {
    code: 'SS',
    name: 'Spiral Springer',
    glyph: 'N90'
  },
  {
    code: '15',
    name: '1,5-leaper',
    glyph: 'B180'
  },
  {
    code: '16',
    name: '1,6-leaper',
    glyph: 'Q270'
  },
  {
    code: '24',
    name: '2,4-leaper',
    glyph: 'N270'
  },
  {
    code: '25',
    name: '2,5-leaper',
    glyph: 'B90'
  },
  {
    code: '35',
    name: '3,5-leaper',
    glyph: 'N270'
  },
  {
    code: '36',
    name: '3,6-leaper',
    glyph: 'N90'
  },
  {
    code: '37',
    name: '3,7-leaper',
    glyph: 'B90'
  },
  {
    code: 'AL',
    name: 'Alfil',
    glyph: 'B90'
  },
  {
    code: 'AM',
    name: 'Amazon',
    glyph: 'Q270'
  },
  {
    code: 'AN',
    name: 'Antelope',
    glyph: 'B90'
  },
  {
    code: 'AR',
    name: 'Archbishop',
    glyph: 'B180'
  },
  {
    code: 'BP',
    name: 'Berolina pawn',
    glyph: 'P180'
  },
  {
    code: 'BS',
    name: 'Berolina superpawn',
    glyph: 'P90'
  },
  {
    code: 'B',
    name: 'Bishop',
    glyph: 'B'
  },
  {
    code: 'B3',
    name: 'Bishop bouncer'
  },
  {
    code: 'BE',
    name: 'Bishop eagle',
    glyph: 'B270'
  },
  {
    code: 'BH',
    name: 'Bishop hopper',
    glyph: 'B180'
  },
  {
    code: 'LB',
    name: 'Bishop locust'
  },
  {
    code: 'BM',
    name: 'Bishop moose',
    glyph: 'B90'
  },
  {
    code: 'BW',
    name: 'Bishop sparrow',
    glyph: 'B180'
  },
  {
    code: 'BL',
    name: 'Bishop-lion',
    glyph: 'B270'
  },
  {
    code: 'BR',
    name: 'Bishop/rook hunter',
    glyph: 'R270'
  },
  {
    code: 'BI',
    name: 'Bison'
  },
  {
    code: 'BO',
    name: 'Bob'
  },
  {
    code: 'B1',
    name: 'Bouncer'
  },
  {
    code: 'BK',
    name: 'Bouncy knight',
    glyph: 'N90'
  },
  {
    code: 'BN',
    name: 'Bouncy nightrider',
    glyph: 'N90'
  },
  {
    code: 'BT',
    name: 'Boyscout',
    glyph: 'B180'
  },
  {
    code: 'CA',
    name: 'Camel',
    glyph: 'N270'
  },
  {
    code: 'CR',
    name: 'Camelrider',
    glyph: 'R270'
  },
  {
    code: 'CH',
    name: 'Camelrider hopper',
    glyph: 'R270'
  },
  {
    code: 'C',
    name: 'Cardinal',
    glyph: 'B90'
  },
  {
    code: 'CT',
    name: 'CAT',
    glyph: 'B90'
  },
  {
    code: 'CY',
    name: 'Charybdis'
  },
  {
    code: 'CP',
    name: 'Chinese pawn',
    glyph: 'P90'
  },
  {
    code: 'CG',
    name: 'Contra grasshopper'
  },
  {
    code: 'HC',
    name: 'ContraHamster'
  },
  {
    code: 'DA',
    name: 'Dabbaba',
    glyph: 'R90'
  },
  {
    code: 'DO',
    name: 'Dolphin'
  },
  {
    code: 'DB',
    name: 'Doublebishopper',
    glyph: 'B90'
  },
  {
    code: 'DG',
    name: 'Doublegrasshopper',
    glyph: 'R180'
  },
  {
    code: 'DK',
    name: 'Doublerookhopper',
    glyph: 'R90'
  },
  {
    code: 'DR',
    name: 'Dragon',
    glyph: 'N90'
  },
  {
    code: 'DU',
    name: 'Dummy',
    glyph: 'K270'
  },
  {
    code: 'EA',
    name: 'Eagle',
    glyph: 'R270'
  },
  {
    code: 'EE',
    name: 'Eagle equihopper'
  },
  {
    code: 'EN',
    name: 'Eagle nonstop equihopper'
  },
  {
    code: 'EH',
    name: 'Edgehog',
    glyph: 'Q270'
  },
  {
    code: 'ET',
    name: 'Elephant'
  },
  {
    code: 'EM',
    name: 'Empress',
    glyph: 'R180'
  },
  {
    code: 'EQ',
    name: 'Equihopper',
    glyph: 'Q90'
  },
  {
    code: 'QE',
    name: 'Equistopper'
  },
  {
    code: 'EK',
    name: 'Erlking',
    glyph: 'R90'
  },
  {
    code: 'FA',
    name: 'Faro',
    glyph: 'R270'
  },
  {
    code: 'FR',
    name: 'Fersrider'
  },
  {
    code: 'FE',
    name: 'Ferz',
    glyph: 'B270'
  },
  {
    code: 'F',
    name: 'Friend'
  },
  {
    code: 'GI',
    name: 'Giraffe',
    glyph: 'B270'
  },
  {
    code: 'GT',
    name: 'Girlscout',
    glyph: 'R90'
  },
  {
    code: 'GN',
    name: 'Gnu',
    glyph: 'B90'
  },
  {
    code: 'GR',
    name: 'Gnurider',
    glyph: 'N90'
  },
  {
    code: 'GH',
    name: 'Gnurider hopper',
    glyph: 'N270'
  },
  {
    code: 'GL',
    name: 'Gral'
  },
  {
    code: 'G',
    name: 'Grasshopper',
    glyph: 'Q180'
  },
  {
    code: 'G2',
    name: 'Grasshopper-2'
  },
  {
    code: 'G3',
    name: 'Grasshopper-3'
  },
  {
    code: 'GF',
    name: 'Greater leafhopper'
  },
  {
    code: 'GE',
    name: 'Greater treehopper'
  },
  {
    code: 'GY',
    name: 'Gryphon',
    glyph: 'B90'
  },
  {
    code: 'HA',
    name: 'Hamster',
    glyph: 'Q90'
  },
  {
    code: 'KA',
    name: 'Kangaroo',
    glyph: 'Q270'
  },
  {
    code: 'KL',
    name: 'Kangaroo lion'
  },
  {
    code: 'KO',
    name: 'Kao'
  },
  {
    code: 'K',
    name: 'King',
    glyph: 'K'
  },
  {
    code: 'KH',
    name: 'Kinghopper',
    glyph: 'Q90'
  },
  {
    code: 'S',
    name: 'Knight',
    glyph: 'N'
  },
  {
    code: 'KP',
    name: 'Knight hopper',
    glyph: 'N90'
  },
  {
    code: 'LH',
    name: 'Leaf hopper'
  },
  {
    code: 'LE',
    name: 'Leo',
    glyph: 'Q90'
  },
  {
    code: 'LI',
    name: 'Lion',
    glyph: 'Q270'
  },
  {
    code: 'LO',
    name: 'Loco',
    glyph: 'B270'
  },
  {
    code: 'L',
    name: 'Locust',
    glyph: 'Q90'
  },
  {
    code: 'MA',
    name: 'Mao',
    glyph: 'N90'
  },
  {
    code: 'AH',
    name: 'Mao hopper',
    glyph: 'N270'
  },
  {
    code: 'AO',
    name: 'Maorider',
    glyph: 'N90'
  },
  {
    code: 'ML',
    name: 'Maorider lion'
  },
  {
    code: 'MG',
    name: 'Marguerite'
  },
  {
    code: 'MS',
    name: 'Marine knight',
    glyph: 'N90'
  },
  {
    code: 'MP',
    name: 'Marine pawn',
    glyph: 'P90'
  },
  {
    code: 'MH',
    name: 'Marine ship',
    glyph: 'R90'
  },
  {
    code: 'MO',
    name: 'Moa',
    glyph: 'N270'
  },
  {
    code: 'OH',
    name: 'Moa hopper',
    glyph: 'N90'
  },
  {
    code: 'OA',
    name: 'Moarider',
    glyph: 'N270'
  },
  {
    code: 'MM',
    name: 'Moarider lion'
  },
  {
    code: 'M',
    name: 'Moose',
    glyph: 'Q270'
  },
  {
    code: 'NA',
    name: 'Nao'
  },
  {
    code: 'ND',
    name: 'Nereide',
    glyph: 'B180'
  },
  {
    code: 'N',
    name: 'Nightrider',
    glyph: 'N180'
  },
  {
    code: 'NH',
    name: 'Nightrider hopper',
    glyph: 'B90'
  },
  {
    code: 'NL',
    name: 'Nightrider lion'
  },
  {
    code: 'LN',
    name: 'Nightrider locust'
  },
  {
    code: 'QF',
    name: 'Non-stop equistopper'
  },
  {
    code: 'NE',
    name: 'Nonstop equihopper',
    glyph: 'Q90'
  },
  {
    code: 'OK',
    name: 'Okapi',
    glyph: 'B270'
  },
  {
    code: 'OR',
    name: 'Orix',
    glyph: 'Q270'
  },
  {
    code: 'NO',
    name: 'Orix (non-stop)'
  },
  {
    code: 'O',
    name: 'Orphan',
    glyph: 'C'
  },
  {
    code: 'PA',
    name: 'Pao',
    glyph: 'R270'
  },
  {
    code: 'P',
    name: 'Pawn',
    glyph: 'P'
  },
  {
    code: 'PO',
    name: 'Poseidon',
    glyph: 'K90'
  },
  {
    code: 'PR',
    name: 'Princess',
    glyph: 'B180'
  },
  {
    code: 'Q',
    name: 'Queen',
    glyph: 'Q'
  },
  {
    code: 'QQ',
    name: 'Querquisite'
  },
  {
    code: 'QN',
    name: 'Quintessence'
  },
  {
    code: 'RT',
    name: 'Rabbit'
  },
  {
    code: 'RK',
    name: 'Radial leaper',
    glyph: 'N90'
  },
  {
    code: 'RA',
    name: 'Rao',
    glyph: 'R180'
  },
  {
    code: 'RB',
    name: 'Reflecting bishop',
    glyph: 'B270'
  },
  {
    code: 'PP',
    name: 'Reverse pawn'
  },
  {
    code: 'R',
    name: 'Rook',
    glyph: 'R'
  },
  {
    code: 'B2',
    name: 'Rook bouncer'
  },
  {
    code: 'RE',
    name: 'Rook eagle',
    glyph: 'R270'
  },
  {
    code: 'RH',
    name: 'Rook hopper',
    glyph: 'R180'
  },
  {
    code: 'LR',
    name: 'Rook locust'
  },
  {
    code: 'RM',
    name: 'Rook moose',
    glyph: 'R90'
  },
  {
    code: 'RW',
    name: 'Rook sparrow',
    glyph: 'R180'
  },
  {
    code: 'RL',
    name: 'Rook-lion',
    glyph: 'R270'
  },
  {
    code: 'RR',
    name: 'Rook/bishop hunter',
    glyph: 'R90'
  },
  {
    code: 'BU',
    name: 'Root-25-leaper',
    glyph: 'B180'
  },
  {
    code: 'RF',
    name: 'Root-50-leaper',
    glyph: 'R180'
  },
  {
    code: 'RO',
    name: 'Rose',
    glyph: 'R90'
  },
  {
    code: 'LS',
    name: 'Rose locust',
    glyph: 'N90'
  },
  {
    code: 'RP',
    name: 'Rose-hopper'
  },
  {
    code: 'RN',
    name: 'Rose-lion'
  },
  {
    code: 'SA',
    name: 'Saltador',
    glyph: 'N270'
  },
  {
    code: 'SC',
    name: 'Scarabeus'
  },
  {
    code: 'SO',
    name: 'Scorpion'
  },
  {
    code: 'SE',
    name: 'Senora',
    glyph: 'Q270'
  },
  {
    code: 'SH',
    name: 'Ship',
    glyph: 'R90'
  },
  {
    code: 'SI',
    name: 'Sirene',
    glyph: 'Q270'
  },
  {
    code: 'SK',
    name: 'Skylla'
  },
  {
    code: 'SW',
    name: 'Sparrow',
    glyph: 'N90'
  },
  {
    code: 'SQ',
    name: 'Squirrel',
    glyph: 'N90'
  },
  {
    code: 'ST',
    name: 'Sting',
    glyph: 'K180'
  },
  {
    code: 'SP',
    name: 'Superpawn',
    glyph: 'P270'
  },
  {
    code: 'TH',
    name: 'Tree hopper'
  },
  {
    code: 'TR',
    name: 'Triton',
    glyph: 'R270'
  },
  {
    code: 'UU',
    name: 'Ubiubi',
    glyph: 'N90'
  },
  {
    code: 'VA',
    name: 'Vao',
    glyph: 'B270'
  },
  {
    code: 'WA',
    name: 'Waran',
    glyph: 'R90'
  },
  {
    code: 'WE',
    name: 'Wazir',
    glyph: 'R180'
  },
  {
    code: 'WR',
    name: 'Wazirrider'
  },
  {
    code: 'Z',
    name: 'Zebra',
    glyph: 'N90'
  },
  {
    code: 'ZR',
    name: 'Zebrarider',
    glyph: 'N90'
  },
  {
    code: 'ZH',
    name: 'Zebrarider hopper',
    glyph: 'N90'
  },
  {
    code: 'ZE',
    name: 'Zebu',
    glyph: 'N90'
  }
];

export const FAIRY_CONDITIONS: readonly string[] = [
  'Circe',
  'Madrasi',
  'Volage',
  'Hypervolage',
  'BichromChess',
  'MonochromChess',
  'GridChess',
  'KoeKo',
  'BlackEdgemover',
  'WhiteEdgemover',
  'Leofamily',
  'ChineseChess',
  'Patrouille',
  'NoCapture',
  'ImmunChess',
  'ContactGridChess',
  'Imitator',
  'CavalierMajeur',
  'HaanerChess',
  'Sentinelles',
  'Maximummer',
  'UltraSchachZwang',
  'BlackMaximummer',
  'WhiteMaximummer',
  'WhiteUltraSchachZwang',
  'BlackUltraSchachZwang',
  'BlackMinimummer',
  'WhiteMinimummer',
  'MagicSquares',
  'Tibet',
  'DoubleTibet',
  'Hole',
  'BlackMustCapture',
  'WhiteMustCapture',
  'TransmutedKings',
  'BlackFollowMyLeader',
  'WhiteFollowMyLeader',
  'DuellistChess',
  'VogtlaenderChess',
  'EinsteinChess',
  'Bicolores',
  'NewKoeko',
  'AntiCirce',
  'ReversalEinsteinChess',
  'RelegationChess',
  'NorskSjakk',
  'TraitorChess',
  'AndernachChess',
  'BlackForcedSquare',
  'WhiteForcedSquare',
  'BlackConsequentForcedSquare',
  'WhiteConsequentForcedSquare',
  'ReflectiveKings',
  'ChameleonChess',
  'FunctionaryChess',
  'GlasgowChess',
  'AntiAndernachChess',
  'Isardam',
  'ChecklessChess',
  'PromOnly',
  'ExclusiveChess',
  'Marscirce',
  'PhantomChess',
  'WhiteTransmutedKing',
  'BlackTransmutedKing',
  'WhiteReflectiveKing',
  'BlackReflectiveKing',
  'AntiEinsteinChess',
  'BlackRoyalSquare',
  'WhiteRoyalSquare',
  'PlusChess',
  'BrunnerChess',
  'CentralChess',
  'ExtinctionChess',
  'RepublicanChess',
  'ActuatedRevolvingBoard',
  'MessignyChess',
  'Woozles',
  'BiWoozles',
  'Heffalumps',
  'BiHeffalumps',
  'WhitePromSquares',
  'BlackPromSquares',
  'NoWhitePromotion',
  'NoBlackPromotion',
  'EiffelChess',
  'ActuatedRevolvingCentre',
  'ShieldedKings',
  'NoWhiteCapture',
  'NoBlackCapture',
  'AlphabeticChess',
  'LineChameleonChess',
  'AMU',
  'SingleBox',
  'MAFF',
  'OWU',
  'WhiteOscillatingKings',
  'BlackOscillatingKings',
  'AntiKings',
  'AntiMarsCirce',
  'WhiteSuperTransmutingKing',
  'BlackSuperTransmutingKing',
  'UltraPatrol',
  'SwappingKings',
  'RoyalDynasty',
  'SAT',
  'StrictSAT',
  'Take&MakeChess',
  'Make&TakeChess',
  'BlackSynchronMover',
  'WhiteSynchronMover',
  'BlackAntiSynchronMover',
  'WhiteAntiSynchronMover',
  'Masand',
  'MasandGeneralised',
  'BGL',
  'AnnanChess',
  'NannaChess',
  'NormalPawn',
  'BlackChecks',
  'GenevaChess',
  'VaultingKings',
  'WhiteVaultingKing',
  'BlackVaultingKing',
  'ProteanChess',
  'Lortap',
  'Antikoeko',
  'CastlingChess',
  'ChameleonPursuit',
  'LosingChess',
  'GhostChess',
  'Football',
  'WhiteAlphabeticChess',
  'BlackAlphabeticChess',
  'KobulKings',
  'SuperGuards',
  'Wormholes',
  'MarineChess',
  'UltramarineChess',
  'BackHome',
  'FaceToFace',
  'BackToBack',
  'CheekToCheek',
  'Disparate',
  'SnekChess',
  'SnekCircleChess',
  'ArgentinianChess',
  'LostPieces',
  'PartialParalysis',
  'LeseMajeste',
  'Rokagogo',
  'Breton',
  'PointReflection',
  'Bolero',
  'BoleroInverse',
  'Influencer',
  'RoleExchange',
  'BlackMaxDister',
  'BlackMinDister',
  'WhiteMaxDister',
  'WhiteMinDister',
  'SeriesCapture',
  'Pepo',
  'CASTchess',
  'CASTInverse',
  'MultiCaptures',
  'FuddledMen',
  'Bicaptures',
  'TransmissionMenace',
  'PowerTransfer',
  'Anda',
  'AndaInverse',
  'AllInChess',
  'HalfInChess',
  'MainlyInChess',
  'FrankfurtChess',
  'AntiGuards',
  'Leffie',
  'AliceChess',
  'Immobilio',
  'DangerCirce',
  'PAD'
];

export const FAIRY_ATTRIBUTES = [
  'Royal',
  'Chameleon',
  'Jigger',
  'Kamikaze',
  'Paralysing',
  'Volage',
  'Functionary',
  'HalfNeutral',
  'HurdleColourChanging',
  'Protean',
  'Magic',
  'Uncapturable',
  'Patrol',
  'FrischAuf',
  'Anda',
  'AndaInverse',
  'Bul',
  'Dob',
  'AliceA',
  'AliceB'
] as const;
