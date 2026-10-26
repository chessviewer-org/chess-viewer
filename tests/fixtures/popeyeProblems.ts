// Published examples from the bundled upstream Popeye v4.103 sources.
// German piece declarations are transcribed to the documented English codes.
export const POPEYE_PROBLEMS = [
  {
    id: 'mach-chinese',
    sourceUrl:
      'https://github.com/thomas-maeder/popeye/blob/v4.103/py-engl.txt',
    firstSolution: '1.b2-b4 ! threat:',
    source: `BeginProblem
Stipulation #2
Forsyth 1.PA6/8/1Q2.ma3/8/k1.pa.pa4/8/1P1K
EndProblem`
  },
  {
    id: 'nao-knights',
    sourceUrl:
      'https://github.com/thomas-maeder/popeye/blob/v4.103/BEISPIEL/chinese.inp',
    firstSolution: '1.f5*e6 ! threat:',
    source: `BeginProblem
Stipulation #2
Pieces White Ke3 Re2g3 Sc2g4 Pf2f5 NAc3
Pieces Black Kf1 Sb3 Pe6 NAb5d7f3h7
EndProblem`
  },
  {
    id: 'circe-kamikaze',
    sourceUrl:
      'https://github.com/thomas-maeder/popeye/blob/v4.103/BEISPIEL/circe.inp',
    firstSolution: '1.kQh1-c1 ! threat:',
    source: `BeginProblem
Stipulation #2
Condition Circe
Pieces White Kh2
Pieces Black Kd7
Pieces White Kamikaze Qh1 Ra8c8 Bb4d3 Sc6
Pieces Black Kamikaze Ra3 Bg4 Pa7b3d2e2e5e6
EndProblem`
  },
  {
    id: 'madrasi-circe',
    sourceUrl:
      'https://github.com/thomas-maeder/popeye/blob/v4.103/BEISPIEL/madrasi.inp',
    firstSolution: '1.Sc1*d3[+bPd7] ! threat:',
    source: `BeginProblem
Stipulation #2
Condition Madrasi RexInclusive Circe
Pieces White Bf8 Qd6 Pa5d5e4b2d2 Kb5 Rd4 Sc1h3
Pieces Black Bh8 Pc7c4c3d3g3f2 Ka4 Qf3 Re1 Sg1
EndProblem`
  },
  {
    id: 'breton-nightrider',
    sourceUrl:
      'https://github.com/thomas-maeder/popeye/blob/v4.103/EXAMPLES/breton.inp',
    firstSolution: '1.Bc5-e3 ! threat:',
    source: `BeginProblem
Stipulation #2
Condition Breton
Pieces White Kc8 Qd1 Rb6 Bc5g8 Sb4b7e2 Pd6 Ne8
Pieces Black Kc4 Qe6 Rc3d2 Bc2 Sb2 Pb3d7 Nc1
EndProblem`
  }
] as const;
