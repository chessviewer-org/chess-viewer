/* ChessViewer's WebAssembly output adapter. Search and movement rules are unchanged.
 * Export native positions and the move-effect journal, never infer fairy rules from text.
 */
#include <emscripten.h>
#include <string.h>
#include "pieces/attributes/neutral/neutral.h"
#include "pieces/walks/classification.h"

static output_engine_type const *cv_original_engine;
static char cv_move_text[2048];
static size_t cv_move_length;

static int cv_fputc(int c, FILE *file)
{
  if (cv_move_length+1<sizeof cv_move_text)
  {
    cv_move_text[cv_move_length++] = (char)c;
    cv_move_text[cv_move_length] = 0;
  }
  return cv_original_engine->fputc(c,file);
}
static int cv_vfprintf(FILE *file, char const *format, va_list args)
{
  va_list copy;
  int length;
  size_t const available = sizeof cv_move_text-cv_move_length;
  va_copy(copy,args);
  length = vsnprintf(cv_move_text+cv_move_length,available,format,copy);
  va_end(copy);
  if (length>0)
    cv_move_length += (size_t)length<available ? (size_t)length : available-1;
  return cv_original_engine->vfprintf(file,format,args);
}
static int cv_fprintf(FILE *file, char const *format, ...)
{
  int result;
  va_list args;
  va_start(args,format);
  result = cv_vfprintf(file,format,args);
  va_end(args);
  return result;
}
static int cv_fflush(FILE *file) { return cv_original_engine->fflush(file); }
static output_engine_type const cv_output_engine = { &cv_fputc, &cv_vfprintf, &cv_fprintf, &cv_fflush };
static output_engine_type const *cv_begin_move(output_engine_type const *engine)
{
  cv_original_engine = engine;
  cv_move_length = 0;
  cv_move_text[0] = 0;
  return &cv_output_engine;
}

