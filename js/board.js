/**
 * ChessBoard class.
 * Note: all referneces to 'row' and 'file' assume a value between 0-7 (vs 1-8 or a-h)
 * TODO: checkmate detection, enpassant capturing!
 */
function ChessBoard() {
	
	this.parseFENRow = function(row, rowString){
	
		var file = 0;
		
		for (var i = 0; i < rowString.length; i++) {
			
			var piece_type = rowString.charAt(i);
			
			if (isNaN(piece_type)) {
				var piece = new ChessPiece(piece_type, row, file, this.piece_id_counter++);
				this.board[row][file] = piece;
				this.pieces[piece.id] = piece;
				
				// track kings
				if (piece.type == 'k') {
					this.kings[piece.colour] = piece;
				}
				
				file++;
			} else {
				file += parseInt(piece_type);
			}
		}
		
		if (file != 8) {
			throw 'Invalid number of files specified in FEN on row ' + row + ': ' + rowString;
		}
	};
	
	this.init();
}

ChessBoard.prototype.init = function() {
	
	this.board = [];
	this.pieces = [];
	this.piece_id_counter = 0;
	this.kings = {};
	this.setPieceCallback = null;
	
	this.loadFEN(START_FEN);
};

/**
 * Initialize this object with a callback which will be invoked when a particular 
 * piece is moved.
 * 
 * callback function signature: function(ChessPiece piece) : void
 * @param function callback
 * @return
 */
ChessBoard.prototype.setPieceCallbackFunction = function(callback) {
	this.setPieceCallback = callback;
};

/**
 * Load a FEN string into the chessboard
 * @param string fen
 * @return
 */
ChessBoard.prototype.loadFEN = function(fen) {
	
	this.piece_id_counter = 0;
	
	var fenParts = fen.split(' ');
	if (fenParts.length != 6) {
		throw 'Incorrectly formatted FEN string';
	}
	
	for (var row = 0; row < 8; row++) {
		this.board[row] = [];
		for (var file = 0; file < 8; file++) {
			this.board[row][file] = false;
		}
	}
	
	// set board
	var boardRows = fenParts[0].split('/');
	if (boardRows.length != 8) {
		throw 'Incorrectly formatted FEN string - (board rows)';
	}
	
	// FEN begins with black rows (row 8) 
	boardRows.reverse();
	
	var row = boardRows.length;
	while (row--) {
		this.parseFENRow(row, boardRows[row]);
	}
	
	// validate and set active colour
	fenParts[1] = fenParts[1].toLowerCase();
	if (fenParts[1] != 'w' && fenParts[1] != 'b') {
		throw 'Invalid active colour: ' + fenParts[1];
	}
	this.activecolour = fenParts[1];
	
	// validate and set castling
	if (fenParts[2].length > 4) {
		throw 'Invalid castling : ' + fenParts[2];
	}
	
	this.castling = {'K':false,'Q':false,'k':false,'q':false};
	if (fenParts[2] != '-') {
		
		for (var i = 0; i < fenParts[2].length; i++) {
			var curr = fenParts[2].charAt(i);
			if (typeof(this.castling[curr]) != 'undefined') {
				this.castling[curr] = true;
			}
		}
	}
	
	// validate and set en passant
	if (fenParts[3] == '-') {
		this.enpassant = '-';
	} else if (this.validTextCoordinate(fenParts[3])) {
		this.enpassant = fenParts[3];
	} else {
		throw 'Invalid en passant coordinate ' + fenParts[3];
	}
	
	// validate half moves
	if (isNaN(fenParts[4])) {
		throw 'Invalid half moves clock: ' + fenParts[4];
	}
	this.halfmoves = parseInt(fenParts[4]);
	
	// validate full moves
	if (isNaN(fenParts[5])) {
		throw 'Invalid full moves clock: ' + fenParts[5];
	}
	this.fullmoves = parseInt(fenParts[5]);
};

/**
 * Returns true if the parameter is a valid text coordinate (eg. e2)
 * @param string coordinate
 * @return
 */
ChessBoard.prototype.validTextCoordinate = function(coordinate) {
	if (typeof(coordinate) != 'string' || coordinate.length != 2) {
		return false;
	}
	
	var row = coordinate.charAt(1);
	if (isNaN(row)) {
		return false;
	}
	
	row = ROWS.indexOf(parseInt(row));
	if (row == -1) {
		return false;
	}
	
	var file = FILES.indexOf(coordinate.charAt(0));
	if (file == -1) {
		return false;
	}
	
	return this.validCoordinate(row, file);
};