/* The pinned English attribute table needs < 256 bytes for any one piece. */
static char *cv_encode_piece(char *next, piece_walk_type walk, Flags flags)
{
  piece_flag_type attribute;
  boolean first = true;
  if (walk==Empty || walk==Invalid) return next;
  if (is_piece_neutral(flags)) *next++ = 'n';
  else *next++ = (TSTFLAG(flags,Black)!=0)!=areColorsSwapped ? 'b' : 'w';
  *next++ = (char)toupper((unsigned char)PieceTab[walk][0]);
  if (PieceTab[walk][1]!=' ' && PieceTab[walk][1]!=0)
    *next++ = (char)toupper((unsigned char)PieceTab[walk][1]);
  for (attribute=Royal; attribute<nr_piece_flags; ++attribute)
    if (TSTFLAG(flags,attribute) && (attribute!=Royal || !is_king(walk)))
    {
      char const *name = PieSpTab[attribute-nr_sides];
      size_t const length = strlen(name);
      *next++ = first ? '~' : ',';
      memcpy(next,name,length);
      next += length;
      first = false;
    }
  return next;
}
static void cv_encode_board(position const *pos, char *board)
{
  char *next = board;
  unsigned int row, col;
  for (row=0; row<8; ++row)
    for (col=0; col<8; ++col)
    {
      unsigned int const rank = isBoardReflected ? row : 7-row;
      square const sq = square_a1 + rank*onerow + col;
      next = cv_encode_piece(next,pos->board[sq],pos->spec[sq]);
      *next++ = ';';
    }
  *next = 0;
}
static int cv_square_index(square sq)
{
  int const col = sq%onerow - nr_files_on_board;
  int const rank = sq/onerow - nr_rows_on_board;
  if (col<0 || col>=8 || rank<0 || rank>=8) return -1;
  return (isBoardReflected ? rank : 7-rank)*8+col;
}
static void cv_effect(char const *kind, Flags flags, piece_walk_type walk, square from, square to, square via)
{
  char piece[512];
  *cv_encode_piece(piece,walk,flags) = 0;
  EM_ASM({ Module['cvEffects'].push({kind:UTF8ToString($0),id:$1,from:$2,to:$3,piece:UTF8ToString($4),via:$5}); },
         kind,GetPieceId(flags),cv_square_index(from),cv_square_index(to),piece,cv_square_index(via));
}
static void cv_end_move(void)
{
  char board[32768], before_board[32768];
  position before = being_solved;
  move_effect_journal_index_type const base = move_effect_journal_base[nbply];
  move_effect_journal_index_type const top = move_effect_journal_base[nbply+1];
  move_effect_journal_index_type const movement = base+move_effect_journal_index_offset_movement;
  move_effect_journal_index_type const capture = base+move_effect_journal_index_offset_capture;
  move_effect_journal_index_type index;
  int from = -1, to = -1, capture_square = -1;
  boolean exact = true;
  EM_ASM({ Module['cvEffects'] = []; });
  for (index=base; index<top; ++index)
  {
    move_effect_journal_entry_type const *effect = &move_effect_journal[index];
    switch (effect->type)
    {
      case move_effect_piece_movement:
        cv_effect("move",effect->u.piece_movement.movingspec,effect->u.piece_movement.moving,
                  effect->u.piece_movement.from,effect->u.piece_movement.to,
                  index==movement && CondFlag[takemake] && move_effect_journal[capture].type==move_effect_piece_removal
                    ? move_effect_journal[capture].u.piece_removal.on : initsquare);
        break;
      case move_effect_piece_removal:
        cv_effect("remove",effect->u.piece_removal.flags,effect->u.piece_removal.walk,effect->u.piece_removal.on,initsquare,initsquare);
        break;
      case move_effect_piece_creation:
      case move_effect_piece_readdition:
        cv_effect("add",effect->u.piece_addition.added.flags,effect->u.piece_addition.added.walk,initsquare,effect->u.piece_addition.added.on,initsquare);
        break;
      case move_effect_piece_exchange:
        cv_effect("move",effect->u.piece_exchange.fromflags,being_solved.board[effect->u.piece_exchange.to],effect->u.piece_exchange.from,effect->u.piece_exchange.to,initsquare);
        cv_effect("move",effect->u.piece_exchange.toflags,being_solved.board[effect->u.piece_exchange.from],effect->u.piece_exchange.to,effect->u.piece_exchange.from,initsquare);
        break;
      default: break;
    }
  }
  /* Reconstruct a copy for playback; never undo or mutate the solver's position. */
  for (index=top; index>base;)
  {
    move_effect_journal_entry_type const *effect = &move_effect_journal[--index];
    switch (effect->type)
    {
      case move_effect_piece_movement:
        before.board[effect->u.piece_movement.to] = Empty;
        before.spec[effect->u.piece_movement.to] = 0;
        before.board[effect->u.piece_movement.from] = effect->u.piece_movement.moving;
        before.spec[effect->u.piece_movement.from] = effect->u.piece_movement.movingspec;
        break;
      case move_effect_piece_removal:
        before.board[effect->u.piece_removal.on] = effect->u.piece_removal.walk;
        before.spec[effect->u.piece_removal.on] = effect->u.piece_removal.flags;
        break;
      case move_effect_piece_creation:
      case move_effect_piece_readdition:
        before.board[effect->u.piece_addition.added.on] = Empty;
        before.spec[effect->u.piece_addition.added.on] = 0;
        break;
      case move_effect_piece_exchange:
      {
        piece_walk_type const walk = before.board[effect->u.piece_exchange.from];
        before.board[effect->u.piece_exchange.from] = before.board[effect->u.piece_exchange.to];
        before.board[effect->u.piece_exchange.to] = walk;
        before.spec[effect->u.piece_exchange.from] = effect->u.piece_exchange.fromflags;
        before.spec[effect->u.piece_exchange.to] = effect->u.piece_exchange.toflags;
        break;
      }
      case move_effect_walk_change:
        before.board[effect->u.piece_walk_change.on] = effect->u.piece_walk_change.from;
        break;
      case move_effect_flags_change:
        before.spec[effect->u.flags_change.on] = effect->u.flags_change.from;
        break;
      case move_effect_side_change:
      case move_effect_board_transformation:
      case move_effect_centre_revolution:
      case move_effect_half_neutral_deneutralisation:
      case move_effect_half_neutral_neutralisation:
        exact = false;
        break;
      default: break;
    }
  }
  if (move_effect_journal[movement].type==move_effect_piece_movement)
  {
    from = cv_square_index(move_effect_journal[movement].u.piece_movement.from);
    to = cv_square_index(move_effect_journal[movement].u.piece_movement.to);
  }
  else if (move_effect_journal[movement].type==move_effect_piece_exchange)
  {
    from = cv_square_index(move_effect_journal[movement].u.piece_exchange.from);
    to = cv_square_index(move_effect_journal[movement].u.piece_exchange.to);
  }
  if (move_effect_journal[capture].type==move_effect_piece_removal)
    capture_square = cv_square_index(move_effect_journal[capture].u.piece_removal.on);
  cv_encode_board(&being_solved,board);
  cv_encode_board(&before,before_board);
  EM_ASM({
    if (Module['onPosition']) Module['onPosition'](UTF8ToString($0),UTF8ToString($1),UTF8ToString($2),Module['cvEffects'],$3,$4,$5,!!$6,!!$7);
    delete Module['cvEffects'];
  },cv_move_text,board,before_board,from,to,capture_square,exact,move_effect_journal[movement].type==move_effect_piece_exchange);
}