/**
 * 
 * @param row
 * @param file
 * @return
 */
ChessBoard.prototype.validCoordinate = function(row, file) {
	
	if (row > 7 || row < 0 || file > 7 || file < 0) {
		return false;
	}
	
	return {'file':file, 'row':row};
};

/**
 * Moves a piece
 * @param string from the text coordinate of the piece (eg. d3)
 * @param string to the text coordinate of the pieces destination
 * @return
 */
ChessBoard.prototype.doMove = function(from, to) {
	
	var f = this.validTextCoordinate(from);
	var t = this.validTextCoordinate(to);
	
	if (!f || !t) {
		throw 'Invalid moves from: ' + from + ' to: ' + to;
	}
	
	var piece = this.getPiece(f.row, f.file);
	if (!piece) {
		throw 'No piece at ' + from;
	}
	
	if (piece.colour != this.activecolour) {
		throw 'Not ' + piece.colour + "'s turn";
	}
	
	var validMoves = piece.validMoves(this);
	var isValid = false;
	var targetPiece = this.getPiece(t.row, t.file);
	
	for (var i = 0; i < validMoves.length; i++) {
		var coord = validMoves[i];
		if (t.row == coord[0] && t.file == coord[1]) {
			
			// special rules for pawns
			if (piece.type == 'p' && coord[2]) {
				var attackOnly = coord[2] == 'a';
				var moveOnly = coord[2] == 'm';
				if ((attackOnly && !targetPiece) || (moveOnly && targetPiece)) {
					break;
				}
			}
			
			isValid = true;
			break;
		}
	}
	
	if (!isValid) {
		throw 'Invalid move';
	}
	
	// move the piece now that we know its a valid move
	this.setPiece(piece, t.row, t.file);
	
	// check to see if the opposite colour's king is under attack
	var king = this.kings[piece.colour == 'w' ? 'b' : 'w'];
	var checkingPiece = this.pieceIsAttacked(king);
	if (checkingPiece) {
		alert('Check from ' + checkingPiece.piece);
		
		// TODO: found check -- now search for checkmate!
	}
	
	// increment move count after black moves
	if (this.activecolour == 'b') {
		this.fullmoves++;
	}
	
	// switch colours
	this.activecolour = this.activecolour == 'w' ? 'b' : 'w';

	// increment half move count if no capture / no pawn advance
	if (!targetPiece && piece.type != 'p') {
		this.halfmoves++;
	}
	
	// check castling
	if (piece.type == 'r') {
		var castle = false;
		if (piece.file == 'h') {
			castle = piece.colour == 'w' ? 'K' : 'k'; 
		} else if (piece.file == 'a') {
			castle = piece.colour == 'b' ? 'Q' : 'q';
		}
		
		if (castle) {
			this.castling[castle] = false;
		}
	} else if (piece.type == 'k') {
		if (piece.colour == 'w') {
			this.castling['Q'] = false;
			this.castling['K'] = false;
		} else {
			this.castling['q'] = false;
			this.castling['k'] = false;
		}
	}
	
	return {'captured':targetPiece,'piece':piece};
};

/**
 * Get the FEN of this board
 * @return string
 */
ChessBoard.prototype.getFEN = function() {
	
	var fen = '';
	var row = this.board.length;
	while (row--) {
		var spaces = 0;
		for (var file = 0; file < this.board[row].length; file++) {
			var piece = this.board[row][file];
			if (piece) {
				if (spaces > 0) {
					fen += spaces;
					spaces = 0;
				}
				fen += piece.piece;
			} else {
				spaces++;
			}
		}
		if (spaces > 0) {
			fen += spaces;
		}
		
		if (row > 0) fen += '/';
	}
	
	fen += ' ' + this.activecolour;
	
	var castling = '';
	for (var k in this.castling) {
		if (this.castling[k]) {
			castling += k;
		}
	}
	if (castling.length == 0) {
		castling = '-';
	}
	
	fen += ' ' + castling + ' ' + this.enpassant + ' ' + this.halfmoves + ' ' + this.fullmoves;
	
	return fen;
};

/**
 * Indicates whether a piece is being attacked by anything
 * @param ChessPiece piece
 * @return null if no piece is attacking, a ChessPiece object of the first piece found to be attacking otherwise
 */
ChessBoard.prototype.pieceIsAttacked = function(piece) {
	return this.squareIsAttacked(piece.row, piece.file, piece.colour == 'w' ? 'b' : 'w');
};

/**
 * Indicates whether a coordinate is being attacked by
 * @param integer row the row of the square
 * @param integer file the file of the square
 * @param string colour the colour of the attacker
 * @return null if no piece is attacking, a ChessPiece object of the first piece found to be attacking otherwise
 */
ChessBoard.prototype.squareIsAttacked = function(row, file, colour) {

	// check pawn attacks
	var direction = colour == 'w' ? 1 : -1;
	var squares = [[row - direction, file + 1], [row - direction, file - 1]];
	var i = squares.length;
	var piece = null;
	while (i--) {
		piece = this.getPieceSafe(squares[i][0], squares[i][1]);
		if (piece && piece.colour == colour && piece.type == 'p') {
			return piece;
		}
	}
	
	// check for knight attacks
	i = KNIGHT_MOVES.length;
	while (i--) {
		piece = this.getPieceSafe(row + KNIGHT_MOVES[i][0], file + KNIGHT_MOVES[i][1]);
		if (piece && piece.colour == colour && piece.type == 'n') {
			return piece;
		}
	}
	
	// check for bishop / queen attacks
	i = BISHOP_DIRECTIONS.length;
	while (i--) {
		piece = this.getPieceInDirection(row, file, BISHOP_DIRECTIONS[i]);
		if (piece && piece.colour == colour && (piece.type == 'q' || piece.type == 'b')) {
			return piece;
		}
	}
	
	// check for rook / queen attacks
	i = ROOK_DIRECTIONS.length;
	while (i--) {
		piece = this.getPieceInDirection(row, file, ROOK_DIRECTIONS[i]);
		if (piece && piece.colour == colour && (piece.type == 'q' || piece.type == 'r')) {
			return piece;
		}
	}
	
	return false;
};

/**
 * Searches a direction starting at some coordinates and returns the first piece it finds
 * @param integer row the originating row
 * @param integer file the originating file
 * @param array direction an array containing the direction in which to move (ie. [1,1] moves up a row and right a file - from white's perspective)
 * @return
 */
ChessBoard.prototype.getPieceInDirection = function(row, file, direction) {
	
	var distance = 0;
	var piece = null;
	
	while (++distance <= 8) {
		piece = this.getPieceSafe(row + direction[0] * distance, file + direction[1] * distance);
		if (piece) {
			return piece;
		}
	}
	
	return piece;
};

/**
 * Sets a piece on a board and returns a piece if one was captured
 * @param ChessPiece piece the piece to set
 * @param integer row the destination row
 * @param integer file the destination file
 * @param boolean [optional] do_callback if false will NOT execute the 'setPiece' callback
 * @return if a piece was captured returns the corresponding ChessPiece object, false if otherwise
 */
ChessBoard.prototype.setPiece = function(piece, row, file, do_callback) {
	
	var old = this.board[row][file];
	
	this.board[row][file] = piece;
	
	if (piece) {
		
		// clear this pieces old position
		if (piece.row !== false && piece.file !== false) {
			this.board[piece.row][piece.file] = false;
		}
		
		// update its coordinates
		piece.row = row;
		piece.file = file;
		this.pieces[piece.id] = piece;
	}
	
	// if a piece existed at these coords, clear them out
	if (old) {
		old.row = false;
		old.file = false;
		this.pieces[old.id] = false;
	}
	
	if (typeof(this.setPieceCallback) == 'function' && (typeof(do_callback) == 'undefined' || do_callback)) {
		if (piece) this.setPieceCallback(piece);
		if (old) this.setPieceCallback(old);
	}
	
	return old;
};

/**
 * Returns the piece at these coordinates, throws exception if the coordinates are invalid
 * @param integer row
 * @param integer file
 * @return ChessPiece
 */
ChessBoard.prototype.getPiece = function(row, file) {
	if (!this.validCoordinate(row, file)) {
		throw 'Invalid coordinates ' + file + row;
	}
	
	return this.board[row][file];
};

/**
 * Returns the piece at these coordinates.
 * @param integer row
 * @param integer file
 * @return ChessPiece if a piece exists at the coordinates, false otherwise
 */
ChessBoard.prototype.getPieceSafe = function(row, file) {
	return this.board[row] ? this.board[row][file] : false;
};
